import { describe, expect, it } from 'vitest';
import { capaciteUnite, disponibilite, validerSejour, verifierDisponibilites } from '../../src/lib/reservation/disponibilites';
import type { DemandeSejour, Instantane } from '../../src/lib/reservation/types';
import { testConfig } from './config-test';

const config = testConfig();
const maintenant = new Date('2027-03-01T10:00:00Z');
const aujourdhui = '2027-03-01';
const vide: Instantane = { demandes: [], occupations: [], blocages: [] };
const sejour = (over: Partial<DemandeSejour> = {}): DemandeSejour => ({
  arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 0, chambres: ['chambre_2'], litsDortoir: 0, ...over,
});
/** Une demande active qui occupe quantite unités sur les nuits [debut, fin). */
function occupation(id: number, unite: 'dortoir' | 'paddocks' | 'chambre_2', quantite: number, nuits: string[], statut: 'en_attente' | 'confirmee' = 'confirmee', expire_at: string | null = null): Instantane {
  return { demandes: [{ id, statut, expire_at }], occupations: nuits.map(nuit => ({ demandeId: id, unite, nuit, quantite })), blocages: [] };
}
const fusion = (...x: Instantane[]): Instantane => ({ demandes: x.flatMap(i => i.demandes), occupations: x.flatMap(i => i.occupations), blocages: x.flatMap(i => i.blocages) });
const toutesNuits = ['2027-05-10', '2027-05-11', '2027-05-12'];

describe('capacités', () => {
  it('lit les capacités dans la configuration', () => {
    expect(capaciteUnite(config, 'chambre_2')).toBe(1);
    expect(capaciteUnite(config, 'dortoir')).toBe(6);
    expect(capaciteUnite(config, 'paddocks')).toBe(3);
  });
});

describe('disponibilité d’une nuit', () => {
  it('vaut capacité − occupations actives − blocages', () => {
    const snap = occupation(1, 'dortoir', 4, ['2027-05-10']);
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-10')).toMatchObject({ capacite: 6, occupe: 4, libre: 2, bloque: false });
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-11').libre).toBe(6);
  });

  it('additionne plusieurs demandes sur la même nuit', () => {
    const snap = fusion(occupation(1, 'dortoir', 2, ['2027-05-10']), occupation(2, 'dortoir', 3, ['2027-05-10']));
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-10').libre).toBe(1);
  });

  it('ignore les occupations d’une demande expirée, refusée ou annulée', () => {
    const expiree = occupation(1, 'dortoir', 6, ['2027-05-10'], 'en_attente', '2027-03-02T00:00:00Z');
    expect(disponibilite(config, expiree, new Date('2027-03-01T10:00:00Z'), 'dortoir', '2027-05-10').libre).toBe(0);
    expect(disponibilite(config, expiree, new Date('2027-03-02T00:00:01Z'), 'dortoir', '2027-05-10').libre).toBe(6);
    const refusee: Instantane = { ...occupation(2, 'dortoir', 6, ['2027-05-10']), demandes: [{ id: 2, statut: 'refusee', expire_at: null }] };
    expect(disponibilite(config, refusee, maintenant, 'dortoir', '2027-05-10').libre).toBe(6);
  });

  it('un blocage rend l’unité indisponible, la date de fin est exclue', () => {
    const snap: Instantane = { ...vide, blocages: [{ unite: 'dortoir', date_debut: '2027-05-11', date_fin: '2027-05-13' }] };
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-10').bloque).toBe(false);
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-11')).toMatchObject({ bloque: true, libre: 0 });
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-12').bloque).toBe(true);
    expect(disponibilite(config, snap, maintenant, 'dortoir', '2027-05-13').bloque).toBe(false);
    expect(disponibilite(config, snap, maintenant, 'chambre_2', '2027-05-11').bloque).toBe(false);
  });

  it('un blocage « toutes » couvre chaque unité', () => {
    const snap: Instantane = { ...vide, blocages: [{ unite: 'toutes', date_debut: '2027-05-10', date_fin: '2027-05-11' }] };
    for (const unite of ['chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks'] as const) {
      expect(disponibilite(config, snap, maintenant, unite, '2027-05-10').bloque).toBe(true);
    }
  });

  it('une capacité inconnue donne des places libres inconnues, jamais illimitées', () => {
    const inconnue = testConfig({ units: { ...config.units, paddocks: { type: 'paddock', label: 'Paddocks', capacity_horses: null } } });
    expect(disponibilite(inconnue, vide, maintenant, 'paddocks', '2027-05-10')).toMatchObject({ capacite: null, libre: null });
  });
});

