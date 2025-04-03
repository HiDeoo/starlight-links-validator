import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  base: '/test',
  integrations: [
    starlight({
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnFallbackPages: false, sameSitePolicy: 'validate' })],
      title: 'Starlight Links Validator Tests - base path',
    }),
  ],
  site: 'https://example.com',
})
