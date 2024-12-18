# starlight-links-validator

## 0.14.0

### Minor Changes

- [#77](https://github.com/HiDeoo/starlight-links-validator/pull/77) [`486a379`](https://github.com/HiDeoo/starlight-links-validator/commit/486a379c5bda40584126c376e14a3c82c23bd449) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for Astro v5, drops support for Astro v4.

  ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now `0.30.0`.

  Please follow the [upgrade guide](https://github.com/withastro/starlight/releases/tag/%40astrojs/starlight%400.30.0) to update your project.

  When using the plugin with the [Content Layer API](https://docs.astro.build/en/guides/content-collections), the plugin will now automatically invalidate the content layer cache so that all links can be properly validated. To avoid unnecessary cache invalidation, it is recommended to conditionally use the plugin only when necessary. Check out the new [“Conditional Validation”](https://starlight-links-validator.vercel.app/guides/conditional-validation/) guide for more information.

  ⚠️ **BREAKING CHANGE:** Due to a [regression](https://github.com/withastro/astro/issues/12778) in Astro v5, links to pages with [custom IDs/slugs](https://docs.astro.build/en/guides/content-collections/#defining-custom-ids) can no longer be validated and will be flagged as invalid. If you rely on this feature, please stay on a previous version of Starlight and Astro in the meantime.
