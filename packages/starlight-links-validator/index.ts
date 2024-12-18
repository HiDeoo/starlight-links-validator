import type { StarlightPlugin } from '@astrojs/starlight/types'
import { AstroError } from 'astro/errors'
import { z } from 'astro/zod'

import { clearContentLayerCache } from './libs/astro'
import { remarkStarlightLinksValidator } from './libs/remark'
import { logErrors, validateLinks } from './libs/validation'

const starlightLinksValidatorOptionsSchema = z
  .object({
    /**
     * Defines whether the plugin should error on fallback pages.
     *
     * If you do not expect to have all pages translated in all configured locales and want to use the fallback pages
     * feature built-in into Starlight, you should set this option to `false`.
     *
     * @default true
     * @see https://starlight.astro.build/guides/i18n/#fallback-content
     */
    errorOnFallbackPages: z.boolean().default(true),
    /**
     * Defines whether the plugin should error on inconsistent locale links.
     *
     * When set to `true`, the plugin will error on links that are pointing to a page in a different locale.
     *
     * @default false
     */
    errorOnInconsistentLocale: z.boolean().default(false),
    /**
     * Defines whether the plugin should error on internal relative links.
     *
     * When set to `false`, the plugin will ignore relative links (e.g. `./foo` or `../bar`).
     *
     * @default true
     */
    errorOnRelativeLinks: z.boolean().default(true),
    /**
     * Defines whether the plugin should error on invalid hashes.
     *
     * When set to `false`, the plugin will only validate link pages and ignore hashes.
     *
     * @default true
     */
    errorOnInvalidHashes: z.boolean().default(true),
    /**
     * Defines whether the plugin should error on local links, e.g. URLs with a hostname of `localhost` or `127.0.0.1`.
     *
     * @default true
     */
    errorOnLocalLinks: z.boolean().default(true),
    /**
     * Defines a list of links or glob patterns that should be excluded from validation.
     *
     * The links in this list will be ignored by the plugin and will not be validated.
     *
     * @default []
     */
    exclude: z.array(z.string()).default([]),
  })
  .default({})

export default function starlightLinksValidatorPlugin(
  userOptions?: StarlightLinksValidatorUserOptions,
): StarlightPlugin {
  const options = starlightLinksValidatorOptionsSchema.safeParse(userOptions)

  if (!options.success) {
    throwPluginError('Invalid options passed to the starlight-links-validator plugin.')
  }

  return {
    name: 'starlight-links-validator-plugin',
    hooks: {
      setup({ addIntegration, astroConfig, config: starlightConfig, logger }) {
        addIntegration({
          name: 'starlight-links-validator-integration',
          hooks: {
            'astro:config:setup': async ({ command, updateConfig }) => {
              if (command !== 'build') {
                return
              }

              await clearContentLayerCache(astroConfig, logger)

              updateConfig({
                markdown: {
                  remarkPlugins: [
                    [remarkStarlightLinksValidator, { base: astroConfig.base, srcDir: astroConfig.srcDir }],
                  ],
                },
              })
            },
            'astro:build:done': ({ dir, pages }) => {
              const errors = validateLinks(pages, dir, astroConfig, starlightConfig, options.data)

              logErrors(logger, errors)

              if (errors.size > 0) {
                throwPluginError('Links validation failed.')
              }
            },
          },
        })
      },
    },
  }
}

function throwPluginError(message: string): never {
  throw new AstroError(
    message,
    `See the error report above for more informations.\n\nIf you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-links-validator/issues/new/choose`,
  )
}

type StarlightLinksValidatorUserOptions = z.input<typeof starlightLinksValidatorOptionsSchema>
export type StarlightLinksValidatorOptions = z.output<typeof starlightLinksValidatorOptionsSchema>
