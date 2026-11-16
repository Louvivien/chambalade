import { estDateValide, joursEntre, nuits } from '../reservation/dates';
import { disponibilite } from '../reservation/disponibilites';
import { unitIds } from '../reservation/config';
import { erreur, json, methodeNonAutorisee } from './http';
import { chargerInstantane } from './instantane';
import type { ApiDeps } from './types';

/** GET /api/disponibilites?du=AAAA-MM-JJ&au=AAAA-MM-JJ : places libres par unité et par nuit, `au` exclu. */
export async function gererDisponibilites(request: Request, deps: ApiDeps): Promise<Response> {
  const refus = methodeNonAutorisee(request, ['GET']);
  if (refus) return refus;
  const url = new URL(request.url);
  const du = url.searchParams.get('du') ?? '';
  const au = url.searchParams.get('au') ?? '';
  if (!estDateValide(du) || !estDateValide(au)) return erreur(400, 'dates_invalides', 'Indiquez deux dates valides (du et au) au format AAAA-MM-JJ.');
  const jours = joursEntre(du, au);
  if (jours < 1) return erreur(400, 'periode_invalide', 'La date de fin doit être après la date de début.');
  const max = deps.config.api.availability_max_days;
  if (jours > max) return erreur(400, 'periode_trop_longue', `La période ne peut pas dépasser ${max} jours.`);

  const maintenant = deps.now();
  const instantane = await chargerInstantane(deps.env.DB, du, au);
  const lignes = nuits(du, au).map(nuit => ({
    nuit,
    libres: Object.fromEntries(unitIds.map(unite => [unite, disponibilite(deps.config, instantane, maintenant, unite, nuit).libre])),
  }));
  return json({
    ok: true, du, au,
    // Capacité de chaque unité (1 pour une chambre) ; null tant qu’elle est inconnue.
    capacites: Object.fromEntries(unitIds.map(unite => [unite, disponibilite(deps.config, instantane, maintenant, unite, du).capacite])),
    nuits: lignes,
  });
}

