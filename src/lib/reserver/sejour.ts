import { nuits } from '../reservation/dates';
import type { Chambre, DemandeSejour } from '../reservation/types';
import type { EtatFormulaire, Regles } from './types';

/**
 * Répartit les personnes logées en chambre : au moins une par chambre choisie, puis on remplit
 * dans l’ordre jusqu’à la capacité. Ne sert que si le prix d’une chambre est « par personne » ;
 * c’est une hypothèse de calcul, pas une information donnée par la cliente. Retourne undefined
 * s’il y a plus de chambres que de personnes (répartition impossible).
 */
export function repartirPersonnes(chambres: Chambre[], personnes: number, litsDortoir: number, capacites: Regles['capacitesChambre']): DemandeSejour['personnesParChambre'] {
  const enChambre = personnes - litsDortoir;
  if (chambres.length === 0 || enChambre < chambres.length) return undefined;
  const repartition: Partial<Record<Chambre, number>> = Object.fromEntries(chambres.map(c => [c, 1]));
  let reste = enChambre - chambres.length;
  for (const c of chambres) {
    const ajout = Math.min(reste, capacites[c] - 1);
    repartition[c] = (repartition[c] ?? 1) + ajout;
    reste -= ajout;
  }
  return repartition;
}

/** Les repas hors du séjour sont écartés quand les dates changent. */
export function nettoyerRepas(etat: EtatFormulaire): EtatFormulaire {
  if (!etat.arrivee || !etat.depart) return { ...etat, diners: [], dejeuners: [] };
  const soirs = new Set(nuits(etat.arrivee, etat.depart));
  const jours = new Set([...soirs, etat.depart]);
  return { ...etat, diners: etat.diners.filter(d => soirs.has(d)), dejeuners: etat.dejeuners.filter(d => jours.has(d)) };
}

/** Le séjour tel que l’API le demande (/api/devis et /api/demandes). Null tant que dates ou hébergement manquent. */
export function sejourDepuisEtat(etat: EtatFormulaire, regles: Regles): DemandeSejour | null {
  if (!etat.arrivee || !etat.depart) return null;
  if (etat.chambres.length === 0 && etat.litsDortoir === 0) return null;
  const personnes = etat.adultes + etat.enfants;
  const repas = (dates: string[]) => dates.map(date => ({ date, personnes }));
  const sejour: DemandeSejour = {
    arrivee: etat.arrivee, depart: etat.depart, adultes: etat.adultes, enfants: etat.enfants, chevaux: etat.chevaux,
    chambres: etat.chambres, litsDortoir: etat.litsDortoir,
  };
  const parChambre = repartirPersonnes(etat.chambres, personnes, etat.litsDortoir, regles.capacitesChambre);
  if (parChambre) sejour.personnesParChambre = parChambre;
  if (etat.diners.length > 0) sejour.diners = repas(etat.diners);
  if (etat.dejeuners.length > 0) sejour.dejeuners = repas(etat.dejeuners);
  return sejour;
}

/** Nombre entier lu dans un champ : vide, négatif ou illisible donne 0 ; borné au maximum. */
export function entierBorne(valeur: string, max: number, min = 0): number {
  const n = Number.parseInt(valeur, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}
