// Contrôle d’un site déployé, par requêtes HTTP seulement : rien n’est écrit dans la base, aucune demande n’est créée.
import { CLES_TURNSTILE_TEST } from './controles.mjs';

export const PAGES = {
  fr: ['/', '/gite/', '/le-lieu/', '/reserver/', '/mentions-legales/', '/confidentialite/', '/conditions-de-reservation/'],
  en: ['/en/', '/en/guesthouse/', '/en/the-place/', '/en/book/', '/en/legal/', '/en/privacy/', '/en/booking-terms/'],
};
const resultat = (id, ok, message) => ({ id, ok, message });
const refus = [401, 403, 503]; // une administration fermée répond par un refus, jamais par du contenu

/**
 * @param {string} base  adresse du site, sans barre finale (https://chambalade.pages.dev)
 * @param {{ fetch?: typeof fetch, aujourdhui?: string, autoriserCleTest?: boolean }} options
 */
export async function verifierSite(base, { fetch: appel = fetch, aujourdhui = new Date().toISOString().slice(0, 10), autoriserCleTest = false } = {}) {
  const sortie = [];
  const url = (chemin) => base + chemin;
  const get = (chemin, init = {}) => appel(url(chemin), { redirect: 'manual', ...init });
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base);

  // 1. Pages publiques : 200, langue, hreflang, canonical.
  for (const [langue, chemins] of Object.entries(PAGES)) for (const chemin of chemins) {
    try {
      const r = await get(chemin);
      const html = r.status === 200 ? await r.text() : '';
      const ok = r.status === 200 && html.includes(`<html lang="${langue}"`) && /hreflang="x-default"/.test(html) && html.includes(`rel="canonical" href="`) && html.includes(`hreflang="${langue === 'fr' ? 'en' : 'fr'}"`);
      sortie.push(resultat(`page ${chemin}`, ok, ok ? `${chemin} : 200, langue et hreflang présents` : `${chemin} : statut ${r.status} ou balises langue/hreflang/canonical manquantes`));
      if (chemin === '/reserver/' || chemin === '/en/book/') {
        const cle = html.match(/"siteKey":"([^"]*)"/)?.[1] ?? '';
        const testCle = CLES_TURNSTILE_TEST.test(cle);
        sortie.push(resultat(`turnstile ${chemin}`, !!cle && (!testCle || autoriserCleTest), !cle ? `${chemin} : aucune clé Turnstile publique` : testCle ? `${chemin} : clé de test${autoriserCleTest ? ' (autorisée pour cet essai)' : ' : interdite en production'}` : `${chemin} : clé Turnstile de production`));
      }
    } catch (e) { sortie.push(resultat(`page ${chemin}`, false, `${chemin} : ${e.message}`)); }
  }

  // 2. Page 404.
  try {
    const r = await get('/cette-page-n-existe-pas/');
    const html = await r.text();
    sortie.push(resultat('404', r.status === 404 && /noindex/.test(html), r.status === 404 ? (/noindex/.test(html) ? '404 : statut et noindex corrects' : '404 : noindex manquant') : `404 : statut ${r.status} au lieu de 404`));
  } catch (e) { sortie.push(resultat('404', false, `404 : ${e.message}`)); }

  // 3. robots.txt et sitemap.xml.
  try {
    const robots = await (await get('/robots.txt')).text();
    sortie.push(resultat('robots', /Disallow: \/admin\//.test(robots) && /Disallow: \/api\//.test(robots) && /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(robots), 'robots.txt : /admin/ et /api/ interdits, sitemap annoncé'));
    const r = await get('/sitemap.xml');
    const xml = await r.text();
    const nb = (xml.match(/<loc>/g) ?? []).length;
    sortie.push(resultat('sitemap', r.status === 200 && nb >= 8 && !/\/admin|\/api/.test(xml), `sitemap.xml : ${nb} adresses, administration absente`));
  } catch (e) { sortie.push(resultat('robots-sitemap', false, e.message)); }

  // 4. En-têtes.
  try {
    const r = await get('/');
    const html = await r.text();
    sortie.push(resultat('en-tetes', r.headers.get('x-content-type-options') === 'nosniff' && !!r.headers.get('referrer-policy'), 'en-têtes : nosniff et politique de référent sur les pages'));
    const asset = html.match(/\/_astro\/[^"')\s]+\.(css|js)/)?.[0];
    if (asset) {
      const a = await get(asset);
      sortie.push(resultat('cache-assets', /immutable/.test(a.headers.get('cache-control') ?? ''), `cache : ${asset} ${/immutable/.test(a.headers.get('cache-control') ?? '') ? 'immuable' : 'sans cache long'}`));
    }
  } catch (e) { sortie.push(resultat('en-tetes', false, e.message)); }

  // 5. Administration fermée (impossible à juger depuis localhost : le contournement de développement y est voulu).
  if (!local) for (const chemin of ['/admin/', '/api/admin/demandes', '/api/admin/moi']) {
    try {
      const r = await get(chemin);
      const lieu = r.headers.get('location') ?? '';
      const redirigeVersAccess = [301, 302, 303, 307, 308].includes(r.status) && /cloudflareaccess\.com/.test(lieu);
      sortie.push(resultat(`ferme ${chemin}`, refus.includes(r.status) || redirigeVersAccess, refus.includes(r.status) || redirigeVersAccess ? `${chemin} : fermé sans connexion (${r.status})` : `${chemin} : OUVERT (statut ${r.status}) — ne pas ouvrir au public`));
    } catch (e) { sortie.push(resultat(`ferme ${chemin}`, false, `${chemin} : ${e.message}`)); }
  }

  // 6. API publique (lecture seule).
  try {
    const au = new Date(Date.parse(`${aujourdhui}T00:00:00Z`) + 14 * 864e5).toISOString().slice(0, 10);
    const r = await get(`/api/disponibilites?du=${aujourdhui}&au=${au}`);
    const corps = await r.json().catch(() => null);
    sortie.push(resultat('api-disponibilites', r.status === 200 && corps?.ok === true, r.status === 200 ? 'API disponibilités : répond (base D1 liée)' : `API disponibilités : statut ${r.status} (liaison D1, migrations ou configuration ?)`));
    const d = await get('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const corpsDevis = await d.json().catch(() => null);
    sortie.push(resultat('api-devis', d.status === 400 && corpsDevis?.ok === false, `API devis : une requête vide est refusée proprement (${d.status})`));
  } catch (e) { sortie.push(resultat('api', false, `API : ${e.message}`)); }

  return sortie;
}
