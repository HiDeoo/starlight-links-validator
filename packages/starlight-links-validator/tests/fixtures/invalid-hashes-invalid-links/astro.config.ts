import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightLinksValidator({ errorOnInvalidHashes: false })],
      title: 'Starlight Links Validator Tests - invalid hashes invalid links',
    }),
  ],
})
