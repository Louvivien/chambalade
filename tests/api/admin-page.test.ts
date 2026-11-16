import { beforeEach, describe, expect, it } from 'vitest';
import { viderCacheAccess } from '../../src/lib/api/access';
import { protegerPageAdmin } from '../../src/lib/api/admin-page';
import { claims, creerEmetteur, ENV_ACCESS, fetchCertificats } from './acces';
import { creerDeps, MAINTENANT, requete } from './aide';

beforeEach(() => viderCacheAccess());
const PAGE = '<!doctype html><title>Administration</title>';
const suite = async () => new Response(PAGE, { headers: { 'Content-Type': 'text/html' } });

describe('protection de la page /admin/ dans la fonction', () => {
  it('sans jeton : 401, et le contenu de la page n’est jamais servi', async () => {
    let appelee = false;
    const { deps } = creerDeps({ env: ENV_ACCESS });
    const r = await protegerPageAdmin(requete('/admin/'), deps, async () => { appelee = true; return suite(); });
    expect(r.status).toBe(401);
    expect(appelee).toBe(false);
    expect(await r.text()).not.toContain('Administration</title>');
    expect(r.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(r.headers.get('Content-Type')).toContain('text/html');
  });

  it.each([
    ['Access non configuré', {}, 503],
    ['personne non autorisée', { ...ENV_ACCESS, ADMIN_EMAILS: 'autre@example.invalid' }, 403],
  ])('%s : refus %s', async (_nom, env, status) => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env, fetch: fetchCertificats([jwk]) });
    const jeton = await signer(claims(MAINTENANT));
    let appelee = false;
    const r = await protegerPageAdmin(requete('/admin/', { headers: { 'Cf-Access-Jwt-Assertion': jeton } }), deps, async () => { appelee = true; return suite(); });
    expect(r.status).toBe(status);
    expect(appelee).toBe(false);
  });

  it('avec un jeton valide : sert la page, sans mise en cache, sans indexation, sans intégration', async () => {
    const { jwk, signer } = await creerEmetteur();
    const { deps } = creerDeps({ env: ENV_ACCESS, fetch: fetchCertificats([jwk]) });
    const r = await protegerPageAdmin(requete('/admin/', { headers: { 'Cf-Access-Jwt-Assertion': await signer(claims(MAINTENANT)) } }), deps, suite);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe(PAGE);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(r.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(r.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(r.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(r.headers.get('Content-Type')).toBe('text/html');
  });

  it('le contournement de développement fonctionne seulement depuis localhost', async () => {
    const env = { ...ENV_ACCESS, ENVIRONMENT: 'development', ACCESS_DEV_EMAIL: 'dev@example.invalid' };
    const { deps } = creerDeps({ env });
    expect((await protegerPageAdmin(new Request('https://localhost/admin/'), deps, suite)).status).toBe(200);
    expect((await protegerPageAdmin(new Request('https://chambalade.fr/admin/'), deps, suite)).status).toBe(401);
  });

  it('ne laisse pas passer de HTML venu du message d’erreur', async () => {
    const { deps } = creerDeps({ env: ENV_ACCESS });
    const r = await protegerPageAdmin(requete('/admin/'), deps, suite);
    expect(await r.text()).not.toMatch(/<script/i);
  });
});
