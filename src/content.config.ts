import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { priceIds, priceUnits } from './lib/tarifs';

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

const gite = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/gite' }),
  schema: ({ image }) => {
    const photo = z.object({ src: image(), alt: z.string(), caption: z.string() });
    return z.object({
      title: z.string(), description: z.string(),
      hero: z.object({ title: z.string(), text: z.string(), opening: z.string(), ratesLink: z.string(), requestLink: z.string(), photo }),
      rooms: z.object({ title: z.string(), capacityLabel: z.string(), items: z.array(z.object({ title: z.string(), text: z.string() })), photosPending: z.string() }),
      horse: z.object({ title: z.string(), text: z.string(), vaccines: z.string(), future: z.string() }),
      rates: z.object({
        title: z.string(), introduction: z.string(), included: z.string(), unknown: z.string(),
        units: z.record(z.enum(priceUnits), z.string()),
        items: z.record(z.enum(priceIds), z.object({ label: z.string(), pending: z.string().startsWith('TODO(amaelle)').optional() })),
      }),
      shared: z.object({ title: z.string(), text: z.string(), mealsTitle: z.string(), mealsText: z.string() }),
      practical: z.object({ title: z.string(), photo, items: z.array(z.object({ title: z.string(), pending: z.string() })) }),
      stay: z.object({ title: z.string(), text: z.string(), link: z.string() }),
    });
  },
});

const lieu = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/lieu' }),
  schema: ({ image }) => {
    const photo = z.object({ src: image(), alt: z.string().min(1), caption: z.string() });
    const marker = z.object({ symbol: z.string().length(1), label: z.string(), accessibleLabel: z.string(), description: z.string() });
    const surrounding = z.object({ title: z.string(), text: z.string(), photo });
    return z.object({
      title: z.string(), description: z.string(),
      hero: z.object({ title: z.string(), text: z.string(), accessLink: z.string() }),
      aerial: z.object({ title: z.string(), instructions: z.string(), navigationLabel: z.string(), legendLabel: z.string(), photo, markers: z.object({ gite: marker, carriere: marker, pres: marker }) }),
      facilities: z.object({ title: z.string(), items: z.array(z.object({ id: z.enum(['carriere', 'ptv', 'paddocks']), title: z.string(), text: z.string() })), pending: z.string(), photo, lodgeLink: z.string() }),
      horses: z.object({ title: z.string(), text: z.string(), instinct: photo, baraka: photo, pending: z.string() }),
      surroundings: z.object({ title: z.string(), text: z.string(), dionay: surrounding, cascade: surrounding }),
      access: z.object({ title: z.string(), text: z.string(), mapLink: z.string(), vehicleTitle: z.string(), vehicleText: z.string(), distanceTitle: z.string(), distanceText: z.string(), lodgeLink: z.string() }),
      stay: z.object({ title: z.string(), text: z.string(), lodgeLink: z.string(), requestLink: z.string() }),
    });
  },
});

export const collections = { interface: interfaceContent, accueil, gite, lieu };
