import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links when the `base` Astro option is set', async () => {
  const { output, status } = await buildFixture('base-path')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 28, 2)

  expectValidationErrors(output, 'test/test/', [
    ['/guides/example', ValidationErrorType.InvalidLink, [15, 3]],
    ['/guides/example/', ValidationErrorType.InvalidLink, [16, 3]],
    ['/guides/example#description', ValidationErrorType.InvalidLink, [18, 3]],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, [19, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [21, 3]],
    ['/unknown/', ValidationErrorType.InvalidLink, [22, 3]],
    ['/test/guides/example#unknown', ValidationErrorType.InvalidHash, [24, 3]],
    ['/test/guides/example/#unknown', ValidationErrorType.InvalidHash, [25, 3]],
    ['/favicon.svg', ValidationErrorType.InvalidLink, [30, 3]],
    ['/guidelines/dummy.pdf', ValidationErrorType.InvalidLink, [31, 3]],
    ['/release/@pkg/v0.1.0', ValidationErrorType.InvalidLink, [39, 3]],
    ['/release/@pkg/v0.1.0/', ValidationErrorType.InvalidLink, [40, 3]],
    ['/release/@pkg/v0.1.0#some-heading', ValidationErrorType.InvalidLink, [42, 3]],
    ['/release/@pkg/v0.1.0/#some-heading', ValidationErrorType.InvalidLink, [43, 3]],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink, [45, 3]],
    ['/guides/page-with-custom-slug/', ValidationErrorType.InvalidLink, [46, 3]],
    ['https://example.com/guides/example', ValidationErrorType.InvalidLink, [56, 3]],
    ['https://example.com/guides/example/', ValidationErrorType.InvalidLink, [57, 3]],
    ['https://example.com/guides/example#description', ValidationErrorType.InvalidLink, [59, 3]],
    ['https://example.com/guides/example/#description', ValidationErrorType.InvalidLink, [60, 3]],
    ['https://example.com/unknown', ValidationErrorType.InvalidLink, [62, 3]],
    ['https://example.com/unknown/', ValidationErrorType.InvalidLink, [63, 3]],
    ['https://example.com/test/guides/example#unknown', ValidationErrorType.InvalidHash, [65, 3]],
    ['https://example.com/test/guides/example/#unknown', ValidationErrorType.InvalidHash, [66, 3]],
  ])

  expectValidationErrors(output, 'test/fr/test/', [
    ['/guides/example', ValidationErrorType.InvalidLink, [13, 3]],
    ['/guides/example/', ValidationErrorType.InvalidLink, [14, 3]],
    ['/guides/example#description', ValidationErrorType.InvalidLink, [16, 3]],
    ['/guides/example/#description', ValidationErrorType.InvalidLink, [17, 3]],
  ])
})
