import { fileURLToPath } from 'node:url'

import type { SatteriAstroData } from '@astrojs/markdown-satteri'
import { defineHastPlugin, type HastPluginEntry } from 'satteri'

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
import { updateValidationData } from './store'

export function createSatteriStarlightLinksValidator(config: ValidationConfig): HastPluginEntry {
  const linkComponents = getLinksComponents(config.options.components)

  return ({ fileURL }) => {
    // If the content does not have a URL, e.g. when rendered using the content loader `renderMarkdown()` API, skip it.
    if (!fileURL) return

    let validationContext: ValidationContext = shouldNotValidateContext

    return defineHastPlugin({
      name: 'starlight-links-validator',
      options: { position: true },
      before(_root, ctx) {
        validationContext = createValidationContext(config, fileURL, ctx.data.astro?.frontmatter)
      },
      element: {
        filter: [],
        visit(node) {
          visitNode({ config, validationContext }, ({ headings, links }) => {
            if (isElementWithStringProperty(node, 'id')) {
              headings.push(node.properties['id'])
            }

            if (
              node.tagName !== 'a' ||
              !isElementWithStringProperty(node, 'href') ||
              isElementWithClass(node, 'sl-anchor-link')
            ) {
              return
            }

            const link = getLinkToValidate(node.properties['href'], getNodeReference(node), config)
            if (link) links.push(link)
          })
        },
      },
      mdxJsxFlowElement: {
        filter: [],
        visit(node) {
          visitNode({ config, validationContext }, ({ headings, links }) => {
            for (const attribute of node.attributes) {
              if (isStringAttribute(attribute, 'id')) headings.push(attribute.value)
            }

            if (!node.name) return

            const componentProp = linkComponents[node.name]

            if (node.name !== 'a' && !componentProp) return

            for (const attribute of node.attributes) {
              if (!isStringAttribute(attribute, componentProp ?? 'href')) continue

              const link = getLinkToValidate(attribute.value, getNodeReference(node), config)
              if (link) links.push(link)
            }
          })
        },
      },
      mdxJsxTextElement: {
        filter: [],
        visit(node) {
          visitNode({ config, validationContext }, ({ headings }) => {
            for (const attribute of node.attributes) {
              if (isStringAttribute(attribute, 'id')) headings.push(attribute.value)
            }
          })
        },
      },
      raw(node) {
        visitNode({ config, validationContext }, ({ headings, links }) => {
          const headingsAndLinks = extractRawHeadingsAndLinks(node, config)

          headings.push(...headingsAndLinks.headings)
          links.push(...headingsAndLinks.links)
        })
      },
    })
  }
}

function visitNode(
  { config, validationContext }: { config: ValidationConfig; validationContext: ValidationContext },
  visitor: (validationData: { headings: string[]; links: Link[] }) => void,
) {
  const headings: string[] = []
  const links: Link[] = []

  if (!validationContext.shouldValidate) return

  visitor({ headings, links })

  updateValidationData(
    { base: config.base, id: validationContext.id, slug: validationContext.slug },
    { file: validationContext.path, headings, links },
  )
}

const shouldNotValidateContext: ValidationContext = { shouldValidate: false }

function createValidationContext(
  config: ValidationConfig,
  fileURL: URL,
  frontmatter: SatteriAstroData['frontmatter'] | undefined,
): ValidationContext {
  if (frontmatter?.['draft']) return shouldNotValidateContext

  const { base, srcDir } = config

  const path = fileURLToPath(fileURL)
  const id = normalizeId(base, srcDir, path)
  const slug: string | undefined = typeof frontmatter?.['slug'] === 'string' ? frontmatter['slug'] : undefined

  const frontmatterLinks: Link[] = []
  extractFrontmatterLinks(frontmatter, frontmatterLinks, config)

  const validationContext: ValidationContext = { shouldValidate: true, path, id, slug }

  updateValidationData(
    { base: config.base, id: validationContext.id, slug: validationContext.slug },
    { file: validationContext.path, headings: [], links: frontmatterLinks },
  )

  return validationContext
}

type ValidationContext =
  | { shouldValidate: false }
  | {
      shouldValidate: true
      id: string
      path: string
      slug: string | undefined
    }

declare module 'satteri' {
  interface DataMap {
    astro: SatteriAstroData
  }
}
