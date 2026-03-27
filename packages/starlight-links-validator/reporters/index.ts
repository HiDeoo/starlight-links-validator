import type { Position } from '../libs/position'
import type { ValidationErrorType } from '../libs/validation'

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
  docsUrl: string
  link: string
  message: string
  positions: [Position, ...Position[]]
  type: ValidationErrorType
}
