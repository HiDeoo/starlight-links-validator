import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnFallbackPages: false })],
      title: 'Starlight Links Validator Tests - fallback root valid links',
    }),
  ],
})
