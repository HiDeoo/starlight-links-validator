import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should validate links with custom IDs', async () => {
  expect.assertions(2)

  try {
    await loadFixture('custom-ids')
  } catch (error) {
    expectValidationErrorCount(error, 1, 1)

    expectValidationErrors(error, 'test/', [['#heading-with-custom-id', ValidationErrorType.InvalidHash]])
  }
})
