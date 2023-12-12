import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should not build with ignored fallback links', async () => {
  expect.assertions(2)

  try {
    await loadFixture('fallback-prevent-links')
  } catch (error) {
    expect(error).toMatch(/Found 4 invalid links in 1 file./)

    expect(error).toMatch(
      new RegExp(`▶ fr/
  ├─ /fr/guides/example
  ├─ /fr/guides/example/
  ├─ /fr/guides/example#description
  └─ /fr/guides/example/#description`),
    )
  }
})

test('should build with valid fallback links', async () => {
  await expect(loadFixture('fallback-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid fallback links', async () => {
  expect.assertions(4)

  try {
    await loadFixture('fallback-invalid-links')
  } catch (error) {
    expect(error).toMatch(/Found 11 invalid links in 3 files./)

    expect(error).toMatch(
      new RegExp(`▶ en/
  ├─ /en/guides/unknown
  ├─ /en/guides/unknown/
  ├─ /en/guides/example#unknown
  ├─ /en/guides/example/#unknown
  ├─ /es/guides/example
  └─ /es/guides/example/`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/
  ├─ /fr/guides/unknown
  ├─ /fr/guides/unknown/
  ├─ /fr/guides/example#unknown
  └─ /fr/guides/example/#unknown`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/guides/test/
  └─ /`),
    )
  }
})

test('should build with a root locale and valid fallback links', async () => {
  await expect(loadFixture('fallback-root-valid-links')).resolves.not.toThrow()
})

test('should not build with a root locale and invalid fallback links', async () => {
  expect.assertions(4)

  try {
    await loadFixture('fallback-root-invalid-links')
  } catch (error) {
    expect(error).toMatch(/Found 11 invalid links in 3 files./)

    expect(error).toMatch(
      new RegExp(`▶ /
  ├─ /guides/unknown
  ├─ /guides/unknown/
  ├─ /guides/example#unknown
  ├─ /guides/example/#unknown
  ├─ /es/guides/example
  └─ /es/guides/example/`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/
  ├─ /fr/guides/unknown
  ├─ /fr/guides/unknown/
  ├─ /fr/guides/example#unknown
  └─ /fr/guides/example/#unknown`),
    )

    expect(error).toMatch(
      new RegExp(`▶ guides/test/
  └─ /en`),
    )
  }
})
