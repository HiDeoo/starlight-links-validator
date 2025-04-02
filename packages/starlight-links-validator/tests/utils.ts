import { fileURLToPath } from 'node:url'

import { build } from 'astro'
import { expect, vi } from 'vitest'

import type { ValidationErrorType } from '../libs/validation'

export async function buildFixture(name: string) {
  const fixturePath = fileURLToPath(new URL(`fixtures/${name}/`, import.meta.url))

  let output = ''
  let status: 'success' | 'error'

  function writeOutput(chunk: string | Uint8Array) {
    output += String(chunk)
    return true
  }

  const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(writeOutput)
  const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(writeOutput)

  try {
    await build({ root: fixturePath })
    status = 'success'
  } catch {
    status = 'error'
  }

  stderrWriteSpy.mockRestore()
  stdoutWriteSpy.mockRestore()

  return { output, status }
}

export function expectValidationErrorCount(output: string, count: number, filesCount: number) {
  expect(output).toMatch(
    new RegExp(
      `Found ${count} invalid ${count === 1 ? 'link' : 'links'} in ${filesCount} ${
        filesCount === 1 ? 'file' : 'files'
      }.`,
    ),
  )
}

export function expectValidationErrors(
  output: string,
  path: string,
  validationErrors: [link: string, type: ValidationErrorType, site?: string | undefined][],
) {
  expect(output).toMatch(
    new RegExp(`▶ ${path}
${validationErrors
  .map(
    ([link, type, site], index) =>
      `.* ${index < validationErrors.length - 1 ? '├' : '└'}─ ${link.replaceAll('?', String.raw`\?`)} - ${site ? type.replace('{{site}}', site) : type}`,
  )
  .join('\n')}`),
  )
}
