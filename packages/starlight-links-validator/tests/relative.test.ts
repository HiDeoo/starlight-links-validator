import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should ignore relative links when the `errorOnRelativeLinks` option is set to `false`', async () => {
  expect.assertions(2)

  try {
    await loadFixture('relative-ignore')
  } catch (error) {
    expectValidationErrorCount(error, 4, 1)

    expectValidationErrors(error, 'test/', [
      ['/unknown', ValidationErrorType.InvalidLink],
      ['/unknown/', ValidationErrorType.InvalidLink],
      ['/guides/example#unknown', ValidationErrorType.InvalidHash],
      ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ])
  }
})
