import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, stripVTControlCharacters } from 'node:util'

import { build, type AstroIntegrationLogger } from 'astro'
import { expect, vi } from 'vitest'

import { StarlightLinksValidatorOptionsSchema, type StarlightLinksValidatorUserOptions } from '../libs/config'
import { getValidationErrorMessage, ValidationErrorType } from '../libs/validation'
import type { ValidationReportIssue } from '../reporters'

export const testRootUrl = new URL('project/', import.meta.url)

export async function buildFixture(name: string) {
  const fixturePath = fileURLToPath(new URL(`fixtures/${name}/`, import.meta.url))

  vi.stubEnv('GITHUB_OUTPUT', '')
  vi.stubEnv('GITHUB_STEP_SUMMARY', '')

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
    vi.unstubAllEnvs()

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

export function createTestReporterInput(
  files: TestValidationReportFile[],
  userOptions: StarlightLinksValidatorUserOptions = {},
) {
  const errorCount = files
    .flatMap((file) => file.issues)
    .reduce((count, issue, index) => count + getIssuePositions(issue, index).length, 0)
  return {
    report: {
      errorCount,
      files: files.map((file) => ({
        docsPath: basename(file.filePath),
        filePath: `/repo/src/content/docs/${file.filePath}`,
        issues: file.issues.map((issue, index) => ({
          documentationUrl: 'https://example.com/errors/invalid-link/',
          link: issue.link,
          message: 'invalid link',
          positions: toSourcePositions(getIssuePositions(issue, index)),
          type: ValidationErrorType.InvalidLink,
        })),
      })),
      hasErrors: errorCount > 0,
      hasInvalidLinkToCustomPage: false,
    },
    context: {
      astroConfig: { root: testRootUrl },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
      } as unknown as AstroIntegrationLogger,
      options: StarlightLinksValidatorOptionsSchema.parse(userOptions),
    },
  }
}

function getIssuePositions(issue: TestValidationReportIssue, index: number) {
  return issue.positions ?? [{ column: 1, line: index + 1 }]
}

function toSourcePositions(positions: [TestPosition, ...TestPosition[]]): ValidationReportIssue['positions'] {
  const [firstPosition, ...otherPositions] = positions

  return [
    { ...firstPosition, type: 'source' as const },
    ...otherPositions.map((position) => ({ ...position, type: 'source' as const })),
  ]
}

function makeAndEscapeRegex(string: string) {
  return new RegExp(escapeRegex(string))
}

function escapeRegex(string: string) {
  // https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/index.js
  return string.replaceAll(/[|\\{}()[\]^$+*?.]/g, String.raw`\$&`).replaceAll('-', String.raw`\x2d`)
}

export interface TestValidationReportFile {
  filePath: string
  issues: TestValidationReportIssue[]
}

interface TestPosition {
  column: number
  line: number
}

interface TestValidationReportIssue {
  link: string
  positions?: [TestPosition, ...TestPosition[]]
}
