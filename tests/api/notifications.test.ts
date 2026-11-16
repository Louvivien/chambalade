import { describe, expect, it, vi } from 'vitest';
import { gererAdmin } from '../../src/lib/api/admin';
import { gererCreationDemande } from '../../src/lib/api/creation';
import { ENV_ACCESS } from './acces';
import { creerDeps, inserer, MAINTENANT, postJson } from './aide';

const EMAIL = {
  EMAIL_API_KEY: 'cle-de-test', EMAIL_FROM: 'Chambalade <reservation@example.invalid>', EMAIL_REPLY_TO: 'amaelle@example.invalid',
  NOTIFY_EMAILS: 'amaelle@example.invalid, vivien@example.invalid', VIREMENT_INFOS: 'IBAN FR76 0000 (exemple)\nBIC EXEMPLE',
  TURNSTILE_SECRET: 's', RATE_LIMIT_SALT: 's',
};
const DEV = { ...ENV_ACCESS, ENVIRONMENT: 'development', ACCESS_DEV_EMAIL: 'amaelle@example.invalid' };
interface Envoye { to: string[]; subject: string; text: string; html: string; reply_to?: string }

/** Un fetch qui valide Turnstile et enregistre les e-mails envoyés ; `resend` fixe la réponse du service d’e-mail. */
function reseau(resend: () => Response | Promise<Response> = () => new Response('{}', { status: 200 })) {
  const envoyes: Envoye[] = [];
  const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: true }), { status: 200 });
    envoyes.push(JSON.parse(init!.body as string));
    return resend();
  });
  return { f: f as unknown as typeof fetch, envoyes };
}
const sejour = { arrivee: '2027-05-10', depart: '2027-05-13', adultes: 2, enfants: 0, chevaux: 0, chambres: ['chambre_2'], litsDortoir: 0 };
const corps = (langue: 'fr' | 'en' = 'fr') => ({ sejour, contact: { nom: 'Martin', prenom: 'Claire', email: 'claire@example.invalid', message: 'Bonjour' }, langue, consentement: true, turnstile_token: 't' });
const journal = (db: ReturnType<typeof creerDeps>['db'], action?: string) => db.sqlite.prepare(`SELECT action, auteur, detail FROM journal ${action ? `WHERE action = '${action}'` : ''}`).all() as Array<{ action: string; auteur: string; detail: string | null }>;

