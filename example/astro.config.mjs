import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    starlight({
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-links-validator/edit/main/example/',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [{ label: 'Example Guide', link: '/guides/example/' }],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
      social: {
        github: 'https://github.com/HiDeoo/starlight-links-validator',
      },
      title: 'Starlight Links Validator',
    }),
  ],
})
