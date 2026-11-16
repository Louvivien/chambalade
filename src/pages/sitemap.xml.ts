import type { APIRoute } from 'astro';
import { parse } from 'yaml';
import rawLegal from '../data/legal.yaml?raw';
import { locales, pageKeys, routes, type PageKey } from '../lib/routes';
import { construireSitemap } from '../lib/seo';

// Les pages légales n’entrent dans le sitemap qu’une fois validées (même interrupteur que leur noindex).
const valide = parse(rawLegal).valide === true;
const legales: PageKey[] = ['mentions', 'confidentialite', 'conditions'];

export const GET: APIRoute = ({ site }) => {
  const absolue = (chemin: string) => new URL(chemin, site).href;
  const pages = pageKeys.filter(cle => valide || !legales.includes(cle)).flatMap(cle =>
    locales.map(langue => ({ url: absolue(routes[langue][cle]), alternatives: locales.map(l => ({ langue: l, url: absolue(routes[l][cle]) })) })));
  return new Response(construireSitemap(pages), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
