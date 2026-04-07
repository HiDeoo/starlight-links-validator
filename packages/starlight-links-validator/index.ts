import { fileURLToPath } from 'node:url'

import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { IntegrationResolvedRoute } from 'astro'
import { AstroError } from 'astro/errors'

import { clearContentLayerCache } from './libs/astro'
import { StarlightLinksValidatorOptionsSchema, type StarlightLinksValidatorUserOptions } from './libs/config'
import { pathnameToSlug, stripTrailingSlash } from './libs/path'
import { rehypeStarlightLinksValidator, type RehypeStarlightLinksValidatorConfig } from './libs/rehype'
import { validateLinks } from './libs/validation'
import { logStep, reportToCli } from './reporters/cli'
import { reportToGitHubActions } from './reporters/github-actions'
import { setGitHubActionsOutput } from './reporters/github-actions-output'
import { reportToJson } from './reporters/json'

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
      'config:setup'({ addIntegration, astroConfig, config: starlightConfig, logger }) {
        let routes: IntegrationResolvedRoute[] = []
        const site = astroConfig.site ? stripTrailingSlash(astroConfig.site) : undefined

        addIntegration({
          name: 'starlight-links-validator',
          hooks: {
            'astro:config:setup': async ({ command, updateConfig }) => {
              if (command !== 'build') {
                return
              }

              await clearContentLayerCache(astroConfig, logger)

              updateConfig({
                markdown: {
                  rehypePlugins: [
                    [
                      rehypeStarlightLinksValidator,
                      {
                        base: astroConfig.base,
                        options: options,
                        site,
                        srcDir: astroConfig.srcDir,
                      } satisfies RehypeStarlightLinksValidatorConfig,
                    ],
                  ],
                },
              })
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
                  logger.warn('Links validation failed but the build will not error due to `failOnError: false`.')
                }
              }

              reportToCli(report)

              if (report.hasErrors && options.reporters.githubActions) {
                try {
                  reportToGitHubActions(report)
                } catch (error) {
                  logger.warn(
                    `Failed to write the GitHub Actions step summary: ${error instanceof Error ? error.message : String(error)}`,
                  )
                }
              }

              if (report.hasErrors && options.reporters.json) {
                try {
                  const outputPath = reportToJson(report, fileURLToPath(astroConfig.root))
                  logger.info(`Validation errors written to ${outputPath}`)
                } catch (error) {
                  logger.warn(
                    `Failed to write the JSON report: ${error instanceof Error ? error.message : String(error)}`,
                  )
                }
              }

              if (report.hasErrors && !options.failOnError) {
                setGitHubActionsOutput('has_links_validation_errors', 'true')
              }

              if (report.hasErrors && options.failOnError) {
                throwPluginError(
                  'Links validation failed.',
                  report.hasInvalidLinkToCustomPage
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
