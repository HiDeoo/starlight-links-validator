import { fileURLToPath } from 'node:url'
import { format, stripVTControlCharacters } from 'node:util'

import { build } from 'astro'
import { expect, vi } from 'vitest'

import { getValidationErrorMessage, type ValidationErrorType } from '../libs/validation'

export async function buildFixture(name: string) {
  const fixturePath = fileURLToPath(new URL(`fixtures/${name}/`, import.meta.url))

  let output = ''
  let status: 'success' | 'error'

  const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(vi.fn())
  const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(vi.fn())
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn())

  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    output += `${format(...args)}\n`
  })

  try {
    await build({ root: fixturePath })
    status = 'success'
  } catch {
    status = 'error'
  } finally {
    stderrWriteSpy.mockRestore()
    stdoutWriteSpy.mockRestore()
    consoleWarnSpy.mockRestore()

    consoleErrorSpy.mockRestore()
  }

  return { output, status }
}

export const expectValidationErrorCount = vi.defineHelper((output: string, count: number, filesCount: number) => {
  expect(stripVTControlCharacters(output)).toMatch(
    makeAndEscapeRegex(
      `Found ${count} invalid ${count === 1 ? 'link' : 'links'} in ${filesCount} ${
        filesCount === 1 ? 'file' : 'files'
      }.`,
    ),
  )
})

export const expectValidationErrors = vi.defineHelper(
  (
    output: string,
    path: string,
    validationErrors: [
      link: string,
      type: ValidationErrorType,
      line: number | undefined,
      site?: string | undefined,
      count?: number,
    ][],
  ) => {
    const pattern = [
      String.raw`(?:^|\n)\s*╭─\s+${escapeRegex(path)}`,
      String.raw`\n\s*·`,
      ...validationErrors.flatMap(([link, type, line, site, count]) => {
        const message = getValidationErrorMessage(type, { site })
        const suffix = count && count > 1 ? ` (x${count})` : ''

        return [
          String.raw`\n\s*${line ?? String.raw`\s*`}\s+\|\s+${escapeRegex(link)}`,
          String.raw`\n\s*·\s+.*╰──\s+${escapeRegex(`${message}${suffix}`)}`,
        ]
      }),
    ].join('')

    expect(stripVTControlCharacters(output)).toMatch(new RegExp(pattern))
  },
)

function makeAndEscapeRegex(string: string) {
  return new RegExp(escapeRegex(string))
}

function escapeRegex(string: string) {
  // https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/index.js
  return string.replaceAll(/[|\\{}()[\]^$+*?.]/g, String.raw`\$&`).replaceAll('-', String.raw`\x2d`)
}
