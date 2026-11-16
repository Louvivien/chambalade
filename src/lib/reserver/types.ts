import type { Chambre } from '../reservation/types';

/** Ce que la cliente a saisi. Rien ici n’est cru par le serveur : tout est revérifié à l’envoi. */
export interface EtatFormulaire {
  arrivee: string | null;
  depart: string | null;
  adultes: number;
  enfants: number;
  chevaux: number;
  chambres: Chambre[];
  litsDortoir: number;
  /** Soirs (dates des nuits) où un dîner est demandé. */
  diners: string[];
  /** Jours où un déjeuner ou un pique-nique est demandé. */
  dejeuners: string[];
}

export interface Contact { nom: string; prenom: string; email: string; telephone: string; message: string }

/** Règles de séjour publiées par le site (copie de la configuration, jamais de prix). */
export interface Regles {
  premiereNuit: string | null;
  nuitsMin: number;
  nuitsMax: number;
  veillesMin: number;
  moisMax: number;
  fenetreMax: number;
  litsDortoir: number;
  capacitesChambre: Record<Chambre, number>;
}

/** Places libres par unité pour une nuit, telles que l’API les renvoie ; null = capacité inconnue. */
export type LibresParNuit = Record<string, { chambre_privee: number | null; chambre_2: number | null; chambre_3: number | null; dortoir: number | null; paddocks: number | null }>;

export type StatutNuit = 'disponible' | 'complet' | 'ferme' | 'inconnu';

export const etatInitial = (): EtatFormulaire => ({ arrivee: null, depart: null, adultes: 1, enfants: 0, chevaux: 0, chambres: [], litsDortoir: 0, diners: [], dejeuners: [] });
