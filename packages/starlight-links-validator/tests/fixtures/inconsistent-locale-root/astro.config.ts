import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  integrations: [
    starlight({
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
        es: { label: 'Español', lang: 'es' },
      },
      plugins: [starlightLinksValidator({ errorOnInconsistentLocale: true })],
      title: 'Starlight Links Validator Tests - inconsistent locale root',
    }),
  ],
})
