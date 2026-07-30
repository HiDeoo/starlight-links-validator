---
'starlight-links-validator': patch
---

Fixes redirect validation with a custom `base` and a crash when building with the Bun runtime.

Redirect routes were recorded without the `base` prefix while links are validated with it, so a link to a redirect was reported as invalid in a project setting the `base` Astro option.
Resolving the base also relied on `import.meta.env.BASE_URL`, which is `process.env.BASE_URL` under Bun and therefore `undefined`, crashing the build with `undefined is not an object (evaluating 'path.replace')` as soon as a project defined any redirect.
