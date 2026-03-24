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
    ['/https://starlight.astro.build/', ValidationErrorType.InvalidLink, [9, 3]],
    ['/', ValidationErrorType.InvalidLink, [11, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [13, 3]],
    ['/unknown/', ValidationErrorType.InvalidLink, [14, 3]],
    ['/unknown#title', ValidationErrorType.InvalidLink, [16, 3]],
    ['/unknown/#title', ValidationErrorType.InvalidLink, [17, 3]],
    ['/icon.svg', ValidationErrorType.InvalidLink, [25, 3]],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, [26, 3]],
    ['/unknown-ref', ValidationErrorType.InvalidLink, [30, 3]],
  ])

  expectValidationErrors(output, 'guides/example/', [
    ['/unknown/#links', ValidationErrorType.InvalidLink, [17, 3]],
    ['/unknown', ValidationErrorType.InvalidLink, [19, 1]],
    ['/icon.svg', ValidationErrorType.InvalidLink, [35, 1]],
    ['/guidelines/ui.pdf', ValidationErrorType.InvalidLink, [36, 1]],
    ['/linkcard/', ValidationErrorType.InvalidLink, [39, 3]],
    ['/linkcard/#links', ValidationErrorType.InvalidLink, [40, 3]],
    ['/linkbutton/', ValidationErrorType.InvalidLink, [44, 1]],
    ['/linkbutton/#links', ValidationErrorType.InvalidLink, [45, 1]],
  ])
})
