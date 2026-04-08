import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data'

import { isFrontmatterWithHeroActions, isFrontmatterPrevNextLink } from './libs/frontmatter'
import { getLinkToValidate } from './libs/link'
import { ensureTrailingSlash, stripLeadingSlash } from './libs/path'
import { getFrontmatterReference, type FrontmatterReference } from './libs/position'
import { getValidationConfig, updateFrontmatterLink } from './libs/store'

export const onRequest = defineRouteMiddleware(async (context, next) => {
  const before = getFrontmatterLinks(context.locals.starlightRoute.entry.data)

  // Wait for later middleware to run.
  await next()

  const config = getValidationConfig()
  if (!config) return

  const id = ensureTrailingSlash(stripLeadingSlash(context.url.pathname))
  const after = getFrontmatterLinks(context.locals.starlightRoute.entry.data)

  for (const [key, { link, path }] of after) {
    if (before.get(key)?.link === link) continue
    updateFrontmatterLink(id, path, getLinkToValidate(link, getFrontmatterReference(path), config))
  }

  for (const [key, { path }] of before) {
    if (after.has(key)) continue
    updateFrontmatterLink(id, path, undefined)
  }
})

function getFrontmatterLinks(frontmatter: StarlightRouteData['entry']['data']): FrontmatterLinks {
  const links: FrontmatterLinks = new Map()

  if (isFrontmatterWithHeroActions(frontmatter)) {
    for (const [index, action] of frontmatter.hero.actions.entries()) {
      const path: FrontmatterReference['path'] = ['hero', 'actions', index, 'link']
      setCollectedFrontmatterLink(links, path, action.link)
    }
  }

  const prevPath: FrontmatterReference['path'] = ['prev', 'link']
  if (isFrontmatterPrevNextLink(frontmatter.prev)) {
    setCollectedFrontmatterLink(links, prevPath, frontmatter.prev.link)
  }

  const nextPath: FrontmatterReference['path'] = ['next', 'link']
  if (isFrontmatterPrevNextLink(frontmatter.next)) {
    setCollectedFrontmatterLink(links, nextPath, frontmatter.next.link)
  }

  return links
}

function setCollectedFrontmatterLink(links: FrontmatterLinks, path: FrontmatterReference['path'], link: string) {
  links.set(path.join('.'), { link, path })
}

type FrontmatterLinks = Map<string, { link: string; path: FrontmatterReference['path'] }>
