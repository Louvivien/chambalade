import { dateComplete } from '../reserver/formats';

export type Langue = 'fr' | 'en';

/** Échappe tout ce qui entre dans le HTML d’un e-mail : un nom ou un message de cliente n’y devient jamais du code. */
export function echapperHtml(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Valeur destinée à un en-tête (objet, nom d’expéditeur) : retours à la ligne et caractères de
 * contrôle retirés, pour qu’un nom ne puisse pas ajouter un en-tête (« Bcc: … ») à l’e-mail.
 */
export function nettoyerEnTete(valeur: string): string {
  // Caractères de contrôle (0 à 31, 127), NEL et séparateurs de ligne ou de paragraphe Unicode.
  const interdit = (c: string) => { const n = c.charCodeAt(0); return n < 32 || n === 127 || n === 0x85 || n === 0x2028 || n === 0x2029; };
  return [...valeur].map(c => (interdit(c) ? ' ' : c)).join('').replace(/\s{2,}/g, ' ').trim();
}

const LOCALE: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB' };

/** « lundi 10 mai 2027 » ou « Monday 10 May 2027 ». */
export function dateDansLangue(date: string, langue: Langue): string {
  if (langue === 'fr') return dateComplete(date);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)).replace(',', '');
}

/** Échéance en heure de Paris, avec l’heure : « samedi 8 mai 2027 à 12:00 ». */
export function echeance(iso: string, langue: Langue): string {
  return new Intl.DateTimeFormat(LOCALE[langue], { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso)).replace(',', '');
}

export function eurosDansLangue(centimes: number, langue: Langue): string {
  // Deux décimales ou aucune : « 76,50 € », jamais « 76,5 € ».
  const decimales = centimes % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(LOCALE[langue], { style: 'currency', currency: 'EUR', minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(centimes / 100);
}
