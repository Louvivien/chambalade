import { describe, expect, it } from 'vitest';
import { gererDevis } from '../../src/lib/api/devis';
import { gererDisponibilites } from '../../src/lib/api/disponibilites';
import { testConfig } from '../reservation/config-test';
import { creerDeps, inserer, postJson, requete } from './aide';

const sejour = { arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 0, chambres: ['chambre_2'], litsDortoir: 0 };

describe('GET /api/disponibilites', () => {
  const lire = async (url: string, over = {}) => {
    const { db, deps } = creerDeps(over);
    return { db, deps, reponse: await gererDisponibilites(requete(url), deps) };
  };

  it('une base vide : tout est libre, avec les capacités', async () => {
    const { reponse } = await lire('/api/disponibilites?du=2027-05-10&au=2027-05-12');
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get('Cache-Control')).toBe('no-store');
    const corps = await reponse.json();
    expect(corps.nuits).toHaveLength(2);
    expect(corps.nuits[0]).toEqual({ nuit: '2027-05-10', libres: { chambre_privee: 1, chambre_2: 1, chambre_3: 1, dortoir: 6, paddocks: 3 } });
    expect(corps.capacites).toEqual({ chambre_privee: 1, chambre_2: 1, chambre_3: 1, dortoir: 6, paddocks: 3 });
  });

  it('retranche les occupations actives et les blocages', async () => {
    const { db, deps } = creerDeps();
    inserer(db, { arrivee: '2027-05-10', depart: '2027-05-11', unites: [['dortoir', 4], ['chambre_2', 1]] });
    db.sqlite.prepare("INSERT INTO blocages (unite, date_debut, date_fin, motif, created_at) VALUES ('paddocks', '2027-05-11', '2027-05-12', 'travaux', '2027-01-01T00:00:00Z')").run();
    const corps = await (await gererDisponibilites(requete('/api/disponibilites?du=2027-05-10&au=2027-05-12'), deps)).json();
    expect(corps.nuits[0].libres).toMatchObject({ dortoir: 2, chambre_2: 0, paddocks: 3 });
    expect(corps.nuits[1].libres).toMatchObject({ dortoir: 6, chambre_2: 1, paddocks: 0 });
  });

  it('ignore une demande en attente dont le délai est dépassé', async () => {
    const { db, deps } = creerDeps({ now: new Date('2027-03-04T00:00:00Z') });
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z', arrivee: '2027-05-10', depart: '2027-05-11', unites: [['dortoir', 6]] });
    const corps = await (await gererDisponibilites(requete('/api/disponibilites?du=2027-05-10&au=2027-05-11'), deps)).json();
    expect(corps.nuits[0].libres.dortoir).toBe(6);
  });

  it('une capacité inconnue donne des places libres inconnues (null), jamais illimitées', async () => {
    const config = testConfig();
    config.units.paddocks.capacity_horses = null;
    const corps = await (await gererDisponibilites(requete('/api/disponibilites?du=2027-05-10&au=2027-05-11'), creerDeps({ config }).deps)).json();
    expect(corps.nuits[0].libres.paddocks).toBeNull();
  });

  it.each([
    ['sans paramètres', '/api/disponibilites', 'dates_invalides'],
    ['date impossible', '/api/disponibilites?du=2027-02-30&au=2027-03-02', 'dates_invalides'],
    ['fin avant début', '/api/disponibilites?du=2027-05-12&au=2027-05-10', 'periode_invalide'],
    ['période vide', '/api/disponibilites?du=2027-05-10&au=2027-05-10', 'periode_invalide'],
    ['période trop longue', '/api/disponibilites?du=2027-05-01&au=2027-08-01', 'periode_trop_longue'],
  ])('refuse : %s', async (_nom, url, code) => {
    const { reponse } = await lire(url);
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).erreur.code).toBe(code);
  });

  it('accepte exactement la période maximale', async () => {
    expect((await lire('/api/disponibilites?du=2027-05-01&au=2027-07-02')).reponse.status).toBe(200);
  });

  it('refuse une autre méthode', async () => {
    const { deps } = creerDeps();
    expect((await gererDisponibilites(requete('/api/disponibilites?du=2027-05-10&au=2027-05-11', { method: 'POST' }), deps)).status).toBe(405);
  });
});

