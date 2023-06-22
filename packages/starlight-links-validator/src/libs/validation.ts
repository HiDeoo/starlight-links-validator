import { getValidationData, type Headings } from './remark'

export function validateLinks(pages: PageData[]): ValidationErrors {
  const { headings, links } = getValidationData()
  const allPages: Pages = new Set(pages.map((page) => page.pathname))
  console.error({ headings })

  const errors: ValidationErrors = []

  for (const [file, fileLinks] of links) {
    for (const link of fileLinks) {
      if (link.startsWith('#')) {
        validateSelfAnchor(errors, link, file, headings)
      } else {
        validateLink(errors, link, headings, allPages)
      }
    }
  }

  return errors
}

/**
 * Validate a link to another internal page that may or may not have a hash.
 */
function validateLink(errors: ValidationErrors, link: string, headings: Headings, pages: Pages) {
  console.error('🚨 [validation.ts:20] link:', link)
  const sanitizedLink = link.replace(/^\//, '')
  console.error('🚨 [validation.ts:20] sanitizedLink:', sanitizedLink)
  const segments = sanitizedLink.split('#')

  let path = segments[0]
  const hash = segments[1]

  if (path === undefined) {
    throw new Error('Failed to validate a link with no path.')
  } else if (path.length > 0 && !path.endsWith('/')) {
    path += '/'
  }

  const isValidPage = pages.has(path)
  const fileHeadings = headings.get(path === '' ? '/' : path)

  if (!isValidPage || !fileHeadings) {
    // TODO(HiDeoo)
    errors.push(path)
    return
  }

  if (hash && !fileHeadings.includes(hash)) {
    // TODO(HiDeoo)
    errors.push(hash)
    return
  }
}

/**
 * Validate a link to an anchor in the same page.
 */
function validateSelfAnchor(errors: ValidationErrors, hash: string, path: string, headings: Headings) {
  const sanitizedHash = hash.replace(/^#/, '')
  const fileHeadings = headings.get(path)

  if (!fileHeadings) {
    throw new Error(`Failed to find headings for the file at '${path}'.`)
  }

  if (!fileHeadings.includes(sanitizedHash)) {
    // TODO(HiDeoo)
    errors.push(hash)
  }
}

type ValidationError = string
type ValidationErrors = ValidationError[]

interface PageData {
  pathname: string
}

type Pages = Set<PageData['pathname']>
