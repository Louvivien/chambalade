import { describe, expect, it } from 'vitest';
// @ts-expect-error module .mjs sans déclaration de types
import { PAGES, verifierSite } from '../../scripts/deploiement/smoke.mjs';

type Reponse = { status?: number; body?: string; headers?: Record<string, string> };
const page = (langue: string, cle = '0x4AAAAAAAbCdEf') => `<html lang="${langue}"><head><link rel="canonical" href="https://chambalade.fr/x/"><link rel="alternate" hreflang="fr" href="a"><link rel="alternate" hreflang="en" href="b"><link rel="alternate" hreflang="x-default" href="a"><link rel="stylesheet" href="/_astro/a.css"></head><script>{"siteKey":"${cle}"}</script></html>`;

/** Faux site : par défaut, un site de production en bonne santé. */
function faux(surcharges: Record<string, Reponse> = {}, cle?: string) {
  const reponses: Record<string, Reponse> = {
    '/robots.txt': { body: 'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://chambalade.fr/sitemap.xml\n' },
    '/sitemap.xml': { body: Array.from({ length: 8 }, (_, i) => `<loc>https://chambalade.fr/p${i}/</loc>`).join('') },
    '/_astro/a.css': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/cette-page-n-existe-pas/': { status: 404, body: '<meta name="robots" content="noindex">' },
    '/admin/': { status: 401 }, '/api/admin/demandes': { status: 401 }, '/api/admin/moi': { status: 401 },
    '/api/devis': { status: 400, body: '{"ok":false}' },
    ...surcharges,
  };
  const appel = async (adresse: string | URL | Request) => {
    const u = new URL(String(adresse));
    const chemin = u.pathname;
    const cle0 = chemin + (u.search ? '?' : '');
    const r = reponses[chemin] ?? reponses[cle0] ?? (chemin === '/api/disponibilites' ? { body: '{"ok":true}' } : null);
    if (r) return new Response(r.body ?? '', { status: r.status ?? 200, headers: { 'content-type': 'text/html', ...(r.headers ?? {}) } });
    const langue = chemin.startsWith('/en/') ? 'en' : 'fr';
    const entetes = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' };
    return new Response(page(langue, cle), { status: 200, headers: entetes });
  };
  return appel as unknown as typeof fetch;
}
const echecs = (r: Array<{ ok: boolean; id: string }>) => r.filter(x => !x.ok).map(x => x.id);
const BASE = 'https://chambalade.pages.dev';

describe('verifierSite', () => {
  it('un site de production sain réussit tous les contrôles', async () => {
    const r = await verifierSite(BASE, { fetch: faux(), aujourdhui: '2027-04-01' });
    expect(echecs(r)).toEqual([]);
    expect(r.length).toBeGreaterThan(25);
    expect(PAGES.fr).toHaveLength(7);
  });
  it('une administration ouverte est signalée', async () => {
    for (const chemin of ['/admin/', '/api/admin/demandes', '/api/admin/moi']) {
      const r = await verifierSite(BASE, { fetch: faux({ [chemin]: { status: 200, body: 'admin' } }), aujourdhui: '2027-04-01' });
      expect(echecs(r), chemin).toEqual([`ferme ${chemin}`]);
    }
  });
  it('un refus (401, 403, 503) ou une redirection vers Access comptent comme fermé', async () => {
    for (const reponse of [{ status: 403 }, { status: 503 }, { status: 302, headers: { location: 'https://equipe.cloudflareaccess.com/cdn-cgi/access/login' } }]) {
      expect(echecs(await verifierSite(BASE, { fetch: faux({ '/admin/': reponse }), aujourdhui: '2027-04-01' }))).toEqual([]);
    }
    expect(echecs(await verifierSite(BASE, { fetch: faux({ '/admin/': { status: 302, headers: { location: 'https://ailleurs.example/' } } }), aujourdhui: '2027-04-01' }))).toEqual(['ferme /admin/']);
  });
  it('une clé Turnstile de test est refusée en production, autorisée pour un essai', async () => {
    const test = '1x00000000000000000000AA';
    expect(echecs(await verifierSite(BASE, { fetch: faux({}, test), aujourdhui: '2027-04-01' }))).toEqual(['turnstile /reserver/', 'turnstile /en/book/']);
    expect(echecs(await verifierSite(BASE, { fetch: faux({}, test), aujourdhui: '2027-04-01', autoriserCleTest: true }))).toEqual([]);
    expect(echecs(await verifierSite(BASE, { fetch: faux({}, ''), aujourdhui: '2027-04-01' }))).toEqual(['turnstile /reserver/', 'turnstile /en/book/']);
  });
  it('API en panne, 404 mal configurée, cache et robots manquants : chaque panne est nommée', async () => {
    const r = await verifierSite(BASE, { fetch: faux({
      '/api/disponibilites': { status: 500, body: '{}' },
      '/cette-page-n-existe-pas/': { status: 200, body: '' },
      '/_astro/a.css': { headers: {} },
      '/robots.txt': { body: 'User-agent: *\nAllow: /\n' },
    }), aujourdhui: '2027-04-01' });
    expect(echecs(r).sort()).toEqual(['404', 'api-disponibilites', 'cache-assets', 'robots']);
  });
  it('depuis localhost, la fermeture de l’administration n’est pas jugée', async () => {
    const r = await verifierSite('http://127.0.0.1:8788', { fetch: faux({ '/admin/': { status: 200 } }), aujourdhui: '2027-04-01' });
    expect(r.some(x => x.id.startsWith('ferme'))).toBe(false);
  });
  it('une page absente ou une panne réseau est une échec, pas une exception', async () => {
    const r = await verifierSite(BASE, { fetch: (async () => { throw new Error('réseau coupé'); }) as unknown as typeof fetch, aujourdhui: '2027-04-01' });
    expect(echecs(r).length).toBeGreaterThan(10);
  });
});
