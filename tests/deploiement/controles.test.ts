import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error module .mjs sans déclaration de types
import { CLES_TURNSTILE_TEST, ZERO_ID, controlerMigrations, controlerOuverture, controlerSecrets, controlerSite, controlerSuivis, controlerWrangler, resume } from '../../scripts/deploiement/controles.mjs';

const toml = (id: string, extra = '') => `name = "chambalade"\npages_build_output_dir = "dist"\n[[d1_databases]]\nbinding = "DB"\ndatabase_id = "${id}"\n${extra}`;
const echecs = (r: Array<{ ok: boolean; id: string }>) => r.filter(x => !x.ok).map(x => x.id);

describe('wrangler.toml', () => {
  it('l’identifiant de test est refusé, un vrai identifiant passe', () => {
    expect(echecs(controlerWrangler(toml(ZERO_ID)))).toEqual(['wrangler-database-id']);
    expect(echecs(controlerWrangler(toml('0a1b2c3d-1111-2222-3333-444455556666')))).toEqual([]);
  });
  it('le fichier du dépôt est dans l’état attendu : seul l’identifiant de test reste à remplacer', () => {
    expect(echecs(controlerWrangler(readFileSync(new URL('../../wrangler.toml', import.meta.url), 'utf8')))).toEqual(['wrangler-database-id']);
  });
  it('refuse les variables de développement et les secrets dans le fichier, mais pas dans les commentaires', () => {
    expect(echecs(controlerWrangler(toml('a-b', '[vars]\nENVIRONMENT = "development"\n')))).toContain('wrangler-pas-de-dev');
    expect(echecs(controlerWrangler(toml('a-b', '[vars]\nTURNSTILE_SECRET = "x"\n')))).toContain('wrangler-pas-de-secret');
    expect(echecs(controlerWrangler(toml('a-b', '# ENVIRONMENT ne doit jamais figurer\n')))).toEqual([]);
  });
});

describe('migrations', () => {
  it('numérotation continue exigée', () => {
    expect(echecs(controlerMigrations(['0001_a.sql', '0002_b.sql']))).toEqual([]);
    expect(echecs(controlerMigrations(['0001_a.sql', '0003_c.sql']))).toEqual(['migrations']);
    expect(echecs(controlerMigrations([]))).toEqual(['migrations']);
  });
  it('les migrations du dépôt passent', async () => {
    const { readdirSync } = await import('node:fs');
    expect(echecs(controlerMigrations(readdirSync(new URL('../../migrations/', import.meta.url))))).toEqual([]);
  });
});

describe('site construit', () => {
  const fichiers = ['index.html', 'en/index.html', 'reserver/index.html', 'en/book/index.html', 'admin/index.html', '404.html', '_headers', 'robots.txt', 'sitemap.xml'];
  const page = (cle: string) => `<script>{"siteKey":"${cle}"}</script>`;
  it('une clé de production passe', () => {
    expect(echecs(controlerSite({ fichiers, reserverFr: page('0x4AAAAAAAbCdEfGhIjKlMn'), reserverEn: page('0x4AAAAAAAbCdEfGhIjKlMn') }))).toEqual([]);
  });
  it('clé vide, clé de test ou page absente : refusé', () => {
    expect(echecs(controlerSite({ fichiers, reserverFr: page(''), reserverEn: page('1x00000000000000000000AA') }))).toEqual(['turnstile-cle-reserver', 'turnstile-cle-en/book']);
    expect(echecs(controlerSite({ fichiers, reserverFr: undefined, reserverEn: undefined }))).toEqual(['turnstile-cle-reserver', 'turnstile-cle-en/book']);
  });
  it('fichiers manquants listés', () => {
    const r = controlerSite({ fichiers: fichiers.filter(f => f !== '404.html'), reserverFr: page('0xABC'), reserverEn: page('0xABC') });
    expect(r[0].ok).toBe(false);
    expect(r[0].message).toContain('404.html');
  });
  it('les trois clés de test de Cloudflare sont reconnues', () => {
    for (const k of ['1x00000000000000000000AA', '2x00000000000000000000AB', '3x00000000000000000000FF']) expect(CLES_TURNSTILE_TEST.test(k), k).toBe(true);
    expect(CLES_TURNSTILE_TEST.test('0x4AAAAAAAbCdEfGhIjKlMn')).toBe(false);
  });
});

describe('secrets et fichiers sensibles', () => {
  it('motifs de secrets reconnus', () => {
    expect(echecs(controlerSecrets({ 'a.js': 'const k="re_abcdefghijklmnopqrstuv"' }))).toEqual(['site-secrets']);
    expect(echecs(controlerSecrets({ 'a.html': 'ACCESS_DEV_EMAIL=dev@x' }))).toEqual(['site-secrets']);
    expect(echecs(controlerSecrets({ 'a.html': '<p>Bonjour</p>' }))).toEqual([]);
  });
  it('.dev.vars et .env ne doivent pas être suivis ; les .example si', () => {
    expect(echecs(controlerSuivis(['.dev.vars', 'src/a.ts']))).toEqual(['git-sensibles']);
    expect(echecs(controlerSuivis(['.env']))).toEqual(['git-sensibles']);
    expect(echecs(controlerSuivis(['photos-originales/a.jpg']))).toEqual(['git-sensibles']);
    expect(echecs(controlerSuivis(['.env.example', '.dev.vars.example', 'src/a.ts']))).toEqual([]);
  });
});

describe('avant l’ouverture', () => {
  it('tout ce qui reste à régler est listé, et ce n’est jamais bloquant', () => {
    const r = controlerOuverture({ legal: { valide: false, editeur: { nom: null, siret: null } }, site: { phone: null, email: null }, nbPointsAConfirmer: 5, prixNonValides: 3 });
    expect(echecs(r).sort()).toEqual(['contact', 'identite', 'legal-valide', 'tarifs', 'todo']);
    expect(resume(r).pret).toBe(true);
    expect(resume(r).ouverture).toHaveLength(5);
  });
  it('tout réglé : rien à signaler', () => {
    const r = controlerOuverture({ legal: { valide: true, editeur: { nom: 'A', siret: '1' } }, site: { phone: '0', email: null }, nbPointsAConfirmer: 0, prixNonValides: 0 });
    expect(echecs(r)).toEqual([]);
  });
});
