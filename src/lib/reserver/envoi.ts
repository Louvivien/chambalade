import { langue, remplir } from './formats';
import type { ErreurApi } from './messages';
import type { Contact, EtatFormulaire } from './types';

export interface TextesErreurs { required: string; email: string; noDates: string; noLodging: string; consent: string; antiRobot: string; network: string; server: string; rateLimit: string }
export interface ProblemeChamp { champ: string; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // la même règle que l’API

/** Contrôles de confort avant l’envoi ; le serveur revérifie tout. L’ordre suit celui de la page. */
export function validerFormulaire(
  etat: EtatFormulaire, contact: Contact, consentement: boolean, jetonAntiRobot: string | null,
  textes: TextesErreurs, libelles: { nom: string; prenom: string; email: string },
): ProblemeChamp[] {
  const problemes: ProblemeChamp[] = [];
  if (!etat.arrivee || !etat.depart) problemes.push({ champ: 'dates', message: textes.noDates });
  if (etat.chambres.length === 0 && etat.litsDortoir === 0) problemes.push({ champ: 'hebergement', message: textes.noLodging });
  if (!contact.nom.trim()) problemes.push({ champ: 'nom', message: remplir(textes.required, { champ: libelles.nom }) });
  if (!contact.prenom.trim()) problemes.push({ champ: 'prenom', message: remplir(textes.required, { champ: libelles.prenom }) });
  if (!contact.email.trim()) problemes.push({ champ: 'email', message: remplir(textes.required, { champ: libelles.email }) });
  else if (!EMAIL.test(contact.email.trim())) problemes.push({ champ: 'email', message: textes.email });
  if (!consentement) problemes.push({ champ: 'consentement', message: textes.consent });
  if (!jetonAntiRobot) problemes.push({ champ: 'antirobot', message: textes.antiRobot });
  return problemes;
}

/** Le corps de POST /api/demandes. Aucun montant ni statut : le serveur les calcule. */
export function corpsDemande(sejour: unknown, contact: Contact, jeton: string) {
  const facultatif = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    sejour,
    contact: { nom: contact.nom.trim(), prenom: contact.prenom.trim(), email: contact.email.trim(), telephone: facultatif(contact.telephone), message: facultatif(contact.message) },
    langue: langue(),
    consentement: true as const,
    turnstile_token: jeton,
  };
}

interface ReponseApi { ok?: boolean; erreur?: ErreurApi; erreurs?: ErreurApi[] }

/** Messages à montrer après un échec, du plus précis au plus général. */
export function messagesDErreur(status: number | null, corps: unknown, retryAfter: number | null, textes: TextesErreurs, traduire: (e: ErreurApi) => string | null = e => e.message ?? null): string[] {
  if (status === null) return [textes.network];
  const c = (corps && typeof corps === 'object' ? corps : {}) as ReponseApi;
  if (status === 429) return [remplir(textes.rateLimit, { minutes: Math.max(1, Math.ceil((retryAfter ?? 3600) / 60)) })];
  const precis = [...new Set([...(c.erreurs ?? []), ...(c.erreur ? [c.erreur] : [])].map(traduire).filter((m): m is string => typeof m === 'string' && m.length > 0))];
  if (status >= 500 && status !== 503) return [textes.server];
  if (precis.length > 0) return precis;
  return [textes.server];
}
