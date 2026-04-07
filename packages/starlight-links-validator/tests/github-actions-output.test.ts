import { beforeEach, expect, test, vi } from 'vitest'

let setGitHubActionsOutput: typeof import('../reporters/github-actions-output').setGitHubActionsOutput

const mocks = vi.hoisted(() => ({
  appendFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({ appendFileSync: mocks.appendFileSync }))

beforeEach(async () => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()

  const mod = await import('../reporters/github-actions-output')

  setGitHubActionsOutput = mod.setGitHubActionsOutput
})

test('does not write output without a GITHUB_OUTPUT env var', () => {
  vi.stubEnv('GITHUB_OUTPUT', '')

  setGitHubActionsOutput('has_links_validation_errors', 'true')

  expect(mocks.appendFileSync).not.toHaveBeenCalled()
})

test('does not write output when GITHUB_OUTPUT is undefined', () => {
  delete process.env['GITHUB_OUTPUT']

  setGitHubActionsOutput('has_links_validation_errors', 'true')

  expect(mocks.appendFileSync).not.toHaveBeenCalled()
})

test('writes output to the GITHUB_OUTPUT file', () => {
  vi.stubEnv('GITHUB_OUTPUT', '/tmp/github-output.txt')

  setGitHubActionsOutput('has_links_validation_errors', 'true')

  expect(mocks.appendFileSync).toHaveBeenCalledOnce()
  expect(mocks.appendFileSync.mock.calls[0]?.[0]).toBe('/tmp/github-output.txt')
  expect(mocks.appendFileSync.mock.calls[0]?.[1]).toBe('has_links_validation_errors=true\n')
  expect(mocks.appendFileSync.mock.calls[0]?.[2]).toBe('utf8')
})
