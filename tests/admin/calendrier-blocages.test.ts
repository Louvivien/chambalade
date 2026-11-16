import { describe, expect, it } from 'vitest';
import { corpsBlocage, validerBlocage } from '../../src/lib/admin/blocages';
import { construireMois, jourDeSemaine, libelleCellule, moisEstValide, moisVoisin, nombreDeJours, texteCellule, type DonneesCalendrier, type OccupationCal } from '../../src/lib/admin/calendrier';

const base = (over: Partial<DonneesCalendrier> = {}): DonneesCalendrier => ({
  mois: '2027-05', du: '2027-05-01', au: '2027-06-01', capacites: { chambre_privee: 1, chambre_2: 1, chambre_3: 1, dortoir: 6, paddocks: null }, occupations: [], blocages: [], ...over,
});
const occ = (o: Partial<OccupationCal>): OccupationCal => ({ unite: 'chambre_2', nuit: '2027-05-10', quantite: 1, demande_id: 1, reference: 'CHB-2027-0001', statut: 'confirmee', nom: 'Martin', ...o });
const cellule = (d: DonneesCalendrier, unite: string, jour: string) => construireMois(d).lignes.find(l => l.unite === unite)!.cellules.find(c => c.jour === jour)!;
const codes = { confirmee: 'C', acceptee: 'A', en_attente: 'E', bloque: 'B' };

describe('construction du mois', () => {
  it('une ligne par unité, une case par nuit du mois', () => {
    const m = construireMois(base());
    expect(m.lignes.map(l => l.unite)).toEqual(['chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks']);
    expect(m.jours).toHaveLength(31);
    expect(m.jours[0]).toBe('2027-05-01');
    expect(m.jours.at(-1)).toBe('2027-05-31');
    expect(m.lignes.every(l => l.cellules.length === 31)).toBe(true);
    expect(construireMois(base({ mois: '2027-02', du: '2027-02-01', au: '2027-03-01' })).jours).toHaveLength(28);
  });
  it('tout est libre sans occupation ni blocage', () => {
    expect(construireMois(base()).lignes.flatMap(l => l.cellules).every(c => c.etat === 'libre' && c.total === 0)).toBe(true);
  });
  it.each(['confirmee', 'acceptee', 'en_attente'])('une occupation « %s » donne cet état', statut => {
    expect(cellule(base({ occupations: [occ({ statut })] }), 'chambre_2', '2027-05-10').etat).toBe(statut);
    expect(cellule(base({ occupations: [occ({ statut })] }), 'chambre_2', '2027-05-11').etat).toBe('libre');
    expect(cellule(base({ occupations: [occ({ statut })] }), 'chambre_3', '2027-05-10').etat).toBe('libre');
  });
  it('plusieurs occupants d’un dortoir : places additionnées, état le plus fort', () => {
    const d = base({ occupations: [occ({ unite: 'dortoir', quantite: 2, statut: 'en_attente', demande_id: 1 }), occ({ unite: 'dortoir', quantite: 3, statut: 'confirmee', demande_id: 2, reference: 'CHB-2027-0002' })] });
    const c = cellule(d, 'dortoir', '2027-05-10');
    expect([c.etat, c.total, c.occupants.map(o => o.demande_id)]).toEqual(['confirmee', 5, [1, 2]]);
  });
  it('un blocage prime ; sa date de fin est exclue ; « toutes » couvre chaque unité', () => {
    const d = base({ blocages: [{ id: 1, unite: 'toutes', date_debut: '2027-05-20', date_fin: '2027-05-22', motif: 'fermeture', note: null }, { id: 2, unite: 'dortoir', date_debut: '2027-05-03', date_fin: '2027-05-04', motif: 'travaux', note: null }] });
    for (const u of ['chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks']) {
      expect(cellule(d, u, '2027-05-20').etat).toBe('bloque');
      expect(cellule(d, u, '2027-05-21').etat).toBe('bloque');
      expect(cellule(d, u, '2027-05-22').etat).toBe('libre');
    }
    expect(cellule(d, 'dortoir', '2027-05-03').etat).toBe('bloque');
    expect(cellule(d, 'chambre_2', '2027-05-03').etat).toBe('libre');
  });
  it('une demande sur une nuit bloquée est signalée comme conflit, sans disparaître', () => {
    const d = base({ occupations: [occ({})], blocages: [{ id: 1, unite: 'chambre_2', date_debut: '2027-05-10', date_fin: '2027-05-11', motif: 'travaux', note: null }] });
    const c = cellule(d, 'chambre_2', '2027-05-10');
    expect([c.etat, c.conflit, c.occupants.length]).toEqual(['bloque', true, 1]);
    expect(cellule(base({ occupations: [occ({})] }), 'chambre_2', '2027-05-10').conflit).toBe(false);
  });
});

