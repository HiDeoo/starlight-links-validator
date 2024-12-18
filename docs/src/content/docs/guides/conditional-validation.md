---
title: Conditional Validation
description: Learn how to run the Starlight Links Validator plugin conditionally to avoid unnecessary cache invalidation.
---

When using the Starlight Links Validator plugin with the [Content Layer API](https://docs.astro.build/en/guides/content-collections), the plugin will automatically invalidate the content layer cache so that all links can be properly validated.
To avoid unnecessary cache invalidation, it is recommended to conditionally use the plugin only when necessary.

## Run the plugin conditionally

By default, when adding the plugin to your Starlight configuration in the [`plugins`](https://starlight.astro.build/reference/configuration/#plugins) array, the plugin will run for every build.

Instead of running the plugin for every build, you can conditionally use the plugin based on an environment variable.
In the following example, the plugin will only run when the `CHECK_LINKS` environment variable is set.

```diff lang="js"
// astro.config.mjs
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
-      plugins: [starlightLinksValidator()],
+      plugins: process.env.CHECK_LINKS ? [starlightLinksValidator()] : [],
      title: 'My Docs',
    }),
  ],
})
```

To run the plugin only when the `CHECK_LINKS` environment variable is set, you can add the following script to your `package.json` file:

```json title="package.json"
{
  "scripts": {
    "linkcheck": "CHECK_LINKS=true astro build"
  }
}
```

The link check script can be used on CI pipelines to validate internal links in a dedicated workflow while deployment builds can skip the link validation step.
