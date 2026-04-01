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
If not invalid, such links can be confusing for users as they will move the user to a different locale.

By default, the Starlight Links Validator plugin will not error if a link points to a different locale.
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

Relative internal links, such as `./test` or `../test`, are usually considered confusing because they can be difficult to reason about, figure out where they point to and require more maintenance when a page is moved.

By default, the Starlight Links Validator plugin will error if a relative internal link is found.
If you prefer to ignore relative links instead of erroring on them, you can set this option to `false` but note that these links will not be validated.

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

By default, the Starlight Links Validator plugin will error if an internal link points to a [hash fragment](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) that does not exist in the target page.
If you want to only validate that pages exist but ignore hashes, you can set this option to `false`.

This option should be used with caution but can be useful in large documentation with many contributors where keeping hashes fully up to date may be difficult, and hash validation may happen on a different schedule, for example once a week.

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

By default, the Starlight Links Validator plugin will error on local links, e.g. URLs with the `localhost` or `127.0.0.1` hostname, as they are usually intended only for development and should not be present in production content.
If you prefer to ignore local links instead of erroring on them, you can set this option to `false`.

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

The `sameSitePolicy` option provides more granular control over how external links are handled when they point to the same [origin](https://developer.mozilla.org/en-US/docs/Web/API/URL/origin) as the one configured in the [Astro `site` configuration option](https://docs.astro.build/en/reference/configuration-reference/#site).

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

### `failOnError`

**Type:** `boolean`  
**Default:** `true`

Defines whether the plugin should error when validation fails.

By default, the Starlight Links Validator plugin will throw an error and fail the build when validation errors are found. Set this option to `false` to allow the build to succeed even with validation errors.

When `failOnError` is set to `false` and validation errors exist, by default errors will be written to `.starlight-links-validator/errors.json`. See [`writeErrorsToFile`](#writeerrorstofile) to control this behavior.

```js {6}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          failOnError: false,
        }),
      ],
    }),
  ],
})
```

This option is useful for CI workflows where you want to build and deploy a preview even with broken links, but fail the PR merge check in a subsequent step.

### `writeErrorsToFile`

**Type:** `boolean`  
**Default:** `!failOnError`

Defines whether the plugin should write validation errors to a JSON file.

By default, this option is set to the inverse of `failOnError`. This means:

- When `failOnError: true` (default), errors are not written to a file
- When `failOnError: false`, errors are written to a file

You can explicitly set this option to `true` or `false` to override the default behavior:

```js {7}
// Fail the build AND write errors to file
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          failOnError: true,
          writeErrorsToFile: true,
        }),
      ],
    }),
  ],
})
```

```js {7}
// Don't fail, but also don't write errors to file
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          failOnError: false,
          writeErrorsToFile: false,
        }),
      ],
    }),
  ],
})
```

When enabled, errors are written to the path specified by [`errorsOutputPath`](#errorsoutputpath).

### `errorsOutputPath`

**Type:** `string`  
**Default:** `'.starlight-links-validator/errors.json'`

Defines the path where validation errors are written when [`writeErrorsToFile`](#writeerrorstofile) is enabled.

Can be an absolute path or relative to the project root.

```js {7}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          failOnError: false,
          errorsOutputPath: './ci-output/broken-links.json',
        }),
      ],
    }),
  ],
})
```

The output file contains a JSON object with the full validation report, including:

- `errorCount`: Total number of validation errors
- `files`: Array of files with broken links
- `hasErrors`: Boolean indicating if any errors were found
- `hasInvalidLinkToCustomPage`: Boolean indicating if any errors are links to custom pages

### `reporters`

**Type:** `{ githubActions: boolean }`  
**Default:** `{ githubActions: true }`

Configures additional reporters for the plugin.

#### `githubActions`

**Type:** `boolean`  
**Default:** `true`

Defines whether the GitHub Actions reporter is enabled.

When enabled and the plugin runs in GitHub Actions, validation errors are written to the [job summary](https://github.blog/news-insights/product-news/supercharging-github-actions-with-job-summaries/) as a Markdown table.

```js {7}
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLinksValidator({
          reporters: {
            githubActions: false,
          },
        }),
      ],
    }),
  ],
})
```
