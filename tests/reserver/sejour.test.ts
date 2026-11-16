import { describe, expect, it } from 'vitest';
import { entierBorne, nettoyerRepas, repartirPersonnes, sejourDepuisEtat } from '../../src/lib/reserver/sejour';
import { etatInitial, type EtatFormulaire } from '../../src/lib/reserver/types';
import { regles } from './aide';

const etat = (over: Partial<EtatFormulaire> = {}): EtatFormulaire => ({ ...etatInitial(), arrivee: '2027-05-10', depart: '2027-05-13', chambres: ['chambre_2'], ...over });

describe('répartition des personnes par chambre', () => {
  const cap = regles.capacitesChambre;
  it('une personne dans une chambre, deux dans une chambre pour deux', () => {
    expect(repartirPersonnes(['chambre_2'], 1, 0, cap)).toEqual({ chambre_2: 1 });
    expect(repartirPersonnes(['chambre_2'], 2, 0, cap)).toEqual({ chambre_2: 2 });
  });
  it('au moins une personne par chambre, puis on remplit dans l’ordre', () => {
    expect(repartirPersonnes(['chambre_2', 'chambre_3'], 2, 0, cap)).toEqual({ chambre_2: 1, chambre_3: 1 });
    expect(repartirPersonnes(['chambre_2', 'chambre_3'], 3, 0, cap)).toEqual({ chambre_2: 2, chambre_3: 1 });
    expect(repartirPersonnes(['chambre_privee', 'chambre_2', 'chambre_3'], 6, 0, cap)).toEqual({ chambre_privee: 2, chambre_2: 2, chambre_3: 2 });
  });
  it('ne dépasse jamais la capacité d’une chambre', () => {
    expect(repartirPersonnes(['chambre_2'], 5, 0, cap)).toEqual({ chambre_2: 2 });
  });
  it('retire les personnes logées au dortoir', () => {
    expect(repartirPersonnes(['chambre_2'], 3, 1, cap)).toEqual({ chambre_2: 2 });
    expect(repartirPersonnes(['chambre_2'], 3, 2, cap)).toEqual({ chambre_2: 1 });
  });
  it('renonce quand il y a plus de chambres que de personnes ou aucune chambre', () => {
    expect(repartirPersonnes(['chambre_2', 'chambre_3'], 1, 0, cap)).toBeUndefined();
    expect(repartirPersonnes([], 2, 0, cap)).toBeUndefined();
    expect(repartirPersonnes(['chambre_2'], 2, 2, cap)).toBeUndefined();
  });
});

describe('séjour envoyé à l’API', () => {
  it('reste nul tant que les dates ou l’hébergement manquent', () => {
    expect(sejourDepuisEtat(etatInitial(), regles)).toBeNull();
    expect(sejourDepuisEtat(etat({ depart: null }), regles)).toBeNull();
    expect(sejourDepuisEtat(etat({ chambres: [], litsDortoir: 0 }), regles)).toBeNull();
  });
  it('reprend les choix tels quels et ne contient aucun montant ni statut', () => {
    const s = sejourDepuisEtat(etat({ adultes: 2, enfants: 0, chevaux: 1, litsDortoir: 0 }), regles)!;
    expect(s).toMatchObject({ arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 1, chambres: ['chambre_2'], litsDortoir: 0 });
    expect(Object.keys(s).filter(k => /cents|prix|total|montant|statut|devis/i.test(k))).toEqual([]);
  });
  it('compte les repas pour toutes les personnes du séjour', () => {
    const s = sejourDepuisEtat(etat({ adultes: 2, enfants: 1, litsDortoir: 1, diners: ['2027-05-10'], dejeuners: ['2027-05-13'] }), regles)!;
    expect(s.diners).toEqual([{ date: '2027-05-10', personnes: 3 }]);
    expect(s.dejeuners).toEqual([{ date: '2027-05-13', personnes: 3 }]);
  });
  it('omet les repas et la répartition quand il n’y en a pas', () => {
    const s = sejourDepuisEtat(etat({ chambres: [], litsDortoir: 2, adultes: 2 }), regles)!;
    expect(s.diners).toBeUndefined();
    expect(s.dejeuners).toBeUndefined();
    expect(s.personnesParChambre).toBeUndefined();
  });
});

describe('repas et dates', () => {
  it('écarte les repas hors du séjour : le dîner du jour de départ, tout après le départ', () => {
    const e = nettoyerRepas(etat({ diners: ['2027-05-10', '2027-05-12', '2027-05-13', '2027-05-20'], dejeuners: ['2027-05-09', '2027-05-13', '2027-05-14'] }));
    expect(e.diners).toEqual(['2027-05-10', '2027-05-12']);
    expect(e.dejeuners).toEqual(['2027-05-13']);
  });
  it('vide les repas sans dates', () => {
    expect(nettoyerRepas(etat({ depart: null, diners: ['2027-05-10'] })).diners).toEqual([]);
  });
});

describe('lecture d’un nombre saisi', () => {
  it.each([['3', 3], ['', 0], ['abc', 0], ['-2', 0], ['999', 30], ['2.9', 2]])('« %s » donne %s', (saisie, attendu) => {
    expect(entierBorne(saisie, 30)).toBe(attendu);
  });
  it('respecte un minimum', () => expect(entierBorne('', 30, 1)).toBe(1));
});
