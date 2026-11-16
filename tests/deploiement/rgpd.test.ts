import { describe, expect, it } from 'vitest';
// @ts-expect-error module .mjs sans déclaration de types
import { MARQUE, anonymiserDemande, apercuPurge, purger, supprimerDemande } from '../../scripts/rgpd/sql.mjs';
import { creerBase } from '../api/d1';
import { inserer } from '../api/aide';

const JOUR = '2027-09-01';
const MAINT = '2027-09-01T10:00:00Z';
const lancer = (db: ReturnType<typeof creerBase>, requetes: string[]) => { for (const r of requetes) db.sqlite.exec(r); };
const demande = (db: ReturnType<typeof creerBase>, reference: string) => db.sqlite.prepare('SELECT * FROM demandes WHERE reference = ?').get(reference) as any;
const journal = (db: ReturnType<typeof creerBase>) => db.sqlite.prepare('SELECT * FROM journal ORDER BY id').all() as any[];

function base() {
  const db = creerBase();
  inserer(db, { reference: 'CHB-2027-0001', statut: 'confirmee', arrivee: '2027-05-10', depart: '2027-05-12', unites: [['chambre_2', 1]] });   // séjour passé
  inserer(db, { reference: 'CHB-2027-0002', statut: 'confirmee', arrivee: '2027-12-10', depart: '2027-12-12', unites: [['chambre_2', 1]] });   // séjour à venir
  inserer(db, { reference: 'CHB-2027-0003', statut: 'en_attente', arrivee: '2027-10-10', depart: '2027-10-12', unites: [['chambre_3', 1]], expire_at: '2027-09-03T00:00:00Z' });
  inserer(db, { reference: 'CHB-2027-0004', statut: 'refusee', arrivee: '2027-10-10', depart: '2027-10-12', unites: [] });
  inserer(db, { reference: 'CHB-2027-0005', statut: 'acceptee', arrivee: '2027-10-20', depart: '2027-10-22', unites: [['chambre_3', 1]], expire_at: '2027-09-08T00:00:00Z' });
  db.sqlite.prepare("UPDATE demandes SET telephone = '0600000000', message = 'Mon cheval s’appelle Baraka' ").run();
  return db;
}

describe('anonymiser une demande', () => {
  it('remplace les données personnelles, garde les dates et le devis, journalise sans donnée personnelle', () => {
    const db = base();
    lancer(db, anonymiserDemande({ reference: 'CHB-2027-0001', jour: JOUR, maintenant: MAINT }));
    const d = demande(db, 'CHB-2027-0001');
    expect([d.nom, d.prenom]).toEqual([MARQUE, MARQUE]);
    expect(d.email).toBe('anonyme@invalid.invalid');
    expect(d.telephone).toBeNull();
    expect(d.message).toBeNull();
    expect(d.date_arrivee).toBe('2027-05-10');
    expect(JSON.parse(d.devis).complet).toBe(true);
    const j = journal(db);
    expect(j).toHaveLength(1);
    expect(j[0]).toMatchObject({ action: 'anonymisee', auteur: 'rgpd', detail: null });
    expect(JSON.stringify(j)).not.toMatch(/Baraka|demo@example|Démo/);
  });
  it('est idempotente : une seconde exécution ne journalise rien de plus', () => {
    const db = base();
    for (let i = 0; i < 2; i++) lancer(db, anonymiserDemande({ reference: 'CHB-2027-0001', jour: JOUR, maintenant: MAINT }));
    expect(journal(db)).toHaveLength(1);
  });
  it('ne touche jamais une demande active (en attente, acceptée, confirmée à venir)', () => {
    const db = base();
    for (const ref of ['CHB-2027-0002', 'CHB-2027-0003', 'CHB-2027-0005']) lancer(db, anonymiserDemande({ reference: ref, jour: JOUR, maintenant: MAINT }));
    for (const ref of ['CHB-2027-0002', 'CHB-2027-0003', 'CHB-2027-0005']) expect(demande(db, ref).nom).not.toBe(MARQUE);
    expect(journal(db)).toHaveLength(0);
  });
  it('refuse une référence ou une date malformée (aucune injection possible)', () => {
    expect(() => anonymiserDemande({ reference: "CHB-2027-0001'; DROP TABLE demandes; --", jour: JOUR, maintenant: MAINT })).toThrow();
    expect(() => anonymiserDemande({ reference: 'CHB-2027-0001', jour: "2027-09-01' OR 1=1", maintenant: MAINT })).toThrow();
    expect(() => anonymiserDemande({ reference: 'CHB-2027-0001', jour: JOUR, maintenant: 'maintenant' })).toThrow();
  });
});

