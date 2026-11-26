import isAbsolute from 'is-absolute-url'

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

  if (!isAbsoluteUrl(normalizedLink)) {
    return linkToValidate
  }

  try {
    const url = new URL(normalizedLink)

    if (options.sameSitePolicy !== 'ignore' && url.origin === site) {
      if (options.sameSitePolicy === 'error') {
        return { ...linkToValidate, error: ValidationErrorType.SameSite }
      }

      let transformed = normalizedLink.replace(url.origin, '')
      if (!transformed) transformed = '/'
      return { ...linkToValidate, transformed }
    }

    if (!options.errorOnLocalLinks) return

    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      ? { ...linkToValidate, error: ValidationErrorType.LocalLink }
      : undefined
  } catch {
    return undefined
  }
}

export function isAbsoluteUrl(link: string): boolean {
  return isAbsolute(link, { httpOnly: false })
}

export function decodeLink(link: string) {
  const hashIndex = link.indexOf('#')

  let beforeHash = hashIndex === -1 ? link : link.slice(0, hashIndex)
  let hash = hashIndex === -1 ? undefined : link.slice(hashIndex + 1)

  try {
    beforeHash = decodeURI(beforeHash)
  } catch {
    // Ignore decoding errors
  }

  if (hash) {
    try {
      hash = decodeURIComponent(hash)
    } catch {
      // Ignore decoding errors
    }
  }

  return { beforeHash, hash }
}

function normalizeLink(link: string): string {
  const { beforeHash, hash } = decodeLink(link)

  return hash === undefined ? beforeHash : `${beforeHash}#${hash}`
}

export interface Link {
  error?: ValidationErrorType | undefined
  raw: string
  reference: Reference
  transformed?: string | undefined
}
