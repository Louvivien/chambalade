import emailsJson from '../../generated/emails.json';
import { nuits } from '../reservation/dates';
import { remplir } from '../reserver/formats';
import { dateDansLangue, echapperHtml, echeance, eurosDansLangue, nettoyerEnTete, type Langue } from './formats';

export type Modele = 'recue' | 'acceptee' | 'confirmee' | 'refusee' | 'annulee' | 'nouvelle' | 'expiration';
export const MODELES_CLIENTE: readonly Modele[] = ['recue', 'acceptee', 'confirmee', 'refusee', 'annulee'];

interface TextesModele { sujet: string; paragraphes: string[]; [autre: string]: unknown }
interface TextesLangue {
  salutation: string; cloture: string; signature: string; pied: string; messageAmaelle: string;
  recap: Record<string, string>; chambres: Record<string, string>; lignes: Record<string, string>;
  [modele: string]: unknown;
}
const TEXTES = emailsJson as unknown as Record<Langue, TextesLangue>;

/** Ce que les modèles savent d’une demande (lecture de la base, voir demandes dans migrations/0001). */
export interface DemandeEmail {
  reference: string; langue: Langue; prenom: string; nom: string; email: string;
  telephone: string | null; message: string | null;
  date_arrivee: string; date_depart: string; nb_adultes: number; nb_enfants: number; nb_chevaux: number;
  choix: { chambres?: string[]; litsDortoir?: number };
  devis: {
    lignes: Array<{ id: string; unite?: string; quantite: number; prix_unitaire_cents: number | null; total_cents: number | null; statut: string }>;
    total_cents: number; complet: boolean; provisoire: boolean;
  };
  expire_at: string | null;
  acompte_cents: number | null;
}

export interface OptionsEmail {
  /** Délai de réponse annoncé (heures), venant de la configuration. */
  heures: number;
  /** Mot libre d’Amaëlle, repris tel quel dans l’e-mail à la cliente. */
  messageAdmin?: string | null;
  /** Coordonnées bancaires, fournies par la configuration Cloudflare (jamais dans le dépôt). */
  infosVirement?: string | null;
  /** Adresse directe de la fiche dans l’administration. */
  lien?: string;
}

export interface EmailConstruit { sujet: string; texte: string; html: string; langue: Langue }

// — Mise en forme commune : une liste de blocs rendue en texte brut et en HTML —
type Bloc =
  | { t: 'p'; texte: string }
  | { t: 'titre'; texte: string }
  | { t: 'lignes'; lignes: Array<[string, string]> }
  | { t: 'cite'; texte: string }
  | { t: 'note'; texte: string }
  | { t: 'lien'; libelle: string; url: string };

function rendreTexte(blocs: Bloc[]): string {
  return blocs.map(b => {
    switch (b.t) {
      case 'p': case 'note': return b.texte;
      case 'titre': return b.texte.toUpperCase();
      case 'lignes': return b.lignes.map(([a, v]) => (v ? `${a} : ${v}` : a)).join('\n');
      case 'cite': return b.texte.split('\n').map(l => `> ${l}`).join('\n');
      case 'lien': return `${b.libelle} : ${b.url}`;
    }
  }).join('\n\n') + '\n';
}

function rendreHtml(blocs: Bloc[], langue: Langue): string {
  const corps = blocs.map(b => {
    switch (b.t) {
      case 'p': return `<p style="margin:0 0 16px">${echapperHtml(b.texte).replace(/\n/g, '<br>')}</p>`;
      case 'note': return `<p style="margin:0 0 16px;font-size:14px">${echapperHtml(b.texte)}</p>`;
      case 'titre': return `<h2 style="margin:24px 0 8px;font-size:18px">${echapperHtml(b.texte)}</h2>`;
      case 'lignes': return `<table role="presentation" style="border-collapse:collapse;margin:0 0 16px;width:100%">${b.lignes.map(([a, v]) => `<tr><td style="padding:4px 12px 4px 0;vertical-align:top">${echapperHtml(a)}</td><td style="padding:4px 0;text-align:right;font-weight:bold">${echapperHtml(v)}</td></tr>`).join('')}</table>`;
      case 'cite': return `<blockquote style="margin:0 0 16px;padding:8px 16px;border-left:4px solid #c9a77c">${echapperHtml(b.texte).replace(/\n/g, '<br>')}</blockquote>`;
      case 'lien': return `<p style="margin:0 0 16px"><a href="${echapperHtml(b.url)}">${echapperHtml(b.libelle)}</a></p>`;
    }
  }).join('');
  return `<!doctype html><html lang="${langue}"><body style="margin:0;padding:24px;background:#f4ede1;color:#34392f;font:16px/1.6 Georgia,serif"><div style="max-width:560px;margin:0 auto">${corps}</div></body></html>`;
}

