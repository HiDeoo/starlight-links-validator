import type { Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import type { ValidationConfig } from './config'
import { getLinkToValidate, type Link } from './link'
import {
  extractFrontmatterLinks,
  extractRawHeadingsAndLinks,
  getLinksComponents,
  isElementWithClass,
  isElementWithStringProperty,
  isStringAttribute,
  normalizeId,
} from './markdown'
import { getNodeReference } from './position'
import { setValidationData } from './store'

export const rehypeStarlightLinksValidator: Plugin<[ValidationConfig], Root> = function (config) {
  const { base, options, srcDir } = config

  const linkComponents = getLinksComponents(options.components)

  return (tree, file) => {
    const path = file.history[0]

    // If the content does not have a path, e.g. when rendered using the content loader `renderMarkdown()` API, skip it.
    if (!path) return

    if (file.data.astro?.frontmatter?.['draft']) return

    const id = normalizeId(base, srcDir, path)
    const slug: string | undefined =
      typeof file.data.astro?.frontmatter?.['slug'] === 'string' ? file.data.astro.frontmatter['slug'] : undefined

    const fileHeadings: string[] = ['_top']
    const fileLinks: Link[] = []

    extractFrontmatterLinks(file.data.astro?.frontmatter, fileLinks, config)

    visit(tree, ['element', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'raw'], (node) => {
      // https://github.com/syntax-tree/hast#nodes
      // https://github.com/syntax-tree/mdast-util-mdx-jsx#nodes
      switch (node.type) {
        case 'element': {
          if (isElementWithStringProperty(node, 'id')) {
            fileHeadings.push(node.properties['id'])
          }

          if (
            node.tagName !== 'a' ||
            !isElementWithStringProperty(node, 'href') ||
            isElementWithClass(node, 'sl-anchor-link')
          ) {
            break
          }

          const link = getLinkToValidate(node.properties['href'], getNodeReference(node), config)
          if (link) fileLinks.push(link)

          break
        }
        case 'mdxJsxFlowElement': {
          for (const attribute of node.attributes) {
            if (isStringAttribute(attribute, 'id')) fileHeadings.push(attribute.value)
          }

          if (!node.name) break

          const componentProp = linkComponents[node.name]

          if (node.name !== 'a' && !componentProp) break

          for (const attribute of node.attributes) {
            if (!isStringAttribute(attribute, componentProp ?? 'href')) continue

            const link = getLinkToValidate(attribute.value, getNodeReference(node), config)
            if (link) fileLinks.push(link)
          }

          break
        }
        case 'mdxJsxTextElement': {
          for (const attribute of node.attributes) {
            if (isStringAttribute(attribute, 'id')) fileHeadings.push(attribute.value)
          }

          break
        }
        case 'raw': {
          const { headings, links } = extractRawHeadingsAndLinks(node, config)

          fileHeadings.push(...headings)
          fileLinks.push(...links)

          break
        }
      }
    })

    setValidationData({ base, id, slug }, { file: path, headings: fileHeadings, links: fileLinks })
  }
}
