import { statSync } from 'node:fs'
import { posix } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { AstroIntegrationLogger } from 'astro'
import { bgGreen, black, blue, dim, green, red } from 'kleur/colors'

import type { StarlightLinksValidatorOptions } from '..'

import { getFallbackHeadings, getLocaleConfig, isInconsistentLocaleLink, type LocaleConfig } from './i18n'
import { ensureTrailingSlash, stripLeadingSlash } from './path'
import { getValidationData, type Headings } from './remark'

export const ValidationErrorType = {
  InconsistentLocale: 'inconsistent locale',
  InvalidAnchor: 'invalid anchor',
  InvalidLink: 'invalid link',
  RelativeLink: 'relative link',
} as const

export function validateLinks(
  pages: PageData[],
  outputDir: URL,
  base: string,
  starlightConfig: StarlightUserConfig,
  options: StarlightLinksValidatorOptions,
): ValidationErrors {
  process.stdout.write(`\n${bgGreen(black(` validating links `))}\n`)

  const localeConfig = getLocaleConfig(starlightConfig)
  const { headings, links } = getValidationData()
  const allPages: Pages = new Set(
    pages.map((page) =>
      ensureTrailingSlash(base === '/' ? page.pathname : posix.join(stripLeadingSlash(base), page.pathname)),
    ),
  )

  const errors: ValidationErrors = new Map()

  for (const [filePath, fileLinks] of links) {
    for (const link of fileLinks) {
      const validationContext: ValidationContext = {
        base,
        errors,
        filePath,
        headings,
        link,
        localeConfig,
        options,
        outputDir,
        pages: allPages,
      }

      if (link.startsWith('#')) {
        validateSelfAnchor(validationContext)
      } else {
        validateLink(validationContext)
      }
    }
  }

  return errors
}

export function logErrors(pluginLogger: AstroIntegrationLogger, errors: ValidationErrors) {
  const logger = pluginLogger.fork('')

  if (errors.size === 0) {
    logger.info(green('✓ All internal links are valid.\n'))
    return
  }

  const errorCount = [...errors.values()].reduce((acc, links) => acc + links.length, 0)

  logger.error(
    red(
      `✗ Found ${errorCount} invalid ${pluralize(errorCount, 'link')} in ${errors.size} ${pluralize(
        errors.size,
        'file',
      )}.`,
    ),
  )

  for (const [file, validationErrors] of errors) {
    logger.info(`${red('▶')} ${blue(file)}`)

    for (const [index, validationError] of validationErrors.entries()) {
      logger.info(
        `  ${blue(`${index < validationErrors.length - 1 ? '├' : '└'}─`)} ${validationError.link}${dim(
          ` - ${validationError.type}`,
        )}`,
      )
    }
  }

  process.stdout.write('\n')
}

/**
 * Validate a link to another internal page that may or may not have a hash.
 */
function validateLink(context: ValidationContext) {
  const { errors, filePath, link, localeConfig, options, pages } = context

  const sanitizedLink = link.replace(/^\//, '')
  const segments = sanitizedLink.split('#')

  let path = segments[0]
  const hash = segments[1]

  if (path === undefined) {
    throw new Error('Failed to validate a link with no path.')
  }

  if (path.startsWith('.') || !link.startsWith('/')) {
    if (options.errorOnRelativeLinks) {
      addError(errors, filePath, link, ValidationErrorType.RelativeLink)
    }

    return
  }

  if (isValidAsset(path, context)) {
    return
  }

  path = ensureTrailingSlash(path)

  const isValidPage = pages.has(path)
  const fileHeadings = getFileHeadings(path, context)

  if (!isValidPage || !fileHeadings) {
    addError(errors, filePath, link, ValidationErrorType.InvalidLink)
    return
  }

  if (options.errorOnInconsistentLocale && localeConfig && isInconsistentLocaleLink(filePath, link, localeConfig)) {
    addError(errors, filePath, link, ValidationErrorType.InconsistentLocale)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    addError(errors, filePath, link, ValidationErrorType.InvalidAnchor)
  }
}

function getFileHeadings(path: string, { headings, localeConfig, options }: ValidationContext) {
  let heading = headings.get(path === '' ? '/' : path)

  if (!options.errorOnFallbackPages && !heading && localeConfig) {
    heading = getFallbackHeadings(path, headings, localeConfig)
  }

  return heading
}

/**
 * Validate a link to an anchor in the same page.
 */
function validateSelfAnchor({ errors, link, filePath, headings }: ValidationContext) {
  const sanitizedHash = link.replace(/^#/, '')
  const fileHeadings = headings.get(filePath)

  if (!fileHeadings) {
    throw new Error(`Failed to find headings for the file at '${filePath}'.`)
  }

  if (!fileHeadings.includes(sanitizedHash)) {
    addError(errors, filePath, link, 'invalid anchor')
  }
}

/**
 * Check if a link is a valid asset in the build output directory.
 */
function isValidAsset(path: string, context: ValidationContext) {
  if (context.base !== '/') {
    const base = stripLeadingSlash(context.base)

    if (path.startsWith(base)) {
      path = path.replace(new RegExp(`^${stripLeadingSlash(base)}/?`), '')
    } else {
      return false
    }
  }

  const filePath = fileURLToPath(new URL(path, context.outputDir))

  try {
    const stats = statSync(filePath)

    return stats.isFile()
  } catch {
    return false
  }
}

function addError(errors: ValidationErrors, filePath: string, link: string, type: ValidationErrorType) {
  const fileErrors = errors.get(filePath) ?? []
  fileErrors.push({ link, type })

  errors.set(filePath, fileErrors)
}

function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`
}

// The validation errors keyed by file path.
type ValidationErrors = Map<string, ValidationError[]>

export type ValidationErrorType = (typeof ValidationErrorType)[keyof typeof ValidationErrorType]

interface ValidationError {
  link: string
  type: ValidationErrorType
}

interface PageData {
  pathname: string
}

type Pages = Set<PageData['pathname']>

interface ValidationContext {
  base: string
  errors: ValidationErrors
  filePath: string
  headings: Headings
  link: string
  localeConfig: LocaleConfig | undefined
  options: StarlightLinksValidatorOptions
  outputDir: URL
  pages: Pages
}

export type StarlightUserConfig = Parameters<StarlightPlugin['hooks']['setup']>['0']['config']
