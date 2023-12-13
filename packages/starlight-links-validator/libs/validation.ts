import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { StarlightPlugin } from '@astrojs/starlight/types'
import { bgGreen, black, blue, bold, dim, red } from 'kleur/colors'

import type { StarlightLinksValidatorOptions } from '..'

import { getFallbackHeadings, getLocaleConfig, isInconsistentLocaleLink, type LocaleConfig } from './i18n'
import { ensureTrailingSlash } from './path'
import { getValidationData, type Headings } from './remark'

export function validateLinks(
  pages: PageData[],
  outputDir: URL,
  starlightConfig: StarlightUserConfig,
  options: StarlightLinksValidatorOptions,
): ValidationErrors {
  process.stdout.write(`\n${bgGreen(black(` validating links `))}\n`)

  const localeConfig = getLocaleConfig(starlightConfig)
  const { headings, links } = getValidationData()
  const allPages: Pages = new Set(pages.map((page) => ensureTrailingSlash(page.pathname)))

  const errors: ValidationErrors = new Map()

  for (const [filePath, fileLinks] of links) {
    for (const link of fileLinks) {
      const validationContext: ValidationContext = {
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

export function logErrors(errors: ValidationErrors) {
  if (errors.size === 0) {
    process.stdout.write(dim('All internal links are valid.\n\n'))
    return
  }

  const errorCount = [...errors.values()].reduce((acc, links) => acc + links.length, 0)

  process.stderr.write(
    `${bold(
      red(
        `Found ${errorCount} invalid ${pluralize(errorCount, 'link')} in ${errors.size} ${pluralize(
          errors.size,
          'file',
        )}.`,
      ),
    )}\n\n`,
  )

  for (const [file, links] of errors) {
    process.stderr.write(`${red('▶')} ${file}\n`)

    for (const [index, link] of links.entries()) {
      process.stderr.write(`  ${blue(`${index < links.length - 1 ? '├' : '└'}─`)} ${link}\n`)
    }

    process.stdout.write(dim('\n'))
  }

  process.stdout.write(dim('\n'))
}

/**
 * Validate a link to another internal page that may or may not have a hash.
 */
function validateLink(context: ValidationContext) {
  const { errors, filePath, link, localeConfig, options, outputDir, pages } = context

  const sanitizedLink = link.replace(/^\//, '')
  const segments = sanitizedLink.split('#')

  let path = segments[0]
  const hash = segments[1]

  if (path === undefined) {
    throw new Error('Failed to validate a link with no path.')
  }

  if (path.startsWith('.')) {
    if (options.errorOnRelativeLinks) {
      addError(errors, filePath, link)
    }

    return
  }

  if (isValidAsset(path, outputDir)) {
    return
  }

  path = ensureTrailingSlash(path)

  const isValidPage = pages.has(path)
  const fileHeadings = getFileHeadings(path, context)

  if (!isValidPage || !fileHeadings) {
    addError(errors, filePath, link)
    return
  }

  if (options.errorOnInconsistentLocale && localeConfig && isInconsistentLocaleLink(filePath, link, localeConfig)) {
    addError(errors, filePath, link)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    addError(errors, filePath, link)
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
    addError(errors, filePath, link)
  }
}

/**
 * Check if a link is a valid asset in the build output directory.
 */
function isValidAsset(path: string, outputDir: URL) {
  const filePath = fileURLToPath(new URL(path, outputDir))

  try {
    const stats = statSync(filePath)

    return stats.isFile()
  } catch {
    return false
  }
}

function addError(errors: ValidationErrors, filePath: string, link: string) {
  const fileErrors = errors.get(filePath) ?? []
  fileErrors.push(link)

  errors.set(filePath, fileErrors)
}

function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`
}

// The invalid links keyed by file path.
type ValidationErrors = Map<string, string[]>

interface PageData {
  pathname: string
}

type Pages = Set<PageData['pathname']>

interface ValidationContext {
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
