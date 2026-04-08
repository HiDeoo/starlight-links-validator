import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { IntegrationResolvedRoute } from 'astro'
import { AstroError } from 'astro/errors'

import { clearContentLayerCache } from './libs/astro'
import {
  StarlightLinksValidatorOptionsSchema,
  type StarlightLinksValidatorUserOptions,
  type ValidationConfig,
} from './libs/config'
import { pathnameToSlug, stripTrailingSlash } from './libs/path'
import { rehypeStarlightLinksValidator } from './libs/rehype'
import { clearValidationData, setValidationConfig } from './libs/store'
import { validateLinks } from './libs/validation'
import { runReporters } from './reporters'
import { cliReporter, logStep } from './reporters/cli'
import { gitHubActionsReporter } from './reporters/github-actions'
import { jsonReporter } from './reporters/json'

export type { StarlightLinksValidatorOptions } from './libs/config'

export default function starlightLinksValidatorPlugin(
  userOptions?: StarlightLinksValidatorUserOptions,
): StarlightPlugin {
  const parsedOptions = StarlightLinksValidatorOptionsSchema.safeParse(userOptions)

  if (!parsedOptions.success) {
    throwPluginError('Invalid options passed to the starlight-links-validator plugin.')
  }

  const options = parsedOptions.data

  return {
    name: 'starlight-links-validator',
    hooks: {
      'config:setup'({ addIntegration, addRouteMiddleware, astroConfig, command, config: starlightConfig, logger }) {
        if (command !== 'build') return

        let routes: IntegrationResolvedRoute[] = []
        const site = astroConfig.site ? stripTrailingSlash(astroConfig.site) : undefined

        const validationConfig: ValidationConfig = {
          base: astroConfig.base,
          options,
          site,
          srcDir: astroConfig.srcDir,
        }

        setValidationConfig(validationConfig)
        addRouteMiddleware({ entrypoint: 'starlight-links-validator/middleware', order: 'pre' })

        addIntegration({
          name: 'starlight-links-validator',
          hooks: {
            'astro:config:setup': async ({ updateConfig }) => {
              clearValidationData()
              await clearContentLayerCache(astroConfig, logger)

              updateConfig({ markdown: { rehypePlugins: [[rehypeStarlightLinksValidator, validationConfig]] } })
            },
            'astro:routes:resolved': (params) => {
              routes = params.routes
            },
            'astro:build:done': async ({ dir, pages, assets }) => {
              const customPages = new Set<string>()

              for (const [pattern, urls] of assets) {
                const route = routes.find((route) => route.pattern === pattern)
                if (route?.origin !== 'project') continue

                for (const url of urls) {
                  customPages.add(pathnameToSlug(url.pathname.replace(astroConfig.outDir.pathname, '')))
                }
              }

              logStep('validating links')

              const report = await validateLinks(pages, customPages, dir, astroConfig, starlightConfig, options)

              if (report.hasErrors) {
                if (options.failOnError) {
                  logger.error('Links validation failed.')
                } else {
                  logger.warn('Links validation failed, but the build will continue (`failOnError: false`).')
                }
              }

              await runReporters([cliReporter, gitHubActionsReporter, jsonReporter], report, {
                astroConfig,
                logger,
                options,
              })

              if (report.hasErrors && options.failOnError) {
                throwPluginError(
                  'Links validation failed.',
                  report.hasInvalidLinkToCustomPage
                    ? 'Some invalid links point to custom pages which cannot be validated, see the `exclude` option for more information at https://starlight-links-validator.vercel.app/configuration#exclude'
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
  let hint = 'See the error report above for more information.\n\n'
  if (additionalHint) hint += `${additionalHint}\n\n`
  hint +=
    'If you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-links-validator/issues/new/choose'

  throw new AstroError(message, hint)
}
