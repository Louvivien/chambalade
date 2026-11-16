import { describe, expect, it, vi } from 'vitest';
import { creerClient, ErreurApi, type TextesErreursAdmin } from '../../src/lib/admin/api';
import { hashDe, lireVue, ongletDe, type Vue } from '../../src/lib/admin/routes';

const t: TextesErreursAdmin = { unauthenticated: 'Connexion expirée.', forbidden: 'Pas d’accès.', notConfigured: 'Pas configuré.', network: 'Réseau.', server: 'Erreur.', notFound: 'Introuvable.', conflict: 'Conflit.' };
const reponse = (status: number, corps: unknown) => new Response(JSON.stringify(corps), { status });
const echec = async (promesse: Promise<unknown>) => promesse.then(() => { throw new Error('devait échouer'); }, (e: unknown) => e as ErreurApi);

describe('routes de l’administration', () => {
  it.each<[string, Vue]>([
    ['', { vue: 'demandes' }], ['#', { vue: 'demandes' }], ['#demandes', { vue: 'demandes' }], ['#nimporte', { vue: 'demandes' }],
    ['#demande-12', { vue: 'fiche', id: 12 }], ['#calendrier', { vue: 'calendrier', mois: null }], ['#calendrier-2027-05', { vue: 'calendrier', mois: '2027-05' }],
    ['#blocages', { vue: 'blocages' }],
  ])('lit %j', (hash, attendu) => expect(lireVue(hash)).toEqual(attendu));
  it.each(['#demande-', '#demande-abc', '#demande-12;x', '#calendrier-2027-13', '#calendrier-2027-5', '#demande-1234567890'])('retombe sur la liste pour %j', hash => {
    expect(lireVue(hash)).toEqual({ vue: 'demandes' });
  });
  it('écrit et relit la même vue', () => {
    for (const v of [{ vue: 'demandes' }, { vue: 'fiche', id: 7 }, { vue: 'calendrier', mois: '2028-01' }, { vue: 'calendrier', mois: null }, { vue: 'blocages' }] as Vue[]) expect(lireVue(hashDe(v))).toEqual(v);
  });
  it('la fiche appartient à l’onglet « Demandes »', () => {
    expect(ongletDe({ vue: 'fiche', id: 1 })).toBe('demandes');
    expect(ongletDe({ vue: 'blocages' })).toBe('blocages');
  });
});

describe('client de l’API d’administration', () => {
  it('envoie la bonne requête et rend la réponse', async () => {
    const f = vi.fn(async () => reponse(200, { ok: true, demandes: [] }));
    const appeler = creerClient(f as unknown as typeof fetch, t);
    expect(await appeler('GET', 'demandes?statut=en_attente')).toEqual({ ok: true, demandes: [] });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/admin/demandes?statut=en_attente');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.credentials).toBe('same-origin');
  });
  it('envoie un corps JSON pour une action', async () => {
    const f = vi.fn(async () => reponse(200, { ok: true }));
    await creerClient(f as unknown as typeof fetch, t)('POST', 'demandes/3/actions', { action: 'accepter', acompte_cents: 7650 });
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ action: 'accepter', acompte_cents: 7650 });
  });
  it.each([
    ['connexion expirée', 401, { erreur: { code: 'non_authentifie', message: 'technique' } }, 'Connexion expirée.'],
    ['compte non autorisé', 403, { erreur: { code: 'non_autorise', message: 'x' } }, 'Pas d’accès.'],
    ['origine refusée', 403, { erreur: { code: 'origine_refusee', message: 'Cette requête ne vient pas du site.' } }, 'Cette requête ne vient pas du site.'],
    ['accès non configuré', 503, { erreur: { code: 'acces_non_configure', message: 'x' } }, 'Pas configuré.'],
    ['introuvable', 404, { erreur: { code: 'introuvable', message: 'x' } }, 'Introuvable.'],
    ['transition impossible : message précis du serveur', 409, { erreur: { code: 'transition_impossible', message: 'Cette demande est « refusee » : impossible.' } }, 'Cette demande est « refusee » : impossible.'],
    ['saisie invalide : message précis', 400, { erreur: { code: 'donnees_invalides', message: 'Cette action n’est pas valide.' } }, 'Cette action n’est pas valide.'],
    ['erreur du serveur : jamais le détail', 500, { erreur: { code: 'erreur_interne', message: 'détail technique' } }, 'Erreur.'],
  ])('%s', async (_nom, status, corps, attendu) => {
    const e = await echec(creerClient((async () => reponse(status, corps)) as unknown as typeof fetch, t)('GET', 'x'));
    expect(e).toBeInstanceOf(ErreurApi);
    expect(e.message).toBe(attendu);
    expect(e.status).toBe(status);
  });
  it('réseau coupé et réponse illisible', async () => {
    const coupe = await echec(creerClient((async () => { throw new TypeError('fetch'); }) as unknown as typeof fetch, t)('GET', 'x'));
    expect([coupe.message, coupe.status, coupe.code]).toEqual(['Réseau.', null, 'reseau']);
    const html = await echec(creerClient((async () => new Response('<html>502</html>', { status: 502 })) as unknown as typeof fetch, t)('GET', 'x'));
    expect([html.message, html.status]).toEqual(['Erreur.', 502]);
  });
});
