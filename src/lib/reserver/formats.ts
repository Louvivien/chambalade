import { dateLongue } from '../reservation/dates';

export type Langue = 'fr' | 'en';
let langueCourante: Langue = 'fr';
/** Langue de la page : à fixer une fois au démarrage du script, avant tout affichage. */
export const fixerLangue = (langue: Langue) => { langueCourante = langue; };
export const langue = (): Langue => langueCourante;
/** Deux-points selon la langue : espace insécable avant en français, collé en anglais. */
export const deuxPoints = () => (langueCourante === 'fr' ? '\u00a0: ' : ': ');

/** Remplace {cle} par sa valeur ; une clé absente reste telle quelle pour se voir. */
export function remplir(modele: string, valeurs: Record<string, string | number>): string {
  return modele.replace(/\{(\w+)\}/g, (brut, cle: string) => (cle in valeurs ? String(valeurs[cle]) : brut));
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** « lundi 12 mai 2027 » (1er pour le premier du mois). */
export function dateComplete(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (langueCourante === 'en') return `${EN_JOUR.format(d)} ${dateCourte(date)} ${date.slice(0, 4)}`;
  return `${JOURS[d.getUTCDay()]} ${dateLongue(date)} ${date.slice(0, 4)}`;
}

/** « 12 mai » sans le jour de la semaine, pour les libellés de repas. */
export function dateCourte(date: string): string {
  if (langueCourante !== 'en') return dateLongue(date);
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCDate()} ${EN_MOIS.format(d)}`;
}

const EN_JOUR = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' });
const EN_MOIS = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });

/** « mai 2027 » / « May 2027 » : titre du mois du calendrier. */
export function moisAnnee(annee: number, mois: number): string {
  return new Intl.DateTimeFormat(langueCourante === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(annee, mois - 1, 1)));
}

export function euros(centimes: number): string {
  // Deux décimales ou aucune : « 76,50 € », jamais « 76,5 € ».
  const decimales = centimes % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(langueCourante === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(centimes / 100);
}

export const libelleNuits = (n: number, un: string, plusieurs: string) => remplir(n > 1 ? plusieurs : un, { n });
