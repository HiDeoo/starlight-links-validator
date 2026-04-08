import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('builds with invalid links when `failOnError` is `false`', async () => {
  const { output, status } = await buildFixture('fail-on-error')

  expect(status).toBe('success')

  expectValidationErrorCount(output, 1, 1)

  expectValidationErrors(output, 'test.md', [['/unknown/', ValidationErrorType.InvalidLink, 5]])
})
