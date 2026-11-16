export type Vue = { vue: 'demandes' } | { vue: 'fiche'; id: number } | { vue: 'calendrier'; mois: string | null } | { vue: 'blocages' };

/**
 * Les vues de l’administration se choisissent dans l’adresse (après le #), pour que chaque fiche ait un lien
 * direct, y compris dans les e-mails : `#demande-12`, `#calendrier`, `#calendrier-2027-05`, `#blocages`.
 */
export function lireVue(hash: string): Vue {
  const h = hash.replace(/^#/, '');
  const fiche = /^demande-(\d{1,9})$/.exec(h);
  if (fiche) return { vue: 'fiche', id: Number(fiche[1]) };
  const mois = /^calendrier(?:-(\d{4}-(?:0[1-9]|1[0-2])))?$/.exec(h);
  if (mois) return { vue: 'calendrier', mois: mois[1] ?? null };
  if (h === 'blocages') return { vue: 'blocages' };
  return { vue: 'demandes' };
}

export function hashDe(v: Vue): string {
  switch (v.vue) {
    case 'fiche': return `#demande-${v.id}`;
    case 'calendrier': return v.mois ? `#calendrier-${v.mois}` : '#calendrier';
    case 'blocages': return '#blocages';
    default: return '#demandes';
  }
}

/** L’onglet à mettre en évidence : la fiche d’une demande appartient à « Demandes ». */
export const ongletDe = (v: Vue): 'demandes' | 'calendrier' | 'blocages' => (v.vue === 'fiche' ? 'demandes' : v.vue);
