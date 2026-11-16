import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const fichier = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
it('_headers : protections de base pour toutes les pages', () => {
  expect(fichier).toMatch(/^\/\*\n(\s+.+\n)*\s+X-Content-Type-Options: nosniff/m);
  expect(fichier).toContain('Referrer-Policy: strict-origin-when-cross-origin');
});
it('_headers : cache long et immuable pour /_astro/ uniquement (fichiers à empreinte)', () => {
  expect(fichier).toMatch(/^\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/m);
  expect(fichier.match(/immutable/g)).toHaveLength(1);
});
it('_headers : aucun en-tête ne bloque la vérification anti-robot (pas de CSP restrictive)', () => {
  expect(fichier).not.toMatch(/Content-Security-Policy/i);
});
