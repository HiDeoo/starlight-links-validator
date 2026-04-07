import { appendFileSync } from 'node:fs'

export function setGitHubActionsOutput(name: string, value: string) {
  const outputPath = process.env['GITHUB_OUTPUT']
  if (!outputPath) return

  appendFileSync(outputPath, `${name}=${value}\n`, 'utf8')
}
