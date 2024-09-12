---
title: Index
---

# Some links

- [External link](https://starlight.astro.build/)

- [Home page](/)

- [Test page](/test)
- [Test page](/test/)

- [Test page with valid hash](/test#title)
- [Test page with valid hash](/test/#title)

- [Test page with invalid hash](/test#unknown)
- [Test page with invalid hash](/test/#unknown)

# More links

- [Link to valid hash in this page](#some-links)
- [Link to invalid hash in this page](#unknown)
- [Link to valid hash in another MDX page](/guides/example/#some-links)
- [Link to invalid hash in another MDX page](/guides/example/#unknown)

## Links with references

- [Link reference with valid hash in this page][ref-with-valid-hash-internal]
- [Link reference with valid hash in another page][ref-with-valid-hash-external]

- [Link reference with invalid hash in this page][ref-with-invalid-hash-internal]
- [Link reference with invalid hash in another page][ref-with-invalid-hash-external]

[ref-with-valid-hash-internal]: #some-links
[ref-with-valid-hash-external]: /test#title
[ref-with-invalid-hash-internal]: #unknown
[ref-with-invalid-hash-external]: /test#unknown
