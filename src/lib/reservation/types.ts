import type { UnitId } from './config';

export type Statut = 'en_attente' | 'acceptee' | 'confirmee' | 'refusee' | 'annulee' | 'expiree';

/** Ce que la bibliothèque a besoin de savoir d’une demande ; la lecture en base se fait à l’étape 8. */
export interface DemandeEtat { id: number; statut: Statut; expire_at: string | null }
export interface Occupation { demandeId: number; unite: UnitId; nuit: string; quantite: number }
/** date_debut incluse, date_fin exclue, comme un séjour. */
export interface Blocage { unite: UnitId | 'toutes'; date_debut: string; date_fin: string }

export interface Instantane { demandes: DemandeEtat[]; occupations: Occupation[]; blocages: Blocage[] }

/** Ce que la cliente demande. Les chambres sont choisies une par une ; le dortoir se prend au lit. */
export type Chambre = 'chambre_privee' | 'chambre_2' | 'chambre_3';
/** Repas pris un jour donné par un certain nombre de personnes. */
export interface RepasJour { date: string; personnes: number }

export interface DemandeSejour {
  arrivee: string; depart: string;
  adultes: number; enfants: number; chevaux: number;
  chambres: Chambre[];
  litsDortoir: number;
  /** Personnes par chambre : nécessaire seulement si le prix de la chambre est par personne. */
  personnesParChambre?: Partial<Record<Chambre, number>>;
  /** Dîners (soir de la nuit concernée) et déjeuners ou pique-niques (jour concerné). */
  diners?: RepasJour[];
  dejeuners?: RepasJour[];
  /** Nombre de personnes prenant le forfait cavalier ; sans effet tant qu’il est désactivé. */
  forfaitsCavalier?: number;
}

export interface ErreurReservation { code: string; message: string; unite?: UnitId; nuit?: string }
