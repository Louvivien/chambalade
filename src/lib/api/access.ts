import { erreur } from './http';
import type { ApiDeps } from './types';

// Vérification, dans la fonction elle-même, du jeton que Cloudflare Access ajoute à chaque
// requête vers /admin/ et /api/admin/. La configuration d’Access ne suffit pas : si elle était
// désactivée ou contournée, la fonction refuserait quand même toute requête sans jeton valide.

interface Jwk { kid?: string; kty: string; n?: string; e?: string; alg?: string; [autre: string]: unknown }
const cache = new Map<string, { cles: Jwk[]; jusqua: number }>();
/** Pour les tests. */
export const viderCacheAccess = () => cache.clear();

const decoderBase64Url = (valeur: string): Uint8Array<ArrayBuffer> => {
  const b64 = valeur.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(valeur.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
};
const decoderJson = <T>(valeur: string): T => JSON.parse(new TextDecoder().decode(decoderBase64Url(valeur))) as T;

async function cles(deps: ApiDeps, equipe: string, forcer: boolean): Promise<Jwk[]> {
  const maintenant = deps.now().getTime();
  const connu = cache.get(equipe);
  if (!forcer && connu && connu.jusqua > maintenant) return connu.cles;
  const reponse = await deps.fetch(`https://${equipe}/cdn-cgi/access/certs`);
  if (!reponse.ok) throw new Error('certificats indisponibles');
  const { keys } = (await reponse.json()) as { keys: Jwk[] };
  cache.set(equipe, { cles: keys, jusqua: maintenant + 3_600_000 });
  return keys;
}

export type Authentification = { ok: true; email: string } | { ok: false; reponse: Response };

const refus = (status: number, code: string, message: string): Authentification => ({ ok: false, reponse: erreur(status, code, message) });

export async function authentifierAdmin(request: Request, deps: ApiDeps): Promise<Authentification> {
  const { env } = deps;

  // Développement local uniquement : jamais sur un autre nom d’hôte, jamais sans ENVIRONMENT=development.
  const hote = new URL(request.url).hostname;
  if (env.ENVIRONMENT === 'development' && (hote === 'localhost' || hote === '127.0.0.1') && env.ACCESS_DEV_EMAIL) {
    return { ok: true, email: env.ACCESS_DEV_EMAIL.toLowerCase() };
  }

  const equipe = (env.ACCESS_TEAM_DOMAIN ?? '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const autorises = (env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!equipe || !env.ACCESS_AUD || autorises.length === 0) return refus(503, 'acces_non_configure', 'L’accès à l’administration n’est pas configuré.');

  const jeton = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jeton) return refus(401, 'non_authentifie', 'Connexion requise.');
  const morceaux = jeton.split('.');
  if (morceaux.length !== 3) return refus(401, 'non_authentifie', 'Connexion requise.');

  try {
    const entete = decoderJson<{ alg?: string; kid?: string }>(morceaux[0]);
    // Seule la signature asymétrique de Cloudflare est acceptée : ni « none », ni HS256.
    if (entete.alg !== 'RS256' || !entete.kid) return refus(401, 'non_authentifie', 'Connexion requise.');

    let jwk = (await cles(deps, equipe, false)).find(k => k.kid === entete.kid);
    if (!jwk) jwk = (await cles(deps, equipe, true)).find(k => k.kid === entete.kid); // rotation des clés
    if (!jwk || jwk.kty !== 'RSA') return refus(401, 'non_authentifie', 'Connexion requise.');

    const cle = await crypto.subtle.importKey('jwk', jwk as JsonWebKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signeOk = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cle, decoderBase64Url(morceaux[2]), new TextEncoder().encode(`${morceaux[0]}.${morceaux[1]}`));
    if (!signeOk) return refus(401, 'non_authentifie', 'Connexion requise.');

    const c = decoderJson<{ iss?: string; aud?: string | string[]; exp?: number; nbf?: number; email?: string }>(morceaux[1]);
    const maintenant = deps.now().getTime() / 1000;
    const audiences = Array.isArray(c.aud) ? c.aud : c.aud ? [c.aud] : [];
    if (c.iss !== `https://${equipe}` || !audiences.includes(env.ACCESS_AUD)) return refus(401, 'non_authentifie', 'Connexion requise.');
    if (typeof c.exp !== 'number' || c.exp <= maintenant || (typeof c.nbf === 'number' && c.nbf > maintenant)) return refus(401, 'session_expiree', 'Votre connexion a expiré. Rechargez la page.');
    const email = (c.email ?? '').toLowerCase();
    if (!email || !autorises.includes(email)) return refus(403, 'non_autorise', 'Ce compte n’a pas accès à l’administration.');
    return { ok: true, email };
  } catch (e) {
    // Jeton illisible ou service de certificats indisponible : on refuse, sans détail ni donnée personnelle.
    const indisponible = e instanceof Error && e.message === 'certificats indisponibles';
    console.error('acces_echec', e instanceof Error ? e.name : 'inconnue');
    return indisponible ? refus(503, 'acces_indisponible', 'La vérification de la connexion est momentanément indisponible.') : refus(401, 'non_authentifie', 'Connexion requise.');
  }
}
