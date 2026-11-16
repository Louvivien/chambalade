import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.resolve(process.argv[2] || 'dist');
const origin = 'https://audit.invalid';
const htmlFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);
let checked = 0;
const failures = [];
for (const file of htmlFiles) {
  const document = load(await readFile(file, 'utf8'));
  const pageUrl = new URL('/' + path.relative(root, file).split(path.sep).join('/').replace(/index\.html$/, ''), origin);
  const references = [];
  document('[href], [src], [srcset]').each((_, element) => {
    for (const attribute of ['href', 'src']) {
      const value = document(element).attr(attribute);
      if (value) references.push(value);
    }
    const srcset = document(element).attr('srcset');
    if (srcset) references.push(...srcset.split(',').map(item => item.trim().split(/\s+/)[0]));
  });
  for (const reference of references) {
    const url = new URL(reference, pageUrl);
    if (url.origin !== origin) continue;
    checked++;
    let target = path.resolve(root, decodeURIComponent(url.pathname).replace(/^\//, ''));
    if (!target.startsWith(root + path.sep) && target !== root) {
      failures.push(`${file} : chemin hors build ${reference}`);
      continue;
    }
    let info = await stat(target).catch(() => null);
    if (info?.isDirectory()) {
      target = path.join(target, 'index.html');
      info = await stat(target).catch(() => null);
    }
    if (!info?.isFile()) { failures.push(`${file} : ${reference}`); continue; }
    if (url.hash && target.endsWith('.html')) {
      const targetDocument = load(await readFile(target, 'utf8'));
      const id = decodeURIComponent(url.hash.slice(1));
      if (!targetDocument('[id], a[name]').toArray().some(element =>
        targetDocument(element).attr('id') === id || targetDocument(element).attr('name') === id)) {
        failures.push(`${file} : ancre absente ${reference}`);
      }
    }
  }
}
console.log(`${htmlFiles.length} page(s), ${checked} référence(s) interne(s), ${failures.length} lien(s) cassé(s).`);
if (!htmlFiles.length) console.log('Non applicable : aucune page de contenu construite.');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
