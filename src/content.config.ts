import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { priceIds, priceUnits } from './lib/tarifs';

const interfaceContent = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/interface' }),
  schema: z.object({
    name: z.string(), signature: z.string(), skipLink: z.string(),
    navigationLabel: z.string(), languagesLabel: z.string(), footerLabel: z.string(),
    homeLabel: z.string(), contactPending: z.string(), logoPending: z.string(),
    nav: z.array(z.object({ key: z.enum(['home', 'gite', 'lieu', 'reserver']), label: z.string() })),
    legal: z.array(z.object({ key: z.enum(['mentions', 'confidentialite', 'conditions']), label: z.string() })),
    directoryLabel: z.string(),
    notFound: z.object({ title: z.string(), text: z.string(), link: z.string() }),
    languages: z.array(z.object({ code: z.enum(['fr', 'en']), label: z.string() })),
  }),
});

const accueil = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/accueil' }),
  schema: ({ image }) => {
    const photo = z.object({ src: image(), alt: z.string().min(1) });
    return z.object({
      title: z.string(), description: z.string(),
      hero: z.object({ title: z.string(), introduction: z.string(), discover: z.string(), request: z.string(), desktop: photo, mobile: photo }),
      introduction: z.object({ title: z.string(), text: z.string(), photo, caption: z.string() }),
      activities: z.object({
        title: z.string(), lodgeTitle: z.string(), lodgeText: z.string(), lodgeLink: z.string(),
        soon: z.string(), interestLink: z.string(),
        upcoming: z.array(z.object({ title: z.string(), text: z.string() })),
      }),
      reasons: z.object({ title: z.string(), items: z.array(z.object({ title: z.string(), text: z.string() })), photo }),
      region: z.object({ title: z.string(), text: z.string(), location: z.string() }),
      stay: z.object({ title: z.string(), text: z.string(), requestLink: z.string() }),
    });
  },
});

const gite = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/gite' }),
  schema: ({ image }) => {
    const photo = z.object({ src: image(), alt: z.string(), caption: z.string() });
    return z.object({
      title: z.string(), description: z.string(),
      hero: z.object({ title: z.string(), text: z.string(), opening: z.string(), ratesLink: z.string(), requestLink: z.string(), photo }),
      rooms: z.object({ title: z.string(), capacityLabel: z.string(), items: z.array(z.object({ title: z.string(), text: z.string() })), photosPending: z.string() }),
      horse: z.object({ title: z.string(), text: z.string(), vaccines: z.string(), future: z.string() }),
      rates: z.object({
        title: z.string(), introduction: z.string(), included: z.string(), unknown: z.string(),
        units: z.record(z.enum(priceUnits), z.string()),
        items: z.record(z.enum(priceIds), z.object({ label: z.string(), pending: z.string().startsWith('TODO(amaelle)').optional() })),
      }),
      shared: z.object({ title: z.string(), text: z.string(), mealsTitle: z.string(), mealsText: z.string() }),
      practical: z.object({ title: z.string(), photo, items: z.array(z.object({ title: z.string(), pending: z.string() })) }),
      stay: z.object({ title: z.string(), text: z.string(), link: z.string() }),
    });
  },
});

const lieu = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/lieu' }),
  schema: ({ image }) => {
    const photo = z.object({ src: image(), alt: z.string().min(1), caption: z.string() });
    const marker = z.object({ symbol: z.string().length(1), label: z.string(), accessibleLabel: z.string(), description: z.string() });
    const surrounding = z.object({ title: z.string(), text: z.string(), photo });
    return z.object({
      title: z.string(), description: z.string(),
      hero: z.object({ title: z.string(), text: z.string(), accessLink: z.string() }),
      aerial: z.object({ title: z.string(), instructions: z.string(), navigationLabel: z.string(), legendLabel: z.string(), photo, markers: z.object({ gite: marker, carriere: marker, pres: marker }) }),
      facilities: z.object({ title: z.string(), items: z.array(z.object({ id: z.enum(['carriere', 'ptv', 'paddocks']), title: z.string(), text: z.string() })), pending: z.string(), photo, lodgeLink: z.string() }),
      horses: z.object({ title: z.string(), text: z.string(), instinct: photo, baraka: photo, pending: z.string() }),
      surroundings: z.object({ title: z.string(), text: z.string(), dionay: surrounding, cascade: surrounding }),
      access: z.object({ title: z.string(), text: z.string(), mapLink: z.string(), vehicleTitle: z.string(), vehicleText: z.string(), distanceTitle: z.string(), distanceText: z.string(), lodgeLink: z.string() }),
      stay: z.object({ title: z.string(), text: z.string(), lodgeLink: z.string(), requestLink: z.string() }),
    });
  },
});

