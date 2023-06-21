import { getValidationData } from './remark'

// FIXME(HiDeoo)
export function validateLinks() {
  const { files, links } = getValidationData()

  console.error('🚨 [validation.ts:7] files:', files)
  console.error('🚨 [validation.ts:7] links:', links)
}
