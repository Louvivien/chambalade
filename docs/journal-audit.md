# Journal d'audit

## Situation au 16 novembre 2026

Branche de travail : `audit/etapes-1-2`, créée depuis `main` au commit `0e4d626`.
Les contrôles ci-dessous sont préliminaires. Ils ne constituent pas une validation
selon `docs/audit.md` : ce fichier est absent du dépôt local et de `origin/main`
après `git fetch origin`. Aucune autre branche distante n'est présente.
Son emplacement et celui de la version mise à jour d'`AGENTS.md` ont été demandés.

Consignes effectivement lues : `AGENTS.md` à la racine, `docs/etapes.md`,
`docs/photos.md`. Les critères de l'audit demandé restent à lire dès réception.

## Étape 1 — Initialisation

**Statut : contrôles techniques réussis ; audit demandé en attente de sa grille.**

### Constats et preuves

- `astro.config.mjs` configure une sortie statique, `fr` par défaut sans préfixe
  et `en` comme seconde langue. Aucune page n'est encore créée ; les routes
  effectives et le sélecteur de langue seront vérifiables avec le gabarit/pages.
- Lora et Nunito Sans sont installées via Fontsource et importées dans
  `src/styles/global.css`. Leur chargement dans un navigateur reste à vérifier
  après création du gabarit qui importera ce fichier.
- Les répertoires `src/content`, `src/data`, `src/assets`, `src/styles` et le
  fichier `.env.example` existent. Les commandes `dev`, `build`, `preview`,
  `check` et `photos` sont déclarées.
- `npm run check` : 0 erreur, 0 avertissement, 0 indication.
- `npm run build` : succès sans avertissement, 0 page générée, conformément
  au périmètre de l'étape 1. Vérifications exécutées avec Node 24 via Homebrew.
- `.env`, `node_modules/`, `dist/` et `.astro/` sont ignorés par Git.

### Correction effectuée

`AGENTS.md` référence `docs/reservation.md`, absent à la racine mais présent dans
`chambalade-starter/docs/reservation.md`. Une copie strictement identique a été
ajoutée à l'emplacement attendu, sans modifier l'original.

### Points à résoudre après lecture de la grille

- `docs/etapes.md` (étape 7), `.env.example`, `src/env.d.ts` et
  `docs/initialisation.md` décrivent encore un service de formulaire externe,
  alors qu'`AGENTS.md` prévoit désormais un module de réservation Cloudflare.
  La version actualisée des consignes doit permettre de mettre ces documents
  en cohérence sans inventer de nouvelles étapes ni de paramètres.
- `npm test` et Vitest, cités dans les consignes de réservation, ne sont pas
  configurés. Aucune logique de réservation n'existe à ce stade ; leur mise
  en place doit être située dans les étapes actualisées.
- Aucun nouveau `TODO(amaelle)` ajouté. Les informations métier manquantes
  restent listées dans les documents de référence.
- Validation visuelle : différée jusqu'au gabarit, aucune page existante.

## Étape 2 — Conversion des photos

**Statut : sorties vérifiées ; audit demandé en attente de sa grille.**

### Constats et preuves

- `scripts/convertir-photos.mjs` lit les noms cibles depuis `docs/photos.md`.
  Les lignes sans cible sont ignorées. La commande npm `photos` est disponible.
- Les 14 JPEG présents correspondent exactement aux 14 cibles JPEG du tableau.
- Vérification indépendante des fichiers avec `sharp.metadata()` : format JPEG,
  largeur et hauteur au plus égales à 2560 px, absence d'EXIF, ICC, IPTC, XMP,
  orientation et commentaires. Les coordonnées GPS EXIF sont donc absentes.
- `git ls-files photos-originales` ne retourne aucun fichier ; le dossier
  des originaux est bien ignoré par Git.
- Le script applique l'orientation avant la suppression des métadonnées,
  réduit sans agrandir et conserve l'ancienne sortie si la conversion échoue.
  Il utilise ImageMagick 7 avec support HEIC, documenté dans le README.
- Aucune modification des images n'a été nécessaire lors de ces contrôles.

### Limites et points ouverts

- Le logo source est absent. Sa cible `logo/chambalade.png` n'est pas une cible
  JPEG : le script la signalerait comme incompatible si l'original était ajouté.
  Cette exception est documentée dans `docs/conversion-photos.md` ; son traitement
  doit être confronté à la grille d'audit.
- Quatre images converties n'ont pas le statut strict « À utiliser » :
  `pres-de-la-trappe.jpg`, `piscine-et-table.jpg`, `carriere.jpg` et
  `projection-gite.jpg`. La conversion avait été demandée pour les lignes avec
  une cible ; aucune page ne les utilise. Leur présence dans les assets et leur
  éventuelle mise à l'écart doivent être évaluées selon la grille manquante.
- La nature de `projection-gite.jpg` reste à confirmer ; une éventuelle
  publication devra porter la légende « Projection » prévue dans les consignes.
- Validation visuelle restante : orientation, couleurs, netteté et recadrages
  prévus par le tableau. Les contrôles automatisés ne valident pas ces aspects.
- Aucun nouveau `TODO(amaelle)` ; demandes d'originaux et validations déjà
  décrites dans `docs/photos.md`.

## Étape suivante — Design system et gabarit

**Statut : non commencée, en attente de `docs/audit.md`.**

L'étape 3 est la suivante dans le document actuellement disponible. La direction
visuelle devra être annoncée avant le code. Dès que les consignes actualisées
seront accessibles, compléter les audits des étapes 1 et 2, corriger les écarts,
puis réaliser l'étape 3 et ajouter son rapport selon la même grille.

Chaque rapport devra distinguer les contrôles réellement exécutés, les écarts,
les corrections, les points non applicables et les vérifications restant à faire.
Aucune étape n'est déclarée conforme sur la seule base d'un build réussi.
