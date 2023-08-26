import { exec } from 'node:child_process'
import { cp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

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

    // Copy the Astro config.
    await cp(join(baseFixturePath, 'astro.config.ts'), join(testPath, 'astro.config.ts'))

    // Build the project.
    await execAsync('npx astro build', { cwd: testPath })
  } catch (error) {
    throw isProcessError(error) ? new Error(`Failed to build the fixture '${name}':\n\n${error.stderr}`) : error
  }
}

function isProcessError(error: unknown): error is { stderr: string } {
  return typeof error === 'object' && error !== null && 'stderr' in error
}
