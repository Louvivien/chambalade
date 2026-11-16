import { describe, expect, it } from 'vitest';
import { lignesVue, nomCourt, type DevisApi } from '../../src/lib/reserver/devis';
import { corpsDemande, messagesDErreur, validerFormulaire, type TextesErreurs } from '../../src/lib/reserver/envoi';
import { dateComplete, euros, libelleNuits, remplir } from '../../src/lib/reserver/formats';
import { etatInitial } from '../../src/lib/reserver/types';

const t: TextesErreurs = {
  required: '{champ} est à renseigner.', email: 'Adresse invalide.', noDates: 'Choisissez vos dates.', noLodging: 'Choisissez un hébergement.',
  consent: 'Consentement nécessaire.', antiRobot: 'Cochez la vérification.', network: 'Réseau en panne.', server: 'Erreur du serveur.', rateLimit: 'Réessayez dans {minutes} minutes.',
};
const libelles = { nom: 'Le nom', prenom: 'Le prénom', email: 'L’adresse e-mail' };
const contact = { nom: 'Martin', prenom: 'Claire', email: 'claire@example.invalid', telephone: '', message: '' };
const valide = { ...etatInitial(), arrivee: '2027-05-10', depart: '2027-05-12', chambres: ['chambre_2' as const] };

describe('formats', () => {
  it('remplace les {clés} et laisse visibles celles qui manquent', () => {
    expect(remplir('{n} nuits', { n: 3 })).toBe('3 nuits');
    expect(remplir('{n} et {autre}', { n: 1 })).toBe('1 et {autre}');
  });
  it('écrit les dates à la française, avec le jour de la semaine', () => {
    expect(dateComplete('2027-05-10')).toBe('lundi 10 mai 2027');
    expect(dateComplete('2027-06-01')).toBe('mardi 1er juin 2027');
  });
  it('formate les euros en centimes sans perdre une fraction', () => {
    expect(euros(22500)).toBe('225 €');
    expect(euros(3575)).toBe('35,75 €');
    expect(euros(0)).toBe('0 €');
  });
  it('accorde les nuits', () => {
    expect(libelleNuits(1, '{n} nuit', '{n} nuits')).toBe('1 nuit');
    expect(libelleNuits(3, '{n} nuit', '{n} nuits')).toBe('3 nuits');
  });
});

describe('lignes du devis affichées', () => {
  const textes = { pending: 'à confirmer', included: 'compris', lines: { chambre_partagee: 'Chambre', petit_dejeuner: 'Petit-déjeuner', taxe_sejour: 'Taxe de séjour' } };
  const devis: DevisApi = {
    nuits: 3, total_cents: 22500, complet: false, provisoire: true, acompte_cents: null,
    lignes: [
      { id: 'chambre_partagee', unite: 'chambre_2', quantite: 3, prix_unitaire_cents: 7500, total_cents: 22500, statut: 'calculee' },
      { id: 'petit_dejeuner', quantite: 1, prix_unitaire_cents: 0, total_cents: 0, statut: 'incluse' },
      { id: 'taxe_sejour', quantite: 6, prix_unitaire_cents: null, total_cents: null, statut: 'a_confirmer' },
    ],
  };
  it('montre les montants calculés, « compris » et « à confirmer », sans jamais afficher 0 € pour un inconnu', () => {
    const v = lignesVue(devis, textes, { chambre_2: 'Chambre 2' });
    expect(v.map(l => [l.libelle, l.montant, l.aConfirmer])).toEqual([['Chambre', '225 €', false], ['Petit-déjeuner', 'compris', false], ['Taxe de séjour', 'à confirmer', true]]);
    expect(v[0].detail).toBe('Chambre 2 · 3 × 75 €');
    expect(v[1].detail).toBeNull();
  });
  it('donne des clés distinctes à deux chambres du même tarif', () => {
    const deux: DevisApi = { ...devis, lignes: [devis.lignes[0], { ...devis.lignes[0], unite: 'chambre_3' }] };
    const cles = lignesVue(deux, textes, {}).map(l => l.cle);
    expect(new Set(cles).size).toBe(2);
  });
  it('affiche l’identifiant brut plutôt que rien si un libellé manque', () => {
    expect(lignesVue({ ...devis, lignes: [{ ...devis.lignes[1], id: 'nouveau_tarif' }] }, textes, {})[0].libelle).toBe('nouveau_tarif');
  });
  it('nom court d’une unité', () => expect(nomCourt('Chambre 2, un lit double, sanitaires partagés')).toBe('Chambre 2'));
});

