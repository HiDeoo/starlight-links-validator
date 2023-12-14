import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  base: '/test',
  integrations: [
    starlight({
      plugins: [starlightLinksValidator()],
      title: 'Starlight Links Validator Tests - trailing always',
    }),
  ],
})
