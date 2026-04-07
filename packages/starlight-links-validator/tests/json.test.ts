import { basename } from 'node:path'

import { beforeEach, expect, test, vi } from 'vitest'

import { ValidationErrorType } from '../libs/validation'
import type { ValidationReportIssue } from '../reporters'

let reportToJson: typeof import('../reporters/json').reportToJson

const mocks = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({ mkdirSync: mocks.mkdirSync, writeFileSync: mocks.writeFileSync }))

beforeEach(async () => {
  vi.clearAllMocks()
  vi.resetModules()

  const mod = await import('../reporters/json')

  reportToJson = mod.reportToJson
})

test('writes a JSON report to the expected path', () => {
  testReportToJson([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(mocks.mkdirSync).toHaveBeenCalledOnce()
  expect(mocks.mkdirSync.mock.calls[0]?.[0]).toBe('/project/.starlight-links-validator')
  expect(mocks.mkdirSync.mock.calls[0]?.[1]).toStrictEqual({ recursive: true })

  expect(mocks.writeFileSync).toHaveBeenCalledOnce()
  expect(mocks.writeFileSync.mock.calls[0]?.[0]).toBe('/project/.starlight-links-validator/errors.json')
})

test('returns the output path', () => {
  const path = testReportToJson([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(path).toBe('/project/.starlight-links-validator/errors.json')
})

test('writes structured JSON matching the GitHub Actions reporter output', () => {
  testReportToJson([
    { filePath: 'index.md', issues: [{ link: '/missing/' }] },
    {
      filePath: 'test.md',
      issues: [
        {
          link: '/docs/test-a',
          positions: [
            { column: 1, line: 1 },
            { column: 15, line: 1 },
          ],
        },
        { link: '/docs/test-b' },
      ],
    },
  ])

  const written = JSON.parse(mocks.writeFileSync.mock.calls[0]?.[1] as string) as Record<string, unknown>

  expect(written).toMatchInlineSnapshot(`
    {
      "errorCount": 4,
      "errors": [
        {
          "docsUrl": "https://example.com/errors/invalid-link/",
          "error": "invalid link",
          "file": "index.md",
          "filePath": "/repo/src/content/docs/index.md",
          "link": "/missing/",
          "position": "1:1",
        },
        {
          "docsUrl": "https://example.com/errors/invalid-link/",
          "error": "invalid link",
          "file": "test.md",
          "filePath": "/repo/src/content/docs/test.md",
          "link": "/docs/test-a",
          "position": "1:1",
        },
        {
          "docsUrl": "https://example.com/errors/invalid-link/",
          "error": "invalid link",
          "file": "test.md",
          "filePath": "/repo/src/content/docs/test.md",
          "link": "/docs/test-a",
          "position": "1:15",
        },
        {
          "docsUrl": "https://example.com/errors/invalid-link/",
          "error": "invalid link",
          "file": "test.md",
          "filePath": "/repo/src/content/docs/test.md",
          "link": "/docs/test-b",
          "position": "2:1",
        },
      ],
      "fileCount": 2,
    }
  `)
})

function testReportToJson(files: TestValidationReportFile[]) {
  return reportToJson(
    {
      errorCount: files
        .flatMap((file) => file.issues)
        .reduce((count, issue, index) => count + getIssuePositions(issue, index).length, 0),
      files: files.map((file) => ({
        docsPath: basename(file.filePath),
        filePath: `/repo/src/content/docs/${file.filePath}`,
        issues: file.issues.map((issue, index) => ({
          docsUrl: 'https://example.com/errors/invalid-link/',
          link: issue.link,
          message: 'invalid link',
          positions: toSourcePositions(getIssuePositions(issue, index)),
          type: ValidationErrorType.InvalidLink,
        })),
      })),
      hasErrors: true,
      hasInvalidLinkToCustomPage: false,
    },
    '/project',
  )
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

interface TestValidationReportFile {
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
