import type { ReservationConfig } from './config';
import { nuits } from './dates';
import type { DemandeSejour } from './types';
import { priceIds } from '../tarifs';

type PriceId = (typeof priceIds)[number];

/**
 * Une ligne du devis. Les libellés ne sont pas ici : ils viennent des contenus (étape 9).
 * `total_cents` vaut null quand la règle de calcul ou le montant est encore inconnu :
 * la ligne est alors « à confirmer » et n’entre pas dans le total.
 */
export interface LigneDevis {
  id: PriceId;
  /** Unité réservable concernée, pour les chambres. */
  unite?: string;
  quantite: number;
  prix_unitaire_cents: number | null;
  total_cents: number | null;
  statut: 'calculee' | 'incluse' | 'a_confirmer';
  /** Raison d’une ligne à confirmer. */
  raison?: 'montant_inconnu' | 'unite_inconnue' | 'regle_inconnue' | 'personnes_par_chambre_manquantes';
  /** Le tarif est encore une proposition non validée par Amaëlle. */
  prix_valide: boolean;
}

export interface Devis {
  devise: 'EUR';
  nuits: number;
  lignes: LigneDevis[];
  /** Somme des lignes calculées, en centimes. Partielle si `complet` est faux. */
  total_cents: number;
  /** Faux tant qu’une ligne reste à confirmer. */
  complet: boolean;
  /** Vrai si au moins un tarif utilisé n’est pas validé. */
  provisoire: boolean;
  /** Acompte en centimes ; null si le pourcentage est inconnu ou si le devis est incomplet. */
  acompte_cents: number | null;
}

/** Un devis enregistré avec la demande : copie profonde et gelée, que les prix futurs ne changent plus. */
export interface DevisFige extends Devis { calcule_le: string }

export function calculerDevis(config: ReservationConfig, demande: DemandeSejour): Devis {
  const n = nuits(demande.arrivee, demande.depart).length;
  const lignes: LigneDevis[] = [];

  function ajouter(id: PriceId, quantite: number, extra: { unite?: string; rule?: 'ok' | 'regle_inconnue' | 'personnes_par_chambre_manquantes' } = {}) {
    const prix = config.prices[id];
    const base = { id, quantite, prix_valide: prix.validated, ...(extra.unite ? { unite: extra.unite } : {}) };
    if (extra.rule && extra.rule !== 'ok') {
      lignes.push({ ...base, prix_unitaire_cents: prix.amount_cents, total_cents: null, statut: 'a_confirmer', raison: extra.rule });
    } else if (prix.amount_cents === null) {
      lignes.push({ ...base, prix_unitaire_cents: null, total_cents: null, statut: 'a_confirmer', raison: 'montant_inconnu' });
    } else if (prix.unit === 'included') {
      lignes.push({ ...base, prix_unitaire_cents: 0, total_cents: 0, statut: 'incluse' });
    } else if (prix.unit === null) {
      lignes.push({ ...base, prix_unitaire_cents: prix.amount_cents, total_cents: null, statut: 'a_confirmer', raison: 'unite_inconnue' });
    } else {
      lignes.push({ ...base, prix_unitaire_cents: prix.amount_cents, total_cents: prix.amount_cents * quantite, statut: 'calculee' });
    }
  }

  // Chambres : par chambre et par nuit, ou par personne et par nuit, selon la règle confirmée.
  for (const chambre of demande.chambres) {
    const priceId = config.units[chambre].price;
    const mode = config.quote.room_pricing;
    if (mode === null) ajouter(priceId, n, { unite: chambre, rule: 'regle_inconnue' });
    else if (mode === 'per_room_night') ajouter(priceId, n, { unite: chambre, rule: 'ok' });
    else {
      const personnes = demande.personnesParChambre?.[chambre];
      if (personnes === undefined) ajouter(priceId, n, { unite: chambre, rule: 'personnes_par_chambre_manquantes' });
      else ajouter(priceId, n * personnes, { unite: chambre, rule: 'ok' });
    }
  }

  if (demande.litsDortoir > 0) {
    ajouter('dortoir', demande.litsDortoir * n);
    const draps = config.quote.sheets_pricing;
    if (draps === null) ajouter('draps_dortoir', demande.litsDortoir, { rule: 'regle_inconnue' });
    else ajouter('draps_dortoir', draps === 'per_bed_stay' ? demande.litsDortoir : demande.litsDortoir * n);
  }

  // Le petit-déjeuner est compris dans l’hébergement : une ligne informative, à zéro.
  if (demande.chambres.length > 0 || demande.litsDortoir > 0) ajouter('petit_dejeuner', 1);

  const diners = (demande.diners ?? []).reduce((total, r) => total + r.personnes, 0);
  if (diners > 0) ajouter('diner', diners);
  const dejeuners = (demande.dejeuners ?? []).reduce((total, r) => total + r.personnes, 0);
  if (dejeuners > 0) ajouter('dejeuner', dejeuners);

  if (demande.chevaux > 0) ajouter('cheval', demande.chevaux * n);

  // Forfait cavalier : exclu du devis tant qu’il n’est pas défini (cahier des charges, section 4).
  if (config.quote.rider_package_enabled && (demande.forfaitsCavalier ?? 0) > 0) {
    ajouter('forfait_cavalier', (demande.forfaitsCavalier ?? 0) * n);
  }

  // Taxe de séjour : par adulte et par nuit ; un montant inconnu n’est jamais pris pour zéro.
  ajouter('taxe_sejour', demande.adultes * n);

  const total = lignes.reduce((somme, l) => somme + (l.total_cents ?? 0), 0);
  const complet = lignes.every(l => l.statut !== 'a_confirmer');
  const pct = config.quote.deposit_percent;
  return {
    devise: 'EUR', nuits: n, lignes, total_cents: total, complet,
    provisoire: lignes.some(l => !l.prix_valide),
    acompte_cents: complet && pct !== null ? Math.floor((total * pct + 50) / 100) : null,
  };
}

function geler<T>(valeur: T): T {
  if (valeur && typeof valeur === 'object') for (const v of Object.values(valeur)) geler(v);
  return Object.freeze(valeur);
}

/** Copie indépendante du devis, horodatée et gelée : c’est elle qui est enregistrée avec la demande. */
export function figerDevis(devis: Devis, maintenant: Date): DevisFige {
  return geler({ ...structuredClone(devis), calcule_le: maintenant.toISOString() });
}
