import { describe, expect, it } from 'vitest';
import { locales, pageKeys, route, routes, translationsOf } from '../src/lib/routes';

describe('table de routes', () => {
  it('chaque page existe dans chaque langue, avec barre finale', () => {
    for (const locale of locales) for (const key of pageKeys) expect(routes[locale][key]).toMatch(/^\/([a-z0-9-]+\/)*$/);
  });
  it('les adresses sont uniques et l’anglais vit sous /en/', () => {
    const toutes = locales.flatMap(l => pageKeys.map(k => routes[l][k]));
    expect(new Set(toutes).size).toBe(toutes.length);
    for (const key of pageKeys) expect(routes.en[key].startsWith('/en/')).toBe(true);
    for (const key of pageKeys) expect(routes.fr[key].startsWith('/en/')).toBe(false);
  });
  it('suit docs/brief.md pour l’arborescence', () => {
    expect(routes.en).toMatchObject({ home: '/en/', gite: '/en/guesthouse/', lieu: '/en/the-place/', reserver: '/en/book/', mentions: '/en/legal/', confidentialite: '/en/privacy/' });
  });
  it('route() ajoute une ancre, avec ou sans #', () => {
    expect(route('fr', 'gite', 'cheval-titre')).toBe('/gite/#cheval-titre');
    expect(route('en', 'gite', '#cheval-titre')).toBe('/en/guesthouse/#cheval-titre');
    expect(route('en', 'home')).toBe('/en/');
  });
  it('translationsOf renvoie les deux adresses', () => {
    expect(translationsOf('reserver')).toEqual({ fr: '/reserver/', en: '/en/book/' });
  });
});
