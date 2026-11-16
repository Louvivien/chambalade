import { euros } from './formats';
import type { ErreurApi } from './messages';

/** Forme du devis renvoyé par l’API (voir src/lib/reservation/devis.ts). */
export interface LigneApi { id: string; unite?: string; quantite: number; prix_unitaire_cents: number | null; total_cents: number | null; statut: 'calculee' | 'incluse' | 'a_confirmer' }
export interface DevisApi { nuits: number; lignes: LigneApi[]; total_cents: number; complet: boolean; provisoire: boolean; acompte_cents: number | null }

export interface TextesDevis { pending: string; included: string; lines: Record<string, string> }
export interface LigneVue { cle: string; libelle: string; detail: string | null; montant: string; aConfirmer: boolean }

/** Les lignes à afficher : libellé tiré du contenu, jamais un prix décidé ici. */
export function lignesVue(devis: DevisApi, textes: TextesDevis, nomsUnites: Record<string, string>): LigneVue[] {
  return devis.lignes.map((l, i) => {
    const libelle = textes.lines[l.id] ?? l.id;
    // Le nom de la chambre n'est utile que s'il apporte quelque chose au libellé de la ligne.
    const nom = l.unite && nomsUnites[l.unite] !== libelle ? nomsUnites[l.unite] : null;
    const detail = [nom, l.statut === 'calculee' && l.prix_unitaire_cents !== null ? `${l.quantite} × ${euros(l.prix_unitaire_cents)}` : null].filter(Boolean).join(' · ') || null;
    return {
      cle: `${l.id}-${l.unite ?? i}`,
      libelle,
      detail,
      montant: l.statut === 'incluse' ? textes.included : l.statut === 'a_confirmer' || l.total_cents === null ? textes.pending : euros(l.total_cents),
      aConfirmer: l.statut === 'a_confirmer',
    };
  });
}

/** Messages de disponibilité renvoyés par /api/devis, tels quels (l’API les écrit déjà en français). */
export const messagesDisponibilite = (erreurs: ErreurApi[], traduire: (e: ErreurApi) => string | null = e => e.message ?? null): string[] =>
  erreurs.map(traduire).filter((m): m is string => m !== null);

/** Nom court d’une unité pour le détail d’une ligne : « Chambre 2 » à partir de « Chambre 2, un lit double… ». */
export const nomCourt = (libelle: string) => libelle.split(',')[0];

