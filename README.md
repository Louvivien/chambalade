# chambalade.fr

Site du gîte équestre Chambalade (Roybon, Isère). Construit avec Astro, hébergé sur
Cloudflare Pages. Les instructions pour l'agent de développement sont dans `AGENTS.md`.

## Démarrer en local

1. Installer Node.js (version LTS).
2. Télécharger les photos du dossier Drive « Biblio Photos » dans `photos-originales/`.
3. `npm install`, puis `npm run photos`, puis `npm run dev`.

`npm run dev` sert le site seul : la page Réserver n’y trouve pas l’API, donc aucune date n’est
choisissable (un message l’indique). Pour la tester, lancer `npm run api:dev` et ouvrir
http://localhost:8788/reserver/ (préparation dans `docs/api.md`, section « Travailler en local »).

## Mettre en ligne

Le site se déploie sur Cloudflare Pages (commande de build `npm run build`, dossier `dist`). Le guide complet,
dans l’ordre, est dans `docs/deploiement.md` : projet Pages, base D1 et migrations, Turnstile, secrets, e-mails,
Cloudflare Access sur `/admin/`, puis le domaine. En bref pour brancher **chambalade.fr** :

1. Mettre la zone DNS de `chambalade.fr` chez Cloudflare (en recopiant d’abord tous les enregistrements existants,
   dont la messagerie), ou au minimum pouvoir créer un `CNAME` pour `www`.
2. Dans le projet Pages : Domaines personnalisés → ajouter `chambalade.fr` et `www.chambalade.fr` ; le certificat
   HTTPS est automatique.
3. Rediriger `www` vers `chambalade.fr` (adresse canonique du sitemap et des balises).
4. Ajouter le domaine à Turnstile, à Resend et à l’application Access, puis lancer
   `npm run deploiement:smoke -- https://chambalade.fr`.

Avant : `npm run build && npm run deploiement:verifier` (voir le guide pour lire le rapport). Le site actuel
sur Wix reste en place jusqu’à la recette sur l’adresse de prévisualisation.

## Documents

- `docs/brief.md` : marque, textes, tarifs, questions ouvertes.
- `docs/photos.md` : plan d'utilisation des photos.
- `docs/reservation.md` : cahier des charges du module de réservation.
- `docs/api.md` : API de réservation (routes, administration, secrets, travail en local).
- `docs/deploiement.md` : mise en ligne pas à pas (Cloudflare, D1, secrets, Access, domaine).
- `docs/recette-reservation.md` : recette manuelle du module de réservation.
- `docs/etapes.md` : ordre de construction.
- `docs/audit.md` : contrôles de fin d'étape ; résultats dans `docs/journal-audit.md`.
- `docs/avancement.md` : état de l'étape en cours, tranche par tranche, pour reprendre après
  une interruption (Codex ou Claude Code).
- `CLAUDE.md` : renvoie vers `AGENTS.md`, pour que Claude Code suive les mêmes consignes.

## Envoyer le code pour un audit externe

`git archive -o audit.zip HEAD` crée un zip du dépôt tel qu'il est commité, sans
`node_modules`, `dist` ni les photos originales.
- `docs/todo-contenus.md` : informations attendues d'Amaëlle (créé pendant la construction).
