---
title: Configuration
---

The Starlight Links Validator plugin can be configured inside the `astro.config.mjs` configuration file of your project:

```js {11}
// astro.config.mjs
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          // Configuration options go here.
        }),
      ],
      title: 'My Docs',
    }),
  ],
})
```

## Configuration options

You can pass the following options to the Starlight Links Validator plugin.

### `errorOnFallbackPages`

**Type:** `boolean`  
**Default:** `true`

Starlight provides [fallback content](https://starlight.astro.build/guides/i18n/#fallback-content) in the default language for all pages that are not available in the current language.

By default, the Starlight Links Validator plugin will error if a link points to a fallback page.
If you do not expect to have all pages translated in all configured locales and want to use the fallback pages feature built-in into Starlight, you should set this option to `false`.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          errorOnFallbackPages: false,
        }),
      ],
    }),
  ],
})
```
