---
'starlight-links-validator': minor
---

Ignores query strings when checking for [excluded links](https://starlight-links-validator.vercel.app/configuration#exclude).

Previously, to exclude links with query strings, you may have needed to rely on fairly loose glob patterns, e.g. `/playground/**` to exclude `/playground/`, `/playground/?id=foo` and `/playground/?id=bar`. With this change, excluding `/playground/` will ignore all query strings, so `/playground/`, `/playground/?id=foo` and `/playground/?id=bar` will all be excluded.
