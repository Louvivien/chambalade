import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4321';
const markdown = await readFile('src/content/accueil/fr.md', 'utf8');
const content = parse(markdown.split('---')[1]);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir('.audit/screenshots', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    // Sans JS : la page et les descriptions adaptées doivent rester utilisables.
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', javaScriptEnabled: false });
    const externalRequests = [];
    const failedRequests = [];
    const photos = [];
    page.on('request', request => {
      if (!request.url().startsWith(origin)) externalRequests.push(request.url());
      if (/pres-de-la-trappe|foret-chambaran/.test(request.url())) photos.push(request.url());
    });
    page.on('response', response => { if (response.status() >= 400) failedRequests.push(response.url()); });
    // Une requête abandonnée par une navigation (ERR_ABORTED) n'est pas une panne ; les vraies pannes et les codes >= 400 restent comptés.
    page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') failedRequests.push(request.url()); });
    assert.equal((await page.goto(origin, { waitUntil: 'networkidle' })).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').textContent(), content.hero.title);
    assert.equal(await page.locator('script').count(), 0);
    const desktop = width >= 768;
    const heroName = desktop ? 'pres-de-la-trappe' : 'foret-chambaran';
    const alt = desktop ? content.hero.desktop.alt : content.hero.mobile.alt;
    assert.equal(photos.length, 1, 'Une seule requête pour le bandeau');
    assert(photos[0].includes(heroName));
    assert(photos[0].endsWith('.avif'));
    assert.equal(await page.getByRole('img', { name: alt, exact: true }).count(), 1);
    assert.equal(await page.getByRole('img', { name: desktop ? content.hero.mobile.alt : content.hero.desktop.alt, exact: true }).count(), 0);
    const hero = page.locator('.bandeau-photo img');
    assert.equal(await hero.getAttribute('loading'), 'eager');
    assert.equal(await hero.getAttribute('fetchpriority'), 'high');
    for (const photo of [content.introduction.photo, content.reasons.photo]) {
      assert.equal(await page.getByRole('img', { name: photo.alt, exact: true }).getAttribute('loading'), 'lazy');
    }
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      animations: document.getAnimations().length,
      fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
    }));
    assert.equal(metrics.overflow, false);
    assert(metrics.bodyFont.includes('Nunito Sans'));
    assert(metrics.headingFont.includes('Lora'));
    assert(metrics.fonts.some(font => font.includes('Lora')));
    assert(metrics.fonts.some(font => font.includes('Nunito Sans')));
    assert.equal(metrics.animations, 0);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'contenu');
    await page.goto(origin, { waitUntil: 'networkidle' });
    const expected = await page.locator('a[href]').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), label: link.textContent.trim() })));
    for (const link of expected) {
      await page.keyboard.press('Tab');
      const focus = await page.locator(':focus').evaluate(el => ({
        href: el.getAttribute('href'), label: el.textContent.trim(),
        outline: getComputedStyle(el).outlineStyle,
        visible: el.getBoundingClientRect().width > 0,
      }));
      assert.equal(focus.href, link.href);
      assert.equal(focus.label, link.label);
      assert.equal(focus.visible, true);
      assert.notEqual(focus.outline, 'none');
    }
    await page.getByRole('link', { name: content.hero.discover, exact: true }).click();
    assert.equal(new URL(page.url()).pathname, '/gite/');
    assert.equal((await page.locator('h1').textContent()).length > 0, true);
    await page.goto(origin, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('link', { name: content.hero.request, exact: true }).evaluateAll(l => [...new Set(l.map(a => a.getAttribute('href')))].join()), '/reserver/');
    await page.locator('.hero').getByRole('link', { name: content.hero.request, exact: true }).click();
    assert.equal(new URL(page.url()).pathname, '/reserver/');
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: content.activities.interestLink, exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#sejour');
    assert(await page.locator('#sejour').isVisible());
    await page.locator('#sejour').getByRole('link', { name: content.stay.requestLink, exact: true }).click();
    assert.equal(new URL(page.url()).pathname, '/reserver/');
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `.audit/screenshots/accueil-${width}.png`, fullPage: true });
    // La description doit suivre le changement de photo sans script client.
    await page.setViewportSize({ width: desktop ? 375 : 1280, height: 900 });
    assert.equal(await page.getByRole('img', { name: desktop ? content.hero.mobile.alt : content.hero.desktop.alt, exact: true }).count(), 1);
    assert.equal(await page.getByRole('img', { name: alt, exact: true }).count(), 0);
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(failedRequests, []);
    results.push({ width, hero: heroName, initialHeroRequests: 1, keyboardLinks: expected.length, noClientJavaScript: true, ...metrics, externalRequests, failedRequests });
    await page.close();
  }
  await writeFile('.audit/accueil.json', JSON.stringify(results, null, 2) + '\n');
  console.log('Accueil FR : 375, 768 et 1280 px, photos adaptées, descriptions accessibles, clavier, polices locales, réseau et absence de JS vérifiés.');
} finally { await browser.close(); }
