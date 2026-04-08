import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Position } from '../libs/position'
import type { Reporter, ValidationReport } from '../reporters'

export const jsonReporter: Reporter = {
  name: 'JSON',
  report(report, { astroConfig: { root }, logger, options }) {
    const reportDirUrl = new URL('.starlight-links-validator/', root)
    const reportFileUrl = new URL('errors.json', reportDirUrl)

    rmSync(reportFileUrl, { force: true })

    if (!options.reporters.json || !report.hasErrors) return

    mkdirSync(reportDirUrl, { recursive: true })
    writeFileSync(reportFileUrl, JSON.stringify(renderJsonReport(report), null, 2), 'utf8')

    logger.info(`Links validation report written to ${fileURLToPath(reportFileUrl)}`)
  },
}

function renderJsonReport(report: ValidationReport): JsonReport {
  return {
    errorCount: report.errorCount,
    errorFileCount: report.files.length,
    errors: report.files.flatMap((file) =>
      file.issues.flatMap((issue) =>
        issue.positions.map((position) => ({
          docsPath: file.docsPath,
          link: issue.link,
          position: formatPosition(position),
          message: issue.message,
          documentationUrl: issue.documentationUrl,
        })),
      ),
    ),
  }
}

function formatPosition(position: Position): JsonReportError['position'] {
  return position.type === 'source' ? { line: position.line, column: position.column } : null
}

interface JsonReportError {
  docsPath: string
  link: string
  position: { line: number; column: number } | null
  message: string
  documentationUrl: string
}

interface JsonReport {
  errorCount: number
  errorFileCount: number
  errors: JsonReportError[]
}
