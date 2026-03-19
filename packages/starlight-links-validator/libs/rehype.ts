import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AstroConfig } from 'astro'
import { slug as slugger } from 'github-slugger'
import type { Element, Nodes, Root } from 'hast'
import { fromHtml } from 'hast-util-from-html'
import isAbsoluteUrl from 'is-absolute-url'
import type { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import type { DataMap } from 'vfile'

import type { StarlightLinksValidatorOptions } from './config'
import { ensureTrailingSlash, stripLeadingSlash } from './path'
import { ValidationErrorType } from './validation'

const builtInComponents: StarlightLinksValidatorOptions['components'] = [
  ['LinkButton', 'href'],
  ['LinkCard', 'href'],
]

// All the validation data keyed by file path.
const data: ValidationData = new Map()

export const rehypeStarlightLinksValidator: Plugin<[RehypeStarlightLinksValidatorConfig], Root> = function (config) {
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

          if (node.tagName !== 'a' || !hasStringProperty(node, 'href')) {
            break
          }

          const link = getLinkToValidate(node.properties['href'], config)
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

            const link = getLinkToValidate(attribute.value, config)
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
              const link = getLinkToValidate(htmlNode.properties.href, config)
              if (link) fileLinks.push(link)
            }
          })

          break
        }
      }
    })

    data.set(getValidationDataId(base, id, slug), {
      file: path,
      headings: fileHeadings,
      links: fileLinks,
    })
  }
}

export function getValidationData(): ValidationData {
  return data
}

function getLinkToValidate(link: string, { options, site }: RehypeStarlightLinksValidatorConfig): Link | undefined {
  const linkTovalidate = { raw: link }

  if (!isAbsoluteUrl(link, { httpOnly: false })) {
    return linkTovalidate
  }

  try {
    const url = new URL(link)

    if (options.sameSitePolicy !== 'ignore' && url.origin === site) {
      if (options.sameSitePolicy === 'error') {
        return { ...linkTovalidate, error: ValidationErrorType.SameSite }
      } else {
        let transformed = link.replace(url.origin, '')
        if (!transformed) transformed = '/'
        return { ...linkTovalidate, transformed }
      }
    }

    if (!options.errorOnLocalLinks) return

    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      ? { ...linkTovalidate, error: ValidationErrorType.LocalLink }
      : undefined
  } catch {
    return undefined
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

function extractFrontmatterLinks(
  frontmatter: Frontmatter,
  fileLinks: Link[],
  config: RehypeStarlightLinksValidatorConfig,
) {
  if (!frontmatter) return

  if (isFrontmatterWithHeroActions(frontmatter)) {
    for (const action of frontmatter.hero.actions) {
      const link = getLinkToValidate(action.link, config)
      if (link) fileLinks.push(link)
    }
  }

  if (isFrontmatterPrevNextLink(frontmatter, 'prev')) {
    const link = getLinkToValidate(frontmatter.prev.link, config)
    if (link) fileLinks.push(link)
  }

  if (isFrontmatterPrevNextLink(frontmatter, 'next')) {
    const link = getLinkToValidate(frontmatter.next.link, config)
    if (link) fileLinks.push(link)
  }
}

function isFrontmatterWithHeroActions(
  frontmatter: Frontmatter,
): frontmatter is Frontmatter & { hero: FrontmatterHeroActions } {
  return (
    frontmatter !== undefined &&
    'hero' in frontmatter &&
    typeof frontmatter['hero'] === 'object' &&
    'actions' in frontmatter['hero']
  )
}

function isFrontmatterPrevNextLink<T extends 'prev' | 'next'>(
  frontmatter: Frontmatter,
  type: T,
): frontmatter is Frontmatter & Record<T, FrontmatterPrevNextLink> {
  return (
    frontmatter !== undefined &&
    type in frontmatter &&
    typeof frontmatter[type] === 'object' &&
    'link' in frontmatter[type]
  )
}

export interface RehypeStarlightLinksValidatorConfig {
  base: string
  options: StarlightLinksValidatorOptions
  site: AstroConfig['site']
  srcDir: URL
}

export type ValidationData = Map<
  string,
  {
    // The absolute path to the file.
    file: string
    // All the headings.
    headings: string[]
    // All the internal links.
    links: Link[]
  }
>

export interface Link {
  error?: ValidationErrorType
  raw: string
  transformed?: string
}

interface MdxStringAttribute<TName extends string> {
  name: TName
  type: 'mdxJsxAttribute'
  value: string
}

type Frontmatter = DataMap['astro']['frontmatter']

interface FrontmatterHeroActions {
  actions: { link: string }[]
}

interface FrontmatterPrevNextLink {
  link: string
}
