import type { ApiDeps } from './types';

async function condense(valeur: string): Promise<string> {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valeur));
  return [...new Uint8Array(octets)].map(o => o.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/** Adresse IP du visiteur telle que Cloudflare la transmet ; null hors Cloudflare (développement local). */
export const adresseIp = (request: Request) => request.headers.get('CF-Connecting-IP');

export interface Limite { autorise: boolean; compteur: number; reessayerDans: number }

/**
 * Compte une tentative pour cette adresse IP dans l’heure UTC en cours. L’adresse n’est jamais
 * stockée : seulement un condensé salé. Chaque tentative compte, réussie ou non.
 */
export async function compterTentative(deps: ApiDeps, ip: string | null): Promise<Limite> {
  const maintenant = deps.now();
  const fenetre = maintenant.toISOString().slice(0, 13);
  const cle = await condense(`${deps.env.RATE_LIMIT_SALT ?? ''}|${ip ?? 'inconnue'}`);
  const [, resultat] = await deps.env.DB.batch([
    deps.env.DB.prepare('DELETE FROM limites WHERE fenetre < ?').bind(fenetre),
    deps.env.DB.prepare('INSERT INTO limites (cle, fenetre, compteur) VALUES (?, ?, 1) ON CONFLICT (cle, fenetre) DO UPDATE SET compteur = compteur + 1 RETURNING compteur').bind(cle, fenetre),
  ]);
  const compteur = Number((resultat.results[0] as { compteur: number }).compteur);
  const finDeFenetre = Date.parse(`${fenetre}:00:00.000Z`) + 3_600_000;
  return { autorise: compteur <= deps.config.api.rate_limit_per_hour, compteur, reessayerDans: Math.max(1, Math.ceil((finDeFenetre - maintenant.getTime()) / 1000)) };
}