describe('vérification des disponibilités d’un séjour', () => {
  it('accepte un séjour sur des unités libres', () => {
    expect(verifierDisponibilites(config, vide, maintenant, sejour({ chambres: ['chambre_2', 'chambre_3'], litsDortoir: 6, chevaux: 3 }))).toEqual([]);
  });

  it('dortoir presque plein : refuse trois lits quand il n’en reste que deux, avec un message précis', () => {
    const snap = occupation(1, 'dortoir', 4, ['2027-05-11']);
    const erreurs = verifierDisponibilites(config, snap, maintenant, sejour({ chambres: [], litsDortoir: 3 }));
    expect(erreurs).toEqual([{ code: 'indisponible', unite: 'dortoir', nuit: '2027-05-11', message: 'Le dortoir n’a plus que 2 lits libres la nuit du 11 mai.' }]);
    expect(verifierDisponibilites(config, snap, maintenant, sejour({ chambres: [], litsDortoir: 2 }))).toEqual([]);
  });

  it('dortoir complet : message sans « plus que 0 »', () => {
    const snap = occupation(1, 'dortoir', 6, ['2027-05-10']);
    expect(verifierDisponibilites(config, snap, maintenant, sejour({ chambres: [], litsDortoir: 1 }))[0].message).toBe('Le dortoir n’a aucun lit libre la nuit du 10 mai.');
  });

  it('un seul lit libre : accord au singulier', () => {
    const snap = occupation(1, 'dortoir', 5, ['2027-05-10']);
    expect(verifierDisponibilites(config, snap, maintenant, sejour({ chambres: [], litsDortoir: 2 }))[0].message).toBe('Le dortoir n’a plus que 1 lit libre la nuit du 10 mai.');
  });

  it('chevaux au-delà de la capacité des paddocks', () => {
    const snap = occupation(1, 'paddocks', 2, ['2027-05-12']);
    const erreurs = verifierDisponibilites(config, snap, maintenant, sejour({ chevaux: 2 }));
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0]).toMatchObject({ unite: 'paddocks', nuit: '2027-05-12', message: 'Les paddocks n’ont plus que 1 place libre la nuit du 12 mai.' });
    expect(verifierDisponibilites(config, vide, maintenant, sejour({ chevaux: 4 }))[0].message).toContain('plus que 3 places libres');
  });

  it('capacité des paddocks inconnue : refuse les chevaux au lieu de les accepter sans limite', () => {
    const inconnue = testConfig({ units: { ...config.units, paddocks: { type: 'paddock', label: 'Paddocks', capacity_horses: null } } });
    const erreurs = verifierDisponibilites(inconnue, vide, maintenant, sejour({ chevaux: 1 }));
    expect(erreurs.map(e => e.code)).toEqual(['capacite_inconnue']);
    expect(verifierDisponibilites(inconnue, vide, maintenant, sejour({ chevaux: 0 }))).toEqual([]);
  });

  it('séjour à cheval sur un blocage : refusé dès la première nuit bloquée', () => {
    const snap: Instantane = { ...vide, blocages: [{ unite: 'chambre_2', date_debut: '2027-05-12', date_fin: '2027-05-20' }] };
    const erreurs = verifierDisponibilites(config, snap, maintenant, sejour());
    expect(erreurs).toEqual([{ code: 'indisponible', unite: 'chambre_2', nuit: '2027-05-12', message: 'La chambre 2 n’est pas disponible la nuit du 12 mai.' }]);
    expect(verifierDisponibilites(config, snap, maintenant, sejour({ depart: '2027-05-12' }))).toEqual([]);
  });

  it('une chambre déjà prise une nuit est refusée ; deux séjours enchaînés sont acceptés', () => {
    const snap = occupation(1, 'chambre_2', 1, ['2027-05-08', '2027-05-09']);
    expect(verifierDisponibilites(config, snap, maintenant, sejour())).toEqual([]);
    const chevauche = occupation(2, 'chambre_2', 1, ['2027-05-09', '2027-05-10']);
    expect(verifierDisponibilites(config, chevauche, maintenant, sejour())[0].nuit).toBe('2027-05-10');
  });

  it('une demande en attente expirée libère la place', () => {
    const snap = occupation(1, 'dortoir', 6, toutesNuits, 'en_attente', '2027-03-02T00:00:00Z');
    const demande = sejour({ chambres: [], litsDortoir: 1 });
    expect(verifierDisponibilites(config, snap, new Date('2027-03-01T12:00:00Z'), demande)).toHaveLength(1);
    expect(verifierDisponibilites(config, snap, new Date('2027-03-03T00:00:00Z'), demande)).toEqual([]);
  });

  it('signale une erreur par unité, sans masquer les autres', () => {
    const snap = fusion(occupation(1, 'dortoir', 6, toutesNuits), occupation(2, 'chambre_2', 1, toutesNuits));
    const erreurs = verifierDisponibilites(config, snap, maintenant, sejour({ litsDortoir: 1 }));
    expect(erreurs.map(e => e.unite).sort()).toEqual(['chambre_2', 'dortoir']);
  });
});

