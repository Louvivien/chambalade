import type { ReservationConfig } from '../reservation/config';
import { dateParis } from '../reservation/dates';
import { type OccupationAPrevoir, occupationsDe, preparerDemande } from '../reservation/demande';
import { capaciteUnite } from '../reservation/disponibilites';
import type { DemandeSejour } from '../reservation/types';
import { verifierDisponibilites } from '../reservation/disponibilites';
import { expirerDemandes } from './expiration';
import { erreur, json, lireJson, methodeNonAutorisee } from './http';
import { chargerInstantane } from './instantane';
import { adresseIp, compterTentative } from './limites';
import { demandeSchema, messageDeValidation, sejourDe } from './schemas';
import { verifierTurnstile } from './turnstile';
import type { ApiDeps, D1Like } from './types';

export interface Contact { nom: string; prenom: string; email: string; telephone?: string; message?: string }

export type Enregistrement = { ok: true; reference: string; id: number } | { ok: false; raison: 'conflit' };

/** Les lignes d’occupation, avec la capacité de leur unité, passées à SQL en un seul paramètre JSON. */
const lignesJson = (config: ReservationConfig, occupations: OccupationAPrevoir[], avecCapacite: boolean) =>
  JSON.stringify(occupations.map(o => ({ unite: o.unite, nuit: o.nuit, qte: o.quantite, ...(avecCapacite ? { cap: capaciteUnite(config, o.unite) } : {}) })));

const LIGNES = "SELECT json_extract(value, '$.unite') AS unite, json_extract(value, '$.nuit') AS nuit, json_extract(value, '$.qte') AS qte, json_extract(value, '$.cap') AS cap FROM json_each(?)";

/**
 * Enregistre la demande, ses occupations et son journal dans UN SEUL batch (une transaction D1).
 * La première requête n’insère la demande que si, pour chaque nuit et chaque unité, la capacité
 * restante suffit ; les suivantes ne font rien si elle n’a rien inséré. Deux demandes
 * simultanées sur la dernière place ne peuvent donc pas réussir toutes les deux : la
 * vérification faite avant n’est qu’un confort, celle-ci fait foi.
 */
export async function enregistrerDemande(
  deps: ApiDeps, p: { sejour: DemandeSejour; contact: Contact; langue: 'fr' | 'en'; devis: unknown; expire_at: string },
): Promise<Enregistrement> {
  const { env, config } = deps;
  const maintenant = deps.now();
  const t = maintenant.toISOString();
  const annee = dateParis(maintenant).slice(0, 4);
  const occupations = occupationsDe(p.sejour);

  for (let essai = 0; essai < 3; essai++) {
    const dernier = await env.DB.prepare("SELECT MAX(CAST(substr(reference, 10) AS INTEGER)) AS n FROM demandes WHERE reference LIKE ?").bind(`CHB-${annee}-%`).first<{ n: number | null }>();
    const reference = `CHB-${annee}-${String((dernier?.n ?? 0) + 1).padStart(4, '0')}`;
    try {
      const resultats = await env.DB.batch([
        env.DB.prepare(`WITH r AS (${LIGNES})
          INSERT INTO demandes (reference, statut, date_arrivee, date_depart, nb_adultes, nb_enfants, nb_chevaux, choix, devis, langue, nom, prenom, email, telephone, message, consentement_at, created_at, updated_at, expire_at)
          SELECT ?, 'en_attente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (
            SELECT 1 FROM r WHERE r.cap IS NULL
              OR EXISTS (SELECT 1 FROM blocages b WHERE (b.unite = 'toutes' OR b.unite = r.unite) AND b.date_debut <= r.nuit AND r.nuit < b.date_fin)
              OR r.qte + COALESCE((SELECT SUM(o.quantite) FROM occupations o JOIN demandes d ON d.id = o.demande_id
                   WHERE o.unite = r.unite AND o.nuit = r.nuit
                     AND (d.statut = 'confirmee' OR (d.statut IN ('en_attente', 'acceptee') AND (d.expire_at IS NULL OR d.expire_at > ?)))), 0) > r.cap
          )`).bind(
          lignesJson(config, occupations, true),
          reference, p.sejour.arrivee, p.sejour.depart, p.sejour.adultes, p.sejour.enfants, p.sejour.chevaux,
          JSON.stringify(p.sejour), JSON.stringify(p.devis), p.langue, p.contact.nom, p.contact.prenom, p.contact.email,
          p.contact.telephone ?? null, p.contact.message ?? null, t, t, t, p.expire_at, t),
        env.DB.prepare(`WITH r AS (${LIGNES})
          INSERT INTO occupations (demande_id, unite, nuit, quantite)
          SELECT d.id, r.unite, r.nuit, r.qte FROM r JOIN demandes d ON d.reference = ? WHERE changes() > 0`)
          .bind(lignesJson(config, occupations, false), reference),
        env.DB.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) SELECT id, 'demande_creee', 'cliente', NULL, ? FROM demandes WHERE reference = ? AND changes() > 0").bind(t, reference),
      ]);
      if (resultats[0].meta.changes !== 1) return { ok: false, raison: 'conflit' };
      return { ok: true, reference, id: resultats[0].meta.last_row_id };
    } catch (e) {
      // Une autre demande a pris la même référence entre la lecture et l’insertion : on recommence.
      if (!(e instanceof Error && /UNIQUE/i.test(e.message)) || essai === 2) throw e;
    }
  }
  throw new Error('référence indisponible');
}

