---
title: Test
---

# Some links

- [External link](https://starlight.astro.build/)

- [External link prefixed with a slash](/https://starlight.astro.build/)

- [Home page](/)

- [Unknown page](/unknown)
- [Unknown page](/unknown/)

- [Unknown page with hash](/unknown#title)
- [Unknown page with hash](/unknown/#title)

- [Draft page](/draft)
- [Draft page](/draft/)

# More links

- [Link to valid hash in this page](#some-links)
- [Link to invalid hash in this page](#links)
- [Link to valid hash in another MDX page](/guides/example/#some-links)
- [Link to invalid hash in another MDX page](/guides/example/#links)
- [Link to invalid asset](/icon.svg)
- [Link to another invalid asset](/guidelines/ui.pdf)

## Links with references

- [Link reference to unknwon page][ref-unknown-page]
- [Link reference to invalid hash][ref-invalid-hash]

[ref-unknown-page]: /unknown-ref
[ref-invalid-hash]: #unknown-ref

<div id="aDiv">
some content

some content

some content

some content

  <a href="#anotherDiv">
    test
  </a>
</div>

## Links to page with custom slug

- [Link to page not using its custom slug](/guides/page-with-custom-slug)
- [Link to page using an invalid custom slug](/release/@pkg/v0.2.0)

## Query strings

- [Home page with query string](/?query=string)

- [Unknown page with query string](/unknown?query=string)
- [Unknown page with query string](/unknown/?query=string)

- [Unknown page with query string and hash](/unknown?query=string#title)
- [Unknown page with query string and hash](/unknown/?query=string#title)

- [Link with query string to valid hash in this page](?query=string#some-links)
- [Link with query string to invalid hash in this page](?query=string#links)
- [Link with query string to valid hash in another MDX page](/guides/example/?query=string#some-links)
- [Link with query string to invalid hash in another MDX page](/guides/example/?query=string#links)
- [Link with query string to invalid asset](/icon.svg?query=string)
- [Link with query string to another invalid asset](/guidelines/ui.pdf?query=string)

- [Link reference with query string to unknwon page][ref-with-query-string-unknown-page]
- [Link reference with query string to invalid hash][ref-with-query-string-invalid-hash]

[ref-with-query-string-unknown-page]: /unknown-ref?query=string
[ref-with-query-string-invalid-hash]: ?query=string#unknown-ref
