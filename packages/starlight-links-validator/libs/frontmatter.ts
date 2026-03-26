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

export type FrontmatterFormat = 'yaml' | 'toml'