describe('contraintes du séjour', () => {
  const codes = (d: Partial<DemandeSejour>, c = config) => validerSejour(c, sejour(d), aujourdhui).map(e => e.code);

  it('accepte un séjour conforme', () => expect(codes({})).toEqual([]));
  it('refuse un départ avant ou le jour de l’arrivée', () => {
    expect(codes({ depart: '2027-05-10' })).toEqual(['depart_avant_arrivee']);
    expect(codes({ depart: '2027-05-01' })).toEqual(['depart_avant_arrivee']);
  });
  it('refuse des dates impossibles', () => expect(codes({ arrivee: '2027-02-30' })).toEqual(['dates_invalides']));
  it('applique les durées minimale et maximale de la configuration', () => {
    expect(codes({ depart: '2027-05-24' })).toEqual([]);
    expect(codes({ depart: '2027-05-25' })).toEqual(['sejour_trop_long']);
    const deux = testConfig({ stay: { ...config.stay, min_nights: 2 } });
    expect(codes({ depart: '2027-05-11' }, deux)).toEqual(['sejour_trop_court']);
  });
  it('refuse une arrivée avant la première nuit réservable, seulement si elle est connue', () => {
    expect(codes({ arrivee: '2027-03-31', depart: '2027-04-02' })).toContain('avant_ouverture');
    const inconnue = testConfig({ stay: { ...config.stay, first_night: null } });
    expect(codes({ arrivee: '2027-03-31', depart: '2027-04-02' }, inconnue)).not.toContain('avant_ouverture');
  });
  it('respecte J-1 au plus tard et 12 mois au plus tôt', () => {
    const sans = testConfig({ stay: { ...config.stay, first_night: null } });
    expect(codes({ arrivee: '2027-03-01', depart: '2027-03-03' }, sans)).toEqual(['trop_tard']);
    expect(codes({ arrivee: '2027-03-02', depart: '2027-03-03' }, sans)).toEqual([]);
    expect(codes({ arrivee: '2028-03-01', depart: '2028-03-03' }, sans)).toEqual([]);
    expect(codes({ arrivee: '2028-03-02', depart: '2028-03-03' }, sans)).toEqual(['trop_tot']);
  });
  it('exige un hébergement, au moins un adulte, des nombres entiers', () => {
    expect(codes({ chambres: [], litsDortoir: 0 })).toEqual(['hebergement_requis']);
    expect(codes({ adultes: 0 })).toContain('adulte_requis');
    expect(codes({ chevaux: -1 })).toEqual(['chevaux_invalides']);
    expect(codes({ litsDortoir: 1.5 })).toEqual(['lits_invalides']);
  });
  it('refuse une chambre choisie deux fois', () => expect(codes({ chambres: ['chambre_2', 'chambre_2'] })).toEqual(['chambre_en_double']));
  it('un cheval suppose une personne hébergée', () => expect(codes({ adultes: 0, chevaux: 1 })).toEqual(expect.arrayContaining(['adulte_requis', 'cheval_sans_personne'])));
  it('refuse les enfants seulement si la configuration le dit explicitement', () => {
    expect(codes({ enfants: 1, litsDortoir: 1 })).toEqual([]);
    const non = testConfig({ quote: { ...config.quote, children_accepted: false } });
    expect(codes({ enfants: 1, litsDortoir: 1 }, non)).toEqual(['enfants_refuses']);
    const inconnu = testConfig({ quote: { ...config.quote, children_accepted: null } });
    expect(codes({ enfants: 1, litsDortoir: 1 }, inconnu)).toEqual([]);
  });
});

