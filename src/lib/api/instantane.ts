import type { Blocage, DemandeEtat, Instantane, Occupation, Statut } from '../reservation/types';
import type { D1Like } from './types';

/** Charge ce qui touche la période [du, au) : demandes occupant ces nuits, occupations et blocages. */
export async function chargerInstantane(db: D1Like, du: string, au: string): Promise<Instantane> {
  const [occ, dem, blo] = await Promise.all([
    db.prepare('SELECT demande_id, unite, nuit, quantite FROM occupations WHERE nuit >= ? AND nuit < ?').bind(du, au).all<{ demande_id: number; unite: Occupation['unite']; nuit: string; quantite: number }>(),
    db.prepare('SELECT id, statut, expire_at FROM demandes WHERE id IN (SELECT demande_id FROM occupations WHERE nuit >= ? AND nuit < ?)').bind(du, au).all<{ id: number; statut: Statut; expire_at: string | null }>(),
    db.prepare('SELECT unite, date_debut, date_fin FROM blocages WHERE date_debut < ? AND date_fin > ?').bind(au, du).all<Blocage>(),
  ]);
  return {
    occupations: occ.results.map(o => ({ demandeId: o.demande_id, unite: o.unite, nuit: o.nuit, quantite: o.quantite })),
    demandes: dem.results.map((d): DemandeEtat => ({ id: d.id, statut: d.statut, expire_at: d.expire_at })),
    blocages: blo.results,
  };
}
