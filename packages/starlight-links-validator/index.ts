import type { AstroIntegration } from 'astro'

import { remarkStarlightLinksValidator } from './libs/remark'
import { logErrors, validateLinks } from './libs/validation'

export default function starlightLinksValidatorIntegration(): AstroIntegration {
  return {
    name: 'starlight-links-validator',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'build') {
          return
        }

        updateConfig({
          markdown: {
            remarkPlugins: [remarkStarlightLinksValidator],
          },
        })
      },
      'astro:build:done': ({ dir, pages }) => {
        const errors = validateLinks(pages, dir)

        logErrors(errors)

        if (errors.size > 0) {
          throw new Error('Links validation failed.')
        }
      },
    },
  }
}
