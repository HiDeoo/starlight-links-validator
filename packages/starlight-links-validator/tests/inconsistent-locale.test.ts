import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with inconsistent locale links when enabled ', async () => {
  const { output, status } = await buildFixture('inconsistent-locale')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 20, 4)

  expectValidationErrors(output, 'en/', [
    ['/fr/guides/example', ValidationErrorType.InconsistentLocale, [15]],
    ['/fr/guides/example/', ValidationErrorType.InconsistentLocale, [16]],
    ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale, [18]],
    ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale, [19]],
    ['/guides/example', ValidationErrorType.InvalidLink, [21]],
    ['/guides/example/', ValidationErrorType.InvalidLink, [22]],
    ['/guides/example#description', ValidationErrorType.InvalidLink, [24]],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, [25]],
  ])

  expectValidationErrors(output, 'en/guides/example/', [
    ['/fr', ValidationErrorType.InconsistentLocale, [10]],
    ['/', ValidationErrorType.InvalidLink, [11]],
  ])

  expectValidationErrors(output, 'fr/', [
    ['/en/guides/example', ValidationErrorType.InconsistentLocale, [13]],
    ['/en/guides/example/', ValidationErrorType.InconsistentLocale, [14]],
    ['/en/guides/example#description', ValidationErrorType.InconsistentLocale, [16]],
    ['/en/guides/example/#description', ValidationErrorType.InconsistentLocale, [17]],
    ['/guides/example', ValidationErrorType.InvalidLink, [19]],
    ['/guides/example/', ValidationErrorType.InvalidLink, [20]],
    ['/guides/example#description', ValidationErrorType.InvalidLink, [22]],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, [23]],
  ])

  expectValidationErrors(output, 'fr/guides/example/', [
    ['/en', ValidationErrorType.InconsistentLocale, [10]],
    ['/', ValidationErrorType.InvalidLink, [11]],
  ])
})

test('does not build with a root locale and inconsistent locale links when enabled ', async () => {
  const { output, status } = await buildFixture('inconsistent-locale-root')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 15, 4)

  expectValidationErrors(output, '/', [
    ['/fr/guides/example', ValidationErrorType.InconsistentLocale, [15]],
    ['/fr/guides/example/', ValidationErrorType.InconsistentLocale, [16]],
    ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale, [18]],
    ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale, [19]],
  ])

  expectValidationErrors(output, 'guides/example/', [['/fr', ValidationErrorType.InconsistentLocale, [10]]])

  expectValidationErrors(output, 'fr/', [
    ['/es/guides/example', ValidationErrorType.InconsistentLocale, [13]],
    ['/es/guides/example/', ValidationErrorType.InconsistentLocale, [14]],
    ['/es/guides/example#description', ValidationErrorType.InconsistentLocale, [16]],
    ['/es/guides/example/#description', ValidationErrorType.InconsistentLocale, [17]],
    ['/guides/example', ValidationErrorType.InconsistentLocale, [19]],
    ['/guides/example/', ValidationErrorType.InconsistentLocale, [20]],
    ['/guides/example#description', ValidationErrorType.InconsistentLocale, [22]],
    ['/guides/example/#description', ValidationErrorType.InconsistentLocale, [23]],
  ])

  expectValidationErrors(output, 'fr/guides/example/', [
    ['/es', ValidationErrorType.InconsistentLocale, [10]],
    ['/', ValidationErrorType.InconsistentLocale, [11]],
  ])
})
