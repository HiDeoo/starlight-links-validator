import type { ValidationConfig } from './config'
import type { Link } from './link'
import type { FrontmatterReference } from './position'

export function getValidationData(): ValidationData {
  globalThis._starlightLinksValidatorValidationData ??= new Map()
  return globalThis._starlightLinksValidatorValidationData
}

export function setValidationData(id: string, entry: ValidationDataEntry) {
  getValidationData().set(id, entry)
}

export function clearValidationData() {
  getValidationData().clear()
}

export function getValidationConfig(): ValidationConfig | undefined {
  return globalThis._starlightLinksValidatorValidationConfig
}

export function setValidationConfig(config: ValidationConfig) {
  globalThis._starlightLinksValidatorValidationConfig = config
}

export function updateFrontmatterLink(id: string, path: FrontmatterReference['path'], link: Link | undefined) {
  const entry = getValidationData().get(id)
  if (!entry) return

  const linkIndex = entry.links.findIndex(
    (link) => link.reference.location === 'frontmatter' && isEqualReferencePath(link.reference.path, path),
  )
  if (linkIndex === -1) return

  if (!link) {
    entry.links.splice(linkIndex, 1)
    return
  }

  const currentLink = entry.links[linkIndex]
  if (!currentLink) return

  entry.links[linkIndex] = {
    ...currentLink,
    error: link.error,
    transformed: link.transformed ?? (link.raw === currentLink.raw ? undefined : link.raw),
  }
}

function isEqualReferencePath(a: FrontmatterReference['path'], b: FrontmatterReference['path']) {
  return a.length === b.length && a.every((segment, index) => segment === b[index])
}

declare global {
  var _starlightLinksValidatorValidationConfig: ValidationConfig | undefined
  var _starlightLinksValidatorValidationData: ValidationData | undefined
}

export type ValidationData = Map<string, ValidationDataEntry>

interface ValidationDataEntry {
  // The absolute path to the file.
  file: string
  // All the headings.
  headings: string[]
  // All the internal links.
  links: Link[]
}
