export function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}
