import { testConfig } from '../reservation/config-test';
import type { ApiDeps, ApiEnv, D1Like } from '../../src/lib/api/types';
import type { UnitId } from '../../src/lib/reservation/config';
import { nuits } from '../../src/lib/reservation/dates';
import type { Statut } from '../../src/lib/reservation/types';
import { creerBase } from './d1';

export const MAINTENANT = new Date('2027-03-01T10:00:00Z');

export function creerDeps(over: { env?: Partial<ApiEnv>; now?: Date; config?: ApiDeps['config']; fetch?: typeof fetch; db?: D1Like } = {}) {
  const db = over.db ?? creerBase();
  const deps: ApiDeps = {
    env: { DB: db, ...over.env },
    config: over.config ?? testConfig(),
    now: () => over.now ?? MAINTENANT,
    fetch: over.fetch ?? (async () => { throw new Error('fetch inattendu'); }),
  };
  return { db: db as ReturnType<typeof creerBase>, deps };
}

let compteur = 0;
/** Insère directement une demande et ses occupations (état de départ des tests). */
export function inserer(db: ReturnType<typeof creerBase>, opt: { statut?: Statut; arrivee: string; depart: string; unites: Array<[UnitId, number]>; expire_at?: string | null; reference?: string }): number {
  compteur += 1;
  const reference = opt.reference ?? `CHB-2027-${String(9000 + compteur).padStart(4, '0')}`;
  const r = db.sqlite.prepare(`INSERT INTO demandes (reference, statut, date_arrivee, date_depart, nb_adultes, nb_enfants, nb_chevaux, choix, devis, langue, nom, prenom, email, consentement_at, created_at, updated_at, expire_at)
    VALUES (?, ?, ?, ?, 2, 0, 0, '{"chambres":[],"litsDortoir":0}', '{"lignes":[],"total_cents":0,"complet":true,"provisoire":false,"acompte_cents":null}', 'fr', 'Démo', 'Démo', 'demo@example.invalid', '2027-01-01T00:00:00Z', '2027-01-01T00:00:00Z', '2027-01-01T00:00:00Z', ?)`)
    .run(reference, opt.statut ?? 'confirmee', opt.arrivee, opt.depart, opt.expire_at ?? null);
  const id = Number(r.lastInsertRowid);
  for (const nuit of nuits(opt.arrivee, opt.depart)) for (const [unite, quantite] of opt.unites) {
    db.sqlite.prepare('INSERT INTO occupations (demande_id, unite, nuit, quantite) VALUES (?, ?, ?, ?)').run(id, unite, nuit, quantite);
  }
  return id;
}

export const requete = (url: string, init: RequestInit = {}) => new Request(`https://chambalade.fr${url}`, init);
export const postJson = (url: string, corps: unknown, entetes: Record<string, string> = {}) =>
  requete(url, { method: 'POST', body: JSON.stringify(corps), headers: { 'Content-Type': 'application/json', ...entetes } });
