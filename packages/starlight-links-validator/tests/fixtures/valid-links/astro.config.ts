import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  integrations: [
    starlight({
      pagefind: false,
      plugins: [starlightLinksValidator({ components: [['CustomLinkFoo', 'link']], errorOnLocalLinks: false })],
      title: 'Starlight Links Validator Tests - valid links',
    }),
  ],
  redirects: {
    '/redirect-external/': 'https://starlight.astro.build/',
    '/redirect-test/': '/test/',
    '/redirect-hash/': '/guides/example/#steps',
    '/redirect-hash-encoded/': '/unicode/#ic%C3%B4nes',
    '/redirect-querystring/': '/guides/example/?query=string',
    '/redirect-querystring-hash/': '/guides/example/?query=string#steps',
    '/redirect-chain-external/': '/redirect-external/',
    '/redirect-chain/': '/redirect-test/',
    '/redirect-chain-hash-first/': '/redirect-test/#title',
    '/redirect-chain-hash-last/': '/redirect-hash/',
  },
  site: 'https://example.com',
})
