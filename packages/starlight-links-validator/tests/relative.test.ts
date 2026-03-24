import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('ignores relative links when the `errorOnRelativeLinks` option is set to `false`', async () => {
  const { output, status } = await buildFixture('relative-ignore')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 5, 2)

  expectValidationErrors(output, 'test/', [
    ['/unknown', ValidationErrorType.InvalidLink, [15]],
    ['/unknown/', ValidationErrorType.InvalidLink, [16]],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash, [18]],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash, [19]],
  ])

  expectValidationErrors(output, 'transform/', [['/unknown', ValidationErrorType.InvalidLink, [8]]])
})