describe('e-mails à la création d’une demande', () => {
  it('envoie un accusé à la cliente et une alerte à Amaëlle, et consigne les deux sans adresse', async () => {
    const { f, envoyes } = reseau();
    const { db, deps } = creerDeps({ env: { ...EMAIL }, fetch: f });
    const r = await gererCreationDemande(postJson('/api/demandes', corps()), deps);
    expect(r.status).toBe(201);
    expect(envoyes).toHaveLength(2);
    const cliente = envoyes.find(e => e.to.includes('claire@example.invalid'))!;
    expect(cliente.subject).toBe('Chambalade, votre demande de séjour est reçue (CHB-2027-0001)');
    expect(cliente.reply_to).toBe('amaelle@example.invalid');
    expect(cliente.text).toContain('Ce n’est pas encore une réservation');
    const amaelle = envoyes.find(e => e.to.includes('amaelle@example.invalid'))!;
    expect(amaelle.to).toEqual(['amaelle@example.invalid', 'vivien@example.invalid']);
    expect(amaelle.reply_to).toBe('claire@example.invalid');
    expect(amaelle.subject).toContain('Nouvelle demande CHB-2027-0001, Claire Martin');
    expect(amaelle.text).toContain('https://chambalade.fr/admin/#demande-1');
    expect(amaelle.text).toContain('> Bonjour');
    const lignes = journal(db).filter(j => j.action.startsWith('email'));
    expect(lignes).toHaveLength(2);
    expect(lignes.every(j => j.action === 'email_envoye' && j.auteur === 'systeme')).toBe(true);
    expect(JSON.stringify(journal(db))).not.toMatch(/@example\.invalid/);
  });

  it('écrit à la cliente dans sa langue, et à Amaëlle toujours en français', async () => {
    const { f, envoyes } = reseau();
    await gererCreationDemande(postJson('/api/demandes', corps('en')), creerDeps({ env: { ...EMAIL }, fetch: f }).deps);
    expect(envoyes.find(e => e.to.includes('claire@example.invalid'))!.subject).toBe('Chambalade, we have received your stay request (CHB-2027-0001)');
    expect(envoyes.find(e => e.to.includes('amaelle@example.invalid'))!.subject).toMatch(/^Nouvelle demande/);
  });

  it.each([
    ['le service répond en erreur', () => new Response('non', { status: 500 }), 'email_echec', 'recue (HTTP 500)'],
    ['le service est injoignable', () => { throw new Error('réseau'); }, 'email_echec', 'recue'],
  ])('la demande est enregistrée même si %s', async (_nom, resend, action, detail) => {
    const { f } = reseau(resend as never);
    const { db, deps } = creerDeps({ env: { ...EMAIL }, fetch: f });
    const r = await gererCreationDemande(postJson('/api/demandes', corps()), deps);
    expect(r.status).toBe(201);
    expect(db.sqlite.prepare('SELECT count(*) AS n FROM demandes').get()).toEqual({ n: 1 });
    expect(journal(db, action)).toContainEqual({ action, auteur: 'systeme', detail });
  });

  it('sans service d’e-mail configuré : rien n’est envoyé, la demande passe, l’issue est consignée', async () => {
    const { f, envoyes } = reseau();
    const { db, deps } = creerDeps({ env: { TURNSTILE_SECRET: 's', RATE_LIMIT_SALT: 's' }, fetch: f });
    expect((await gererCreationDemande(postJson('/api/demandes', corps()), deps)).status).toBe(201);
    expect(envoyes).toEqual([]);
    expect(journal(db, 'email_ignore')).toHaveLength(2);
  });

  it('quand la plateforme le permet, les e-mails partent après la réponse', async () => {
    const { f, envoyes } = reseau();
    let apres: Promise<unknown> | undefined;
    const { deps } = creerDeps({ env: { ...EMAIL }, fetch: f });
    deps.apresReponse = p => { apres = p; };
    expect((await gererCreationDemande(postJson('/api/demandes', corps()), deps)).status).toBe(201);
    expect(apres).toBeDefined();
    await apres;
    expect(envoyes).toHaveLength(2);
  });
});

