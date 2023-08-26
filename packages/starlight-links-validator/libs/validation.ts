import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { bgGreen, black, bold, cyan, dim, red } from 'kleur/colors'

import { getValidationData, type Headings } from './remark'

export function validateLinks(pages: PageData[], outputDir: URL): ValidationErrors {
  process.stdout.write(`\n${bgGreen(black(` validating links `))}\n`)

  const { headings, links } = getValidationData()
  const allPages: Pages = new Set(pages.map((page) => page.pathname))

  const errors: ValidationErrors = new Map()

  for (const [filePath, fileLinks] of links) {
    for (const link of fileLinks) {
      if (link.startsWith('#')) {
        validateSelfAnchor(errors, link, filePath, headings)
      } else {
        validateLink(errors, link, filePath, headings, allPages, outputDir)
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
          'file'
        )}.`
      )
    )}\n\n`
  )

  for (const [file, links] of errors) {
    process.stderr.write(`${red('▶')} ${file}\n`)

    for (const [index, link] of links.entries()) {
      process.stderr.write(`  ${cyan(`${index < links.length - 1 ? '├' : '└'}─`)} ${link}\n`)
    }

    process.stdout.write(dim('\n'))
  }

  process.stdout.write(dim('\n'))
}

/**
 * Validate a link to another internal page that may or may not have a hash.
 */
function validateLink(
  errors: ValidationErrors,
  link: string,
  filePath: string,
  headings: Headings,
  pages: Pages,
  outputDir: URL
) {
  const sanitizedLink = link.replace(/^\//, '')
  const segments = sanitizedLink.split('#')

  let path = segments[0]
  const hash = segments[1]

  if (path === undefined) {
    throw new Error('Failed to validate a link with no path.')
  }

  if (isValidAsset(path, outputDir)) {
    return
  }

  if (path.length > 0 && !path.endsWith('/')) {
    path += '/'
  }

  const isValidPage = pages.has(path)
  const fileHeadings = headings.get(path === '' ? '/' : path)

  if (!isValidPage || !fileHeadings) {
    addError(errors, filePath, link)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    addError(errors, filePath, link)
  }
}

/**
 * Validate a link to an anchor in the same page.
 */
function validateSelfAnchor(errors: ValidationErrors, hash: string, filePath: string, headings: Headings) {
  const sanitizedHash = hash.replace(/^#/, '')
  const fileHeadings = headings.get(filePath)

  if (!fileHeadings) {
    throw new Error(`Failed to find headings for the file at '${filePath}'.`)
  }

  if (!fileHeadings.includes(sanitizedHash)) {
    addError(errors, filePath, hash)
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
