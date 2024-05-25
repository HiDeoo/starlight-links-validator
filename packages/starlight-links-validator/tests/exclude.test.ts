import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should ignore links that are excluded from validation', async () => {
  expect.assertions(2)

  try {
    await loadFixture('exclude')
  } catch (error) {
    expectValidationErrorCount(error, 6, 1)

    expectValidationErrors(error, '/', [
      ['/excluded/', ValidationErrorType.InvalidLink],
      ['/excluded#test', ValidationErrorType.InvalidLink],
      ['/test/excluded', ValidationErrorType.InvalidLink],
      ['/test/excluded/test', ValidationErrorType.InvalidLink],
      ['/api/getting-started', ValidationErrorType.InvalidLink],
      ['/api/class/baz', ValidationErrorType.InvalidLink],
    ])
  }
})
