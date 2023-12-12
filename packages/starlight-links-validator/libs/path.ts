export function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}
