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

const accueil = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/accueil' }),
  schema: ({ image }) => {
    const photo = z.object({ src: image(), alt: z.string().min(1) });
    return z.object({
      title: z.string(), description: z.string(),
      hero: z.object({ title: z.string(), introduction: z.string(), discover: z.string(), request: z.string(), desktop: photo, mobile: photo }),
      introduction: z.object({ title: z.string(), text: z.string(), photo, caption: z.string() }),
      activities: z.object({
        title: z.string(), lodgeTitle: z.string(), lodgeText: z.string(), lodgeLink: z.string(),
        soon: z.string(), interestLink: z.string(),
        upcoming: z.array(z.object({ title: z.string(), text: z.string() })),
      }),
      reasons: z.object({ title: z.string(), items: z.array(z.object({ title: z.string(), text: z.string() })), photo }),
      region: z.object({ title: z.string(), text: z.string(), location: z.string() }),
      stay: z.object({ title: z.string(), text: z.string(), pending: z.string() }),
    });
  },
});

export const collections = { interface: interfaceContent, accueil };
