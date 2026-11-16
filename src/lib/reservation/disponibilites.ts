import type { ReservationConfig, UnitId } from './config';
import { ajouterJours, ajouterMois, dateLongue, estDateValide, joursEntre, nuits } from './dates';
import { bloqueLesDates } from './statuts';
import type { DemandeSejour, ErreurReservation, Instantane } from './types';

export interface Disponibilite {
  /** Capacité de l’unité (1 pour une chambre) ; null tant qu’elle est inconnue. */
  capacite: number | null;
  occupe: number;
  bloque: boolean;
  /** Places libres ; null si la capacité est inconnue. */
  libre: number | null;
}

export function capaciteUnite(config: ReservationConfig, unite: UnitId): number | null {
  const u = config.units[unite];
  if (u.type === 'chambre') return 1;
  if (u.type === 'dortoir') return u.capacity_beds;
  return u.capacity_horses;
}

export function estBloquee(instantane: Instantane, unite: UnitId, nuit: string): boolean {
  return instantane.blocages.some(b => (b.unite === 'toutes' || b.unite === unite) && b.date_debut <= nuit && nuit < b.date_fin);
}

/** Disponibilité = capacité − occupations actives − blocages. */
export function disponibilite(config: ReservationConfig, instantane: Instantane, maintenant: Date, unite: UnitId, nuit: string): Disponibilite {
  const actives = new Set(instantane.demandes.filter(d => bloqueLesDates(d, maintenant)).map(d => d.id));
  const occupe = instantane.occupations
    .filter(o => o.unite === unite && o.nuit === nuit && actives.has(o.demandeId))
    .reduce((total, o) => total + o.quantite, 0);
  const capacite = capaciteUnite(config, unite);
  const bloque = estBloquee(instantane, unite, nuit);
  return { capacite, occupe, bloque, libre: bloque ? 0 : capacite === null ? null : Math.max(capacite - occupe, 0) };
}

const erreur = (code: string, message: string, extra: Partial<ErreurReservation> = {}): ErreurReservation => ({ code, message, ...extra });
const plur = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;
const reste = (n: number, un: string, plusieurs: string, aucun: string) => (n === 0 ? aucun : `plus que ${plur(n, un, plusieurs)}`);

/** Contraintes du séjour lui-même (dates, durée, délais), indépendantes des disponibilités. */
export function validerSejour(config: ReservationConfig, demande: DemandeSejour, aujourdhui: string): ErreurReservation[] {
  const { stay, quote } = config;
  const erreurs: ErreurReservation[] = [];
  if (!estDateValide(demande.arrivee) || !estDateValide(demande.depart)) {
    return [erreur('dates_invalides', 'Les dates du séjour ne sont pas valides.')];
  }
  const n = joursEntre(demande.arrivee, demande.depart);
  if (n < 1) return [erreur('depart_avant_arrivee', 'Le départ doit être après l’arrivée.')];
  if (n < stay.min_nights) erreurs.push(erreur('sejour_trop_court', `Le séjour doit durer au moins ${plur(stay.min_nights, 'nuit', 'nuits')}.`));
  if (n > stay.max_nights) erreurs.push(erreur('sejour_trop_long', `Le séjour ne peut pas dépasser ${plur(stay.max_nights, 'nuit', 'nuits')}.`));
  if (stay.first_night !== null && demande.arrivee < stay.first_night) {
    erreurs.push(erreur('avant_ouverture', `Les séjours commencent à partir du ${dateLongue(stay.first_night)}.`));
  }
  const plusTot = ajouterJours(aujourdhui, stay.last_booking_days_before);
  if (demande.arrivee < plusTot) erreurs.push(erreur('trop_tard', 'Il est trop tard pour réserver cette date d’arrivée en ligne.'));
  if (demande.arrivee > ajouterMois(aujourdhui, stay.max_advance_months)) {
    erreurs.push(erreur('trop_tot', `On ne peut pas réserver plus de ${stay.max_advance_months} mois à l’avance.`));
  }
  if (!Number.isInteger(demande.adultes) || demande.adultes < 1) erreurs.push(erreur('adulte_requis', 'Il faut au moins une personne adulte.'));
  if (!Number.isInteger(demande.enfants) || demande.enfants < 0) erreurs.push(erreur('enfants_invalides', 'Le nombre d’enfants n’est pas valide.'));
  if (!Number.isInteger(demande.chevaux) || demande.chevaux < 0) erreurs.push(erreur('chevaux_invalides', 'Le nombre de chevaux n’est pas valide.'));
  if (demande.enfants > 0 && quote.children_accepted === false) erreurs.push(erreur('enfants_refuses', 'Les enfants ne sont pas accueillis.'));
  if (!Number.isInteger(demande.litsDortoir) || demande.litsDortoir < 0) erreurs.push(erreur('lits_invalides', 'Le nombre de lits n’est pas valide.'));
  if (demande.chambres.length === 0 && demande.litsDortoir === 0) erreurs.push(erreur('hebergement_requis', 'Choisissez au moins une chambre ou un lit en dortoir.'));
  if (new Set(demande.chambres).size !== demande.chambres.length) erreurs.push(erreur('chambre_en_double', 'Une chambre ne peut être choisie qu’une fois.'));
  if (demande.chevaux > 0 && demande.adultes < 1) erreurs.push(erreur('cheval_sans_personne', 'Un cheval suppose au moins une personne hébergée.'));
  return erreurs;
}

