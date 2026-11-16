import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// Parité des contenus : l’anglais a exactement la même structure que le français,
// les mêmes images, et autant de points à confirmer (TODO d’Amaëlle).
const racine = new URL('../src/content/', import.meta.url);
const lire = (chemin: string) => readFileSync(new URL(chemin, racine), 'utf8');
const donnees = (chemin: string) => parse(lire(chemin).split('---')[1]);
const marqueur = 'TODO' + '(amaelle)';
const compter = (texte: string) => texte.split(marqueur).length - 1;

// Clés réservées à l’anglais (voir src/content.config.ts) : elles n’ont pas d’équivalent français.
const SEULEMENT_EN = new Set(['unitNames', 'serverErrors']);
const formes = (valeur: unknown): unknown => {
  if (Array.isArray(valeur)) return valeur.map(formes);
  if (valeur && typeof valeur === 'object') return Object.fromEntries(Object.entries(valeur).filter(([k]) => !SEULEMENT_EN.has(k)).map(([k, v]) => [k, formes(v)]));
  return typeof valeur;
};
const images = (valeur: unknown, chemin = ''): string[] => {
  if (Array.isArray(valeur)) return valeur.flatMap((v, i) => images(v, `${chemin}[${i}]`));
  if (valeur && typeof valeur === 'object') return Object.entries(valeur).flatMap(([k, v]) => k === 'src' && typeof v === 'string' ? [`${chemin}.${k}=${v}`] : images(v, `${chemin}.${k}`));
  return [];
};

const paires: Array<[string, string]> = [
  ['accueil/fr.md', 'accueil/en.md'], ['gite/fr.md', 'gite/en.md'], ['lieu/fr.md', 'lieu/en.md'], ['reserver/fr.md', 'reserver/en.md'],
  ['legal/fr/mentions.md', 'legal/en/mentions.md'], ['legal/fr/confidentialite.md', 'legal/en/confidentialite.md'], ['legal/fr/conditions.md', 'legal/en/conditions.md'],
  ['interface/fr.md', 'interface/en.md'],
];

describe.each(paires.filter(([, en]) => existsSync(new URL(en, racine))))('parité %s ↔ %s', (fr, en) => {
  it('mêmes clés, mêmes types, mêmes tailles de listes', () => { expect(formes(donnees(en))).toEqual(formes(donnees(fr))); });
  it('mêmes images', () => { expect(images(donnees(en))).toEqual(images(donnees(fr))); });
  it('aucun texte français laissé tel quel par oubli (titre et description différents)', () => {
    expect(donnees(en).title ?? donnees(en).name).toBeTruthy();
    if (fr.startsWith('interface')) return;
    expect(donnees(en).title).not.toBe(donnees(fr).title);
    expect(donnees(en).description).not.toBe(donnees(fr).description);
  });
  it('autant de points à confirmer en anglais qu’en français', () => {
    if (fr.startsWith('interface')) return;
    expect(compter(lire(en))).toBe(compter(lire(fr)));
  });
});

it('toutes les paires prévues existent à la fin de l’étape 12', () => {
  // Garde-fou : une page anglaise ne doit pas être oubliée (voir docs/avancement.md).
  const attendues = process.env.PARITE_COMPLETE === '1' ? paires : paires.filter(([, en]) => existsSync(new URL(en, racine)));
  for (const [, en] of attendues) expect(existsSync(new URL(en, racine)), en).toBe(true);
});
