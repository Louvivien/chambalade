// Petits utilitaires DOM partagés par les scripts de la page Réserver.

type Attributs = Record<string, string | number | boolean | null | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(balise: K, attributs: Attributs = {}, enfants: Array<Node | string> = []): HTMLElementTagNameMap[K] {
  const e = document.createElement(balise);
  for (const [cle, valeur] of Object.entries(attributs)) {
    if (valeur === null || valeur === undefined || valeur === false) continue;
    e.setAttribute(cle, valeur === true ? '' : String(valeur));
  }
  e.append(...enfants);
  return e;
}

export function trouver<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Élément introuvable : #${id}`);
  return e as T;
}

export const vider = (e: Element) => e.replaceChildren();
