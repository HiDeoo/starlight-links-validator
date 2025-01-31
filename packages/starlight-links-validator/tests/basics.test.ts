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

  expectValidationErrorCount(output, 69, 4)

  expectValidationErrors(output, 'test/', [
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink],
    ['/', ValidationErrorType.InvalidLink],
    ['/unknown', ValidationErrorType.InvalidLink],
    ['/unknown/', ValidationErrorType.InvalidLink],
    ['/unknown#title', ValidationErrorType.InvalidLink],
    ['/unknown/#title', ValidationErrorType.InvalidLink],
    ['/draft', ValidationErrorType.InvalidLink],
    ['/draft/', ValidationErrorType.InvalidLink],
    ['#links', ValidationErrorType.InvalidHash],
    ['/guides/example/#links', ValidationErrorType.InvalidHash],
    ['/icon.svg', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
    ['/unknown-ref', ValidationErrorType.InvalidLink],
    ['#unknown-ref', ValidationErrorType.InvalidHash],
    ['#anotherDiv', ValidationErrorType.InvalidHash],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink],
    ['/release/@pkg/v0.2.0', ValidationErrorType.InvalidLink],
    ['/?query=string', ValidationErrorType.InvalidLink],
    ['/unknown?query=string', ValidationErrorType.InvalidLink],
    ['/unknown/?query=string', ValidationErrorType.InvalidLink],
    ['/unknown?query=string#title', ValidationErrorType.InvalidLink],
    ['/unknown/?query=string#title', ValidationErrorType.InvalidLink],
    ['?query=string#links', ValidationErrorType.InvalidHash],
    ['/guides/example/?query=string#links', ValidationErrorType.InvalidHash],
    ['/icon.svg?query=string', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf?query=string', ValidationErrorType.InvalidLink],
    ['/unknown-ref?query=string', ValidationErrorType.InvalidLink],
    ['?query=string#unknown-ref', ValidationErrorType.InvalidHash],
    ['http://localhost', ValidationErrorType.LocalLink],
    ['http://localhost:4321/', ValidationErrorType.LocalLink],
    ['https://127.0.0.1:4321/getting-started', ValidationErrorType.LocalLink],
    ['/unknown-custom-page/', ValidationErrorType.InvalidLink],
    ['/custom-page/', ValidationErrorType.InvalidLinkToCustomPage],
    ['/custom-dynamic-page/foo/', ValidationErrorType.InvalidLinkToCustomPage],
    ['/custom-dynamic-page/foo.bar/', ValidationErrorType.InvalidLinkToCustomPage],
    ['/custom-dynamic-page/bar/', ValidationErrorType.InvalidLink],
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
    ['?query=string#links', ValidationErrorType.InvalidHash],
    ['/unknown/?query=string#links', ValidationErrorType.InvalidLink],
    ['/unknown?query=string', ValidationErrorType.InvalidLink],
    ['/icon.svg?query=string', ValidationErrorType.InvalidLink],
    ['/guidelines/ui.pdf?query=string', ValidationErrorType.InvalidLink],
    ['/linkcard/?query=string', ValidationErrorType.InvalidLink],
    ['/linkbutton/?query=string', ValidationErrorType.InvalidLink],
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
    ['.?query=string', ValidationErrorType.RelativeLink],
    ['./relative?query=string', ValidationErrorType.RelativeLink],
    ['./test?query=string', ValidationErrorType.RelativeLink],
    ['./guides/example?query=string', ValidationErrorType.RelativeLink],
    ['../test?query=string', ValidationErrorType.RelativeLink],
    ['test?query=string', ValidationErrorType.RelativeLink],
  ])
})