describe('e-mails des actions d’administration', () => {
  const monter = (resend?: () => Response | Promise<Response>) => {
    const { f, envoyes } = reseau(resend);
    const { db, deps } = creerDeps({ env: { ...DEV, ...EMAIL }, fetch: f });
    const appeler = (chemin: string, corps?: unknown, methode = 'POST') =>
      gererAdmin(new Request(`https://localhost/api/admin/${chemin}`, { method: methode, body: corps === undefined ? undefined : JSON.stringify(corps), headers: { 'Content-Type': 'application/json' } }), deps, chemin.split('?')[0].split('/'));
    const demande = (statut: 'en_attente' | 'acceptee' | 'confirmee', expire_at: string | null = '2027-03-03T10:00:00.000Z', extra = '') => {
      const id = inserer(db, { statut, expire_at, arrivee: '2027-06-01', depart: '2027-06-03', unites: [['chambre_2', 1]] });
      if (extra) db.sqlite.prepare(`UPDATE demandes SET ${extra} WHERE id = ?`).run(id);
      return id;
    };
    const ligne = (id: number) => db.sqlite.prepare('SELECT statut, acompte_cents FROM demandes WHERE id = ?').get(id) as { statut: string; acompte_cents: number | null };
    return { db, deps, appeler, envoyes, demande, ligne };
  };

  it('accepter : e-mail à la cliente avec l’acompte saisi, l’échéance, les coordonnées bancaires et le mot d’Amaëlle', async () => {
    const { appeler, envoyes, demande, ligne } = monter();
    const id = demande('en_attente');
    const r = await appeler(`demandes/${id}/actions`, { action: 'accepter', message: 'Avec plaisir !', acompte_cents: 7650 });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ statut: 'acceptee', acompte_cents: 7650, email: 'envoye' });
    expect(ligne(id)).toEqual({ statut: 'acceptee', acompte_cents: 7650 });
    expect(envoyes).toHaveLength(1);
    expect(envoyes[0].to).toEqual(['demo@example.invalid']);
    expect(envoyes[0].subject).toContain('votre demande est acceptée');
    expect(envoyes[0].text).toContain('acompte de 76,50 € par virement');
    expect(envoyes[0].text).toContain('IBAN FR76 0000 (exemple)');
    expect(envoyes[0].text).toContain('Avec plaisir !');
    expect(envoyes[0].text).toMatch(/avant le lundi 8 mars 2027 (à )?11:00/); // 7 jours après l’acceptation
  });

  it('accepter sans montant ni pourcentage connu : l’e-mail ne chiffre rien', async () => {
    const { appeler, envoyes, demande, ligne } = monter();
    const id = demande('en_attente');
    await appeler(`demandes/${id}/actions`, { action: 'accepter' });
    expect(ligne(id).acompte_cents).toBeNull();
    expect(envoyes[0].text).toContain('Amaëlle vous en précise le montant');
  });

  it('accepter reprend l’acompte du devis quand le pourcentage était connu', async () => {
    const { appeler, envoyes, demande, ligne, db } = monter();
    const id = demande('en_attente');
    db.sqlite.prepare("UPDATE demandes SET devis = '{\"lignes\":[],\"total_cents\":10000,\"complet\":true,\"provisoire\":false,\"acompte_cents\":3000}' WHERE id = ?").run(id);
    await appeler(`demandes/${id}/actions`, { action: 'accepter' });
    expect(ligne(id).acompte_cents).toBe(3000);
    expect(envoyes[0].text).toContain('acompte de 30 €');
  });

  it('refuser, confirmer, annuler : le bon e-mail dans la langue de la cliente, avec le mot d’Amaëlle', async () => {
    const { appeler, envoyes, demande, db } = monter();
    const a = demande('en_attente'); const b = demande('acceptee', '2027-03-08T10:00:00.000Z'); const c = demande('confirmee', null);
    db.sqlite.prepare("UPDATE demandes SET langue = 'en' WHERE id = ?").run(b);
    await appeler(`demandes/${a}/actions`, { action: 'refuser', message: 'Complet ces nuits-là.' });
    await appeler(`demandes/${b}/actions`, { action: 'confirmer' });
    await appeler(`demandes/${c}/actions`, { action: 'annuler', message: 'À bientôt.' });
    expect(envoyes.map(e => e.subject)).toEqual([
      expect.stringContaining('votre demande n’a pas pu être acceptée'),
      expect.stringContaining('your booking is confirmed'),
      expect.stringContaining('votre réservation est annulée'),
    ]);
    expect(envoyes[0].text).toContain('Complet ces nuits-là.');
    expect(envoyes[2].text).toContain('À bientôt.');
  });

  it('prolonger n’envoie aucun e-mail', async () => {
    const { appeler, envoyes, demande } = monter();
    const r = await appeler(`demandes/${demande('en_attente')}/actions`, { action: 'prolonger', heures: 24 });
    expect(await r.json()).toMatchObject({ email: null });
    expect(envoyes).toEqual([]);
  });

  it('l’action réussit même si l’e-mail échoue, et le dit à Amaëlle', async () => {
    const { appeler, demande, ligne, db } = monter(() => new Response('non', { status: 500 }));
    const id = demande('en_attente');
    const r = await appeler(`demandes/${id}/actions`, { action: 'refuser' });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ statut: 'refusee', email: 'echec' });
    expect(ligne(id).statut).toBe('refusee');
    expect(journal(db, 'email_echec')).toContainEqual({ action: 'email_echec', auteur: 'systeme', detail: 'refusee (HTTP 500)' });
  });

  it('une transition impossible n’envoie rien', async () => {
    const { appeler, envoyes, demande } = monter();
    expect((await appeler(`demandes/${demande('en_attente')}/actions`, { action: 'confirmer' })).status).toBe(409);
    expect(envoyes).toEqual([]);
  });

  it.each([['négatif', -1], ['fractionnaire', 10.5], ['démesuré', 2_000_000], ['texte', '75']])('refuse un acompte %s (400)', async (_nom, acompte_cents) => {
    const { appeler, demande } = monter();
    expect((await appeler(`demandes/${demande('en_attente')}/actions`, { action: 'accepter', acompte_cents })).status).toBe(400);
  });
});

