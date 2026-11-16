// Contrôles avant mise en ligne (voir docs/deploiement.md, étape 6).
//   npm run build && npm run deploiement:verifier            → rapport
//   npm run deploiement:verifier -- --strict                 → code de sortie 1 s’il reste un point bloquant
//   npm run deploiement:verifier -- --strict --ouverture     → échoue aussi s’il reste un point à régler avant l’ouverture au public
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { controlerMigrations, controlerOuverture, controlerSecrets, controlerSite, controlerSuivis, controlerWrangler, resume } from './deploiement/controles.mjs';

const racine = new URL('../', import.meta.url);
const lire = (chemin) => readFile(new URL(chemin, racine), 'utf8').catch(() => null);
const cwd = fileURLToPath(racine);

async function listerDist(dossier = 'dist/', base = 'dist/') {
  const sorties = [];
  for (const entree of await readdir(new URL(dossier, racine), { withFileTypes: true }).catch(() => [])) {
    if (entree.isDirectory()) sorties.push(...await listerDist(`${dossier}${entree.name}/`, base));
    else sorties.push(`${dossier}${entree.name}`.slice(base.length));
  }
  return sorties;
}

const fichiersDist = await listerDist();
const texte = /\.(html|js|css|json|txt|xml|svg)$|^_headers$/;
const contenus = {};
for (const f of fichiersDist.filter(f => texte.test(f))) contenus[f] = await lire(`dist/${f}`);
const migrations = await readdir(new URL('migrations/', racine));
const suivis = execFileSync('git', ['ls-files'], { cwd, encoding: 'utf8' }).split('\n').filter(Boolean);
const legal = parse(await lire('src/data/legal.yaml'));
const site = parse(await lire('src/data/site.yaml'));
const reservation = await lire('src/data/reservation.yaml');
const todo = (await lire('docs/todo-contenus.md')) ?? '';

const resultats = [
  ...controlerWrangler(await lire('wrangler.toml') ?? ''),
  ...controlerMigrations(migrations),
  ...controlerSite({ fichiers: fichiersDist, reserverFr: contenus['reserver/index.html'], reserverEn: contenus['en/book/index.html'] }),
  ...controlerSecrets(contenus),
  ...controlerSuivis(suivis),
  ...controlerOuverture({ legal, site, nbPointsAConfirmer: todo.split('\n').filter(l => l.startsWith('| `')).length, prixNonValides: (reservation.match(/validated:\s*false/g) ?? []).length }),
];

for (const [titre, niveau] of [['Techniques (bloquants)', 'bloquant'], ['Avant l’ouverture au public', 'ouverture']]) {
  console.log(`\n${titre}`);
  for (const r of resultats.filter(r => r.niveau === niveau)) console.log(`  ${r.ok ? 'OK ' : '!! '} ${r.message}`);
}
const { bloquants, ouverture, pret } = resume(resultats);
console.log(`\n${bloquants.length} point(s) bloquant(s), ${ouverture.length} à régler avant l’ouverture.${pret ? ' Le site peut être déployé en prévisualisation.' : ''}`);
if (process.argv.includes('--strict') && (bloquants.length > 0 || (process.argv.includes('--ouverture') && ouverture.length > 0))) process.exit(1);
