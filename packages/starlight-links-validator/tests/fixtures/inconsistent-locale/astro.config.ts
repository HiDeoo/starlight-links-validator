import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  integrations: [
    starlight({
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      plugins: [starlightLinksValidator({ errorOnInconsistentLocale: true })],
      title: 'Starlight Links Validator Tests - inconsistent locale',
    }),
  ],
})
