import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { buildFixture, expectValidationErrorCount, expectValidationErrors } from './utils'

test('builds with no links', async () => {
  const { status } = await buildFixture('no-links')

  expect(status).toBe('success')
})

test('builds with valid links', async () => {
  const { status } = await buildFixture('valid-links')

  expect(status).toBe('success')
})

test('does not build with invalid links', async () => {
  const { output, status } = await buildFixture('invalid-links')

  expect(status).toBe('error')

  expectValidationErrorCount(output, 35, 4)

  expectValidationErrors(output, 'test/', [
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink],
    ['/', ValidationErrorType.InvalidLink],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/unknown#title', ValidationErrorType.InvalidLink],
    ['/unknown/#title', ValidationErrorType.InvalidLink],
    ['#links', ValidationErrorType.InvalidHash],
    ['/guides/example/#links', ValidationErrorType.InvalidHash],
    ['/icon.svg', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
    ['/unknown-ref', ValidationErrorType.InvalidLink],
    ['#unknown-ref', ValidationErrorType.InvalidHash],
    ['#anotherDiv', ValidationErrorType.InvalidHash],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink],
    ['/release/@pkg/v0.2.0', ValidationErrorType.InvalidLink],
  ])

  expectValidationErrors(output, 'guides/example/', [
    ['#links', ValidationErrorType.InvalidHash],
    ['/unknown/#links', ValidationErrorType.InvalidLink],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['#anotherBlock', ValidationErrorType.InvalidHash],
    ['/icon.svg', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
    ['/linkcard/', ValidationErrorType.InvalidLink],
    ['/linkcard/#links', ValidationErrorType.InvalidLink],
    ['#linkcard', ValidationErrorType.InvalidHash],
    ['/linkbutton/', ValidationErrorType.InvalidLink],
    ['/linkbutton/#links', ValidationErrorType.InvalidLink],
    ['#linkbutton', ValidationErrorType.InvalidHash],
  ])

  expectValidationErrors(output, 'guides/namespacetest/', [
    ['#some-other-content', ValidationErrorType.InvalidHash],
    ['/guides/namespacetest/#another-content', ValidationErrorType.InvalidHash],
  ])

  expectValidationErrors(output, 'relative/', [
    ['.', ValidationErrorType.RelativeLink],
    ['./relative', ValidationErrorType.RelativeLink],
    ['./test', ValidationErrorType.RelativeLink],
    ['./guides/example', ValidationErrorType.RelativeLink],
    ['../test', ValidationErrorType.RelativeLink],
    ['test', ValidationErrorType.RelativeLink],
  ])
})
