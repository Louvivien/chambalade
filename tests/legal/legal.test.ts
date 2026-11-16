import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { estAConfirmer, garnir, segments } from '../../src/lib/legal';

const dossier = new URL('../../src/content/legal/', import.meta.url);
const pages = Object.fromEntries(readdirSync(dossier).map(f => [f.replace('.md', ''), parse(readFileSync(new URL(f, dossier), 'utf8').split('---')[1])]));
const toutesLesChaines = (page: any): string[] => [page.title, page.description, page.hero.title, page.hero.text, page.draft.text,
  ...page.sections.flatMap((s: any) => [s.title, ...s.paragraphs, ...(s.items ?? []), ...(s.after ?? [])])];

describe('segments', () => {
  it('découpe texte et liens', () => {
    expect(segments('Lisez la [charte](/charte/) ici.')).toEqual([
      { type: 'text', text: 'Lisez la ' }, { type: 'link', text: 'charte', href: '/charte/' }, { type: 'text', text: ' ici.' }]);
  });
  it('refuse les adresses dangereuses', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'http://x.example'])
      expect(() => segments(`[x](${href})`)).toThrow();
  });
  it('accepte https et les adresses du site avec ancre', () => {
    expect(segments('[a](https://www.cnil.fr) [b](/gite/#tarifs)')).toHaveLength(3);
  });
  it('ne produit jamais de balise : le texte reste du texte', () => {
    expect(segments('<img src=x onerror=alert(1)>')).toEqual([{ type: 'text', text: '<img src=x onerror=alert(1)>' }]);
  });
});

describe('garnir', () => {
  it('remplace les jetons connus et refuse les inconnus', () => {
    expect(garnir('{heures} h et {jours} jours', { heures: '48', jours: '7' })).toBe('48 h et 7 jours');
    expect(() => garnir('{inconnu}', {})).toThrow();
  });
});
it('repère les points à confirmer', () => { expect(estAConfirmer('TODO(amaelle): x')).toBe(true); expect(estAConfirmer('ok')).toBe(false); });

describe('contenus légaux', () => {
  it('existent pour les trois pages', () => { expect(Object.keys(pages).sort()).toEqual(['conditions', 'confidentialite', 'mentions']); });
  it.each(Object.entries(pages))('%s : bandeau « à faire valider » et jetons connus', (_nom, page: any) => {
    expect(page.draft.title.toLowerCase()).toContain('à faire valider');
    for (const t of toutesLesChaines(page)) {
      garnir(t, { heures: '48', jours: '7', hebergeur: 'X' });
      segments(t);
    }
  });
  it.each(Object.entries(pages))('%s : identifiants de section uniques', (_nom, page: any) => {
    const ids = page.sections.map((s: any) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it.each(Object.entries(pages))('%s : typographie française (espace insécable avant : ; ! ? et dans « »)', (_nom, page: any) => {
    for (const t of toutesLesChaines(page)) {
      const sansMarqueur = t.replaceAll('TODO(amaelle):', '').replace(/https:\/\/\S+/g, '').replace(/\]\(\/[^)]*\)/g, ']');
      expect(sansMarqueur).not.toMatch(/ [:;!?]/);
      expect(sansMarqueur).not.toMatch(/« | »/);
      expect(sansMarqueur).not.toContain("'");
    }
  });
  it('les liens internes pointent vers les pages légales, Réserver ou Le gîte', () => {
    const autorises = /^\/(confidentialite\/|mentions-legales\/(#mediation)?|conditions-de-reservation\/|reserver\/|gite\/#tarifs)$/;
    for (const page of Object.values(pages) as any[]) for (const t of toutesLesChaines(page))
      for (const s of segments(t)) if (s.type === 'link' && s.href.startsWith('/')) expect(s.href).toMatch(autorises);
  });
  it('aucune coordonnée, SIRET ni nombre inventé dans les textes', () => {
    for (const page of Object.values(pages) as any[]) for (const t of toutesLesChaines(page)) {
      expect(t).not.toMatch(/\b\d{14}\b|\b\d{9}\b/);
      expect(t).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}|\b0\d(?:[ .]?\d{2}){4}\b/i);
    }
  });
});

it('tant que les textes ne sont pas validés, `valide` reste false (bandeau et noindex)', () => {
  const legal = parse(readFileSync(new URL('../../src/data/legal.yaml', import.meta.url), 'utf8'));
  expect(legal.valide).toBe(false);
});
