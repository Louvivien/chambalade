import { z } from 'astro/zod';
import type { DemandeSejour } from '../reservation/types';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nombre = (max: number) => z.number().int().min(0).max(max);
const repas = z.array(z.object({ date, personnes: z.number().int().min(1).max(30) })).max(60);
const chambre = z.enum(['chambre_privee', 'chambre_2', 'chambre_3']);

/**
 * Le séjour demandé. Les champs inconnus sont ignorés : un montant ou un tarif glissé par le
 * navigateur n’a aucun effet, tout est recalculé côté serveur.
 */
export const sejourSchema = z.object({
  arrivee: date, depart: date,
  adultes: nombre(30), enfants: nombre(30), chevaux: nombre(30),
  chambres: z.array(chambre).max(3),
  litsDortoir: nombre(30),
  personnesParChambre: z.object({ chambre_privee: nombre(30), chambre_2: nombre(30), chambre_3: nombre(30) }).partial().optional(),
  diners: repas.optional(),
  dejeuners: repas.optional(),
  forfaitsCavalier: nombre(30).optional(),
});

export const contactSchema = z.object({
  nom: z.string().trim().min(1).max(100),
  prenom: z.string().trim().min(1).max(100),
  email: z.string().trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  telephone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(2000).optional(),
});

export const demandeSchema = z.object({
  sejour: sejourSchema,
  contact: contactSchema,
  langue: z.enum(['fr', 'en']),
  consentement: z.literal(true),
  turnstile_token: z.string().min(1).max(2048),
});

export const sejourDe = (donnees: z.infer<typeof sejourSchema>): DemandeSejour => donnees as DemandeSejour;

const LIBELLES: Record<string, string> = {
  arrivee: 'la date d’arrivée', depart: 'la date de départ', adultes: 'le nombre d’adultes', enfants: 'le nombre d’enfants',
  chevaux: 'le nombre de chevaux', chambres: 'les chambres', litsDortoir: 'les lits en dortoir', personnesParChambre: 'les personnes par chambre',
  diners: 'les dîners', dejeuners: 'les déjeuners', forfaitsCavalier: 'les forfaits cavalier', nom: 'le nom', prenom: 'le prénom',
  email: 'l’adresse e-mail', telephone: 'le téléphone', message: 'le message', langue: 'la langue', consentement: 'le consentement',
  turnstile_token: 'la vérification anti-robot', sejour: 'le séjour', contact: 'les coordonnées',
};

/** Message lisible pour la première anomalie d’une validation, sans détail technique. */
export function messageDeValidation(erreur: z.ZodError): { champ: string; message: string } {
  const chemin = erreur.issues[0]?.path.map(String) ?? [];
  const champ = chemin.join('.');
  const dernier = [...chemin].reverse().find(p => p in LIBELLES) ?? chemin[0] ?? 'requête';
  const cible = LIBELLES[dernier] ?? 'la requête';
  const texte = cible.charAt(0).toUpperCase() + cible.slice(1);
  if (dernier === 'consentement') return { champ, message: 'Le consentement est nécessaire pour envoyer la demande.' };
  return { champ, message: `${texte} ${/^(les|le nombre)/.test(cible) && cible.startsWith('les') ? 'ne sont pas valides' : 'n’est pas valide'}.` };
}
