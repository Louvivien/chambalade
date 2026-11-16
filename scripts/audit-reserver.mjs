// Audit de la page /reserver/ dans un vrai navigateur, contre `wrangler pages dev` (API + D1 locale).
// Préparation : cp .env.example .env ; cp .dev.vars.example .dev.vars ; npm run build ;
// npm run api:migrer ; npm run api:demo ; npx wrangler@4.156.1 pages dev --port 8788
// (voir docs/api.md). Chaque exécution crée 3 demandes : rejouer `npm run api:demo` avant de relancer.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:8788';
// AUDIT_LANG=en : même parcours sur /en/book/ avec les textes anglais.
const lang = process.env.AUDIT_LANG === 'en' ? 'en' : 'fr';
const chemin = lang === 'en' ? '/en/book/' : '/reserver/';
const content = parse((await readFile(`src/content/reserver/${lang}.md`, 'utf8')).split('---')[1]);
const heures = parse(await readFile('src/data/reservation.yaml', 'utf8')).holds.pending_hours;
const AUTORISES = new Set([new URL(origin).origin, 'https://challenges.cloudflare.com']);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir('.audit/screenshots', { recursive: true });

// Un scénario par largeur, sur des nuits différentes pour ne pas se gêner.
const scenarios = {
  375: { arrivee: '2027-10-11', depart: '2027-10-13', chambres: ['chambre_privee'], lits: 0, diner: false },
  768: { arrivee: '2027-10-18', depart: '2027-10-20', chambres: ['chambre_2', 'chambre_3'], lits: 0, diner: true },
  1280: { arrivee: '2027-10-25', depart: '2027-10-27', chambres: [], lits: 2, diner: true },
};
const euroEnCentimes = texte => Math.round(Number(texte.replace(/[^\d,]/g, '').replace(',', '.')) * 100);
const resultats = [];

