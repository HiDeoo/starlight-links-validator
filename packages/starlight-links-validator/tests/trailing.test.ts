import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links when the `trailingSlash` Astro option is set to `never`', async () => {
  const { output, status } = await buildFixture('trailing-never')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 12, 1)

  expectValidationErrors(output, 'test/', [
    ['/guides/example/', ValidationErrorType.TrailingSlashForbidden, [12, 3]],
    ['/guides/example/#description', ValidationErrorType.TrailingSlashForbidden, [15, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [17, 3]],
    ['/unknown/', ValidationErrorType.InvalidLink, [18, 3]],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash, [20, 3]],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash, [21, 3]],
    ['/test/?query=string', ValidationErrorType.TrailingSlashForbidden, [28, 3]],
    ['/test/?query=string#some-links', ValidationErrorType.TrailingSlashForbidden, [31, 3]],
    ['/unknown?query=string', ValidationErrorType.InvalidLink, [33, 3]],
    ['/unknown/?query=string', ValidationErrorType.InvalidLink, [34, 3]],
    ['/unknown?query=string#title', ValidationErrorType.InvalidLink, [36, 3]],
    ['/unknown/?query=string#title', ValidationErrorType.InvalidLink, [37, 3]],
  ])
})

test('validates links when the `trailingSlash` Astro option is set to `always`', async () => {
  const { output, status } = await buildFixture('trailing-always')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 12, 1)

  expectValidationErrors(output, 'test/', [
    ['/guides/example', ValidationErrorType.TrailingSlashMissing, [11, 3]],
    ['/guides/example#description', ValidationErrorType.TrailingSlashMissing, [14, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [17, 3]],
    ['/unknown/', ValidationErrorType.InvalidLink, [18, 3]],
    ['/guides/example#unknown', ValidationErrorType.InvalidHash, [20, 3]],
    ['/guides/example/#unknown', ValidationErrorType.InvalidHash, [21, 3]],
    ['/test?query=string', ValidationErrorType.TrailingSlashMissing, [27, 3]],
    ['/test?query=string#some-links', ValidationErrorType.TrailingSlashMissing, [30, 3]],
    ['/unknown?query=string', ValidationErrorType.InvalidLink, [33, 3]],
    ['/unknown/?query=string', ValidationErrorType.InvalidLink, [34, 3]],
    ['/unknown?query=string#title', ValidationErrorType.InvalidLink, [36, 3]],
    ['/unknown/?query=string#title', ValidationErrorType.InvalidLink, [37, 3]],
  ])
})
