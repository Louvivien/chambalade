import { z } from 'astro/zod';
import { unitIds } from '../reservation/config';
import { dateParis, estDateValide, joursEntre } from '../reservation/dates';
import { capaciteUnite } from '../reservation/disponibilites';
import { authentifierAdmin } from './access';
import { expirerDemandes } from './expiration';
import { erreur, json, lireJson, origineAutorisee } from './http';
import type { ApiDeps } from './types';

const STATUTS = ['en_attente', 'acceptee', 'confirmee', 'refusee', 'annulee', 'expiree'] as const;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const actionSchema = z.object({
  action: z.enum(['accepter', 'refuser', 'confirmer', 'annuler', 'prolonger']),
  message: z.string().trim().max(1000).optional(),
  heures: z.number().int().min(1).max(720).optional(),
});
const blocageSchema = z.object({
  unite: z.enum(['toutes', ...unitIds]),
  date_debut: date, date_fin: date,
  motif: z.enum(['fermeture', 'travaux', 'reservation_exterieure', 'autre']),
  note: z.string().trim().max(500).optional(),
});

const entier = (valeur: string | undefined) => (valeur && /^\d{1,9}$/.test(valeur) ? Number(valeur) : null);
const montantDe = (devis: string) => { try { return (JSON.parse(devis) as { total_cents?: number }).total_cents ?? null; } catch { return null; } };

/**
 * Point d’entrée unique de /api/admin/** : l’authentification s’applique ici, avant toute
 * route, donc une route ajoutée plus tard ne peut pas l’oublier.
 */
