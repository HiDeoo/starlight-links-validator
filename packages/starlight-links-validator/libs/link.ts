import isAbsoluteUrl from 'is-absolute-url'

import type { ValidationConfig } from './config'
import type { Reference } from './position'
import { ValidationErrorType } from './validation'

export function getLinkToValidate(
  link: string,
  reference: Reference,
  { options, site }: ValidationConfig,
): Link | undefined {
  const normalizedLink = normalizeLink(link)
  const linkToValidate = { reference, raw: normalizedLink }

  if (!isAbsoluteUrl(normalizedLink, { httpOnly: false })) {
    return linkToValidate
  }

  try {
    const url = new URL(normalizedLink)

    if (options.sameSitePolicy !== 'ignore' && url.origin === site) {
      if (options.sameSitePolicy === 'error') {
        return { ...linkToValidate, error: ValidationErrorType.SameSite }
      } else {
        let transformed = normalizedLink.replace(url.origin, '')
        if (!transformed) transformed = '/'
        return { ...linkToValidate, transformed }
      }
    }

    if (!options.errorOnLocalLinks) return

    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      ? { ...linkToValidate, error: ValidationErrorType.LocalLink }
      : undefined
  } catch {
    return undefined
  }
}

function normalizeLink(link: string): string {
  const hashIndex = link.indexOf('#')
  if (hashIndex === -1) return link

  const beforeHash = link.slice(0, hashIndex)
  const hash = link.slice(hashIndex + 1)
  if (hash.length === 0) return link

  try {
    return `${beforeHash}#${decodeURIComponent(hash)}`
  } catch {
    return link
  }
}

export interface Link {
  error?: ValidationErrorType | undefined
  raw: string
  reference: Reference
  transformed?: string | undefined
}
