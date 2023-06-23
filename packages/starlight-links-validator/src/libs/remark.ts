import 'mdast-util-mdx-jsx'

import nodePath from 'node:path'

import { slug } from 'github-slugger'
import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
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

    visit(tree, ['heading', 'link', 'mdxJsxFlowElement'], (node) => {
      // https://github.com/syntax-tree/mdast#nodes
      // https://github.com/syntax-tree/mdast-util-mdx-jsx#nodes
      switch (node.type) {
        case 'heading': {
          const content = toString(node)

          if (content.length === 0) {
            break
          }

          fileHeadings.push(slug(content))

          break
        }
        case 'link': {
          if (isInternalLink(node.url)) {
            fileLinks.push(node.url)
          }

          break
        }
        case 'mdxJsxFlowElement': {
          if (node.name !== 'a') {
            break
          }

          for (const attribute of node.attributes) {
            if (
              attribute.type !== 'mdxJsxAttribute' ||
              attribute.name !== 'href' ||
              typeof attribute.value !== 'string'
            ) {
              continue
            }

            if (isInternalLink(attribute.value)) {
              fileLinks.push(attribute.value)
            }
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

function isInternalLink(link: string) {
  return nodePath.isAbsolute(link) || link.startsWith('#')
}

function normalizeFilePath(filePath?: string) {
  if (!filePath) {
    throw new Error('Missing file path to validate links.')
  }

  return nodePath
    .relative(nodePath.join(process.cwd(), 'src/content/docs'), filePath)
    .replace(/\.\w+$/, '')
    .replace(/index$/, '')
    .replace(/\/?$/, '/')
}

export type Headings = Map<string, string[]>
export type Links = Map<string, string[]>