describe('alerte d’expiration', () => {
  const liste = (deps: ReturnType<typeof creerDeps>['deps']) => gererAdmin(new Request('https://localhost/api/admin/demandes'), deps, ['demandes']);
  const monter = (resend?: () => Response | Promise<Response>, env: Record<string, string> = EMAIL) => {
    const { f, envoyes } = reseau(resend);
    const { db, deps } = creerDeps({ env: { ...DEV, ...env }, fetch: f });
    return { db, deps, envoyes };
  };

  it('prévient Amaëlle, une seule fois, d’une demande en attente qui expire dans moins de 12 h', async () => {
    const { db, deps, envoyes } = monter();
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-01T20:00:00.000Z', arrivee: '2027-06-01', depart: '2027-06-02', unites: [['chambre_2', 1]] }); // dans 10 h
    await liste(deps);
    expect(envoyes).toHaveLength(1);
    expect(envoyes[0].subject).toContain('bientôt expirée');
    expect(envoyes[0].to).toEqual(['amaelle@example.invalid', 'vivien@example.invalid']);
    expect(journal(db, 'alerte_expiration')).toHaveLength(1);
    await liste(deps);
    await liste(deps);
    expect(envoyes).toHaveLength(1);
  });

  it('ignore les demandes lointaines, déjà expirées, acceptées ou confirmées', async () => {
    const { db, deps, envoyes } = monter();
    const u = { arrivee: '2027-06-01', depart: '2027-06-02', unites: [['chambre_2', 1]] as Array<['chambre_2', number]> };
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-03T10:00:00.000Z', ...u }); // dans 48 h
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-01T09:00:00.000Z', ...u }); // déjà expirée
    inserer(db, { statut: 'acceptee', expire_at: '2027-03-01T20:00:00.000Z', ...u });
    inserer(db, { statut: 'confirmee', expire_at: null, ...u });
    await liste(deps);
    expect(envoyes).toEqual([]);
  });

  it('sans service d’e-mail : aucun envoi et aucune ligne de journal (pas de bruit)', async () => {
    const { db, deps, envoyes } = monter(undefined, {});
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-01T20:00:00.000Z', arrivee: '2027-06-01', depart: '2027-06-02', unites: [['chambre_2', 1]] });
    expect((await liste(deps)).status).toBe(200);
    expect(envoyes).toEqual([]);
    expect(journal(db)).toEqual([]);
  });

  it('si l’envoi échoue, la demande n’est pas marquée et l’alerte sera retentée ; la liste reste servie', async () => {
    let service: 'panne' | 'ok' = 'panne';
    const { db, deps, envoyes } = monter(() => (service === 'panne' ? new Response('non', { status: 500 }) : new Response('{}', { status: 200 })));
    inserer(db, { statut: 'en_attente', expire_at: '2027-03-01T20:00:00.000Z', arrivee: '2027-06-01', depart: '2027-06-02', unites: [['chambre_2', 1]] });
    const r = await liste(deps);
    expect(r.status).toBe(200);
    expect(journal(db, 'alerte_expiration')).toHaveLength(0);
    service = 'ok';
    await liste(deps);
    expect(journal(db, 'alerte_expiration')).toHaveLength(1);
    expect(envoyes).toHaveLength(2);
    expect(MAINTENANT.getFullYear()).toBe(2027);
  });
});
