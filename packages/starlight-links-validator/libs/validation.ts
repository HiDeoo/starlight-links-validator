import { statSync } from 'node:fs'
import { posix, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StarlightUserConfig as StarlightUserConfigWithPlugins } from '@astrojs/starlight/types'
import type { AstroConfig } from 'astro'
import picomatch from 'picomatch'

import type { StarlightLinksValidatorOptions } from '..'
import type { ValidationReport, ValidationReportIssue } from '../reporters'

import { getFallbackHeadings, getLocaleConfig, isInconsistentLocaleLink, type LocaleConfig } from './i18n'
import type { Link } from './link'
import { ensureTrailingSlash, stripLeadingSlash, stripTrailingSlash } from './path'
import { getErrorPosition, isSameLineSourcePosition, type Reference } from './position'
import { getValidationData, type ValidationData } from './store'

const documentationUrl = 'https://starlight-links-validator.vercel.app/'

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
  { slug: string; message: string | ((context: ValidationErrorMessageContext) => string) }
>

export const ValidationErrorType = Object.freeze(
  Object.fromEntries(Object.keys(validationErrorDefinitions).map((type) => [type, type])) as {
    [Key in ValidationErrorType]: Key
  },
)

export async function validateLinks(
  pages: PageData[],
  customPages: Set<string>,
  outputDir: URL,
  astroConfig: AstroConfig,
  starlightConfig: StarlightUserConfig,
  options: StarlightLinksValidatorOptions,
): Promise<ValidationReport> {
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

  const issues: ValidationContext['issues'] = new Map()

  for (const [id, { links: fileLinks, file }] of validationData) {
    for (const link of fileLinks) {
      const validationContext: ValidationContext = {
        astroConfig,
        customPages,
        file,
        id,
        issues,
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

  const validationReportFiles = await Promise.all(
    [...issues.values()].map((file) => buildValidationReportFile(file, astroConfig)),
  )

  const files: ValidationReport['files'] = []
  let errorCount = 0
  let hasInvalidLinkToCustomPage = false

  for (const validationReportFile of validationReportFiles) {
    files.push(validationReportFile.file)
    errorCount += validationReportFile.errorCount
    hasInvalidLinkToCustomPage ||= validationReportFile.hasInvalidLinkToCustomPage
  }

  return {
    errorCount,
    files,
    hasErrors: files.length > 0,
    hasInvalidLinkToCustomPage,
  }
}

export function getValidationErrorMessage(type: ValidationErrorType, context: ValidationErrorMessageContext) {
  const { message } = validationErrorDefinitions[type]
  return typeof message === 'function' ? message(context) : message
}

export function getValidationErrorDocumentationUrl(type: ValidationErrorType) {
  return new URL(`errors/${validationErrorDefinitions[type].slug}/`, documentationUrl).href
}

/**
 * Validate a link to another internal page that may or may not have a hash.
 */
function validateLink(context: ValidationContext) {
  const { astroConfig, customPages, id, link, localeConfig, options, pages } = context

  if (isExcludedLink(link, context)) {
    return
  }

  if (link.error) {
    addIssue(context, link.error)
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
      addIssue(context, ValidationErrorType.RelativeLink)
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
    addIssue(
      context,
      customPages.has(stripTrailingSlash(sanitizedPath))
        ? ValidationErrorType.InvalidLinkToCustomPage
        : ValidationErrorType.InvalidLink,
    )
    return
  }

  if (options.errorOnInconsistentLocale && localeConfig && isInconsistentLocaleLink(id, link.raw, localeConfig)) {
    addIssue(context, ValidationErrorType.InconsistentLocale)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    if (options.errorOnInvalidHashes) {
      addIssue(context, ValidationErrorType.InvalidHash)
    }
    return
  }

  if (path.length > 0) {
    if (astroConfig.trailingSlash === 'always' && !path.endsWith('/')) {
      addIssue(context, ValidationErrorType.TrailingSlashMissing)
      return
    } else if (astroConfig.trailingSlash === 'never' && path.endsWith('/')) {
      addIssue(context, ValidationErrorType.TrailingSlashForbidden)
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
  const { link, id, validationData } = context

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
    addIssue(context, ValidationErrorType.InvalidHash)
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

function getDocsPath(filePath: string, srcDir: AstroConfig['srcDir']) {
  return relative(fileURLToPath(srcDir), filePath).split(sep).join(posix.sep).replace('content/docs/', '')
}

async function buildValidationReportFile(
  fileValidationIssues: ValidationFileIssues,
  astroConfig: AstroConfig,
): Promise<{ errorCount: number; file: ValidationReport['files'][number]; hasInvalidLinkToCustomPage: boolean }> {
  const issuesWithPositions = await Promise.all(
    fileValidationIssues.issues.map(async (issue) => ({
      issue,
      position: await getErrorPosition(issue.reference, fileValidationIssues.filePath),
    })),
  )

  const groupedIssues: ValidationReportIssue[] = []
  let errorCount = 0
  let hasInvalidLinkToCustomPage = false

  for (const { issue, position } of issuesWithPositions) {
    errorCount += 1
    hasInvalidLinkToCustomPage ||= issue.type === ValidationErrorType.InvalidLinkToCustomPage

    const previousIssue = groupedIssues.at(-1)

    if (
      previousIssue &&
      previousIssue.link === issue.link &&
      previousIssue.type === issue.type &&
      isSameLineSourcePosition(previousIssue.positions[0], position)
    ) {
      previousIssue.positions.push(position)
    } else {
      groupedIssues.push({
        documentationUrl: getValidationErrorDocumentationUrl(issue.type),
        link: issue.link,
        message: getValidationErrorMessage(issue.type, { site: astroConfig.site }),
        positions: [position],
        type: issue.type,
      })
    }
  }

  return {
    errorCount,
    file: {
      docsPath: getDocsPath(fileValidationIssues.filePath, astroConfig.srcDir),
      filePath: fileValidationIssues.filePath,
      issues: groupedIssues,
    },
    hasInvalidLinkToCustomPage,
  }
}

function addIssue({ file, id, issues, link }: ValidationContext, type: ValidationErrorType) {
  const reportFile: ValidationFileIssues = issues.get(id) ?? { filePath: file, issues: [] }
  reportFile.issues.push({ link: link.raw, reference: link.reference, type })

  issues.set(id, reportFile)
}

export type ValidationErrorType = keyof typeof validationErrorDefinitions

interface ValidationIssue {
  link: string
  reference: Reference
  type: ValidationErrorType
}

interface ValidationFileIssues {
  filePath: string
  issues: ValidationIssue[]
}

interface PageData {
  pathname: string
}

type Pages = Set<PageData['pathname']>

interface ValidationContext {
  astroConfig: AstroConfig
  customPages: Set<string>
  id: string
  file: string
  issues: Map<string, ValidationFileIssues>
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
