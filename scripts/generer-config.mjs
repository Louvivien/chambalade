// Exporte src/data/reservation.yaml et src/data/emails.yaml en JSON pour les Pages Functions, qui ne lisent pas le YAML.
// Le fichier généré est versionné ; un test vérifie qu’il suit le YAML. Il est validé par le
// schéma de src/lib/reservation/config.ts au démarrage des fonctions.
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

const fichiers = ['reservation', 'emails'];
let ecart = false;
for (const nom of fichiers) {
  const source = new URL(`../src/data/${nom}.yaml`, import.meta.url);
  const cible = new URL(`../src/generated/${nom}.json`, import.meta.url);
  const contenu = JSON.stringify(parse(await readFile(source, 'utf8')), null, 2) + '\n';
  if (process.argv.includes('--verifier')) {
    const actuel = await readFile(cible, 'utf8').catch(() => '');
    if (actuel !== contenu) { console.error(`src/generated/${nom}.json est désynchronisé : npm run config:generer`); ecart = true; }
  } else {
    await writeFile(cible, contenu);
    console.log(`src/generated/${nom}.json écrit.`);
  }
}
if (process.argv.includes('--verifier')) {
  if (ecart) process.exit(1);
  console.log('Configuration des fonctions à jour.');
}
