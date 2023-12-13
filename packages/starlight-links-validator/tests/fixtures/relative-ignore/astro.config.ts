import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightLinksValidator({ errorOnRelativeLinks: false })],
      title: 'Starlight Links Validator Tests - relative ignore',
    }),
  ],
})
