import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('validates links when the `base` Astro option is set', async () => {
  const { output, status } = await buildFixture('base-path')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 16, 1)

  expectValidationErrors(output, 'test/test/', [
    ['/guides/example', ValidationErrorType.InvalidLink],
    ['/guides/example/', ValidationErrorType.InvalidLink],
    ['/guides/example#description', ValidationErrorType.InvalidLink],
    ['/guides/example/#description', ValidationErrorType.InvalidLink],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/test/guides/example#unknown', ValidationErrorType.InvalidHash],
    ['/test/guides/example/#unknown', ValidationErrorType.InvalidHash],
    ['/favicon.svg', ValidationErrorType.InvalidLink],
    ['/guidelines/dummy.pdf', ValidationErrorType.InvalidLink],
    ['/release/@pkg/v0.1.0', ValidationErrorType.InvalidLink],
    ['/release/@pkg/v0.1.0/', ValidationErrorType.InvalidLink],
    ['/release/@pkg/v0.1.0#some-content', ValidationErrorType.InvalidLink],
    ['/release/@pkg/v0.1.0/#some-content', ValidationErrorType.InvalidLink],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink],
    ['/guides/page-with-custom-slug/', ValidationErrorType.InvalidLink],
  ])
})
