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
    expectValidationErrorCount(error, 28, 4)

    expectValidationErrors(error, 'test/', [
      ['/', ValidationErrorType.InvalidLink],
      ['/unknown', ValidationErrorType.InvalidLink],
      ['/unknown/', ValidationErrorType.InvalidLink],
      ['/unknown#title', ValidationErrorType.InvalidLink],
      ['/unknown/#title', ValidationErrorType.InvalidLink],
      ['#links', ValidationErrorType.InvalidAnchor],
      ['/guides/example/#links', ValidationErrorType.InvalidAnchor],
      ['/icon.svg', ValidationErrorType.InvalidLink],
      ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
      ['/unknown-ref', ValidationErrorType.InvalidLink],
      ['#unknown-ref', ValidationErrorType.InvalidAnchor],
      ['#anotherDiv', ValidationErrorType.InvalidAnchor],
      ['/guides/page-with-custom-slug', ValidationErrorType.InvalidLink],
      ['/release/@pkg/v0.2.0', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'guides/example/', [
      ['#links', ValidationErrorType.InvalidAnchor],
      ['/unknown/#links', ValidationErrorType.InvalidLink],
      ['/unknown', ValidationErrorType.InvalidLink],
      ['#anotherBlock', ValidationErrorType.InvalidAnchor],
      ['/icon.svg', ValidationErrorType.InvalidLink],
      ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
    ])

    expectValidationErrors(error, 'guides/namespacetest/', [
      ['#some-other-content', ValidationErrorType.InvalidAnchor],
      ['/guides/namespacetest/#another-content', ValidationErrorType.InvalidAnchor],
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
