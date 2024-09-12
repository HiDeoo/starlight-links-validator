import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should validate links when the `trailingSlash` Astro option is set to `never`', async () => {
  expect.assertions(2)

  try {
    await loadFixture('trailing-never')
  } catch (error) {
    expectValidationErrorCount(error, 6, 1)

    expectValidationErrors(error, 'test/', [
      ['/guides/example/', ValidationErrorType.TrailingSlash],
      ['/guides/example/#description', ValidationErrorType.TrailingSlash],
      ['/unknown', ValidationErrorType.InvalidLink],
      ['/unknown/', ValidationErrorType.InvalidLink],
      ['/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ])
  }
})

test('should validate links when the `trailingSlash` Astro option is set to `always`', async () => {
  expect.assertions(2)

  try {
    await loadFixture('trailing-always')
  } catch (error) {
    expectValidationErrorCount(error, 6, 1)

    expectValidationErrors(error, 'test/', [
      ['/guides/example', ValidationErrorType.TrailingSlash],
      ['/guides/example#description', ValidationErrorType.TrailingSlash],
      ['/unknown', ValidationErrorType.InvalidLink],
      ['/unknown/', ValidationErrorType.InvalidLink],
      ['/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ])
  }
})
