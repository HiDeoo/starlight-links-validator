import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Position } from '../libs/position'
import type { ValidationReport } from '../reporters'

const outputFileName = '.starlight-links-validator/errors.json'

export function reportToJson(report: ValidationReport, root: string) {
  const outputPath = join(root, outputFileName)

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, JSON.stringify(renderJsonReport(report), null, 2), 'utf8')

  return outputPath
}

function renderJsonReport(report: ValidationReport): JsonReport {
  return {
    errorCount: report.errorCount,
    fileCount: report.files.length,
    errors: report.files.flatMap((file) =>
      file.issues.flatMap((issue) =>
        issue.positions.map((position) => ({
          file: file.docsPath,
          filePath: file.filePath,
          link: issue.link,
          position: formatPosition(position),
          error: issue.message,
          docsUrl: issue.docsUrl,
        })),
      ),
    ),
  }
}

function formatPosition(position: Position): string | null {
  return position.type === 'source' ? `${position.line}:${position.column}` : null
}

interface JsonReportError {
  file: string
  filePath: string
  link: string
  position: string | null
  error: string
  docsUrl: string
}

interface JsonReport {
  errorCount: number
  fileCount: number
  errors: JsonReportError[]
}
