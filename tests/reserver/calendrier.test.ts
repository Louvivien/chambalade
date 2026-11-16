import { describe, expect, it } from 'vitest';
import { bornesArrivee, clicSurJour, fenetreDuMois, grilleDuMois, moisDe, sejourPossible, statutNuit } from '../../src/lib/reserver/calendrier';
import { nuits } from '../../src/lib/reservation/dates';
import type { StatutNuit } from '../../src/lib/reserver/types';
import { AUJOURDHUI, bornes, libre, libres, regles } from './aide';

describe('grille d’un mois', () => {
  it('commence le lundi et complète les semaines avec des cases vides', () => {
    const g = grilleDuMois(2027, 5); // le 1er mai 2027 est un samedi
    expect(g[0]).toEqual([null, null, null, null, null, '2027-05-01', '2027-05-02']);
    expect(g.at(-1)!.at(-1)).toBeNull();
    expect(g.every(s => s.length === 7)).toBe(true);
    expect(g.flat().filter(Boolean)).toHaveLength(31);
  });
  it('gère février, bissextile ou non', () => {
    expect(grilleDuMois(2027, 2).flat().filter(Boolean)).toHaveLength(28);
    expect(grilleDuMois(2028, 2).flat().filter(Boolean)).toHaveLength(29);
  });
  it('un mois qui commence un lundi n’a pas de case vide au début', () => {
    expect(grilleDuMois(2027, 2)[0][0]).toBe('2027-02-01');
  });
});

describe('bornes d’arrivée', () => {
  it('prend la première nuit réservable quand elle est connue et plus tardive que le délai', () => {
    expect(bornesArrivee(regles, AUJOURDHUI)).toEqual({ premiere: '2027-04-01', derniere: '2028-03-01' });
  });
  it('prend le délai (J-1) sinon, et quand la première nuit est inconnue', () => {
    expect(bornesArrivee({ ...regles, premiereNuit: null }, AUJOURDHUI).premiere).toBe('2027-03-02');
    expect(bornesArrivee({ ...regles, premiereNuit: '2027-01-01' }, AUJOURDHUI).premiere).toBe('2027-03-02');
  });
});

describe('statut d’une nuit', () => {
  const jours = nuits('2027-05-01', '2027-05-20');
  const ctx = { chambres: [], litsDortoir: 0, chevaux: 0 };
  it('hors des bornes : fermé', () => {
    const l = libres({}, {}, ['2027-03-15', '2028-06-01']);
    expect(statutNuit('2027-03-15', l, ctx, bornes)).toBe('ferme');
    expect(statutNuit('2028-06-01', l, ctx, bornes)).toBe('ferme');
  });
  it('sans donnée de l’API : inconnu, jamais disponible', () => {
    expect(statutNuit('2027-05-10', {}, ctx, bornes)).toBe('inconnu');
  });
  it('sans choix d’hébergement : disponible tant qu’une unité est libre, complet sinon', () => {
    const l = libres({ '2027-05-10': { chambre_privee: 0, chambre_2: 0, chambre_3: 0, dortoir: 0 }, '2027-05-11': { chambre_privee: 0, chambre_2: 0, chambre_3: 0, dortoir: 2 } });
    expect(statutNuit('2027-05-10', l, ctx, bornes)).toBe('complet');
    expect(statutNuit('2027-05-11', l, ctx, bornes)).toBe('disponible');
  });
  it('avec des chambres : complet dès qu’une chambre choisie est prise', () => {
    const l = libres({ '2027-05-10': { chambre_3: 0 } }, {}, jours);
    expect(statutNuit('2027-05-10', l, { ...ctx, chambres: ['chambre_2'] }, bornes)).toBe('disponible');
    expect(statutNuit('2027-05-10', l, { ...ctx, chambres: ['chambre_2', 'chambre_3'] }, bornes)).toBe('complet');
  });
  it('avec des lits : complet s’il n’en reste pas assez', () => {
    const l = libres({ '2027-05-10': { dortoir: 2 } }, {}, jours);
    expect(statutNuit('2027-05-10', l, { ...ctx, litsDortoir: 2 }, bornes)).toBe('disponible');
    expect(statutNuit('2027-05-10', l, { ...ctx, litsDortoir: 3 }, bornes)).toBe('complet');
  });
  it('avec des chevaux : complet si les paddocks manquent de place, inconnu si la capacité l’est', () => {
    const l = libres({ '2027-05-10': { paddocks: 1 }, '2027-05-11': { paddocks: null } }, {}, jours);
    expect(statutNuit('2027-05-10', l, { ...ctx, chevaux: 2, chambres: ['chambre_2'] }, bornes)).toBe('complet');
    expect(statutNuit('2027-05-10', l, { ...ctx, chevaux: 1, chambres: ['chambre_2'] }, bornes)).toBe('disponible');
    expect(statutNuit('2027-05-11', l, { ...ctx, chevaux: 1, chambres: ['chambre_2'] }, bornes)).toBe('inconnu');
    expect(statutNuit('2027-05-11', l, { ...ctx, chevaux: 0, chambres: ['chambre_2'] }, bornes)).toBe('disponible');
  });
});

