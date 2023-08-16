import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should build with no links', async () => {
  await expect(loadFixture('no-links')).resolves.not.toThrow()
})

test('should build with valid links', async () => {
  await expect(loadFixture('with-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid links', async () => {
  expect.assertions(4)

  try {
    await loadFixture('with-invalid-links')
  } catch (error) {
    expect(error).toMatch(/Found 14 invalid links in 3 files./)

    expect(error).toMatch(
      new RegExp(`▶ test/
  ├─ /
  ├─ /unknown
  ├─ /unknown/
  ├─ /unknown#title
  ├─ /unknown/#title
  ├─ #links
  ├─ /guides/example/#links
  └─ #anotherDiv`)
    )

    expect(error).toMatch(
      new RegExp(`▶ guides/example/
  ├─ #links
  ├─ /unknown/#links
  ├─ /unknown
  └─ #anotherBlock`)
    )

    expect(error).toMatch(
      new RegExp(`▶ guides/namespacetest/
  ├─ #some-other-content
  └─ /guides/namespacetest/#another-content`)
    )
  }
})
