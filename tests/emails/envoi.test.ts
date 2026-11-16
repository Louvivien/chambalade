import { describe, expect, it, vi } from 'vitest';
import { adresses, envoyerEmail } from '../../src/lib/emails/envoi';
import type { EmailConstruit } from '../../src/lib/emails/modeles';
import { creerDeps } from '../api/aide';

const email: EmailConstruit = { sujet: 'Objet', texte: 'Texte', html: '<p>Texte</p>', langue: 'fr' };
const ENV = { EMAIL_API_KEY: 'cle-de-test', EMAIL_FROM: 'Chambalade <reservation@example.invalid>' };
const ok = () => vi.fn(async () => new Response('{"id":"x"}', { status: 200 }));

describe('adresses', () => {
  it('ne garde que les adresses valides', () => {
    expect(adresses('a@example.invalid, b@example.invalid,pas-une-adresse, c d@e.f, ,"x"@y.z')).toEqual(['a@example.invalid', 'b@example.invalid']);
    expect(adresses(undefined)).toEqual([]);
  });
});

describe('envoi par Resend', () => {
  it('envoie la requête attendue : adresse du service, clé, expéditeur, destinataires, contenu', async () => {
    const f = ok();
    const { deps } = creerDeps({ env: ENV, fetch: f });
    expect(await envoyerEmail(deps, ['claire@example.invalid'], email, 'amaelle@example.invalid')).toEqual({ statut: 'envoye' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer cle-de-test');
    expect(JSON.parse(init.body as string)).toEqual({ from: 'Chambalade <reservation@example.invalid>', to: ['claire@example.invalid'], subject: 'Objet', text: 'Texte', html: '<p>Texte</p>', reply_to: 'amaelle@example.invalid' });
  });

  it('n’envoie rien sans clé ou sans expéditeur (non configuré)', async () => {
    for (const env of [{}, { EMAIL_API_KEY: 'x' }, { EMAIL_FROM: 'a@example.invalid' }]) {
      const f = ok();
      expect(await envoyerEmail(creerDeps({ env, fetch: f }).deps, ['claire@example.invalid'], email)).toEqual({ statut: 'non_configure' });
      expect(f).not.toHaveBeenCalled();
    }
  });

  it('omet reply_to s’il est absent ou invalide', async () => {
    for (const repondreA of [undefined, 'pas-une-adresse', 'a@b.c\nBcc: x@y.z']) {
      const f = ok();
      await envoyerEmail(creerDeps({ env: ENV, fetch: f }).deps, ['claire@example.invalid'], email, repondreA);
      expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).not.toHaveProperty('reply_to');
    }
  });

  it('filtre les destinataires invalides, et n’appelle pas le service s’il n’en reste aucun', async () => {
    const f = ok();
    const { deps } = creerDeps({ env: ENV, fetch: f });
    await envoyerEmail(deps, ['claire@example.invalid', 'x@y.z\r\nBcc: pirate@example.invalid', 'invalide'], email);
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).to).toEqual(['claire@example.invalid']);
    const g = ok();
    expect(await envoyerEmail(creerDeps({ env: ENV, fetch: g }).deps, ['invalide'], email)).toEqual({ statut: 'echec', code: null });
    expect(g).not.toHaveBeenCalled();
  });

  it('assainit l’objet et l’expéditeur', async () => {
    const f = ok();
    await envoyerEmail(creerDeps({ env: { ...ENV, EMAIL_FROM: 'Chambalade\r\nBcc: x@y.z <a@example.invalid>' }, fetch: f }).deps, ['claire@example.invalid'], { ...email, sujet: 'Objet\r\nBcc: pirate@example.invalid' });
    const corps = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(corps.subject).not.toMatch(/[\r\n]/);
    expect(corps.from).not.toMatch(/[\r\n]/);
  });

  it('ne lève jamais d’exception : réponse en erreur ou service injoignable', async () => {
    expect(await envoyerEmail(creerDeps({ env: ENV, fetch: async () => new Response('non', { status: 422 }) }).deps, ['claire@example.invalid'], email)).toEqual({ statut: 'echec', code: 422 });
    expect(await envoyerEmail(creerDeps({ env: ENV, fetch: async () => { throw new Error('réseau'); } }).deps, ['claire@example.invalid'], email)).toEqual({ statut: 'echec', code: null });
  });
});
