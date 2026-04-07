import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data'

const base = '/test'

export const onRequest = defineRouteMiddleware((context) => {
  const frontmatter = context.locals.starlightRoute.entry.data

  if (hasHeroActions(frontmatter)) {
    for (const action of frontmatter.hero.actions) {
      // Skip transforming links for actions that include "remark plugin" in their text, to test that the middleware
      // does not track links not transformed by the middleware itself.
      if (action.text.includes('remark plugin')) continue
      // Skip transforming links for actions that include "not transformed" in their text, to test that invalid links
      // are still reported.
      if (action.text.includes('not transformed')) continue

      action.link = withBase(action.link)
    }
  }
  if (hasLinkOverride(frontmatter.prev)) {
    frontmatter.prev.link = withBase(frontmatter.prev.link)
  }
  if (hasLinkOverride(frontmatter.next)) {
    frontmatter.next.link = withBase(frontmatter.next.link)
  }
})

function withBase(link: string) {
  if (!link.startsWith('/')) return link
  if (link.startsWith(base)) return link

  return `${base}${link}`
}

function hasHeroActions(
  frontmatter: Frontmatter,
): frontmatter is Frontmatter & { hero: { actions: { link: string }[] } } {
  return (
    'hero' in frontmatter &&
    typeof frontmatter.hero === 'object' &&
    'actions' in frontmatter.hero &&
    Array.isArray(frontmatter.hero.actions)
  )
}

function hasLinkOverride(value: Frontmatter['prev']): value is { link: string } {
  return typeof value === 'object' && 'link' in value && typeof value.link === 'string'
}

type Frontmatter = StarlightRouteData['entry']['data']
