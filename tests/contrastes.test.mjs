import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/g)].map(match => [match[1], match[2]]));
function luminance(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
// Les messages d'erreur du formulaire de réservation s'écrivent en --erreur sur le fond crème, et sur le champ (crème éclairci).
it.each([['foret', 'creme'], ['foret', 'horizon'], ['creme', 'kaki-fonce'], ['erreur', 'creme'], ['foret', 'chene'], ['creme', 'foret']])('contraste AA texte %s sur %s', (fg, bg) => {
  const [a, b] = [luminance(tokens[fg]), luminance(tokens[bg])].sort((x, y) => y - x);
  const ratio = (a + 0.05) / (b + 0.05);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
  console.log(`${fg}/${bg} : ${ratio.toFixed(2)}:1`);
});

it('--erreur reste lisible sur le fond des champs de formulaire (crème mélangé à 45 % de blanc)', () => {
  const champ = '#' + [1, 3, 5].map(i => Math.round(parseInt(tokens.creme.slice(i, i + 2), 16) * 0.55 + 255 * 0.45).toString(16).padStart(2, '0')).join('');
  const [a, b] = [luminance(tokens.erreur), luminance(champ)].sort((x, y) => y - x);
  expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5);
});

// Règle de marque (AGENTS.md) : le kaki clair ne sert jamais de couleur de texte, ni sur le crème ni ailleurs (4,02:1 sur kaki/foret, moins sur le crème).
import { readdirSync, statSync } from 'node:fs';
const fichiers = dossier => readdirSync(dossier).flatMap(nom => {
  const chemin = `${dossier}/${nom}`;
  return statSync(chemin).isDirectory() ? fichiers(chemin) : /\.(css|astro)$/.test(nom) ? [chemin] : [];
});
it('aucune règle ne met du texte en --kaki (clair)', () => {
  for (const fichier of fichiers(new URL('../src', import.meta.url).pathname)) {
    const source = readFileSync(fichier, 'utf8');
    expect(source, fichier).not.toMatch(/(^|[;{\s])color:\s*var\(--kaki\)/);
  }
});
