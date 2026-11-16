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

const echapperXml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface PageSitemap { url: string; alternatives: Array<{ langue: Locale; url: string }> }

/** sitemap.xml avec, pour chaque page, ses versions dans les deux langues (hreflang) et x-default. */
export function construireSitemap(pages: PageSitemap[]): string {
  const lignes = pages.map(p => {
    const alts = p.alternatives.map(a => `    <xhtml:link rel="alternate" hreflang="${a.langue}" href="${echapperXml(a.url)}" />`);
    const defaut = p.alternatives.find(a => a.langue === 'fr');
    if (defaut) alts.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${echapperXml(defaut.url)}" />`);
    return `  <url>\n    <loc>${echapperXml(p.url)}</loc>\n${alts.join('\n')}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${lignes.join('\n')}\n</urlset>\n`;
}

/** robots.txt : tout est ouvert sauf l’administration et l’API (qui restent protégées par Cloudflare Access / les contrôles serveur). */
export function construireRobots(urlSitemap: string, interdits: string[]): string {
  return ['User-agent: *', 'Allow: /', ...interdits.map(c => `Disallow: ${c}`), '', `Sitemap: ${urlSitemap}`, ''].join('\n');
}

export interface DonneesEntreprise {
  nom: string; description: string; url: string; image?: string; langue: Locale;
  adresse: { rue: string; codePostal: string; ville: string; region: string; pays: string };
  telephone?: string | null; email?: string | null;
}

/**
 * Données structurées schema.org « LodgingBusiness ». Uniquement des faits connus : jamais de tarif,
 * d’horaire, de note, de coordonnées GPS ni de contact inconnu.
 */
export function donneesStructurees(d: DonneesEntreprise): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: d.nom,
    description: d.description,
    url: d.url,
    inLanguage: d.langue,
    ...(d.image ? { image: d.image } : {}),
    address: {
      '@type': 'PostalAddress', streetAddress: d.adresse.rue, postalCode: d.adresse.codePostal,
      addressLocality: d.adresse.ville, addressRegion: d.adresse.region, addressCountry: d.adresse.pays,
    },
    ...(d.telephone ? { telephone: d.telephone } : {}),
    ...(d.email ? { email: d.email } : {}),
  };
}

/** JSON sûr à poser dans un <script type="application/ld+json"> : « < » ne peut pas fermer la balise. */
export const jsonPourScript = (donnees: unknown) => JSON.stringify(donnees).replace(/</g, '\\u003c');
