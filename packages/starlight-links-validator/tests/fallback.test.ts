import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with ignored fallback links', async () => {
  const { output, status } = await buildFixture('fallback-prevent-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 4, 1)

  expectValidationErrors(output, 'fr/index.md', [
    ['/fr/guides/example', ValidationErrorType.InvalidLink, 12],
    ['/fr/guides/example/', ValidationErrorType.InvalidLink, 13],
    ['/fr/guides/example#description', ValidationErrorType.InvalidLink, 15],
    ['/fr/guides/example/#description', ValidationErrorType.InvalidLink, 16],
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

  expectValidationErrors(output, 'en/index.md', [
    ['/en/guides/unknown', ValidationErrorType.InvalidLink, 9],
    ['/en/guides/unknown/', ValidationErrorType.InvalidLink, 10],
    ['/en/guides/example#unknown', ValidationErrorType.InvalidHash, 12],
    ['/en/guides/example/#unknown', ValidationErrorType.InvalidHash, 13],
    ['/es/guides/example', ValidationErrorType.InvalidLink, 15],
    ['/es/guides/example/', ValidationErrorType.InvalidLink, 16],
  ])

  expectValidationErrors(output, 'fr/index.md', [
    ['/fr/guides/unknown', ValidationErrorType.InvalidLink, 8],
    ['/fr/guides/unknown/', ValidationErrorType.InvalidLink, 9],
    ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash, 11],
    ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash, 12],
  ])

  expectValidationErrors(output, 'fr/guides/test.md', [['/', ValidationErrorType.InvalidLink, 5]])
})

test('builds with a root locale and valid fallback links', async () => {
  const { status } = await buildFixture('fallback-root-valid-links')

  expect(status).toBe('success')
})

test('does not build with a root locale and invalid fallback links', async () => {
  const { output, status } = await buildFixture('fallback-root-invalid-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 11, 3)

  expectValidationErrors(output, 'index.md', [
    ['/guides/unknown', ValidationErrorType.InvalidLink, 9],
    ['/guides/unknown/', ValidationErrorType.InvalidLink, 10],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash, 12],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash, 13],
    ['/es/guides/example', ValidationErrorType.InvalidLink, 15],
    ['/es/guides/example/', ValidationErrorType.InvalidLink, 16],
  ])

  expectValidationErrors(output, 'fr/index.md', [
    ['/fr/guides/unknown', ValidationErrorType.InvalidLink, 8],
    ['/fr/guides/unknown/', ValidationErrorType.InvalidLink, 9],
    ['/fr/guides/example#unknown', ValidationErrorType.InvalidHash, 11],
    ['/fr/guides/example/#unknown', ValidationErrorType.InvalidHash, 12],
  ])

  expectValidationErrors(output, 'guides/test.md', [['/en', ValidationErrorType.InvalidLink, 5]])
})
