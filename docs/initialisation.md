# Initialisation — étape 1

Le projet npm est à la racine du dépôt. Les documents de `chambalade-starter/`
ont été copiés à la racine sans modifier les originaux. Les consignes de travail
sont désormais dans `AGENTS.md` et `docs/` à la racine.

## Démarrer

Utiliser Node.js 24 LTS (voir `.nvmrc`). Avec nvm :

```sh
nvm install
nvm use
npm ci
npm run dev
```

Si Node 24 est déjà installé via Homebrew, on peut aussi sélectionner ce binaire
dans le terminal courant :

```sh
export PATH="/opt/homebrew/opt/node/bin:$PATH"
npm ci
npm run dev
```

Commandes disponibles : `dev` (ou `start`), `check`, `build`, `preview` et `astro`.
`npm run preview` s'utilise après `npm run build`. La sortie statique est `dist/`.
Le script `photos` a été ajouté à l'étape 2 ; voir `docs/conversion-photos.md`.

## Structure prête pour les prochaines étapes

- `src/pages/` : futures routes françaises à la racine.
- `src/pages/en/` : futures routes anglaises sous `/en/`.
- `src/content/fr/` et `src/content/en/` : futurs textes Markdown.
- `src/content.config.ts` : collections vides, à définir avec les premiers contenus.
- `src/data/` : futurs tarifs et informations pratiques en YAML.
- `src/assets/photos/` et `src/assets/logo/` : images sources du site.
- `src/styles/global.css` : imports locaux Fontsource et familles typographiques.

Le gabarit de l’étape 3 importe `../styles/global.css` pour charger
Lora (400, 600) et Nunito Sans (400, 600, 700), avec le sous-ensemble latin
qui couvre les textes français et anglais. Les tokens de couleur et le design
system sont dans `src/styles/tokens.css`. Voir `docs/gabarit.md`.

Aucune page ni contenu éditorial n'est encore créé : le build produit zéro page,
et `/` comme `/en/` affichent donc une 404 en développement. L’étape 3 fournit
des routes de contrôle séparées via `npm run dev:audit`. Aucun nouveau `TODO(amaelle)` à cette étape ; les
questions de contenu restent dans `docs/brief.md` et `docs/photos.md`.

## Environnement

Aucune variable d'environnement n'est requise pour le site statique à cette étape.
Le module de réservation utilisera les Pages Functions décrites dans
`docs/reservation.md` ; ses secrets seront configurés dans Cloudflare.
Les fichiers `.env`, les originaux photo et les fichiers générés sont ignorés par Git.
