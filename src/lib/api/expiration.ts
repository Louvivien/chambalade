import type { D1Like } from './types';

/**
 * Passe à « expiree » les demandes en attente ou acceptées dont le délai est dépassé, et le
 * consigne au journal. L’expiration se calcule à la lecture : aucune tâche planifiée.
 * Retourne le nombre de demandes expirées.
 */
export async function expirerDemandes(db: D1Like, maintenant: Date): Promise<number> {
  const t = maintenant.toISOString();
  const [, maj] = await db.batch([
    db.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) SELECT id, 'expiree', 'systeme', NULL, ? FROM demandes WHERE statut IN ('en_attente', 'acceptee') AND expire_at IS NOT NULL AND expire_at <= ?").bind(t, t),
    db.prepare("UPDATE demandes SET statut = 'expiree', updated_at = ? WHERE statut IN ('en_attente', 'acceptee') AND expire_at IS NOT NULL AND expire_at <= ?").bind(t, t),
  ]);
  return maj.meta.changes;
}
