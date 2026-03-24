import { beforeEach, describe, expect, test, vi } from 'vitest'

let readPreamble: typeof import('../libs/preamble').readPreamble

const mocks = vi.hoisted(() => {
  return {
    createReadStream: vi.fn(),
    createInterface: vi.fn(),
  }
})

vi.mock('node:fs', () => ({ default: { createReadStream: mocks.createReadStream } }))
vi.mock('node:readline', () => ({ default: { createInterface: mocks.createInterface } }))

beforeEach(async () => {
  vi.clearAllMocks()

  vi.resetModules()
  const mod = await import('../libs/preamble')
  readPreamble = mod.readPreamble
})

describe('no frontmatter', () => {
  test('reads preamble with no frontmatter', async () => {
    const preamble = await readTestPreamble(`Content
`)

    expect(preamble.lines).toBe(0)

    expect(preamble.frontmatter).not.toBeDefined()
  })

  test('reads preamble with no frontmatter and leading blank lines', async () => {
    const preamble = await readTestPreamble(`

Content
`)

    expect(preamble.lines).toBe(2)

    expect(preamble.frontmatter).not.toBeDefined()
  })
})

describe('frontmatter', () => {
  test('reads preamble with a frontmatter', async () => {
    const preamble = await readTestPreamble(`---
title: Test
description: This is a test.
---
Content
`)

    expect(preamble.lines).toBe(4)

    expect(preamble.frontmatter?.format).toBe('yaml')
    expect(preamble.frontmatter?.content).toMatchInlineSnapshot(`
      "title: Test
      description: This is a test."
    `)
  })

  test('reads preamble with a frontmatter and trailing blank lines', async () => {
    const preamble = await readTestPreamble(`---
title: Test
description: This is a test.
---


Content
`)

    expect(preamble.lines).toBe(6)

    expect(preamble.frontmatter?.format).toBe('yaml')
    expect(preamble.frontmatter?.content).toMatchInlineSnapshot(`
      "title: Test
      description: This is a test."
    `)
  })

  test('reads preamble with a frontmatter and leading blank lines', async () => {
    const preamble = await readTestPreamble(`
---
title: Test
description: This is a test.
---
Content
`)

    expect(preamble.lines).toBe(1)

    expect(preamble.frontmatter).not.toBeDefined()
  })
})

describe('empty frontmatter', () => {
  test('reads preamble with an empty frontmatter', async () => {
    const preamble = await readTestPreamble(`---
---
Content
`)

    expect(preamble.lines).toBe(2)

    expect(preamble.frontmatter).not.toBeDefined()
  })

  test('reads preamble with an empty frontmatter and trailing blank lines', async () => {
    const preamble = await readTestPreamble(`---
---


Content
`)

    expect(preamble.lines).toBe(4)

    expect(preamble.frontmatter).not.toBeDefined()
  })

  test('reads preamble with an empty frontmatter and leading blank lines', async () => {
    const preamble = await readTestPreamble(`
---
---
Content
`)

    expect(preamble.lines).toBe(1)

    expect(preamble.frontmatter).not.toBeDefined()
  })
})

describe('non-closed frontmatter', () => {
  test('reads preamble with a non-closed frontmatter', async () => {
    const preamble = await readTestPreamble(`Content

---

More content
`)

    expect(preamble.lines).toBe(0)

    expect(preamble.frontmatter).not.toBeDefined()
  })

  test('reads preamble with a non-closed frontmatter and leading blank lines', async () => {
    const preamble = await readTestPreamble(`

---

Content
`)

    expect(preamble.lines).toBe(2)

    expect(preamble.frontmatter).not.toBeDefined()
  })

  test('reads preamble with a non-closed frontmatter using mixed frontmatter delimiters', async () => {
    const preamble = await readTestPreamble(`---

Content

+++

More content
`)

    expect(preamble.lines).toBe(0)

    expect(preamble.frontmatter).not.toBeDefined()
  })
})

describe('toml frontmatter', () => {
  test('reads preamble with a toml frontmatter', async () => {
    const preamble = await readTestPreamble(`+++
title = Test
description = This is a test.
+++
Content
`)

    expect(preamble.lines).toBe(4)

    expect(preamble.frontmatter?.format).toBe('toml')
    expect(preamble.frontmatter?.content).toMatchInlineSnapshot(`
      "title = Test
      description = This is a test."
    `)
  })

  test('reads preamble with a toml frontmatter and trailing blank lines', async () => {
    const preamble = await readTestPreamble(`+++
title = Test
description = This is a test.
+++


Content
`)

    expect(preamble.lines).toBe(6)

    expect(preamble.frontmatter?.format).toBe('toml')
    expect(preamble.frontmatter?.content).toMatchInlineSnapshot(`
      "title = Test
      description = This is a test."
    `)
  })

  test('reads preamble with a toml frontmatter and leading blank lines', async () => {
    const preamble = await readTestPreamble(`
+++
title: Test
description: This is a test.
+++
Content
`)

    expect(preamble.lines).toBe(1)

    expect(preamble.frontmatter).not.toBeDefined()
  })
})

async function readTestPreamble(content: string) {
  const lines = content.split(/\r?\n/)
  // Remove trailing empty string due to splitting on newlines.
  if (lines.at(-1) === '') lines.pop()

  const stream = { destroy: vi.fn() }
  mocks.createReadStream.mockReturnValue(stream)

  const rl = {
    close: vi.fn(),
    *[Symbol.asyncIterator]() {
      for (const line of lines) yield line
    },
  }

  mocks.createInterface.mockReturnValue(rl)

  return readPreamble('/test/file.md')
}
