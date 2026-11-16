import type { LibresParNuit, Regles } from '../../src/lib/reserver/types';

export const regles: Regles = {
  premiereNuit: '2027-04-01', nuitsMin: 1, nuitsMax: 14, veillesMin: 1, moisMax: 12, fenetreMax: 62, litsDortoir: 6,
  capacitesChambre: { chambre_privee: 2, chambre_2: 2, chambre_3: 2 },
};
export const AUJOURDHUI = '2027-03-01';
export const bornes = { premiere: '2027-04-01', derniere: '2028-03-01' };

export const libre = (over: Partial<LibresParNuit[string]> = {}): LibresParNuit[string] => ({ chambre_privee: 1, chambre_2: 1, chambre_3: 1, dortoir: 6, paddocks: 3, ...over });
export const libres = (parNuit: Record<string, Partial<LibresParNuit[string]>> = {}, defaut: Partial<LibresParNuit[string]> = {}, jours: string[] = []): LibresParNuit => {
  const r: LibresParNuit = {};
  for (const j of jours) r[j] = libre(defaut);
  for (const [j, v] of Object.entries(parNuit)) r[j] = libre({ ...defaut, ...v });
  return r;
};
