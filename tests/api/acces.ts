import type { ApiEnv } from '../../src/lib/api/types';

/** Émetteur de jetons Cloudflare Access factices, signés avec une vraie paire de clés RSA. */
export const EQUIPE = 'chambalade-test.cloudflareaccess.com';
export const AUD = 'aud-de-test';
export const ENV_ACCESS: Partial<ApiEnv> = { ACCESS_TEAM_DOMAIN: EQUIPE, ACCESS_AUD: AUD, ADMIN_EMAILS: 'amaelle@example.invalid, vivien@example.invalid' };

const b64 = (octets: Uint8Array | string) => {
  const brut = typeof octets === 'string' ? new TextEncoder().encode(octets) : octets;
  return btoa(String.fromCharCode(...brut)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export async function creerEmetteur(kid = 'cle-1') {
  const paire = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', paire.publicKey)), kid, alg: 'RS256', use: 'sig' };
  async function signer(claims: Record<string, unknown>, entete: Record<string, unknown> = {}) {
    const h = b64(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT', ...entete }));
    const p = b64(JSON.stringify(claims));
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', paire.privateKey, new TextEncoder().encode(`${h}.${p}`)));
    return `${h}.${p}.${b64(sig)}`;
  }
  return { jwk, signer };
}

export const claims = (maintenant: Date, over: Record<string, unknown> = {}) => ({
  iss: `https://${EQUIPE}`, aud: [AUD], email: 'amaelle@example.invalid',
  iat: Math.floor(maintenant.getTime() / 1000) - 60, exp: Math.floor(maintenant.getTime() / 1000) + 3600, ...over,
});

export const fetchCertificats = (jwks: unknown[], compteur = { appels: 0 }) =>
  (async (url: string | URL | Request) => {
    compteur.appels += 1;
    expectUrl(String(url));
    return new Response(JSON.stringify({ keys: jwks }), { status: 200 });
  }) as unknown as typeof fetch;

function expectUrl(url: string) {
  if (url !== `https://${EQUIPE}/cdn-cgi/access/certs`) throw new Error(`URL inattendue : ${url}`);
}
export { b64 };
