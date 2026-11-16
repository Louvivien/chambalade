import { describe, expect, it } from 'vitest';
import { enregistrer, occupationsDe, preparerDemande } from '../../src/lib/reservation/demande';
import type { DemandeSejour, Instantane } from '../../src/lib/reservation/types';
import { testConfig } from './config-test';

const config = testConfig();
const maintenant = new Date('2027-03-01T10:00:00Z');
const vide: Instantane = { demandes: [], occupations: [], blocages: [] };
const sejour = (over: Partial<DemandeSejour> = {}): DemandeSejour => ({
  arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 0, chambres: ['chambre_2'], litsDortoir: 0, ...over,
});

describe('occupations d’une demande', () => {
  it('une ligne par unité et par nuit, avec la bonne quantité', () => {
    const lignes = occupationsDe(sejour({ chambres: ['chambre_2'], litsDortoir: 2, chevaux: 1 }));
    expect(lignes).toHaveLength(9);
    expect(lignes.filter(o => o.unite === 'dortoir').map(o => o.quantite)).toEqual([2, 2, 2]);
    expect(lignes.filter(o => o.unite === 'chambre_2').every(o => o.quantite === 1)).toBe(true);
    expect(lignes.map(o => o.nuit)).not.toContain('2027-05-13');
  });
});

describe('préparation d’une demande', () => {
  it('accepte une demande valide : occupations, devis figé, statut et expiration à 48 h', () => {
    const r = preparerDemande(config, vide, maintenant, sejour({ chevaux: 1 }));
    if (!r.ok) throw new Error(JSON.stringify(r.erreurs));
    expect(r.statut).toBe('en_attente');
    expect(r.expire_at).toBe('2027-03-03T10:00:00.000Z');
    expect(r.occupations).toHaveLength(6);
    expect(r.devis.total_cents).toBeGreaterThan(0);
    expect(Object.isFrozen(r.devis)).toBe(true);
  });

  it('refuse un séjour invalide sans parler des disponibilités', () => {
    const r = preparerDemande(config, vide, maintenant, sejour({ depart: '2027-05-09' }));
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && r.erreurs.map(e => e.code)).toEqual(['depart_avant_arrivee']);
  });

  it('refuse une demande qui ne tient pas dans les places libres, avec le message précis', () => {
    const snap = enregistrer(vide, 1, 'confirmee', null, [{ unite: 'dortoir', nuit: '2027-05-12', quantite: 5 }]);
    const r = preparerDemande(config, snap, maintenant, sejour({ chambres: [], litsDortoir: 2 }));
    expect(!r.ok && r.erreurs[0].message).toBe('Le dortoir n’a plus que 1 lit libre la nuit du 12 mai.');
  });

  it('compte « aujourd’hui » à l’heure de Paris pour le délai J-1', () => {
    const arrivee = sejour({ arrivee: '2027-05-10', depart: '2027-05-11' });
    // 23 h 30 à Paris le 9 mai : la veille de l’arrivée, encore réservable.
    expect(preparerDemande(config, vide, new Date('2027-05-09T21:30:00Z'), arrivee).ok).toBe(true);
    // 00 h 30 à Paris le 10 mai (encore le 9 en UTC) : trop tard.
    const tard = preparerDemande(config, vide, new Date('2027-05-09T22:30:00Z'), arrivee);
    expect(!tard.ok && tard.erreurs.map(e => e.code)).toEqual(['trop_tard']);
  });

  it('refuse les chevaux quand la capacité des paddocks est inconnue', () => {
    const inconnue = testConfig({ units: { ...config.units, paddocks: { type: 'paddock', label: 'Paddocks', capacity_horses: null } } });
    const r = preparerDemande(inconnue, vide, maintenant, sejour({ chevaux: 1 }));
    expect(!r.ok && r.erreurs.map(e => e.code)).toEqual(['capacite_inconnue']);
  });
});

describe('demandes concurrentes sur la dernière place', () => {
  it('chacune passe seule, mais la seconde est refusée une fois la première enregistrée', () => {
    const premiere = sejour({ chambres: [], litsDortoir: 4 });
    const seconde = sejour({ chambres: [], litsDortoir: 4 });
    const a = preparerDemande(config, vide, maintenant, premiere);
    // Contrôle fait sur le même état : c’est la fenêtre de concurrence que l’enregistrement
    // transactionnel de l’étape 8 devra fermer en rejouant cette vérification.
    expect(preparerDemande(config, vide, maintenant, seconde).ok).toBe(true);
    if (!a.ok) throw new Error('première demande refusée');
    const apres = enregistrer(vide, 1, a.statut, a.expire_at, a.occupations);
    const b = preparerDemande(config, apres, maintenant, seconde);
    expect(!b.ok && b.erreurs[0]).toMatchObject({ unite: 'dortoir', nuit: '2027-05-10', message: 'Le dortoir n’a plus que 2 lits libres la nuit du 10 mai.' });
  });

  it('la dernière chambre ne peut être prise qu’une fois', () => {
    const a = preparerDemande(config, vide, maintenant, sejour());
    if (!a.ok) throw new Error('refusée');
    const apres = enregistrer(vide, 1, a.statut, a.expire_at, a.occupations);
    expect(preparerDemande(config, apres, maintenant, sejour()).ok).toBe(false);
    expect(preparerDemande(config, apres, maintenant, sejour({ chambres: ['chambre_3'] })).ok).toBe(true);
  });

  it('une demande en attente qui expire sans réponse libère de nouveau la place', () => {
    const a = preparerDemande(config, vide, maintenant, sejour());
    if (!a.ok) throw new Error('refusée');
    const apres = enregistrer(vide, 1, a.statut, a.expire_at, a.occupations);
    expect(preparerDemande(config, apres, new Date('2027-03-03T09:00:00Z'), sejour()).ok).toBe(false);
    expect(preparerDemande(config, apres, new Date('2027-03-03T10:00:01Z'), sejour()).ok).toBe(true);
  });
});