/** POST /api/demandes : pré-réservation. Tout est recalculé et vérifié ici, rien n’est cru du navigateur. */
export async function gererCreationDemande(request: Request, deps: ApiDeps): Promise<Response> {
  const refus = methodeNonAutorisee(request, ['POST']);
  if (refus) return refus;
  try {
    const lecture = await lireJson(request);
    if (!lecture.ok) return lecture.reponse;

    const ip = adresseIp(request);
    const limite = await compterTentative(deps, ip);
    if (!limite.autorise) {
      return erreur(429, 'trop_de_demandes', 'Vous avez envoyé trop de demandes. Réessayez un peu plus tard.', {}, { 'Retry-After': String(limite.reessayerDans) });
    }

    // Valider avant Turnstile : un jeton ne sert qu’une fois, inutile de le consommer pour une demande incorrecte.
    const analyse = demandeSchema.safeParse(lecture.donnees);
    if (!analyse.success) {
      const { champ, message } = messageDeValidation(analyse.error);
      return erreur(400, 'donnees_invalides', message, { champ });
    }
    const { sejour: brut, contact, langue, turnstile_token } = analyse.data;
    const sejour = sejourDe(brut);

    const verification = await verifierTurnstile(deps, turnstile_token, ip);
    if (verification === 'refuse') return erreur(403, 'verification_echouee', 'La vérification anti-robot a échoué. Rechargez la page et réessayez.');
    if (verification === 'indisponible') return erreur(503, 'verification_indisponible', 'La vérification anti-robot est momentanément indisponible. Réessayez dans un instant.');

    const maintenant = deps.now();
    await expirerDemandes(deps.env.DB, maintenant);
    const instantane = await chargerInstantane(deps.env.DB, sejour.arrivee, sejour.depart);
    const preparation = preparerDemande(deps.config, instantane, maintenant, sejour);
    if (!preparation.ok) {
      const indisponible = preparation.erreurs.some(e => e.code === 'indisponible' || e.code === 'capacite_inconnue');
      return json({ ok: false, erreurs: preparation.erreurs }, indisponible ? 409 : 422);
    }

    const resultat = await enregistrerDemande(deps, { sejour, contact, langue, devis: preparation.devis, expire_at: preparation.expire_at });
    if (!resultat.ok) {
      // Quelqu’un a pris la place entre la vérification et l’insertion : on explique précisément laquelle.
      const frais = await chargerInstantane(deps.env.DB, sejour.arrivee, sejour.depart);
      const erreurs = verifierDisponibilites(deps.config, frais, deps.now(), sejour);
      return json({ ok: false, erreurs: erreurs.length > 0 ? erreurs : [{ code: 'indisponible', message: 'Ces dates ne sont plus disponibles.' }] }, 409);
    }
    return json({ ok: true, reference: resultat.reference, statut: preparation.statut, expire_at: preparation.expire_at, devis: preparation.devis }, 201);
  } catch (e) {
    // Jamais de donnée personnelle dans les journaux : seulement le type de l’erreur.
    console.error('creation_demande_echec', e instanceof Error ? e.name : 'inconnue');
    return erreur(500, 'erreur_interne', 'Une erreur est survenue. Votre demande n’a pas été enregistrée, réessayez dans un instant.');
  }
}
