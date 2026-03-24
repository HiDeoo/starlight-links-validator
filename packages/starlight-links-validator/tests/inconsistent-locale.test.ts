import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with inconsistent locale links when enabled ', async () => {
  const { output, status } = await buildFixture('inconsistent-locale')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 20, 4)

  expectValidationErrors(output, 'en/', [
    ['/fr/guides/example', ValidationErrorType.InconsistentLocale, [15, 3]],
    ['/fr/guides/example/', ValidationErrorType.InconsistentLocale, [16, 3]],
    ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale, [18, 3]],
    ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale, [19, 3]],
    ['/guides/example', ValidationErrorType.InvalidLink, [21, 3]],
    ['/guides/example/', ValidationErrorType.InvalidLink, [22, 3]],
    ['/guides/example#description', ValidationErrorType.InvalidLink, [24, 3]],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, [25, 3]],
  ])

  expectValidationErrors(output, 'en/guides/example/', [
    ['/fr', ValidationErrorType.InconsistentLocale, [10, 3]],
    ['/', ValidationErrorType.InvalidLink, [11, 3]],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/en/guides/example', ValidationErrorType.InconsistentLocale, [13, 3]],
    ['/en/guides/example/', ValidationErrorType.InconsistentLocale, [14, 3]],
    ['/en/guides/example#description', ValidationErrorType.InconsistentLocale, [16, 3]],
    ['/en/guides/example/#description', ValidationErrorType.InconsistentLocale, [17, 3]],
    ['/guides/example', ValidationErrorType.InvalidLink, [19, 3]],
    ['/guides/example/', ValidationErrorType.InvalidLink, [20, 3]],
    ['/guides/example#description', ValidationErrorType.InvalidLink, [22, 3]],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, [23, 3]],
  ])

  expectValidationErrors(output, 'fr/guides/example/', [
    ['/en', ValidationErrorType.InconsistentLocale, [10, 3]],
    ['/', ValidationErrorType.InvalidLink, [11, 3]],
  ])
})

test('does not build with a root locale and inconsistent locale links when enabled ', async () => {
  const { output, status } = await buildFixture('inconsistent-locale-root')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 15, 4)

  expectValidationErrors(output, '/', [
    ['/fr/guides/example', ValidationErrorType.InconsistentLocale, [15, 3]],
    ['/fr/guides/example/', ValidationErrorType.InconsistentLocale, [16, 3]],
    ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale, [18, 3]],
    ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale, [19, 3]],
  ])

  expectValidationErrors(output, 'guides/example/', [['/fr', ValidationErrorType.InconsistentLocale, [10, 3]]])

  expectValidationErrors(output, 'fr/', [
    ['/es/guides/example', ValidationErrorType.InconsistentLocale, [13, 3]],
    ['/es/guides/example/', ValidationErrorType.InconsistentLocale, [14, 3]],
    ['/es/guides/example#description', ValidationErrorType.InconsistentLocale, [16, 3]],
    ['/es/guides/example/#description', ValidationErrorType.InconsistentLocale, [17, 3]],
    ['/guides/example', ValidationErrorType.InconsistentLocale, [19, 3]],
    ['/guides/example/', ValidationErrorType.InconsistentLocale, [20, 3]],
    ['/guides/example#description', ValidationErrorType.InconsistentLocale, [22, 3]],
    ['/guides/example/#description', ValidationErrorType.InconsistentLocale, [23, 3]],
  ])

  expectValidationErrors(output, 'fr/guides/example/', [
    ['/es', ValidationErrorType.InconsistentLocale, [10, 3]],
    ['/', ValidationErrorType.InconsistentLocale, [11, 3]],
  ])
})
