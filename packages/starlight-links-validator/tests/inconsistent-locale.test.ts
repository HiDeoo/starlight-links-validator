import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with inconsistent locale links when enabled ', async () => {
  const { output, status } = await buildFixture('inconsistent-locale')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 20, 4)

  expectValidationErrors(output, 'en/', [
    ['/fr/guides/example', ValidationErrorType.InconsistentLocale],
    ['/fr/guides/example/', ValidationErrorType.InconsistentLocale],
    ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale],
    ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale],
    ['/guides/example', ValidationErrorType.InvalidLink],
    ['/guides/example/', ValidationErrorType.InvalidLink],
    ['/guides/example#description', ValidationErrorType.InvalidLink],
    ['/guides/example/#description', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'en/guides/example/', [
    ['/fr', ValidationErrorType.InconsistentLocale],
    ['/', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/en/guides/example', ValidationErrorType.InconsistentLocale],
    ['/en/guides/example/', ValidationErrorType.InconsistentLocale],
    ['/en/guides/example#description', ValidationErrorType.InconsistentLocale],
    ['/en/guides/example/#description', ValidationErrorType.InconsistentLocale],
    ['/guides/example', ValidationErrorType.InvalidLink],
    ['/guides/example/', ValidationErrorType.InvalidLink],
    ['/guides/example#description', ValidationErrorType.InvalidLink],
    ['/guides/example/#description', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'fr/guides/example/', [
    ['/en', ValidationErrorType.InconsistentLocale],
    ['/', ValidationErrorType.InvalidLink],
  ])
})

test('does not build with a root locale and inconsistent locale links when enabled ', async () => {
  const { output, status } = await buildFixture('inconsistent-locale-root')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 15, 4)

  expectValidationErrors(output, '/', [
    ['/fr/guides/example', ValidationErrorType.InconsistentLocale],
    ['/fr/guides/example/', ValidationErrorType.InconsistentLocale],
    ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale],
    ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale],
  ])

  expectValidationErrors(output, 'guides/example/', [['/fr', ValidationErrorType.InconsistentLocale]])

  expectValidationErrors(output, 'fr/', [
    ['/es/guides/example', ValidationErrorType.InconsistentLocale],
    ['/es/guides/example/', ValidationErrorType.InconsistentLocale],
    ['/es/guides/example#description', ValidationErrorType.InconsistentLocale],
    ['/es/guides/example/#description', ValidationErrorType.InconsistentLocale],
    ['/guides/example', ValidationErrorType.InconsistentLocale],
    ['/guides/example/', ValidationErrorType.InconsistentLocale],
    ['/guides/example#description', ValidationErrorType.InconsistentLocale],
    ['/guides/example/#description', ValidationErrorType.InconsistentLocale],
  ])

  expectValidationErrors(output, 'fr/guides/example/', [
    ['/es', ValidationErrorType.InconsistentLocale],
    ['/', ValidationErrorType.InconsistentLocale],
  ])
})
