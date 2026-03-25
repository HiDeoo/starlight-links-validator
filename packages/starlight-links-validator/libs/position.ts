import type { Element } from 'hast'
import type { MdxJsxFlowElementHast } from 'mdast-util-mdx-jsx'
import type { Raw } from 'mdast-util-to-hast'

import { getFrontmatterPosition } from './frontmatter'
import { readPreamble } from './preamble'

export function getNodeReference(node: Element | MdxJsxFlowElementHast | Raw, nestedNode?: Element): BodyReference {
  return {
    location: 'body',
    position: node.position
      ? {
          type: 'source',
          line: node.position.start.line + (nestedNode?.position ? nestedNode.position.start.line - 1 : 0),
          column: nestedNode?.position?.start.column ?? node.position.start.column,
        }
      : makeUnavailablePosition(),
  }
}

export function getFrontmatterReference(path: FrontmatterReference['path']): FrontmatterReference {
  return { location: 'frontmatter', path }
}

export async function getErrorPosition(reference: Reference, filePath: string): Promise<Position> {
  if (reference.location === 'frontmatter') {
    const preamble = await readPreamble(filePath)

    if (!preamble.frontmatter) return makeUnavailablePosition()

    return getFrontmatterPosition(preamble.frontmatter.format, preamble.frontmatter.content, reference.path)
  }

  const offset = await getPositionOffset(filePath)

  return reference.position.type === 'source'
    ? { ...reference.position, line: reference.position.line + offset }
    : reference.position
}

export function makeUnavailablePosition(): UnavailablePosition {
  return { type: 'unavailable' }
}

export function isSameLineSourcePosition(a: Position, b: Position): boolean {
  if (a.type === 'unavailable' || b.type === 'unavailable') return false
  return a.line === b.line
}

async function getPositionOffset(filePath: string): Promise<number> {
  let offset = 0

  if (!isMdxFile(filePath)) {
    const preamble = await readPreamble(filePath)
    offset = preamble.lines
  }

  return offset
}

function isMdxFile(path: string): boolean {
  return path.endsWith('.mdx')
}

export type Position = SourcePosition | UnavailablePosition

interface SourcePosition {
  type: 'source'
  line: number
  column: number
}

interface UnavailablePosition {
  type: 'unavailable'
}

export type Reference = FrontmatterReference | BodyReference

export interface FrontmatterReference {
  location: 'frontmatter'
  path: (string | number)[]
}

interface BodyReference {
  location: 'body'
  position: Position
}
