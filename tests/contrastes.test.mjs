import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/g)].map(match => [match[1], match[2]]));
function luminance(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
it.each([['foret', 'creme'], ['foret', 'horizon'], ['creme', 'kaki-fonce']])('contraste AA texte %s sur %s', (fg, bg) => {
  const [a, b] = [luminance(tokens[fg]), luminance(tokens[bg])].sort((x, y) => y - x);
  const ratio = (a + 0.05) / (b + 0.05);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
  console.log(`${fg}/${bg} : ${ratio.toFixed(2)}:1`);
});
