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

  expectValidationErrorCount(output, 76, 5)

  expectValidationErrors(output, 'frontmatter/', [
    ['/unknown-action/', ValidationErrorType.InvalidLink, [6, 13]],
    ['/unknown-prev/', ValidationErrorType.InvalidLink, [8, 9]],
    ['/unknown-next/', ValidationErrorType.InvalidLink, [10, 9]],
  ])

  expectValidationErrors(output, 'test/', [
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink, [9, 3]],
    ['/', ValidationErrorType.InvalidLink, [11, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [13, 3]],
    ['/unknown/', ValidationErrorType.InvalidLink, [14, 3]],
    ['/unknown#title', ValidationErrorType.InvalidLink, [16, 3]],
    ['/unknown/#title', ValidationErrorType.InvalidLink, [17, 3]],
    ['/draft', ValidationErrorType.InvalidLink, [19, 3]],
    ['/draft/', ValidationErrorType.InvalidLink, [20, 3]],
    ['#links', ValidationErrorType.InvalidHash, [25, 3]],
    ['/guides/example/#links', ValidationErrorType.InvalidHash, [27, 3]],
    ['/icon.svg', ValidationErrorType.InvalidLink, [28, 3]],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, [29, 3]],
    ['/unknown-ref', ValidationErrorType.InvalidLink, [33, 3]],
    ['#unknown-ref', ValidationErrorType.InvalidHash, [34, 3]],
    ['#anotherDiv', ValidationErrorType.InvalidHash, [48, 3]],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink, [55, 3]],
    ['/release/@pkg/v0.2.0', ValidationErrorType.InvalidLink, [56, 3]],
    ['/?query=string', ValidationErrorType.InvalidLink, [60, 3]],
    ['/unknown?query=string', ValidationErrorType.InvalidLink, [62, 3]],
    ['/unknown/?query=string', ValidationErrorType.InvalidLink, [63, 3]],
    ['/unknown?query=string#title', ValidationErrorType.InvalidLink, [65, 3]],
    ['/unknown/?query=string#title', ValidationErrorType.InvalidLink, [66, 3]],
    ['?query=string#links', ValidationErrorType.InvalidHash, [69, 3]],
    ['/guides/example/?query=string#links', ValidationErrorType.InvalidHash, [71, 3]],
    ['/icon.svg?query=string', ValidationErrorType.InvalidLink, [72, 3]],
    ['/guidelines/ui.pdf?query=string', ValidationErrorType.InvalidLink, [73, 3]],
    ['/unknown-ref?query=string', ValidationErrorType.InvalidLink, [75, 3]],
    ['?query=string#unknown-ref', ValidationErrorType.InvalidHash, [76, 3]],
    ['http://localhost', ValidationErrorType.LocalLink, [83, 3]],
    ['http://localhost:4321/', ValidationErrorType.LocalLink, [84, 3]],
    ['https://127.0.0.1:4321/getting-started', ValidationErrorType.LocalLink, [85, 3]],
    ['/unknown-custom-page/', ValidationErrorType.InvalidLink, [89, 3]],
    ['/custom-page/', ValidationErrorType.InvalidLinkToCustomPage, [90, 3]],
    ['/custom-dynamic-page/foo/', ValidationErrorType.InvalidLinkToCustomPage, [91, 3]],
    ['/custom-dynamic-page/foo.bar/', ValidationErrorType.InvalidLinkToCustomPage, [92, 3]],
    ['/custom-dynamic-page/bar/', ValidationErrorType.InvalidLink, [93, 3]],
  ])

  expectValidationErrors(output, 'guides/example/', [
    ['#links', ValidationErrorType.InvalidHash, [16, 3]],
    ['/unknown/#links', ValidationErrorType.InvalidLink, [17, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [19, 1]],
    ['#anotherBlock', ValidationErrorType.InvalidHash, [30, 3]],
    ['/icon.svg', ValidationErrorType.InvalidLink, [35, 1]],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, [36, 1]],
    ['/linkcard/', ValidationErrorType.InvalidLink, [39, 3]],
    ['/linkcard/#links', ValidationErrorType.InvalidLink, [40, 3]],
    ['#linkcard', ValidationErrorType.InvalidHash, [41, 3]],
    ['/linkbutton/', ValidationErrorType.InvalidLink, [44, 1]],
    ['/linkbutton/#links', ValidationErrorType.InvalidLink, [45, 1]],
    ['#linkbutton', ValidationErrorType.InvalidHash, [46, 1]],
    ['?query=string#links', ValidationErrorType.InvalidHash, [50, 3]],
    ['/unknown/?query=string#links', ValidationErrorType.InvalidLink, [51, 3]],
    ['/unknown?query=string', ValidationErrorType.InvalidLink, [53, 1]],
    ['/icon.svg?query=string', ValidationErrorType.InvalidLink, [55, 1]],
    ['/guidelines/ui.pdf?query=string', ValidationErrorType.InvalidLink, [56, 1]],
    ['/linkcard/?query=string', ValidationErrorType.InvalidLink, [59, 3]],
    ['/linkbutton/?query=string', ValidationErrorType.InvalidLink, [62, 1]],
    ['/customlink/', ValidationErrorType.InvalidLink, [68, 1]],
    ['/customlink/#links', ValidationErrorType.InvalidLink, [69, 1]],
    ['#customlink', ValidationErrorType.InvalidHash, [70, 1]],
    ['/customlink/?query=string', ValidationErrorType.InvalidLink, [71, 1]],
  ])

  expectValidationErrors(output, 'guides/namespacetest/', [
    ['#some-other-content', ValidationErrorType.InvalidHash, [7, 1]],
    ['/guides/namespacetest/#another-content', ValidationErrorType.InvalidHash, [8, 1]],
  ])

  expectValidationErrors(output, 'relative/', [
    ['.', ValidationErrorType.RelativeLink, [5, 3]],
    ['./relative', ValidationErrorType.RelativeLink, [6, 3]],
    ['./test', ValidationErrorType.RelativeLink, [7, 3]],
    ['./guides/example', ValidationErrorType.RelativeLink, [8, 3]],
    ['../test', ValidationErrorType.RelativeLink, [9, 3]],
    ['test', ValidationErrorType.RelativeLink, [10, 3]],
    ['.?query=string', ValidationErrorType.RelativeLink, [14, 3]],
    ['./relative?query=string', ValidationErrorType.RelativeLink, [15, 3]],
    ['./test?query=string', ValidationErrorType.RelativeLink, [16, 3]],
    ['./guides/example?query=string', ValidationErrorType.RelativeLink, [17, 3]],
    ['../test?query=string', ValidationErrorType.RelativeLink, [18, 3]],
    ['test?query=string', ValidationErrorType.RelativeLink, [19, 3]],
  ])
})
