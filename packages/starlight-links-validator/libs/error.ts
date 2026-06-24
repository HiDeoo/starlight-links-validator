import { AstroError } from 'astro/errors'

export function throwPluginError(message: string, additionalHint?: string): never {
  let hint = 'See the error report above for more information.\n\n'
  if (additionalHint) hint += `${additionalHint}\n\n`
  hint +=
    'If you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-links-validator/issues/new/choose'

  throw new AstroError(message, hint)
}
