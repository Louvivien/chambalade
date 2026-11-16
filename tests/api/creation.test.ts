import { describe, expect, it, vi } from 'vitest';
import { enregistrerDemande, gererCreationDemande } from '../../src/lib/api/creation';
import { expirerDemandes } from '../../src/lib/api/expiration';
import { chargerInstantane } from '../../src/lib/api/instantane';
import { preparerDemande } from '../../src/lib/reservation/demande';
import type { DemandeSejour } from '../../src/lib/reservation/types';
import { testConfig } from '../reservation/config-test';
import { creerDeps, inserer, MAINTENANT, postJson } from './aide';

const sejour = (over: Partial<DemandeSejour> = {}): DemandeSejour => ({
  arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 0, chambres: ['chambre_2'], litsDortoir: 0, ...over,
});
const contact = { nom: 'Martin', prenom: 'Claire', email: 'claire@example.invalid', telephone: '0600000000', message: 'Bonjour' };
const corps = (s: DemandeSejour = sejour(), extra: Record<string, unknown> = {}) => ({ sejour: s, contact, langue: 'fr', consentement: true, turnstile_token: 'jeton-test', ...extra });
const turnstileOk = () => vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
const IP = '203.0.113.7';
const env = { TURNSTILE_SECRET: 'secret-de-test', RATE_LIMIT_SALT: 'sel-de-test' };
const creer = (deps: ReturnType<typeof creerDeps>['deps'], donnees: unknown = corps(), entetes: Record<string, string> = { 'CF-Connecting-IP': IP }) =>
  gererCreationDemande(postJson('/api/demandes', donnees, entetes), deps);
