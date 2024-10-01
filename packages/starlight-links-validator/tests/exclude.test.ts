import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('ignores links that are excluded from validation', async () => {
  const { output, status } = await buildFixture('exclude')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 6, 1)

  expectValidationErrors(output, '/', [
    ['/excluded/', ValidationErrorType.InvalidLink],
    ['/excluded#test', ValidationErrorType.InvalidLink],
    ['/test/excluded', ValidationErrorType.InvalidLink],
    ['/test/excluded/test', ValidationErrorType.InvalidLink],
    ['/api/getting-started', ValidationErrorType.InvalidLink],
    ['/api/class/baz', ValidationErrorType.InvalidLink],
  ])
})
