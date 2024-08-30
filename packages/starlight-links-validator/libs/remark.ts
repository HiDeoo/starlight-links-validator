import 'mdast-util-mdx-jsx'

import nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

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

import { ensureTrailingSlash, stripLeadingSlash } from './path'

// All the headings keyed by file path.
const headings: Headings = new Map()
// All the internal links keyed by file path.
const links: Links = new Map()

export const remarkStarlightLinksValidator: Plugin<[{ base: string; srcDir: URL }], Root> = function ({
  base,
  srcDir,
}) {
  return (tree, file) => {
    const slugger = new GitHubSlugger()
    const filePath = normalizeFilePath(base, srcDir, file.history[0])
    const slug = file.data.astro?.frontmatter?.slug

    const fileHeadings: string[] = []
    const fileLinks: string[] = []
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

          fileHeadings.push(slugger.slug(content))

          break
        }
        case 'link': {
          if (isInternalLink(node.url)) {
            fileLinks.push(node.url)
          }

          break
        }
        case 'linkReference': {
          const definition = fileDefinitions.get(node.identifier)

          if (definition && isInternalLink(definition)) {
            fileLinks.push(definition)
          }

          break
        }
        case 'mdxJsxFlowElement': {
          for (const attribute of node.attributes) {
            if (isMdxIdAttribute(attribute)) {
              fileHeadings.push(attribute.value)
            }
          }

          if (node.name !== 'a' && node.name !== 'LinkCard' && node.name !== 'LinkButton') {
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
              typeof htmlNode.properties.href === 'string' &&
              isInternalLink(htmlNode.properties.href)
            ) {
              fileLinks.push(htmlNode.properties.href)
            }
          })

          break
        }
      }
    })

    headings.set(getFilePath(filePath, slug), fileHeadings)
    links.set(getFilePath(filePath, slug), fileLinks)
  }
}

export function getValidationData() {
  return { headings, links }
}

function isInternalLink(link: string) {
  return !isAbsoluteUrl(link)
}

function getFilePath(filePath: string, slug: string | undefined) {
  return slug ? stripLeadingSlash(ensureTrailingSlash(slug)) : filePath
}

function normalizeFilePath(base: string, srcDir: URL, filePath?: string) {
  if (!filePath) {
    throw new Error('Missing file path to validate links.')
  }

  const path = nodePath
    .relative(nodePath.join(fileURLToPath(srcDir), 'content/docs'), filePath)
    .replace(/\.\w+$/, '')
    .replace(/index$/, '')
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

export type Headings = Map<string, string[]>
export type Links = Map<string, string[]>

interface MdxIdAttribute {
  name: 'id'
  type: 'mdxJsxAttribute'
  value: string
}

declare module 'vfile' {
  interface DataMap {
    astro?: {
      frontmatter?: {
        slug?: string
      }
    }
  }
}
