import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links when the `base` Astro option is set', async () => {
  const { output, status } = await buildFixture('base-path')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 29, 3)

  expectValidationErrors(output, 'test.md', [
    ['/guides/example', ValidationErrorType.InvalidLink, 15],
    ['/guides/example/', ValidationErrorType.InvalidLink, 16],
    ['/guides/example#description', ValidationErrorType.InvalidLink, 18],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, 19],
    ['/unknown', ValidationErrorType.InvalidLink, 21],
    ['/unknown/', ValidationErrorType.InvalidLink, 22],
    ['/test/guides/example#unknown', ValidationErrorType.InvalidHash, 24],
    ['/test/guides/example/#unknown', ValidationErrorType.InvalidHash, 25],
    ['/favicon.svg', ValidationErrorType.InvalidLink, 30],
    ['/guidelines/dummy.pdf', ValidationErrorType.InvalidLink, 31],
    ['/release/@pkg/v0.1.0', ValidationErrorType.InvalidLink, 39],
    ['/release/@pkg/v0.1.0/', ValidationErrorType.InvalidLink, 40],
    ['/release/@pkg/v0.1.0#some-heading', ValidationErrorType.InvalidLink, 42],
    ['/release/@pkg/v0.1.0/#some-heading', ValidationErrorType.InvalidLink, 43],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink, 45],
    ['/guides/page-with-custom-slug/', ValidationErrorType.InvalidLink, 46],
    ['https://example.com/guides/example', ValidationErrorType.InvalidLink, 56],
    ['https://example.com/guides/example/', ValidationErrorType.InvalidLink, 57],
    ['https://example.com/guides/example#description', ValidationErrorType.InvalidLink, 59],
    ['https://example.com/guides/example/#description', ValidationErrorType.InvalidLink, 60],
    ['https://example.com/unknown', ValidationErrorType.InvalidLink, 62],
    ['https://example.com/unknown/', ValidationErrorType.InvalidLink, 63],
    ['https://example.com/test/guides/example#unknown', ValidationErrorType.InvalidHash, 65],
    ['https://example.com/test/guides/example/#unknown', ValidationErrorType.InvalidHash, 66],
  ])

  expectValidationErrors(output, 'fr/test.md', [
    ['/guides/example', ValidationErrorType.InvalidLink, 13],
    ['/guides/example/', ValidationErrorType.InvalidLink, 14],
    ['/guides/example#description', ValidationErrorType.InvalidLink, 16],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, 17],
  ])

  expectValidationErrors(output, 'transform.md', [['/guides/example/', ValidationErrorType.InvalidLink, 16]])
})
