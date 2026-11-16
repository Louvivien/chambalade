import { beforeEach, describe, expect, it } from 'vitest';
import { viderCacheAccess } from '../../src/lib/api/access';
import { gererAdmin } from '../../src/lib/api/admin';
import { gererDisponibilites } from '../../src/lib/api/disponibilites';
import { ENV_ACCESS } from './acces';
import { creerDeps, inserer, MAINTENANT } from './aide';

const DEV = { ...ENV_ACCESS, ENVIRONMENT: 'development', ACCESS_DEV_EMAIL: 'amaelle@example.invalid' };
beforeEach(() => viderCacheAccess());

function monter(over: Parameters<typeof creerDeps>[0] = {}) {
  const { db, deps } = creerDeps({ env: DEV, ...over });
  const appeler = (methode: string, chemin: string, corps?: unknown, entetes: Record<string, string> = {}) => {
    const [route, requete = ''] = chemin.split('?');
    const url = `https://localhost/api/admin/${route}${requete ? `?${requete}` : ''}`;
    const init: RequestInit = { method: methode, headers: { ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}), ...entetes } };
    if (corps !== undefined) init.body = typeof corps === 'string' ? corps : JSON.stringify(corps);
    return gererAdmin(new Request(url, init), deps, route.split('/').filter(Boolean));
  };
  const un = (table: string, where = '1=1', ...p: unknown[]) => db.sqlite.prepare(`SELECT * FROM ${table} WHERE ${where}`).get(...(p as never[])) as Record<string, unknown>;
  const tous = (table: string, where = '1=1', ...p: unknown[]) => db.sqlite.prepare(`SELECT * FROM ${table} WHERE ${where}`).all(...(p as never[])) as Array<Record<string, unknown>>;
  return { db, deps, appeler, un, tous };
}
const ID = (n: number) => `demandes/${n}`;

describe('protection : toute route d’administration exige l’authentification', () => {
  const routes: Array<[string, string]> = [
    ['GET', 'demandes'], ['GET', 'demandes/1'], ['POST', 'demandes/1/actions'], ['GET', 'calendrier?mois=2027-05'],
    ['GET', 'blocages'], ['POST', 'blocages'], ['DELETE', 'blocages/1'], ['GET', 'inconnue'], ['GET', ''],
  ];
  it.each(routes)('%s /api/admin/%s sans jeton : 401, et rien n’est lu ni écrit', async (methode, chemin) => {
    const { db, deps } = creerDeps({ env: ENV_ACCESS });
    inserer(db, { arrivee: '2027-05-10', depart: '2027-05-11', unites: [['chambre_2', 1]] });
    const avant = JSON.stringify(db.sqlite.prepare('SELECT * FROM demandes').all()) + JSON.stringify(db.sqlite.prepare('SELECT * FROM journal').all());
    const r = await gererAdmin(new Request(`https://chambalade.fr/api/admin/${chemin}`, { method: methode, body: methode === 'POST' ? '{}' : undefined, headers: { 'Content-Type': 'application/json' } }), deps, chemin.split('?')[0].split('/').filter(Boolean));
    expect(r.status).toBe(401);
    expect(JSON.stringify(db.sqlite.prepare('SELECT * FROM demandes').all()) + JSON.stringify(db.sqlite.prepare('SELECT * FROM journal').all())).toBe(avant);
  });
  it('ne répond rien d’utile à une personne non autorisée (403)', async () => {
    const { deps } = creerDeps({ env: { ...ENV_ACCESS, ADMIN_EMAILS: 'autre@example.invalid' } });
    // Jeton absent : 401 ; l’autorisation fine est couverte par access.test.ts.
    expect((await gererAdmin(new Request('https://chambalade.fr/api/admin/demandes'), deps, ['demandes'])).status).toBe(401);
  });
});

