import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnInvalidHashes: true })],
      title: 'Starlight Links Validator Tests - top hash always valid',
    }),
  ],
})
