import type { ReservationConfig } from '../../src/lib/reservation/config';

/**
 * Configuration de TEST, entièrement renseignée. Elle n’a aucune valeur métier : elle sert
 * seulement à exercer le code. La configuration réelle (src/data/reservation.yaml) garde ses
 * inconnues à null.
 */
export function testConfig(overrides: Partial<{ [K in keyof ReservationConfig]: ReservationConfig[K] }> = {}): ReservationConfig {
  const price = (amount_cents: number, unit: ReservationConfig['prices']['dortoir']['unit']) => ({ amount_cents, unit, validated: true });
  return {
    currency: 'EUR', capacity: 12, timezone: 'Europe/Paris',
    prices: {
      dortoir: price(3500, 'person_night'), draps_dortoir: price(500, 'person_night'),
      chambre_partagee: price(7500, 'person_night'), chambre_privee: price(8000, 'person_night'),
      petit_dejeuner: price(0, 'included'), dejeuner: price(1500, 'person_day'), diner: price(2000, 'person_evening'),
      cheval: price(1000, 'horse_night'), forfait_cavalier: price(7000, 'person_night'), taxe_sejour: price(150, 'adult_night'),
    },
    units: {
      chambre_privee: { type: 'chambre', label: 'Chambre privée', capacity_people: 2, price: 'chambre_privee' },
      chambre_2: { type: 'chambre', label: 'Chambre 2', capacity_people: 2, price: 'chambre_partagee' },
      chambre_3: { type: 'chambre', label: 'Chambre 3', capacity_people: 2, price: 'chambre_partagee' },
      dortoir: { type: 'dortoir', label: 'Dortoir', capacity_beds: 6, privatisable: false },
      paddocks: { type: 'paddock', label: 'Paddocks', capacity_horses: 3 },
    },
    stay: { first_night: '2027-04-01', min_nights: 1, max_nights: 14, last_booking_days_before: 1, max_advance_months: 12 },
    holds: { pending_hours: 48, accepted_days: 7 },
    api: { rate_limit_per_hour: 5, availability_max_days: 62 },
    quote: { room_pricing: 'per_room_night', sheets_pricing: 'per_bed_stay', rider_package_enabled: false, deposit_percent: 30, children_accepted: true },
    ...overrides,
  };
}
