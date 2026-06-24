import { unified, type UnifiedProcessorOptions } from '@astrojs/markdown-remark'
import { satteri, type SatteriProcessorOptions } from '@astrojs/markdown-satteri'

interface MarkdownProcessorOptions {
  satteri?: SatteriProcessorOptions
  unified?: UnifiedProcessorOptions
}

export function getMarkdownProcessor(options: MarkdownProcessorOptions = {}) {
  switch (process.env['STARLIGHT_LINKS_VALIDATOR_TEST_MARKDOWN_PROCESSOR']) {
    case 'unified': {
      return unified(options.unified)
    }
    case 'satteri': {
      if (options.unified && !options.satteri) {
        throw new Error('This fixture defines Unified Markdown plugins but no Sätteri equivalent.')
      }

      return satteri(options.satteri)
    }
    default: {
      throw new Error('Missing test Markdown processor.')
    }
  }
}
