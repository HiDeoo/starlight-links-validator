import { expect, test } from 'vitest'

import { buildFixture } from './utils'

/**
 * When there is markup in a heading, Astro to renders the heading elements with an id
 * that matches the textContent of the heading (excluding the text content of the inner markup elements)
 * and then it lowercase & kebabizes it and removes trailing hyphens (but not leading hyphens!)
 *
 * We use GitHub Slugger to convert the remark heading node string content to a slug.
 * Since that util does not remove trailing hyphens, we do so to close the gap with the Astro MD to html renderer
 *
 * This means Astro sluggifies `## Heading <Foo>` as "heading" for the id attr, but GitHub sluggers renders it as "heading-"
 */
test('validates links using anchors that refer to headings that contain markup', async () => {
  const { status } = await buildFixture('markup-in-heading')

  expect(status).toBe('success')
})
