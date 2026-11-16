import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4321';
const content = parse((await readFile('src/content/gite/fr.md', 'utf8')).split('---')[1]);
const reservation = parse(await readFile('src/data/reservation.yaml', 'utf8'));
const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    assert.equal((await page.goto(origin + '/gite/', { waitUntil: 'networkidle' })).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), content.title);
    assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').textContent(), content.hero.title);
    assert.equal(await page.locator('script').count(), 0);
    assert.equal(await page.locator('.main-navigation a[aria-current="page"]').getAttribute('href'), '/gite/');
    const hero = page.getByRole('img', { name: content.hero.photo.alt, exact: true });
    assert.equal(await hero.getAttribute('loading'), 'eager');
    assert.equal(await hero.getAttribute('fetchpriority'), 'high');
    assert.equal(await page.getByRole('img', { name: content.practical.photo.alt, exact: true }).getAttribute('loading'), 'lazy');
    const tariffRows = page.locator('[data-price-id]');
    assert.equal(await tariffRows.count(), Object.keys(reservation.prices).length);
    for (const [id, price] of Object.entries(reservation.prices)) {
      const row = page.locator(`[data-price-id="${id}"]`);
      const expected = price.amount_cents === null ? content.rates.unknown : price.unit === 'included' ? content.rates.included : money.format(price.amount_cents / 100);
      assert.equal(await row.locator('.amount').textContent(), expected);
      assert.equal(await row.locator('dt').textContent(), content.rates.items[id].label);
      if (!price.validated) {
        assert.equal(await row.locator('.pending').textContent(), content.rates.items[id].pending);
        assert(await row.locator('.pending').isVisible());
      } else assert.equal(await row.locator('.pending').count(), 0);
      if (price.unit) assert.equal(await row.locator('.unit').textContent(), content.rates.units[price.unit]);
      else assert.equal(await row.locator('.unit').count(), 0);
    }
    for (const item of content.practical.items) assert(await page.getByText(item.pending, { exact: true }).isVisible());
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      animations: document.getAnimations().length,
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
      photoSource: document.querySelector('.hero-photo img').currentSrc.split('/').at(-1),
    }));
    assert.equal(metrics.overflow, false);
    assert.equal(metrics.animations, 0);
    assert(metrics.bodyFont.includes('Nunito Sans'));
    assert(metrics.headingFont.includes('Lora'));
    assert(metrics.fonts.some(font => font.includes('Lora')));
    assert(metrics.fonts.some(font => font.includes('Nunito Sans')));
    assert(metrics.photoSource.startsWith('piscine.'));
    assert(metrics.photoSource.endsWith('.avif'));
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'contenu');
    await page.goto(origin + '/gite/', { waitUntil: 'networkidle' });
    const links = await page.locator('a[href]').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), label: link.textContent.trim() })));
    for (const link of links) {
      await page.keyboard.press('Tab');
      const focus = await page.locator(':focus').evaluate(el => ({ href: el.getAttribute('href'), label: el.textContent.trim(), outline: getComputedStyle(el).outlineStyle, visible: el.getBoundingClientRect().width > 0 }));
      assert.equal(focus.href, link.href);
      assert.equal(focus.label, link.label);
      assert(focus.visible);
      assert.notEqual(focus.outline, 'none');
    }
    await page.getByRole('link', { name: content.hero.ratesLink, exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#tarifs');
    await page.getByRole('link', { name: content.hero.requestLink, exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#demande');
    await page.getByRole('link', { name: content.stay.link, exact: true }).click();
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(new URL(page.url()).hash, '#sejour');
    await page.goto(origin + '/gite/', { waitUntil: 'networkidle' });
    // Charger la photo différée avant la capture intégrale.
    await page.locator('.practical').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `.audit/screenshots/gite-${width}.png`, fullPage: true });
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(failedRequests, []);
    results.push({ width, keyboardLinks: links.length, pricesFromYaml: Object.keys(reservation.prices).length, pendingPrices: Object.values(reservation.prices).filter(price => !price.validated).length, noClientJavaScript: true, ...metrics, externalRequests, failedRequests });
    await page.close();
  }
  await writeFile('.audit/gite.json', JSON.stringify(results, null, 2) + '\n');
  console.log('Gîte FR : 375, 768 et 1280 px, prix YAML, validations visibles, ancres, clavier, photos, polices et réseau vérifiés.');
} finally { await browser.close(); }
