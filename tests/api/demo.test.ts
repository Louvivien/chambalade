import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gererAdmin } from '../../src/lib/api/admin';
import { gererDisponibilites } from '../../src/lib/api/disponibilites';
import { ENV_ACCESS } from './acces';
import { creerDeps } from './aide';
import { creerBase } from './d1';

const seed = readFileSync(new URL('../../seed/demo.sql', import.meta.url), 'utf8');
const n = (db: ReturnType<typeof creerBase>, table: string) => Number((db.sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n);

describe('données de démonstration', () => {
  it('se chargent sur le schéma des migrations, et peuvent être rejouées', () => {
    const db = creerBase();
    db.sqlite.exec(seed);
    db.sqlite.exec(seed);
    expect(['demandes', 'occupations', 'blocages', 'journal'].map(t => n(db, t))).toEqual([6, 23, 2, 13]);
    const statuts = (db.sqlite.prepare('SELECT statut FROM demandes ORDER BY id').all() as Array<{ statut: string }>).map(s => s.statut);
    expect(statuts).toEqual(['confirmee', 'en_attente', 'acceptee', 'refusee', 'annulee', 'expiree']);
  });

  it('ne contiennent aucune donnée réelle : adresses en example.invalid uniquement', () => {
    const adresses = seed.match(/[\w.+-]+@[\w.-]+/g) ?? [];
    expect(adresses.length).toBeGreaterThan(5);
    expect(adresses.every(a => a.endsWith('@example.invalid'))).toBe(true);
    expect(/\b0[1-9]( ?\d{2}){4}\b/.test(seed.replace(/'06000000\d\d'/g, ''))).toBe(false);
  });

  it('respectent les capacités : jamais plus que la capacité par unité et par nuit', () => {
    const db = creerBase();
    db.sqlite.exec(seed);
    const lignes = db.sqlite.prepare("SELECT unite, nuit, SUM(quantite) AS total FROM occupations o JOIN demandes d ON d.id = o.demande_id WHERE d.statut IN ('en_attente','acceptee','confirmee') GROUP BY unite, nuit").all() as Array<{ unite: string; total: number }>;
    const capacite: Record<string, number> = { chambre_privee: 1, chambre_2: 1, chambre_3: 1, dortoir: 6, paddocks: 3 };
    expect(lignes.every(l => l.total <= capacite[l.unite])).toBe(true);
  });

  it('alimentent l’API : disponibilités et administration', async () => {
    const db = creerBase();
    db.sqlite.exec(seed);
    const { deps } = creerDeps({ db, now: new Date('2027-03-01T10:00:00Z'), env: { ...ENV_ACCESS, ENVIRONMENT: 'development', ACCESS_DEV_EMAIL: 'dev@example.invalid' } });
    const dispo = await (await gererDisponibilites(new Request('https://localhost/api/disponibilites?du=2027-05-10&au=2027-05-11'), deps)).json();
    expect(dispo.nuits[0].libres).toMatchObject({ dortoir: 3, chambre_2: 1 }); // la demande refusée ne bloque pas
    const liste = await (await gererAdmin(new Request('https://localhost/api/admin/demandes'), deps, ['demandes'])).json();
    expect(liste.demandes.map((d: { reference: string }) => d.reference).slice(0, 2)).toEqual(['CHB-2027-0002', 'CHB-2027-0003']);
    const calendrier = await (await gererAdmin(new Request('https://localhost/api/admin/calendrier?mois=2027-08'), deps, ['calendrier'])).json();
    expect(calendrier.blocages).toHaveLength(1);
  });
});
