import { dateLongue, nuits } from '../reservation/dates';
import { euros, remplir } from '../reserver/formats';

export interface TextesDemandes {
  expiresIn: string; expired: string; hours: string; days: string; minutes: string;
  adults: string; children: string; horses: string; pending: string;
}

/** « 1 j 4 h », « 35 min » : le temps restant avant l’expiration, au plus précis utile. */
export function dureeRestante(secondes: number, t: Pick<TextesDemandes, 'hours' | 'days' | 'minutes'>): string {
  const minutesTotal = Math.max(0, Math.floor(secondes / 60));
  const jours = Math.floor(minutesTotal / 1440);
  const heures = Math.floor((minutesTotal % 1440) / 60);
  if (jours > 0) return [remplir(t.days, { n: jours }), ...(heures > 0 ? [remplir(t.hours, { n: heures })] : [])].join(' ');
  if (heures > 0) return remplir(t.hours, { n: heures });
  return remplir(t.minutes, { n: Math.max(1, minutesTotal) });
}

/** « Du 10 mai au 13 mai 2027 » : sobre, sans flèche ni abréviation. */
export function periode(arrivee: string, depart: string, du: string): string {
  return remplir(du, { debut: dateLongue(arrivee), fin: `${dateLongue(depart)} ${depart.slice(0, 4)}` });
}

export const nombreDeNuits = (arrivee: string, depart: string) => nuits(arrivee, depart).length;

export interface DemandeListe {
  id: number; reference: string; statut: string; date_arrivee: string; date_depart: string;
  nb_adultes: number; nb_enfants: number; nb_chevaux: number; nom: string; prenom: string;
  total_cents: number | null; expire_at: string | null; secondes_restantes: number | null;
}
export interface LigneListe { id: number; reference: string; nom: string; sejour: [string, string]; personnes: string; total: string; statut: string; reste: string | null; urgente: boolean }

/** La liste telle qu’elle s’affiche. Un total nul s’écrit « à confirmer » : la liste ne sait pas si le devis est complet. */
export function lignesListe(demandes: DemandeListe[], t: TextesDemandes, urgenceSecondes = 12 * 3600): LigneListe[] {
  return demandes.map(d => {
    const personnes = [remplir(t.adults, { n: d.nb_adultes }), ...(d.nb_enfants > 0 ? [remplir(t.children, { n: d.nb_enfants })] : []), ...(d.nb_chevaux > 0 ? [remplir(t.horses, { n: d.nb_chevaux })] : [])].join(', ');
    return {
      id: d.id, reference: d.reference, nom: `${d.prenom} ${d.nom}`.trim(),
      sejour: [`${dateLongue(d.date_arrivee)} ${d.date_arrivee.slice(0, 4)}`, `${dateLongue(d.date_depart)} ${d.date_depart.slice(0, 4)}`],
      personnes, total: d.total_cents && d.total_cents > 0 ? euros(d.total_cents) : t.pending, statut: d.statut,
      reste: d.secondes_restantes === null ? null : d.secondes_restantes <= 0 ? t.expired : remplir(t.expiresIn, { duree: dureeRestante(d.secondes_restantes, t) }),
      urgente: d.secondes_restantes !== null && d.secondes_restantes <= urgenceSecondes,
    };
  });
}

/**
 * Lit un montant saisi en euros (« 76,50 », « 76.5 », « 76 ») et rend des centimes entiers.
 * Rend `null` pour une saisie vide, `'invalide'` pour tout ce qui n’est pas un montant raisonnable.
 */
export function eurosEnCentimes(saisie: string, maxEuros = 10_000): number | null | 'invalide' {
  const s = saisie.trim().replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return 'invalide';
  const centimes = Math.round(Number(s) * 100);
  return centimes > maxEuros * 100 ? 'invalide' : centimes;
}

/** Heure de Paris : « 8 mars 2027, 11:00 ». */
export function dateHeure(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso));
}
