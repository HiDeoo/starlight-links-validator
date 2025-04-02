---
'starlight-links-validator': minor
---

Adds a new [`sameSitePolicy` option](https://starlight-links-validator.vercel.app/configuration#samesitepolicy) to configure how external links pointing to the same origin as the one configured in the [Astro `site` option](https://docs.astro.build/en/reference/configuration-reference/#site) should be handled.

The current default behavior to ignore all external links remains unchanged. This new option allows to error on such links so they can be rewritten without the origin or to validate them as if they were internal links.
