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
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink, [9]],
    ['/', ValidationErrorType.InvalidLink, [11]],
    ['/unknown', ValidationErrorType.InvalidLink, [13]],
    ['/unknown/', ValidationErrorType.InvalidLink, [14]],
    ['/unknown#title', ValidationErrorType.InvalidLink, [16]],
    ['/unknown/#title', ValidationErrorType.InvalidLink, [17]],
    ['/icon.svg', ValidationErrorType.InvalidLink, [25]],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, [26]],
    ['/unknown-ref', ValidationErrorType.InvalidLink, [30]],
  ])

  expectValidationErrors(output, 'guides/example/', [
    ['/unknown/#links', ValidationErrorType.InvalidLink, [17]],
    ['/unknown', ValidationErrorType.InvalidLink, [19]],
    ['/icon.svg', ValidationErrorType.InvalidLink, [35]],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, [36]],
    ['/linkcard/', ValidationErrorType.InvalidLink, [39]],
    ['/linkcard/#links', ValidationErrorType.InvalidLink, [40]],
    ['/linkbutton/', ValidationErrorType.InvalidLink, [44]],
    ['/linkbutton/#links', ValidationErrorType.InvalidLink, [45]],
  ])
})
