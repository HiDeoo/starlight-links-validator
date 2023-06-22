import type { AstroIntegration } from 'astro'

import { remarkStarlightLinksValidator } from './libs/remark'
import { validateLinks } from './libs/validation'

export default function starlightLinksValidatorIntegration(): AstroIntegration {
  return {
    name: 'starlight-links-validator',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            remarkPlugins: [remarkStarlightLinksValidator],
          },
        })
      },
      'astro:build:done': ({ pages }) => {
        const errors = validateLinks(pages)

        if (errors.length > 0) {
          // FIXME(HiDeoo)
          console.error('🚨 [index.ts:21] errors:', errors)

          // TODO(HiDeoo)
          throw new Error(`ERROR`)
        }
      },
    },
  }
}
