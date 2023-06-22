import { isAbsolute, join, relative } from 'node:path'

import { slug } from 'github-slugger'
import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

// All the headings keyed by file path.
const headings: Headings = new Map()
// All the internal links keyed by file path.
const links: Links = new Map()

export const remarkStarlightLinksValidator: Plugin<[], Root> = function () {
  return (tree, file) => {
    const filePath = normalizeFilePath(file.history[0])

    const fileHeadings: string[] = []
    const fileLinks: string[] = []

    visit(tree, ['heading', 'link'], (node) => {
      // https://github.com/syntax-tree/mdast#nodes
      // https://github.com/syntax-tree/mdast-util-mdx-jsx#nodes
      switch (node.type) {
        case 'heading': {
          const content = node.children.find((child) => child.type === 'text')

          if (!content || content.type !== 'text') {
            break
          }

          fileHeadings.push(slug(content.value))

          break
        }
        case 'link': {
          if (isAbsolute(node.url) || node.url.startsWith('#')) {
            fileLinks.push(node.url)
          }

          break
        }
      }
    })

    headings.set(filePath, fileHeadings)
    links.set(filePath, fileLinks)
  }
}

export function getValidationData() {
  return { headings, links }
}

function normalizeFilePath(filePath?: string) {
  if (!filePath) {
    throw new Error('Missing file path to validate links.')
  }

  return relative(join(process.cwd(), 'src/content/docs'), filePath)
    .replace(/\.\w+$/, '')
    .replace(/index$/, '')
    .replace(/\/?$/, '/')
}

export type Headings = Map<string, string[]>
export type Links = Map<string, string[]>
