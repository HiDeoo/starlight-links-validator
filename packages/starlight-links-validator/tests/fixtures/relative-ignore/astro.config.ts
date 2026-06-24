import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import type { Root as RehypeRoot } from 'hast'
import type { Root as RemarkRoot } from 'mdast'
import { defineHastPlugin, defineMdastPlugin } from 'satteri'
import starlightLinksValidator from 'starlight-links-validator'
import { visit } from 'unist-util-visit'

import { getMarkdownProcessor } from '../processor'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnRelativeLinks: false })],
      title: 'Starlight Links Validator Tests - relative ignore',
    }),
  ],
  markdown: {
    processor: getMarkdownProcessor({
      satteri: {
        mdastPlugins: [mdastPlugin()],
        hastPlugins: [satteriHastPlugin()],
      },
      unified: {
        remarkPlugins: [remarkPlugin],
        rehypePlugins: [rehypePlugin],
      },
    }),
  },
})

// `./link.md` → `./link.m`
function mdastPlugin() {
  return defineMdastPlugin({
    name: 'mdast-links',
    link(node, ctx) {
      if (!node.url.endsWith('.md')) return
      ctx.setProperty(node, 'url', node.url.replace(/\.md$/, '.m'))
    },
  })
}

// `./link.m` → `/link`
function satteriHastPlugin() {
  return defineHastPlugin({
    name: 'hast-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties['href']
        if (typeof href !== 'string' || !href.endsWith('.m')) return
        ctx.setProperty(node, 'href', href.replace(/^\./, '').replace(/\.m$/, ''))
      },
    },
  })
}

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
