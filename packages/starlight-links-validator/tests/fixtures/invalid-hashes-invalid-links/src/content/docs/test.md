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

# More links

- [Link to valid hash in this page](#some-links)
- [Link to valid hash in this page (special case)](#_top)
- [Link to invalid hash in this page](#links)
- [Link to valid hash in another MDX page](/guides/example/#some-links)
- [Link to invalid hash in another MDX page](/guides/example/#links)
- [Link to invalid hash in another MDX page (\_top not valid here)](/test/#_top)
- [Link to invalid asset](/icon.svg)
- [Link to another invalid asset](/guidelines/ui.pdf)

## Links with references

- [Link reference to unknown page][ref-unknown-page]
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
