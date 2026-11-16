import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { dateDansLangue, echapperHtml, echeance, eurosDansLangue, nettoyerEnTete } from '../../src/lib/emails/formats';
import { construireEmail, MODELES_CLIENTE, type DemandeEmail, type Modele } from '../../src/lib/emails/modeles';

const demande = (over: Partial<DemandeEmail> = {}): DemandeEmail => ({
  reference: 'CHB-2027-0001', langue: 'fr', prenom: 'Claire', nom: 'Martin', email: 'claire@example.invalid', telephone: '0600000000', message: 'Je viens avec ma jument.',
  date_arrivee: '2027-05-10', date_depart: '2027-05-13', nb_adultes: 2, nb_enfants: 0, nb_chevaux: 1,
  choix: { chambres: ['chambre_2'], litsDortoir: 0 },
  devis: {
    total_cents: 25500, complet: false, provisoire: true,
    lignes: [
      { id: 'chambre_partagee', unite: 'chambre_2', quantite: 3, prix_unitaire_cents: 7500, total_cents: 22500, statut: 'calculee' },
      { id: 'petit_dejeuner', quantite: 1, prix_unitaire_cents: 0, total_cents: 0, statut: 'incluse' },
      { id: 'cheval', quantite: 3, prix_unitaire_cents: 1000, total_cents: 3000, statut: 'calculee' },
      { id: 'taxe_sejour', quantite: 6, prix_unitaire_cents: null, total_cents: null, statut: 'a_confirmer' },
    ],
  },
  expire_at: '2027-03-08T10:00:00.000Z', acompte_cents: 7650,
  ...over,
});
const options = { heures: 48, lien: 'https://chambalade.fr/admin/#demande-12', infosVirement: 'IBAN FR76 0000 0000 0000 (exemple)', messageAdmin: 'Avec plaisir !' };
const TOUS: Modele[] = [...MODELES_CLIENTE, 'nouvelle', 'expiration'];

describe('formats', () => {
  it('échappe le HTML', () => expect(echapperHtml(`<b onclick="x">&'`)).toBe('&lt;b onclick=&quot;x&quot;&gt;&amp;&#39;'));
  it('retire tout ce qui peut ouvrir un nouvel en-tête dans une valeur d’en-tête', () => {
    expect(nettoyerEnTete('Claire\r\nBcc: pirate@example.invalid')).toBe('Claire Bcc: pirate@example.invalid');
    expect(nettoyerEnTete('a\nb\rc d\u0000e\u007ff')).toBe('a b c d e f');
    expect(nettoyerEnTete('  Normal   avec   espaces ')).toBe('Normal avec espaces');
  });
  it('écrit les dates dans la langue de la cliente', () => {
    expect(dateDansLangue('2027-05-10', 'fr')).toBe('lundi 10 mai 2027');
    expect(dateDansLangue('2027-05-10', 'en')).toMatch(/^Monday,? 10 May 2027$/);
  });
  it('écrit l’échéance en heure de Paris', () => {
    expect(echeance('2027-03-08T10:00:00.000Z', 'fr')).toMatch(/lundi 8 mars 2027 (à )?11:00/);
    expect(echeance('2027-07-08T10:00:00.000Z', 'fr')).toMatch(/jeudi 8 juillet 2027 (à )?12:00/); // heure d’été
    expect(echeance('2027-03-08T10:00:00.000Z', 'en')).toMatch(/Monday,? 8 March 2027 (at )?11:00/);
  });
  it('écrit les euros dans la langue', () => {
    expect(eurosDansLangue(7650, 'fr')).toBe('76,50 €');
    expect(eurosDansLangue(22500, 'en')).toBe('€225');
  });
});

