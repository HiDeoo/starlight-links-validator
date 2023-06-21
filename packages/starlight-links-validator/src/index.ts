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
      'astro:build:done': () => {
        validateLinks()
      },
    },
  }
}
