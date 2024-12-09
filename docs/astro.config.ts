import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-links-validator/edit/main/docs/',
      },
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Getting Started', link: '/getting-started/' },
            { label: 'Configuration', link: '/configuration/' },
          ],
        },
        {
          label: 'Resources',
          items: [{ label: 'Plugins and Tools', link: '/resources/starlight/' }],
        },
      ],
      social: {
        blueSky: 'https://bsky.app/profile/hideoo.dev',
        github: 'https://github.com/HiDeoo/starlight-links-validator',
      },
      title: 'Starlight Links Validator',
    }),
  ],
})
