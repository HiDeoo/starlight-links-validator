import 'mdast-util-mdx-jsx'

import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AstroConfig } from 'astro'
import GitHubSlugger, { slug } from 'github-slugger'
import type { Nodes } from 'hast'
import { fromHtml } from 'hast-util-from-html'
import { hasProperty } from 'hast-util-has-property'
import isAbsoluteUrl from 'is-absolute-url'
import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'
import { toString } from 'mdast-util-to-string'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import type { StarlightLinksValidatorOptions } from '..'

import { ensureTrailingSlash, stripLeadingSlash } from './path'
import { ValidationErrorType } from './validation'

const builtInComponents: StarlightLinksValidatorOptions['components'] = [
  ['LinkButton', 'href'],
  ['LinkCard', 'href'],
]

// All the validation data keyed by file path.
const data: ValidationData = new Map()

export const remarkStarlightLinksValidator: Plugin<[RemarkStarlightLinksValidatorConfig], Root> = function (config) {
  const { base, options, srcDir } = config

  const linkComponents: Record<string, string> = Object.fromEntries(
    [...builtInComponents, ...options.components].map(([name, attribute]) => [name, attribute]),
  )

  return (tree, file) => {
    // If the content does not have a path, e.g. when rendered using the content loader `renderMarkdown()` API, skip it.
    if (!file.path) return

    if (file.data.astro?.frontmatter?.['draft']) return

    const originalPath = file.history[0]
    if (!originalPath) throw new Error('Missing file path to validate links.')

    const slugger = new GitHubSlugger()
    const filePath = normalizeFilePath(base, srcDir, originalPath)
    const slug: string | undefined =
      typeof file.data.astro?.frontmatter?.['slug'] === 'string' ? file.data.astro.frontmatter['slug'] : undefined

    const fileHeadings: string[] = ['_top']
    const fileLinks: Link[] = []
    const fileDefinitions = new Map<string, string>()

    visit(tree, 'definition', (node) => {
      fileDefinitions.set(node.identifier, node.url)
    })

    visit(tree, ['heading', 'html', 'link', 'linkReference', 'mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
      // https://github.com/syntax-tree/mdast#nodes
      // https://github.com/syntax-tree/mdast-util-mdx-jsx#nodes
      switch (node.type) {
        case 'heading': {
          if (node.data?.hProperties?.['id']) {
            fileHeadings.push(String(node.data.hProperties['id']))
            break
          }

          const content = toString(node)

          if (content.length === 0) {
            break
          }

          // Remove the last trailing hyphen from the slug like Astro does if it exists.
          // https://github.com/withastro/astro/blob/74ee2e45ecc9edbe285eadee6d0b94fc47d0d125/packages/integrations/markdoc/src/heading-ids.ts#L21
          fileHeadings.push(slugger.slug(content).replace(/-$/, ''))

          break
        }
        case 'link': {
          const link = getLinkToValidate(node.url, config)
          if (link) fileLinks.push(link)

          break
        }
        case 'linkReference': {
          const definition = fileDefinitions.get(node.identifier)
          if (!definition) break

          const link = getLinkToValidate(definition, config)
          if (link) fileLinks.push(link)

          break
        }
        case 'mdxJsxFlowElement': {
          for (const attribute of node.attributes) {
            if (isMdxIdAttribute(attribute)) {
              fileHeadings.push(attribute.value)
            }
          }

          if (!node.name) {
            break
          }

          const componentProp = linkComponents[node.name]

          if (node.name !== 'a' && !componentProp) {
            break
          }

          for (const attribute of node.attributes) {
            if (
              attribute.type !== 'mdxJsxAttribute' ||
              attribute.name !== (componentProp ?? 'href') ||
              typeof attribute.value !== 'string'
            ) {
              continue
            }

            const link = getLinkToValidate(attribute.value, config)
            if (link) fileLinks.push(link)
          }

          break
        }
        case 'mdxJsxTextElement': {
          for (const attribute of node.attributes) {
            if (isMdxIdAttribute(attribute)) {
              fileHeadings.push(attribute.value)
            }
          }

          break
        }
        case 'html': {
          const htmlTree = fromHtml(node.value, { fragment: true })

          visit(htmlTree, (htmlNode: Nodes) => {
            if (hasProperty(htmlNode, 'id') && typeof htmlNode.properties.id === 'string') {
              fileHeadings.push(htmlNode.properties.id)
            }

            if (
              htmlNode.type === 'element' &&
              htmlNode.tagName === 'a' &&
              hasProperty(htmlNode, 'href') &&
              typeof htmlNode.properties.href === 'string'
            ) {
              const link = getLinkToValidate(htmlNode.properties.href, config)
              if (link) fileLinks.push(link)
            }
          })

          break
        }
      }
    })

    data.set(getFilePath(base, filePath, slug), {
      file: originalPath,
      headings: fileHeadings,
      links: fileLinks,
    })
  }
}

export function getValidationData(): ValidationData {
  return data
}

function getLinkToValidate(link: string, { options, site }: RemarkStarlightLinksValidatorConfig): Link | undefined {
  const linkTovalidate = { raw: link }

  if (!isAbsoluteUrl(link)) {
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

function getFilePath(base: string, filePath: string, slug: string | undefined) {
  if (slug) {
    return nodePath.posix.join(stripLeadingSlash(base), stripLeadingSlash(ensureTrailingSlash(slug)))
  }

  return filePath
}

function normalizeFilePath(base: string, srcDir: URL, filePath: string) {
  const path = nodePath
    .relative(nodePath.join(fileURLToPath(srcDir), 'content/docs'), filePath)
    .replace(/\.\w+$/, '')
    .replace(/(^|[/\\])index$/, '')
    .replace(/[/\\]?$/, '/')
    .split(/[/\\]/)
    .map((segment) => slug(segment))
    .join('/')

  if (base !== '/') {
    return nodePath.posix.join(stripLeadingSlash(base), path)
  }

  return path
}

function isMdxIdAttribute(attribute: MdxJsxAttribute | MdxJsxExpressionAttribute): attribute is MdxIdAttribute {
  return attribute.type === 'mdxJsxAttribute' && attribute.name === 'id' && typeof attribute.value === 'string'
}

export interface RemarkStarlightLinksValidatorConfig {
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

interface MdxIdAttribute {
  name: 'id'
  type: 'mdxJsxAttribute'
  value: string
}
