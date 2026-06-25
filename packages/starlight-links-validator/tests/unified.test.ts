import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { expect, test } from 'vitest'

import { StarlightLinksValidatorOptionsSchema } from '../libs/config'
import { rehypeStarlightLinksValidator } from '../libs/rehype'
import { getValidationData } from '../libs/store'

const processor = createMarkdownProcessor()

test('does not run for file without a path', async () => {
  await renderMarkdown('This is a test')

  const validationData = getValidationData()

  expect(validationData.size).toBe(0)
})

async function renderMarkdown(content: string) {
  const file = new VFile({
    path: undefined,
    value: content,
  })

  const tree = processor.parse(file)

  await processor.run(tree, file)
}

function createMarkdownProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStarlightLinksValidator, {
      base: '/',
      options: StarlightLinksValidatorOptionsSchema.parse({}),
      site: 'https://example.com',
      srcDir: new URL('src/content/docs/', import.meta.url),
    })
}
