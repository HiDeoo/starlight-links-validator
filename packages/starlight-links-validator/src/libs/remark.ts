import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

// FIXME(HiDeoo)
let linksCount = 0

export const remarkStarlightLinksValidator: Plugin = function () {
  return (tree) => {
    visit(tree, 'link', () => {
      // FIXME(HiDeoo)
      linksCount += 1
    })
  }
}

// FIXME(HiDeoo)
export function getLinksCount() {
  return linksCount
}
