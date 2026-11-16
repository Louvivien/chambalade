import type { ReservationConfig, UnitId } from './config';
import { dateParis, nuits } from './dates';
import { calculerDevis, figerDevis, type DevisFige } from './devis';
import { validerSejour, verifierDisponibilites } from './disponibilites';
import { finDeBlocage } from './statuts';
import type { DemandeSejour, ErreurReservation, Instantane, Occupation, Statut } from './types';

export type OccupationAPrevoir = Omit<Occupation, 'demandeId'>;

/** Les occupations qu’une demande prendra : une ligne par unité et par nuit. */
export function occupationsDe(demande: DemandeSejour): OccupationAPrevoir[] {
  const unites: Array<[UnitId, number]> = [
    ...demande.chambres.map((c): [UnitId, number] => [c, 1]),
    ...(demande.litsDortoir > 0 ? [['dortoir', demande.litsDortoir] as [UnitId, number]] : []),
    ...(demande.chevaux > 0 ? [['paddocks', demande.chevaux] as [UnitId, number]] : []),
  ];
  return nuits(demande.arrivee, demande.depart).flatMap(nuit => unites.map(([unite, quantite]) => ({ unite, nuit, quantite })));
}

export type Preparation =
  | { ok: true; occupations: OccupationAPrevoir[]; devis: DevisFige; statut: 'en_attente'; expire_at: string }
  | { ok: false; erreurs: ErreurReservation[] };

/**
 * Décide si une demande peut être enregistrée, et avec quoi. Tout est recalculé ici à partir
 * de la configuration et de l’état de la base : aucun prix ni aucune disponibilité venant du
 * navigateur n’est lu. L’enregistrement lui-même (étape 8) devra rejouer la vérification des
 * places dans la même transaction que l’insertion.
 */
export function preparerDemande(config: ReservationConfig, instantane: Instantane, maintenant: Date, demande: DemandeSejour): Preparation {
  const sejour = validerSejour(config, demande, dateParis(maintenant));
  // Sans séjour valide, vérifier les disponibilités n’aurait pas de sens (dates cassées, etc.).
  if (sejour.length > 0) return { ok: false, erreurs: sejour };
  const indisponibilites = verifierDisponibilites(config, instantane, maintenant, demande);
  if (indisponibilites.length > 0) return { ok: false, erreurs: indisponibilites };
  return {
    ok: true,
    occupations: occupationsDe(demande),
    devis: figerDevis(calculerDevis(config, demande), maintenant),
    statut: 'en_attente',
    expire_at: finDeBlocage('en_attente', maintenant, config)!,
  };
}

/** Ajoute une demande acceptée à un instantané (simulation de l’enregistrement, utilisée par les tests). */
export function enregistrer(instantane: Instantane, id: number, statut: Statut, expire_at: string | null, occupations: OccupationAPrevoir[]): Instantane {
  return {
    ...instantane,
    demandes: [...instantane.demandes, { id, statut, expire_at }],
    occupations: [...instantane.occupations, ...occupations.map(o => ({ ...o, demandeId: id }))],
  };
}
