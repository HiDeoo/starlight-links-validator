import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links when the `trailingSlash` Astro option is set to `never`', async () => {
  const { output, status } = await buildFixture('trailing-never')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 6, 1)

  expectValidationErrors(output, 'test/', [
    ['/guides/example/', ValidationErrorType.TrailingSlashForbidden],
    ['/guides/example/#description', ValidationErrorType.TrailingSlashForbidden],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
  ])
})

test('validates links when the `trailingSlash` Astro option is set to `always`', async () => {
  const { output, status } = await buildFixture('trailing-always')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 6, 1)

  expectValidationErrors(output, 'test/', [
    ['/guides/example', ValidationErrorType.TrailingSlashMissing],
    ['/guides/example#description', ValidationErrorType.TrailingSlashMissing],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash],
  ])
})
