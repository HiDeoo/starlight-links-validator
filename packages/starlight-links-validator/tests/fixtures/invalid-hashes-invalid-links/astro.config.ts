import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnInvalidHashes: false })],
      title: 'Starlight Links Validator Tests - invalid hashes invalid links',
    }),
  ],
})
