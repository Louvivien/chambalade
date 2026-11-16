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
