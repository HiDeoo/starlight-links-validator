import type { AstroConfig } from 'astro'

import type { ValidationConfig } from './config'
import { throwPluginError } from './error'
import { rehypeStarlightLinksValidator } from './rehype'
import { createSatteriStarlightLinksValidator } from './satteri'

export function applyMarkdownPlugin(processor: MarkdownProcessor, validationConfig: ValidationConfig) {
  if (isSatteriProcessor(processor)) {
    const validator = createSatteriStarlightLinksValidator(validationConfig)

    processor.options.hastPlugins.push(validator.hastPlugin)

    const createRenderer = processor.createRenderer.bind(processor)

    // TODO We workaround the fact that Sätteri does not provide a hook when a file is rendered, which means a Markdown
    // file with only a frontmatter will not be registered for validation. This should be refactored once Sätteri
    // provides a proper way to do so.
    processor.createRenderer = async (shared) => {
      const renderer = await createRenderer(shared)
      const render = renderer.render.bind(renderer)

      return {
        ...renderer,
        async render(content, options) {
          const result = await render(content, options)

          validator.registerFile(options)

          return result
        },
      }
    }
  } else if (isUnifiedProcessor(processor)) {
    processor.options.rehypePlugins.push([rehypeStarlightLinksValidator, validationConfig])
  } else {
    throwPluginError("The configured 'markdown.processor' is not supported by the starlight-links-validator plugin.")
  }
}

function isSatteriProcessor(processor: unknown): processor is SatteriMarkdownProcessor {
  if (typeof processor !== 'object' || processor === null) return false
  const candidate = processor as { name?: unknown; options?: { hastPlugins?: unknown } }
  return candidate.name === 'satteri' && Array.isArray(candidate.options?.hastPlugins)
}

function isUnifiedProcessor(processor: unknown): processor is UnifiedMarkdownProcessor {
  if (typeof processor !== 'object' || processor === null) return false
  const candidate = processor as { name?: unknown; options?: { rehypePlugins?: unknown } }
  return candidate.name === 'unified' && Array.isArray(candidate.options?.rehypePlugins)
}

type MarkdownProcessor = NonNullable<AstroConfig['markdown']['processor']>

interface SatteriMarkdownProcessor {
  name: 'satteri'
  options: { hastPlugins: unknown[] }
}

interface UnifiedMarkdownProcessor {
  name: 'unified'
  options: { rehypePlugins: unknown[] }
}