describe('supprimer une demande', () => {
  it('supprime la demande et ses occupations, garde une trace sans donnée personnelle', () => {
    const db = base();
    lancer(db, supprimerDemande({ reference: 'CHB-2027-0001', jour: JOUR, maintenant: MAINT }));
    expect(demande(db, 'CHB-2027-0001')).toBeUndefined();
    expect(db.sqlite.prepare("SELECT count(*) AS n FROM occupations WHERE nuit IN ('2027-05-10','2027-05-11')").get()).toEqual({ n: 0 });
    expect(journal(db)).toMatchObject([{ action: 'supprimee', detail: 'CHB-2027-0001', demande_id: expect.any(Number) }]);
    expect(demande(db, 'CHB-2027-0002')).toBeDefined();
  });
  it('ne supprime jamais une demande active', () => {
    const db = base();
    lancer(db, supprimerDemande({ reference: 'CHB-2027-0003', jour: JOUR, maintenant: MAINT }));
    lancer(db, supprimerDemande({ reference: 'CHB-2027-0002', jour: JOUR, maintenant: MAINT }));
    expect(demande(db, 'CHB-2027-0003')).toBeDefined();
    expect(demande(db, 'CHB-2027-0002')).toBeDefined();
  });
});

describe('purge', () => {
  it('l’aperçu liste, sans donnée personnelle, ce que la purge touchera', () => {
    const db = base();
    const lignes = apercuPurge({ avant: '2027-08-01', jour: JOUR }).flatMap(r => db.sqlite.prepare(r).all() as any[]);
    expect(lignes.map(l => l.reference)).toEqual(['CHB-2027-0001', 'CHB-2027-0004']);
    expect(Object.keys(lignes[0])).toEqual(['reference', 'statut', 'date_depart', 'modifiee']);
  });
  it('anonymise les demandes terminées anciennes, rien d’autre', () => {
    const db = base();
    db.sqlite.prepare("UPDATE demandes SET updated_at = '2027-02-01T00:00:00Z' WHERE reference = 'CHB-2027-0004'").run();
    lancer(db, purger({ avant: '2027-08-01', jour: JOUR, maintenant: MAINT }));
    expect(['CHB-2027-0001', 'CHB-2027-0004'].map(r => demande(db, r).nom)).toEqual([MARQUE, MARQUE]);
    for (const ref of ['CHB-2027-0002', 'CHB-2027-0003', 'CHB-2027-0005']) expect(demande(db, ref).nom).not.toBe(MARQUE);
    expect(journal(db).map(j => j.action)).toEqual(['anonymisee', 'anonymisee']);
    // Seconde purge : rien de plus.
    lancer(db, purger({ avant: '2027-08-01', jour: JOUR, maintenant: MAINT }));
    expect(journal(db)).toHaveLength(2);
  });
  it('refuse une date limite qui n’est pas dans le passé', () => {
    expect(() => purger({ avant: '2027-09-01', jour: JOUR, maintenant: MAINT })).toThrow(/passée/);
    expect(() => purger({ avant: '2028-01-01', jour: JOUR, maintenant: MAINT })).toThrow(/passée/);
  });
  it('une demande anonymisée garde bloqués les mêmes jours (les places ne se libèrent pas)', () => {
    const db = base();
    const avant = db.sqlite.prepare('SELECT count(*) AS n FROM occupations').get();
    lancer(db, purger({ avant: '2027-08-01', jour: JOUR, maintenant: MAINT }));
    expect(db.sqlite.prepare('SELECT count(*) AS n FROM occupations').get()).toEqual(avant);
  });
});
