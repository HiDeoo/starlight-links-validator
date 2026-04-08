import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters, styleText } from 'node:util'

import terminalLink from 'terminal-link'

import type { Position } from '../libs/position'
import { pluralize } from '../libs/text'
import type { Reporter } from '../reporters'

export const cliReporter: Reporter = {
  name: 'CLI',
  report(report) {
    if (!report.hasErrors) {
      logSummary('success', 'All internal links are valid.')
      return
    }

    for (const file of report.files) {
      const maxLine = Math.max(
        ...file.issues.map(({ positions }) => (positions[0].type === 'unavailable' ? 0 : positions[0].line)),
      )
      const maxLineLength = String(maxLine).length

      console.error(`\n${pad(maxLineLength)} ╭─ ${blue(fileLink(file.docsPath, file.filePath))}`)
      console.error(`${pad(maxLineLength)} ·`)

      for (const issue of file.issues) {
        const position = issue.positions[0]
        const count = issue.positions.length > 1 ? ` (x${issue.positions.length})` : ''
        const prefix = `${pad(maxLineLength)} · `
        const message = `╰── ${urlLink(issue.message, issue.documentationUrl)}${count}`
        const offset = getMessageOffset(
          prefix,
          message,
          Math.max(issue.link.length - 2, issue.link.length === 2 ? 1 : 0),
        )

        console.error(
          `${logPosition(position, maxLineLength)} | ${underline(fileLink(issue.link, file.filePath, position))}`,
        )
        console.error(`${prefix}${pad(offset)}${dim(message)}`)
      }
    }

    logSummary(
      'error',
      `Found ${red(String(report.errorCount))} invalid ${pluralize(report.errorCount, 'link')} in ${red(String(report.files.length))} ${pluralize(report.files.length, 'file')}.`,
    )
  },
}

export function logStep(name: string) {
  process.stdout.write(`\n${styleText(['bgGreen', 'black'], ` ${name} `)}\n`)
}

function logPosition(position: Position, maxLinePositionLength: number): string {
  if (position.type === 'unavailable') return pad(maxLinePositionLength)

  const linePositionLength = String(position.line).length

  return `${' '.repeat(maxLinePositionLength - linePositionLength)}${dim(String(position.line))}`
}

function logSummary(type: 'success' | 'error', text: string) {
  const colorFn = type === 'success' ? green : red
  const length = stripVTControlCharacters(text).length

  console.error(`\n${colorFn('╭─')}${' '.repeat(length)}${colorFn('─╮')}`)
  console.error(`${colorFn('·')} ${text} ${colorFn('·')}`)
  console.error(`${colorFn('╰─')}${pad(length)}${colorFn('─╯')}\n`)
}

function fileLink(text: string, path: string, position?: Position) {
  let url = pathToFileURL(path).toString()

  if (position?.type === 'source') {
    url += `#${position.line}:${position.column}`
  }

  return urlLink(text, url)
}

function urlLink(text: string, url: string) {
  return terminalLink(text, url, { fallback: false })
}

function pad(length: number): string {
  return ' '.repeat(length)
}

function red(text: string) {
  return styleText('red', text)
}

function blue(text: string) {
  return styleText('blue', text)
}

function green(text: string) {
  return styleText('green', text)
}

function underline(text: string) {
  return styleText('underline', text)
}

function dim(text: string) {
  return styleText('dim', text)
}

function getMessageOffset(prefix: string, message: string, offset: number): number {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- I am not 100% sure if these values are always available.
  const terminalWidth = process.stderr.columns ?? process.stdout.columns ?? 80
  const prefixWidth = stripVTControlCharacters(prefix).length
  const messageWidth = stripVTControlCharacters(message).length
  const availableWidth = Math.max(0, terminalWidth - prefixWidth)

  const halfWidthOffset = Math.max(0, Math.floor(availableWidth / 2))
  const fitMessageOffset = Math.max(0, availableWidth - messageWidth)

  return Math.min(offset, halfWidthOffset, fitMessageOffset)
}
