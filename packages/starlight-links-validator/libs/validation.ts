import { statSync } from 'node:fs'
import { posix } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { styleText } from 'node:util'

import type { StarlightUserConfig as StarlightUserConfigWithPlugins } from '@astrojs/starlight/types'
import type { AstroConfig, AstroIntegrationLogger } from 'astro'
import picomatch from 'picomatch'
import terminalLink from 'terminal-link'

import type { StarlightLinksValidatorOptions } from '..'

import { getFallbackHeadings, getLocaleConfig, isInconsistentLocaleLink, type LocaleConfig } from './i18n'
import { ensureTrailingSlash, stripLeadingSlash, stripTrailingSlash } from './path'
import { getErrorPosition, type Position, type Reference } from './position'
import { getValidationData, type Link, type ValidationData } from './rehype'

export const ValidationErrorType = {
  InconsistentLocale: 'inconsistent locale',
  InvalidHash: 'invalid hash',
  InvalidLink: 'invalid link',
  InvalidLinkToCustomPage: 'invalid link to custom page',
  LocalLink: 'local link',
  RelativeLink: 'relative link',
  SameSite: '{{site}} can be omitted',
  TrailingSlashMissing: 'missing trailing slash',
  TrailingSlashForbidden: 'forbidden trailing slash',
} as const

