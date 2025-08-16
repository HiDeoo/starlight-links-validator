import { fileURLToPath } from 'node:url'

import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { expect, test } from 'vitest'

import { StarlightLinksValidatorOptionsSchema } from '../libs/config'
import { getValidationData, remarkStarlightLinksValidator } from '../libs/remark'

const processor = createMarkdownProcessor()

test('does not run for file without a path', async () => {
  await renderMarkdown(`This is a test`, { url: null })

  const validationData = getValidationData()

  expect(validationData.size).toBe(0)
})

function renderMarkdown(content: string, options?: { url?: URL | null }) {
  return processor.process(
    new VFile({
      path: options?.url === null ? undefined : fileURLToPath(new URL(`src/content/docs/index.md`, import.meta.url)),
      value: content,
    }),
  )
}

function createMarkdownProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkStarlightLinksValidator, {
      base: '/',
      options: StarlightLinksValidatorOptionsSchema.parse({}),
      site: 'https://example.com',
      srcDir: new URL('src/content/docs/', import.meta.url),
    })
    .use(remarkStringify)
}
