import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with ignored fallback links', async () => {
  const { output, status } = await buildFixture('fallback-prevent-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 4, 1)

  expectValidationErrors(output, 'fr/', [
    ['/fr/guides/example', ValidationErrorType.InvalidLink, [12, 3]],
    ['/fr/guides/example/', ValidationErrorType.InvalidLink, [13, 3]],
    ['/fr/guides/example#description', ValidationErrorType.InvalidLink, [15, 3]],
    ['/fr/guides/example/#description', ValidationErrorType.InvalidLink, [16, 3]],
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
    ['/en/guides/unknown', ValidationErrorType.InvalidLink, [9, 3]],
    ['/en/guides/unknown/', ValidationErrorType.InvalidLink, [10, 3]],
    ['/en/guides/example#unknown', ValidationErrorType.InvalidHash, [12, 3]],
    ['/en/guides/example/#unknown', ValidationErrorType.InvalidHash, [13, 3]],
    ['/es/guides/example', ValidationErrorType.InvalidLink, [15, 3]],
    ['/es/guides/example/', ValidationErrorType.InvalidLink, [16, 3]],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/fr/guides/unknown', ValidationErrorType.InvalidLink, [8, 3]],
    ['/fr/guides/unknown/', ValidationErrorType.InvalidLink, [9, 3]],
    ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash, [11, 3]],
    ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash, [12, 3]],
  ])

  expectValidationErrors(output, 'fr/guides/test/', [['/', ValidationErrorType.InvalidLink, [5, 3]]])
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
    ['/guides/unknown', ValidationErrorType.InvalidLink, [9, 3]],
    ['/guides/unknown/', ValidationErrorType.InvalidLink, [10, 3]],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash, [12, 3]],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash, [13, 3]],
    ['/es/guides/example', ValidationErrorType.InvalidLink, [15, 3]],
    ['/es/guides/example/', ValidationErrorType.InvalidLink, [16, 3]],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/fr/guides/unknown', ValidationErrorType.InvalidLink, [8, 3]],
    ['/fr/guides/unknown/', ValidationErrorType.InvalidLink, [9, 3]],
    ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash, [11, 3]],
    ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash, [12, 3]],
  ])

  expectValidationErrors(output, 'guides/test/', [['/en', ValidationErrorType.InvalidLink, [5, 3]]])
})
