# starlight-links-validator

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