describe('POST /api/devis', () => {
  it('calcule le devis côté serveur et signale la disponibilité', async () => {
    const { deps } = creerDeps();
    const r = await gererDevis(postJson('/api/devis', { ...sejour, chevaux: 1 }), deps);
    expect(r.status).toBe(200);
    const corps = await r.json();
    expect(corps.ok).toBe(true);
    expect(corps.devis.lignes.find((l: { id: string }) => l.id === 'chambre_partagee')).toMatchObject({ quantite: 3, total_cents: 22500 });
    expect(corps.devis.total_cents).toBe(22500 + 3000 + 900);
    expect(corps.disponibilite).toEqual({ ok: true, erreurs: [] });
  });

  it('ignore les montants et tarifs envoyés par le navigateur', async () => {
    const { deps } = creerDeps();
    const honnete = await (await gererDevis(postJson('/api/devis', sejour), deps)).json();
    const truque = await (await gererDevis(postJson('/api/devis', { ...sejour, total_cents: 1, acompte_cents: 0, prix: { chambre_partagee: 1 } }), deps)).json();
    expect(truque.devis).toEqual(honnete.devis);
  });

  it('signale une indisponibilité sans refuser le devis', async () => {
    const { db, deps } = creerDeps();
    inserer(db, { arrivee: '2027-05-11', depart: '2027-05-12', unites: [['chambre_2', 1]] });
    const corps = await (await gererDevis(postJson('/api/devis', sejour), deps)).json();
    expect(corps.ok).toBe(true);
    expect(corps.disponibilite.ok).toBe(false);
    expect(corps.disponibilite.erreurs[0].message).toBe('La chambre 2 n’est pas disponible la nuit du 11 mai.');
  });

  it('refuse un séjour invalide avec les erreurs de la bibliothèque (422)', async () => {
    const { deps } = creerDeps();
    const r = await gererDevis(postJson('/api/devis', { ...sejour, depart: '2027-05-10' }), deps);
    expect(r.status).toBe(422);
    expect((await r.json()).erreurs[0].code).toBe('depart_avant_arrivee');
  });

  it('un devis avec la configuration réelle reste incomplet et provisoire', async () => {
    const { parse } = await import('yaml');
    const { readFileSync } = await import('node:fs');
    const { parseReservationConfig } = await import('../../src/lib/reservation/config');
    const reel = parseReservationConfig(parse(readFileSync(new URL('../../src/data/reservation.yaml', import.meta.url), 'utf8')));
    const { deps } = creerDeps({ config: reel });
    const corps = await (await gererDevis(postJson('/api/devis', sejour), deps)).json();
    expect(corps.devis).toMatchObject({ complet: false, provisoire: true, acompte_cents: null });
  });

  it.each([
    ['date mal formée', { ...sejour, arrivee: '10/05/2027' }, 'la date d’arrivée'],
    ['nombre négatif', { ...sejour, adultes: -1 }, 'le nombre d’adultes'],
    ['nombre fractionnaire', { ...sejour, chevaux: 1.5 }, 'le nombre de chevaux'],
    ['texte à la place d’un nombre', { ...sejour, adultes: '2' }, 'le nombre d’adultes'],
    ['chambre inconnue', { ...sejour, chambres: ['suite'] }, 'les chambres'],
    ['champ manquant', { arrivee: '2027-05-10' }, 'la date de départ'],
  ])('refuse des données invalides : %s', async (_nom, corps, partie) => {
    const { deps } = creerDeps();
    const r = await gererDevis(postJson('/api/devis', corps), deps);
    expect(r.status).toBe(400);
    const e = (await r.json()).erreur;
    expect(e.code).toBe('donnees_invalides');
    expect(e.message.toLowerCase()).toContain(partie);
  });

  it('refuse un corps qui n’est pas du JSON, un autre type de contenu, une autre origine, une autre méthode', async () => {
    const { deps } = creerDeps();
    const mauvais = (init: RequestInit) => gererDevis(requete('/api/devis', init), deps);
    expect((await mauvais({ method: 'POST', body: 'x', headers: { 'Content-Type': 'application/json' } })).status).toBe(400);
    expect((await mauvais({ method: 'POST', body: '{}', headers: { 'Content-Type': 'text/plain' } })).status).toBe(415);
    expect((await mauvais({ method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', Origin: 'https://autre.example' } })).status).toBe(403);
    expect((await mauvais({ method: 'GET' })).status).toBe(405);
  });
});