describe('modèles', () => {
  it.each(TOUS.flatMap(m => (['fr', 'en'] as const).map(l => [m, l] as const)))('%s en %s : complet, sans variable restante, objet sans saut de ligne', (modele, langue) => {
    const e = construireEmail(modele, demande({ langue }), options);
    for (const champ of [e.sujet, e.texte, e.html]) expect(champ).not.toMatch(/\{[a-z]+\}/i);
    expect(e.sujet).not.toMatch(/[\r\n]/);
    expect(e.sujet).toContain('CHB-2027-0001');
    expect(e.texte).toContain('CHB-2027-0001');
    expect(e.html.startsWith('<!doctype html>')).toBe(true);
    expect(e.html).toContain('CHB-2027-0001');
  });

  it('les e-mails à la cliente suivent la langue de la demande, ceux à Amaëlle restent en français', () => {
    for (const modele of MODELES_CLIENTE) {
      expect(construireEmail(modele, demande({ langue: 'en' }), options).langue).toBe('en');
      expect(construireEmail(modele, demande({ langue: 'en' }), options).texte).not.toMatch(/Bonjour|séjour|Amaëlle vous/);
      expect(construireEmail(modele, demande({ langue: 'fr' }), options).texte).toMatch(/^Bonjour Claire,/);
    }
    expect(construireEmail('nouvelle', demande({ langue: 'en' }), options).langue).toBe('fr');
    expect(construireEmail('expiration', demande({ langue: 'en' }), options).langue).toBe('fr');
    expect(construireEmail('recue', demande({ langue: 'en' }), options).texte).toMatch(/^Hello Claire,/);
  });

  it('demande reçue : dit que ce n’est pas une réservation, annonce le délai et récapitule le devis', () => {
    const e = construireEmail('recue', demande(), options);
    expect(e.texte).toContain('Ce n’est pas encore une réservation');
    expect(e.texte).toContain('48 h');
    expect(e.texte).toContain('lundi 10 mai 2027');
    expect(e.texte).toContain('Chambre, sanitaires partagés : 225 €');
    expect(e.texte).toContain('Petit-déjeuner : compris');
    expect(e.texte).toContain('Taxe de séjour : à confirmer');
    expect(e.texte).toContain('Total indicatif : 255 €');
    expect(e.texte).toContain('Devis indicatif, confirmé par Chambalade à l’acceptation.');
    expect(e.texte).toContain('Les tarifs sont en cours de validation');
    expect(e.texte).toContain('Certaines lignes restent à confirmer');
    expect(e.texte).toContain('Chambre 2');
  });

  it('acceptée : montant de l’acompte, échéance, coordonnées bancaires, référence de virement', () => {
    const e = construireEmail('acceptee', demande(), options);
    expect(e.texte).toContain('acompte de 76,50 € par virement');
    expect(e.texte).toMatch(/avant le lundi 8 mars 2027 (à )?11:00/);
    expect(e.texte).toContain('IBAN FR76 0000 0000 0000 (exemple)');
    expect(e.texte).toContain('indiquer la référence CHB-2027-0001');
    expect(e.texte).toContain('Sans paiement avant cette date, vos dates seront libérées.');
    expect(e.texte).toContain('Avec plaisir !');
  });

  it('acceptée sans montant ni coordonnées : ne rien inventer, renvoyer vers Amaëlle', () => {
    const e = construireEmail('acceptee', demande({ acompte_cents: null }), { heures: 48 });
    expect(e.texte).toContain('Amaëlle vous en précise le montant');
    expect(e.texte).toContain('Amaëlle vous communique les coordonnées bancaires');
    expect(e.texte).not.toMatch(/IBAN|€ par virement/);
    expect(e.texte).not.toContain('Le mot d’Amaëlle');
  });

  it('acceptée en anglais', () => {
    const e = construireEmail('acceptee', demande({ langue: 'en' }), options);
    expect(e.texte).toContain('deposit of €76.50 by bank transfer');
    expect(e.texte).toContain('Bank transfer details:');
    expect(e.sujet).toBe('Chambalade, your request is accepted (CHB-2027-0001)');
  });

  it('refusée et annulée : récapitulatif léger, mot d’Amaëlle repris', () => {
    for (const modele of ['refusee', 'annulee'] as const) {
      const e = construireEmail(modele, demande(), { heures: 48, messageAdmin: 'Désolée, nous sommes complets.' });
      expect(e.texte).toContain('Désolée, nous sommes complets.');
      expect(e.texte).not.toContain('Total indicatif');
    }
  });

  it('confirmée : récapitulatif complet', () => {
    expect(construireEmail('confirmee', demande(), options).texte).toContain('Total indicatif');
  });

  it('nouvelle demande : coordonnées, message, lien direct vers la fiche', () => {
    const e = construireEmail('nouvelle', demande(), options);
    expect(e.sujet).toBe('Nouvelle demande CHB-2027-0001, Claire Martin, du lundi 10 mai 2027 au jeudi 13 mai 2027');
    expect(e.texte).toContain('claire@example.invalid');
    expect(e.texte).toContain('0600000000');
    expect(e.texte).toContain('> Je viens avec ma jument.');
    expect(e.texte).toContain('https://chambalade.fr/admin/#demande-12');
    expect(e.html).toContain('href="https://chambalade.fr/admin/#demande-12"');
    expect(e.texte).not.toMatch(/Bonjour/);
  });

  it('demande bientôt expirée : échéance et lien', () => {
    const e = construireEmail('expiration', demande(), options);
    expect(e.texte).toMatch(/expire le lundi 8 mars 2027 (à )?11:00/);
    expect(e.texte).toContain('https://chambalade.fr/admin/#demande-12');
  });

  it('sans téléphone ni message, ces blocs sont absents', () => {
    const e = construireEmail('nouvelle', demande({ telephone: null, message: null }), options);
    expect(e.texte).not.toMatch(/Téléphone|Message de la cliente/);
  });

  it('un montant total nul avec des lignes à confirmer s’écrit « à confirmer », jamais 0 €', () => {
    const d = demande();
    d.devis.total_cents = 0; d.devis.lignes = [d.devis.lignes[3]];
    const e = construireEmail('recue', d, options);
    expect(e.texte).toContain('Total indicatif : à confirmer');
    expect(e.texte).not.toMatch(/Total indicatif : 0/);
  });
});