describe('validation avant envoi', () => {
  const problemes = (etat = valide, c = contact, consent = true, jeton: string | null = 'jeton') => validerFormulaire(etat, c, consent, jeton, t, libelles);
  it('accepte un formulaire complet', () => expect(problemes()).toEqual([]));
  it('liste les manques dans l’ordre de la page, avec le champ concerné', () => {
    const p = problemes(etatInitial(), { nom: ' ', prenom: '', email: '', telephone: '', message: '' }, false, null);
    expect(p.map(x => x.champ)).toEqual(['dates', 'hebergement', 'nom', 'prenom', 'email', 'consentement', 'antirobot']);
    expect(p[2].message).toBe('Le nom est à renseigner.');
  });
  it.each(['pas-un-email', 'a@b', 'a b@c.d', '@c.d'])('refuse l’adresse %s', email => {
    expect(problemes(valide, { ...contact, email }).map(x => x.champ)).toEqual(['email']);
  });
  it('accepte lits en dortoir à la place des chambres', () => {
    expect(problemes({ ...valide, chambres: [], litsDortoir: 2 })).toEqual([]);
  });
});

describe('corps de la demande', () => {
  it('nettoie les champs facultatifs et n’envoie ni montant ni statut', () => {
    const c = corpsDemande({ arrivee: 'x' }, { ...contact, telephone: '  ', message: ' Bonjour ' }, 'jeton');
    expect(c).toEqual({ sejour: { arrivee: 'x' }, contact: { nom: 'Martin', prenom: 'Claire', email: 'claire@example.invalid', telephone: undefined, message: 'Bonjour' }, langue: 'fr', consentement: true, turnstile_token: 'jeton' });
    expect(JSON.stringify(c)).not.toMatch(/cents|statut|devis|total/);
  });
});

describe('messages d’erreur', () => {
  it('réseau coupé : un message clair, rien n’a été envoyé', () => expect(messagesDErreur(null, null, null, t)).toEqual(['Réseau en panne.']));
  it('trop de demandes : minutes arrondies au-dessus', () => {
    expect(messagesDErreur(429, {}, 3000, t)).toEqual(['Réessayez dans 50 minutes.']);
    expect(messagesDErreur(429, {}, 61, t)).toEqual(['Réessayez dans 2 minutes.']);
    expect(messagesDErreur(429, {}, null, t)).toEqual(['Réessayez dans 60 minutes.']);
  });
  it('indisponibilité ou séjour hors règles : les messages précis de l’API, tous', () => {
    const corps = { ok: false, erreurs: [{ message: 'Le dortoir n’a plus que 2 lits libres la nuit du 12 mai.' }, { message: 'La chambre 2 n’est pas disponible la nuit du 12 mai.' }] };
    expect(messagesDErreur(409, corps, null, t)).toEqual(corps.erreurs.map(e => e.message));
    expect(messagesDErreur(422, corps, null, t)).toHaveLength(2);
  });
  it('champ invalide ou anti-robot : le message de l’API', () => {
    expect(messagesDErreur(400, { erreur: { message: 'Le nom n’est pas valide.' } }, null, t)).toEqual(['Le nom n’est pas valide.']);
    expect(messagesDErreur(403, { erreur: { message: 'La vérification anti-robot a échoué.' } }, null, t)).toEqual(['La vérification anti-robot a échoué.']);
  });
  it('erreur interne : message général, jamais de détail technique', () => {
    expect(messagesDErreur(500, { erreur: { message: 'secret technique' } }, null, t)).toEqual(['Erreur du serveur.']);
    expect(messagesDErreur(502, '<html>bad gateway</html>', null, t)).toEqual(['Erreur du serveur.']);
  });
  it('service anti-robot indisponible (503) : le message de l’API', () => {
    expect(messagesDErreur(503, { erreur: { message: 'Vérification momentanément indisponible.' } }, null, t)).toEqual(['Vérification momentanément indisponible.']);
  });
  it('réponse illisible : message général', () => expect(messagesDErreur(409, null, null, t)).toEqual(['Erreur du serveur.']));
});
