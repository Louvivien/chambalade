import { ajouterJours, dateLongue, estDateValide, joursEntre, nuits } from '../reservation/dates';
import { remplir } from '../reserver/formats';

export const UNITES = ['chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks'] as const;
export type EtatCellule = 'libre' | 'bloque' | 'confirmee' | 'acceptee' | 'en_attente';
/** Du plus fort au plus faible : une case qui cumule plusieurs états montre le premier. */
const PRIORITE: EtatCellule[] = ['bloque', 'confirmee', 'acceptee', 'en_attente', 'libre'];

export interface OccupationCal { unite: string; nuit: string; quantite: number; demande_id: number; reference: string; statut: string; nom: string; prenom?: string }
export interface BlocageCal { id: number; unite: string; date_debut: string; date_fin: string; motif: string; note: string | null }
export interface DonneesCalendrier { mois: string; du: string; au: string; capacites: Record<string, number | null>; occupations: OccupationCal[]; blocages: BlocageCal[] }

export interface CelluleCal { unite: string; jour: string; etat: EtatCellule; occupants: OccupationCal[]; blocage: BlocageCal | null; total: number; capacite: number | null; conflit: boolean }
export interface MoisCal { jours: string[]; lignes: Array<{ unite: string; cellules: CelluleCal[] }> }

/** Le mois, une ligne par unité et une case par nuit ; `au` est exclu. */
export function construireMois(d: DonneesCalendrier): MoisCal {
  const jours = nuits(d.du, d.au);
  const lignes = UNITES.map(unite => ({
    unite,
    cellules: jours.map((jour): CelluleCal => {
      const occupants = d.occupations.filter(o => o.unite === unite && o.nuit === jour);
      const blocage = d.blocages.find(b => (b.unite === 'toutes' || b.unite === unite) && b.date_debut <= jour && jour < b.date_fin) ?? null;
      const etats: EtatCellule[] = [...(blocage ? ['bloque' as const] : []), ...occupants.map(o => o.statut as EtatCellule)];
      const etat = PRIORITE.find(e => etats.includes(e)) ?? 'libre';
      return { unite, jour, etat, occupants, blocage, total: occupants.reduce((s, o) => s + o.quantite, 0), capacite: d.capacites[unite] ?? null, conflit: !!blocage && occupants.length > 0 };
    }),
  }));
  return { jours, lignes };
}

/** Texte court d’une case : la lettre de l’état, et le nombre de places quand l’unité en a plusieurs ou une capacité inconnue. */
export function texteCellule(c: CelluleCal, codes: Record<string, string>): string {
  if (c.etat === 'libre') return '';
  const code = codes[c.etat] ?? '?';
  const plusieursPlaces = c.capacite === null || c.capacite > 1;
  return plusieursPlaces && c.total > 0 ? `${code} ${c.total}` : code;
}

/** Phrase complète pour les lecteurs d’écran : « Dortoir, lundi 10 mai : Confirmée, 3 place(s) ». */
export function libelleCellule(c: CelluleCal, t: { cellLabel: string; cellFree: string; quantity: string; states: Record<string, string>; unites: Record<string, string>; capacityUnknown: string }): string {
  const base = { unite: t.unites[c.unite] ?? c.unite, jour: dateLongue(c.jour) };
  if (c.etat === 'libre') return remplir(t.cellFree, base);
  const etat = [t.states[c.etat], ...(c.total > 0 ? [remplir(t.quantity, { n: c.total })] : []), ...(c.capacite === null && c.total > 0 ? [t.capacityUnknown] : [])].join(', ');
  return remplir(t.cellLabel, { ...base, etat });
}

/** Mois voisin (AAAA-MM) : décalage de `delta` mois. */
export function moisVoisin(mois: string, delta: number): string {
  const [a, m] = mois.split('-').map(Number);
  const total = a * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export const moisEstValide = (mois: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(mois) && estDateValide(`${mois}-01`);
export const premierJour = (mois: string) => `${mois}-01`;
export const jourDuMois = (jour: string) => Number(jour.slice(8));
/** Lundi = 1 … dimanche = 7, pour griser le week-end dans l’en-tête. */
export const jourDeSemaine = (jour: string) => ((new Date(`${jour}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
export const nombreDeJours = (mois: string) => joursEntre(premierJour(mois), premierJour(moisVoisin(mois, 1)));
export const lendemain = (jour: string) => ajouterJours(jour, 1);
