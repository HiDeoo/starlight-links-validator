import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should ignore relative links when the `errorOnRelativeLinks` option is set to `false`', async () => {
  expect.assertions(2)

  try {
    await loadFixture('relative-ignore')
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
