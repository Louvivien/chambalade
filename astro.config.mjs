import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chambalade.fr',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
