import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { parseReservationConfig } from '../../src/lib/reservation/config';
import { calculerDevis, figerDevis } from '../../src/lib/reservation/devis';
import type { DemandeSejour } from '../../src/lib/reservation/types';
import { testConfig } from './config-test';

const config = testConfig();
const reel = parseReservationConfig(parse(readFileSync(new URL('../../src/data/reservation.yaml', import.meta.url), 'utf8')));
const sejour = (over: Partial<DemandeSejour> = {}): DemandeSejour => ({
  arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 0, chambres: ['chambre_2'], litsDortoir: 0, ...over,
});
const ligne = (devis: ReturnType<typeof calculerDevis>, id: string) => devis.lignes.find(l => l.id === id);

describe('devis avec une configuration complète', () => {
  it('additionne chambre, repas, cheval et taxe en centimes', () => {
    const devis = calculerDevis(config, sejour({ chevaux: 1, diners: [{ date: '2027-05-10', personnes: 2 }] }));
    expect(devis.nuits).toBe(3);
    expect(ligne(devis, 'chambre_partagee')).toMatchObject({ quantite: 3, prix_unitaire_cents: 7500, total_cents: 22500, statut: 'calculee' });
    expect(ligne(devis, 'diner')).toMatchObject({ quantite: 2, total_cents: 4000 });
    expect(ligne(devis, 'cheval')).toMatchObject({ quantite: 3, total_cents: 3000 });
    expect(ligne(devis, 'taxe_sejour')).toMatchObject({ quantite: 6, total_cents: 900 });
    expect(ligne(devis, 'petit_dejeuner')).toMatchObject({ statut: 'incluse', total_cents: 0 });
    expect(devis.total_cents).toBe(22500 + 4000 + 3000 + 900);
    expect(devis.complet).toBe(true);
    expect(devis.provisoire).toBe(false);
    expect(Number.isInteger(devis.total_cents)).toBe(true);
  });

  it('l’acompte est un pourcentage du total, arrondi au centime', () => {
    expect(calculerDevis(config, sejour({ chevaux: 1, diners: [{ date: '2027-05-10', personnes: 2 }] })).acompte_cents).toBe(Math.floor((30400 * 30 + 50) / 100));
    const impair = testConfig({ prices: { ...config.prices, cheval: { amount_cents: 1001, unit: 'horse_night', validated: true } }, quote: { ...config.quote, deposit_percent: 50 } });
    const devis = calculerDevis(impair, sejour({ chambres: [], adultes: 0, chevaux: 1, depart: '2027-05-11' }));
    expect(devis.total_cents).toBe(1001);
    expect(devis.acompte_cents).toBe(501);
  });

  it('chambre par personne : exige le nombre de personnes par chambre', () => {
    const parPersonne = testConfig({ quote: { ...config.quote, room_pricing: 'per_person_night' } });
    expect(ligne(calculerDevis(parPersonne, sejour({ personnesParChambre: { chambre_2: 2 } })), 'chambre_partagee')).toMatchObject({ quantite: 6, total_cents: 45000 });
    expect(ligne(calculerDevis(parPersonne, sejour({ personnesParChambre: { chambre_2: 1 } })), 'chambre_partagee')?.total_cents).toBe(22500);
    const sans = calculerDevis(parPersonne, sejour());
    expect(ligne(sans, 'chambre_partagee')).toMatchObject({ statut: 'a_confirmer', raison: 'personnes_par_chambre_manquantes', total_cents: null });
    expect(sans.complet).toBe(false);
  });

  it('chambre privée et partagée utilisent chacune leur tarif', () => {
    const devis = calculerDevis(config, sejour({ chambres: ['chambre_privee', 'chambre_3'] }));
    expect(ligne(devis, 'chambre_privee')?.total_cents).toBe(24000);
    expect(ligne(devis, 'chambre_partagee')?.total_cents).toBe(22500);
  });

  it('dortoir au lit et par nuit ; draps par lit et par séjour ou par nuit selon la règle', () => {
    const dortoir = sejour({ chambres: [], litsDortoir: 2 });
    const parSejour = calculerDevis(config, dortoir);
    expect(ligne(parSejour, 'dortoir')).toMatchObject({ quantite: 6, total_cents: 21000 });
    expect(ligne(parSejour, 'draps_dortoir')).toMatchObject({ quantite: 2, total_cents: 1000 });
    const parNuit = calculerDevis(testConfig({ quote: { ...config.quote, sheets_pricing: 'per_bed_night' } }), dortoir);
    expect(ligne(parNuit, 'draps_dortoir')).toMatchObject({ quantite: 6, total_cents: 3000 });
  });

  it('pas de draps sans lit en dortoir ; déjeuners comptés par personne et par jour', () => {
    expect(ligne(calculerDevis(config, sejour()), 'draps_dortoir')).toBeUndefined();
    const devis = calculerDevis(config, sejour({ dejeuners: [{ date: '2027-05-11', personnes: 2 }, { date: '2027-05-12', personnes: 1 }] }));
    expect(ligne(devis, 'dejeuner')).toMatchObject({ quantite: 3, total_cents: 4500 });
  });

  it('le forfait cavalier reste hors du devis tant qu’il est désactivé', () => {
    expect(ligne(calculerDevis(config, sejour({ forfaitsCavalier: 2 })), 'forfait_cavalier')).toBeUndefined();
    const actif = testConfig({ quote: { ...config.quote, rider_package_enabled: true } });
    expect(ligne(calculerDevis(actif, sejour({ forfaitsCavalier: 2 })), 'forfait_cavalier')).toMatchObject({ quantite: 6, total_cents: 42000 });
  });

  it('ignore tout montant ou tarif glissé dans la demande par le navigateur', () => {
    const honnete = calculerDevis(config, sejour({ chevaux: 1 }));
    const truquee = { ...sejour({ chevaux: 1 }), total_cents: 1, acompte_cents: 0, prix: { cheval: 1 }, devis: { total_cents: 1 } } as unknown as DemandeSejour;
    expect(calculerDevis(config, truquee)).toEqual(honnete);
  });
});