describe('liste et fiche des demandes', () => {
  it('met les demandes en attente en premier, les plus pressées d’abord, avec le temps restant et le montant', async () => {
    const { db, appeler } = monter();
    const confirmee = inserer(db, { statut: 'confirmee', arrivee: '2027-06-01', depart: '2027-06-03', unites: [['chambre_2', 1]] });
    const tard = inserer(db, { statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z', arrivee: '2027-07-01', depart: '2027-07-02', unites: [['chambre_3', 1]] });
    const tot = inserer(db, { statut: 'en_attente', expire_at: '2027-03-02T10:00:00.000Z', arrivee: '2027-08-01', depart: '2027-08-02', unites: [['dortoir', 1]] });
    const acceptee = inserer(db, { statut: 'acceptee', expire_at: '2027-03-05T10:00:00.000Z', arrivee: '2027-09-01', depart: '2027-09-02', unites: [['chambre_privee', 1]] });
    db.sqlite.prepare("UPDATE demandes SET devis = '{\"total_cents\":30400}' WHERE id = ?").run(tot);
    const corps = await (await appeler('GET', 'demandes')).json();
    expect(corps.demandes.map((d: { id: number }) => d.id)).toEqual([tot, tard, acceptee, confirmee]);
    expect(corps.demandes[0]).toMatchObject({ statut: 'en_attente', total_cents: 30400, secondes_restantes: 86_400 });
    expect(corps.demandes[3].secondes_restantes).toBeNull();
    expect(JSON.stringify(corps)).not.toContain('"devis"');
  });

  it('filtre par statut et par dates, refuse un filtre invalide', async () => {
    const { db, appeler } = monter();
    inserer(db, { statut: 'confirmee', arrivee: '2027-06-01', depart: '2027-06-03', unites: [['chambre_2', 1]] });
    inserer(db, { statut: 'refusee', arrivee: '2027-07-01', depart: '2027-07-03', unites: [['chambre_2', 1]] });
    expect((await (await appeler('GET', 'demandes?statut=refusee')).json()).demandes).toHaveLength(1);
    expect((await (await appeler('GET', 'demandes?du=2027-06-15&au=2027-07-15')).json()).demandes).toHaveLength(1);
    expect((await (await appeler('GET', 'demandes?du=2027-06-03&au=2027-07-01')).json()).demandes).toHaveLength(0);
    expect((await appeler('GET', 'demandes?statut=perdue')).status).toBe(400);
    expect((await appeler('GET', 'demandes?du=2027-02-30')).status).toBe(400);
  });

  it('passe à « expiree » les demandes dont le délai est dépassé au moment de la lecture', async () => {
    const { db, appeler, un } = monter({ now: new Date('2027-03-04T00:00:00Z') });
    const id = inserer(db, { statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z', arrivee: '2027-07-01', depart: '2027-07-02', unites: [['chambre_3', 1]] });
    const corps = await (await appeler('GET', 'demandes')).json();
    expect(corps.demandes[0]).toMatchObject({ id, statut: 'expiree', secondes_restantes: null });
    expect(un('journal', "demande_id = ? AND action = 'expiree'", id)).toMatchObject({ auteur: 'systeme' });
  });

  it('renvoie la fiche avec le devis, le choix et le journal', async () => {
    const { db, appeler } = monter();
    const id = inserer(db, { arrivee: '2027-06-01', depart: '2027-06-03', unites: [['chambre_2', 1]] });
    db.sqlite.prepare("UPDATE demandes SET devis = '{\"total_cents\":123}', choix = '{\"chambres\":[\"chambre_2\"]}' WHERE id = ?").run(id);
    db.sqlite.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES (?, 'demande_creee', 'cliente', NULL, '2027-01-01T00:00:00Z')").run(id);
    const corps = await (await appeler('GET', ID(id))).json();
    expect(corps.demande).toMatchObject({ id, email: 'demo@example.invalid', devis: { total_cents: 123 }, choix: { chambres: ['chambre_2'] } });
    expect(corps.journal).toEqual([{ action: 'demande_creee', auteur: 'cliente', detail: null, created_at: '2027-01-01T00:00:00Z' }]);
  });

  it.each(['demandes/999', 'demandes/abc', 'demandes/1;DROP'])('404 pour : %s', async chemin => {
    expect((await monter().appeler('GET', chemin)).status).toBe(404);
  });
});

describe('actions sur une demande', () => {
  const fiche = (db: ReturnType<typeof monter>['db'], statut: 'en_attente' | 'acceptee' | 'confirmee' | 'refusee' | 'annulee', expire_at: string | null = '2027-03-03T10:00:00.000Z') =>
    inserer(db, { statut, expire_at, arrivee: '2027-06-01', depart: '2027-06-03', unites: [['chambre_2', 1]] });

  it('accepter : passe à « acceptee », délai de 7 jours, trace avec l’auteur et le message', async () => {
    const { db, appeler, un } = monter();
    const id = fiche(db, 'en_attente');
    const r = await appeler('POST', `${ID(id)}/actions`, { action: 'accepter', message: 'Avec plaisir' });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, statut: 'acceptee', expire_at: '2027-03-08T10:00:00.000Z', acompte_cents: null, email: 'non_configure' });
    expect(un('demandes', 'id = ?', id)).toMatchObject({ statut: 'acceptee', expire_at: '2027-03-08T10:00:00.000Z', updated_at: '2027-03-01T10:00:00.000Z' });
    expect(un('journal', 'demande_id = ?', id)).toMatchObject({ action: 'acceptee', auteur: 'amaelle@example.invalid', detail: 'Avec plaisir' });
  });

  it('refuser, confirmer (acompte reçu) et annuler : bons statuts, délai levé, une trace chacun', async () => {
    const { db, appeler, un } = monter();
    const a = fiche(db, 'en_attente'); const b = fiche(db, 'acceptee', '2027-03-08T10:00:00.000Z'); const c = fiche(db, 'confirmee', null); const d = fiche(db, 'acceptee', '2027-03-08T10:00:00.000Z');
    expect((await appeler('POST', `${ID(a)}/actions`, { action: 'refuser', message: 'Complet' })).status).toBe(200);
    expect((await appeler('POST', `${ID(b)}/actions`, { action: 'confirmer' })).status).toBe(200);
    expect((await appeler('POST', `${ID(c)}/actions`, { action: 'annuler' })).status).toBe(200);
    expect((await appeler('POST', `${ID(d)}/actions`, { action: 'annuler' })).status).toBe(200);
    expect(un('demandes', 'id = ?', a)).toMatchObject({ statut: 'refusee', expire_at: null });
    expect(un('demandes', 'id = ?', b)).toMatchObject({ statut: 'confirmee', expire_at: null });
    expect(un('demandes', 'id = ?', c)).toMatchObject({ statut: 'annulee', expire_at: null });
    expect(un('journal', 'demande_id = ?', b)).toMatchObject({ action: 'acompte_recu' });
    expect(un('journal', 'demande_id = ?', d)).toMatchObject({ action: 'annulee' });
  });

  it('prolonger : repousse depuis l’échéance actuelle, sans dépasser 30 jours', async () => {
    const { db, appeler, un } = monter();
    const id = fiche(db, 'en_attente', '2027-03-03T10:00:00.000Z');
    expect(await (await appeler('POST', `${ID(id)}/actions`, { action: 'prolonger', heures: 24 })).json()).toEqual({ ok: true, statut: 'en_attente', expire_at: '2027-03-04T10:00:00.000Z', acompte_cents: null, email: null });
    expect((await (await appeler('POST', `${ID(id)}/actions`, { action: 'prolonger', heures: 720 })).json()).expire_at).toBe('2027-03-31T10:00:00.000Z');
    expect(un('demandes', 'id = ?', id).statut).toBe('en_attente');
    expect(un('journal', "demande_id = ? AND action = 'delai_prolonge'", id)).toBeTruthy();
  });

  it.each([
    ['confirmer une demande en attente', 'en_attente', 'confirmer'],
    ['accepter une demande déjà acceptée', 'acceptee', 'accepter'],
    ['accepter une demande refusée', 'refusee', 'accepter'],
    ['refuser une demande acceptée', 'acceptee', 'refuser'],
    ['annuler une demande en attente', 'en_attente', 'annuler'],
    ['annuler une demande déjà annulée', 'annulee', 'annuler'],
    ['prolonger une demande confirmée', 'confirmee', 'prolonger'],
  ] as const)('refuse (409) sans rien écrire : %s', async (_nom, statut, action) => {
    const { db, appeler, un, tous } = monter();
    const id = fiche(db, statut, statut === 'confirmee' ? null : '2027-03-05T10:00:00.000Z');
    const avant = un('demandes', 'id = ?', id);
    const r = await appeler('POST', `${ID(id)}/actions`, { action, heures: 5 });
    expect(r.status).toBe(409);
    expect((await r.json()).erreur.code).toBe('transition_impossible');
    expect(un('demandes', 'id = ?', id)).toEqual(avant);
    expect(tous('journal', 'demande_id = ?', id)).toHaveLength(0);
  });

  it('ne laisse pas agir sur une demande dont le délai est dépassé : elle est devenue « expiree »', async () => {
    const { db, appeler, un } = monter({ now: new Date('2027-03-04T00:00:00Z') });
    const id = fiche(db, 'en_attente', '2027-03-03T10:00:00.000Z');
    const r = await appeler('POST', `${ID(id)}/actions`, { action: 'accepter' });
    expect(r.status).toBe(409);
    expect((await r.json()).erreur.statut).toBe('expiree');
    expect(un('demandes', 'id = ?', id).statut).toBe('expiree');
  });

  it('une demande refusée, annulée ou expirée libère les places', async () => {
    const { db, deps, appeler } = monter();
    const id = fiche(db, 'en_attente');
    const places = async () => (await (await gererDisponibilites(new Request('https://localhost/api/disponibilites?du=2027-06-01&au=2027-06-02'), deps)).json()).nuits[0].libres.chambre_2;
    expect(await places()).toBe(0);
    await appeler('POST', `${ID(id)}/actions`, { action: 'refuser' });
    expect(await places()).toBe(1);
  });

  it.each([
    ['action inconnue', { action: 'supprimer' }],
    ['sans action', {}],
    ['prolonger sans durée', { action: 'prolonger' }],
    ['durée nulle', { action: 'prolonger', heures: 0 }],
    ['durée excessive', { action: 'prolonger', heures: 721 }],
    ['durée fractionnaire', { action: 'prolonger', heures: 1.5 }],
    ['message trop long', { action: 'accepter', message: 'a'.repeat(1001) }],
  ])('refuse une action invalide (400) : %s', async (_nom, corps) => {
    const { db, appeler, tous } = monter();
    const id = fiche(db, 'en_attente');
    expect((await appeler('POST', `${ID(id)}/actions`, corps)).status).toBe(400);
    expect(tous('journal', 'demande_id = ?', id)).toHaveLength(0);
  });

  it('refuse une autre origine, un type de contenu incorrect, une demande inconnue', async () => {
    const { db, appeler } = monter();
    const id = fiche(db, 'en_attente');
    expect((await appeler('POST', `${ID(id)}/actions`, { action: 'accepter' }, { Origin: 'https://autre.example' })).status).toBe(403);
    expect((await appeler('POST', `${ID(id)}/actions`, 'action=accepter', { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await appeler('POST', 'demandes/999/actions', { action: 'accepter' })).status).toBe(404);
  });
});

describe('calendrier', () => {
  it('liste, pour le mois, les occupations actives par unité et par nuit et les blocages', async () => {
    const { db, appeler } = monter();
    inserer(db, { statut: 'confirmee', arrivee: '2027-05-30', depart: '2027-06-02', unites: [['chambre_2', 1]] });
    inserer(db, { statut: 'refusee', arrivee: '2027-05-10', depart: '2027-05-11', unites: [['chambre_3', 1]] });
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-01T09:00:00.000Z', arrivee: '2027-05-12', depart: '2027-05-13', unites: [['dortoir', 2]] });
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z', arrivee: '2027-05-14', depart: '2027-05-15', unites: [['dortoir', 2]] });
    db.sqlite.prepare("INSERT INTO blocages (unite, date_debut, date_fin, motif, created_at) VALUES ('toutes', '2027-05-20', '2027-05-25', 'travaux', '2027-01-01T00:00:00Z')").run();
    const corps = await (await appeler('GET', 'calendrier?mois=2027-05')).json();
    expect(corps).toMatchObject({ mois: '2027-05', du: '2027-05-01', au: '2027-06-01', capacites: { chambre_2: 1, dortoir: 6, paddocks: 3 } });
    expect(corps.occupations.map((o: { nuit: string; unite: string; statut: string }) => `${o.nuit} ${o.unite} ${o.statut}`)).toEqual([
      '2027-05-14 dortoir en_attente', '2027-05-30 chambre_2 confirmee', '2027-05-31 chambre_2 confirmee',
    ]);
    expect(corps.blocages).toHaveLength(1);
  });
  it.each(['', 'mai', '2027-13', '2027-5', '2027-00'])('refuse un mois invalide : %s', async mois => {
    expect((await monter().appeler('GET', `calendrier?mois=${mois}`)).status).toBe(400);
  });
});

describe('blocages', () => {
  const bloc = { unite: 'dortoir', date_debut: '2027-08-01', date_fin: '2027-08-15', motif: 'travaux', note: 'Peinture' };

  it('crée un blocage, le consigne, et il retire les places aux clientes', async () => {
    const { deps, appeler, un } = monter();
    const r = await appeler('POST', 'blocages', bloc);
    expect(r.status).toBe(201);
    const { id, conflits } = await r.json();
    expect(conflits).toEqual([]);
    expect(un('blocages', 'id = ?', id)).toMatchObject({ unite: 'dortoir', date_debut: '2027-08-01', date_fin: '2027-08-15', motif: 'travaux', note: 'Peinture' });
    expect(un('journal', "action = 'blocage_cree'")).toMatchObject({ demande_id: null, auteur: 'amaelle@example.invalid', detail: 'dortoir du 2027-08-01 au 2027-08-15 (travaux)' });
    const dispo = await (await gererDisponibilites(new Request('https://localhost/api/disponibilites?du=2027-08-14&au=2027-08-16'), deps)).json();
    expect(dispo.nuits.map((n: { libres: { dortoir: number } }) => n.libres.dortoir)).toEqual([0, 6]); // la date de fin est exclue
  });

  it('signale les demandes déjà placées sur ces nuits sans les annuler', async () => {
    const { db, appeler, un } = monter();
    const id = inserer(db, { statut: 'confirmee', arrivee: '2027-08-03', depart: '2027-08-05', unites: [['dortoir', 2]] });
    inserer(db, { statut: 'confirmee', arrivee: '2027-08-03', depart: '2027-08-05', unites: [['chambre_2', 1]] });
    const { conflits } = await (await appeler('POST', 'blocages', bloc)).json();
    expect(conflits).toEqual([{ id, reference: expect.stringMatching(/^CHB-2027-/), statut: 'confirmee' }]);
    expect(un('demandes', 'id = ?', id).statut).toBe('confirmee');
    const tout = await (await appeler('POST', 'blocages', { ...bloc, unite: 'toutes' })).json();
    expect(tout.conflits).toHaveLength(2);
  });

  it.each([
    ['unité inconnue', { ...bloc, unite: 'salon' }],
    ['motif inconnu', { ...bloc, motif: 'caprice' }],
    ['date impossible', { ...bloc, date_debut: '2027-02-30' }],
    ['date mal formée', { ...bloc, date_fin: '15/08/2027' }],
    ['note trop longue', { ...bloc, note: 'a'.repeat(501) }],
    ['champ manquant', { unite: 'dortoir' }],
  ])('refuse un blocage invalide (400) : %s', async (_nom, corps) => {
    const { appeler, tous } = monter();
    expect((await appeler('POST', 'blocages', corps)).status).toBe(400);
    expect(tous('blocages')).toHaveLength(0);
  });
  it('refuse une fin qui n’est pas après le début', async () => {
    const { appeler } = monter();
    for (const date_fin of ['2027-08-01', '2027-07-30']) expect((await appeler('POST', 'blocages', { ...bloc, date_fin })).status).toBe(400);
  });

  it('liste les blocages à venir, supprime un blocage avec trace, 404 sinon', async () => {
    const { db, appeler, un, tous } = monter();
    db.sqlite.prepare("INSERT INTO blocages (unite, date_debut, date_fin, motif, created_at) VALUES ('toutes', '2027-01-01', '2027-01-05', 'fermeture', '2027-01-01T00:00:00Z')").run();
    const { id } = await (await appeler('POST', 'blocages', bloc)).json();
    expect((await (await appeler('GET', 'blocages')).json()).blocages.map((b: { id: number }) => b.id)).toEqual([id]); // le blocage passé n’est pas listé
    expect((await appeler('DELETE', `blocages/${id}`)).status).toBe(200);
    expect(tous('blocages', 'id = ?', id)).toHaveLength(0);
    expect(un('journal', "action = 'blocage_supprime'").detail).toBe('dortoir du 2027-08-01 au 2027-08-15 (travaux)');
    expect((await appeler('DELETE', `blocages/${id}`)).status).toBe(404);
    expect((await appeler('DELETE', 'blocages/abc')).status).toBe(404);
  });

  it('refuse une suppression ou une création venue d’un autre site', async () => {
    const { appeler, tous } = monter();
    expect((await appeler('POST', 'blocages', bloc, { Origin: 'https://autre.example' })).status).toBe(403);
    expect(tous('blocages')).toHaveLength(0);
    const { id } = await (await appeler('POST', 'blocages', bloc)).json();
    expect((await appeler('DELETE', `blocages/${id}`, undefined, { Origin: 'https://autre.example' })).status).toBe(403);
    expect(tous('blocages')).toHaveLength(1);
  });
});

describe('routes', () => {
  it('404 pour une route inconnue, 405 pour une méthode non prévue', async () => {
    const { appeler } = monter();
    expect((await appeler('GET', 'inconnue')).status).toBe(404);
    expect((await appeler('GET', '')).status).toBe(404);
    expect((await appeler('PUT', 'demandes')).status).toBe(405);
    expect((await appeler('DELETE', 'calendrier')).status).toBe(405);
    expect(MAINTENANT.getFullYear()).toBe(2027);
  });
});