describe('sécurité du contenu', () => {
  const piege = '<script>alert(1)</script> & "guillemets"';
  it('le HTML n’interprète jamais un nom, un prénom ni un message de cliente', () => {
    for (const modele of TOUS) {
      const e = construireEmail(modele, demande({ prenom: piege, nom: piege, message: piege }), { ...options, messageAdmin: piege });
      expect(e.html).not.toContain('<script>');
      expect(e.html).toContain('&lt;script&gt;');
    }
  });
  it('un retour à la ligne dans un nom ne peut pas ajouter un en-tête à l’objet', () => {
    for (const modele of TOUS) {
      const e = construireEmail(modele, demande({ prenom: 'Claire\r\nBcc: pirate@example.invalid', nom: 'X\nY' }), options);
      expect(e.sujet).not.toMatch(/[\r\n]/);
    }
  });
  it('le texte brut garde le message tel quel, citation par citation', () => {
    const e = construireEmail('nouvelle', demande({ message: 'ligne 1\nligne 2' }), options);
    expect(e.texte).toContain('> ligne 1\n> ligne 2');
  });
});

describe('textes des e-mails', () => {
  const yaml = parse(readFileSync(new URL('../../src/data/emails.yaml', import.meta.url), 'utf8'));
  it('le français et l’anglais ont les mêmes modèles pour les clientes, avec les mêmes variables', () => {
    const variables = (v: unknown): string[] => [...JSON.stringify(v).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    for (const modele of MODELES_CLIENTE) {
      expect(Object.keys(yaml.en[modele])).toEqual(Object.keys(yaml.fr[modele]));
      expect(variables(yaml.en[modele])).toEqual(variables(yaml.fr[modele]));
    }
    expect(Object.keys(yaml.en.recap)).toEqual(Object.keys(yaml.fr.recap));
    expect(Object.keys(yaml.en.lignes)).toEqual(Object.keys(yaml.fr.lignes));
  });
  it('chaque ligne de tarif et chaque chambre a un libellé dans les deux langues', () => {
    const ids = ['chambre_privee', 'chambre_partagee', 'dortoir', 'draps_dortoir', 'petit_dejeuner', 'dejeuner', 'diner', 'cheval', 'forfait_cavalier', 'taxe_sejour'];
    for (const l of ['fr', 'en']) { for (const id of ids) expect(yaml[l].lignes[id]).toBeTruthy(); for (const c of ['chambre_privee', 'chambre_2', 'chambre_3']) expect(yaml[l].chambres[c]).toBeTruthy(); }
  });
  it('l’export JSON des fonctions suit le YAML', () => {
    expect(() => execFileSync('node', ['scripts/generer-config.mjs', '--verifier'], { cwd: new URL('../../', import.meta.url), stdio: 'pipe' })).not.toThrow();
    expect(JSON.parse(readFileSync(new URL('../../src/generated/emails.json', import.meta.url), 'utf8'))).toEqual(yaml);
  });
});
