export function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`
}
