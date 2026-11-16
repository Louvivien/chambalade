import { dateCourte, langue, libelleNuits, remplir } from './formats';
import type { Regles } from './types';

/** Une erreur renvoyée par l’API : le code est stable, le message est en français. */
export interface ErreurApi { code?: string; message?: string; unite?: string; nuit?: string }
export interface ContexteMessages {
  /** Messages par code d’erreur, dans la langue de la page (voir `serverErrors` des contenus). */
  serverErrors: Record<string, string>;
  /** Noms des logements dans la langue de la page. */
  unitNames: Record<string, string>;
  nights: { one: string; many: string };
  regles: Pick<Regles, 'nuitsMin' | 'nuitsMax' | 'moisMax' | 'premiereNuit'>;
}

/**
 * Message à montrer à la cliente pour une erreur de l’API.
 * En français : le message du serveur. Dans une autre langue : le texte du contenu pour ce code,
 * rempli avec les règles de séjour ; null si le code est inconnu (l’appelant montre alors son message général).
 */
export function messageApi(erreur: ErreurApi, ctx: ContexteMessages): string | null {
  if (langue() === 'fr') return erreur.message && erreur.message.length > 0 ? erreur.message : null;
  const modele = erreur.code ? ctx.serverErrors[erreur.code] : undefined;
  if (!modele) return null;
  const { regles } = ctx;
  return remplir(modele, {
    night: erreur.nuit ? dateCourte(erreur.nuit) : '',
    room: (erreur.unite && ctx.unitNames[erreur.unite]) || '',
    minNights: libelleNuits(regles.nuitsMin, ctx.nights.one, ctx.nights.many),
    maxNights: libelleNuits(regles.nuitsMax, ctx.nights.one, ctx.nights.many),
    months: regles.moisMax,
    firstNight: regles.premiereNuit ? dateCourte(regles.premiereNuit) : '',
  });
}

/** Messages d’une liste d’erreurs, sans doublon et sans les erreurs que l’on ne sait pas dire. */
export const messagesApi = (erreurs: ErreurApi[], ctx: ContexteMessages): string[] =>
  [...new Set(erreurs.map(e => messageApi(e, ctx)).filter((m): m is string => m !== null))];
