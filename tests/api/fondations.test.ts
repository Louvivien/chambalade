import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { erreur, json, lireJson, methodeNonAutorisee, origineAutorisee } from '../../src/lib/api/http';
import { parseReservationConfig } from '../../src/lib/reservation/config';
import { creerBase } from './d1';

const post = (corps: string, entetes: Record<string, string> = {}, url = 'https://chambalade.fr/api/demandes') =>
  new Request(url, { method: 'POST', body: corps, headers: { 'Content-Type': 'application/json', ...entetes } });

describe('configuration exportée pour les fonctions', () => {
  it('suit exactement le YAML et reste valide', () => {
    const yaml = parse(readFileSync(new URL('../../src/data/reservation.yaml', import.meta.url), 'utf8'));
    const genere = JSON.parse(readFileSync(new URL('../../src/generated/reservation.json', import.meta.url), 'utf8'));
    expect(genere).toEqual(yaml);
    expect(() => parseReservationConfig(genere)).not.toThrow();
  });
  it('le script de vérification passe', () => {
    expect(() => execFileSync('node', ['scripts/generer-config.mjs', '--verifier'], { cwd: new URL('../../', import.meta.url), stdio: 'pipe' })).not.toThrow();
  });
});

describe('façade D1 de test', () => {
  it('lie les paramètres, lit une ligne et toutes les lignes', async () => {
    const db = creerBase();
    await db.prepare('INSERT INTO limites (cle, fenetre, compteur) VALUES (?, ?, ?)').bind('a', 'h1', 2).run();
    await db.prepare('INSERT INTO limites (cle, fenetre, compteur) VALUES (?, ?, ?)').bind('b', 'h1', 3).run();
    expect((await db.prepare('SELECT compteur FROM limites WHERE cle = ?').bind('b').first<{ compteur: number }>())?.compteur).toBe(3);
    expect((await db.prepare('SELECT * FROM limites').all()).results).toHaveLength(2);
    expect(await db.prepare('SELECT * FROM limites WHERE cle = ?').bind('zz').first()).toBeNull();
  });
  it('un batch est tout ou rien', async () => {
    const db = creerBase();
    const ajout = (cle: string, c: number) => db.prepare('INSERT INTO limites (cle, fenetre, compteur) VALUES (?, ?, ?)').bind(cle, 'h1', c);
    await expect(db.batch([ajout('a', 1), ajout('b', -1)])).rejects.toThrow();
    expect((await db.prepare('SELECT count(*) AS n FROM limites').first<{ n: number }>())?.n).toBe(0);
    const [r1, r2] = await db.batch([ajout('a', 1), ajout('b', 2)]);
    expect([r1.meta.changes, r2.meta.changes]).toEqual([1, 1]);
  });
});

describe('utilitaires HTTP', () => {
  it('répond en JSON sans mise en cache', async () => {
    const r = json({ ok: true });
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(r.headers.get('Content-Type')).toContain('application/json');
    expect(await r.json()).toEqual({ ok: true });
  });
  it('les erreurs portent un code et un message, sans détail technique', async () => {
    const r = erreur(400, 'champ_invalide', 'Le nom est requis.', { champ: 'nom' });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ ok: false, erreur: { code: 'champ_invalide', message: 'Le nom est requis.', champ: 'nom' } });
  });
  it('refuse une méthode non prévue avec l’en-tête Allow', () => {
    const r = methodeNonAutorisee(new Request('https://chambalade.fr/api/devis', { method: 'DELETE' }), ['POST']);
    expect(r?.status).toBe(405);
    expect(r?.headers.get('Allow')).toBe('POST');
    expect(methodeNonAutorisee(new Request('https://chambalade.fr/api/devis', { method: 'POST' }), ['POST'])).toBeNull();
  });
  it('accepte l’origine du site ou l’absence d’origine, refuse une autre origine', () => {
    expect(origineAutorisee(post('{}'))).toBe(true);
    expect(origineAutorisee(post('{}', { Origin: 'https://chambalade.fr' }))).toBe(true);
    expect(origineAutorisee(post('{}', { Origin: 'https://autre-site.example' }))).toBe(false);
  });
  it('lit un JSON valide', async () => {
    const r = await lireJson(post('{"a":1}'));
    expect(r).toEqual({ ok: true, donnees: { a: 1 } });
  });
  it.each([
    ['origine étrangère', () => post('{}', { Origin: 'https://autre-site.example' }), 403],
    ['type de contenu incorrect', () => post('{}', { 'Content-Type': 'text/plain' }), 415],
    ['JSON cassé', () => post('{pas du json'), 400],
    ['corps trop gros', () => post(JSON.stringify({ x: 'a'.repeat(30_000) })), 413],
  ])('refuse : %s', async (_nom, fabrique, status) => {
    const r = await lireJson(fabrique());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reponse.status).toBe(status);
  });
});
