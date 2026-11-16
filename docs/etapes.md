# Étapes de construction (à donner à Codex une par une)

Chaque étape se lance avec le prompt indiqué. Attendre la fin, vérifier en local
(`npm run dev`), committer, puis passer à la suivante.

## Étape 1 — Initialiser le projet
> Lis AGENTS.md et les fichiers de docs/. Initialise un projet Astro minimal dans ce dépôt
> (sans écraser les fichiers existants), avec l'i18n FR par défaut et EN sous /en/, les polices
> via @fontsource, la structure src/content, src/data, src/assets, src/styles, et un
> .env.example. Ajoute les scripts npm habituels. Ne crée pas encore de pages de contenu.

## Étape 2 — Photos
> Écris scripts/convertir-photos.mjs qui convertit les fichiers de photos-originales/ (HEIC,
> JPEG, PNG) en JPEG de 2560 px max, sans métadonnées, vers src/assets/photos/ avec les noms
> « Fichier cible » de docs/photos.md. Ajoute la commande npm run photos. Ne traite que les
> lignes qui ont un fichier cible.

## Étape 3 — Design system et gabarit
> Crée src/styles/tokens.css (palette, échelle typographique, espacements) et le gabarit de base :
> en-tête avec logo, navigation FR/EN et sélecteur de langue, pied de page avec coordonnées.
> Avant de coder, propose-moi en quelques lignes la direction visuelle (typographie, mise en page,
> l'élément mémorable) en respectant la section Design d'AGENTS.md.

## Étape 4 — Accueil (FR)
> Construis la page d'accueil en français à partir de docs/brief.md et docs/photos.md. Textes
> dans src/content, pas en dur. Bandeau : pres-de-la-trappe.jpg sur ordinateur,
> foret-chambaran.jpg sur mobile.

## Étape 5 — Le gîte (FR)
> Construis la page Le gîte. Tarifs lus depuis src/data/tarifs.yaml. Les valeurs à valider
> restent visibles avec TODO(amaelle) et sont listées dans docs/todo-contenus.md.

## Étape 6 — Le lieu (FR)
> Construis la page Le lieu : vue du ciel avec repères, équipements, chevaux, alentours, accès.

## Étape 7 — Réserver et formulaire
> Construis la page Réserver avec le formulaire de demande de séjour (dates, nombre de personnes,
> nombre de chevaux, type d'hébergement souhaité, repas, message, coordonnées, consentement),
> envoi vers PUBLIC_FORM_ENDPOINT, honeypot, messages de succès et d'erreur.

## Étape 8 — Pages légales
> Rédige des brouillons de mentions légales et de politique de confidentialité, marqués
> « à faire valider », sans inventer d'information.

## Étape 9 — Version anglaise
> Traduis toutes les pages et contenus en anglais sous /en/, avec hreflang et sélecteur de langue.

## Étape 10 — SEO, accessibilité, performance
> Ajoute title/description, Open Graph, sitemap, robots.txt, données structurées
> LodgingBusiness. Vérifie les contrastes et le clavier. Vise Lighthouse mobile ≥ 90 partout
> et liste ce qui reste à corriger.

## Étape 11 — Déploiement
> Prépare le déploiement sur Cloudflare Pages (commande de build, dossier dist, variables
> d'environnement) et écris dans README.md les étapes pour brancher le domaine chambalade.fr.

## Plus tard
- Outil d'édition pour Amaëlle (Decap ou Sveltia CMS, connexion GitHub).
- Phase 2 : pages Balades et Pension.
- Moteur de réservation, si le volume le justifie.