const reserver = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/reserver' }),
  schema: z.object({
    title: z.string(), description: z.string(),
    hero: z.object({ title: z.string(), text: z.string(), opening: z.string() }),
    noscript: z.object({ text: z.string(), contact: z.string() }),
    dates: z.object({
      legend: z.string(), instructions: z.string(), calendarLabel: z.string(), previousMonth: z.string(), nextMonth: z.string(),
      arrival: z.string(), departure: z.string(), loadErrorDev: z.string(), retry: z.string(), none: z.string(), nightsOne: z.string(), nightsMany: z.string(), clear: z.string(),
      keyAvailable: z.string(), keyFull: z.string(), keyChosen: z.string(), full: z.string(), loading: z.string(), loadError: z.string(),
      pickDeparture: z.string(), tooEarly: z.string(), weekdays: z.array(z.string()).length(7),
      stateAvailable: z.string(), stateClosed: z.string(), stateUnknown: z.string(), stateArrival: z.string(), stateDeparture: z.string(), stateInStay: z.string(),
      stateDeparturePossible: z.string(), stateDepartureImpossible: z.string(), selectedArrival: z.string(), selectedStay: z.string(),
    }),
    group: z.object({ legend: z.string(), adults: z.string(), children: z.string(), childrenHint: z.string().startsWith('TODO(amaelle)'), horses: z.string(), horsesHint: z.string().startsWith('TODO(amaelle)') }),
    lodging: z.object({
      legend: z.string(), intro: z.string(),
      rooms: z.object({ chambre_privee: z.string(), chambre_2: z.string(), chambre_3: z.string() }),
      dormitory: z.string(), dormitoryCount: z.string(), breakfast: z.string(),
    }),
    meals: z.object({ legend: z.string(), intro: z.string(), dinner: z.string(), lunch: z.string(), noDates: z.string() }),
    contact: z.object({
      legend: z.string(), lastName: z.string(), firstName: z.string(), email: z.string(), phone: z.string(), message: z.string(),
      messageHint: z.string(), consent: z.string(), consentPrivacy: z.string(), antiRobot: z.string(),
    }),
    quote: z.object({
      title: z.string(), mention: z.string(), provisional: z.string(), incomplete: z.string(), empty: z.string(), pending: z.string(),
      included: z.string(), total: z.string(), deposit: z.string(), depositUnknown: z.string(), availabilityWarning: z.string(),
      updating: z.string(), error: z.string(), lines: z.record(z.enum(priceIds), z.string()),
    }),
    submit: z.object({ label: z.string(), sending: z.string(), summaryTitle: z.string(), missingKey: z.string() }),
    errors: z.object({ fields: z.object({ nom: z.string(), prenom: z.string(), email: z.string() }), required: z.string(), email: z.string(), noDates: z.string(), noLodging: z.string(), consent: z.string(), antiRobot: z.string(), network: z.string(), server: z.string(), rateLimit: z.string() }),
    confirmation: z.object({ title: z.string(), reference: z.string(), next: z.string(), notBooking: z.string(), recap: z.string(), again: z.string() }),
    // Seulement en anglais : en français, l’API répond déjà dans la langue de la page.
    unitNames: z.record(z.enum(['chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks']), z.string()).optional(),
    serverErrors: z.record(z.string(), z.string()).optional(),
  }),
});

const texte = z.string();
const dico = z.record(z.string(), z.string());
const admin = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/admin' }),
  schema: z.object({
    title: texte,
    header: z.object({ title: texte, signedIn: texte, navLabel: texte, skip: texte, nav: z.object({ demandes: texte, calendrier: texte, blocages: texte }) }),
    common: z.object({ loading: texte, retry: texte, back: texte, cancel: texte, close: texte, noscript: texte, errors: z.object({ unauthenticated: texte, forbidden: texte, notConfigured: texte, network: texte, server: texte, notFound: texte, conflict: texte }) }),
    statuts: dico,
    unites: dico,
    demandes: z.object({ title: texte, filterLabel: texte, filterAll: texte, filterPending: texte, empty: texte, reference: texte, stay: texte, people: texte, total: texte, status: texte, open: texte, expiresIn: texte, expired: texte, hours: texte, days: texte, minutes: texte, adults: texte, children: texte, horses: texte, pending: texte, openCount: texte, refresh: texte, period: texte }),
    fiche: z.object({
      stay: texte, arrival: texte, departure: texte, nights: texte, group: texte, lodging: texte, dormitory: texte, meals: texte, dinners: texte, lunches: texte, noMeals: texte,
      contact: texte, language: texte, languages: dico, message: texte, noMessage: texte, quote: texte, quoteTotal: texte, quotePending: texte, quoteIncluded: texte, quoteIncomplete: texte, quoteProvisional: texte,
      deposit: texte, depositNone: texte, deadline: texte, journal: texte, actions: texte, noActions: texte, lines: dico, rooms: dico, action: dico, actionHelp: dico,
      messageLabel: texte, messageHint: texte, depositLabel: texte, depositHint: texte.startsWith('TODO(amaelle)'), extendLabel: texte, extendOptions: dico, confirm: texte, working: texte, depositInvalid: texte, done: texte, email: dico, journalActions: dico, journalBy: dico,
    }),
    calendrier: z.object({ title: texte, monthLabel: texte, previous: texte, next: texte, today: texte, unit: texte, legendTitle: texte, free: texte, states: dico, codes: dico, cellLabel: texte, cellFree: texte, details: texte, quantity: texte, capacityUnknown: texte, openRequest: texte, note: texte }),
    blocages: z.object({ title: texte, intro: texte, formTitle: texte, unitLabel: texte, startLabel: texte, endLabel: texte, motifLabel: texte, noteLabel: texte, create: texte, list: texte, empty: texte, delete: texte, deleteConfirm: texte, created: texte, deleted: texte, conflicts: texte, motifs: dico, errors: z.object({ dates: texte, required: texte }) }),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: texte, description: texte,
    hero: z.object({ title: texte, text: texte }),
    draft: z.object({ title: texte, text: texte }),
    identity: z.object({
      title: texte, missing: texte,
      rows: z.object({ name: texte, status: texte, siret: texte, address: texte, phone: texte, email: texte, publication: texte }),
    }).optional(),
    sections: z.array(z.object({
      id: z.string().regex(/^[a-z-]+$/), title: texte,
      paragraphs: z.array(texte).min(1), items: z.array(texte).optional(), after: z.array(texte).optional(),
    })).min(1),
  }),
});

export const collections = { interface: interfaceContent, accueil, gite, lieu, reserver, admin, legal };
