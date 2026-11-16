import { expect, it } from 'vitest';
import { ajouterJours, ajouterMois, dateLongue, dateParis, estDateValide, joursEntre, nuits } from '../../src/lib/reservation/dates';

it('liste les nuits : arrivée incluse, départ exclu', () => {
  expect(nuits('2027-05-10', '2027-05-13')).toEqual(['2027-05-10', '2027-05-11', '2027-05-12']);
  expect(nuits('2027-05-10', '2027-05-10')).toEqual([]);
  expect(nuits('2027-05-12', '2027-05-10')).toEqual([]);
});

it('traverse un changement de mois, d’année et le passage à l’heure d’été', () => {
  expect(nuits('2027-12-30', '2028-01-02')).toEqual(['2027-12-30', '2027-12-31', '2028-01-01']);
  expect(nuits('2027-03-27', '2027-03-30')).toEqual(['2027-03-27', '2027-03-28', '2027-03-29']);
  expect(joursEntre('2027-03-27', '2027-03-30')).toBe(3);
});

it('reconnaît les dates impossibles', () => {
  expect(estDateValide('2027-02-29')).toBe(false);
  expect(estDateValide('2028-02-29')).toBe(true);
  expect(estDateValide('2027-13-01')).toBe(false);
  expect(estDateValide('27-1-1')).toBe(false);
  expect(() => ajouterJours('2027-02-30', 1)).toThrow();
});

it('ajoute des mois sans déborder', () => {
  expect(ajouterMois('2027-01-31', 1)).toBe('2027-02-28');
  expect(ajouterMois('2027-03-15', 12)).toBe('2028-03-15');
});

it('donne la date du jour à Paris, pas en UTC', () => {
  expect(dateParis(new Date('2027-06-30T22:30:00Z'))).toBe('2027-07-01');
  expect(dateParis(new Date('2027-01-15T23:30:00Z'))).toBe('2027-01-16');
  expect(dateParis(new Date('2027-01-15T10:00:00Z'))).toBe('2027-01-15');
});

it('écrit les dates à la française', () => {
  expect(dateLongue('2027-05-12')).toBe('12 mai');
  expect(dateLongue('2027-06-01')).toBe('1er juin');
});
