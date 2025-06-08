import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { IntegrationResolvedRoute } from 'astro'
import { AstroError } from 'astro/errors'
import { z } from 'astro/zod'

import { clearContentLayerCache } from './libs/astro'
import { pathnameToSlug, stripTrailingSlash } from './libs/path'
import { remarkStarlightLinksValidator, type RemarkStarlightLinksValidatorConfig } from './libs/remark'
import { logErrors, validateLinks } from './libs/validation'

const starlightLinksValidatorOptionsSchema = z
  .object({
    /**
     * Defines a list of additional components and their props that should be validated as links.
     *
     * By default, the plugin will only validate links defined in the `href` prop of the `<LinkButton>` and `<LinkCard>`
     * built-in Starlight components.
     * Adding custom components to this list will allow the plugin to validate links in those components as well.
     *
     * @default []
     */
    components: z.tuple([z.string(), z.string()]).array().default([]),
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
     * Defines a list of links or glob patterns that should be excluded from validation or a function that will be
     * called for each link to determine if it should be excluded from validation or not.
     *
     * The links in this list or links where the function returns `true` will be ignored by the plugin and will not be
     * validated.
     *
     * @default []
     */
    exclude: z
      .union([
        z.array(z.string()),
        z
          .function()
          .args(
            z.object({
              /**
               * The absolute path to the file where the link is defined.
               */
              file: z.string(),
              /**
               * The link to validate as authored in the content.
               */
              link: z.string(),
              /**
               * The slug of the page where the link is defined.
               */
              slug: z.string(),
            }),
          )
          .returns(z.boolean()),
      ])
      .default([]),
    /**
     * Defines the policy for external links with an origin matching the Astro `site` option.
     *
     * By default, all external links are ignored and not validated by the plugin.
     * Setting this option to `error` will make the plugin error on external links with an origin matching the Astro
     * `site` option and hint that the link can be rewritten without the origin.
     * Setting this option to `validate` will make the plugin validate external links with an origin matching the Astro
     * `site` option as if they were internal links.
     *
     * @default 'ignore'
     * @see https://docs.astro.build/en/reference/configuration-reference/#site
     * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/origin
     */
    sameSitePolicy: z.enum(['error', 'ignore', 'validate']).default('ignore'),
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
      'config:setup'({ addIntegration, astroConfig, config: starlightConfig, logger }) {
        let routes: IntegrationResolvedRoute[] = []
        const site = astroConfig.site ? stripTrailingSlash(astroConfig.site) : undefined

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
                    [
                      remarkStarlightLinksValidator,
                      {
                        base: astroConfig.base,
                        options: options.data,
                        site,
                        srcDir: astroConfig.srcDir,
                      } satisfies RemarkStarlightLinksValidatorConfig,
                    ],
                  ],
                },
              })
            },
            'astro:routes:resolved': (params) => {
              routes = params.routes
            },
            'astro:build:done': ({ dir, pages, assets }) => {
              const customPages = new Set<string>()

              for (const [pattern, urls] of assets) {
                const route = routes.find((route) => route.pattern === pattern)
                if (!route || route.origin !== 'project') continue

                for (const url of urls) {
                  customPages.add(pathnameToSlug(url.pathname.replace(astroConfig.outDir.pathname, '')))
                }
              }

              const errors = validateLinks(pages, customPages, dir, astroConfig, starlightConfig, options.data)

              const hasInvalidLinkToCustomPage = logErrors(logger, errors, site)

              if (errors.size > 0) {
                throwPluginError(
                  'Links validation failed.',
                  hasInvalidLinkToCustomPage
                    ? 'Some invalid links point to custom pages which cannot be validated, see the `exclude` option for more informations at https://starlight-links-validator.vercel.app/configuration#exclude'
                    : undefined,
                )
              }
            },
          },
        })
      },
    },
  }
}

function throwPluginError(message: string, additionalHint?: string): never {
  let hint = 'See the error report above for more informations.\n\n'
  if (additionalHint) hint += `${additionalHint}\n\n`
  hint +=
    'If you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-links-validator/issues/new/choose'

  throw new AstroError(message, hint)
}

type StarlightLinksValidatorUserOptions = z.input<typeof starlightLinksValidatorOptionsSchema>
export type StarlightLinksValidatorOptions = z.output<typeof starlightLinksValidatorOptionsSchema>
