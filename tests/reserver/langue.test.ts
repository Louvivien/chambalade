import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { dateComplete, dateCourte, deuxPoints, euros, fixerLangue, moisAnnee } from '../../src/lib/reserver/formats';
import { messageApi, messagesApi, type ContexteMessages } from '../../src/lib/reserver/messages';
import { messagesDErreur } from '../../src/lib/reserver/envoi';

const en = parse(readFileSync(new URL('../../src/content/reserver/en.md', import.meta.url), 'utf8').split('---')[1]);
const ctx: ContexteMessages = {
  serverErrors: en.serverErrors, unitNames: en.unitNames, nights: { one: en.dates.nightsOne, many: en.dates.nightsMany },
  regles: { nuitsMin: 1, nuitsMax: 14, moisMax: 12, premiereNuit: '2027-04-01' },
};
afterEach(() => fixerLangue('fr'));

describe('formats selon la langue', () => {
  it('français par défaut', () => {
    expect(dateComplete('2027-05-12')).toBe('mercredi 12 mai 2027');
    expect(euros(7650)).toBe('76,50 €');
    expect(deuxPoints()).toBe(' : ');
  });
  it('anglais', () => {
    fixerLangue('en');
    expect(dateComplete('2027-05-12')).toBe('Wednesday 12 May 2027');
    expect(dateCourte('2027-06-01')).toBe('1 June');
    expect(euros(7650)).toBe('€76.50');
    expect(euros(7600)).toBe('€76');
    expect(moisAnnee(2027, 5)).toBe('May 2027');
    expect(deuxPoints()).toBe(': ');
  });
});

describe('messages de l’API', () => {
  it('français : le message du serveur tel quel', () => {
    expect(messageApi({ code: 'trop_tard', message: 'Il est trop tard.' }, ctx)).toBe('Il est trop tard.');
  });
  it('anglais : le texte du contenu, rempli avec les règles', () => {
    fixerLangue('en');
    expect(messageApi({ code: 'sejour_trop_court', message: 'x' }, ctx)).toBe('The minimum length of stay is 1 night.');
    expect(messageApi({ code: 'sejour_trop_long', message: 'x' }, ctx)).toBe('A stay cannot be longer than 14 nights.');
    expect(messageApi({ code: 'avant_ouverture', message: 'x' }, ctx)).toBe('Stays start from 1 April.');
    expect(messageApi({ code: 'indisponible', message: 'x', unite: 'chambre_2', nuit: '2027-07-14' }, ctx)).toBe('Room 2 is not available on the night of 14 July.');
  });
  it('anglais : un code inconnu n’affiche jamais le français', () => {
    fixerLangue('en');
    expect(messageApi({ code: 'inconnu', message: 'Un message français' }, ctx)).toBeNull();
    expect(messagesApi([{ code: 'inconnu', message: 'Français' }], ctx)).toEqual([]);
  });
  it('anglais : aucune accolade ni mot français oublié dans les textes', () => {
    fixerLangue('en');
    for (const [code, texte] of Object.entries<string>(en.serverErrors)) {
      const rempli = messageApi({ code, unite: 'dortoir', nuit: '2027-07-14' }, ctx)!;
      expect(rempli, code).not.toMatch(/[{}]/);
      expect(texte, code).not.toMatch(/\b(nuit|séjour|chambre|n’est|les|des)\b/i);
    }
  });
  it('tout code d’erreur de la disponibilité a son texte anglais', () => {
    const source = readFileSync(new URL('../../src/lib/reservation/disponibilites.ts', import.meta.url), 'utf8');
    const codes = [...source.matchAll(/erreur\('([a-z_]+)'/g)].map(m => m[1]);
    expect(codes.length).toBeGreaterThan(15);
    for (const code of new Set(codes)) expect(en.serverErrors[code], code).toBeTruthy();
  });
  it('messagesDErreur : traduit les erreurs précises, sinon le message général', () => {
    fixerLangue('en');
    const t = en.errors;
    const traduire = (e: any) => messageApi(e, ctx);
    expect(messagesDErreur(422, { ok: false, erreurs: [{ code: 'trop_tard', message: 'Fr' }] }, null, t, traduire)).toEqual([en.serverErrors.trop_tard]);
    expect(messagesDErreur(400, { ok: false, erreur: { code: 'inconnu', message: 'Fr' } }, null, t, traduire)).toEqual([t.server]);
    expect(messagesDErreur(429, {}, 120, t, traduire)).toEqual(['You have sent too many requests. Please try again in 2 minutes.']);
  });
});
