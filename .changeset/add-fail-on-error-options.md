---
'starlight-links-validator': minor
---

Add `failOnError` option and `json` reporter to support CI workflows that need the build to succeed while still catching broken links:

- `failOnError`: When set to `false`, the build succeeds even with broken links. Defaults to `true`.
- `reporters.json`: New JSON reporter that writes validation errors to `.starlight-links-validator/errors.json`.
- GitHub Actions output parameter: When `failOnError` is `false` and validation errors are found, the plugin sets a `has_links_validation_errors` step output to `'true'`.
