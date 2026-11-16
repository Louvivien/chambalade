// Balises de tête communes à toutes les pages publiques : canonical, Open Graph, Twitter.
import type { Locale } from './routes';

export interface EntreeMeta { balise: 'meta' | 'link'; attributs: Record<string, string> }
export interface ImagePartage { url: string; largeur: number; hauteur: number; alt: string }
export interface OptionsMeta {
  langue: Locale;
  titre: string;
  description: string;
  /** Adresse absolue de la page. */
  url: string;
  nomDuSite: string;
  image?: ImagePartage;
}

export const localeOg: Record<Locale, string> = { fr: 'fr_FR', en: 'en_GB' };
const autre = (l: Locale): Locale => (l === 'fr' ? 'en' : 'fr');

export function construireMeta(o: OptionsMeta): EntreeMeta[] {
  const meta = (cle: 'property' | 'name', nom: string, contenu: string): EntreeMeta => ({ balise: 'meta', attributs: { [cle]: nom, content: contenu } });
  const entrees: EntreeMeta[] = [
    { balise: 'link', attributs: { rel: 'canonical', href: o.url } },
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', o.nomDuSite),
    meta('property', 'og:title', o.titre),
    meta('property', 'og:description', o.description),
    meta('property', 'og:url', o.url),
    meta('property', 'og:locale', localeOg[o.langue]),
    meta('property', 'og:locale:alternate', localeOg[autre(o.langue)]),
    meta('name', 'twitter:card', o.image ? 'summary_large_image' : 'summary'),
    meta('name', 'twitter:title', o.titre),
    meta('name', 'twitter:description', o.description),
  ];
  if (o.image) {
    entrees.push(
      meta('property', 'og:image', o.image.url),
      meta('property', 'og:image:width', String(o.image.largeur)),
      meta('property', 'og:image:height', String(o.image.hauteur)),
      meta('property', 'og:image:alt', o.image.alt),
      meta('name', 'twitter:image', o.image.url),
      meta('name', 'twitter:image:alt', o.image.alt),
    );
  }
  return entrees;
}
