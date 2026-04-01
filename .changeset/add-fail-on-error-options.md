---
'starlight-links-validator': minor
---

Add three new options to control build failure behavior and error output:

- `failOnError`: When set to `false`, the build succeeds even with broken links. Defaults to `true`.
- `writeErrorsToFile`: Controls whether validation errors are written to a JSON file. Defaults to the inverse of `failOnError`.
- `errorsOutputPath`: Configurable path for the JSON error output file. Defaults to `.starlight-links-validator/errors.json`.
