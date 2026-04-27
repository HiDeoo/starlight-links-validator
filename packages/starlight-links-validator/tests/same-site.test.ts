import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import config from './fixtures/same-site-error/astro.config'
import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with same site links with the option set to `error`', async () => {
  const { output, status } = await buildFixture('same-site-error')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 6, 1)

  expectValidationErrors(output, 'test.md', [
    ['https://example.com', ValidationErrorType.SameSite, 11, config.site],
    ['https://example.com/', ValidationErrorType.SameSite, 12, config.site],
    ['https://example.com/guides/example/', ValidationErrorType.SameSite, 14, config.site],
    ['https://example.com/unknown/', ValidationErrorType.SameSite, 15, config.site],
    ['https://example.com/guides/example/#content', ValidationErrorType.SameSite, 17, config.site],
    ['https://example.com/guides/example/#unknown', ValidationErrorType.SameSite, 18, config.site],
  ])
})

test('does not build with invalid same site links with the option set to `validate`', async () => {
  const { output, status } = await buildFixture('same-site-validate')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 3, 2)

  expectValidationErrors(output, 'test.md', [
    ['https://example.com/unknown/', ValidationErrorType.InvalidLink, 15],
    ['https://example.com/guides/example/#unknown', ValidationErrorType.InvalidHash, 18],
  ])

  expectValidationErrors(output, 'redirects.md', [
    ['https://example.com/redirect-test/#unknown', ValidationErrorType.InvalidHash, 6],
  ])
})
