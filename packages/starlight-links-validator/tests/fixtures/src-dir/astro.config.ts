import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import starlightLinksValidator from '../..'

export default defineConfig({
  srcDir: './',
  integrations: [
    starlight({
      plugins: [starlightLinksValidator()],
      title: 'Starlight Links Validator Tests - custom srcDir',
    }),
  ],
})