function recapitulatif(d: DemandeEmail, t: TextesLangue, complet: boolean): Bloc[] {
  const l = d.langue;
  const r = t.recap;
  const nombreDeNuits = nuits(d.date_arrivee, d.date_depart).length;
  const lignes: Array<[string, string]> = [
    [r.reference, d.reference],
    [r.arrivee, dateDansLangue(d.date_arrivee, l)],
    [r.depart, dateDansLangue(d.date_depart, l)],
    ['', remplir(nombreDeNuits > 1 ? r.nuitsPlusieurs : r.nuits, { n: nombreDeNuits })],
  ];
  const blocs: Bloc[] = [{ t: 'titre', texte: r.titre }];
  if (!complet) return [...blocs, { t: 'lignes', lignes }];
  lignes.push([r.adultes, String(d.nb_adultes)]);
  if (d.nb_enfants > 0) lignes.push([r.enfants, String(d.nb_enfants)]);
  if (d.nb_chevaux > 0) lignes.push([r.chevaux, String(d.nb_chevaux)]);
  const heberg = [...(d.choix.chambres ?? []).map(c => t.chambres[c] ?? c), ...((d.choix.litsDortoir ?? 0) > 0 ? [`${r.dortoir} : ${d.choix.litsDortoir}`] : [])];
  if (heberg.length > 0) lignes.push([r.hebergement, heberg.join(', ')]);
  blocs.push({ t: 'lignes', lignes });
  const devis: Array<[string, string]> = d.devis.lignes.map(x => [
    t.lignes[x.id] ?? x.id,
    x.statut === 'incluse' ? r.compris : x.total_cents === null || x.statut === 'a_confirmer' ? r.aConfirmer : eurosDansLangue(x.total_cents, l),
  ]);
  devis.push([r.total, d.devis.total_cents === 0 && !d.devis.complet ? r.aConfirmer : eurosDansLangue(d.devis.total_cents, l)]);
  blocs.push({ t: 'titre', texte: r.devis }, { t: 'lignes', lignes: devis }, { t: 'note', texte: r.mention });
  if (d.devis.provisoire) blocs.push({ t: 'note', texte: r.provisoire });
  if (!d.devis.complet) blocs.push({ t: 'note', texte: r.incomplet });
  return blocs;
}

/** Construit un e-mail : l’objet, le texte brut et le HTML d’un même contenu. */
export function construireEmail(modele: Modele, d: DemandeEmail, o: OptionsEmail): EmailConstruit {
  const pourAmaelle = modele === 'nouvelle' || modele === 'expiration';
  const langue: Langue = pourAmaelle ? 'fr' : d.langue;
  const t = TEXTES[langue];
  const m = t[modele] as TextesModele | undefined;
  if (!m) throw new Error(`Modèle d’e-mail absent : ${modele} (${langue})`);

  const acompte = d.acompte_cents !== null ? eurosDansLangue(d.acompte_cents, langue) : '';
  const variables = {
    prenom: d.prenom, nom: d.nom, reference: d.reference,
    arrivee: dateDansLangue(d.date_arrivee, langue), depart: dateDansLangue(d.date_depart, langue),
    heures: o.heures, acompte, limite: d.expire_at ? echeance(d.expire_at, langue) : '', lien: o.lien ?? '',
  };
  const dire = (s: string) => remplir(s, variables);

  const blocs: Bloc[] = [];
  if (!pourAmaelle) blocs.push({ t: 'p', texte: dire(t.salutation) });
  for (const p of m.paragraphes) blocs.push({ t: 'p', texte: dire(p) });

  if (modele === 'acceptee') {
    blocs.push({ t: 'p', texte: dire(d.acompte_cents !== null ? m.acompteConnu as string : m.acompteInconnu as string) });
    if (o.infosVirement) blocs.push({ t: 'p', texte: m.virement as string }, { t: 'cite', texte: o.infosVirement }, { t: 'p', texte: dire(m.referenceVirement as string) });
    else blocs.push({ t: 'p', texte: m.virementInconnu as string });
    blocs.push({ t: 'p', texte: m.liberation as string });
  }
  if (modele === 'nouvelle') {
    const contact: Array<[string, string]> = [[`${d.prenom} ${d.nom}`, ''], [m.email as string, d.email]];
    if (d.telephone) contact.push([m.telephone as string, d.telephone]);
    blocs.push({ t: 'titre', texte: m.contact as string }, { t: 'lignes', lignes: contact });
    if (d.message) blocs.push({ t: 'titre', texte: m.message as string }, { t: 'cite', texte: d.message });
  }
  if (!pourAmaelle && o.messageAdmin) blocs.push({ t: 'titre', texte: t.messageAmaelle }, { t: 'cite', texte: o.messageAdmin });

  const completes: Modele[] = ['recue', 'acceptee', 'confirmee', 'nouvelle'];
  blocs.push(...recapitulatif(d, t, completes.includes(modele)));
  if (pourAmaelle && o.lien) blocs.push({ t: 'lien', libelle: m.traiter as string, url: o.lien });
  if (!pourAmaelle) blocs.push({ t: 'p', texte: `${t.cloture}\n${t.signature}` }, { t: 'note', texte: t.pied });

  return { sujet: nettoyerEnTete(dire(m.sujet)), texte: rendreTexte(blocs), html: rendreHtml(blocs, langue), langue };
}
