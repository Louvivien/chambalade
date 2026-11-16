import { beforeEach, describe, expect, it } from 'vitest';
import { authentifierAdmin, viderCacheAccess } from '../../src/lib/api/access';
import { AUD, b64, claims, creerEmetteur, ENV_ACCESS, EQUIPE, fetchCertificats } from './acces';
import { creerDeps, MAINTENANT, requete } from './aide';

const avec = (jeton?: string, url = '/api/admin/demandes') => requete(url, { headers: jeton ? { 'Cf-Access-Jwt-Assertion': jeton } : {} });
beforeEach(() => viderCacheAccess());

describe('vérification du jeton Cloudflare Access', () => {
  it('accepte un jeton valide d’une personne autorisée (sans tenir compte de la casse)', async () => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk]) });
    const r = await authentifierAdmin(avec(await signer(claims(MAINTENANT, { email: 'Amaelle@Example.Invalid' }))), deps);
    expect(r).toEqual({ ok: true, email: 'amaelle@example.invalid' });
  });

  it('accepte une audience donnée sous forme de texte', async () => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk]) });
    expect((await authentifierAdmin(avec(await signer(claims(MAINTENANT, { aud: AUD }))), deps)).ok).toBe(true);
  });

  it('refuse (401) une requête sans jeton ou avec un jeton mal formé', async () => {
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([]) });
    for (const jeton of [undefined, 'abc', 'a.b', 'a.b.c.d', '!!!.!!!.!!!']) {
      const r = await authentifierAdmin(avec(jeton), deps);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reponse.status).toBe(401);
    }
  });

  it.each([
    ['jeton expiré', (m: Date) => claims(m, { exp: Math.floor(m.getTime() / 1000) - 1 }), 401],
    ['pas encore valable', (m: Date) => claims(m, { nbf: Math.floor(m.getTime() / 1000) + 600 }), 401],
    ['mauvaise audience', (m: Date) => claims(m, { aud: ['autre-application'] }), 401],
    ['audience absente', (m: Date) => claims(m, { aud: undefined }), 401],
    ['mauvais émetteur', (m: Date) => claims(m, { iss: 'https://pirate.cloudflareaccess.com' }), 401],
    ['expiration absente', (m: Date) => claims(m, { exp: undefined }), 401],
    ['personne non autorisée', (m: Date) => claims(m, { email: 'intrus@example.invalid' }), 403],
    ['e-mail absent', (m: Date) => claims(m, { email: undefined }), 403],
  ])('refuse : %s', async (_nom, fabrique, status) => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk]) });
    const r = await authentifierAdmin(avec(await signer(fabrique(MAINTENANT))), deps);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reponse.status).toBe(status);
  });

  it('refuse une signature qui n’est pas celle de Cloudflare', async () => {
    const vrai = await creerEmetteur();
    const faux = await creerEmetteur(); // même kid, autre paire de clés
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([vrai.jwk]) });
    expect((await authentifierAdmin(avec(await faux.signer(claims(MAINTENANT))), deps)).ok).toBe(false);
  });

  it('refuse un jeton dont les données ont été modifiées après signature', async () => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk]) });
    const [h, , s] = (await signer(claims(MAINTENANT, { email: 'intrus@example.invalid' }))).split('.');
    const trafique = `${h}.${b64(JSON.stringify(claims(MAINTENANT)))}.${s}`;
    expect((await authentifierAdmin(avec(trafique), deps)).ok).toBe(false);
  });

  it.each([['none'], ['HS256']])('refuse l’algorithme %s', async alg => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk]) });
    expect((await authentifierAdmin(avec(await signer(claims(MAINTENANT), { alg })), deps)).ok).toBe(false);
    const sansSignature = `${b64(JSON.stringify({ alg, typ: 'JWT', kid: 'cle-1' }))}.${b64(JSON.stringify(claims(MAINTENANT)))}.`;
    expect((await authentifierAdmin(avec(sansSignature), deps)).ok).toBe(false);
  });

  it('refuse une clé inconnue, après avoir relu les certificats une fois (rotation)', async () => {
    const { jwk } = await creerEmetteur('cle-1');
    const autre = await creerEmetteur('cle-2');
    const compteur = { appels: 0 };
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk], compteur) });
    expect((await authentifierAdmin(avec(await autre.signer(claims(MAINTENANT))), deps)).ok).toBe(false);
    expect(compteur.appels).toBe(2);
  });

  it('met les certificats en cache, et les relit à l’expiration', async () => {
    const { jwk, signer } = await creerEmetteur();
    const compteur = { appels: 0 };
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk], compteur) });
    const jeton = await signer(claims(MAINTENANT));
    await authentifierAdmin(avec(jeton), deps);
    await authentifierAdmin(avec(jeton), deps);
    expect(compteur.appels).toBe(1);
    const plusTard = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk], compteur), now: new Date(MAINTENANT.getTime() + 2 * 3_600_000) }).deps;
    await authentifierAdmin(avec(await signer(claims(plusTard.now()))), plusTard);
    expect(compteur.appels).toBe(2);
  });

  it('refuse par prudence (503) si Access n’est pas configuré ou si les certificats sont injoignables', async () => {
    const { signer } = await creerEmetteur();
    const jeton = await signer(claims(MAINTENANT));
    for (const env of [{}, { ...ENV_ACCESS, ADMIN_EMAILS: '' }, { ...ENV_ACCESS, ACCESS_AUD: undefined }, { ...ENV_ACCESS, ACCESS_TEAM_DOMAIN: '' }]) {
      const r = await authentifierAdmin(avec(jeton), creerDeps({ env }).deps);
      expect(!r.ok && r.reponse.status).toBe(503);
    }
    const injoignable = creerDeps({ env: ENV_ACCESS, fetch: async () => new Response('x', { status: 500 }) }).deps;
    const r = await authentifierAdmin(avec(jeton), injoignable);
    expect(!r.ok && r.reponse.status).toBe(503);
    expect(EQUIPE).toContain('cloudflareaccess.com');
  });

  describe('contournement de développement', () => {
    const dev = { ...ENV_ACCESS, ENVIRONMENT: 'development', ACCESS_DEV_EMAIL: 'Dev@Example.Invalid' };
    const surHote = (hote: string) => new Request(`https://${hote}/api/admin/demandes`);
    it('fonctionne seulement en développement et depuis localhost', async () => {
      const { deps } = creerDeps({ env: dev });
      expect(await authentifierAdmin(surHote('localhost'), deps)).toEqual({ ok: true, email: 'dev@example.invalid' });
      expect((await authentifierAdmin(surHote('127.0.0.1'), deps)).ok).toBe(true);
    });
    it('ne fonctionne jamais sur le vrai domaine, même si la variable est restée en place', async () => {
      const { deps } = creerDeps({ env: dev });
      const r = await authentifierAdmin(surHote('chambalade.fr'), deps);
      expect(!r.ok && r.reponse.status).toBe(401);
      const prefixe = await authentifierAdmin(surHote('localhost.chambalade.fr'), deps);
      expect(prefixe.ok).toBe(false);
    });
    it('ne fonctionne pas hors du mode « development »', async () => {
      for (const ENVIRONMENT of [undefined, 'production', 'Development ']) {
        const { deps } = creerDeps({ env: { ...dev, ENVIRONMENT } });
        expect((await authentifierAdmin(surHote('localhost'), deps)).ok).toBe(false);
      }
    });
  });
});
