import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should not build with inconsistent locale links when enabled ', async () => {
  expect.assertions(5)

  try {
    await loadFixture('inconsistent-locale')
  } catch (error) {
    // TODO(HiDeoo) Remove this once fixed
    console.error('🚨 [inconsistent-locale.test.ts:13] error:', error)

    expectValidationErrorCount(error, 20, 4)

    expectValidationErrors(error, 'en/', [
      ['/fr/guides/example', ValidationErrorType.InconsistentLocale],
      ['/fr/guides/example/', ValidationErrorType.InconsistentLocale],
      ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale],
      ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale],
      ['/guides/example', ValidationErrorType.InvalidLink],
      ['/guides/example/', ValidationErrorType.InvalidLink],
      ['/guides/example#description', ValidationErrorType.InvalidLink],
      ['/guides/example/#description', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'en/guides/example/', [
      ['/fr', ValidationErrorType.InconsistentLocale],
      ['/', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'fr/', [
      ['/en/guides/example', ValidationErrorType.InconsistentLocale],
      ['/en/guides/example/', ValidationErrorType.InconsistentLocale],
      ['/en/guides/example#description', ValidationErrorType.InconsistentLocale],
      ['/en/guides/example/#description', ValidationErrorType.InconsistentLocale],
      ['/guides/example', ValidationErrorType.InvalidLink],
      ['/guides/example/', ValidationErrorType.InvalidLink],
      ['/guides/example#description', ValidationErrorType.InvalidLink],
      ['/guides/example/#description', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'fr/guides/example/', [
      ['/en', ValidationErrorType.InconsistentLocale],
      ['/', ValidationErrorType.InvalidLink],
    ])
  }
})

test('should not build with a root locale and inconsistent locale links when enabled ', async () => {
  expect.assertions(5)

  try {
    await loadFixture('inconsistent-locale-root')
  } catch (error) {
    expectValidationErrorCount(error, 15, 4)

    expectValidationErrors(error, '/', [
      ['/fr/guides/example', ValidationErrorType.InconsistentLocale],
      ['/fr/guides/example/', ValidationErrorType.InconsistentLocale],
      ['/fr/guides/example#description', ValidationErrorType.InconsistentLocale],
      ['/fr/guides/example/#description', ValidationErrorType.InconsistentLocale],
    ])

    expectValidationErrors(error, 'guides/example/', [['/fr', ValidationErrorType.InconsistentLocale]])

    expectValidationErrors(error, 'fr/', [
      ['/es/guides/example', ValidationErrorType.InconsistentLocale],
      ['/es/guides/example/', ValidationErrorType.InconsistentLocale],
      ['/es/guides/example#description', ValidationErrorType.InconsistentLocale],
      ['/es/guides/example/#description', ValidationErrorType.InconsistentLocale],
      ['/guides/example', ValidationErrorType.InconsistentLocale],
      ['/guides/example/', ValidationErrorType.InconsistentLocale],
      ['/guides/example#description', ValidationErrorType.InconsistentLocale],
      ['/guides/example/#description', ValidationErrorType.InconsistentLocale],
    ])

    expectValidationErrors(error, 'fr/guides/example/', [
      ['/es', ValidationErrorType.InconsistentLocale],
      ['/', ValidationErrorType.InconsistentLocale],
    ])
  }
})
