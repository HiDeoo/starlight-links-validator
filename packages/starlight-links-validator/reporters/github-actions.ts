import { appendFileSync } from 'node:fs'
import { isAbsolute, posix, relative, sep } from 'node:path'

import type { Position } from '../libs/position'
import { pluralize } from '../libs/text'
import type { Reporter, ValidationReport } from '../reporters'

const lineBreakRegex = /\r?\n/g
const backtickRegex = /`+/g

export const gitHubActionsReporter: Reporter = {
  name: 'GitHub Actions',
  report(report, { options }) {
    if (!options.reporters.githubActions) return

    const outputPath = process.env['GITHUB_OUTPUT']

    if (outputPath) {
      appendFileSync(outputPath, `link_validation_failed=${report.hasErrors}\n`, 'utf8')
    }

    // Only write the step summary if there are errors.
    if (!report.hasErrors) return

    const summaryPath = process.env['GITHUB_STEP_SUMMARY']
    if (!summaryPath) return

    appendFileSync(summaryPath, renderGitHubActionsReport(report), 'utf8')
  },
}

function renderGitHubActionsReport(report: ValidationReport): string {
  const table = renderGitHubActionsErrorTable(report)

  return `
## Starlight Links Validator

❌ **Link validation failed.**

Found **${report.errorCount}** invalid ${pluralize(report.errorCount, 'link')} in **${report.files.length}** ${pluralize(report.files.length, 'file')}.

${table}

<details>
<summary>Report Markdown source</summary>

${makeMarkdownCodeBlock(table, 'md')}
</details>
`
}

function renderGitHubActionsErrorTable(report: ValidationReport): string {
  return [
    '| File | Link | Position | Error |',
    '| --- | --- | :---: | --- |',
    ...report.files.flatMap((file) =>
      file.issues.flatMap((issue) => {
        return issue.positions.map((position) => {
          const fileLink = makeFileLink(file.docsPath, file.filePath, position)
          const link = makeInlineCode(issue.link)
          const positionLabel = position.type === 'source' ? makeInlineCode(`${position.line}:${position.column}`) : '-'
          const error = `[${issue.message}](${issue.documentationUrl})`

          return `| ${escapeTableCell(fileLink)} | ${escapeTableCell(link)} | ${positionLabel} | ${escapeTableCell(error)} |`
        })
      }),
    ),
  ].join('\n')
}

function escapeTableCell(content: string): string {
  return content.replaceAll('|', String.raw`\|`)
}

function makeInlineCode(code: string): string {
  const normalizedCode = code.replaceAll(lineBreakRegex, ' ')
  const consecutiveBackticks = normalizedCode.match(backtickRegex)

  // We need to use one more backtick than the longest sequence of backticks in the code.
  const delimiter = '`'.repeat(Math.max(...(consecutiveBackticks?.map((backticks) => backticks.length) ?? [0])) + 1)

  let escapedCode = normalizedCode
  if (escapedCode.startsWith('`')) escapedCode = ` ${escapedCode}`
  if (escapedCode.endsWith('`')) escapedCode = `${escapedCode} `

  return `${delimiter}${escapedCode}${delimiter}`
}

function makeMarkdownCodeBlock(content: string, language?: string): string {
  const consecutiveBackticks = content.match(backtickRegex)

  // We need to use at least three backticks and one more than the longest sequence of backticks in the content.
  const delimiter = '`'.repeat(Math.max(...(consecutiveBackticks?.map((backticks) => backticks.length) ?? [0]), 2) + 1)

  return `${delimiter}${language ?? ''}\n${content}\n${delimiter}`
}

function makeFileLink(docsPath: string, filePath: string, position: Position): string {
  const fileUrl = getGitHubFileUrl(filePath, position.type === 'source' ? position.line : undefined)
  const label = makeInlineCode(docsPath)

  return fileUrl ? `[${label}](${fileUrl})` : label
}

function getGitHubFileUrl(filePath: string, line?: number): string | undefined {
  const repository = process.env['GITHUB_REPOSITORY']
  const sha = process.env['GITHUB_SHA']
  const workspace = process.env['GITHUB_WORKSPACE']

  if (!repository || !sha || !workspace) return

  const path = relative(workspace, filePath)
  if (path.startsWith('..') || isAbsolute(path)) return

  const normalizedPath = path.split(sep).join(posix.sep)
  const encodedPath = normalizedPath.split(posix.sep).map(encodeURIComponent).join(posix.sep)
  const url = new URL(`https://github.com/${repository}/blob/${sha}/${encodedPath}`)

  url.searchParams.set('plain', '1')
  if (line) url.hash = `L${line}`

  return url.toString()
}
