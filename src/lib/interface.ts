import { getEntry } from 'astro:content';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import rawSite from '../data/site.yaml?raw';

export type Locale = 'fr' | 'en';
export type PageKey = 'home' | 'gite' | 'lieu' | 'reserver' | 'mentions' | 'confidentialite' | 'conditions';
export type AvailablePages = Partial<Record<PageKey, string>>;

// Pages légales françaises : liens du pied de page, présents sur toutes les pages en français.
export const legalPagesFr: AvailablePages = { mentions: '/mentions-legales/', confidentialite: '/confidentialite/', conditions: '/conditions-de-reservation/' };

export async function getInterface(locale: Locale) {
  const entry = await getEntry('interface', locale);
  if (!entry) throw new Error(`Interface manquante : ${locale}`);
  return entry.data;
}

export const site = z.object({
  address: z.string(), locality: z.string(), phone: z.string().nullable(),
  email: z.email().nullable(), directoryUrl: z.url(),
}).parse(parse(rawSite));
