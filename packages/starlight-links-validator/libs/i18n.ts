import { ensureLeadingSlash, ensureTrailingSlash } from './path'
import type { Headings } from './remark'
import type { StarlightUserConfig } from './validation'

export function getLocaleConfig(config: StarlightUserConfig): LocaleConfig | undefined {
  if (!config.locales || Object.keys(config.locales).length === 0) return

  let defaultLocale = config.defaultLocale
  const locales: string[] = []

  for (const [dir, locale] of Object.entries(config.locales)) {
    if (!locale) continue

    if (dir === 'root') {
      if (!locale.lang) continue

      defaultLocale = ''
    }

    locales.push(dir)
  }

  if (defaultLocale === undefined) return

  return {
    defaultLocale,
    locales,
  }
}

export function getFallbackHeadings(
  path: string,
  headings: Headings,
  localeConfig: LocaleConfig | undefined,
): string[] | undefined {
  if (!localeConfig) return

  for (const locale of localeConfig.locales) {
    if (path.startsWith(`${locale}/`)) {
      const fallbackPath = path.replace(
        new RegExp(`^${locale}/`),
        localeConfig.defaultLocale === '' ? localeConfig.defaultLocale : `${localeConfig.defaultLocale}/`,
      )

      return headings.get(fallbackPath === '' ? '/' : fallbackPath)
    }
  }

  return
}

export function isInconsistentLocaleLink(path: string, link: string, localeConfig: LocaleConfig) {
  const pathLocale = getLocale(path, localeConfig)
  const linkLocale = getLocale(link, localeConfig)

  if (pathLocale !== undefined || linkLocale !== undefined) {
    return pathLocale !== linkLocale
  }

  return false
}

function getLocale(path: string, localeConfig: LocaleConfig) {
  const normalizedPath = ensureTrailingSlash(ensureLeadingSlash(path))

  for (const locale of localeConfig.locales) {
    if (normalizedPath.startsWith(`/${locale}/`)) {
      return locale
    }
  }

  return
}

export interface LocaleConfig {
  defaultLocale: string
  locales: string[]
}
