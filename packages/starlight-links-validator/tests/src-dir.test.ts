import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links when the `srcDir` Astro option is set', async () => {
  const { output, status } = await buildFixture('src-dir')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 4, 1)

  expectValidationErrors(output, 'test/', [
    ['/unknown', ValidationErrorType.InvalidLink, [15]],
    ['/unknown/', ValidationErrorType.InvalidLink, [16]],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash, [18]],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash, [19]],
  ])
})
