import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should not build with inconsistent locale links when enabled ', async () => {
  expect.assertions(5)

  try {
    await loadFixture('inconsistent-locale')
  } catch (error) {
    expect(error).toMatch(/Found 20 invalid links in 4 files./)

    expect(error).toMatch(
      new RegExp(`▶ en/
  ├─ /fr/guides/example
  ├─ /fr/guides/example/
  ├─ /fr/guides/example#description
  ├─ /fr/guides/example/#description
  ├─ /guides/example
  ├─ /guides/example/
  ├─ /guides/example#description
  └─ /guides/example/#description`),
    )

    expect(error).toMatch(
      new RegExp(`▶ en/guides/example/
  ├─ /fr
  └─ /`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/
  ├─ /en/guides/example
  ├─ /en/guides/example/
  ├─ /en/guides/example#description
  ├─ /en/guides/example/#description
  ├─ /guides/example
  ├─ /guides/example/
  ├─ /guides/example#description
  └─ /guides/example/#description`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/guides/example/
  ├─ /en
  └─ /`),
    )
  }
})

test('should not build with a root locale and inconsistent locale links when enabled ', async () => {
  expect.assertions(5)

  try {
    await loadFixture('inconsistent-locale-root')
  } catch (error) {
    expect(error).toMatch(/Found 15 invalid links in 4 files./)

    expect(error).toMatch(
      new RegExp(`▶ /
  ├─ /fr/guides/example
  ├─ /fr/guides/example/
  ├─ /fr/guides/example#description
  └─ /fr/guides/example/#description`),
    )

    expect(error).toMatch(
      new RegExp(`▶ guides/example/
  └─ /fr`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/
  ├─ /es/guides/example
  ├─ /es/guides/example/
  ├─ /es/guides/example#description
  ├─ /es/guides/example/#description
  ├─ /guides/example
  ├─ /guides/example/
  ├─ /guides/example#description
  └─ /guides/example/#description`),
    )

    expect(error).toMatch(
      new RegExp(`▶ fr/guides/example/
  ├─ /es
  └─ /`),
    )
  }
})
