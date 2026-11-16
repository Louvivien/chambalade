import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import { priceSchema, reservationPresentationSchema, formatEuros } from '../src/lib/tarifs';

const data = parse(readFileSync(new URL('../src/data/reservation.yaml', import.meta.url), 'utf8'));

it('valide la configuration et distingue une valeur inconnue d’une prestation comprise', () => {
  reservationPresentationSchema.parse(data);
  const unknown = priceSchema.parse({ amount_cents: null, unit: null, validated: false });
  const included = priceSchema.parse({ amount_cents: 0, unit: 'included', validated: true });
  expect(unknown.amount_cents).toBeNull();
  expect(unknown.unit).toBeNull();
  expect(unknown.validated).toBe(false);
  expect(included.amount_cents).toBe(0);
});

it.each([-1, 35.5, '3500', Number.MAX_SAFE_INTEGER + 1])('refuse un montant non exploitable en centimes : %s', amount_cents => {
  expect(priceSchema.safeParse({ amount_cents, unit: 'person_night', validated: false }).success).toBe(false);
});

it('refuse de déclarer confirmé un tarif dont le montant ou l’unité reste inconnu', () => {
  for (const price of [{ amount_cents: null, unit: 'adult_night' }, { amount_cents: 7500, unit: null }]) {
    expect(priceSchema.safeParse({ ...price, validated: true }).success).toBe(false);
  }
});

it('refuse de présenter un supplément payant comme compris', () => {
  expect(priceSchema.safeParse({ amount_cents: 500, unit: 'included', validated: false }).success).toBe(false);
});

it('affiche les centimes sans perdre une fraction d’euro', () => {
  expect(formatEuros(3575)).toBe('35,75\u00a0€');
  expect(formatEuros(3500)).toBe('35\u00a0€');
});

it('écrit les montants avec centimes sur deux décimales', () => {
  expect(formatEuros(7650)).toBe('76,50 €');
  expect(formatEuros(7600)).toBe('76 €');
});
