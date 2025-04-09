import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ components: [['CustomLinkFoo', 'link']], errorOnLocalLinks: false })],
      title: 'Starlight Links Validator Tests - valid links',
    }),
  ],
  site: 'https://example.com',
})
