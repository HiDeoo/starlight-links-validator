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

export function createSatteriStarlightLinksValidator(config: ValidationConfig) {
  const validationContexts: ValidationContexts = new WeakMap()

  return {
    hastPlugin: createSatteriHastPlugin(config, validationContexts),
    registerFile(options: { fileURL?: URL; frontmatter?: SatteriAstroData['frontmatter'] } | undefined) {
      getValidationContext(config, { fileURL: options?.fileURL, frontmatter: options?.frontmatter }, validationContexts)
    },
  }
}

function createSatteriHastPlugin(
  config: ValidationConfig,
  validationContexts: ValidationContexts,
): HastPluginDefinition {
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

  const validationContext = getValidationContext(
    config,
    { fileURL: ctx.fileURL, frontmatter: ctx.data.astro?.frontmatter },
    validationContexts,
  )
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
  source: ValidationSource,
  validationContexts: ValidationContexts,
): ValidationContext {
  // If the content does not have a URL, e.g. when rendered using the content loader `renderMarkdown()` API, skip it.
  if (!source.fileURL) return shouldNotValidateContext

  const existingContext = validationContexts.get(source.fileURL)
  if (existingContext) return existingContext

  if (source.frontmatter?.['draft']) {
    validationContexts.set(source.fileURL, shouldNotValidateContext)
    return shouldNotValidateContext
  }

  const { base, srcDir } = config

  const path = fileURLToPath(source.fileURL)
  const id = normalizeId(base, srcDir, path)
  const slug: string | undefined =
    typeof source.frontmatter?.['slug'] === 'string' ? source.frontmatter['slug'] : undefined

  const frontmatterLinks: Link[] = []
  extractFrontmatterLinks(source.frontmatter, frontmatterLinks, config)

  const validationContext: ValidationContext = { shouldValidate: true, path, id, slug }
  validationContexts.set(source.fileURL, validationContext)

  updateValidationData(
    { base: config.base, id: validationContext.id, slug: validationContext.slug },
    { file: validationContext.path, headings: [], links: frontmatterLinks },
  )

  return validationContext
}

interface ValidationSource {
  fileURL: URL | undefined
  frontmatter: SatteriAstroData['frontmatter'] | undefined
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
