import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

import { slug as slugger } from 'github-slugger'
import type { Element, Nodes, Root } from 'hast'
import { fromHtml } from 'hast-util-from-html'
import type { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import type { StarlightLinksValidatorOptions, ValidationConfig } from './config'
import { isFrontmatterWithPrevNextLink, isFrontmatterWithHeroActions, type Frontmatter } from './frontmatter'
import { getLinkToValidate, type Link } from './link'
import { ensureTrailingSlash, stripLeadingSlash } from './path'
import { getFrontmatterReference, getNodeReference } from './position'
import { setValidationData } from './store'

const builtInComponents: StarlightLinksValidatorOptions['components'] = [
  ['LinkButton', 'href'],
  ['LinkCard', 'href'],
]

export const rehypeStarlightLinksValidator: Plugin<[ValidationConfig], Root> = function (config) {
  const { base, options, srcDir } = config

  const linkComponents: Record<string, string> = Object.fromEntries(
    [...builtInComponents, ...options.components].map(([name, attribute]) => [name, attribute]),
  )

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
          if (hasStringProperty(node, 'id')) {
            fileHeadings.push(node.properties['id'])
          }

          if (node.tagName !== 'a' || !hasStringProperty(node, 'href') || hasClass(node, 'sl-anchor-link')) break

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
          const htmlTree = fromHtml(node.value, { fragment: true })

          visit(htmlTree, (htmlNode: Nodes) => {
            if (hasStringProperty(htmlNode, 'id')) {
              fileHeadings.push(htmlNode.properties.id)
            }

            if (htmlNode.type === 'element' && htmlNode.tagName === 'a' && hasStringProperty(htmlNode, 'href')) {
              const link = getLinkToValidate(htmlNode.properties.href, getNodeReference(node, htmlNode), config)
              if (link) fileLinks.push(link)
            }
          })

          break
        }
      }
    })

    setValidationData(getValidationDataId(base, id, slug), {
      file: path,
      headings: fileHeadings,
      links: fileLinks,
    })
  }
}

function getValidationDataId(base: string, id: string, slug: string | undefined) {
  if (slug) return nodePath.posix.join(stripLeadingSlash(base), stripLeadingSlash(ensureTrailingSlash(slug)))

  return id
}

function normalizeId(base: string, srcDir: URL, filePath: string) {
  const path = nodePath
    .relative(nodePath.join(fileURLToPath(srcDir), 'content/docs'), filePath)
    .replace(/\.\w+$/, '')
    .replace(/(^|[/\\])index$/, '')
    .replace(/[/\\]?$/, '/')
    .split(/[/\\]/)
    .map((segment) => slugger(segment))
    .join('/')

  if (base !== '/') return nodePath.posix.join(stripLeadingSlash(base), path)

  return path
}

function hasStringProperty<TName extends string>(
  node: Nodes,
  name: TName,
): node is Element & { properties: Element['properties'] & Record<TName, string> } {
  return (
    node.type === 'element' &&
    node.properties[name] !== undefined &&
    typeof node.properties[name] === 'string' &&
    node.properties[name].length > 0
  )
}

function isStringAttribute<TName extends string>(
  attribute: MdxJsxAttribute | MdxJsxExpressionAttribute,
  name: TName,
): attribute is MdxStringAttribute<TName> {
  return (
    attribute.type === 'mdxJsxAttribute' &&
    attribute.name === name &&
    typeof attribute.value === 'string' &&
    attribute.value.length > 0
  )
}

function hasClass(node: Nodes, name: string): boolean {
  if (node.type !== 'element') return false

  if (hasStringProperty(node, 'class')) return node.properties['class'].split(/\s+/).includes(name)
  if (hasStringProperty(node, 'className')) return node.properties['className'].split(/\s+/).includes(name)

  if (Array.isArray(node.properties['className'])) {
    return node.properties['className'].some((value) => typeof value === 'string' && value === name)
  }

  return false
}

function extractFrontmatterLinks(frontmatter: Frontmatter, fileLinks: Link[], config: ValidationConfig) {
  if (!frontmatter) return

  if (isFrontmatterWithHeroActions(frontmatter)) {
    for (const [index, action] of frontmatter.hero.actions.entries()) {
      const link = getLinkToValidate(action.link, getFrontmatterReference(['hero', 'actions', index, 'link']), config)
      if (link) fileLinks.push(link)
    }
  }

  if (isFrontmatterWithPrevNextLink(frontmatter, 'prev')) {
    const link = getLinkToValidate(frontmatter.prev.link, getFrontmatterReference(['prev', 'link']), config)
    if (link) fileLinks.push(link)
  }

  if (isFrontmatterWithPrevNextLink(frontmatter, 'next')) {
    const link = getLinkToValidate(frontmatter.next.link, getFrontmatterReference(['next', 'link']), config)
    if (link) fileLinks.push(link)
  }
}

interface MdxStringAttribute<TName extends string> {
  name: TName
  type: 'mdxJsxAttribute'
  value: string
}
