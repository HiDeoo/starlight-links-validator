import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should validate links when the `srcDir` Astro option is set', async () => {
  expect.assertions(2)

  try {
    await loadFixture('src-dir', 'content')
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
