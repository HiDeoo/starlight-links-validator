---
'starlight-links-validator': minor
---

Adds support for [excluding](https://starlight-links-validator.vercel.app/configuration#exclude) links from validation using a function.

When using the function syntax, the function should return `true` for any link that should be excluded from validation or `false` otherwise. The function will be called for each link to validate and will receive an object containing various properties to help determine whether to exclude the link or not.

Check out the [`exclude` configuration option](https://starlight-links-validator.vercel.app/configuration#exclude) documentation for more details and examples.
