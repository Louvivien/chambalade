import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir('.audit/screenshots', { recursive: true });
try {
  for (const [locale, route] of [['fr', '/audit/fr/'], ['en', '/en/audit/']]) {
    for (const width of [375, 768, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const externalRequests = [];
      const errors = [];
      page.on('request', request => { if (!request.url().startsWith(origin)) externalRequests.push(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        bodyFont: getComputedStyle(document.body).fontFamily,
        headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
        animations: document.getAnimations().length,
        fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
      }));
      assert.equal(metrics.overflow, false, `${locale} ${width}px : débordement`);
      assert(metrics.bodyFont.includes('Nunito Sans'));
      assert(metrics.headingFont.includes('Lora'));
      assert(metrics.fonts.some(font => font.includes('Nunito Sans')));
      assert(metrics.fonts.some(font => font.includes('Lora')));
      assert.equal(metrics.animations, 0);
      assert.deepEqual(externalRequests, []);
      assert.deepEqual(errors, []);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'contenu');
      // Nouveau parcours depuis le début : tous les liens sont atteignables au clavier.
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      const linkCount = await page.locator('a[href]').count();
      const visited = new Set();
      for (let i = 0; i < linkCount; i++) {
        await page.keyboard.press('Tab');
        const focus = await page.locator(':focus').evaluate(el => ({
          tag: el.tagName, href: el.getAttribute('href'), label: el.textContent.trim(),
          visible: el.getBoundingClientRect().width > 0,
          outline: getComputedStyle(el).outlineStyle,
        }));
        assert.equal(focus.tag, 'A');
        assert.equal(focus.visible, true);
        assert.notEqual(focus.outline, 'none');
        visited.add(`${focus.href}|${focus.label}`);
      }
      assert.equal(visited.size, linkCount);
      await page.getByRole('link', { name: locale === 'fr' ? 'English' : 'Français', exact: true }).click();
      assert.equal(await page.locator('html').getAttribute('lang'), locale === 'fr' ? 'en' : 'fr');
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `.audit/screenshots/${locale}-${width}.png`, fullPage: true });
      results.push({ locale, width, keyboardLinks: linkCount, ...metrics, externalRequests, errors });
      await page.close();
    }
  }
  await writeFile('.audit/front.json', JSON.stringify(results, null, 2) + '\n');
  console.log('6 rendus vérifiés : dimensions, clavier, langues, polices locales, mouvement réduit et réseau.');
} finally { await browser.close(); }
