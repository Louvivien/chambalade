# AGENTS.md — Site chambalade.fr

Instructions permanentes pour l'agent de développement (Codex). À lire avant toute tâche.

## Le projet en bref

Chambalade est une structure équestre à Roybon (Isère), au cœur de la forêt des Chambarans,
tenue par Amaëlle. Le site remplace l'actuel site Wix. Phase 1 (ce dépôt) : présentation
générale + gîte équestre, en français et en anglais. Phase 2 (plus tard) : balades encadrées
par Sylvie, pension des chevaux.

- Cible prioritaire : cavalières de 20 à 50 ans, autonomes, déjà pratiquantes, souvent seules,
  vivant en Auvergne-Rhône-Alpes. Tout le site leur parle d'abord.
- Promesse : venir se ressourcer en pleine nature, avec son cheval, dans un lieu où l'on est
  accueillie comme à la maison.
- Valeurs : simplicité, convivialité, ruralité, bien-être du cheval.
- Le gîte est en rénovation : ouverture au printemps 2027, demandes de réservation ouvertes.

Sources de vérité, à consulter avant d'écrire du contenu :
- `docs/brief.md` : marque, textes validés ou proposés, tarifs, infos pratiques, questions ouvertes.
- `docs/photos.md` : chaque photo, sa page, son traitement, son texte alternatif, son statut.
- `docs/etapes.md` : l'ordre de construction, étape par étape.

## Stack et contraintes techniques

- Astro (dernière version stable), site 100 % statique, déployé sur Cloudflare Pages.
- CSS natif avec variables (pas de Tailwind, pas de framework UI). JavaScript côté client
  seulement s'il est indispensable (menu mobile, formulaire).
- i18n natif d'Astro : français par défaut à la racine (`/`), anglais sous `/en/`.
- Contenus éditables hors du code : textes des pages en Markdown dans `src/content/`,
  tarifs et infos pratiques en YAML dans `src/data/`. Aucun texte de contenu ni prix écrit en
  dur dans un composant. Objectif : brancher plus tard un CMS Git (Decap ou Sveltia) pour
  qu'Amaëlle édite seule.
- Images : composant `<Image>` / `<Picture>` d'Astro (AVIF/WebP, plusieurs largeurs,
  `loading="lazy"` sauf l'image du bandeau). Sources dans `src/assets/photos/`.
- Polices auto-hébergées via `@fontsource` (Lora pour les titres, Nunito Sans pour le texte).
  Aucun appel à Google Fonts ni à un CDN externe.
- Formulaire de demande de séjour : envoi vers un service de formulaires (Web3Forms ou
  Formspree), point de terminaison et clé en variable d'environnement (`PUBLIC_FORM_ENDPOINT`),
  jamais en dur. Honeypot anti-spam, case de consentement RGPD, message de confirmation clair.
- Statistiques : Cloudflare Web Analytics uniquement (sans cookie). Aucun autre traceur,
  donc pas de bandeau cookies.
- Node LTS, npm. Commandes : `npm run dev`, `npm run build`, `npm run preview`.

## Design

Palette (tokens CSS dans `src/styles/tokens.css`) :

| Token | Hex | Usage |
| --- | --- | --- |
| `--creme` | #F4EDE1 | fond des pages |
| `--kaki` | #8E9B7C | couleur signature : boutons, titres de section, logo |
| `--chene` | #C9A77C | accent chaud : détails, séparateurs, icônes |
| `--horizon` | #A8BFCC | accent frais : encadrés, bandeaux d'info |
| `--foret` | #34392F | texte courant |

Vérifier les contrastes WCAG AA : le kaki ne sert jamais de couleur de texte sur fond crème ;
pour un bouton kaki, texte en `--foret` ou blanc selon le contraste mesuré, et prévoir une
variante plus foncée du kaki si besoin.

Principes :
- La photo porte l'émotion : un grand bandeau photo, de la place, peu de décor.
- Une seule chose mémorable par page ; le reste calme et discipliné.
- À éviter (ce sont les signes d'un site générique) : étiquettes en MAJUSCULES espacées
  au-dessus des titres, un mot isolé en italique ou en couleur dans un titre, grilles de cartes
  identiques avec ombre grise, dégradés décoratifs, flèches « → » ajoutées aux liens,
  numérotation 01/02/03 sur un contenu qui n'est pas une séquence, animations d'apparition
  sur chaque section.
- Mobile d'abord, focus clavier visible, `prefers-reduced-motion` respecté.
- Le logo (`src/assets/logo/`) est provisoire tant que la version transparente n'est pas livrée.

## Rédaction

- Vouvoiement chaleureux, phrases courtes, verbes simples, pas de jargon commercial.
- Typographie française : espace insécable avant `; : ! ?` et à l'intérieur des guillemets
  « », apostrophe typographique ’.
- Boutons qui disent ce qui se passe : « Demander un séjour », pas « Envoyer ».
- Ne jamais inventer un fait : prix, horaires, distances, équipements, labels, avis clients.
  Une information absente de `docs/brief.md` devient un `TODO(amaelle): …` visible dans le
  fichier de contenu et listé dans `docs/todo-contenus.md`.
- Version anglaise : traduction naturelle (pas mot à mot), mêmes informations, unités et prix en €.

## Règles fermes

- Pas de réservation ni de paiement en ligne en phase 1 : un formulaire de demande seulement.
- Une projection ou image de synthèse n'est jamais présentée comme une photo : légende
  « Projection » obligatoire.
- N'utiliser que les photos au statut « À utiliser » dans `docs/photos.md`.
- Aucun secret, clé ou donnée personnelle dans le dépôt. Pas de métadonnées GPS dans les images.
- Le dossier `photos-originales/` n'est jamais versionné (voir `.gitignore`).
- Mentions légales, confidentialité et CGV : générer des brouillons marqués « à faire valider »,
  sans inventer de SIRET ni de clauses non fournies.

## Façon de travailler

- Une étape de `docs/etapes.md` à la fois. Annoncer le plan avant de coder, puis le faire.
- Petits commits clairs en français (`feat: page gîte`, `fix: contraste bouton`).
- Avant chaque commit : `npm run build` sans erreur ni avertissement.
- À la fin de chaque étape : résumer ce qui a été fait, ce qui reste en `TODO(amaelle)`,
  et ce qu'il faut vérifier visuellement.
- En cas de doute sur un contenu ou un choix de marque, poser la question plutôt que deviner.

## Définition de « terminé » pour la phase 1

- Pages FR et EN : Accueil, Le gîte, Le lieu, Réserver / Contact, Mentions légales,
  Confidentialité.
- Lighthouse mobile ≥ 90 en performance, accessibilité, bonnes pratiques et SEO.
- Balises title/description par page, Open Graph, `sitemap.xml`, `robots.txt`, `hreflang`,
  données structurées schema.org `LodgingBusiness`.
- Formulaire testé de bout en bout.
- Déployé sur Cloudflare Pages, domaine chambalade.fr branché.
