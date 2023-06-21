import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const links = new Set<string>()
const filesWithHeadingSlugsMap = new Map<string, string[]>()

export const remarkStarlightLinksValidator: Plugin<[], Root> = function () {
  return (tree, file) => {
    const filePath = file.history[0]

    if (!filePath) {
      throw new Error('Missing file path to validate links.')
    }

    const headings: string[] = []

    visit(tree, ['heading', 'link'], (node) => {
      // https://github.com/syntax-tree/mdast#nodes
      // https://github.com/syntax-tree/mdast-util-mdx-jsx#nodes
      switch (node.type) {
        case 'heading': {
          const heading = node.children.find((child) => child.type === 'text')

          if (!heading || heading.type !== 'text') {
            break
          }

          // TODO(HiDeoo) slugify heading
          headings.push(heading.value)

          break
        }
        case 'link': {
          links.add(node.url)
          break
        }
      }
    })

    filesWithHeadingSlugsMap.set(filePath, headings)
  }
}

export function getValidationData() {
  return { files: filesWithHeadingSlugsMap, links }
}
