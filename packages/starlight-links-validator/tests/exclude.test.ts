import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('ignores links that are excluded from validation', async () => {
  const { output, status } = await buildFixture('exclude')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 7, 1)

  expectValidationErrors(output, 'test/', [
    ['/excluded/', ValidationErrorType.InvalidLink, [16]],
    ['/excluded/?something', ValidationErrorType.InvalidLink, [17]],
    ['/excluded#test', ValidationErrorType.InvalidLink, [18]],
    ['/test/excluded', ValidationErrorType.InvalidLink, [19]],
    ['/test/excluded/test', ValidationErrorType.InvalidLink, [20]],
    ['/api/getting-started', ValidationErrorType.InvalidLink, [28]],
    ['/api/class/baz', ValidationErrorType.InvalidLink, [29]],
  ])
})

test('ignores links that are excluded from validation using a function', async () => {
  const { output, status } = await buildFixture('exclude-fn')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 5, 1)

  expectValidationErrors(output, 'test/', [
    ['/excluded/', ValidationErrorType.InvalidLink, [16]],
    ['/excluded/?something', ValidationErrorType.InvalidLink, [17]],
    ['/excluded#test', ValidationErrorType.InvalidLink, [18]],
    ['/test/excluded', ValidationErrorType.InvalidLink, [19]],
    ['/test/excluded/test', ValidationErrorType.InvalidLink, [20]],
  ])
})
