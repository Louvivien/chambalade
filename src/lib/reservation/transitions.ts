import type { Statut } from './types';

export type ActionDemande = 'accepter' | 'refuser' | 'confirmer' | 'annuler' | 'prolonger';

/**
 * Les actions possibles sur une demande : d’où l’on part et où l’on arrive (`null` : le statut ne change pas).
 * Une seule table, lue par l’API (qui fait foi) et par l’interface (qui n’affiche que les boutons utiles).
 */
export const TRANSITIONS: Record<ActionDemande, { de: readonly Statut[]; vers: Statut | null }> = {
  accepter: { de: ['en_attente'], vers: 'acceptee' },
  refuser: { de: ['en_attente'], vers: 'refusee' },
  confirmer: { de: ['acceptee'], vers: 'confirmee' },
  annuler: { de: ['acceptee', 'confirmee'], vers: 'annulee' },
  prolonger: { de: ['en_attente', 'acceptee'], vers: null },
};

export const ACTIONS: readonly ActionDemande[] = ['accepter', 'refuser', 'confirmer', 'annuler', 'prolonger'];

export const actionsPossibles = (statut: Statut): ActionDemande[] => ACTIONS.filter(a => TRANSITIONS[a].de.includes(statut));
