import { fileURLToPath } from 'node:url'

import type { SatteriAstroData } from '@astrojs/markdown-satteri'
import { defineHastPlugin, type HastPluginDefinition, type HastVisitorContext } from 'satteri'

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

export function satteriStarlightLinksValidator(config: ValidationConfig): HastPluginDefinition {
  const validationContexts: ValidationContexts = new WeakMap()
  const linkComponents = getLinksComponents(config.options.components)

  return defineHastPlugin({
    name: 'starlight-links-validator',
    element: {
      filter: [],
      visit(node, ctx) {
        visitNode({ ctx, config, validationContexts }, ({ headings, links }) => {
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
      visit(node, ctx) {
        visitNode({ ctx, config, validationContexts }, ({ headings, links }) => {
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
      visit(node, ctx) {
        visitNode({ ctx, config, validationContexts }, ({ headings }) => {
          for (const attribute of node.attributes) {
            if (isStringAttribute(attribute, 'id')) headings.push(attribute.value)
          }
        })
      },
    },
    raw(node, ctx) {
      visitNode({ ctx, config, validationContexts }, ({ headings, links }) => {
        const headingsAndLinks = extractRawHeadingsAndLinks(node, config)

        headings.push(...headingsAndLinks.headings)
        links.push(...headingsAndLinks.links)
      })
    },
  })
}

function visitNode(
  {
    ctx,
    config,
    validationContexts,
  }: { ctx: HastVisitorContext; config: ValidationConfig; validationContexts: ValidationContexts },
  visitor: (validationData: { headings: string[]; links: Link[] }) => void,
) {
  const headings: string[] = []
  const links: Link[] = []

  const validationContext = getValidationContext(config, ctx, validationContexts)
  if (!validationContext.shouldValidate) return

  visitor({ headings, links })

  updateValidationData(
    { base: config.base, id: validationContext.id, slug: validationContext.slug },
    { file: validationContext.path, headings, links },
  )
}

const shouldNotValidateContext: ValidationContext = { shouldValidate: false }

function getValidationContext(
  config: ValidationConfig,
  ctx: HastVisitorContext,
  validationContexts: ValidationContexts,
): ValidationContext {
  // If the content does not have a URL, e.g. when rendered using the content loader `renderMarkdown()` API, skip it.
  if (!ctx.fileURL) return shouldNotValidateContext

  if (ctx.data.astro?.frontmatter['draft']) return shouldNotValidateContext

  const existingContext = validationContexts.get(ctx.fileURL)
  if (existingContext) return existingContext

  const { base, srcDir } = config

  const path = fileURLToPath(ctx.fileURL)
  const id = normalizeId(base, srcDir, path)
  const slug: string | undefined =
    typeof ctx.data.astro?.frontmatter['slug'] === 'string' ? ctx.data.astro.frontmatter['slug'] : undefined

  const frontmatterLinks: Link[] = []
  extractFrontmatterLinks(ctx.data.astro?.frontmatter, frontmatterLinks, config)

  const validationContext: ValidationContext = { shouldValidate: true, path, id, slug }
  validationContexts.set(ctx.fileURL, validationContext)

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

type ValidationContexts = WeakMap<URL, ValidationContext>

declare module 'satteri' {
  interface DataMap {
    astro: SatteriAstroData
  }
}
