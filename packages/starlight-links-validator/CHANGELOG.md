# starlight-links-validator

## 0.15.0

### Minor Changes

- [#93](https://github.com/HiDeoo/starlight-links-validator/pull/93) [`6d7174b`](https://github.com/HiDeoo/starlight-links-validator/commit/6d7174bcc6a2bb39f287a50bbdda29a6af4c16c8) Thanks [@HiDeoo](https://github.com/HiDeoo)! - ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now version `0.32.0`.

  Please use the `@astrojs/upgrade` command to upgrade your project:

  ```sh
  npx @astrojs/upgrade
  ```

- [#100](https://github.com/HiDeoo/starlight-links-validator/pull/100) [`b238cb7`](https://github.com/HiDeoo/starlight-links-validator/commit/b238cb7bd3db5f8fe848c317ba52d5ab44eb853e) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds a new [`sameSitePolicy` option](https://starlight-links-validator.vercel.app/configuration#samesitepolicy) to configure how external links pointing to the same origin as the one configured in the [Astro `site` option](https://docs.astro.build/en/reference/configuration-reference/#site) should be handled.

  The current default behavior to ignore all external links remains unchanged. This new option allows to error on such links so they can be rewritten without the origin or to validate them as if they were internal links.

- [#100](https://github.com/HiDeoo/starlight-links-validator/pull/100) [`b238cb7`](https://github.com/HiDeoo/starlight-links-validator/commit/b238cb7bd3db5f8fe848c317ba52d5ab44eb853e) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds a new [`components`](https://starlight-links-validator.vercel.app/configuration#components) option to define additional components and their props to validate as links on top of the built-in `<LinkButton>` and `<LinkCard>` Starlight components.

### Patch Changes

- [#99](https://github.com/HiDeoo/starlight-links-validator/pull/99) [`56ea78c`](https://github.com/HiDeoo/starlight-links-validator/commit/56ea78cefa40f554f88a32181daae1a82ec2fa9a) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes validation issue with the [Astro `base` option](https://docs.astro.build/en/reference/configuration-reference/#base) and the [`errorOnFallbackPages` plugin option](https://starlight-links-validator.vercel.app/configuration#erroronfallbackpages) set to `false` in a multilingual project.

## 0.14.3

### Patch Changes

- [#91](https://github.com/HiDeoo/starlight-links-validator/pull/91) [`1ef31b8`](https://github.com/HiDeoo/starlight-links-validator/commit/1ef31b81e7c5321a7481df6111d9161c4608fd4e) Thanks [@DaniFoldi](https://github.com/DaniFoldi)! - Moves `mdast-util-mdx-jsx` package to non-dev dependencies to prevent issues in monorepos with hoisting disabled.

## 0.14.2

### Patch Changes

- [#85](https://github.com/HiDeoo/starlight-links-validator/pull/85) [`57fdb1b`](https://github.com/HiDeoo/starlight-links-validator/commit/57fdb1b2f85f023e4b053480fd9ea5adb69a9e2a) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Improves error message for invalid links to custom pages.

## 0.14.1

### Patch Changes

- [#82](https://github.com/HiDeoo/starlight-links-validator/pull/82) [`b3cbee8`](https://github.com/HiDeoo/starlight-links-validator/commit/b3cbee83fb54f5bd6dd06b01bb8397758c081752) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes regresion introduced in version [`0.14.0`](https://github.com/HiDeoo/starlight-links-validator/releases/tag/starlight-links-validator%400.14.0) of the plugin regarding validation of links to pages with [custom IDs/slugs](https://docs.astro.build/en/guides/content-collections/#defining-custom-ids).

  Note that you must use at least Astro version [`5.1.1`](https://github.com/withastro/astro/releases/tag/astro%405.1.1) to benefit from this fix.

- [#80](https://github.com/HiDeoo/starlight-links-validator/pull/80) [`876cb50`](https://github.com/HiDeoo/starlight-links-validator/commit/876cb5094d10a56a1be04b7cdc27e4f89fb1b681) Thanks [@lukekarrys](https://github.com/lukekarrys)! - Fixes validation issues for pages ending in `index`, e.g. `module_index`.

## 0.14.0

### Minor Changes

- [#77](https://github.com/HiDeoo/starlight-links-validator/pull/77) [`486a379`](https://github.com/HiDeoo/starlight-links-validator/commit/486a379c5bda40584126c376e14a3c82c23bd449) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for Astro v5, drops support for Astro v4.

  ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now `0.30.0`.

  Please follow the [upgrade guide](https://github.com/withastro/starlight/releases/tag/%40astrojs/starlight%400.30.0) to update your project.

  When using the plugin with the [Content Layer API](https://docs.astro.build/en/guides/content-collections), the plugin will now automatically invalidate the content layer cache so that all links can be properly validated. To avoid unnecessary cache invalidation, it is recommended to conditionally use the plugin only when necessary. Check out the new [“Conditional Validation”](https://starlight-links-validator.vercel.app/guides/conditional-validation/) guide for more information.

  ⚠️ **BREAKING CHANGE:** Due to a [regression](https://github.com/withastro/astro/issues/12778) in Astro v5, links to pages with [custom IDs/slugs](https://docs.astro.build/en/guides/content-collections/#defining-custom-ids) can no longer be validated and will be flagged as invalid. If you rely on this feature, please stay on a previous version of Starlight and Astro in the meantime.
