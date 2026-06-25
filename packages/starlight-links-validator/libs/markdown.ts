import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { slug as slugger } from 'github-slugger'
import type { Element, Nodes } from 'hast'
import { fromHtml } from 'hast-util-from-html'
import type { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'
import type { Raw } from 'mdast-util-to-hast'
import { visit } from 'unist-util-visit'

import type { StarlightLinksValidatorOptions, ValidationConfig } from './config'
import { isFrontmatterWithPrevNextLink, isFrontmatterWithHeroActions, type Frontmatter } from './frontmatter'
import { getLinkToValidate, type Link } from './link'
import { stripLeadingSlash } from './path'
import { getFrontmatterReference, getNodeReference } from './position'

const builtInLinkComponents: StarlightLinksValidatorOptions['components'] = [
  ['LinkButton', 'href'],
  ['LinkCard', 'href'],
]

export function getLinksComponents(
  userComponents: StarlightLinksValidatorOptions['components'],
): Record<string, string> {
  return Object.fromEntries([...builtInLinkComponents, ...userComponents].map(([name, attribute]) => [name, attribute]))
}

export function isElementWithStringProperty<TName extends string>(
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

export function isElementWithClass(node: Nodes, name: string): boolean {
  if (node.type !== 'element') return false

  if (isElementWithStringProperty(node, 'class')) return node.properties['class'].split(/\s+/).includes(name)
  if (isElementWithStringProperty(node, 'className')) return node.properties['className'].split(/\s+/).includes(name)

  if (Array.isArray(node.properties['className'])) {
    return node.properties['className'].some((value) => typeof value === 'string' && value === name)
  }

  return false
}

export function isStringAttribute<TName extends string>(
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

export function normalizeId(base: string, srcDir: URL, filePath: string) {
  const id = path
    .relative(path.join(fileURLToPath(srcDir), 'content/docs'), filePath)
    .replace(/\.\w+$/, '')
    .replace(/(^|[/\\])index$/, '')
    .replace(/[/\\]?$/, '/')
    .split(/[/\\]/)
    .map((segment) => slugger(segment))
    .join('/')

  if (base !== '/') return path.posix.join(stripLeadingSlash(base), id)

  return id
}

export function extractRawHeadingsAndLinks(rawNode: Raw, config: ValidationConfig) {
  const headings: string[] = []
  const links: Link[] = []

  const tree = fromHtml(rawNode.value, { fragment: true })

  visit(tree, (node: Nodes) => {
    if (isElementWithStringProperty(node, 'id')) {
      headings.push(node.properties.id)
    }

    if (node.type === 'element' && node.tagName === 'a' && isElementWithStringProperty(node, 'href')) {
      const link = getLinkToValidate(node.properties.href, getNodeReference(rawNode, node), config)
      if (link) links.push(link)
    }
  })

  return { headings, links }
}

export function extractFrontmatterLinks(frontmatter: Frontmatter, links: Link[], config: ValidationConfig) {
  if (!frontmatter) return

  if (isFrontmatterWithHeroActions(frontmatter)) {
    for (const [index, action] of frontmatter.hero.actions.entries()) {
      const link = getLinkToValidate(action.link, getFrontmatterReference(['hero', 'actions', index, 'link']), config)
      if (link) links.push(link)
    }
  }

  if (isFrontmatterWithPrevNextLink(frontmatter, 'prev')) {
    const link = getLinkToValidate(frontmatter.prev.link, getFrontmatterReference(['prev', 'link']), config)
    if (link) links.push(link)
  }

  if (isFrontmatterWithPrevNextLink(frontmatter, 'next')) {
    const link = getLinkToValidate(frontmatter.next.link, getFrontmatterReference(['next', 'link']), config)
    if (link) links.push(link)
  }
}

interface MdxStringAttribute<TName extends string> {
  name: TName
  type: 'mdxJsxAttribute'
  value: string
}
