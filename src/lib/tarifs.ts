import { z } from 'astro/zod';

export const priceIds = ['dortoir', 'draps_dortoir', 'chambre_partagee', 'chambre_privee', 'petit_dejeuner', 'dejeuner', 'diner', 'cheval', 'forfait_cavalier', 'taxe_sejour'] as const;
export const priceUnits = ['person_night', 'person_day', 'person_evening', 'horse_night', 'adult_night', 'included'] as const;

export const priceSchema = z.object({
  amount_cents: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
  unit: z.enum(priceUnits).nullable(),
  validated: z.boolean(),
}).superRefine((price, context) => {
  if (price.validated && (price.amount_cents === null || price.unit === null)) {
    context.addIssue({ code: 'custom', message: 'Un tarif validé exige un montant et une unité connus.' });
  }
  if (price.unit === 'included' && price.amount_cents !== 0) {
    context.addIssue({ code: 'custom', message: 'Une prestation comprise doit avoir un montant nul.' });
  }
});

export const reservationPresentationSchema = z.object({
  currency: z.literal('EUR'),
  capacity: z.number().int().positive(),
  prices: z.record(z.enum(priceIds), priceSchema),
});

export function formatEuros(cents: number, locale: 'fr' | 'en' = 'fr') {
  // Deux décimales ou aucune : « 76,50 € » / « €76.50 », jamais « 76,5 € ».
  const decimales = cents % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(cents / 100);
}
