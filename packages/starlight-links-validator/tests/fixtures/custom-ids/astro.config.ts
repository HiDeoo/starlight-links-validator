import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import remarkCustomHeadingId from 'remark-custom-heading-id'
import starlightLinksValidator from 'starlight-links-validator'

import { getMarkdownProcessor } from '../processor'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator()],
      title: 'Starlight Links Validator Tests - custom ids',
    }),
  ],
  markdown: {
    processor: getMarkdownProcessor({
      satteri: {
        features: { headingAttributes: true },
      },
      unified: {
        remarkPlugins: [remarkCustomHeadingId],
      },
    }),
  },
})
