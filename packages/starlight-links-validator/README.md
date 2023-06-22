<div align="center">
  <h1>starlight-links-validator 🦺</h1>
  <p>Astro integration for Starlight to validate internal links.</p>
  <p>
    <a href="https://i.imgur.com/EgiTGeR.png" title="Screenshot of starlight-links-validator">
      <img alt="Screenshot of starlight-links-validator" src="https://i.imgur.com/EgiTGeR.png" width="520" />
    </a>
  </p>
</div>

<div align="center">
  <a href="https://github.com/HiDeoo/starlight-links-validator/actions/workflows/integration.yml">
    <img alt="Integration Status" src="https://github.com/HiDeoo/starlight-links-validator/actions/workflows/integration.yml/badge.svg" />
  </a>
  <a href="https://github.com/HiDeoo/starlight-links-validator/blob/main/LICENSE">
    <img alt="License" src="https://badgen.net/github/license/HiDeoo/starlight-links-validator" />
  </a>
  <br />
</div>

## Features

An [Astro](https://astro.build) integration for [Starlight](https://starlight.astro.build) Starlight to validate **_internal_** links in Markdown and MDX files.

- Validate internal links to other pages
- Validate internal links to anchors in other pages
- Validate internal links to anchors in the same page
- Ignore external links
- Run only during a production build

## Installation

Install the Starlight Links Validator integration using your favorite package manager, e.g. with [pnpm](https://pnpm.io):

```shell
pnpm add starlight-links-validator
```

Update your [Astro configuration](https://docs.astro.build/en/guides/configuring-astro/#supported-config-file-types) to include the Starlight Links Validator integration **_before_** the Starlight integration:

```diff
  import starlight from '@astrojs/starlight'
  import { defineConfig } from 'astro/config'
+ import starlightLinksValidator from 'starlight-links-validator'

  export default defineConfig({
    // …
    integrations: [
+     starlightLinksValidator(),
      starlight({
        sidebar: [
          {
            label: 'Guides',
            items: [{ label: 'Example Guide', link: '/guides/example/' }],
          },
        ],
        title: 'My Docs',
      }),
    ],
  })
```

## License

Licensed under the MIT License, Copyright © HiDeoo.

See [LICENSE](https://github.com/HiDeoo/starlight-links-validator/blob/main/LICENSE) for more information.
