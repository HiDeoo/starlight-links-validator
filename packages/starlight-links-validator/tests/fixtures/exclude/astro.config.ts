import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightLinksValidator({ exclude: ['/excluded'] })],
      title: 'Starlight Links Validator Tests - exclude',
    }),
  ],
})