describe('séjours possibles et clics', () => {
  const pris = new Set(['2027-05-12']);
  const statut = (nuit: string): StatutNuit => (pris.has(nuit) ? 'complet' : nuit < '2027-04-01' ? 'ferme' : 'disponible');

  it('un séjour est possible si toutes ses nuits le sont, le jour de départ pouvant être complet', () => {
    expect(sejourPossible('2027-05-10', '2027-05-12', regles, statut)).toBe(true); // départ le jour d’une nuit complète
    expect(sejourPossible('2027-05-10', '2027-05-13', regles, statut)).toBe(false);
    expect(sejourPossible('2027-05-13', '2027-05-14', regles, statut)).toBe(true);
  });
  it('respecte les durées minimale et maximale', () => {
    expect(sejourPossible('2027-06-01', '2027-06-15', regles, statut)).toBe(true);
    expect(sejourPossible('2027-06-01', '2027-06-16', regles, statut)).toBe(false);
    expect(sejourPossible('2027-06-01', '2027-06-02', { ...regles, nuitsMin: 2 }, statut)).toBe(false);
    expect(sejourPossible('2027-06-01', '2027-06-01', regles, statut)).toBe(false);
  });
  it('le premier clic fixe l’arrivée, le suivant le départ', () => {
    const a = clicSurJour('2027-05-10', { arrivee: null, depart: null }, regles, statut);
    expect(a).toEqual({ arrivee: '2027-05-10', depart: null, message: 'depart' });
    expect(clicSurJour('2027-05-11', a, regles, statut)).toEqual({ arrivee: '2027-05-10', depart: '2027-05-11', message: null });
  });
  it('un clic avant ou sur l’arrivée repart d’une nouvelle arrivée', () => {
    const a = { arrivee: '2027-05-10', depart: null };
    expect(clicSurJour('2027-05-08', a, regles, statut).arrivee).toBe('2027-05-08');
    expect(clicSurJour('2027-05-10', a, regles, statut)).toMatchObject({ arrivee: '2027-05-10', depart: null });
  });
  it('un départ qui traverserait une nuit complète repart d’une nouvelle arrivée', () => {
    expect(clicSurJour('2027-05-14', { arrivee: '2027-05-10', depart: null }, regles, statut)).toEqual({ arrivee: '2027-05-14', depart: null, message: 'depart' });
  });
  it('un clic sur un jour fermé ou complet ne choisit rien', () => {
    expect(clicSurJour('2027-05-12', { arrivee: null, depart: null }, regles, statut)).toEqual({ arrivee: null, depart: null, message: 'tropTot' });
    expect(clicSurJour('2027-03-10', { arrivee: null, depart: null }, regles, statut).arrivee).toBeNull();
  });
  it('un clic quand les deux dates sont choisies recommence', () => {
    expect(clicSurJour('2027-06-01', { arrivee: '2027-05-10', depart: '2027-05-11' }, regles, statut)).toEqual({ arrivee: '2027-06-01', depart: null, message: 'depart' });
  });
});

describe('fenêtre demandée à l’API', () => {
  it('couvre le mois entier, dans la limite autorisée', () => {
    expect(fenetreDuMois(2027, 5, 62)).toEqual({ du: '2027-05-01', au: '2027-06-01' });
    expect(fenetreDuMois(2027, 12, 62)).toEqual({ du: '2027-12-01', au: '2028-01-01' });
    expect(fenetreDuMois(2027, 5, 20)).toEqual({ du: '2027-05-01', au: '2027-05-21' });
    expect(moisDe('2027-05-10')).toEqual({ annee: 2027, mois: 5 });
  });
  it('libre() fournit des valeurs par défaut cohérentes', () => {
    expect(libre().dortoir).toBe(6);
  });
});