try {
  for (const [largeur, sc] of Object.entries(scenarios)) {
    const width = Number(largeur);
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const externes = [];
    const erreurs = [];
    page.on('request', r => { const o = new URL(r.url()).origin; if (!AUTORISES.has(o) && !r.url().startsWith('data:')) externes.push(r.url()); });
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    const reponses5xx = [];
    page.on('response', r => { if (r.status() >= 500) reponses5xx.push(`${r.status()} ${r.url()}`); });

    assert.equal((await page.goto(origin + chemin, { waitUntil: 'load' })).status(), 200);
    await page.locator('#formulaire').waitFor({ state: 'visible' });
    assert.equal(await page.title(), content.title);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').textContent(), content.hero.title);
    assert.equal(await page.locator('.main-navigation a[aria-current="page"]').getAttribute('href'), chemin);
    assert.equal(await page.locator('#confirmation').isHidden(), true);

    // Aucune donnée tarifaire n'est confiée au navigateur : seuls textes et règles de séjour.
    const ile = await page.locator('#reserver-donnees').textContent();
    assert(!/amount_cents|"prices"|prix_unitaire|total_cents/.test(ile), 'la page contient des prix');
    assert(ile.includes(`${heures} h`) || ile.includes(`${heures} h`), 'le délai de réponse vient de la configuration');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'défilement horizontal');

    // Se placer sur le bon mois (le premier mois affiché dépend de la date du jour).
    const moisCible = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${sc.arrivee}T00:00:00Z`)).toLowerCase();
    for (let i = 0; i < 24 && (await page.locator('#cal-titre').textContent()).toLowerCase() !== moisCible; i++) {
      await page.getByRole('button', { name: content.dates.nextMonth, exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#calendrier').dataset.etat !== 'chargement');
    }
    assert.equal((await page.locator('#cal-titre').textContent()).toLowerCase(), moisCible);
    await page.waitForFunction(() => document.querySelector('#calendrier').dataset.etat === 'pret');

    // Calendrier : un seul jour dans l'ordre de tabulation, cibles tactiles, annonces, clavier.
    assert.equal(await page.locator('#calendrier button.cal-jour[tabindex="0"]').count(), 1);
    assert.equal(await page.locator('#calendrier [role="grid"]').count(), 1);
    const boite = await page.locator(`[data-date="${sc.arrivee}"]`).boundingBox();
    assert(boite.width >= 40 && boite.height >= 40, `jour trop petit à ${width} px : ${boite.width}×${boite.height}`);
    const etiquette = await page.locator(`[data-date="${sc.arrivee}"]`).getAttribute('aria-label');
    assert(/^\w+ \d{1,2}(er)? \w+ 2027, /.test(etiquette), `étiquette inattendue : ${etiquette}`);
    await page.locator(`[data-date="${sc.arrivee}"]`).focus();
    await page.keyboard.press('ArrowRight');
    // Après une touche du clavier, le jour actif doit avoir un contour visible (:focus-visible).
    const contour = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert.notEqual(contour, 'none', 'focus invisible sur un jour');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.date), sc.arrivee.replace(/\d+$/, d => String(Number(d) + 1)));
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#date-arrivee').textContent() !== content.dates.none, true, 'arrivée non choisie au clavier');
    assert.match(await page.locator('.calendrier-statut').textContent(), new RegExp(content.dates.selectedArrival.split('{date}')[0].trim()));
    await page.locator(`[data-date="${sc.depart}"]`).click();
    assert.equal(await page.locator('#nombre-nuits').textContent(), content.dates.nightsMany.replace('{n}', '2'));

    // Hébergement.
    for (const c of sc.chambres) await page.locator(`input[name="chambres"][value="${c}"]`).check();
    if (sc.lits) { await page.locator('#lits').fill(String(sc.lits)); await page.locator('#lits').dispatchEvent('change'); }
    await page.locator('#adultes').fill(String(Math.max(2, sc.chambres.length || sc.lits)));
    await page.locator('#adultes').dispatchEvent('change');
    if (sc.diner) await page.locator('#repas input[data-repas="diners"]').first().check();

    // Devis en direct : celui du serveur, avec ses mentions.
    await page.waitForSelector('#devis-contenu .devis-total', { timeout: 8000 });
    const devis = await page.locator('#devis-contenu').innerText();
    assert(devis.includes(content.quote.provisional), 'mention « tarifs en cours de validation » absente');
    assert(devis.includes(content.quote.pending), 'ligne « à confirmer » absente');
    assert(await page.locator('.devis .mention').textContent() === content.quote.mention);
    // Rien de chiffré (tout « à confirmer ») : la page l'écrit, elle n'affiche jamais « 0 € » à la place d'un inconnu.
    const texteTotal = await page.locator('#devis-contenu .devis-total span:last-child').innerText();
    const totalAffiche = texteTotal === content.quote.pending ? 0 : euroEnCentimes(texteTotal);
    if (totalAffiche === 0) assert.equal(texteTotal, content.quote.pending);

    // Envoi incomplet : résumé d'erreurs, focus, liens vers les champs.
    await page.locator('#envoyer').click();
    assert.equal(await page.locator('#resume-erreurs').isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'resume-erreurs');
    const liens = await page.locator('#resume-erreurs a').allInnerTexts();
    assert(liens.includes(content.errors.consent) && liens.includes(content.errors.required.replace('{champ}', content.errors.fields.nom)), `résumé inattendu : ${liens}`);
    await page.locator('#resume-erreurs a', { hasText: content.errors.fields.nom }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'nom');
    assert.equal(await page.locator('#nom').getAttribute('aria-invalid'), 'true');

    // Envoi complet.
    await page.locator('#nom').fill('Exemple');
    assert.equal(await page.locator('#nom').getAttribute('aria-invalid'), null, 'l’erreur doit disparaître à la saisie');
    assert.equal(await page.locator('#resume-erreurs a', { hasText: content.errors.fields.nom }).count(), 0, 'le résumé garde une erreur corrigée');
    assert.equal(await page.locator('#resume-erreurs').isVisible(), true);
    await page.locator('#prenom').fill(`Audit${width}`);
    await page.locator('#email').fill(`audit${width}@example.invalid`);
    await page.locator('#consentement').check();
    await page.waitForFunction(() => document.querySelectorAll('#resume-erreurs li').length <= 1); // reste l'anti-robot tant que le jeton n'est pas arrivé
    await page.screenshot({ path: `.audit/screenshots/reserver-${width}.png`, fullPage: true });
    let reference = null;
    for (let essai = 0; essai < 10 && !reference; essai++) {
      await page.locator('#envoyer').click();
      try { await page.locator('#confirmation').waitFor({ state: 'visible', timeout: 2500 }); reference = await page.locator('#confirmation-reference').textContent(); }
      catch { await page.waitForTimeout(1500); } // le jeton anti-robot n'est pas encore là
    }
    assert(reference && /^CHB-\d{4}-\d{4}$/.test(reference), `pas de confirmation (${await page.locator('#erreur-antirobot, #erreur-envoi').allInnerTexts()})`);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'confirmation');
    assert.equal(await page.locator('#formulaire').isHidden(), true);
    assert((await page.locator('#confirmation').innerText()).replaceAll('\u00a0', ' ').includes(`${heures} h`));
    assert((await page.locator('#confirmation-recap').innerText()).includes(content.quote.mention));
    await page.screenshot({ path: `.audit/screenshots/reserver-confirmation-${width}.png`, fullPage: true });

    // Contrôle côté serveur : la demande existe, en attente, avec le devis recalculé par le serveur.
    const liste = await (await page.request.get(origin + '/api/admin/demandes')).json();
    const demande = liste.demandes.find(d => d.reference === reference);
    assert(demande, 'la demande n’est pas dans la base');
    assert.equal(demande.statut, 'en_attente');
    const fiche = await (await page.request.get(origin + `/api/admin/demandes/${demande.id}`)).json();
    assert.equal((fiche.demande ?? fiche).langue, lang, 'la langue de la demande doit être celle de la page');
    assert.equal(demande.date_arrivee, sc.arrivee);
    assert.equal(demande.date_depart, sc.depart);
    assert.equal(demande.total_cents, totalAffiche, 'le total enregistré diffère du total affiché');
    assert(demande.secondes_restantes > heures * 3600 - 120 && demande.secondes_restantes <= heures * 3600);

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'défilement horizontal après envoi');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'animations malgré prefers-reduced-motion');
    assert.deepEqual(externes, [], 'requêtes vers un domaine non prévu');
    assert.deepEqual(erreurs, [], 'erreurs dans la console');
    assert.deepEqual(reponses5xx, []);
    resultats.push({ width, reference, totalCents: totalAffiche, boutonJourPx: [Math.round(boite.width), Math.round(boite.height)], requetesExternes: externes, erreursConsole: erreurs });
    await page.close();
  }

  // Sans JavaScript : le formulaire reste masqué et un message l'explique.
  const nojs = await browser.newPage({ viewport: { width: 375, height: 900 }, javaScriptEnabled: false });
  await nojs.goto(origin + chemin, { waitUntil: 'load' });
  assert.equal(await nojs.locator('#formulaire').isHidden(), true);
  assert(await nojs.getByText(content.noscript.text, { exact: true }).isVisible());
  await nojs.close();

  await writeFile('.audit/reserver.json', JSON.stringify(resultats, null, 2) + '\n');
  console.log('Réserver : 375, 768 et 1280 px — calendrier au clavier, devis en direct, validation, envoi, confirmation, demande retrouvée côté serveur, réseau, console et sans JavaScript vérifiés.');
} finally { await browser.close(); }
