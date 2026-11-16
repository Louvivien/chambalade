import { adresses, envoyerEmail, type ResultatEnvoi } from '../emails/envoi';
import { construireEmail, MODELES_CLIENTE, type DemandeEmail, type Modele } from '../emails/modeles';
import type { ApiDeps } from './types';

interface Options {
  /** Origine du site, pour le lien direct vers la fiche dans l’administration. */
  origine: string;
  messageAdmin?: string | null;
  /** Ne rien écrire au journal quand l’e-mail n’est pas configuré (alertes répétées). */
  silencieuxSiNonConfigure?: boolean;
}

/**
 * Envoie l’e-mail d’un modèle pour une demande et consigne l’issue au journal : le modèle et le
 * résultat seulement, jamais d’adresse. Ne lève jamais d’exception.
 */
export async function notifier(deps: ApiDeps, modele: Modele, demandeId: number, o: Options): Promise<ResultatEnvoi> {
  const { DB } = deps.env;
  try {
    const d = await DB.prepare('SELECT * FROM demandes WHERE id = ?').bind(demandeId).first<Record<string, unknown>>();
    if (!d) return { statut: 'echec', code: null };
    const demande: DemandeEmail = {
      reference: String(d.reference), langue: d.langue === 'en' ? 'en' : 'fr', prenom: String(d.prenom), nom: String(d.nom), email: String(d.email),
      telephone: (d.telephone as string | null) ?? null, message: (d.message as string | null) ?? null,
      date_arrivee: String(d.date_arrivee), date_depart: String(d.date_depart),
      nb_adultes: Number(d.nb_adultes), nb_enfants: Number(d.nb_enfants), nb_chevaux: Number(d.nb_chevaux),
      choix: JSON.parse(String(d.choix)), devis: JSON.parse(String(d.devis)),
      expire_at: (d.expire_at as string | null) ?? null, acompte_cents: d.acompte_cents === null || d.acompte_cents === undefined ? null : Number(d.acompte_cents),
    };
    const email = construireEmail(modele, demande, {
      heures: deps.config.holds.pending_hours, messageAdmin: o.messageAdmin, infosVirement: deps.env.VIREMENT_INFOS?.trim() || null,
      lien: `${o.origine}/admin/#demande-${demandeId}`,
    });
    const pourLaCliente = (MODELES_CLIENTE as readonly string[]).includes(modele);
    const destinataires = pourLaCliente ? [demande.email] : adresses(deps.env.NOTIFY_EMAILS || deps.env.ADMIN_EMAILS);
    // Les réponses de la cliente vont à Amaëlle ; celles d’Amaëlle à la cliente.
    const repondreA = pourLaCliente ? deps.env.EMAIL_REPLY_TO : demande.email;
    const resultat = await envoyerEmail(deps, destinataires, email, repondreA);
    if (!(resultat.statut === 'non_configure' && o.silencieuxSiNonConfigure)) {
      const action = resultat.statut === 'envoye' ? 'email_envoye' : resultat.statut === 'echec' ? 'email_echec' : 'email_ignore';
      const detail = resultat.statut === 'echec' ? `${modele}${resultat.code ? ` (HTTP ${resultat.code})` : ''}` : modele;
      await DB.prepare('INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES (?, ?, ?, ?, ?)').bind(demandeId, action, 'systeme', detail, deps.now().toISOString()).run();
    }
    return resultat;
  } catch (e) {
    console.error('notification_echec', e instanceof Error ? e.name : 'inconnue');
    return { statut: 'echec', code: null };
  }
}

/**
 * Signale à Amaëlle, une seule fois par demande, les demandes en attente qui vont expirer. Appelée
 * quand elle consulte l’administration : pas de tâche planifiée (docs/reservation.md, section 9).
 */
export async function alerterExpirations(deps: ApiDeps, origine: string): Promise<number> {
  if (!deps.env.EMAIL_API_KEY || !deps.env.EMAIL_FROM) return 0;
  const maintenant = deps.now();
  const limite = new Date(maintenant.getTime() + deps.config.api.expiry_alert_hours * 3_600_000).toISOString();
  const proches = await deps.env.DB.prepare(`SELECT id FROM demandes WHERE statut = 'en_attente' AND expire_at IS NOT NULL AND expire_at > ? AND expire_at <= ?
    AND NOT EXISTS (SELECT 1 FROM journal j WHERE j.demande_id = demandes.id AND j.action = 'alerte_expiration')`).bind(maintenant.toISOString(), limite).all<{ id: number }>();
  let envoyees = 0;
  for (const { id } of proches.results) {
    const r = await notifier(deps, 'expiration', id, { origine, silencieuxSiNonConfigure: true });
    if (r.statut === 'envoye') {
      await deps.env.DB.prepare("INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES (?, 'alerte_expiration', 'systeme', NULL, ?)").bind(id, maintenant.toISOString()).run();
      envoyees++;
    }
  }
  return envoyees;
}
