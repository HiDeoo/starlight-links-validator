import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import type { Root } from 'mdast'
import starlightLinksValidator from 'starlight-links-validator'
import type { DataMap, VFile } from 'vfile'

const base = '/test'

export default defineConfig({
  base,
  integrations: [
    starlight({
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      pagefind: false,
      plugins: [starlightLinksValidator({ errorOnFallbackPages: false, sameSitePolicy: 'validate' })],
      routeMiddleware: './src/routeData.ts',
      title: 'Starlight Links Validator Tests - base path',
    }),
  ],
  markdown: {
    remarkPlugins: [remarkPlugin],
  },
  site: 'https://example.com',
})

// `/guides/example/` → `/test/guides/example/` only for the action link with the text containing "remark plugin"
function remarkPlugin() {
  return function transformer(_tree: Root, file: VFile) {
    const frontmatter = file.data.astro?.frontmatter
    if (!isFrontmatterWithHeroActions(frontmatter)) return

    for (const action of frontmatter.hero.actions) {
      if (!action.text?.includes('remark plugin')) continue
      if (action.link.startsWith(base)) continue

      action.link = `${base}${action.link}`
    }
  }
}

function isFrontmatterWithHeroActions(
  frontmatter: Frontmatter,
): frontmatter is Frontmatter & { hero: { actions: { text?: string; link: string }[] } } {
  return (
    frontmatter !== undefined &&
    'hero' in frontmatter &&
    typeof frontmatter['hero'] === 'object' &&
    frontmatter['hero'] !== null &&
    'actions' in frontmatter['hero']
  )
}

export type Frontmatter = DataMap['astro']['frontmatter']
