import { expect, it } from 'vitest';
import { bloqueLesDates, demandesAExpirer, finDeBlocage, statutEffectif } from '../../src/lib/reservation/statuts';
import type { DemandeEtat } from '../../src/lib/reservation/types';
import { testConfig } from './config-test';

const t0 = new Date('2027-03-01T10:00:00Z');
const d = (statut: DemandeEtat['statut'], expire_at: string | null, id = 1): DemandeEtat => ({ id, statut, expire_at });

it('une demande en attente bloque les dates jusqu’à son délai, puis expire', () => {
  const demande = d('en_attente', '2027-03-03T10:00:00Z');
  expect(statutEffectif(demande, new Date('2027-03-03T09:59:59Z'))).toBe('en_attente');
  expect(bloqueLesDates(demande, new Date('2027-03-03T09:59:59Z'))).toBe(true);
  expect(statutEffectif(demande, new Date('2027-03-03T10:00:00Z'))).toBe('expiree');
  expect(bloqueLesDates(demande, new Date('2027-03-03T10:00:01Z'))).toBe(false);
});

it('une demande acceptée expire aussi, une demande confirmée jamais', () => {
  expect(statutEffectif(d('acceptee', '2027-03-08T10:00:00Z'), new Date('2027-04-01T00:00:00Z'))).toBe('expiree');
  expect(statutEffectif(d('confirmee', null), new Date('2030-01-01T00:00:00Z'))).toBe('confirmee');
  expect(bloqueLesDates(d('confirmee', '2027-03-01T00:00:00Z'), new Date('2030-01-01T00:00:00Z'))).toBe(true);
});

it.each(['refusee', 'annulee', 'expiree'] as const)('une demande %s ne bloque pas les dates', statut => {
  expect(bloqueLesDates(d(statut, null), t0)).toBe(false);
});

it('calcule la fin de blocage depuis la configuration', () => {
  const config = testConfig();
  expect(finDeBlocage('en_attente', t0, config)).toBe('2027-03-03T10:00:00.000Z');
  expect(finDeBlocage('acceptee', t0, config)).toBe('2027-03-08T10:00:00.000Z');
  expect(finDeBlocage('confirmee', t0, config)).toBeNull();
  const court = testConfig({ holds: { pending_hours: 1, accepted_days: 2 } });
  expect(finDeBlocage('en_attente', t0, court)).toBe('2027-03-01T11:00:00.000Z');
});

it('repère les demandes dont le statut en base doit passer à expiree', () => {
  const demandes = [d('en_attente', '2027-03-02T00:00:00Z', 1), d('en_attente', '2027-03-09T00:00:00Z', 2), d('confirmee', null, 3), d('refusee', null, 4)];
  expect(demandesAExpirer(demandes, t0).map(x => x.id)).toEqual([]);
  expect(demandesAExpirer(demandes, new Date('2027-03-05T00:00:00Z')).map(x => x.id)).toEqual([1]);
});
