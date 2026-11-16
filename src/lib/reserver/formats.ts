import { dateLongue } from '../reservation/dates';

/** Remplace {cle} par sa valeur ; une clé absente reste telle quelle pour se voir. */
export function remplir(modele: string, valeurs: Record<string, string | number>): string {
  return modele.replace(/\{(\w+)\}/g, (brut, cle: string) => (cle in valeurs ? String(valeurs[cle]) : brut));
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** « lundi 12 mai 2027 » (1er pour le premier du mois). */
export function dateComplete(date: string): string {
  const jour = JOURS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${jour} ${dateLongue(date)} ${date.slice(0, 4)}`;
}

/** « 12 mai » sans le jour de la semaine, pour les libellés de repas. */
export const dateCourte = dateLongue;

export function euros(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(centimes / 100);
}

export const libelleNuits = (n: number, un: string, plusieurs: string) => remplir(n > 1 ? plusieurs : un, { n });
