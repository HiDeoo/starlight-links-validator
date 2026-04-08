import type { AstroConfig, AstroIntegrationLogger } from 'astro'

import type { StarlightLinksValidatorOptions } from '../libs/config'
import type { Position } from '../libs/position'
import type { ValidationErrorType } from '../libs/validation'

export async function runReporters(reporters: Reporter[], report: ValidationReport, context: ReporterContext) {
  for (const reporter of reporters) {
    try {
      await reporter.report(report, context)
    } catch (error) {
      context.logger.warn(
        `Failed to run the ${reporter.name} reporter: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}

interface ReporterContext {
  astroConfig: Pick<AstroConfig, 'root'>
  logger: AstroIntegrationLogger
  options: StarlightLinksValidatorOptions
}

export interface Reporter {
  name: string
  report: (report: ValidationReport, context: ReporterContext) => void | Promise<void>
}

export interface ValidationReport {
  errorCount: number
  files: ValidationReportFile[]
  hasErrors: boolean
  hasInvalidLinkToCustomPage: boolean
}

interface ValidationReportFile {
  docsPath: string
  filePath: string
  issues: ValidationReportIssue[]
}

export interface ValidationReportIssue {
  documentationUrl: string
  link: string
  message: string
  positions: [Position, ...Position[]]
  type: ValidationErrorType
}
