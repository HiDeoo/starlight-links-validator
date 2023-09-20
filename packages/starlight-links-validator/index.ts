import type { AstroIntegration } from 'astro'
import { AstroError } from 'astro/errors'

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
          throw new AstroError(
            'Links validation failed.',
            `See the error report above for more informations.\n\nIf you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-links-validator/issues/new/choose.`,
          )
        }
      },
    },
  }
}
