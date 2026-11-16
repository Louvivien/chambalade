import { dateParis } from '../reservation/dates';
import { calculerDevis } from '../reservation/devis';
import { validerSejour, verifierDisponibilites } from '../reservation/disponibilites';
import { erreur, json, lireJson, methodeNonAutorisee } from './http';
import { chargerInstantane } from './instantane';
import { messageDeValidation, sejourDe, sejourSchema } from './schemas';
import type { ApiDeps } from './types';

/**
 * POST /api/devis : devis recalculé côté serveur à partir de la seule configuration.
 * Les montants éventuellement envoyés par le navigateur sont ignorés. Le devis est indicatif :
 * la disponibilité est signalée, mais seule la création d’une demande la garantit.
 */
export async function gererDevis(request: Request, deps: ApiDeps): Promise<Response> {
  const refus = methodeNonAutorisee(request, ['POST']);
  if (refus) return refus;
  const lecture = await lireJson(request);
  if (!lecture.ok) return lecture.reponse;
  const analyse = sejourSchema.safeParse(lecture.donnees);
  if (!analyse.success) return erreur(400, 'donnees_invalides', messageDeValidation(analyse.error).message, { champ: messageDeValidation(analyse.error).champ });
  const sejour = sejourDe(analyse.data);

  const maintenant = deps.now();
  const erreursSejour = validerSejour(deps.config, sejour, dateParis(maintenant));
  if (erreursSejour.length > 0) return json({ ok: false, erreurs: erreursSejour }, 422);

  const instantane = await chargerInstantane(deps.env.DB, sejour.arrivee, sejour.depart);
  const indisponibilites = verifierDisponibilites(deps.config, instantane, maintenant, sejour);
  return json({ ok: true, devis: calculerDevis(deps.config, sejour), disponibilite: { ok: indisponibilites.length === 0, erreurs: indisponibilites } });
}
