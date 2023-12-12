import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should build with no links', async () => {
  await expect(loadFixture('basics-no-links')).resolves.not.toThrow()
})

test('should build with valid links', async () => {
  await expect(loadFixture('basics-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid links', async () => {
  expect.assertions(4)

  try {
    await loadFixture('basics-invalid-links')
  } catch (error) {
    expect(error).toMatch(/Found 20 invalid links in 3 files./)

    expect(error).toMatch(
      new RegExp(`▶ test/
  ├─ /
  ├─ /unknown
  ├─ /unknown/
  ├─ /unknown#title
  ├─ /unknown/#title
  ├─ #links
  ├─ /guides/example/#links
  ├─ /icon.svg
  ├─ /guidelines/ui.pdf
  ├─ /unknown-ref
  ├─ #unknown-ref
  └─ #anotherDiv`),
    )

    expect(error).toMatch(
      new RegExp(`▶ guides/example/
  ├─ #links
  ├─ /unknown/#links
  ├─ /unknown
  ├─ #anotherBlock
  ├─ /icon.svg
  └─ /guidelines/ui.pdf`),
    )

    expect(error).toMatch(
      new RegExp(`▶ guides/namespacetest/
  ├─ #some-other-content
  └─ /guides/namespacetest/#another-content`),
    )
  }
})
