import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [
        starlightLinksValidator({
          exclude: ({ link }) => {
            // /excluded
            // /excluded?something
            return /^\/excluded(?:$|\?)/.test(link)
          },
        }),
      ],
      title: 'Starlight Links Validator Tests - exclude',
    }),
  ],
})
