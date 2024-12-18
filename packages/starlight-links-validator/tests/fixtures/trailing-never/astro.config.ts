import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator()],
      title: 'Starlight Links Validator Tests - trailing never',
    }),
  ],
  trailingSlash: 'never',
})
