import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  integrations: [
    starlight({
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      plugins: [starlightLinksValidator({ errorOnFallbackPages: false })],
      title: 'Starlight Links Validator Tests - fallback root invalid links',
    }),
  ],
})
