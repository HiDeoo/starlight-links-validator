import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import type { Root as RehypeRoot } from 'hast'
import type { Root as RemarkRoot } from 'mdast'
import starlightLinksValidator from 'starlight-links-validator'
import { visit } from 'unist-util-visit'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnRelativeLinks: false })],
      title: 'Starlight Links Validator Tests - relative ignore',
    }),
  ],
  markdown: {
    remarkPlugins: [remarkPlugin],
    rehypePlugins: [rehypePlugin],
  },
})

// `./link.md` → `./link.m`
function remarkPlugin() {
  return function transformer(tree: RemarkRoot) {
    visit(tree, ['link'], (node) => {
      if (node.type !== 'link' || !node.url.endsWith('.md')) return
      node.url = node.url.replace(/\.md$/, '.m')
    })
  }
}

// `./link.m` → `/link`
function rehypePlugin() {
  return function transformer(tree: RehypeRoot) {
    visit(tree, ['element'], (node) => {
      if (
        node.type !== 'element' ||
        node.tagName !== 'a' ||
        typeof node.properties['href'] !== 'string' ||
        !node.properties['href'].endsWith('.m')
      ) {
        return
      }
      node.properties['href'] = node.properties['href'].replace(/^\./, '').replace(/\.m$/, '')
    })
  }
}
