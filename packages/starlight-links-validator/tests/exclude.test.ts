import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('ignores links that are excluded from validation', async () => {
  const { output, status } = await buildFixture('exclude')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 7, 1)

  expectValidationErrors(output, 'test/', [
    ['/excluded/', ValidationErrorType.InvalidLink, [16, 3]],
    ['/excluded/?something', ValidationErrorType.InvalidLink, [17, 3]],
    ['/excluded#test', ValidationErrorType.InvalidLink, [18, 3]],
    ['/test/excluded', ValidationErrorType.InvalidLink, [19, 3]],
    ['/test/excluded/test', ValidationErrorType.InvalidLink, [20, 3]],
    ['/api/getting-started', ValidationErrorType.InvalidLink, [28, 3]],
    ['/api/class/baz', ValidationErrorType.InvalidLink, [29, 3]],
  ])
})

test('ignores links that are excluded from validation using a function', async () => {
  const { output, status } = await buildFixture('exclude-fn')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 5, 1)

  expectValidationErrors(output, 'test/', [
    ['/excluded/', ValidationErrorType.InvalidLink, [16, 3]],
    ['/excluded/?something', ValidationErrorType.InvalidLink, [17, 3]],
    ['/excluded#test', ValidationErrorType.InvalidLink, [18, 3]],
    ['/test/excluded', ValidationErrorType.InvalidLink, [19, 3]],
    ['/test/excluded/test', ValidationErrorType.InvalidLink, [20, 3]],
  ])
})
