import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const index = 'docs/todo-contenus.md';
const marker = 'TODO' + '(amaelle)';
const files = execFileSync('git', ['ls-files', '-z'], { cwd: fileURLToPath(root), encoding: 'utf8' })
  .split('\0').filter(file => file && file !== index && /\.(md|astro|[cm]?[jt]s|css|ya?ml|json)$/.test(file));
const rows = [];
for (const file of [...new Set(files)].sort()) {
  const lines = (await readFile(new URL(file, root), 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (line.includes(marker)) rows.push(`| \`${file}:${i + 1}\` | ${line.trim().replaceAll('|', '\\|')} |`);
  });
}
const content = `# Informations et validations en attente\n\nInventaire des occurrences du marqueur éditorial dans les fichiers suivis par Git,\ny compris les consignes et les fichiers de contenu. Ce fichier généré est\nexclu de sa propre collecte pour éviter les doublons récursifs. Les occurrences\ndans les consignes sont des exemples, pas des informations métier à demander.\n\nRégénération : \`npm run audit:todos -- --write\` après ajout des nouveaux fichiers\nà l'index Git. Vérification : \`npm run audit:todos\`.\n\nLes points métier restent à confirmer par Amaëlle avant publication : coordonnées,\nlogo, origine de la projection, tarifs et règles de réservation, équipements et\nconditions pratiques, identité légale. Les sources ci-dessous font autorité.\n\n| Source | Occurrence exacte |\n| --- | --- |\n${rows.join('\n')}\n`;
const target = new URL(index, root);
if (process.argv.includes('--write')) {
  await writeFile(target, content);
  console.log(`Inventaire écrit : ${rows.length} lignes sources.`);
} else if (await readFile(target, 'utf8').catch(() => '') !== content) {
  console.error('Inventaire désynchronisé : npm run audit:todos -- --write');
  process.exitCode = 1;
} else console.log(`Inventaire à jour : ${rows.length} lignes sources.`);