describe('texte et libellé des cases', () => {
  const t = {
    cellLabel: '{unite}, {jour} : {etat}', cellFree: '{unite}, {jour} : libre', quantity: '{n} place(s)', capacityUnknown: 'capacité inconnue',
    states: { confirmee: 'Confirmée', acceptee: 'Acceptée', en_attente: 'En attente', bloque: 'Bloqué' }, unites: { dortoir: 'Dortoir', chambre_2: 'Chambre 2', paddocks: 'Paddocks' },
  };
  it('chambre : une lettre ; dortoir : lettre et places ; paddocks de capacité inconnue : lettre et places', () => {
    expect(texteCellule(cellule(base({ occupations: [occ({})] }), 'chambre_2', '2027-05-10'), codes)).toBe('C');
    expect(texteCellule(cellule(base({ occupations: [occ({ unite: 'dortoir', quantite: 3, statut: 'acceptee' })] }), 'dortoir', '2027-05-10'), codes)).toBe('A 3');
    expect(texteCellule(cellule(base({ occupations: [occ({ unite: 'paddocks', quantite: 2, statut: 'en_attente' })] }), 'paddocks', '2027-05-10'), codes)).toBe('E 2');
    expect(texteCellule(cellule(base(), 'chambre_2', '2027-05-10'), codes)).toBe('');
    expect(texteCellule(cellule(base({ blocages: [{ id: 1, unite: 'toutes', date_debut: '2027-05-10', date_fin: '2027-05-11', motif: 'autre', note: null }] }), 'dortoir', '2027-05-10'), codes)).toBe('B');
  });
  it('phrases pour lecteur d’écran', () => {
    expect(libelleCellule(cellule(base({ occupations: [occ({ unite: 'dortoir', quantite: 3, statut: 'acceptee' })] }), 'dortoir', '2027-05-10'), t)).toBe('Dortoir, 10 mai : Acceptée, 3 place(s)');
    expect(libelleCellule(cellule(base(), 'chambre_2', '2027-05-01'), t)).toBe('Chambre 2, 1er mai : libre');
    expect(libelleCellule(cellule(base({ occupations: [occ({ unite: 'paddocks', quantite: 1 })] }), 'paddocks', '2027-05-10'), t)).toBe('Paddocks, 10 mai : Confirmée, 1 place(s), capacité inconnue');
  });
});

describe('mois', () => {
  it('mois voisin, d’une année à l’autre', () => {
    expect(moisVoisin('2027-05', 1)).toBe('2027-06');
    expect(moisVoisin('2027-12', 1)).toBe('2028-01');
    expect(moisVoisin('2027-01', -1)).toBe('2026-12');
    expect(moisVoisin('2027-05', -17)).toBe('2025-12');
  });
  it('validité, nombre de jours, jour de semaine', () => {
    expect(['2027-05', '2027-12'].every(moisEstValide)).toBe(true);
    expect(['2027-13', '2027-00', '2027-5', 'mai', ''].some(moisEstValide)).toBe(false);
    expect([nombreDeJours('2027-02'), nombreDeJours('2028-02'), nombreDeJours('2027-04'), nombreDeJours('2027-12')]).toEqual([28, 29, 30, 31]);
    expect([jourDeSemaine('2027-05-10'), jourDeSemaine('2027-05-15'), jourDeSemaine('2027-05-16')]).toEqual([1, 6, 7]);
  });
});

describe('formulaire de blocage', () => {
  const t = { dates: 'Fin après début.', required: 'À renseigner.' };
  const f = { unite: 'dortoir', debut: '2027-08-01', fin: '2027-08-15', motif: 'travaux', note: '' };
  it('accepte un blocage complet', () => expect(validerBlocage(f, t)).toEqual([]));
  it('signale ce qui manque', () => {
    expect(validerBlocage({ unite: '', debut: '', fin: '', motif: '', note: '' }, t).map(p => p.champ)).toEqual(['unite', 'motif', 'debut', 'fin']);
    expect(validerBlocage({ ...f, debut: '2027-02-30' }, t).map(p => p.champ)).toEqual(['debut']);
  });
  it('refuse une fin qui n’est pas après le début', () => {
    for (const fin of ['2027-08-01', '2027-07-30']) expect(validerBlocage({ ...f, fin }, t)).toEqual([{ champ: 'fin', message: 'Fin après début.' }]);
  });
  it('construit le corps de la requête, note facultative', () => {
    expect(corpsBlocage(f)).toEqual({ unite: 'dortoir', date_debut: '2027-08-01', date_fin: '2027-08-15', motif: 'travaux' });
    expect(corpsBlocage({ ...f, note: '  Peinture ' })).toMatchObject({ note: 'Peinture' });
  });
});
