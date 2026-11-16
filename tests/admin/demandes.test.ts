import { describe, expect, it } from 'vitest';
import { dateHeure, dureeRestante, eurosEnCentimes, lignesListe, periode, type DemandeListe, type TextesDemandes } from '../../src/lib/admin/demandes';
import { ACTIONS, actionsPossibles, TRANSITIONS } from '../../src/lib/reservation/transitions';
import type { Statut } from '../../src/lib/reservation/types';

const t: TextesDemandes = {
  expiresIn: 'Expire dans {duree}', expired: 'Délai dépassé', hours: '{n} h', days: '{n} j', minutes: '{n} min',
  adults: '{n} adulte(s)', children: '{n} enfant(s)', horses: '{n} cheval(aux)', pending: 'à confirmer',
};
const d = (over: Partial<DemandeListe> = {}): DemandeListe => ({
  id: 4, reference: 'CHB-2027-0004', statut: 'en_attente', date_arrivee: '2027-05-10', date_depart: '2027-05-13', nb_adultes: 2, nb_enfants: 0, nb_chevaux: 1,
  nom: 'Martin', prenom: 'Claire', total_cents: 25500, expire_at: '2027-03-03T10:00:00.000Z', secondes_restantes: 90_000, ...over,
});

describe('temps restant', () => {
  it.each([[30, '1 min'], [59, '1 min'], [60, '1 min'], [35 * 60, '35 min'], [3600, '1 h'], [5 * 3600 + 59, '5 h'], [86_400, '1 j'], [90_000, '1 j 1 h'], [3 * 86_400 + 4 * 3600, '3 j 4 h'], [-5, '1 min']])('%d s → %s', (s, attendu) => {
    expect(dureeRestante(s, t)).toBe(attendu);
  });
});

describe('liste des demandes', () => {
  it('écrit chaque ligne : nom, dates, personnes, total, temps restant', () => {
    const [l] = lignesListe([d()], t);
    expect(l).toMatchObject({ id: 4, reference: 'CHB-2027-0004', nom: 'Claire Martin', personnes: '2 adulte(s), 1 cheval(aux)', total: '255 €', statut: 'en_attente', reste: 'Expire dans 1 j 1 h', urgente: false });
    expect(l.sejour).toEqual(['10 mai 2027', '13 mai 2027']);
  });
  it('un total nul s’écrit « à confirmer », jamais 0 €', () => {
    expect(lignesListe([d({ total_cents: 0 })], t)[0].total).toBe('à confirmer');
    expect(lignesListe([d({ total_cents: null })], t)[0].total).toBe('à confirmer');
  });
  it('une demande qui expire dans moins de 12 h est urgente ; une demande sans délai n’a pas de temps restant', () => {
    expect(lignesListe([d({ secondes_restantes: 3 * 3600 })], t)[0].urgente).toBe(true);
    expect(lignesListe([d({ secondes_restantes: 13 * 3600 })], t)[0].urgente).toBe(false);
    const sans = lignesListe([d({ statut: 'confirmee', secondes_restantes: null, expire_at: null })], t)[0];
    expect([sans.reste, sans.urgente]).toEqual([null, false]);
    expect(lignesListe([d({ secondes_restantes: 0 })], t)[0].reste).toBe('Délai dépassé');
  });
  it('n’énumère enfants et chevaux que s’il y en a', () => {
    expect(lignesListe([d({ nb_chevaux: 0, nb_enfants: 2 })], t)[0].personnes).toBe('2 adulte(s), 2 enfant(s)');
    expect(lignesListe([d({ nb_chevaux: 0 })], t)[0].personnes).toBe('2 adulte(s)');
  });
  it('garde l’ordre reçu de l’API (en attente d’abord)', () => {
    expect(lignesListe([d({ id: 2 }), d({ id: 1 }), d({ id: 3 })], t).map(l => l.id)).toEqual([2, 1, 3]);
  });
  it('écrit une période', () => expect(periode('2027-05-10', '2027-06-01', 'Du {debut} au {fin}')).toBe('Du 10 mai au 1er juin 2027'));
});

describe('montant d’acompte saisi', () => {
  it.each([['76,50', 7650], ['76.5', 7650], ['76', 7600], [' 1 200 ', 120000], ['0', 0], ['0,05', 5], ['', null], ['   ', null]])('« %s »', (saisie, attendu) => {
    expect(eurosEnCentimes(saisie)).toBe(attendu);
  });
  it.each(['abc', '-5', '12,345', '12,', ',5', '1e3', '10 001', '1000000', '12 €', '--1'])('refuse « %s »', saisie => {
    expect(eurosEnCentimes(saisie)).toBe('invalide');
  });
  it('respecte le maximum demandé', () => {
    expect(eurosEnCentimes('500', 500)).toBe(50000);
    expect(eurosEnCentimes('501', 500)).toBe('invalide');
  });
});

describe('date et heure de l’historique', () => {
  it('s’écrit en heure de Paris', () => {
    expect(dateHeure('2027-03-08T10:00:00.000Z')).toMatch(/8 mars 2027.*11:00/);
    expect(dateHeure('2027-07-08T10:00:00.000Z')).toMatch(/8 juil\. 2027.*12:00/);
  });
});

describe('actions possibles', () => {
  const tous: Statut[] = ['en_attente', 'acceptee', 'confirmee', 'refusee', 'annulee', 'expiree'];
  it.each([
    ['en_attente', ['accepter', 'refuser', 'prolonger']],
    ['acceptee', ['confirmer', 'annuler', 'prolonger']],
    ['confirmee', ['annuler']],
    ['refusee', []], ['annulee', []], ['expiree', []],
  ] as const)('%s', (statut, attendu) => expect(actionsPossibles(statut)).toEqual(attendu));
  it('chaque action est possible depuis au moins un statut, et la table couvre tous les statuts connus', () => {
    for (const a of ACTIONS) expect(tous.some(s => TRANSITIONS[a].de.includes(s))).toBe(true);
    for (const a of ACTIONS) for (const s of TRANSITIONS[a].de) expect(tous).toContain(s);
  });
});
