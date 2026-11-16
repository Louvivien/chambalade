import { getEntry } from 'astro:content';
import { z } from 'astro/zod';
import type { Locale } from './routes';
import { parse } from 'yaml';
import rawSite from '../data/site.yaml?raw';

export type { Locale, PageKey, AvailablePages } from './routes';

export async function getInterface(locale: Locale) {
  const entry = await getEntry('interface', locale);
  if (!entry) throw new Error(`Interface manquante : ${locale}`);
  return entry.data;
}

export const site = z.object({
  address: z.string(), locality: z.string(), postalCode: z.string(), city: z.string(), region: z.string(), country: z.string().length(2), phone: z.string().nullable(),
  email: z.email().nullable(), directoryUrl: z.url(),
}).parse(parse(rawSite));
