import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links with custom IDs', async () => {
  const { output, status } = await buildFixture('custom-ids')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 1, 1)

  expectValidationErrors(output, 'test/', [['#heading-with-custom-id', ValidationErrorType.InvalidHash]])
})
