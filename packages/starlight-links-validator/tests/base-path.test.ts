import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should validate links when the `base` Astro option is set', async () => {
  expect.assertions(2)

  try {
    await loadFixture('base-path')
  } catch (error) {
    expectValidationErrorCount(error, 10, 1)

    expectValidationErrors(error, 'test/test/', [
      ['/guides/example', ValidationErrorType.InvalidLink],
      ['/guides/example/', ValidationErrorType.InvalidLink],
      ['/guides/example#description', ValidationErrorType.InvalidLink],
      ['/guides/example/#description', ValidationErrorType.InvalidLink],
      ['/unknown', ValidationErrorType.InvalidLink],
      ['/unknown/', ValidationErrorType.InvalidLink],
      ['/test/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/test/guides/example/#unknown', ValidationErrorType.InvalidHash],
      ['/favicon.svg', ValidationErrorType.InvalidLink],
      ['/guidelines/dummy.pdf', ValidationErrorType.InvalidLink],
    ])
  }
})
