# chambalade.fr

Site du gîte équestre Chambalade (Roybon, Isère). Construit avec Astro, hébergé sur
Cloudflare Pages. Les instructions pour l'agent de développement sont dans `AGENTS.md`.

## Démarrer en local

1. Installer Node.js (version LTS).
2. Télécharger les photos du dossier Drive « Biblio Photos » dans `photos-originales/`.
3. `npm install`, puis `npm run photos`, puis `npm run dev`.

## Documents

- `docs/brief.md` : marque, textes, tarifs, questions ouvertes.
- `docs/photos.md` : plan d'utilisation des photos.
- `docs/reservation.md` : cahier des charges du module de réservation.
- `docs/etapes.md` : ordre de construction.
- `docs/audit.md` : contrôles de fin d'étape ; résultats dans `docs/journal-audit.md`.

## Envoyer le code pour un audit externe

`git archive -o audit.zip HEAD` crée un zip du dépôt tel qu'il est commité, sans
`node_modules`, `dist` ni les photos originales.
- `docs/todo-contenus.md` : informations attendues d'Amaëlle (créé pendant la construction).