const compte = (db: ReturnType<typeof creerDeps>['db'], table: string) => Number((db.sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n);
const prepare = (s: DemandeSejour) => {
  const { deps } = creerDeps();
  return { deps, prep: preparerDemande(deps.config, { demandes: [], occupations: [], blocages: [] }, MAINTENANT, s) };
};

describe('création d’une demande', () => {
  it('enregistre demande, occupations et journal, et renvoie la référence et le devis', async () => {
    const fetchOk = turnstileOk();
    const { db, deps } = creerDeps({ env, fetch: fetchOk });
    const r = await creer(deps, corps(sejour({ chevaux: 1 })));
    expect(r.status).toBe(201);
    const rep = await r.json();
    expect(rep).toMatchObject({ ok: true, reference: 'CHB-2027-0001', statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z' });
    expect(rep.devis.total_cents).toBe(22500 + 3000 + 900);

    const d = db.sqlite.prepare('SELECT * FROM demandes').get() as Record<string, unknown>;
    expect(d).toMatchObject({ reference: 'CHB-2027-0001', statut: 'en_attente', date_arrivee: '2027-05-10', date_depart: '2027-05-13', nb_adultes: 2, nb_chevaux: 1, langue: 'fr', nom: 'Martin', email: 'claire@example.invalid', expire_at: '2027-03-03T10:00:00.000Z' });
    expect(JSON.parse(d.devis as string)).toEqual(rep.devis);
    expect(JSON.parse(d.choix as string).chambres).toEqual(['chambre_2']);
    expect(compte(db, 'occupations')).toBe(6);
    // Sans service d’e-mail configuré, les deux e-mails sont consignés comme ignorés (sans adresse).
    expect(db.sqlite.prepare("SELECT action, auteur, detail FROM journal").all()).toEqual(expect.arrayContaining([
      { action: 'demande_creee', auteur: 'cliente', detail: null },
      { action: 'email_ignore', auteur: 'systeme', detail: 'recue' },
      { action: 'email_ignore', auteur: 'systeme', detail: 'nouvelle' },
    ]));
  });

  it('la réponse ne renvoie aucune donnée personnelle', async () => {
    const { deps } = creerDeps({ env, fetch: turnstileOk() });
    const texte = await (await creer(deps)).text();
    for (const secret of ['Martin', 'Claire', 'claire@example.invalid', '0600000000', 'Bonjour']) expect(texte).not.toContain(secret);
  });

  it('numérote les références dans l’ordre et repart de 0001 chaque année', async () => {
    const { deps } = creerDeps({ env, fetch: turnstileOk() });
    expect((await (await creer(deps, corps(sejour({ chambres: ['chambre_2'] })))).json()).reference).toBe('CHB-2027-0001');
    expect((await (await creer(deps, corps(sejour({ chambres: ['chambre_3'] })))).json()).reference).toBe('CHB-2027-0002');
    const { deps: deps2 } = creerDeps({ env, fetch: turnstileOk(), now: new Date('2028-01-05T10:00:00Z') });
    expect((await (await creer(deps2, corps(sejour({ arrivee: '2028-05-10', depart: '2028-05-12' })))).json()).reference).toBe('CHB-2028-0001');
  });

  it('ignore le devis, les montants et le statut envoyés par le navigateur', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    const r = await creer(deps, { ...corps(), devis: { total_cents: 1 }, total_cents: 1, statut: 'confirmee', reference: 'CHB-9999-0001' });
    const rep = await r.json();
    expect(rep.devis.total_cents).toBe(22500 + 900);
    expect(rep.reference).toBe('CHB-2027-0001');
    expect((db.sqlite.prepare('SELECT statut FROM demandes').get() as { statut: string }).statut).toBe('en_attente');
  });

  it.each([
    ['sans consentement', () => corps(sejour(), { consentement: false }), 'consentement'],
    ['sans consentement du tout', () => { const c = corps() as Record<string, unknown>; delete c.consentement; return c; }, 'consentement'],
    ['e-mail invalide', () => ({ ...corps(), contact: { ...contact, email: 'pas-un-email' } }), 'e-mail'],
    ['nom vide', () => ({ ...corps(), contact: { ...contact, nom: '   ' } }), 'nom'],
    ['message trop long', () => ({ ...corps(), contact: { ...contact, message: 'a'.repeat(2001) } }), 'message'],
    ['langue inconnue', () => corps(sejour(), { langue: 'de' }), 'langue'],
  ])('refuse une demande invalide (400) : %s', async (_nom, fabrique, partie) => {
    const fetchOk = turnstileOk();
    const { db, deps } = creerDeps({ env, fetch: fetchOk });
    const r = await creer(deps, fabrique());
    expect(r.status).toBe(400);
    expect((await r.json()).erreur.message.toLowerCase()).toContain(partie);
    expect(compte(db, 'demandes')).toBe(0);
    expect(fetchOk).not.toHaveBeenCalled(); // le jeton Turnstile n’est pas consommé pour rien
  });

  it('refuse un séjour hors règles (422) et une indisponibilité (409), sans rien écrire', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    const court = await creer(deps, corps(sejour({ depart: '2027-05-10' })));
    expect(court.status).toBe(422);
    inserer(db, { arrivee: '2027-05-11', depart: '2027-05-12', unites: [['chambre_2', 1]] });
    const pris = await creer(deps);
    expect(pris.status).toBe(409);
    expect((await pris.json()).erreurs[0].message).toBe('La chambre 2 n’est pas disponible la nuit du 11 mai.');
    expect(compte(db, 'demandes')).toBe(1); // seulement celle insérée par le test
    expect(compte(db, 'journal')).toBe(0);
  });

  it('refuse les chevaux tant que la capacité des paddocks est inconnue (409)', async () => {
    const config = testConfig();
    config.units.paddocks.capacity_horses = null;
    const { db, deps } = creerDeps({ env, fetch: turnstileOk(), config });
    const r = await creer(deps, corps(sejour({ chevaux: 1 })));
    expect(r.status).toBe(409);
    expect((await r.json()).erreurs[0].code).toBe('capacite_inconnue');
    expect(compte(db, 'demandes')).toBe(0);
  });

  it('refuse une autre origine, une autre méthode, un corps invalide', async () => {
    const { deps } = creerDeps({ env, fetch: turnstileOk() });
    expect((await creer(deps, corps(), { 'CF-Connecting-IP': IP, Origin: 'https://autre.example' })).status).toBe(403);
    expect((await gererCreationDemande(new Request('https://chambalade.fr/api/demandes'), deps)).status).toBe(405);
    expect((await creer(deps, 'texte')).status).toBe(400);
  });
});

describe('Turnstile', () => {
  it('appelle la vérification Cloudflare avec le secret, le jeton et l’adresse IP', async () => {
    const f = turnstileOk();
    const { deps } = creerDeps({ env, fetch: f });
    await creer(deps);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const envoye = new URLSearchParams((init.body as URLSearchParams).toString());
    expect(Object.fromEntries(envoye)).toEqual({ secret: 'secret-de-test', response: 'jeton-test', remoteip: IP });
  });

  it('refuse (403) un jeton rejeté, sans rien écrire', async () => {
    const { db, deps } = creerDeps({ env, fetch: async () => new Response(JSON.stringify({ success: false }), { status: 200 }) });
    const r = await creer(deps);
    expect(r.status).toBe(403);
    expect((await r.json()).erreur.code).toBe('verification_echouee');
    expect(compte(db, 'demandes')).toBe(0);
  });

  it.each([
    ['service injoignable', { env, fetch: async () => { throw new Error('réseau'); } }],
    ['réponse en erreur', { env, fetch: async () => new Response('x', { status: 500 }) }],
    ['réponse illisible', { env, fetch: async () => new Response('pas du json', { status: 200 }) }],
    ['secret non configuré', { env: { RATE_LIMIT_SALT: 'x' }, fetch: turnstileOk() }],
  ])('refuse par prudence (503) : %s', async (_nom, over) => {
    const { db, deps } = creerDeps(over);
    const r = await creer(deps);
    expect(r.status).toBe(503);
    expect(compte(db, 'demandes')).toBe(0);
  });
});

describe('limitation par adresse IP', () => {
  it('refuse après la limite (429) avec Retry-After, mais pas une autre adresse', async () => {
    const { deps } = creerDeps({ env, fetch: turnstileOk() });
    for (let i = 0; i < 5; i++) expect((await creer(deps, corps(sejour({ chambres: ['chambre_2'], arrivee: `2027-06-${10 + i}`, depart: `2027-06-${11 + i}` })))).status).toBe(201);
    const sixieme = await creer(deps);
    expect(sixieme.status).toBe(429);
    // Il est 10 h pile : la fenêtre d’une heure se termine dans 3 600 secondes.
    expect(Number(sixieme.headers.get('Retry-After'))).toBe(3600);
    expect((await creer(deps, corps(), { 'CF-Connecting-IP': '198.51.100.9' })).status).toBe(201);
  });

  it('compte aussi les demandes invalides, puis repart à zéro à l’heure suivante', async () => {
    const f = turnstileOk();
    const { db, deps } = creerDeps({ env, fetch: f });
    for (let i = 0; i < 5; i++) expect((await creer(deps, { ...corps(), consentement: false })).status).toBe(400);
    expect((await creer(deps)).status).toBe(429);
    const plusTard = creerDeps({ env, fetch: f, db, now: new Date(MAINTENANT.getTime() + 3_600_000) });
    expect((await creer(plusTard.deps)).status).toBe(201);
    expect(compte(db, 'limites')).toBe(1); // l’ancienne fenêtre est supprimée
  });

  it('ne stocke jamais l’adresse IP, seulement un condensé salé', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    await creer(deps);
    const lignes = db.sqlite.prepare('SELECT cle FROM limites').all() as Array<{ cle: string }>;
    expect(lignes).toHaveLength(1);
    expect(lignes[0].cle).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(db.sqlite.prepare('SELECT * FROM demandes').all())).not.toContain(IP);
    const autreSel = creerDeps({ env: { ...env, RATE_LIMIT_SALT: 'autre-sel' }, fetch: turnstileOk() });
    await creer(autreSel.deps);
    expect((autreSel.db.sqlite.prepare('SELECT cle FROM limites').get() as { cle: string }).cle).not.toBe(lignes[0].cle);
  });
});

