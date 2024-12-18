import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
        es: { label: 'Español', lang: 'es' },
      },
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnInconsistentLocale: true })],
      title: 'Starlight Links Validator Tests - inconsistent locale root',
    }),
  ],
})
