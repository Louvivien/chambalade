import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chambalade.fr',
  output: 'static',
  trailingSlash: 'always',
  // Routes de contrôle isolées, absentes du build de production.
  integrations: process.env.ASTRO_AUDIT === '1' ? [{
    name: 'gabarit-audit',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        for (const pattern of ['/audit/fr/', '/en/audit/']) {
          injectRoute({ pattern, entrypoint: './tests/fixtures/gabarit.astro' });
        }
      },
    },
  }] : [],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
