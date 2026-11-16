// Audit de /admin/ dans un vrai navigateur, contre `wrangler pages dev` (API + D1 locale + contournement
// de développement d'Access, voir docs/api.md). Rejouer `npm run api:demo` avant chaque exécution.
// Préparation : cp .dev.vars.example .dev.vars ; npm run build ; npm run api:migrer ; npm run api:demo ;
// npx wrangler@4.156.1 pages dev --port 8788
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:8788';
const content = parse((await readFile('src/content/admin/fr.md', 'utf8')).split('---')[1]);
const AUTORISES = new Set([new URL(origin).origin]);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir('.audit/screenshots', { recursive: true });
const resultats = {};

try {
  // — En-têtes de la page —
  const ctx0 = await browser.newContext();
  const page0 = await ctx0.newPage();
  const reponse = await page0.goto(origin + '/admin/', { waitUntil: 'load' });
  const h = reponse.headers();
  assert.equal(reponse.status(), 200);
  assert.equal(h['x-robots-tag'], 'noindex, nofollow');
  assert.equal(h['cache-control'], 'no-store');
  assert.match(h['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(h['referrer-policy'], 'no-referrer');
  assert.equal(await page0.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  assert.equal(await page0.title(), content.title);
  assert.equal(await page0.locator('html').getAttribute('lang'), 'fr');
  // Hors localhost, sans jeton Access : aucune donnée, aucune page.
  const refus = await page0.request.get(origin + '/api/admin/demandes', { headers: { Host: 'chambalade.fr' }, failOnStatusCode: false });
  assert([401, 503].includes(refus.status()), `API ouverte hors localhost : ${refus.status()}`);
  assert(!(await refus.text()).includes('CHB-'));
  const refusPage = await page0.request.get(origin + '/admin/', { headers: { Host: 'chambalade.fr' }, failOnStatusCode: false });
  assert([401, 503].includes(refusPage.status()), `page ouverte hors localhost : ${refusPage.status()}`);
  assert(!(await refusPage.text()).includes(content.header.title));
  resultats.protection = { api: refus.status(), page: refusPage.status() };

  // — Une demande hostile arrive par l'API publique : elle doit s'afficher comme du texte —
  const hostile = await page0.request.post(origin + '/api/demandes', {
    data: {
      sejour: { arrivee: '2027-11-08', depart: '2027-11-10', adultes: 1, enfants: 0, chevaux: 0, chambres: ['chambre_privee'], litsDortoir: 0 },
      contact: { nom: '<img src=x onerror="window.__xss=1">', prenom: '<script>window.__xss=2</script>', email: 'hostile@example.invalid', message: '<svg onload="window.__xss=3"></svg>\nSeconde ligne & "guillemets"' },
      langue: 'fr', consentement: true, turnstile_token: 'jeton-de-test',
    },
  });
  assert.equal(hostile.status(), 201, await hostile.text());
  const refHostile = (await hostile.json()).reference;
  const idHostile = (await (await page0.request.get(origin + '/api/admin/demandes')).json()).demandes.find(d => d.reference === refHostile).id;
  await ctx0.close();

  for (const width of [1280, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const externes = []; const erreurs = []; const dialogues = [];
    page.on('request', r => { if (!AUTORISES.has(new URL(r.url()).origin) && !r.url().startsWith('data:')) externes.push(r.url()); });
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    page.on('dialog', async d => { dialogues.push(d.message()); await d.dismiss(); });

    // — Liste —
    await page.goto(origin + '/admin/', { waitUntil: 'load' });
    await page.waitForSelector('.liste-demandes');
    assert.equal(await page.locator('h1:visible').count(), 1);
    assert.match(await page.locator('#admin-moi').textContent(), /dev@example\.invalid/);
    assert.equal(await page.locator('.admin-onglets a[aria-current="page"]').textContent(), content.header.nav.demandes);
    const lignes = await page.locator('.demande-lien .demande-id').allInnerTexts();
    assert(lignes.length >= 7, `liste trop courte : ${lignes.length}`);
    assert(lignes[0].includes('CHB-'), 'la première ligne doit être une demande en attente');
    const premierStatut = await page.locator('.demande-lien .statut').first().textContent();
    assert.equal(premierStatut, content.statuts.en_attente, 'les demandes en attente passent en premier');
    assert.match(await page.locator('.resume-liste').textContent(), /demande\(s\) à traiter/);
    await page.selectOption('#filtre-statut', 'confirmee');
    await page.waitForFunction(() => [...document.querySelectorAll('.demande-lien .statut')].every(s => s.textContent === 'Confirmée'));
    await page.selectOption('#filtre-statut', '');
    await page.waitForFunction(() => document.querySelectorAll('.demande-lien').length >= 7);

    // — Demande hostile : du texte, jamais du code —
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator('.liste-demandes img, .liste-demandes script, .liste-demandes svg').count(), 0, 'HTML injecté dans la liste');
    await page.locator('.demande-lien', { hasText: refHostile }).click();
    await page.waitForSelector('.fiche-bloc');
    assert.equal(await page.locator('main img, main svg, main script:not(#admin-donnees)').count(), 0, 'HTML injecté dans la fiche');
    assert.match(await page.locator('#titre-fiche').textContent(), /<img src=x/);
    assert.match(await page.locator('.message-cliente').textContent(), /<svg onload=/);
    assert.equal(await page.evaluate(() => window.__xss), undefined, 'du code de la cliente a été exécuté');
    assert.deepEqual(dialogues, []);

    // — Fiche et actions —
    // Le premier passage mène une demande jusqu'à l'annulation ; le second en utilise une autre, encore en attente.
    const idAction = width === 1280 ? 2 : idHostile;
    await page.goto(origin + `/admin/#demande-${idAction}`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('.fiche-bloc'));
    for (const titre of [content.fiche.stay, content.fiche.contact, content.fiche.quote, content.fiche.actions, content.fiche.journal]) {
      assert(await page.getByRole('heading', { name: titre, exact: true }).isVisible(), `section absente : ${titre}`);
    }
    assert((await page.locator('.devis-lignes li').count()) >= 3, 'le devis enregistré est détaillé');
    const boutons = await page.locator('.action-boutons button').allInnerTexts();
    assert.deepEqual(boutons, [content.fiche.action.accepter, content.fiche.action.refuser, content.fiche.action.prolonger]);
    if (width === 375) {
      for (const b of await page.locator('.action-boutons button').all()) { const r = await b.boundingBox(); assert(r.height >= 44, `bouton trop bas : ${r.height}`); }
      for (const a of await page.locator('.admin-onglets a').all()) { const r = await a.boundingBox(); assert(r.height >= 44, `onglet trop bas : ${r.height}`); }
    }
    await page.getByRole('button', { name: content.fiche.action.accepter, exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'action-message');
    await page.fill('#action-acompte', 'douze');
    await page.getByRole('button', { name: content.fiche.confirm, exact: true }).click();
    assert.equal(await page.locator('.action-form .erreur').textContent(), content.fiche.depositInvalid);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'action-acompte');

    if (width === 1280) {
      await page.fill('#action-acompte', '76,50'); await page.fill('#action-message', 'Avec plaisir !');
      await page.getByRole('button', { name: content.fiche.confirm, exact: true }).click();
      await page.waitForSelector('.resultat');
      assert.match(await page.locator('.resultat').textContent(), new RegExp(content.fiche.done));
      assert.equal(await page.locator('.fiche-statut .statut').textContent(), content.statuts.acceptee);
      const api = await (await page.request.get(origin + `/api/admin/demandes/${idAction}`)).json();
      assert.equal(api.demande.statut, 'acceptee');
      assert.equal(api.demande.acompte_cents, 7650);
      assert(api.journal.some(j => j.action === 'acceptee' && j.detail === 'Avec plaisir !'));
      assert.deepEqual(await page.locator('.action-boutons button').allInnerTexts(), [content.fiche.action.confirmer, content.fiche.action.annuler, content.fiche.action.prolonger]);
      // Acompte reçu, puis annulation.
      await page.getByRole('button', { name: content.fiche.action.confirmer, exact: true }).click();
      await page.getByRole('button', { name: content.fiche.confirm, exact: true }).click();
      await page.waitForFunction(s => document.querySelector('.fiche-statut .statut')?.textContent === s, content.statuts.confirmee);
      await page.getByRole('button', { name: content.fiche.action.annuler, exact: true }).click();
      await page.getByRole('button', { name: content.fiche.confirm, exact: true }).click();
      await page.waitForFunction(s => document.querySelector('.fiche-statut .statut')?.textContent === s, content.statuts.annulee);
      assert.equal(await page.locator('.action-boutons').count(), 0, 'aucune action sur une demande annulée');
      assert.equal(await page.locator('.journal li').count() >= 5, true);
    }

    // — Lien direct, retour, onglets —
    await page.goto(origin + '/admin/#demande-1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('#titre-fiche')?.textContent.includes('CHB-2027-0001'));
    assert.match(await page.locator('#titre-fiche').textContent(), /CHB-2027-0001/);
    assert.equal(await page.locator('.admin-onglets a[aria-current="page"]').textContent(), content.header.nav.demandes, 'la fiche reste dans l’onglet Demandes');
    await page.getByRole('link', { name: content.common.back, exact: true }).click();
    await page.waitForSelector('.liste-demandes');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'titre-demandes');
    await page.goto(origin + '/admin/#demande-999', { waitUntil: 'load' });
    await page.waitForSelector('#admin-bandeau:not([hidden])');
    assert.equal(await page.locator('#admin-bandeau-texte').textContent(), content.common.errors.notFound);

    // — Calendrier —
    await page.goto(origin + '/admin/#calendrier-2027-05', { waitUntil: 'load' });
    await page.waitForSelector('.cal-admin');
    assert.equal(await page.locator('.cal-admin tbody tr').count(), 5);
    assert.equal(await page.locator('.cal-admin thead th').count(), 32);
    const cellule = page.locator('button.cell').first();
    assert.match((await cellule.getAttribute('aria-label')).replaceAll('\u00a0', ' '), /Dortoir, 10 mai : Confirmée, 3 place\(s\)/);
    assert.equal((await cellule.textContent()).trim(), 'C 3', 'la case porte une lettre, pas seulement une couleur');
    await cellule.click();
    await page.getByRole('link', { name: /Ouvrir la demande CHB-2027-0001/ }).click();
    await page.waitForFunction(() => document.querySelector('#titre-fiche')?.textContent.includes('CHB-2027-0001'));
    assert.match(await page.locator('#titre-fiche').textContent(), /CHB-2027-0001/);
    await page.goto(origin + '/admin/#calendrier-2027-05', { waitUntil: 'load' });
    await page.waitForSelector('.cal-admin');
    await page.getByRole('button', { name: content.calendrier.next, exact: true }).click();
    await page.waitForFunction(() => location.hash === '#calendrier-2027-06');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'défilement horizontal de la page');
    await page.screenshot({ path: `.audit/screenshots/admin-calendrier-${width}.png`, fullPage: true });

    // — Blocages —
    await page.goto(origin + '/admin/#blocages', { waitUntil: 'load' });
    await page.waitForSelector('.liste-blocages');
    await page.getByRole('button', { name: content.blocages.create, exact: true }).click();
    assert.equal(await page.locator('.action-form .erreur').textContent(), content.blocages.errors.required);
    await page.selectOption('#bl-unite', 'dortoir'); await page.fill('#bl-debut', '2027-05-10'); await page.fill('#bl-fin', '2027-05-10'); await page.selectOption('#bl-motif', 'travaux');
    await page.getByRole('button', { name: content.blocages.create, exact: true }).click();
    assert.equal(await page.locator('.action-form .erreur').textContent(), content.blocages.errors.dates);
    await page.fill('#bl-fin', '2027-05-12'); await page.fill('#bl-note', `Audit ${width}`);
    await page.getByRole('button', { name: content.blocages.create, exact: true }).click();
    await page.waitForSelector('.conflits');
    assert.match(await page.locator('.conflits').innerText(), /CHB-2027-0001/);
    const item = page.locator('.bloc-item', { hasText: `Audit ${width}` });
    await item.getByRole('button', { name: content.blocages.delete, exact: true }).click();
    await page.locator('.confirmation-suppression').getByRole('button', { name: content.fiche.confirm, exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.resultat')?.textContent.includes('supprimé'));
    assert.equal(await page.locator('.bloc-item', { hasText: `Audit ${width}` }).count(), 0);
    await page.screenshot({ path: `.audit/screenshots/admin-blocages-${width}.png`, fullPage: true });

    // — Clavier : l'onglet suivant est atteignable, le focus est visible —
    await page.goto(origin + '/admin/', { waitUntil: 'load' });
    await page.waitForSelector('.liste-demandes');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({ texte: document.activeElement.textContent.trim(), contour: getComputedStyle(document.activeElement).outlineStyle }));
    assert.equal(focus.texte, content.header.nav.demandes);
    assert.notEqual(focus.contour, 'none');
    await page.screenshot({ path: `.audit/screenshots/admin-liste-${width}.png`, fullPage: true });

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'défilement horizontal');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.deepEqual(externes, [], 'requêtes vers un domaine externe');
    assert.deepEqual(erreurs.filter(e => !/404|Failed to load resource/.test(e)), [], 'erreurs dans la console');
    assert.deepEqual(dialogues, []);
    resultats[`largeur${width}`] = { demandes: lignes.length, externes, erreurs };
    await page.close();
  }

  // Sans JavaScript : un message l'explique.
  const nojs = await browser.newPage({ javaScriptEnabled: false });
  await nojs.goto(origin + '/admin/', { waitUntil: 'load' });
  assert(await nojs.getByText(content.common.noscript, { exact: true }).isVisible());
  await nojs.close();

  await writeFile('.audit/admin.json', JSON.stringify(resultats, null, 2) + '\n');
  console.log('Administration : en-têtes, protection hors localhost, injection (texte seulement), liste, fiche, actions (acceptation avec acompte, confirmation, annulation), calendrier, blocages, clavier, 375 et 1280 px, réseau et console vérifiés.');
} finally { await browser.close(); }
