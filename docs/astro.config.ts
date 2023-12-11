import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-links-validator/edit/main/docs/',
      },
      sidebar: [{ label: 'Getting Started', link: '/guides/getting-started/' }],
      social: {
        github: 'https://github.com/HiDeoo/starlight-links-validator',
      },
      title: 'Starlight Links Validator',
    }),
  ],
})