describe('contraintes complémentaires du séjour', () => {
  const codes = (d: Partial<DemandeSejour>) => validerSejour(config, sejour(d), aujourdhui).map(e => e.code);

  it('refuse plus de personnes que de couchages choisis', () => {
    expect(codes({ adultes: 3 })).toEqual(['places_insuffisantes']);
    expect(codes({ adultes: 3, litsDortoir: 1 })).toEqual([]);
    expect(codes({ adultes: 2, enfants: 1 })).toEqual(['places_insuffisantes']);
  });

  it('valide le nombre de personnes par chambre', () => {
    expect(codes({ personnesParChambre: { chambre_2: 2 } })).toEqual([]);
    expect(codes({ personnesParChambre: { chambre_2: 3 } })).toEqual(['personnes_chambre_invalides']);
    expect(codes({ personnesParChambre: { chambre_3: 1 } })).toEqual(['personnes_chambre_invalides']);
    expect(codes({ personnesParChambre: { chambre_2: 0 } })).toEqual(['personnes_chambre_invalides']);
  });

  it('valide les repas : dîner un soir du séjour, déjeuner un jour du séjour, nombre de personnes', () => {
    expect(codes({ diners: [{ date: '2027-05-12', personnes: 2 }] })).toEqual([]);
    expect(codes({ diners: [{ date: '2027-05-13', personnes: 2 }] })).toEqual(['repas_invalide']);
    expect(codes({ dejeuners: [{ date: '2027-05-13', personnes: 2 }] })).toEqual([]);
    expect(codes({ dejeuners: [{ date: '2027-05-14', personnes: 1 }] })).toEqual(['repas_invalide']);
    expect(codes({ diners: [{ date: '2027-05-10', personnes: 3 }] })).toEqual(['repas_invalide']);
    expect(codes({ diners: [{ date: '2027-05-10', personnes: 0 }] })).toEqual(['repas_invalide']);
  });

  it('valide le nombre de forfaits cavalier', () => {
    expect(codes({ forfaitsCavalier: 2 })).toEqual([]);
    expect(codes({ forfaitsCavalier: 3 })).toEqual(['forfait_invalide']);
    expect(codes({ forfaitsCavalier: -1 })).toEqual(['forfait_invalide']);
  });
});
