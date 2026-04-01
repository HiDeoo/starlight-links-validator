---
'starlight-links-validator': minor
---

Add `failOnError`, `writeErrorsToFile`, and `errorsOutputPath` options to control build failure behavior and error output. When `failOnError` is set to `false`, the build succeeds even with broken links, and validation errors are written to a JSON file for CI consumption.
