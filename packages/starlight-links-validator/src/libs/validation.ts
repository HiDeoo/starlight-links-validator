import { getLinksCount } from './remark'

// FIXME(HiDeoo)
export function validateLinks() {
  const linksCount = getLinksCount()

  if (linksCount > 0) {
    throw new Error(`Found ${linksCount} broken links.`)
  }
}
