import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import { parseReservationConfig, reservationConfigSchema } from '../../src/lib/reservation/config';
import { reservationPresentationSchema } from '../../src/lib/tarifs';
import { testConfig } from './config-test';

const real = parse(readFileSync(new URL('../../src/data/reservation.yaml', import.meta.url), 'utf8'));

it('valide la configuration réelle sans inventer les valeurs inconnues', () => {
  const config = parseReservationConfig(real);
  expect(config.units.paddocks.capacity_horses).toBeNull();
  expect(config.units.dortoir.privatisable).toBeNull();
  expect(config.stay.first_night).toBeNull();
  expect(config.quote.room_pricing).toBeNull();
  expect(config.quote.sheets_pricing).toBeNull();
  expect(config.quote.deposit_percent).toBeNull();
  expect(config.quote.rider_package_enabled).toBe(false);
  expect(config.prices.taxe_sejour.amount_cents).toBeNull();
});

it('reste lisible par la page du gîte (schéma de présentation)', () => {
  expect(reservationPresentationSchema.safeParse(real).success).toBe(true);
});

it('totalise les couchages : 3 chambres de 2 et 6 lits de dortoir font 12', () => {
  const config = parseReservationConfig(real);
  expect(config.capacity).toBe(12);
  expect(config.units.dortoir.capacity_beds).toBe(6);
});

it('la configuration de test est elle-même valide', () => {
  expect(reservationConfigSchema.safeParse(testConfig()).success).toBe(true);
});

it('refuse une capacité totale incohérente avec les unités', () => {
  expect(reservationConfigSchema.safeParse({ ...testConfig(), capacity: 10 }).success).toBe(false);
});

it('refuse une durée minimale supérieure à la durée maximale', () => {
  const config = testConfig();
  expect(reservationConfigSchema.safeParse({ ...config, stay: { ...config.stay, min_nights: 20 } }).success).toBe(false);
});

it.each(['2027-4-1', '01/04/2027', ''])('refuse une date mal formée : %s', first_night => {
  const config = testConfig();
  expect(reservationConfigSchema.safeParse({ ...config, stay: { ...config.stay, first_night } }).success).toBe(false);
});

it('refuse un acompte hors de 0 à 100 %', () => {
  const config = testConfig();
  for (const deposit_percent of [-1, 101, 30.5]) {
    expect(reservationConfigSchema.safeParse({ ...config, quote: { ...config.quote, deposit_percent } }).success).toBe(false);
  }
});