describe('devis avec la configuration réelle, dont plusieurs valeurs restent inconnues', () => {
  const devis = calculerDevis(reel, sejour({ chevaux: 1, diners: [{ date: '2027-05-10', personnes: 2 }] }));

  it('marque « à confirmer » la chambre et la taxe plutôt que d’inventer un montant', () => {
    expect(ligne(devis, 'chambre_partagee')).toMatchObject({ statut: 'a_confirmer', raison: 'regle_inconnue', total_cents: null });
    expect(ligne(devis, 'taxe_sejour')).toMatchObject({ statut: 'a_confirmer', raison: 'montant_inconnu', prix_unitaire_cents: null, total_cents: null });
  });

  it('calcule les lignes connues, déclare le devis incomplet et provisoire, sans acompte', () => {
    expect(ligne(devis, 'cheval')?.total_cents).toBe(3000);
    expect(ligne(devis, 'diner')?.total_cents).toBe(4000);
    expect(devis.total_cents).toBe(7000);
    expect(devis.complet).toBe(false);
    expect(devis.provisoire).toBe(true);
    expect(devis.acompte_cents).toBeNull();
  });

  it('un montant inconnu n’est jamais compté comme zéro dans une ligne chiffrée', () => {
    expect(devis.lignes.filter(l => l.statut === 'a_confirmer').every(l => l.total_cents === null)).toBe(true);
  });

  it('draps : règle inconnue, ligne à confirmer ; forfait cavalier exclu', () => {
    const d = calculerDevis(reel, sejour({ chambres: [], litsDortoir: 1, forfaitsCavalier: 1 }));
    expect(ligne(d, 'draps_dortoir')).toMatchObject({ statut: 'a_confirmer', raison: 'regle_inconnue', quantite: 1 });
    expect(ligne(d, 'dortoir')?.total_cents).toBe(3500 * 3);
    expect(ligne(d, 'forfait_cavalier')).toBeUndefined();
  });
});

describe('devis figé', () => {
  it('ne change plus quand les prix changent ensuite', () => {
    const modifiable = testConfig();
    const fige = figerDevis(calculerDevis(modifiable, sejour({ chevaux: 1 })), new Date('2027-03-01T10:00:00Z'));
    const total = fige.total_cents;
    modifiable.prices.cheval.amount_cents = 99999;
    expect(fige.total_cents).toBe(total);
    expect(calculerDevis(modifiable, sejour({ chevaux: 1 })).total_cents).not.toBe(total);
  });

  it('est gelé, horodaté et sérialisable tel quel', () => {
    const fige = figerDevis(calculerDevis(config, sejour()), new Date('2027-03-01T10:00:00Z'));
    expect(fige.calcule_le).toBe('2027-03-01T10:00:00.000Z');
    expect(Object.isFrozen(fige)).toBe(true);
    expect(Object.isFrozen(fige.lignes[0])).toBe(true);
    expect(() => { (fige as { total_cents: number }).total_cents = 1; }).toThrow();
    expect(JSON.parse(JSON.stringify(fige))).toEqual(fige);
  });
});
