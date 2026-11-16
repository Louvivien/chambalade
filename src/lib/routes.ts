// Table unique des routes publiques : une page = une clé, une adresse par langue.
export type Locale = 'fr' | 'en';
export type PageKey = 'home' | 'gite' | 'lieu' | 'reserver' | 'mentions' | 'confidentialite' | 'conditions';
export type AvailablePages = Partial<Record<PageKey, string>>;

export const locales: readonly Locale[] = ['fr', 'en'];
export const pageKeys: readonly PageKey[] = ['home', 'gite', 'lieu', 'reserver', 'mentions', 'confidentialite', 'conditions'];

export const routes: Record<Locale, Record<PageKey, string>> = {
  fr: { home: '/', gite: '/gite/', lieu: '/le-lieu/', reserver: '/reserver/', mentions: '/mentions-legales/', confidentialite: '/confidentialite/', conditions: '/conditions-de-reservation/' },
  en: { home: '/en/', gite: '/en/guesthouse/', lieu: '/en/the-place/', reserver: '/en/book/', mentions: '/en/legal/', confidentialite: '/en/privacy/', conditions: '/en/booking-terms/' },
};

/** Adresse d’une page dans une langue, avec ancre facultative (« cheval-titre » ou « #cheval-titre »). */
export const route = (locale: Locale, page: PageKey, ancre?: string) => routes[locale][page] + (ancre ? `#${ancre.replace(/^#/, '')}` : '');

/** Les adresses d’une même page dans toutes les langues (sélecteur de langue et hreflang). */
export const translationsOf = (page: PageKey): Record<Locale, string> => ({ fr: routes.fr[page], en: routes.en[page] });
