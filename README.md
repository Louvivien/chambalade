# chambalade.fr

Site du gîte équestre Chambalade (Roybon, Isère). Construit avec Astro, hébergé sur
Cloudflare Pages. Les instructions pour l'agent de développement sont dans `AGENTS.md`.

## Démarrer en local

1. Installer Node.js 24 (`nvm install && nvm use`) et ImageMagick 7 avec le support
   HEIC (`brew install imagemagick` sur macOS).
2. Télécharger les photos du dossier Drive « Biblio Photos » dans `photos-originales/`.
3. `npm install`, puis `npm run photos`, puis `npm run dev`.

## Documents

- `docs/brief.md` : marque, textes, tarifs, questions ouvertes.
- `docs/photos.md` : plan d'utilisation des photos.
- `docs/reservation.md` : cahier des charges du module de réservation.
- `docs/etapes.md` : ordre de construction.
- `docs/audit.md` : grille de contrôle à chaque fin d'étape.
- `docs/journal-audit.md` : résultats et limites des contrôles par étape.
- `docs/todo-contenus.md` : informations attendues d'Amaëlle (créé pendant la construction).

## Vérifications

`npm test` exécute les tests Vitest, dont une conversion réelle de fichiers de
test avec ImageMagick. `npm run check` vérifie les types. Après `npm run build`,
`npm run audit:liens` vérifie les fichiers et ancres des liens internes du build.
`npm run audit:todos` vérifie l'inventaire des marqueurs éditoriaux ; après une
modification, ajouter les nouveaux fichiers à Git puis exécuter
`npm run audit:todos -- --write` et relire le résultat.
