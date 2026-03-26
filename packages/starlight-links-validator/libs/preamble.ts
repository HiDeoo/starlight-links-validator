import fs from 'node:fs'
import readline from 'node:readline'

import type { FrontmatterFormat } from './frontmatter'

const blankLineRegex = /^[ \t]*$/
const yamlFrontmatterDelimiterRegex = /^---[ \t]*$/
const tomlFrontmatterDelimiterRegex = /^\+\+\+[ \t]*$/

// A map of preambles keyed by file path.
const preambles = new Map<string, Preamble>()

export async function readPreamble(filePath: string): Promise<Preamble> {
  let preamble = preambles.get(filePath)
  if (preamble) return preamble

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
  const rl = readline.createInterface({
    crlfDelay: Infinity,
    input: stream,
  })

  const lines: { leading: string[]; frontmatter: string[]; trailing: string[] } = {
    leading: [],
    frontmatter: [],
    trailing: [],
  }

  let state: 'before-frontmatter' | 'in-frontmatter' | 'after-frontmatter' = 'before-frontmatter'
  let frontmatterFormat: 'yaml' | 'toml' | undefined

  try {
    for await (const line of rl) {
      const isBlankLine = blankLineRegex.test(line)
      const isYamlFrontmatterDelimiter = yamlFrontmatterDelimiterRegex.test(line)
      const isTomlFrontmatterDelimiter = tomlFrontmatterDelimiterRegex.test(line)

      if (state === 'before-frontmatter') {
        if (isBlankLine) {
          lines.leading.push(line)
          continue
        }

        if (lines.leading.length === 0 && (isYamlFrontmatterDelimiter || isTomlFrontmatterDelimiter)) {
          lines.frontmatter.push(line)
          state = 'in-frontmatter'
          frontmatterFormat = isYamlFrontmatterDelimiter ? 'yaml' : 'toml'
          continue
        }

        // If we reach the first non-blank line that is not the start of frontmatter, it's the end of preamble.
        break
      } else if (state === 'in-frontmatter') {
        lines.frontmatter.push(line)

        if (
          (isYamlFrontmatterDelimiter && frontmatterFormat === 'yaml') ||
          (isTomlFrontmatterDelimiter && frontmatterFormat === 'toml')
        ) {
          state = 'after-frontmatter'
        }

        continue
      } else {
        if (isBlankLine) {
          lines.trailing.push(line)
          continue
        }

        // If we reach the first non-blank line after the frontmatter, it's the end of preamble.
        break
      }
    }
  } finally {
    rl.close()
    stream.destroy()
  }

  const content =
    // If there is no frontmatter, or if there is a non-closed frontmatter, return leading blank lines only.
    lines.frontmatter.length === 0 || state !== 'after-frontmatter'
      ? lines.leading
      : [...lines.leading, ...lines.frontmatter, ...lines.trailing]

  preamble = { lines: content.length }

  if (lines.frontmatter.length > 2 && state === 'after-frontmatter' && frontmatterFormat) {
    preamble.frontmatter = {
      format: frontmatterFormat,
      content: lines.frontmatter.slice(1, -1).join('\n'),
    }
  }

  preambles.set(filePath, preamble)

  return preamble
}

// A preamble is the part of a file before the first content line, which can either be:
// - blank lines only
// - frontmatter (yaml or toml) + optional blank lines after it
// - nothing (if the file starts with content right away)
interface Preamble {
  frontmatter?: {
    format: FrontmatterFormat
    // The content of the frontmatter, if any, without delimiters.
    content: string
  }
  // The number of lines in the preamble before the first content line.
  lines: number
}
