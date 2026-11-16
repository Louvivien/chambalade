import type { ApiDeps } from './types';

const URL_VERIFICATION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type ResultatTurnstile = 'ok' | 'refuse' | 'indisponible';

/**
 * Vérifie le jeton anti-robot auprès de Cloudflare. En cas de doute (secret absent, service
 * injoignable, réponse illisible), on refuse : jamais de contournement par défaut.
 */
export async function verifierTurnstile(deps: ApiDeps, jeton: string, ip: string | null): Promise<ResultatTurnstile> {
  const secret = deps.env.TURNSTILE_SECRET;
  if (!secret) return 'indisponible';
  try {
    const corps = new URLSearchParams({ secret, response: jeton });
    if (ip) corps.set('remoteip', ip);
    const reponse = await deps.fetch(URL_VERIFICATION, { method: 'POST', body: corps });
    if (!reponse.ok) return 'indisponible';
    const donnees = (await reponse.json()) as { success?: unknown };
    return donnees.success === true ? 'ok' : 'refuse';
  } catch {
    return 'indisponible';
  }
}
