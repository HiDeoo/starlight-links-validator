---
title: Index
---

# Some links

- [External link](https://starlight.astro.build/)

- [Home page](/)

- [Test page](/test)
- [Test page](/test/)

- [Test page with hash](/test#title)
- [Test page with hash](/test/#title)

- [Test page with duplicated hash](/test#title-1)

- [An MDX nested page](/guides/example)
- [An MDX nested page](/guides/example/)

# More links

- [Link to anchor in this page](#some-links)
- [Link to anchor in another MDX page](/guides/example/#some-links)
- [Link to an asset](/favicon.svg)
- [Link to another asset](/guidelines/dummy.pdf)

## A more `complex` heading

- [Link to more complex anchor](#a-more-complex-heading)

## Links with references

- [ref]
- [Link reference][ref]
- [Link reference with anchor in this page][ref-with-anchor-internal]
- [Link reference with anchor in another page][ref-with-anchor-external]

[ref]: /test
[ref-with-anchor-internal]: #some-links
[ref-with-anchor-external]: /test#title

## Link to page with custom slug

- [A page with custom slug](/release/@pkg/v0.1.0)
