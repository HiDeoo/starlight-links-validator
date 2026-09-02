import { markdownToHtml } from 'satteri'
import { expect, test } from 'vitest'

import { StarlightLinksValidatorOptionsSchema } from '../libs/config'
import { createSatteriStarlightLinksValidator } from '../libs/satteri'
import { getValidationData } from '../libs/store'

test('does not run for file without a URL', async () => {
  await renderMarkdown('This is a test')

  const validationData = getValidationData()

  expect(validationData.size).toBe(0)
})

function renderMarkdown(content: string) {
  return markdownToHtml(
    content,
    // @ts-expect-error - Testing with a file without a URL.
    {
      fileURL: undefined,
      hastPlugins: [
        createSatteriStarlightLinksValidator({
          base: '/',
          options: StarlightLinksValidatorOptionsSchema.parse({}),
          site: 'https://example.com',
          srcDir: new URL('src/content/docs/', import.meta.url),
        }),
      ],
    },
  )
}
