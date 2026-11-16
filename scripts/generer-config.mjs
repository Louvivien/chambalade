// Exporte src/data/reservation.yaml en JSON pour les Pages Functions, qui ne lisent pas le YAML.
// Le fichier généré est versionné ; un test vérifie qu’il suit le YAML. Il est validé par le
// schéma de src/lib/reservation/config.ts au démarrage des fonctions.
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

const source = new URL('../src/data/reservation.yaml', import.meta.url);
const cible = new URL('../src/generated/reservation.json', import.meta.url);
const contenu = JSON.stringify(parse(await readFile(source, 'utf8')), null, 2) + '\n';
if (process.argv.includes('--verifier')) {
  const actuel = await readFile(cible, 'utf8').catch(() => '');
  if (actuel !== contenu) { console.error('src/generated/reservation.json est désynchronisé : npm run config:generer'); process.exit(1); }
  console.log('Configuration des fonctions à jour.');
} else {
  await writeFile(cible, contenu);
  console.log('src/generated/reservation.json écrit.');
}
