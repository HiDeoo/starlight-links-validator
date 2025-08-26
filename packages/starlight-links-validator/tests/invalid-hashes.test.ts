import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('builds with invalid hashes', async () => {
  const { status } = await buildFixture('invalid-hashes-valid-links')

  expect(status).toBe('success')
})

test('does not build with invalid links but ignore invalid hashes', async () => {
  const { output, status } = await buildFixture('invalid-hashes-invalid-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 17, 2)

  expectValidationErrors(output, 'test/', [
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink],
    ['/', ValidationErrorType.InvalidLink],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/unknown#title', ValidationErrorType.InvalidLink],
    ['/unknown/#title', ValidationErrorType.InvalidLink],
    ['/icon.svg', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
    ['/unknown-ref', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'guides/example/', [
    ['/unknown/#links', ValidationErrorType.InvalidLink],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/icon.svg', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
    ['/linkcard/', ValidationErrorType.InvalidLink],
    ['/linkcard/#links', ValidationErrorType.InvalidLink],
    ['/linkbutton/', ValidationErrorType.InvalidLink],
    ['/linkbutton/#links', ValidationErrorType.InvalidLink],
  ])
})

test('special #_top hash is always valid', async () => {
  const { output, status } = await buildFixture('top-hash-always-valid')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 7, 1)

  expectValidationErrors(output, 'guides/example/', [
    ['#unknown', ValidationErrorType.InvalidHash],
    ['#unknownBlock', ValidationErrorType.InvalidHash],
    ['#unknownText', ValidationErrorType.InvalidHash],
    ['/test/#unknown', ValidationErrorType.InvalidHash],
    ['#unknown', ValidationErrorType.InvalidHash],
    ['/test/#unknown', ValidationErrorType.InvalidHash],
    ['#unknown', ValidationErrorType.InvalidHash],
  ])
})