export function validateLinks(
  pages: PageData[],
  customPages: Set<string>,
  outputDir: URL,
  astroConfig: AstroConfig,
  starlightConfig: StarlightUserConfig,
  options: StarlightLinksValidatorOptions,
): ValidationErrors {
  process.stdout.write(`\n${styleText(['bgGreen', 'black'], ` validating links `)}\n`)

  const localeConfig = getLocaleConfig(starlightConfig)
  const validationData = getValidationData()
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

  for (const [id, { links: fileLinks, file }] of validationData) {
    for (const link of fileLinks) {
      const validationContext: ValidationContext = {
        astroConfig,
        customPages,
        errors,
        file,
        id,
        link,
        localeConfig,
        options,
        outputDir,
        pages: allPages,
        validationData,
      }

      if (link.raw.startsWith('#') || link.raw.startsWith('?')) {
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

// TODO(HiDeoo) console.log/console.error

export async function logErrors(
  pluginLogger: AstroIntegrationLogger,
  errors: ValidationErrors,
  site: AstroConfig['site'],
) {
  const logger = pluginLogger.fork('')

  if (errors.size === 0) {
    logger.info(styleText('green', '✓ All internal links are valid.\n'))
    return
  }

  const errorCount = [...errors.values()].reduce(
    (acc, { errors: validationErrors }) => acc + validationErrors.length,
    0,
  )

  logger.error(
    styleText(
      'red',
      `✗ Found ${errorCount} invalid ${pluralize(errorCount, 'link')} in ${errors.size} ${pluralize(
        errors.size,
        'file',
      )}.`,
    ),
  )

  let hasInvalidLinkToCustomPage = false

  for (const [id, { errors: validationErrors, file }] of errors) {
    logger.info(
      `${styleText('red', '▶')} ${styleText(
        'blue',
        terminalLink(id, pathToFileURL(file).toString(), { fallback: false }),
      )}`,
    )

    for (const [index, validationError] of validationErrors.entries()) {
      logger.info(
        `  ${styleText('blue', `${index < validationErrors.length - 1 ? '├' : '└'}─`)} ${validationError.link}${styleText(
          'dim',
          ` - ${formatValidationError(validationError, site)} - ${logPosition(await getErrorPosition(validationError.reference, file))}`,
        )}`,
      )
      hasInvalidLinkToCustomPage = validationError.type === ValidationErrorType.InvalidLinkToCustomPage
    }
  }

  process.stdout.write('\n')

  return hasInvalidLinkToCustomPage
}

function logPosition(position: Position): string {
  // TODO(HiDeoo)
  return position.type === 'unavailable' ? 'unknown position' : `line ${position.line} - column ${position.column}`
}

/**
 * Validate a link to another internal page that may or may not have a hash.
 */
function validateLink(context: ValidationContext) {
  const { astroConfig, customPages, errors, id, file, link, localeConfig, options, pages } = context

  if (isExcludedLink(link, context)) {
    return
  }

  if (link.error) {
    addError(errors, id, file, link, link.error)
    return
  }

  const linkToValidate = link.transformed ?? link.raw
  const sanitizedLink = linkToValidate.replace(/^\//, '')
  const segments = sanitizedLink.split('#')

  let path = segments[0]
  const hash = segments[1]

  if (path === undefined) {
    throw new Error('Failed to validate a link with no path.')
  }

  path = stripQueryString(path)

  if (path.startsWith('.') || (!linkToValidate.startsWith('/') && !linkToValidate.startsWith('?'))) {
    if (options.errorOnRelativeLinks) {
      addError(errors, id, file, link, ValidationErrorType.RelativeLink)
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
    addError(
      errors,
      id,
      file,
      link,
      customPages.has(stripTrailingSlash(sanitizedPath))
        ? ValidationErrorType.InvalidLinkToCustomPage
        : ValidationErrorType.InvalidLink,
    )
    return
  }

  if (options.errorOnInconsistentLocale && localeConfig && isInconsistentLocaleLink(id, link.raw, localeConfig)) {
    addError(errors, id, file, link, ValidationErrorType.InconsistentLocale)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    if (options.errorOnInvalidHashes) {
      addError(errors, id, file, link, ValidationErrorType.InvalidHash)
    }
    return
  }

  if (path.length > 0) {
    if (astroConfig.trailingSlash === 'always' && !path.endsWith('/')) {
      addError(errors, id, file, link, ValidationErrorType.TrailingSlashMissing)
      return
    } else if (astroConfig.trailingSlash === 'never' && path.endsWith('/')) {
      addError(errors, id, file, link, ValidationErrorType.TrailingSlashForbidden)
      return
    }
  }
}

function getFileHeadings(path: string, { astroConfig, localeConfig, options, validationData }: ValidationContext) {
  let headings = validationData.get(path === '' ? '/' : path)?.headings

  if (!options.errorOnFallbackPages && !headings && localeConfig) {
    headings = getFallbackHeadings(path, validationData, localeConfig, astroConfig.base)
  }

  return headings
}

/**
 * Validate a link to an hash in the same page.
 */
function validateSelfHash(context: ValidationContext) {
  const { errors, link, id, file, validationData } = context

  if (isExcludedLink(link, context)) {
    return
  }

  const hash = link.raw.split('#')[1] ?? link.raw
  const sanitizedHash = hash.replace(/^#/, '')
  const fileHeadings = validationData.get(id)?.headings

  if (!fileHeadings) {
    throw new Error(`Failed to find headings for the file at '${id}'.`)
  }

  if (!fileHeadings.includes(sanitizedHash)) {
    addError(errors, id, file, link, ValidationErrorType.InvalidHash)
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
function isExcludedLink(link: Link, { id, options, validationData }: ValidationContext) {
  if (Array.isArray(options.exclude)) return picomatch(options.exclude)(stripQueryString(link.raw))

  const file = validationData.get(id)?.file
  if (!file) throw new Error('Missing file path to check exclusion.')

  return options.exclude({
    file,
    link: link.raw,
    slug: stripTrailingSlash(id),
  })
}

function stripQueryString(path: string): string {
  return path.split('?')[0] ?? path
}

function addError(errors: ValidationErrors, id: string, file: string, link: Link, type: ValidationErrorType) {
  const fileErrors = errors.get(id) ?? { errors: [], file }
  fileErrors.errors.push({ link: link.raw, reference: link.reference, type })

  errors.set(id, fileErrors)
}

function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`
}

function formatValidationError(error: ValidationError, site: AstroConfig['site']) {
  if (error.type !== ValidationErrorType.SameSite || !site) return error.type

  return error.type.replace('{{site}}', site)
}

// The validation errors keyed by file path.
type ValidationErrors = Map<string, { errors: ValidationError[]; file: string }>

export type ValidationErrorType = (typeof ValidationErrorType)[keyof typeof ValidationErrorType]

interface ValidationError {
  link: string
  reference: Reference
  type: ValidationErrorType
}

interface PageData {
  pathname: string
}

type Pages = Set<PageData['pathname']>

interface ValidationContext {
  astroConfig: AstroConfig
  customPages: Set<string>
  errors: ValidationErrors
  id: string
  file: string
  link: Link
  localeConfig: LocaleConfig | undefined
  options: StarlightLinksValidatorOptions
  outputDir: URL
  pages: Pages
  validationData: ValidationData
}

export type StarlightUserConfig = Omit<StarlightUserConfigWithPlugins, 'plugins'>
