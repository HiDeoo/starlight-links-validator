import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should build with no links', async () => {
  await expect(loadFixture('basics-no-links')).resolves.not.toThrow()
})

test('should build with valid links', async () => {
  await expect(loadFixture('basics-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid links', async () => {
  expect.assertions(5)

  try {
    await loadFixture('basics-invalid-links')
  } catch (error) {
    expectValidationErrorCount(error, 35, 4)

    expectValidationErrors(error, 'test/', [
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

    expectValidationErrors(error, 'guides/example/', [
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

    expectValidationErrors(error, 'guides/namespacetest/', [
      ['#some-other-content', ValidationErrorType.InvalidHash],
      ['/guides/namespacetest/#another-content', ValidationErrorType.InvalidHash],
    ])

    expectValidationErrors(error, 'relative/', [
      ['.', ValidationErrorType.RelativeLink],
      ['./relative', ValidationErrorType.RelativeLink],
      ['./test', ValidationErrorType.RelativeLink],
      ['./guides/example', ValidationErrorType.RelativeLink],
      ['../test', ValidationErrorType.RelativeLink],
      ['test', ValidationErrorType.RelativeLink],
    ])
  }
})
