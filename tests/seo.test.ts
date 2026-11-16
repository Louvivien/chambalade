import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { construireMeta, localeOg } from '../src/lib/seo';

const base = { langue: 'fr' as const, titre: 'T', description: 'D', url: 'https://chambalade.fr/gite/', nomDuSite: 'Chambalade' };
const valeur = (entrees: ReturnType<typeof construireMeta>, cle: string) => entrees.find(e => e.attributs.property === cle || e.attributs.name === cle || e.attributs.rel === cle)?.attributs;

describe('construireMeta', () => {
  it('canonical et Open Graph de base', () => {
    const m = construireMeta(base);
    expect(valeur(m, 'canonical')?.href).toBe('https://chambalade.fr/gite/');
    expect(valeur(m, 'og:url')?.content).toBe('https://chambalade.fr/gite/');
    expect(valeur(m, 'og:locale')?.content).toBe('fr_FR');
    expect(valeur(m, 'og:locale:alternate')?.content).toBe('en_GB');
    expect(valeur(m, 'twitter:card')?.content).toBe('summary');
    expect(valeur(m, 'og:image')).toBeUndefined();
  });
  it('anglais : locale en_GB, alternative fr_FR', () => {
    const m = construireMeta({ ...base, langue: 'en' });
    expect(valeur(m, 'og:locale')?.content).toBe(localeOg.en);
    expect(valeur(m, 'og:locale:alternate')?.content).toBe(localeOg.fr);
  });
  it('avec image : dimensions, texte alternatif et grande carte', () => {
    const m = construireMeta({ ...base, image: { url: 'https://chambalade.fr/_astro/a.jpg', largeur: 1200, hauteur: 630, alt: 'Alt' } });
    expect(valeur(m, 'og:image')?.content).toBe('https://chambalade.fr/_astro/a.jpg');
    expect(valeur(m, 'og:image:width')?.content).toBe('1200');
    expect(valeur(m, 'og:image:alt')?.content).toBe('Alt');
    expect(valeur(m, 'twitter:card')?.content).toBe('summary_large_image');
  });
});

describe('titres et descriptions des contenus', () => {
  const lire = (chemin: string) => parse(readFileSync(new URL(`../src/content/${chemin}`, import.meta.url), 'utf8').split('---')[1]);
  const pages = ['accueil', 'gite', 'lieu', 'reserver'].flatMap(c => ['fr', 'en'].map(l => [`${c}/${l}.md`] as const))
    .concat(['mentions', 'confidentialite', 'conditions'].flatMap(c => ['fr', 'en'].map(l => [`legal/${l}/${c}.md`] as const)));
  it.each(pages)('%s : titre ≤ 70 signes, description de 60 à 170 signes', chemin => {
    const { title, description } = lire(chemin);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(description.length).toBeGreaterThanOrEqual(60);
    expect(description.length).toBeLessThanOrEqual(170);
  });
  it('titres et descriptions uniques dans chaque langue', () => {
    for (const l of ['fr', 'en']) {
      const toutes = pages.filter(([c]) => c.includes(`/${l}`)).map(([c]) => lire(c));
      expect(new Set(toutes.map(t => t.title)).size).toBe(toutes.length);
      expect(new Set(toutes.map(t => t.description)).size).toBe(toutes.length);
    }
  });
});

import { construireRobots, construireSitemap, donneesStructurees, jsonPourScript } from '../src/lib/seo';
import { GET as sitemap } from '../src/pages/sitemap.xml';
import { GET as robots } from '../src/pages/robots.txt';
import { locales, pageKeys, routes } from '../src/lib/routes';

const site = new URL('https://chambalade.fr');
const appeler = async (route: any) => (await route({ site } as any)).text() as Promise<string>;

describe('sitemap.xml', () => {
  it('échappe le XML et déclare les alternatives de langue', () => {
    const xml = construireSitemap([{ url: 'https://x.fr/?a=1&b=2', alternatives: [{ langue: 'fr', url: 'https://x.fr/' }, { langue: 'en', url: 'https://x.fr/en/' }] }]);
    expect(xml).toContain('<loc>https://x.fr/?a=1&amp;b=2</loc>');
    expect(xml).toContain('hreflang="en" href="https://x.fr/en/"');
    expect(xml).toContain('hreflang="x-default" href="https://x.fr/"');
  });
  it('liste les pages publiques dans les deux langues, adresses absolues et réciproques', async () => {
    const xml = await appeler(sitemap);
    for (const cle of ['home', 'gite', 'lieu', 'reserver'] as const) for (const l of locales) expect(xml).toContain(`<loc>https://chambalade.fr${routes[l][cle]}</loc>`);
    for (const l of locales) expect((xml.match(new RegExp(`hreflang="${l}"`, 'g')) ?? []).length).toBe(8);
  });
  it('exclut les pages légales tant qu’elles ne sont pas validées, et /admin/', async () => {
    const xml = await appeler(sitemap);
    for (const cle of ['mentions', 'confidentialite', 'conditions'] as const) for (const l of locales) expect(xml).not.toContain(routes[l][cle]);
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/api');
  });
  it('toutes les adresses viennent de la table de routes', async () => {
    const xml = await appeler(sitemap);
    const connues = new Set(pageKeys.flatMap(k => locales.map(l => `https://chambalade.fr${routes[l][k]}`)));
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) expect(connues.has(m[1]), m[1]).toBe(true);
  });
});

describe('robots.txt', () => {
  it('interdit /admin/ et /api/, autorise le reste, annonce le sitemap', async () => {
    const txt = await appeler(robots);
    expect(txt).toContain('Disallow: /admin/');
    expect(txt).toContain('Disallow: /api/');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Sitemap: https://chambalade.fr/sitemap.xml');
  });
  it('construireRobots', () => { expect(construireRobots('https://x.fr/s.xml', ['/a/'])).toBe('User-agent: *\nAllow: /\nDisallow: /a/\n\nSitemap: https://x.fr/s.xml\n'); });
});

describe('données structurées LodgingBusiness', () => {
  const base = { nom: 'Chambalade', description: 'D', url: 'https://chambalade.fr/', langue: 'fr' as const, adresse: { rue: 'R', codePostal: '38940', ville: 'Roybon', region: 'Isère', pays: 'FR' } };
  it('type, adresse et langue', () => {
    const d: any = donneesStructurees(base);
    expect(d['@type']).toBe('LodgingBusiness');
    expect(d.address['@type']).toBe('PostalAddress');
    expect(d.inLanguage).toBe('fr');
  });
  it('n’invente aucune coordonnée : téléphone et e-mail absents tant qu’ils sont inconnus', () => {
    const d: any = donneesStructurees({ ...base, telephone: null, email: null });
    for (const cle of ['telephone', 'email', 'priceRange', 'geo', 'aggregateRating', 'openingHours', 'checkinTime']) expect(cle in d, cle).toBe(false);
    expect((donneesStructurees({ ...base, telephone: '+33 4 00 00 00 00' }) as any).telephone).toBe('+33 4 00 00 00 00');
  });
  it('« < » ne peut pas fermer la balise script', () => {
    expect(jsonPourScript({ a: '</script><img>' })).not.toContain('<');
  });
});
