import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import type { D1Like, D1Result, D1Statement } from '../../src/lib/api/types';

/**
 * Façade D1 au-dessus d’une base SQLite en mémoire : les tests exécutent le vrai SQL des
 * migrations et des requêtes, avec les clés étrangères actives comme sur D1.
 */
export function creerBase(): D1Like & { sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const dossier = new URL('../../migrations/', import.meta.url);
  for (const fichier of readdirSync(dossier).filter(nom => nom.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(fichier, dossier), 'utf8'));

  const normaliser = (valeurs: unknown[]) => valeurs.map(v => (v === undefined ? null : v)) as never[];
  const statement = (sql: string, valeurs: unknown[] = []): D1Statement & { executer(): D1Result } => ({
    bind: (...v) => statement(sql, v),
    executer() {
      const requete = sqlite.prepare(sql);
      if (/^\s*(select|with|pragma)/i.test(sql) || /\breturning\b/i.test(sql)) {
        return { results: requete.all(...normaliser(valeurs)), success: true, meta: { changes: 0, last_row_id: 0 } };
      }
      const r = requete.run(...normaliser(valeurs));
      return { results: [], success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
    async first<T>() { return ((this.executer().results[0] as T | undefined) ?? null); },
    async all<T>() { return this.executer() as D1Result<T>; },
    async run() { return this.executer(); },
  });
  return {
    sqlite,
    prepare: sql => statement(sql),
    async batch(requetes) {
      sqlite.exec('BEGIN');
      try {
        const resultats = requetes.map(r => (r as unknown as { executer(): D1Result }).executer());
        sqlite.exec('COMMIT');
        return resultats;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
