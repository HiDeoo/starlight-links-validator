---
title: Test
---

# Some links

- [External link](https://starlight.astro.build/)

- [Home page](/)

- [Unknown page](/unknown)
- [Unknown page](/unknown/)

- [Unknown page with hash](/unknown#title)
- [Unknown page with hash](/unknown/#title)

# More links

- [Link to valid anchor in this page](#some-links)
- [Link to invalid anchor in this page](#links)
- [Link to valid anchor in another MDX page](/guides/example/#some-links)
- [Link to invalid anchor in another MDX page](/guides/example/#links)
- [Link to invalid asset](/icon.svg)
- [Link to another invalid asset](/guidelines/ui.pdf)

## Links with references

- [Link reference to unknwon page][ref-unknown-page]
- [Link reference to invalid anchor][ref-invalid-anchor]

[ref-unknown-page]: /unknown-ref
[ref-invalid-anchor]: #unknown-ref

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
