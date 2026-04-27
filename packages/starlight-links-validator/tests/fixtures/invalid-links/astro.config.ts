import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ components: [['CustomLink', 'link']], sameSitePolicy: 'error' })],
      title: 'Starlight Links Validator Tests - invalid links',
    }),
  ],
  redirects: {
    '/redirect-test/': '/test/',
    '/redirect-custom-page/': '/custom-page/',
    '/redirect-custom-dynamic/[...param]': '/custom-dynamic-page/[...param]',
    '/redirect-unknown/': '/unknown/',
  },
})
