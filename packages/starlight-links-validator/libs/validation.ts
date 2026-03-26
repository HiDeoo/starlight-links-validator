import { statSync } from 'node:fs'
import { posix, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StarlightUserConfig as StarlightUserConfigWithPlugins } from '@astrojs/starlight/types'
import type { AstroConfig, AstroIntegrationLogger } from 'astro'
import picomatch from 'picomatch'

import type { StarlightLinksValidatorOptions } from '..'

import { blue, dim, fileLink, urlLink, logStep, logSummary, pad, red, underline } from './cli'
import { getFallbackHeadings, getLocaleConfig, isInconsistentLocaleLink, type LocaleConfig } from './i18n'
import { ensureTrailingSlash, stripLeadingSlash, stripTrailingSlash } from './path'
import { getErrorPosition, isSameLineSourcePosition, type Position, type Reference } from './position'
import { getValidationData, type Link, type ValidationData } from './rehype'

// const docsUrl = 'https://starlight-links-validator.vercel.app/'
const docsUrl = 'http://localhost:4321/'

const validationErrorDefinitions = {
  InconsistentLocale: {
    message: 'inconsistent locale',
    slug: 'inconsistent-locale',
  },
  InvalidHash: {
    message: 'invalid hash',
    slug: 'invalid-hash',
  },
  InvalidLink: {
    message: 'invalid link',
    slug: 'invalid-link',
  },
  InvalidLinkToCustomPage: {
    message: 'invalid link to custom page',
    slug: 'invalid-link-to-custom-page',
  },
  LocalLink: {
    message: 'local link',
    slug: 'local-link',
  },
  RelativeLink: {
    message: 'relative link',
    slug: 'relative-link',
  },
  SameSite: {
    message: ({ site }) => `${site} can be omitted`,
    slug: 'same-site',
  },
  TrailingSlashMissing: {
    message: 'missing trailing slash',
    slug: 'missing-trailing-slash',
  },
  TrailingSlashForbidden: {
    message: 'forbidden trailing slash',
    slug: 'forbidden-trailing-slash',
  },
} as const satisfies Record<
  string,
  {
    slug: string
    message: string | ((context: ValidationErrorMessageContext) => string)
  }
>

export const ValidationErrorType = Object.freeze(
  Object.fromEntries(Object.keys(validationErrorDefinitions).map((type) => [type, type])) as {
    [Key in ValidationErrorType]: Key
  },
)

export function validateLinks(
  pages: PageData[],
  customPages: Set<string>,
  outputDir: URL,
  astroConfig: AstroConfig,
  starlightConfig: StarlightUserConfig,
  options: StarlightLinksValidatorOptions,
): ValidationErrors {
  logStep('validating links')

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

export async function logErrors(
  logger: AstroIntegrationLogger,
  errors: ValidationErrors,
  context: { site: AstroConfig['site']; srcDir: AstroConfig['srcDir'] },
) {
  if (errors.size === 0) {
    logSummary('success', 'All internal links are valid.')
    return
  }

  const errorCount = [...errors.values()].reduce(
    (acc, { errors: validationErrors }) => acc + validationErrors.length,
    0,
  )

  logger.error('Links validation failed.')

  let hasInvalidLinkToCustomPage = false

  for (const [, { errors: validationErrors, file }] of errors) {
    const errorsWithPositions = await Promise.all(
      validationErrors.map(async (error) => ({
        error,
        position: await getErrorPosition(error.reference, file),
      })),
    )

    const errorGroups: { errors: [ValidationError, ...ValidationError[]]; position: Position }[] = []

    for (const { error, position } of errorsWithPositions) {
      const previousGroup = errorGroups.at(-1)
      const previousError = previousGroup?.errors[0]

      if (
        previousGroup &&
        previousError &&
        previousError.link === error.link &&
        previousError.type === error.type &&
        isSameLineSourcePosition(previousGroup.position, position)
      ) {
        previousGroup.errors.push(error)
      } else {
        errorGroups.push({
          errors: [error],
          position,
        })
      }
    }

    const maxLine = Math.max(
      ...errorGroups.map(({ position }) => (position.type === 'unavailable' ? 0 : position.line)),
    )
    const maxLineLength = String(maxLine).length

    // TODO(HiDeoo) test on Windows
    const filePath = relative(fileURLToPath(context.srcDir), file)
      .split(sep)
      .join(posix.sep)
      .replace('content/docs/', '')

    console.error(`\n${pad(maxLineLength)} ╭─ ${blue(fileLink(filePath, file))}`)
    console.error(`${pad(maxLineLength)} ·`)

    for (const { errors, position } of errorGroups) {
      const error = errors[0]
      const errorOffset = Math.max(error.link.length - 2, error.link.length === 2 ? 1 : 0)
      const count = errors.length > 1 ? ` (x${errors.length})` : ''

      console.error(`${logPosition(position, maxLineLength)} | ${underline(fileLink(error.link, file, position))}`)
      console.error(
        `${pad(maxLineLength)} · ${pad(errorOffset)}${dim(`╰── ${getValidationErrorMessageLink(error.type, { site: context.site })}${count}`)}`,
      )

      hasInvalidLinkToCustomPage ||= error.type === ValidationErrorType.InvalidLinkToCustomPage
    }
  }

  logSummary(
    'error',
    `Found ${red(String(errorCount))} invalid ${pluralize(errorCount, 'link')} in ${red(String(errors.size))} ${pluralize(errors.size, 'file')}.`,
  )

  return hasInvalidLinkToCustomPage
}

function logPosition(position: Position, maxLinePositionLength: number): string {
  if (position.type === 'unavailable') return pad(maxLinePositionLength)

  const linePositionLength = String(position.line).length

  return `${' '.repeat(maxLinePositionLength - linePositionLength)}${dim(String(position.line))}`
}

export function getValidationErrorMessage(type: ValidationErrorType, context: ValidationErrorMessageContext) {
  const { message } = validationErrorDefinitions[type]
  return typeof message === 'function' ? message(context) : message
}

function getValidationErrorMessageLink(type: ValidationErrorType, context: ValidationErrorMessageContext) {
  const message = getValidationErrorMessage(type, context)

  return urlLink(message, new URL(`errors/${validationErrorDefinitions[type].slug}/`, docsUrl).href)
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

// The validation errors keyed by file path.
type ValidationErrors = Map<string, { errors: ValidationError[]; file: string }>

export type ValidationErrorType = keyof typeof validationErrorDefinitions

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

interface ValidationErrorMessageContext {
  site: AstroConfig['site']
}
