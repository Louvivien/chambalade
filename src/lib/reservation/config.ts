import { z } from 'astro/zod';
import { priceIds, priceSchema } from '../tarifs';

// Bibliothèque pure : aucun accès réseau, base de données ni horloge implicite.

export const unitIds = ['chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks'] as const;
export type UnitId = (typeof unitIds)[number];

const positiveInt = z.number().int().positive();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ.');

const room = z.object({
  type: z.literal('chambre'), label: z.string().min(1), capacity_people: positiveInt,
  price: z.enum(['chambre_privee', 'chambre_partagee']),
});
const dormitory = z.object({
  type: z.literal('dortoir'), label: z.string().min(1), capacity_beds: positiveInt,
  privatisable: z.boolean().nullable(),
});
const paddock = z.object({
  type: z.literal('paddock'), label: z.string().min(1), capacity_horses: positiveInt.nullable(),
});

export const reservationConfigSchema = z.object({
  currency: z.literal('EUR'),
  capacity: positiveInt,
  timezone: z.literal('Europe/Paris'),
  prices: z.record(z.enum(priceIds), priceSchema),
  units: z.object({ chambre_privee: room, chambre_2: room, chambre_3: room, dortoir: dormitory, paddocks: paddock }),
  stay: z.object({
    first_night: isoDate.nullable(),
    min_nights: positiveInt, max_nights: positiveInt,
    last_booking_days_before: z.number().int().nonnegative(),
    max_advance_months: positiveInt,
  }),
  holds: z.object({ pending_hours: positiveInt, accepted_days: positiveInt }),
  api: z.object({ rate_limit_per_hour: positiveInt, availability_max_days: positiveInt }),
  quote: z.object({
    room_pricing: z.enum(['per_room_night', 'per_person_night']).nullable(),
    sheets_pricing: z.enum(['per_bed_stay', 'per_bed_night']).nullable(),
    rider_package_enabled: z.boolean(),
    deposit_percent: z.number().int().min(0).max(100).nullable(),
    children_accepted: z.boolean().nullable(),
  }),
}).superRefine((config, context) => {
  if (config.stay.min_nights > config.stay.max_nights) {
    context.addIssue({ code: 'custom', path: ['stay', 'min_nights'], message: 'La durée minimale dépasse la durée maximale.' });
  }
  const beds = config.units.dortoir.capacity_beds;
  const people = unitIds.reduce((total, id) => {
    const unit = config.units[id];
    return total + (unit.type === 'chambre' ? unit.capacity_people : 0);
  }, beds);
  if (people !== config.capacity) {
    context.addIssue({ code: 'custom', path: ['capacity'], message: `La capacité totale (${config.capacity}) ne correspond pas aux unités (${people}).` });
  }
});

export type ReservationConfig = z.infer<typeof reservationConfigSchema>;

export function parseReservationConfig(raw: unknown): ReservationConfig {
  return reservationConfigSchema.parse(raw);
}
