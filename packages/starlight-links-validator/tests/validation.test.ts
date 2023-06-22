import { expect, test } from 'vitest'

import { loadFixture } from './utils'

test('should build with no links', async () => {
  await expect(loadFixture('no-links')).resolves.not.toThrow()
})

test('should build with valid links', async () => {
  await expect(loadFixture('with-valid-links')).resolves.not.toThrow()
})

test('should not build with invalid links', async () => {
  await expect(loadFixture('with-invalid-links')).rejects.toThrow(
    new RegExp(`Found 6 invalid links in 1 file.

▶ test/
  ├─ /
  ├─ /unknown
  ├─ /unknown/
  ├─ /unknown#title
  ├─ /unknown/#title
  └─ #links`)
  )
})
