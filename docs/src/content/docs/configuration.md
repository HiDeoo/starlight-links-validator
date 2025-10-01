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

### `components`

**Type:** `[component: string, prop: string][]`  
**Default:** `[]`

Defines a list of additional components and their props that should be validated as links.

By default, the Starlight Links Validator plugin will validate links defined in the `href` prop of the [`<LinkButton>`](https://starlight.astro.build/components/link-buttons/) and [`<LinkCard>`](https://starlight.astro.build/components/link-cards/) built-in Starlight components.
Adding custom components to this list will allow the plugin to validate links in those components as well.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          components: [['CustomLink', 'url']],
        }),
      ],
    }),
  ],
})
```

The example above will validate links in Starlight built-in components and also in the `url` prop of the `<CustomLink>` component.

```mdx title="src/content/docs/example.mdx"
<CustomLink url="/test/" />
```

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

### `errorOnInvalidHashes`

**Type:** `boolean`  
**Default:** `true`

By default, the Starlight Links Validator plugin will error if an internal link points to an [hash](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) that does not exist in the target page.
If you want to only validate that pages exist but ignore hashes, you can set this option to `false`.

This option should be used with caution but can be useful in large documentation with many contributors where hashes always being up-to-date can be difficult to maintain and validated on a different schedule, e.g. once a week.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          errorOnInvalidHashes: false,
        }),
      ],
    }),
  ],
})
```

### `errorOnLocalLinks`

**Type:** `boolean`  
**Default:** `true`

By default, the Starlight Links Validator plugin will error on local links, e.g. URLs with a hostname of `localhost` or `127.0.0.1`, as they are usually used for development purposes and should not be present in production.
If you want to allow such links, you can set this option to `false`.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          errorOnLocalLinks: false,
        }),
      ],
    }),
  ],
})
```

### `exclude`

**Type:** `string[] | ((infos: { file: string, link: string, slug: string }) => boolean)`
**Default:** `[]`

A list of links or [glob patterns](https://github.com/micromatch/picomatch#globbing-features) that should be excluded from validation.
For more advanced use cases, a function can also be provided to dynamically determine whether a link should be excluded or not.

This option should be used with caution but can be useful to exclude links that are not meant to be validated like redirects only existing in production or links to [custom pages](https://starlight.astro.build/guides/pages/#custom-pages) that are automatically generated or not part of your documentation.

The following example uses glob patterns to exclude links to the `/social/twitter` page, all links to any pages in the `/api/interface/` and `/api/functions/` directories, and all links to the `/changelog` page, no matter if a trailing slash is used or not, and also all links to any pages in the `/changelog/` directory:

```js {6-16}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          exclude: [
            // Exclude links to the `/social/twitter` page.
            '/social/twitter',
            // Exclude all links to any pages in the `/api/interface/`
            // and `/api/functions/` directories.
            '/api/{interface,functions}/**/*',
            // Exclude all links to the `/changelog` page, no matter if a
            // trailing slash is used or not, and also exclude all links to
            // any pages in the `/changelog/` directory.
            '/changelog{,/**/*}',
          ],
        }),
      ],
    }),
  ],
})
```

:::tip

You can use this [webpage](https://www.digitalocean.com/community/tools/glob) to generate and test glob patterns.

:::

When using the function syntax, the function should return `true` for any link that should be excluded from validation or `false` otherwise.
The function will be called for each link to validate and will receive an object with the following properties as the first argument:

- `file` — The absolute path to the file where the link is defined.
- `link` — The link to validate as authored in the content.
- `slug` — The slug of the page where the link is defined.

The following example will exclude all links starting with `/secret/` from validation using a function:

```js {6-8}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          exclude: ({ link }) => {
            return link.startsWith('/secret/')
          },
        }),
      ],
    }),
  ],
})
```

### `sameSitePolicy`

**Type:** `'error' | 'ignore' | 'validate'`  
**Default:** `'ignore'`

By default, the Starlight Links Validator plugin will ignore all external links, e.g. links starting with `http://` or `https://`, and will not validate them.

The `sameSitePolicy` option provide a more granular control over how external links are handled when they point to the same [origin](https://developer.mozilla.org/en-US/docs/Web/API/URL/origin) as the one configured in the [Astro `site` configuration option](https://docs.astro.build/en/reference/configuration-reference/#site).

- `ignore`: Ignore all external links and do not validate them.
- `error`: Error on external links with an origin matching the Astro `site` configuration option and hint that the link can be rewritten without the origin.
- `validate`: Validate external links with an origin matching the Astro `site` configuration option as if they were internal links.

Other external links having a different origin will be ignored.

The following configuration will error on the `https://example.com/test/` external link and hint that it can be rewritten as `/test/`:

```js {6,11}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          sameSitePolicy: 'error',
        }),
      ],
    }),
  ],
  site: 'https://example.com',
})
```

The following configuration will validate the `https://example.com/test/` external link as if it was written as `/test/`:

```js {6,11}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          sameSitePolicy: 'validate',
        }),
      ],
    }),
  ],
  site: 'https://example.com',
})
```
