import { beforeEach, expect, test, vi } from 'vitest'

import { jsonReporter } from '../reporters/json'

import { createTestReporterInput, testRootUrl, type TestValidationReportFile } from './utils'

const expectedReportDirUrl = new URL('.starlight-links-validator/', testRootUrl)
const expectedReportFileUrl = new URL('errors.json', expectedReportDirUrl)

const mocks = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({ mkdirSync: mocks.mkdirSync, rmSync: mocks.rmSync, writeFileSync: mocks.writeFileSync }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('removes any existing JSON report when the JSON reporter is disabled', async () => {
  await testJsonReporter([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }], false)

  expect(mocks.rmSync).toHaveBeenCalledOnce()
  expect(mocks.rmSync.mock.calls[0]?.[0]).toEqual(expectedReportFileUrl)
  expect(mocks.rmSync.mock.calls[0]?.[1]).toStrictEqual({ force: true })

  expect(mocks.mkdirSync).not.toHaveBeenCalled()

  expect(mocks.writeFileSync).not.toHaveBeenCalled()
})

test('removes any existing JSON report and writes a new one to the expected path', async () => {
  await testJsonReporter([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(mocks.rmSync).toHaveBeenCalledOnce()
  expect(mocks.rmSync.mock.calls[0]?.[0]).toEqual(expectedReportFileUrl)
  expect(mocks.rmSync.mock.calls[0]?.[1]).toStrictEqual({ force: true })

  expect(mocks.mkdirSync).toHaveBeenCalledOnce()
  expect(mocks.mkdirSync.mock.calls[0]?.[0]).toEqual(expectedReportDirUrl)
  expect(mocks.mkdirSync.mock.calls[0]?.[1]).toStrictEqual({ recursive: true })

  expect(mocks.writeFileSync).toHaveBeenCalledOnce()
  expect(mocks.writeFileSync.mock.calls[0]?.[0]).toEqual(expectedReportFileUrl)
})

test('does not write a JSON report when no validation errors are found', async () => {
  await testJsonReporter([])

  expect(mocks.rmSync).toHaveBeenCalledOnce()
  expect(mocks.rmSync.mock.calls[0]?.[0]).toEqual(expectedReportFileUrl)
  expect(mocks.rmSync.mock.calls[0]?.[1]).toStrictEqual({ force: true })

  expect(mocks.mkdirSync).not.toHaveBeenCalled()

  expect(mocks.writeFileSync).not.toHaveBeenCalled()
})

test('writes JSON report', async () => {
  await testJsonReporter([
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
      "errorFileCount": 2,
      "errors": [
        {
          "docsPath": "index.md",
          "documentationUrl": "https://example.com/errors/invalid-link/",
          "link": "/missing/",
          "message": "invalid link",
          "position": {
            "column": 1,
            "line": 1,
          },
        },
        {
          "docsPath": "test.md",
          "documentationUrl": "https://example.com/errors/invalid-link/",
          "link": "/docs/test-a",
          "message": "invalid link",
          "position": {
            "column": 1,
            "line": 1,
          },
        },
        {
          "docsPath": "test.md",
          "documentationUrl": "https://example.com/errors/invalid-link/",
          "link": "/docs/test-a",
          "message": "invalid link",
          "position": {
            "column": 15,
            "line": 1,
          },
        },
        {
          "docsPath": "test.md",
          "documentationUrl": "https://example.com/errors/invalid-link/",
          "link": "/docs/test-b",
          "message": "invalid link",
          "position": {
            "column": 1,
            "line": 2,
          },
        },
      ],
    }
  `)
})

async function testJsonReporter(files: TestValidationReportFile[], enabled = true) {
  const { report, context } = createTestReporterInput(files, {
    reporters: { json: enabled },
  })

  await jsonReporter.report(report, context)
}
