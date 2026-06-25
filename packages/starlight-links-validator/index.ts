import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { IntegrationResolvedRoute } from 'astro'

import { clearContentLayerCache } from './libs/astro'
import {
  StarlightLinksValidatorOptionsSchema,
  type StarlightLinksValidatorUserOptions,
  type ValidationConfig,
} from './libs/config'
import { throwPluginError } from './libs/error'
import { isAbsoluteUrl } from './libs/link'
import { normalizePathname, pathnameToSlug, stripTrailingSlash } from './libs/path'
import { applyMarkdownPlugin } from './libs/processor'
import { clearValidationData, setValidationConfig } from './libs/store'
import { validateLinks, type ProjectRoutes } from './libs/validation'
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
            'astro:config:setup': async () => {
              applyMarkdownPlugin(astroConfig.markdown.processor, validationConfig)

              clearValidationData()
              await clearContentLayerCache(astroConfig, logger)
            },
            'astro:routes:resolved': (params) => {
              routes = params.routes
            },
            'astro:build:done': async ({ dir, pages, assets }) => {
              const projectRoutes: ProjectRoutes = new Map()

              for (const [pattern, urls] of assets) {
                const route = routes.find((route) => route.pattern === pattern)
                if (route?.origin !== 'project') continue

                for (const url of urls) {
                  const routeKey = pathnameToSlug(url.pathname.replace(astroConfig.outDir.pathname, ''))

                  if (route.type !== 'redirect' || !route.redirect || !route.pathname) {
                    projectRoutes.set(routeKey, { type: 'custom-page' })
                    continue
                  }

                  const destination = typeof route.redirect === 'string' ? route.redirect : route.redirect.destination

                  if (isAbsoluteUrl(destination)) {
                    projectRoutes.set(routeKey, { type: 'redirect-external' })
                    continue
                  }

                  projectRoutes.set(routeKey, {
                    type: 'redirect-internal',
                    path: normalizePathname(destination, astroConfig.base),
                  })
                }
              }

              logStep('validating links')

              const report = await validateLinks(pages, projectRoutes, dir, astroConfig, starlightConfig, options)

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