describe('expiration à la lecture', () => {
  it('une demande dont le délai est dépassé libère la place et passe à « expiree » avec une trace', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk(), now: new Date('2027-03-05T00:00:00Z') });
    const ancien = inserer(db, { statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z', arrivee: '2027-05-10', depart: '2027-05-13', unites: [['chambre_2', 1]] });
    const r = await creer(deps);
    expect(r.status).toBe(201);
    expect((db.sqlite.prepare('SELECT statut FROM demandes WHERE id = ?').get(ancien) as { statut: string }).statut).toBe('expiree');
    expect(db.sqlite.prepare("SELECT action, auteur FROM journal WHERE demande_id = ? AND action = 'expiree'").all(ancien)).toEqual([{ action: 'expiree', auteur: 'systeme' }]);
  });

  it('expirerDemandes ne touche ni les demandes confirmées ni celles dont le délai court encore', async () => {
    const { db } = creerDeps();
    const vivante = inserer(db, { statut: 'acceptee', expire_at: '2027-03-08T10:00:00.000Z', arrivee: '2027-05-10', depart: '2027-05-11', unites: [['chambre_2', 1]] });
    const confirmee = inserer(db, { statut: 'confirmee', expire_at: null, arrivee: '2027-05-10', depart: '2027-05-11', unites: [['chambre_3', 1]] });
    const perimee = inserer(db, { statut: 'acceptee', expire_at: '2027-03-01T09:00:00.000Z', arrivee: '2027-05-10', depart: '2027-05-11', unites: [['dortoir', 1]] });
    expect(await expirerDemandes(db, MAINTENANT)).toBe(1);
    const statuts = Object.fromEntries((db.sqlite.prepare('SELECT id, statut FROM demandes').all() as Array<{ id: number; statut: string }>).map(x => [x.id, x.statut]));
    expect(statuts).toEqual({ [vivante]: 'acceptee', [confirmee]: 'confirmee', [perimee]: 'expiree' });
    expect(await expirerDemandes(db, MAINTENANT)).toBe(0);
  });
});

