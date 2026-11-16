import { ajouterJours, ajouterMois, joursEntre, nuits } from '../reservation/dates';
import type { EtatFormulaire, LibresParNuit, Regles, StatutNuit } from './types';

/** Les semaines d’un mois, lundi en premier ; null pour les cases hors du mois. */
export function grilleDuMois(annee: number, mois: number): Array<Array<string | null>> {
  const premier = new Date(Date.UTC(annee, mois - 1, 1));
  const decalage = (premier.getUTCDay() + 6) % 7;
  const nbJours = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
  const cases: Array<string | null> = [...Array(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => `${annee}-${String(mois).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)];
  while (cases.length % 7 !== 0) cases.push(null);
  return Array.from({ length: cases.length / 7 }, (_, i) => cases.slice(i * 7, i * 7 + 7));
}

/** Première et dernière date d’arrivée possibles, d’après les règles du séjour. */
export function bornesArrivee(regles: Regles, aujourdhui: string): { premiere: string; derniere: string } {
  const delai = ajouterJours(aujourdhui, regles.veillesMin);
  const premiere = regles.premiereNuit && regles.premiereNuit > delai ? regles.premiereNuit : delai;
  return { premiere, derniere: ajouterMois(aujourdhui, regles.moisMax) };
}

/**
 * Une nuit est complète si ce que la cliente a choisi (ou, sans choix, n’importe quel
 * hébergement) ne peut pas y être servi. Une capacité inconnue (null) n’est jamais prise pour
 * de la place : la nuit est alors « inconnu » dès qu’elle compte, par exemple pour un cheval.
 */
export function statutNuit(nuit: string, libres: LibresParNuit, etat: Pick<EtatFormulaire, 'chambres' | 'litsDortoir' | 'chevaux'>, bornes: { premiere: string; derniere: string }): StatutNuit {
  if (nuit < bornes.premiere || nuit > bornes.derniere) return 'ferme';
  const l = libres[nuit];
  if (!l) return 'inconnu';
  if (etat.chevaux > 0) {
    if (l.paddocks === null) return 'inconnu';
    if (l.paddocks < etat.chevaux) return 'complet';
  }
  const choisi = etat.chambres.length > 0 || etat.litsDortoir > 0;
  if (!choisi) return (l.chambre_privee ?? 0) + (l.chambre_2 ?? 0) + (l.chambre_3 ?? 0) + (l.dortoir ?? 0) > 0 ? 'disponible' : 'complet';
  if (etat.chambres.some(c => (l[c] ?? 0) < 1)) return 'complet';
  if (etat.litsDortoir > 0 && (l.dortoir ?? 0) < etat.litsDortoir) return 'complet';
  return 'disponible';
}

export type Etat = 'disponible' | 'bloque';
export const estSelectionnable = (s: StatutNuit) => s === 'disponible';

/**
 * Le séjour [arrivee, depart) est-il possible ? Toutes ses nuits doivent être disponibles et sa
 * durée respecter les bornes. Le jour de départ n’est pas une nuit : il peut être « complet ».
 */
export function sejourPossible(arrivee: string, depart: string, regles: Regles, statut: (nuit: string) => StatutNuit): boolean {
  const n = joursEntre(arrivee, depart);
  if (n < regles.nuitsMin || n > regles.nuitsMax) return false;
  return nuits(arrivee, depart).every(nuit => estSelectionnable(statut(nuit)));
}

export type ResultatClic = { arrivee: string | null; depart: string | null; message: 'depart' | 'tropTot' | null };

/**
 * Un clic sur un jour : le premier fixe l’arrivée, le suivant le départ. Un jour avant l’arrivée,
 * ou un départ impossible, repart d’une nouvelle arrivée.
 */
export function clicSurJour(jour: string, courant: { arrivee: string | null; depart: string | null }, regles: Regles, statut: (nuit: string) => StatutNuit): ResultatClic {
  const nouvelleArrivee = (): ResultatClic => (estSelectionnable(statut(jour)) ? { arrivee: jour, depart: null, message: 'depart' } : { arrivee: null, depart: null, message: 'tropTot' });
  if (!courant.arrivee || courant.depart || jour <= courant.arrivee) return nouvelleArrivee();
  if (sejourPossible(courant.arrivee, jour, regles, statut)) return { arrivee: courant.arrivee, depart: jour, message: null };
  return nouvelleArrivee();
}

/** Mois (annee, mois) à afficher pour une date. */
export const moisDe = (date: string) => ({ annee: Number(date.slice(0, 4)), mois: Number(date.slice(5, 7)) });

/** Période à demander à l’API pour afficher un mois : le mois entier, dans la limite de la fenêtre autorisée. */
export function fenetreDuMois(annee: number, mois: number, fenetreMax: number): { du: string; au: string } {
  const du = `${annee}-${String(mois).padStart(2, '0')}-01`;
  const suivant = new Date(Date.UTC(annee, mois, 1)).toISOString().slice(0, 10);
  const jours = joursEntre(du, suivant);
  return { du, au: jours <= fenetreMax ? suivant : ajouterJours(du, fenetreMax) };
}
