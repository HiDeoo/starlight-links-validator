import { basename } from 'node:path'

import { beforeEach, expect, test, vi } from 'vitest'

import { ValidationErrorType } from '../libs/validation'
import type { ValidationReportIssue } from '../reporters'

let reportToGitHubActions: typeof import('../reporters/github-actions').reportToGitHubActions

const mocks = vi.hoisted(() => ({
  appendFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({ appendFileSync: mocks.appendFileSync }))

beforeEach(async () => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()

  const mod = await import('../reporters/github-actions')

  reportToGitHubActions = mod.reportToGitHubActions
})

test('does not write a summary without a GitHub step summary path', () => {
  testReportToGitHubActions([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(mocks.appendFileSync).not.toHaveBeenCalled()
})

test('write a summary with a GitHub step summary path', () => {
  vi.stubEnv('GITHUB_STEP_SUMMARY', '/tmp/github-step-summary.md')
  vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo')
  vi.stubEnv('GITHUB_SHA', '0123456789abcdef')
  vi.stubEnv('GITHUB_WORKSPACE', '/repo')

  testReportToGitHubActions([
    { filePath: 'index.md', issues: [{ link: '/missing/' }] },
    { filePath: '`test`.md', issues: [{ link: '/docs/test`' }] },
    { filePath: 'test|pipe.md', issues: [{ link: '/docs/test|pipe' }] },
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

  expect(mocks.appendFileSync).toHaveBeenCalledOnce()
  expect(mocks.appendFileSync.mock.calls[0]?.[0]).toBe('/tmp/github-step-summary.md')
  expect(mocks.appendFileSync.mock.calls[0]?.[1]).toMatchInlineSnapshot(`
    "
    ## Starlight Links Validator

    ❌ **Link validation failed.**

    Found **6** invalid links in **4** files.

    | File | Link | Position | Error |
    | --- | --- | :---: | --- |
    | [\`index.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/index.md?plain=1#L1) | \`/missing/\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`\` \`test\`.md\`\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/%60test%60.md?plain=1#L1) | \`\`/docs/test\` \`\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test\\|pipe.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test%7Cpipe.md?plain=1#L1) | \`/docs/test\\|pipe\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test.md?plain=1#L1) | \`/docs/test-a\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test.md?plain=1#L1) | \`/docs/test-a\` | \`1:15\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test.md?plain=1#L2) | \`/docs/test-b\` | \`2:1\` | [invalid link](https://example.com/errors/invalid-link/) |

    <details>
    <summary>Report Markdown source</summary>

    \`\`\`md
    | File | Link | Position | Error |
    | --- | --- | :---: | --- |
    | [\`index.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/index.md?plain=1#L1) | \`/missing/\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`\` \`test\`.md\`\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/%60test%60.md?plain=1#L1) | \`\`/docs/test\` \`\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test\\|pipe.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test%7Cpipe.md?plain=1#L1) | \`/docs/test\\|pipe\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test.md?plain=1#L1) | \`/docs/test-a\` | \`1:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test.md?plain=1#L1) | \`/docs/test-a\` | \`1:15\` | [invalid link](https://example.com/errors/invalid-link/) |
    | [\`test.md\`](https://github.com/owner/repo/blob/0123456789abcdef/src/content/docs/test.md?plain=1#L2) | \`/docs/test-b\` | \`2:1\` | [invalid link](https://example.com/errors/invalid-link/) |
    \`\`\`
    </details>
    "
  `)
})

function testReportToGitHubActions(files: TestValidationReportFile[]) {
  reportToGitHubActions({
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
  })
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
