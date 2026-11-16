import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4321';
const content = parse((await readFile('src/content/lieu/fr.md', 'utf8')).split('---')[1]);
const { markers } = parse(await readFile('src/data/lieu.yaml', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir('.audit/screenshots', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', javaScriptEnabled: false });
    const externalRequests = [];
    const failedRequests = [];
    page.on('request', request => { if (!request.url().startsWith(origin)) externalRequests.push(request.url()); });
    page.on('response', response => { if (response.status() >= 400) failedRequests.push(response.url()); });
    page.on('requestfailed', request => failedRequests.push(request.url()));
    assert.equal((await page.goto(origin + '/le-lieu/', { waitUntil: 'networkidle' })).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), content.title);
    assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').textContent(), content.hero.title);
    assert.equal(await page.locator('script').count(), 0);
    assert.equal(await page.locator('.main-navigation a[aria-current="page"]').getAttribute('href'), '/le-lieu/');

    // Vue aérienne : image prioritaire, trois repères placés d'après le YAML, nom accessible complet.
    const aerial = page.getByRole('img', { name: content.aerial.photo.alt, exact: true });
    assert.equal(await aerial.getAttribute('loading'), 'eager');
    assert.equal(await aerial.getAttribute('fetchpriority'), 'high');
    const nav = page.getByRole('navigation', { name: content.aerial.navigationLabel, exact: true });
    for (const id of ['gite', 'carriere', 'pres']) {
      const marker = nav.locator(`[data-marker="${id}"]`);
      assert.equal(await marker.getAttribute('aria-label'), content.aerial.markers[id].accessibleLabel);
      const style = await marker.getAttribute('style');
      assert(style.includes(`left:${markers[id].x}%`) && style.includes(`top:${markers[id].y}%`));
      const box = await marker.boundingBox();
      assert(box.width >= 44 && box.height >= 44, `cible tactile trop petite : ${id}`);
    }
    const legend = page.getByRole('list', { name: content.aerial.legendLabel, exact: true });
    assert.equal(await legend.locator('li').count(), 3);
    for (const id of ['carriere', 'ptv', 'paddocks']) assert.equal(await page.locator(`#${id}`).count(), 1);

    // Les informations manquantes restent visibles.
    for (const text of [content.facilities.pending, content.horses.pending, content.access.vehicleText, content.access.distanceText])
      assert(await page.getByText(text, { exact: true }).isVisible());

    // Images : une seule prioritaire, les autres différées.
    const loading = await page.evaluate(() => [...document.images].map(img => ({ alt: img.alt, loading: img.loading })));
    assert.equal(loading.filter(img => img.loading === 'eager').length, 1);
    assert(loading.every(img => img.alt.length > 0));

    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      animations: document.getAnimations().length,
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      images: document.images.length,
    }));
    assert.equal(metrics.overflow, false);
    assert.equal(metrics.animations, 0);
    assert(metrics.bodyFont.includes('Nunito Sans'));
    assert(metrics.headingFont.includes('Lora'));

    // Clavier : lien d'évitement, puis chaque lien dans l'ordre du document, focus visible.
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'contenu');
    await page.goto(origin + '/le-lieu/', { waitUntil: 'networkidle' });
    const links = await page.locator('a[href]').evaluateAll(items => items.map(link => ({ href: link.getAttribute('href'), name: link.getAttribute('aria-label') || link.textContent.trim() })));
    for (const link of links) {
      await page.keyboard.press('Tab');
      const focus = await page.locator(':focus').evaluate(el => ({ href: el.getAttribute('href'), name: el.getAttribute('aria-label') || el.textContent.trim(), outline: getComputedStyle(el.matches('[data-marker]') ? el.querySelector('.symbol') : el).outlineStyle, shadow: getComputedStyle(el.matches('[data-marker]') ? el.querySelector('.symbol') : el).boxShadow, width: el.getBoundingClientRect().width }));
      assert.equal(focus.href, link.href);
      assert.equal(focus.name, link.name);
      assert(focus.width > 0);
      assert(focus.outline !== 'none' || focus.shadow !== 'none');
    }

    // Ancres internes.
    await page.goto(origin + '/le-lieu/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: content.hero.accessLink, exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#acces');
    await page.locator('[data-marker="carriere"]').first().click();
    assert.equal(new URL(page.url()).hash, '#carriere');
    await page.locator('[data-marker="pres"]').first().click();
    assert.equal(new URL(page.url()).hash, '#paddocks');
    await page.locator('[data-marker="gite"]').first().click();
    assert.equal(new URL(page.url()).pathname, '/gite/');
    await page.goto(origin + '/le-lieu/', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: content.stay.lodgeLink, exact: true }).click();
    assert.equal(new URL(page.url()).pathname, '/gite/');

    // Navigation depuis les deux autres pages.
    for (const from of ['/', '/gite/']) {
      // HTML brut : naviguer ici annulerait des images en cours de chargement et fausserait le contrôle réseau.
      const html = await (await page.request.get(origin + from)).text();
      assert.equal((html.match(/href="\/le-lieu\/"/g) || []).length >= 1, true, `lien vers /le-lieu/ absent de ${from}`);
    }

    // Capture intégrale après chargement des images différées.
    await page.goto(origin + '/le-lieu/', { waitUntil: 'networkidle' });
    // Le JavaScript de la page est désactivé : on fait défiler avec Playwright, pas avec des minuteurs.
    for (const image of await page.locator('img[loading="lazy"]').all()) await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `.audit/screenshots/lieu-${width}.png`, fullPage: true });
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(failedRequests, []);
    results.push({ width, keyboardLinks: links.length, noClientJavaScript: true, ...metrics, externalRequests, failedRequests });
    await page.close();
  }
  await writeFile('.audit/lieu.json', JSON.stringify(results, null, 2) + '\n');
  console.log('Le lieu FR : 375, 768 et 1280 px, repères, ancres, clavier, images, polices et réseau vérifiés.');
} finally { await browser.close(); }
