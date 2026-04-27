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

  expectValidationErrorCount(output, 92, 8)

  expectValidationErrors(output, 'frontmatter.md', [
    ['/unknown-action/', ValidationErrorType.InvalidLink, 6],
    ['/unknown-prev/', ValidationErrorType.InvalidLink, 8],
    ['/unknown-next/', ValidationErrorType.InvalidLink, 10],
  ])

  expectValidationErrors(output, 'test.md', [
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink, 9],
    ['/', ValidationErrorType.InvalidLink, 11],
    ['/unknown', ValidationErrorType.InvalidLink, 13],
    ['/unknown/', ValidationErrorType.InvalidLink, 14],
    ['/unknown#title', ValidationErrorType.InvalidLink, 16],
    ['/unknown/#title', ValidationErrorType.InvalidLink, 17],
    ['/draft', ValidationErrorType.InvalidLink, 19],
    ['/draft/', ValidationErrorType.InvalidLink, 20],
    ['#links', ValidationErrorType.InvalidHash, 25],
    ['/guides/example/#links', ValidationErrorType.InvalidHash, 27],
    ['/icon.svg', ValidationErrorType.InvalidLink, 28],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, 29],
    ['/unknown-ref', ValidationErrorType.InvalidLink, 33],
    ['#unknown-ref', ValidationErrorType.InvalidHash, 34],
    ['#anotherDiv', ValidationErrorType.InvalidHash, 48],
    ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink, 55],
    ['/release/@pkg/v0.2.0', ValidationErrorType.InvalidLink, 56],
    ['/?query=string', ValidationErrorType.InvalidLink, 60],
    ['/unknown?query=string', ValidationErrorType.InvalidLink, 62],
    ['/unknown/?query=string', ValidationErrorType.InvalidLink, 63],
    ['/unknown?query=string#title', ValidationErrorType.InvalidLink, 65],
    ['/unknown/?query=string#title', ValidationErrorType.InvalidLink, 66],
    ['?query=string#links', ValidationErrorType.InvalidHash, 69],
    ['/guides/example/?query=string#links', ValidationErrorType.InvalidHash, 71],
    ['/icon.svg?query=string', ValidationErrorType.InvalidLink, 72],
    ['/guidelines/ui.pdf?query=string', ValidationErrorType.InvalidLink, 73],
    ['/unknown-ref?query=string', ValidationErrorType.InvalidLink, 75],
    ['?query=string#unknown-ref', ValidationErrorType.InvalidHash, 76],
    ['http://localhost', ValidationErrorType.LocalLink, 83],
    ['http://localhost:4321/', ValidationErrorType.LocalLink, 84],
    ['https://127.0.0.1:4321/getting-started', ValidationErrorType.LocalLink, 85],
    ['/unknown-custom-page/', ValidationErrorType.InvalidLink, 89],
    ['/custom-page/', ValidationErrorType.InvalidLinkToCustomPage, 90],
    ['/custom-dynamic-page/foo/', ValidationErrorType.InvalidLinkToCustomPage, 91],
    ['/custom-dynamic-page/foo.bar/', ValidationErrorType.InvalidLinkToCustomPage, 92],
    ['/custom-dynamic-page/bar/', ValidationErrorType.InvalidLink, 93],
  ])

  expectValidationErrors(output, 'guides/example.mdx', [
    ['#links', ValidationErrorType.InvalidHash, 16],
    ['/unknown/#links', ValidationErrorType.InvalidLink, 17],
    ['/unknown', ValidationErrorType.InvalidLink, 19],
    ['#anotherBlock', ValidationErrorType.InvalidHash, 30],
    ['/icon.svg', ValidationErrorType.InvalidLink, 35],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, 36],
    ['/linkcard/', ValidationErrorType.InvalidLink, 39],
    ['/linkcard/#links', ValidationErrorType.InvalidLink, 40],
    ['#linkcard', ValidationErrorType.InvalidHash, 41],
    ['/linkbutton/', ValidationErrorType.InvalidLink, 44],
    ['/linkbutton/#links', ValidationErrorType.InvalidLink, 45],
    ['#linkbutton', ValidationErrorType.InvalidHash, 46],
    ['?query=string#links', ValidationErrorType.InvalidHash, 50],
    ['/unknown/?query=string#links', ValidationErrorType.InvalidLink, 51],
    ['/unknown?query=string', ValidationErrorType.InvalidLink, 53],
    ['/icon.svg?query=string', ValidationErrorType.InvalidLink, 55],
    ['/guidelines/ui.pdf?query=string', ValidationErrorType.InvalidLink, 56],
    ['/linkcard/?query=string', ValidationErrorType.InvalidLink, 59],
    ['/linkbutton/?query=string', ValidationErrorType.InvalidLink, 62],
    ['/customlink/', ValidationErrorType.InvalidLink, 68],
    ['/customlink/#links', ValidationErrorType.InvalidLink, 69],
    ['#customlink', ValidationErrorType.InvalidHash, 70],
    ['/customlink/?query=string', ValidationErrorType.InvalidLink, 71],
  ])

  expectValidationErrors(output, 'guides/Namespace.Test.md', [
    ['#some-other-content', ValidationErrorType.InvalidHash, 7],
    ['/guides/namespacetest/#another-content', ValidationErrorType.InvalidHash, 8],
  ])

  expectValidationErrors(output, 'relative.md', [
    ['.', ValidationErrorType.RelativeLink, 5],
    ['./relative', ValidationErrorType.RelativeLink, 6],
    ['./test', ValidationErrorType.RelativeLink, 7],
    ['./guides/example', ValidationErrorType.RelativeLink, 8],
    ['../test', ValidationErrorType.RelativeLink, 9],
    ['test', ValidationErrorType.RelativeLink, 10],
    ['.?query=string', ValidationErrorType.RelativeLink, 14],
    ['./relative?query=string', ValidationErrorType.RelativeLink, 15],
    ['./test?query=string', ValidationErrorType.RelativeLink, 16],
    ['./guides/example?query=string', ValidationErrorType.RelativeLink, 17],
    ['../test?query=string', ValidationErrorType.RelativeLink, 18],
    ['test?query=string', ValidationErrorType.RelativeLink, 19],
  ])

  expectValidationErrors(output, 'groups.md', [
    ['/unknown-duplicate/', ValidationErrorType.InvalidLink, 5, undefined, 2],
    ['/unknown-triple/', ValidationErrorType.InvalidLink, 7, undefined, 3],
    ['/unknown-a/', ValidationErrorType.InvalidLink, 9],
    ['/unknown-b/', ValidationErrorType.InvalidLink, 9],
    ['/guides/example/#unknown-duplicate-hash', ValidationErrorType.InvalidHash, 11, undefined, 2],
  ])

  expectValidationErrors(output, 'unicode.md', [
    ['#icônes', ValidationErrorType.InvalidHash, 5],
    ['/unicode/#icônes', ValidationErrorType.InvalidHash, 7],
    ['/café/#icônes', ValidationErrorType.InvalidLink, 9],
  ])

  expectValidationErrors(output, 'redirects.md', [
    ['/redirect-test/#unknown', ValidationErrorType.InvalidHash, 5],
    ['/redirect-custom-page/', ValidationErrorType.InvalidLinkToCustomPage, 6],
    ['/redirect-custom-dynamic/foo/', ValidationErrorType.InvalidLinkToCustomPage, 7],
    ['/redirect-unknown/', ValidationErrorType.InvalidLink, 8],
  ])
})