export async function gererAdmin(request: Request, deps: ApiDeps, chemin: string[]): Promise<Response> {
  try {
    const auth = await authentifierAdmin(request, deps);
    if (!auth.ok) return auth.reponse;
    const auteur = auth.email;
    const [ressource, id, sous] = chemin;
    const methode = request.method;
    const db = deps.env.DB;
    const maintenant = deps.now();
    const url = new URL(request.url);

    if (methode !== 'GET' && !origineAutorisee(request)) return erreur(403, 'origine_refusee', 'Cette requête ne vient pas du site.');
    await expirerDemandes(db, maintenant);

    // — Demandes —
    if (ressource === 'demandes' && !id && methode === 'GET') {
      const statut = url.searchParams.get('statut');
      if (statut && !(STATUTS as readonly string[]).includes(statut)) return erreur(400, 'statut_invalide', 'Ce statut n’existe pas.');
      const du = url.searchParams.get('du'); const au = url.searchParams.get('au');
      if ((du && !estDateValide(du)) || (au && !estDateValide(au))) return erreur(400, 'dates_invalides', 'Les dates du filtre ne sont pas valides.');
      const lignes = await db.prepare(`SELECT id, reference, statut, date_arrivee, date_depart, nb_adultes, nb_enfants, nb_chevaux, nom, prenom, langue, devis, expire_at, created_at
        FROM demandes WHERE (?1 IS NULL OR statut = ?1) AND (?2 IS NULL OR date_depart > ?2) AND (?3 IS NULL OR date_arrivee < ?3)
        ORDER BY CASE statut WHEN 'en_attente' THEN 0 WHEN 'acceptee' THEN 1 ELSE 2 END, expire_at IS NULL, expire_at, date_arrivee DESC LIMIT 200`)
        .bind(statut, du, au).all<{ devis: string; expire_at: string | null; statut: string }>();
      return json({ ok: true, demandes: lignes.results.map(({ devis, ...d }) => ({
        ...d, total_cents: montantDe(devis),
        secondes_restantes: d.expire_at && (d.statut === 'en_attente' || d.statut === 'acceptee') ? Math.max(0, Math.round((Date.parse(d.expire_at) - maintenant.getTime()) / 1000)) : null,
      })) });
    }

    if (ressource === 'demandes' && id && !sous && methode === 'GET') {
      const n = entier(id);
      if (n === null) return erreur(404, 'introuvable', 'Demande introuvable.');
      const d = await db.prepare('SELECT * FROM demandes WHERE id = ?').bind(n).first<Record<string, unknown>>();
      if (!d) return erreur(404, 'introuvable', 'Demande introuvable.');
      const journal = await db.prepare('SELECT action, auteur, detail, created_at FROM journal WHERE demande_id = ? ORDER BY id').bind(n).all();
      return json({ ok: true, demande: { ...d, choix: JSON.parse(String(d.choix)), devis: JSON.parse(String(d.devis)) }, journal: journal.results });
    }

    if (ressource === 'demandes' && id && sous === 'actions' && methode === 'POST') {
      const n = entier(id);
      if (n === null) return erreur(404, 'introuvable', 'Demande introuvable.');
      const lecture = await lireJson(request);
      if (!lecture.ok) return lecture.reponse;
      const a = actionSchema.safeParse(lecture.donnees);
      if (!a.success) return erreur(400, 'donnees_invalides', 'Cette action n’est pas valide.');
      return await appliquerAction(deps, n, a.data, auteur);
    }

    // — Calendrier —
    if (ressource === 'calendrier' && !id && methode === 'GET') {
      const mois = url.searchParams.get('mois') ?? '';
      if (!/^\d{4}-\d{2}$/.test(mois) || !estDateValide(`${mois}-01`)) return erreur(400, 'mois_invalide', 'Indiquez un mois au format AAAA-MM.');
      const du = `${mois}-01`;
      const suivant = new Date(Date.UTC(+mois.slice(0, 4), +mois.slice(5, 7), 1)).toISOString().slice(0, 10);
      const occ = await db.prepare(`SELECT o.unite, o.nuit, o.quantite, d.id AS demande_id, d.reference, d.statut, d.nom
        FROM occupations o JOIN demandes d ON d.id = o.demande_id
        WHERE o.nuit >= ? AND o.nuit < ? AND (d.statut = 'confirmee' OR (d.statut IN ('en_attente', 'acceptee') AND (d.expire_at IS NULL OR d.expire_at > ?)))
        ORDER BY o.nuit, o.unite`).bind(du, suivant, maintenant.toISOString()).all();
      const blo = await db.prepare('SELECT id, unite, date_debut, date_fin, motif, note FROM blocages WHERE date_debut < ? AND date_fin > ? ORDER BY date_debut').bind(suivant, du).all();
      return json({ ok: true, mois, du, au: suivant, capacites: Object.fromEntries(unitIds.map(u => [u, capaciteUnite(deps.config, u)])), occupations: occ.results, blocages: blo.results });
    }

    // — Blocages —
    if (ressource === 'blocages' && !id && methode === 'GET') {
      const r = await db.prepare('SELECT id, unite, date_debut, date_fin, motif, note, created_at FROM blocages WHERE date_fin > ? ORDER BY date_debut').bind(dateParis(maintenant)).all();
      return json({ ok: true, blocages: r.results });
    }
    if (ressource === 'blocages' && !id && methode === 'POST') {
      const lecture = await lireJson(request);
      if (!lecture.ok) return lecture.reponse;
      const b = blocageSchema.safeParse(lecture.donnees);
      if (!b.success || !estDateValide(b.data.date_debut) || !estDateValide(b.data.date_fin)) return erreur(400, 'donnees_invalides', 'Le blocage n’est pas valide : vérifiez l’unité, le motif et les dates.');
      if (joursEntre(b.data.date_debut, b.data.date_fin) < 1) return erreur(400, 'periode_invalide', 'La date de fin doit être après la date de début (la nuit de la date de fin n’est pas bloquée).');
      const t = maintenant.toISOString();
      const [ajout] = await db.batch([
        db.prepare('INSERT INTO blocages (unite, date_debut, date_fin, motif, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(b.data.unite, b.data.date_debut, b.data.date_fin, b.data.motif, b.data.note ?? null, t),
        db.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES (NULL, 'blocage_cree', ?, ?, ?)").bind(auteur, `${b.data.unite} du ${b.data.date_debut} au ${b.data.date_fin} (${b.data.motif})`, t),
      ]);
      // Un blocage n’annule rien : on signale simplement les demandes déjà placées sur ces nuits.
      const conflits = await db.prepare(`SELECT DISTINCT d.id, d.reference, d.statut FROM occupations o JOIN demandes d ON d.id = o.demande_id
        WHERE o.nuit >= ? AND o.nuit < ? AND (?3 = 'toutes' OR o.unite = ?3)
        AND (d.statut = 'confirmee' OR (d.statut IN ('en_attente', 'acceptee') AND (d.expire_at IS NULL OR d.expire_at > ?4)))`)
        .bind(b.data.date_debut, b.data.date_fin, b.data.unite, t).all();
      return json({ ok: true, id: ajout.meta.last_row_id, conflits: conflits.results }, 201);
    }
    if (ressource === 'blocages' && id && !sous && methode === 'DELETE') {
      const n = entier(id);
      const existant = n === null ? null : await db.prepare('SELECT unite, date_debut, date_fin, motif FROM blocages WHERE id = ?').bind(n).first<{ unite: string; date_debut: string; date_fin: string; motif: string }>();
      if (n === null || !existant) return erreur(404, 'introuvable', 'Blocage introuvable.');
      const t = maintenant.toISOString();
      await db.batch([
        db.prepare('DELETE FROM blocages WHERE id = ?').bind(n),
        db.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES (NULL, 'blocage_supprime', ?, ?, ?)").bind(auteur, `${existant.unite} du ${existant.date_debut} au ${existant.date_fin} (${existant.motif})`, t),
      ]);
      return json({ ok: true });
    }

    return erreur(['demandes', 'calendrier', 'blocages'].includes(ressource ?? '') ? 405 : 404, ['demandes', 'calendrier', 'blocages'].includes(ressource ?? '') ? 'methode_non_autorisee' : 'introuvable', 'Cette adresse n’existe pas.');
  } catch (e) {
    console.error('admin_echec', e instanceof Error ? e.name : 'inconnue');
    return erreur(500, 'erreur_interne', 'Une erreur est survenue. Réessayez dans un instant.');
  }
}

const TRANSITIONS = {
  accepter: { de: ['en_attente'], vers: 'acceptee' },
  refuser: { de: ['en_attente'], vers: 'refusee' },
  confirmer: { de: ['acceptee'], vers: 'confirmee' },
  annuler: { de: ['acceptee', 'confirmee'], vers: 'annulee' },
  prolonger: { de: ['en_attente', 'acceptee'], vers: null },
} as const;
const JOURNAL = { accepter: 'acceptee', refuser: 'refusee', confirmer: 'acompte_recu', annuler: 'annulee', prolonger: 'delai_prolonge' } as const;

async function appliquerAction(deps: ApiDeps, id: number, a: z.infer<typeof actionSchema>, auteur: string): Promise<Response> {
  const db = deps.env.DB;
  const maintenant = deps.now();
  const t = maintenant.toISOString();
  const actuelle = await db.prepare('SELECT statut, expire_at FROM demandes WHERE id = ?').bind(id).first<{ statut: string; expire_at: string | null }>();
  if (!actuelle) return erreur(404, 'introuvable', 'Demande introuvable.');
  const regle = TRANSITIONS[a.action];
  if (!(regle.de as readonly string[]).includes(actuelle.statut)) {
    return erreur(409, 'transition_impossible', `Cette demande est « ${actuelle.statut} » : l’action « ${a.action} » n’est pas possible.`, { statut: actuelle.statut });
  }
  if (a.action === 'prolonger' && !a.heures) return erreur(400, 'donnees_invalides', 'Indiquez de combien d’heures prolonger le délai.');

  let nouveauStatut: string = regle.vers ?? actuelle.statut;
  let nouvelleFin: string | null;
  if (a.action === 'accepter') nouvelleFin = new Date(maintenant.getTime() + deps.config.holds.accepted_days * 86_400_000).toISOString();
  else if (a.action === 'prolonger') {
    const base = Math.max(Date.parse(actuelle.expire_at ?? t), maintenant.getTime());
    const plafond = maintenant.getTime() + 30 * 86_400_000;
    nouvelleFin = new Date(Math.min(base + a.heures! * 3_600_000, plafond)).toISOString();
  } else nouvelleFin = null;

  // Mise à jour gardée : elle ne s’applique que si le statut n’a pas changé et que le délai court encore.
  const resultats = await db.batch([
    db.prepare(`UPDATE demandes SET statut = ?, expire_at = ?, updated_at = ? WHERE id = ? AND statut = ? AND (expire_at IS NULL OR expire_at > ?)`)
      .bind(nouveauStatut, nouvelleFin, t, id, actuelle.statut, t),
    db.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) SELECT ?, ?, ?, ?, ? WHERE changes() > 0")
      .bind(id, JOURNAL[a.action], auteur, a.message ?? null, t),
  ]);
  if (resultats[0].meta.changes !== 1) return erreur(409, 'transition_impossible', 'Cette demande vient de changer : rechargez-la avant de recommencer.');
  return json({ ok: true, statut: nouveauStatut, expire_at: nouvelleFin });
}

