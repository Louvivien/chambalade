// Mise en forme des textes légaux : jetons {nom}, liens [texte](adresse) et points à confirmer.
export type Segment = { type: 'text'; text: string } | { type: 'link'; text: string; href: string };

const lien = /\[([^\]]+)\]\(([^)\s]+)\)/g;
// Seules les adresses du site (« /… ») et https:// sont acceptées : jamais javascript: ni data:.
const adresseSure = (href: string) => /^\/(?!\/)/.test(href) || /^https:\/\/[^\s]+$/.test(href);

export function garnir(texte: string, valeurs: Record<string, string>): string {
  return texte.replace(/\{([a-z]+)\}/g, (jeton, nom: string) => {
    if (!(nom in valeurs)) throw new Error(`Jeton inconnu dans un texte légal : ${jeton}`);
    return valeurs[nom];
  });
}

export function segments(texte: string): Segment[] {
  const resultat: Segment[] = [];
  let fin = 0;
  for (const m of texte.matchAll(lien)) {
    if (!adresseSure(m[2])) throw new Error(`Adresse de lien refusée : ${m[2]}`);
    if (m.index > fin) resultat.push({ type: 'text', text: texte.slice(fin, m.index) });
    resultat.push({ type: 'link', text: m[1], href: m[2] });
    fin = m.index + m[0].length;
  }
  if (fin < texte.length) resultat.push({ type: 'text', text: texte.slice(fin) });
  return resultat;
}

export const estAConfirmer = (texte: string) => texte.includes('TODO(amaelle)');
