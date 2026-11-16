import type { creerClient } from '../../lib/admin/api';

/** Ce que reçoit chaque vue : les textes, le client d’API et de quoi annoncer ou signaler une erreur. */
export interface ContexteAdmin {
  text: Record<string, any>;
  api: ReturnType<typeof creerClient>;
  /** Annonce un message aux lecteurs d’écran (zone « status »). */
  annoncer: (message: string) => void;
  /** Change de vue (adresse après le #). */
  aller: (hash: string) => void;
  /** Adresse e-mail de la personne connectée. */
  email: string;
}
export type Montage = (zone: HTMLElement, ctx: ContexteAdmin, params: Record<string, string | number | null>) => Promise<void>;
