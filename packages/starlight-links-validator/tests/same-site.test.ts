import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import config from './fixtures/same-site-error/astro.config'
import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('does not build with same site links with the option set to `error`', async () => {
  const { output, status } = await buildFixture('same-site-error')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 6, 1)

  expectValidationErrors(output, 'test/', [
    ['https://example.com', ValidationErrorType.SameSite, [11, 3], config.site],
    ['https://example.com/', ValidationErrorType.SameSite, [12, 3], config.site],
    ['https://example.com/guides/example/', ValidationErrorType.SameSite, [14, 3], config.site],
    ['https://example.com/unknown/', ValidationErrorType.SameSite, [15, 3], config.site],
    ['https://example.com/guides/example/#content', ValidationErrorType.SameSite, [17, 3], config.site],
    ['https://example.com/guides/example/#unknown', ValidationErrorType.SameSite, [18, 3], config.site],
  ])
})

test('does not build with invalid same site links with the option set to `validate`', async () => {
  const { output, status } = await buildFixture('same-site-validate')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 2, 1)

  expectValidationErrors(output, 'test/', [
    ['https://example.com/unknown/', ValidationErrorType.InvalidLink, [15, 3]],
    ['https://example.com/guides/example/#unknown', ValidationErrorType.InvalidHash, [18, 3]],
  ])
})
