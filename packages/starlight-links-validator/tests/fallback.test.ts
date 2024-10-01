import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with ignored fallback links', async () => {
  const { output, status } = await buildFixture('fallback-prevent-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 4, 1)

  expectValidationErrors(output, 'fr/', [
    ['/fr/guides/example', ValidationErrorType.InvalidLink],
    ['/fr/guides/example/', ValidationErrorType.InvalidLink],
    ['/fr/guides/example#description', ValidationErrorType.InvalidLink],
    ['/fr/guides/example/#description', ValidationErrorType.InvalidLink],
  ])
})

test('builds with valid fallback links', async () => {
  const { status } = await buildFixture('fallback-valid-links')

  expect(status).toBe('success')
})

test('does not build with invalid fallback links', async () => {
  const { output, status } = await buildFixture('fallback-invalid-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 11, 3)

  expectValidationErrors(output, 'en/', [
    ['/en/guides/unknown', ValidationErrorType.InvalidLink],
    ['/en/guides/unknown/', ValidationErrorType.InvalidLink],
    ['/en/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/en/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ['/es/guides/example', ValidationErrorType.InvalidLink],
    ['/es/guides/example/', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/fr/guides/unknown', ValidationErrorType.InvalidLink],
    ['/fr/guides/unknown/', ValidationErrorType.InvalidLink],
    ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash],
  ])

  expectValidationErrors(output, 'fr/guides/test/', [['/', ValidationErrorType.InvalidLink]])
})

test('builds with a root locale and valid fallback links', async () => {
  const { status } = await buildFixture('fallback-root-valid-links')

  expect(status).toBe('success')
})

test('does not build with a root locale and invalid fallback links', async () => {
  const { output, status } = await buildFixture('fallback-root-invalid-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 11, 3)

  expectValidationErrors(output, '/', [
    ['/guides/unknown', ValidationErrorType.InvalidLink],
    ['/guides/unknown/', ValidationErrorType.InvalidLink],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ['/es/guides/example', ValidationErrorType.InvalidLink],
    ['/es/guides/example/', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/fr/guides/unknown', ValidationErrorType.InvalidLink],
    ['/fr/guides/unknown/', ValidationErrorType.InvalidLink],
    ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash],
  ])

  expectValidationErrors(output, 'guides/test/', [['/en', ValidationErrorType.InvalidLink]])
})
