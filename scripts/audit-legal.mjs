import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:4321';
const pages = [
  { path: '/mentions-legales/', file: 'mentions', key: 'mentions' },
  { path: '/confidentialite/', file: 'confidentialite', key: 'confidentialite' },
  { path: '/conditions-de-reservation/', file: 'conditions', key: 'conditions' },
];
const legal = parse(await readFile('src/data/legal.yaml', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir('.audit/screenshots', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    for (const p of pages) {
      const content = parse((await readFile(`src/content/legal/fr/${p.file}.md`, 'utf8')).split('---')[1]);
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', javaScriptEnabled: false });
      const external = [], failed = [];
      page.on('request', r => { if (!r.url().startsWith(origin)) external.push(r.url()); });
      page.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
      assert.equal((await page.goto(origin + p.path, { waitUntil: 'networkidle' })).status(), 200);
      assert.equal(await page.title(), content.title);
      assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').textContent(), content.hero.title);
      assert.equal(await page.locator('script').count(), 0);
      // Brouillon : bandeau visible et page non indexée tant que legal.yaml dit valide: false.
      if (!legal.valide) {
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
        assert(await page.getByText(content.draft.text, { exact: true }).isVisible());
      }
      // Chaque section du contenu est présente, avec son titre, dans l'ordre.
      const titres = await page.locator('article h2').allTextContents();
      const attendus = [content.draft.title, ...(content.identity ? [content.identity.title] : []), ...content.sections.map(s => s.title)];
      assert.deepEqual(titres, attendus);
      // Aucun jeton {…} ni syntaxe de lien non rendue ; les points à confirmer restent visibles.
      const texte = await page.locator('article').innerText();
      assert(!/\{[a-z]+\}/.test(texte) && !/\]\(/.test(texte), 'jeton ou lien non rendu');
      assert(/TODO\(amaelle\)/.test(texte), 'les points à confirmer doivent rester visibles');
      // Le pied de page lie les trois pages légales, la page courante est joignable au clavier.
      const footerLinks = await page.locator('footer a').evaluateAll(a => a.map(x => x.getAttribute('href')));
      for (const q of pages) assert(footerLinks.includes(q.path), `pied de page : lien vers ${q.path} absent`);
      // Liens internes du contenu : tous résolus (200).
      const hrefs = await page.locator('article a[href^="/"]').evaluateAll(a => a.map(x => x.getAttribute('href')));
      for (const href of hrefs) assert.equal((await page.request.get(origin + href)).status(), 200, href);
      // Mise en page.
      const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, animations: document.getAnimations().length, bodyFont: getComputedStyle(document.body).fontFamily }));
      assert.equal(metrics.overflow, false);
      assert.equal(metrics.animations, 0);
      assert(metrics.bodyFont.includes('Nunito Sans'));
      // Clavier : lien d'évitement, puis chaque lien de la page, avec focus visible.
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
      await page.goto(origin + p.path, { waitUntil: 'networkidle' });
      const links = await page.locator('a[href]').count();
      for (let i = 0; i < links; i++) {
        await page.keyboard.press('Tab');
        const f = await page.locator(':focus').evaluate(el => ({ tag: el.tagName, outline: getComputedStyle(el).outlineStyle, w: el.getBoundingClientRect().width }));
        assert.equal(f.tag, 'A'); assert(f.w > 0); assert(f.outline !== 'none');
      }
      await page.screenshot({ path: `.audit/screenshots/${p.file}-${width}.png`, fullPage: true });
      assert.deepEqual(external, []);
      assert.deepEqual(failed, []);
      results.push({ width, path: p.path, sections: titres.length, keyboardLinks: links, ...metrics });
      await page.close();
    }
  }
  // Le formulaire de réservation renvoie vers les pages légales.
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  await page.goto(origin + '/reserver/', { waitUntil: 'load' });
  const aide = page.locator('#consentement-aide');
  assert.equal(await aide.locator('a[href="/confidentialite/"]').count(), 1);
  assert.equal(await aide.locator('a[href="/conditions-de-reservation/"]').count(), 1);
  assert(!/TODO/.test(await aide.innerText()));
  await page.close();
  await writeFile('.audit/legal.json', JSON.stringify(results, null, 2) + '\n');
  console.log('Pages légales FR : 3 pages × 3 largeurs, sections, brouillon/noindex, liens, clavier, réseau et lien du formulaire vérifiés.');
} finally { await browser.close(); }
