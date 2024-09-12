import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should not build with ignored fallback links', async () => {
  expect.assertions(2)

  try {
    await loadFixture('fallback-prevent-links')
  } catch (error) {
    expectValidationErrorCount(error, 4, 1)

    expectValidationErrors(error, 'fr/', [
      ['/fr/guides/example', ValidationErrorType.InvalidLink],
      ['/fr/guides/example/', ValidationErrorType.InvalidLink],
      ['/fr/guides/example#description', ValidationErrorType.InvalidLink],
      ['/fr/guides/example/#description', ValidationErrorType.InvalidLink],
    ])
  }
})

test('should build with valid fallback links', async () => {
  await expect(loadFixture('fallback-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid fallback links', async () => {
  expect.assertions(4)

  try {
    await loadFixture('fallback-invalid-links')
  } catch (error) {
    expectValidationErrorCount(error, 11, 3)

    expectValidationErrors(error, 'en/', [
      ['/en/guides/unknown', ValidationErrorType.InvalidLink],
      ['/en/guides/unknown/', ValidationErrorType.InvalidLink],
      ['/en/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/en/guides/example/#unknown', ValidationErrorType.InvalidHash],
      ['/es/guides/example', ValidationErrorType.InvalidLink],
      ['/es/guides/example/', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'fr/', [
      ['/fr/guides/unknown', ValidationErrorType.InvalidLink],
      ['/fr/guides/unknown/', ValidationErrorType.InvalidLink],
      ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ])

    expectValidationErrors(error, 'fr/guides/test/', [['/', ValidationErrorType.InvalidLink]])
  }
})

test('should build with a root locale and valid fallback links', async () => {
  await expect(loadFixture('fallback-root-valid-links')).resolves.not.toThrow()
})

test('should not build with a root locale and invalid fallback links', async () => {
  expect.assertions(4)

  try {
    await loadFixture('fallback-root-invalid-links')
  } catch (error) {
    expectValidationErrorCount(error, 11, 3)

    expectValidationErrors(error, '/', [
      ['/guides/unknown', ValidationErrorType.InvalidLink],
      ['/guides/unknown/', ValidationErrorType.InvalidLink],
      ['/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
      ['/es/guides/example', ValidationErrorType.InvalidLink],
      ['/es/guides/example/', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'fr/', [
      ['/fr/guides/unknown', ValidationErrorType.InvalidLink],
      ['/fr/guides/unknown/', ValidationErrorType.InvalidLink],
      ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ])

    expectValidationErrors(error, 'guides/test/', [['/en', ValidationErrorType.InvalidLink]])
  }
})
