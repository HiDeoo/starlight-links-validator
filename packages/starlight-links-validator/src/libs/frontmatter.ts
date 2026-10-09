import type { DataMap } from 'vfile'
import { isScalar, LineCounter, parseDocument } from 'yaml'

import { makeUnavailablePosition, type FrontmatterReference, type Position } from './position'

export function getFrontmatterPosition(
  format: FrontmatterFormat,
  content: string,
  path: FrontmatterReference['path'],
): Position {
  return format === 'yaml' ? getYamlFrontmatterPosition(content, path) : getTomlFrontmatterPosition()
}

function getYamlFrontmatterPosition(content: string, path: FrontmatterReference['path']): Position {
  const lineCounter = new LineCounter()
  const doc = parseDocument(content, { lineCounter })
  const node = doc.getIn(path, true)

  if (!isScalar(node) || !node.range) return makeUnavailablePosition()

  const position = lineCounter.linePos(node.range[0])

  // Account for the starting '---' line of the frontmatter.
  return { type: 'source', line: position.line + 1, column: position.col }
}

function getTomlFrontmatterPosition(): Position {
  return makeUnavailablePosition()
}

export function isFrontmatterWithHeroActions(
  frontmatter: Frontmatter,
): frontmatter is Frontmatter & { hero: FrontmatterHeroActions } {
  return (
    frontmatter !== undefined &&
    'hero' in frontmatter &&
    typeof frontmatter['hero'] === 'object' &&
    'actions' in frontmatter['hero']
  )
}

export function isFrontmatterWithPrevNextLink<T extends 'prev' | 'next'>(
  frontmatter: Frontmatter,
  type: T,
): frontmatter is Frontmatter & Record<T, FrontmatterPrevNextLink> {
  return frontmatter !== undefined && isFrontmatterPrevNextLink(frontmatter[type])
}

export function isFrontmatterPrevNextLink(value: unknown): value is FrontmatterPrevNextLink {
  return typeof value === 'object' && value !== null && 'link' in value && typeof value.link === 'string'
}

export type FrontmatterFormat = 'yaml' | 'toml'

export type Frontmatter = DataMap['astro']['frontmatter']

interface FrontmatterHeroActions {
  actions: { link: string }[]
}

interface FrontmatterPrevNextLink {
  link: string
}
