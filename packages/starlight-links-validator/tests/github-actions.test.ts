import { beforeEach, expect, test, vi } from 'vitest'

import { createTestReporterInput, type TestValidationReportFile } from './utils'

const gitHubOutputPath = '/tmp/github-output.txt'
const gitHubStepSummaryPath = '/tmp/github-step-summary.md'

let gitHubActionsReporter: typeof import('../reporters/github-actions').gitHubActionsReporter

const mocks = vi.hoisted(() => ({
  appendFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({ appendFileSync: mocks.appendFileSync }))

beforeEach(async () => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()

  vi.stubEnv('GITHUB_OUTPUT', '')
  vi.stubEnv('GITHUB_STEP_SUMMARY', '')

  vi.resetModules()

  const mod = await import('../reporters/github-actions')

  gitHubActionsReporter = mod.gitHubActionsReporter
})

test('does nothing when the GitHub Actions reporter is disabled', async () => {
  stubGitHubOutput()
  stubGitHubStepSummary()

  await testGitHubActionsReporter([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }], false)

  expect(mocks.appendFileSync).not.toHaveBeenCalled()
})

test('does not write anything without GitHub output or step summary paths', async () => {
  await testGitHubActionsReporter([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(mocks.appendFileSync).not.toHaveBeenCalled()
})

test('writes output without a summary when no validation errors are found', async () => {
  stubGitHubOutput()
  stubGitHubStepSummary()

  await testGitHubActionsReporter([])

  expect(mocks.appendFileSync).toHaveBeenCalledOnce()

  expectGitHubOutput(false)
})

test('does not write a summary without a GitHub step summary path', async () => {
  stubGitHubOutput()

  await testGitHubActionsReporter([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(mocks.appendFileSync).toHaveBeenCalledOnce()

  expectGitHubOutput(true)
})

test('writes a summary without a GitHub output path', async () => {
  stubGitHubStepSummary()

  await testGitHubActionsReporter([{ filePath: 'index.md', issues: [{ link: '/missing/' }] }])

  expect(mocks.appendFileSync).toHaveBeenCalledOnce()

  expectGitHubStepSummaryPath(0)
  expect(mocks.appendFileSync.mock.calls[0]?.[1]).toContain('## Starlight Links Validator')
})

test('writes output and summary when validation errors are found', async () => {
  stubGitHubOutput()
  stubGitHubStepSummary()

  await testGitHubActionsReporter([
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

  expect(mocks.appendFileSync).toHaveBeenCalledTimes(2)

  expectGitHubOutput(true)

  expectGitHubStepSummaryPath(1)
  expect(mocks.appendFileSync.mock.calls[1]?.[1]).toMatchInlineSnapshot(`
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

async function testGitHubActionsReporter(files: TestValidationReportFile[], enabled = true) {
  const { report, context } = createTestReporterInput(files, {
    reporters: { githubActions: enabled },
  })

  await gitHubActionsReporter.report(report, context)
}

function stubGitHubOutput() {
  vi.stubEnv('GITHUB_OUTPUT', gitHubOutputPath)
}

function stubGitHubStepSummary() {
  vi.stubEnv('GITHUB_STEP_SUMMARY', gitHubStepSummaryPath)
  vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo')
  vi.stubEnv('GITHUB_SHA', '0123456789abcdef')
  vi.stubEnv('GITHUB_WORKSPACE', '/repo')
}

function expectGitHubOutput(value: boolean) {
  expect(mocks.appendFileSync.mock.calls[0]?.[0]).toBe(gitHubOutputPath)
  expect(mocks.appendFileSync.mock.calls[0]?.[1]).toBe(`link_validation_failed=${value}\n`)
}

function expectGitHubStepSummaryPath(callIndex = 0) {
  expect(mocks.appendFileSync.mock.calls[callIndex]?.[0]).toBe(gitHubStepSummaryPath)
}
