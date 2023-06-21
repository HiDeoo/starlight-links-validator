import { expect, test } from 'vitest'

import { loadFixture } from './utils'

// FIXME(HiDeoo)
test('should build with no links', async () => {
  await expect(loadFixture('no-links')).resolves.not.toThrow()
})

// FIXME(HiDeoo)
test('should not build with links', async () => {
  await expect(loadFixture('with-links')).rejects.toThrow(/Found 1 broken links\./)
})
