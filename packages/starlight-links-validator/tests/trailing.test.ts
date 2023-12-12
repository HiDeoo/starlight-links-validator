import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should validate links when the `trailingSlash` Astro option is set to `never`', async () => {
  expect.assertions(2)

  try {
    await loadFixture('trailing-never')
  } catch (error) {
    expect(error).toMatch(/Found 4 invalid links in 1 file./)

    expect(error).toMatch(
      new RegExp(`▶ test/
  ├─ /unknown
  ├─ /unknown/
  ├─ /guides/example#unknown
  └─ /guides/example/#unknown`),
    )
  }
})

test('should validate links when the `trailingSlash` Astro option is set to `always`', async () => {
  expect.assertions(2)

  try {
    await loadFixture('trailing-always')
  } catch (error) {
    expect(error).toMatch(/Found 4 invalid links in 1 file./)

    expect(error).toMatch(
      new RegExp(`▶ test/
  ├─ /unknown
  ├─ /unknown/
  ├─ /guides/example#unknown
  └─ /guides/example/#unknown`),
    )
  }
})
