import { expect, test } from 'vitest'

import { ValidationErrorType } from '../libs/validation'

import { expectValidationErrorCount, expectValidationErrors, loadFixture } from './utils'

test('should build with invalid hashes', async () => {
  await expect(loadFixture('invalid-hashes-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid links but ignore invalid hashes', async () => {
  expect.assertions(3)

  try {
    await loadFixture('invalid-hashes-invalid-links')
  } catch (error) {
    expectValidationErrorCount(error, 17, 2)

    expectValidationErrors(error, 'test/', [
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

    expectValidationErrors(error, 'guides/example/', [
      ['/unknown/#links', ValidationErrorType.InvalidLink],
      ['/unknown', ValidationErrorType.InvalidLink],
      ['/icon.svg', ValidationErrorType.InvalidLink],
      ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink],
      ['/linkcard/', ValidationErrorType.InvalidLink],
      ['/linkcard/#links', ValidationErrorType.InvalidLink],
      ['/linkbutton/', ValidationErrorType.InvalidLink],
      ['/linkbutton/#links', ValidationErrorType.InvalidLink],
    ])
  }
})
