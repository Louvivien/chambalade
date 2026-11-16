import { estDateValide, joursEntre } from '../reservation/dates';
import { remplir } from '../reserver/formats';

export interface FormulaireBlocage { unite: string; debut: string; fin: string; motif: string; note: string }
export interface ProblemeBlocage { champ: 'unite' | 'debut' | 'fin' | 'motif'; message: string }

/** Contrôles de confort avant l’envoi ; le serveur revérifie tout. */
export function validerBlocage(f: FormulaireBlocage, t: { dates: string; required: string }): ProblemeBlocage[] {
  const manques: ProblemeBlocage[] = [];
  if (!f.unite) manques.push({ champ: 'unite', message: t.required });
  if (!f.motif) manques.push({ champ: 'motif', message: t.required });
  if (!estDateValide(f.debut)) manques.push({ champ: 'debut', message: t.required });
  if (!estDateValide(f.fin)) manques.push({ champ: 'fin', message: t.required });
  if (manques.length > 0) return manques;
  return joursEntre(f.debut, f.fin) < 1 ? [{ champ: 'fin', message: t.dates }] : [];
}

export const corpsBlocage = (f: FormulaireBlocage) => ({ unite: f.unite, date_debut: f.debut, date_fin: f.fin, motif: f.motif, ...(f.note.trim() ? { note: f.note.trim() } : {}) });

export const phraseBlocage = (modele: string, unite: string, debut: string, fin: string) => remplir(modele, { unite, debut, fin });