/**
 * Vérifie, nuit par nuit, que ce qui est demandé tient dans les places libres.
 * Retourne une erreur par unité (la première nuit en défaut), avec un message précis.
 */
export function verifierDisponibilites(config: ReservationConfig, instantane: Instantane, maintenant: Date, demande: DemandeSejour): ErreurReservation[] {
  const besoins: Array<[UnitId, number]> = [
    ...demande.chambres.map((c): [UnitId, number] => [c, 1]),
    ...(demande.litsDortoir > 0 ? [['dortoir', demande.litsDortoir] as [UnitId, number]] : []),
    ...(demande.chevaux > 0 ? [['paddocks', demande.chevaux] as [UnitId, number]] : []),
  ];
  const erreurs: ErreurReservation[] = [];
  const nuitsDuSejour = nuits(demande.arrivee, demande.depart);
  for (const [unite, voulu] of besoins) {
    const label = config.units[unite].label;
    const nom = config.units[unite].type === 'chambre' ? `La ${label.toLowerCase()}` : label;
    if (capaciteUnite(config, unite) === null) {
      // Une capacité inconnue n’est jamais traitée comme illimitée.
      erreurs.push(erreur('capacite_inconnue', `La capacité de « ${label} » n’est pas encore définie : la réservation n’est pas possible.`, { unite }));
      continue;
    }
    for (const nuit of nuitsDuSejour) {
      const d = disponibilite(config, instantane, maintenant, unite, nuit);
      if (d.bloque) {
        erreurs.push(erreur('indisponible', `${nom} n’est pas disponible la nuit du ${dateLongue(nuit)}.`, { unite, nuit }));
        break;
      }
      if ((d.libre ?? 0) < voulu) {
        const type = config.units[unite].type;
        const message = type === 'chambre'
          ? `${nom} n’est pas disponible la nuit du ${dateLongue(nuit)}.`
          : type === 'dortoir'
            ? `Le dortoir n’a ${reste(d.libre ?? 0, 'lit libre', 'lits libres', 'aucun lit libre')} la nuit du ${dateLongue(nuit)}.`
            : `Les paddocks n’ont ${reste(d.libre ?? 0, 'place libre', 'places libres', 'aucune place libre')} la nuit du ${dateLongue(nuit)}.`;
        erreurs.push(erreur('indisponible', message, { unite, nuit }));
        break;
      }
    }
  }
  return erreurs;
}
