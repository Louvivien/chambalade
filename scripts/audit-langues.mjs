// Audit de la version anglaise et du lien entre les deux langues, sur le site construit (dist/, servi sur AUDIT_URL).
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4321';
const site = 'https://chambalade.fr';
const routes = {
  fr: { home: '/', gite: '/gite/', lieu: '/le-lieu/', reserver: '/reserver/', mentions: '/mentions-legales/', confidentialite: '/confidentialite/', conditions: '/conditions-de-reservation/' },
  en: { home: '/en/', gite: '/en/guesthouse/', lieu: '/en/the-place/', reserver: '/en/book/', mentions: '/en/legal/', confidentialite: '/en/privacy/', conditions: '/en/booking-terms/' },
};
// Mots courants du français qui n’ont rien à faire dans une page anglaise (hors adresse et noms propres).
const FRANCAIS = /\b(les|des|pour|avec|votre|vos|une|sont|dans|notre|nous|vous|est)\b/i;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir('.audit/screenshots', { recursive: true });
try {
  for (const [cle, adresseFr] of Object.entries(routes.fr)) {
    const adresseEn = routes.en[cle];
    for (const [langue, adresse, autre] of [['fr', adresseFr, adresseEn], ['en', adresseEn, adresseFr]]) {
      for (const width of [375, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', javaScriptEnabled: false });
        const externes = [], enEchec = [];
        page.on('request', r => { if (!r.url().startsWith(origin)) externes.push(r.url()); });
        page.on('response', r => { if (r.status() >= 400) enEchec.push(r.url()); });
        page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') enEchec.push(r.url()); });
        assert.equal((await page.goto(origin + adresse, { waitUntil: 'networkidle' })).status(), 200, adresse);
        assert.equal(await page.locator('html').getAttribute('lang'), langue, `lang de ${adresse}`);
        assert.equal(await page.locator('h1').count(), 1, `un seul h1 sur ${adresse}`);

        // hreflang : soi-même, l’autre langue, x-default (français), adresses absolues et réciproques.
        const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(l => Object.fromEntries(l.map(x => [x.getAttribute('hreflang'), x.getAttribute('href')])));
        assert.deepEqual(alternates, { fr: site + adresseFr, en: site + adresseEn, 'x-default': site + adresseFr }, `hreflang de ${adresse}`);

        // Sélecteur de langue : la langue courante n’est pas un lien, l’autre mène à la même page.
        const selecteur = page.locator('nav.languages');
        assert.equal(await selecteur.locator('[aria-current="true"]').getAttribute('lang'), langue);
        assert.equal(await selecteur.locator(`a[hreflang="${langue === 'fr' ? 'en' : 'fr'}"]`).getAttribute('href'), autre, `sélecteur de ${adresse}`);

        // Navigation, contenu et pied de page (sauf le sélecteur de langue) : tous les liens internes restent dans la langue de la page.
        const hrefs = await page.locator('header nav:not(.languages) a[href^="/"], header a.brand-name[href^="/"], main a[href^="/"], footer a[href^="/"]').evaluateAll(a => a.map(x => x.getAttribute('href')));
        for (const href of hrefs) {
          const chemin = href.split('#')[0];
          if (chemin === '/favicon.svg') continue;
          if (langue === 'en' && !/^\/en\//.test(chemin)) assert.fail(`lien français sur une page anglaise : ${href} (${adresse})`);
          if (langue === 'fr' && /^\/en\//.test(chemin)) assert.fail(`lien vers l’anglais hors sélecteur : ${href} (${adresse})`);
          assert.equal((await page.request.get(origin + chemin)).status(), 200, `${href} depuis ${adresse}`);
        }
        const courante = await page.locator('.main-navigation a[aria-current="page"]').count();
        assert(courante <= 1);

        if (langue === 'en') {
          const texte = (await page.locator('body').innerText()).replace(/TODO\(amaelle\)[^\n]*/g, '');
          // Le pied de page garde l’adresse postale française ; on l’écarte avant de chercher du français.
          const sansAdresse = texte.replace(/2333 route de la Croix de Toutes Aures/g, '').replace(/Chez Amaëlle/g, '');
          const trouve = sansAdresse.match(FRANCAIS);
          assert(!trouve, `mot français « ${trouve?.[0]} » sur ${adresse}`);
          // alt="" est voulu sur la photo décorative du bandeau d’accueil, décrite par un élément role="img" (étape 4).
          const alts = [...await page.locator('img').evaluateAll(i => i.map(x => x.getAttribute('alt'))), ...await page.locator('[role="img"]').evaluateAll(i => i.map(x => x.getAttribute('aria-label')))];
          assert(alts.every(a => a !== null), `image sans attribut alt sur ${adresse}`);
          assert(!alts.some(a => FRANCAIS.test(a)), `alt en français sur ${adresse}`);
          const titre = await page.title();
          assert(!FRANCAIS.test(titre), `titre en français : ${titre}`);
          assert(!FRANCAIS.test(await page.locator('meta[name="description"]').getAttribute('content')), 'description en français');
        }

        const m = await page.evaluate(() => ({ debordement: document.documentElement.scrollWidth > innerWidth, animations: document.getAnimations().length }));
        assert.equal(m.debordement, false, `défilement horizontal sur ${adresse} à ${width}px`);
        assert.equal(m.animations, 0);
        assert.deepEqual(externes, [], `requêtes externes sur ${adresse}`);
        assert.deepEqual(enEchec, [], `requêtes en échec sur ${adresse}`);
        if (langue === 'en' && width === 375) await page.screenshot({ path: `.audit/screenshots/en-${cle}-375.png`, fullPage: true });
        results.push({ page: adresse, langue, width, liens: hrefs.length, ...m });
        await page.close();
      }
    }
  }
  await writeFile('.audit/langues.json', JSON.stringify(results, null, 2) + '\n');
  console.log(`Langues : ${Object.keys(routes.fr).length} pages × 2 langues × 2 largeurs — hreflang réciproques, sélecteur, liens dans la langue, absence de français sur l’anglais, réseau et débordement vérifiés.`);
} finally { await browser.close(); }
