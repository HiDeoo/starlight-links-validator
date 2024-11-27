import { statSync } from 'node:fs'
import { posix } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StarlightUserConfig as StarlightUserConfigWithPlugins } from '@astrojs/starlight/types'
import type { AstroConfig, AstroIntegrationLogger } from 'astro'
import { bgGreen, black, blue, dim, green, red } from 'kleur/colors'
import picomatch from 'picomatch'

import type { StarlightLinksValidatorOptions } from '..'

import { getFallbackHeadings, getLocaleConfig, isInconsistentLocaleLink, type LocaleConfig } from './i18n'
import { ensureTrailingSlash, stripLeadingSlash } from './path'
import { getValidationData, type Headings } from './remark'

export const ValidationErrorType = {
  InconsistentLocale: 'inconsistent locale',
  InvalidHash: 'invalid hash',
  InvalidLink: 'invalid link',
  LocalLink: 'local link',
  RelativeLink: 'relative link',
  TrailingSlashMissing: 'missing trailing slash',
  TrailingSlashForbidden: 'forbidden trailing slash',
} as const

export function validateLinks(
  pages: PageData[],
  outputDir: URL,
  astroConfig: AstroConfig,
  starlightConfig: StarlightUserConfig,
  options: StarlightLinksValidatorOptions,
): ValidationErrors {
  process.stdout.write(`\n${bgGreen(black(` validating links `))}\n`)

  const localeConfig = getLocaleConfig(starlightConfig)
  const { headings, links } = getValidationData()
  const allPages: Pages = new Set(
    pages.map((page) =>
      ensureTrailingSlash(
        astroConfig.base === '/'
          ? stripLeadingSlash(page.pathname)
          : posix.join(stripLeadingSlash(astroConfig.base), page.pathname),
      ),
    ),
  )

  const errors: ValidationErrors = new Map()

  for (const [filePath, fileLinks] of links) {
    for (const link of fileLinks) {
      const validationContext: ValidationContext = {
        astroConfig,
        errors,
        filePath,
        headings,
        link,
        localeConfig,
        options,
        outputDir,
        pages: allPages,
      }

      if (link.startsWith('#') || link.startsWith('?')) {
        if (options.errorOnInvalidHashes) {
          validateSelfHash(validationContext)
        }
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
  const { astroConfig, errors, filePath, link, localeConfig, options, pages } = context

  if (isExcludedLink(link, context)) {
    return
  }

  if (/^https?:\/\//.test(link)) {
    if (options.errorOnLocalLinks) {
      addError(errors, filePath, link, ValidationErrorType.LocalLink)
    }

    return
  }

  const sanitizedLink = link.replace(/^\//, '')
  const segments = sanitizedLink.split('#')

  const path = segments[0]
  const hash = segments[1]

  if (path === undefined) {
    throw new Error('Failed to validate a link with no path.')
  }

  if (path.startsWith('.') || (!link.startsWith('/') && !link.startsWith('?'))) {
    if (options.errorOnRelativeLinks) {
      addError(errors, filePath, link, ValidationErrorType.RelativeLink)
    }

    return
  }

  if (isValidAsset(path, context)) {
    return
  }

  const sanitizedPath = ensureTrailingSlash(stripQueryString(path))

  const isValidPage = pages.has(sanitizedPath)
  const fileHeadings = getFileHeadings(sanitizedPath, context)

  if (!isValidPage || !fileHeadings) {
    addError(errors, filePath, link, ValidationErrorType.InvalidLink)
    return
  }

  if (options.errorOnInconsistentLocale && localeConfig && isInconsistentLocaleLink(filePath, link, localeConfig)) {
    addError(errors, filePath, link, ValidationErrorType.InconsistentLocale)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    if (options.errorOnInvalidHashes) {
      addError(errors, filePath, link, ValidationErrorType.InvalidHash)
    }
    return
  }

  if (path.length > 0) {
    if (astroConfig.trailingSlash === 'always' && !path.endsWith('/')) {
      addError(errors, filePath, link, ValidationErrorType.TrailingSlashMissing)
      return
    } else if (astroConfig.trailingSlash === 'never' && path.endsWith('/')) {
      addError(errors, filePath, link, ValidationErrorType.TrailingSlashForbidden)
      return
    }
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
 * Validate a link to an hash in the same page.
 */
function validateSelfHash({ errors, link, filePath, headings }: ValidationContext) {
  const hash = link.split('#')[1] ?? link
  const sanitizedHash = hash.replace(/^#/, '')
  const fileHeadings = headings.get(filePath)

  if (!fileHeadings) {
    throw new Error(`Failed to find headings for the file at '${filePath}'.`)
  }

  if (!fileHeadings.includes(sanitizedHash)) {
    addError(errors, filePath, link, ValidationErrorType.InvalidHash)
  }
}

/**
 * Check if a link is a valid asset in the build output directory.
 */
function isValidAsset(path: string, context: ValidationContext) {
  if (context.astroConfig.base !== '/') {
    const base = stripLeadingSlash(context.astroConfig.base)

    if (path.startsWith(base)) {
      path = path.replace(new RegExp(`^${stripLeadingSlash(base)}/?`), '')
    } else {
      return false
    }
  }

  try {
    const filePath = fileURLToPath(new URL(path, context.outputDir))
    const stats = statSync(filePath)

    return stats.isFile()
  } catch {
    return false
  }
}

/**
 * Check if a link is excluded from validation by the user.
 */
function isExcludedLink(link: string, context: ValidationContext) {
  return picomatch(context.options.exclude)(link)
}

function stripQueryString(path: string): string {
  return path.split('?')[0] ?? path
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
  astroConfig: AstroConfig
  errors: ValidationErrors
  filePath: string
  headings: Headings
  link: string
  localeConfig: LocaleConfig | undefined
  options: StarlightLinksValidatorOptions
  outputDir: URL
  pages: Pages
}

export type StarlightUserConfig = Omit<StarlightUserConfigWithPlugins, 'plugins'>
