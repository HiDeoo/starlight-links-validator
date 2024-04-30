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

### `errorOnInconsistentLocale`

**Type:** `boolean`  
**Default:** `false`

When translating a page in multilingual websites, forgetting to update a link to point to the same language is a common mistake.
If not invalid, such links can be confusing for users as they will move the user from their current language to another one.

By default, the Starlight Links Validator plugin will not error if a link points to a page in another locale.
If you want to prevent such links, you can set this option to `true`.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          errorOnInconsistentLocale: true,
        }),
      ],
    }),
  ],
})
```

### `errorOnRelativeLinks`

**Type:** `boolean`  
**Default:** `true`

Relative internal links, such as `./test` or `../test`, are usually considered confusing as they can be difficult to reason about, figure out where they point to and require more maintenance when a page is moved.

By default, the Starlight Links Validator plugin will error if a relative internal link is found.
If you want to allow relative internal links, you can set this option to `false` but note that theses links will not be validated.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false,
        }),
      ],
    }),
  ],
})
```

### `exclude`

**Type:** `string[]`  
**Default:** `[]`

A list of links that should be excluded from validation.

The links in this list must exactly match links as they appear in Markdown and will be ignored by the plugin.

This option should be used with caution but can be useful to exclude links that are not meant to be validated like redirects only existing in production or links to [custom pages](https://starlight.astro.build/guides/pages/#custom-pages) that are not part of your documentation.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          exclude: ['/social/discord', '/social/twitter'],
        }),
      ],
    }),
  ],
})
```
