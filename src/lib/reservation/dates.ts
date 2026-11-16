// Dates calendaires AAAA-MM-JJ, calculées en UTC pour éviter tout décalage d’heure d’été.
// « Aujourd’hui » est toujours fourni par l’appelant, en heure de Paris (voir dateParis).

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

export function estDateValide(value: string): boolean {
  const match = FORMAT.exec(value);
  if (!match) return false;
  const d = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return d.getUTCFullYear() === +match[1] && d.getUTCMonth() === +match[2] - 1 && d.getUTCDate() === +match[3];
}

function vers(value: string): Date {
  if (!estDateValide(value)) throw new RangeError(`Date invalide : ${value}`);
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const texte = (d: Date) => d.toISOString().slice(0, 10);

export function ajouterJours(value: string, jours: number): string {
  const d = vers(value);
  d.setUTCDate(d.getUTCDate() + jours);
  return texte(d);
}

/** Ajoute des mois en gardant le jour, ou le dernier jour du mois s’il n’existe pas (31 → 30). */
export function ajouterMois(value: string, mois: number): string {
  const d = vers(value);
  const jour = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + mois);
  const dernier = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(jour, dernier));
  return texte(d);
}

export function joursEntre(debut: string, fin: string): number {
  return Math.round((vers(fin).getTime() - vers(debut).getTime()) / 86_400_000);
}

/** Les nuits d’un séjour : arrivée incluse, départ exclu. */
export function nuits(arrivee: string, depart: string): string[] {
  const n = joursEntre(arrivee, depart);
  return Array.from({ length: Math.max(n, 0) }, (_, i) => ajouterJours(arrivee, i));
}

/** La date du jour à Paris pour un instant donné. */
export function dateParis(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** « 12 mai », « 1er juin » : pour les messages montrés à la cliente. */
export function dateLongue(value: string): string {
  const d = vers(value);
  const mois = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long' }).format(d);
  const jour = d.getUTCDate();
  return `${jour === 1 ? '1er' : jour} ${mois}`;
}
