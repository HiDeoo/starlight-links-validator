import { exec } from 'node:child_process'
import { access, constants, cp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { expect } from 'vitest'

import type { ValidationErrorType } from '../libs/validation'

const execAsync = promisify(exec)

export async function loadFixture(name: string) {
  const testPath = fileURLToPath(new URL(`../.tests/${name}/`, import.meta.url))
  const fixturePath = fileURLToPath(new URL(`fixtures/${name}/`, import.meta.url))
  const baseFixturePath = fileURLToPath(new URL(`fixtures/base/`, import.meta.url))

  try {
    // Setup the test directory.
    await rm(testPath, { force: true, recursive: true })
    await mkdir(testPath, { recursive: true })

    // Copy the base fixture files.
    await cp(join(baseFixturePath, 'src'), join(testPath, 'src'), { recursive: true })
    await cp(join(baseFixturePath, 'public'), join(testPath, 'public'), { recursive: true })

    // Copy the fixture under test files that may override the base fixture files.
    await cp(join(fixturePath, 'src'), join(testPath, 'src'), { force: true, recursive: true })

    const fixtureConfigPath = join(fixturePath, 'astro.config.ts')
    const hasFixtureConfig = await fileExists(fixtureConfigPath)
    const configPath = hasFixtureConfig ? fixtureConfigPath : join(baseFixturePath, 'astro.config.ts')

    // Copy the base Astro config if the fixture under test does not have one.
    await cp(configPath, join(testPath, 'astro.config.ts'))

    // Build the project.
    await execAsync('npx astro build', { cwd: testPath })
  } catch (error) {
    throw isProcessError(error)
      ? new Error(`Failed to build the fixture '${name}':\n\n${error.stderr}\n\n${error.stdout}`)
      : error
  }
}

export function expectValidationErrorCount(error: unknown, count: number, filesCount: number) {
  expect(error).toMatch(
    new RegExp(
      `Found ${count} invalid ${count === 1 ? 'link' : 'links'} in ${filesCount} ${
        filesCount === 1 ? 'file' : 'files'
      }.`,
    ),
  )
}

export function expectValidationErrors(
  error: unknown,
  path: string,
  validationErrors: [link: string, type: ValidationErrorType][],
) {
  expect(error).toMatch(
    new RegExp(`▶ ${path}
${validationErrors
  .map(([link, type], index) => `.* ${index < validationErrors.length - 1 ? '├' : '└'}─ ${link} - ${type}`)
  .join('\n')}`),
  )
}

function isProcessError(error: unknown): error is { stderr: string; stdout: string } {
  return typeof error === 'object' && error !== null && 'stderr' in error
}

async function fileExists(path: string) {
  let exists = false

  try {
    await access(path, constants.F_OK)
    exists = true
  } catch {
    // We can safely ignore this error if the file does not exist.
  }

  return exists
}
