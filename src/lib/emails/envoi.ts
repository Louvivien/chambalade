import { nettoyerEnTete } from './formats';
import type { EmailConstruit } from './modeles';
import type { ApiDeps } from '../api/types';

const URL_RESEND = 'https://api.resend.com/emails';
const ADRESSE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

export type ResultatEnvoi = { statut: 'envoye' } | { statut: 'non_configure' } | { statut: 'echec'; code: number | null };

/** Liste d’adresses séparées par des virgules, ne gardant que les adresses valides. */
export const adresses = (liste: string | undefined): string[] => (liste ?? '').split(',').map(a => a.trim()).filter(a => ADRESSE.test(a));

/**
 * Envoie un e-mail par le service Resend. Ne lève jamais d’exception : un e-mail qui échoue ne
 * doit pas faire échouer une demande ni une action, il est seulement consigné par l’appelant.
 * Sans clé ou sans expéditeur configuré, rien n’est envoyé (`non_configure`).
 */
export async function envoyerEmail(deps: ApiDeps, destinataires: string[], email: EmailConstruit, repondreA?: string): Promise<ResultatEnvoi> {
  const { EMAIL_API_KEY: cle, EMAIL_FROM: depuis } = deps.env;
  if (!cle || !depuis) return { statut: 'non_configure' };
  const to = destinataires.filter(a => ADRESSE.test(a));
  const from = nettoyerEnTete(depuis);
  if (to.length === 0 || !from) return { statut: 'echec', code: null };
  const reponse = repondreA && ADRESSE.test(repondreA) ? repondreA : undefined;
  try {
    const r = await deps.fetch(URL_RESEND, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: nettoyerEnTete(email.sujet), text: email.texte, html: email.html, ...(reponse ? { reply_to: reponse } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    return r.ok ? { statut: 'envoye' } : { statut: 'echec', code: r.status };
  } catch {
    return { statut: 'echec', code: null };
  }
}