describe('concurrence sur la dernière place (SQL réel)', () => {
  it('deux demandes simultanées sur les 6 lits : une seule réussit, l’autre reçoit un message précis', async () => {
    const { db, deps } = creerDeps({ env: { ...env, RATE_LIMIT_SALT: 's' }, fetch: turnstileOk() });
    const quatre = sejour({ chambres: [], litsDortoir: 4, adultes: 4 });
    const [a, b] = await Promise.all([creer(deps, corps(quatre), { 'CF-Connecting-IP': '198.51.100.1' }), creer(deps, corps(quatre), { 'CF-Connecting-IP': '198.51.100.2' })]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const perdante = a.status === 409 ? a : b;
    expect((await perdante.json()).erreurs[0].message).toBe('Le dortoir n’a plus que 2 lits libres la nuit du 10 mai.');
    expect(compte(db, 'demandes')).toBe(1);
    const parNuit = db.sqlite.prepare("SELECT nuit, SUM(quantite) AS total FROM occupations WHERE unite = 'dortoir' GROUP BY nuit").all() as Array<{ total: number }>;
    expect(parNuit.every(n => n.total <= 6)).toBe(true);
  });

  it('la vérification faite avant ne suffit pas : l’insertion gardée refuse une décision périmée', async () => {
    const { deps, prep: premiere } = prepare(sejour({ chambres: [], litsDortoir: 4, adultes: 4 }));
    const seconde = prepare(sejour({ chambres: [], litsDortoir: 4, adultes: 4 })).prep;
    if (!premiere.ok || !seconde.ok) throw new Error('les deux vérifications préalables passent sur une base vide');
    const s = sejour({ chambres: [], litsDortoir: 4, adultes: 4 });
    const a = await enregistrerDemande(deps, { sejour: s, contact, langue: 'fr', devis: premiere.devis, expire_at: premiere.expire_at });
    const b = await enregistrerDemande(deps, { sejour: s, contact, langue: 'fr', devis: seconde.devis, expire_at: seconde.expire_at });
    expect(a.ok).toBe(true);
    expect(b).toEqual({ ok: false, raison: 'conflit' });
    expect(compte(deps.env.DB as ReturnType<typeof creerDeps>['db'], 'demandes')).toBe(1);
    expect(compte(deps.env.DB as ReturnType<typeof creerDeps>['db'], 'occupations')).toBe(3);
  });

  it('un conflit n’écrit rien : ni demande, ni occupation, ni journal', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    inserer(db, { arrivee: '2027-05-12', depart: '2027-05-13', unites: [['dortoir', 6]] });
    const avant = ['demandes', 'occupations', 'journal'].map(t => compte(db, t));
    const prep = preparerDemande(deps.config, { demandes: [], occupations: [], blocages: [] }, MAINTENANT, sejour({ chambres: [], litsDortoir: 1, adultes: 1 }));
    if (!prep.ok) throw new Error('refusée');
    const r = await enregistrerDemande(deps, { sejour: sejour({ chambres: [], litsDortoir: 1, adultes: 1 }), contact, langue: 'fr', devis: prep.devis, expire_at: prep.expire_at });
    expect(r).toEqual({ ok: false, raison: 'conflit' });
    expect(['demandes', 'occupations', 'journal'].map(t => compte(db, t))).toEqual(avant);
  });

  it('l’insertion gardée respecte aussi les blocages posés entre-temps', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    const s = sejour();
    const prep = preparerDemande(deps.config, { demandes: [], occupations: [], blocages: [] }, MAINTENANT, s);
    if (!prep.ok) throw new Error('refusée');
    db.sqlite.prepare("INSERT INTO blocages (unite, date_debut, date_fin, motif, created_at) VALUES ('toutes', '2027-05-12', '2027-05-14', 'fermeture', '2027-01-01T00:00:00Z')").run();
    expect(await enregistrerDemande(deps, { sejour: s, contact, langue: 'fr', devis: prep.devis, expire_at: prep.expire_at })).toEqual({ ok: false, raison: 'conflit' });
    // La date de fin du blocage est exclue : un séjour qui s’arrête avant reste possible.
    const court = sejour({ depart: '2027-05-12' });
    const p2 = preparerDemande(deps.config, await chargerInstantane(db, court.arrivee, court.depart), MAINTENANT, court);
    if (!p2.ok) throw new Error('refusée');
    expect((await enregistrerDemande(deps, { sejour: court, contact, langue: 'fr', devis: p2.devis, expire_at: p2.expire_at })).ok).toBe(true);
  });

  it('l’insertion gardée ignore les occupations d’une demande expirée mais pas celles d’une demande confirmée', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-01T09:00:00.000Z', arrivee: '2027-05-10', depart: '2027-05-13', unites: [['chambre_2', 1]] });
    const s = sejour();
    const p = preparerDemande(deps.config, { demandes: [], occupations: [], blocages: [] }, MAINTENANT, s);
    if (!p.ok) throw new Error('refusée');
    expect((await enregistrerDemande(deps, { sejour: s, contact, langue: 'fr', devis: p.devis, expire_at: p.expire_at })).ok).toBe(true);
    expect((await enregistrerDemande(deps, { sejour: s, contact, langue: 'fr', devis: p.devis, expire_at: p.expire_at })).ok).toBe(false);
  });

  it('gère un séjour de 14 nuits avec toutes les unités sans dépasser les limites de paramètres de D1', async () => {
    const { db, deps } = creerDeps({ env, fetch: turnstileOk() });
    const grand = sejour({ arrivee: '2027-06-01', depart: '2027-06-15', chambres: ['chambre_privee', 'chambre_2', 'chambre_3'], litsDortoir: 6, chevaux: 3, adultes: 12 });
    const r = await creer(deps, corps(grand));
    expect(r.status).toBe(201);
    expect(compte(db, 'occupations')).toBe(14 * 5);
  });
});
