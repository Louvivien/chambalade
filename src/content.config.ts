import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const interfaceContent = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/interface' }),
  schema: z.object({
    name: z.string(), signature: z.string(), skipLink: z.string(),
    navigationLabel: z.string(), languagesLabel: z.string(), footerLabel: z.string(),
    homeLabel: z.string(), contactPending: z.string(), logoPending: z.string(),
    nav: z.array(z.object({ key: z.enum(['home', 'gite', 'lieu', 'reserver']), label: z.string() })),
    legal: z.array(z.object({ key: z.enum(['mentions', 'confidentialite']), label: z.string() })),
    directoryLabel: z.string(),
    languages: z.array(z.object({ code: z.enum(['fr', 'en']), label: z.string() })),
  }),
});

export const collections = { interface: interfaceContent };
