import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('ignores relative links when the `errorOnRelativeLinks` option is set to `false`', async () => {
  const { output, status } = await buildFixture('relative-ignore')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 5, 2)

  expectValidationErrors(output, 'test/', [
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
  ])

  expectValidationErrors(output, 'transform/', [['/unknown', ValidationErrorType.InvalidLink]])
})
