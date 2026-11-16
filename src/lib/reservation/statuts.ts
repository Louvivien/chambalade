import type { ReservationConfig } from './config';
import type { DemandeEtat, Statut } from './types';

/** Statut réel d’une demande à un instant donné : l’expiration se calcule à la lecture. */
export function statutEffectif(demande: DemandeEtat, maintenant: Date): Statut {
  const delai = demande.statut === 'en_attente' || demande.statut === 'acceptee';
  if (delai && demande.expire_at !== null && Date.parse(demande.expire_at) <= maintenant.getTime()) return 'expiree';
  return demande.statut;
}

/** Une demande bloque les dates tant qu’elle est en attente, acceptée ou confirmée, et non expirée. */
export function bloqueLesDates(demande: DemandeEtat, maintenant: Date): boolean {
  const statut = statutEffectif(demande, maintenant);
  return statut === 'en_attente' || statut === 'acceptee' || statut === 'confirmee';
}

/** Fin du blocage provisoire à partir de l’instant où la demande entre dans ce statut. */
export function finDeBlocage(statut: Statut, depuis: Date, config: ReservationConfig): string | null {
  if (statut === 'en_attente') return new Date(depuis.getTime() + config.holds.pending_hours * 3_600_000).toISOString();
  if (statut === 'acceptee') return new Date(depuis.getTime() + config.holds.accepted_days * 86_400_000).toISOString();
  return null;
}

/** Des demandes qui ont dépassé leur délai et dont le statut en base doit passer à « expiree ». */
export function demandesAExpirer(demandes: DemandeEtat[], maintenant: Date): DemandeEtat[] {
  return demandes.filter(d => d.statut !== statutEffectif(d, maintenant));
}
