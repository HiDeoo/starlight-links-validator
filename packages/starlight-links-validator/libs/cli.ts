import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters, styleText } from 'node:util'

import terminalLink from 'terminal-link'

import type { Position } from './position'

export function logStep(name: string) {
  process.stdout.write(`\n${styleText(['bgGreen', 'black'], ` ${name} `)}\n`)
}

export function logSummary(type: 'success' | 'error', text: string) {
  const colorFn = type === 'success' ? green : red
  const length = stripVTControlCharacters(text).length

  console.error(`\n${colorFn('╭─')}${' '.repeat(length)}${colorFn('─╮')}`)
  console.error(`${colorFn('·')} ${text} ${colorFn('·')}`)
  console.error(`${colorFn('╰─')}${pad(length)}${colorFn('─╯')}\n`)
}

export function fileLink(text: string, path: string, position?: Position) {
  let url = pathToFileURL(path).toString()

  if (position?.type === 'source') {
    url += `#${position.line}:${position.column}`
  }

  return urlLink(text, url)
}

export function urlLink(text: string, url: string) {
  return terminalLink(text, url, { fallback: false })
}

export function pad(length: number): string {
  return ' '.repeat(length)
}

export function red(text: string) {
  return styleText('red', text)
}

export function blue(text: string) {
  return styleText('blue', text)
}

export function green(text: string) {
  return styleText('green', text)
}

export function underline(text: string) {
  return styleText('underline', text)
}

export function dim(text: string) {
  return styleText('dim', text)
}
