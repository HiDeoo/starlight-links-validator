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
  redirects: {
    '/redirect-external/': 'https://starlight.astro.build/',
    '/redirect-test/': '/test/',
  },
  site: 'https://example.com',
})
