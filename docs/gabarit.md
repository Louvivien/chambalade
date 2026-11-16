# Design system et gabarit — étape 3

## Direction visuelle

Fond crème, texte forêt, Lora pour les titres et Nunito Sans pour la lecture.
Le nom Chambalade compose le logo typographique provisoire. Une ligne chêne
structure l’en-tête et le pied de page ; les photos porteront l’émotion des pages.
Le favicon « C » est provisoire lui aussi. La navigation mobile reste visible,
sans menu masqué ni JavaScript. Aucun effet décoratif animé.

Le kaki de marque reste un accent : son contraste avec forêt n’atteint que 4,02:1.
Les boutons utilisent donc `--kaki-fonce` et du texte crème. Les tests de contraste
vérifient les combinaisons retenues pour du texte courant (seuil 4,5:1).

## Intégrer une page

`src/layouts/BaseLayout.astro` prend `locale`, `title`, `description`,
`currentPage`, `availablePages` et `translations`. Fournir uniquement les chemins
de pages réellement construites. Les clés de `availablePages` sont `home`, `gite`,
`lieu`, `reserver`, `mentions`, `confidentialite`. Les clés de `translations` sont
`fr` et `en`. Une destination absente produit un libellé non cliquable, jamais
un faux lien. L’ajout des routes et de leurs équivalents anglais accompagnera
les étapes éditoriales.

Les textes d’interface sont dans `src/content/interface/fr.md` et `en.md`.
L’adresse et les coordonnées pratiques sont dans `src/data/site.yaml`.
Téléphone et e-mail restent vides tant qu’Amaëlle ne les a pas fournis : aucune
valeur fictive ni aucun lien vide n’est affiché. Les marqueurs correspondants,
ainsi que celui du logo, sont présents dans les contenus et dans l’inventaire.

## Prévisualisation isolée

```sh
npm run dev:audit
```

Ouvrir `/audit/fr/` et `/en/audit/` sur le serveur local. Ces spécimens utilisent
le vrai gabarit, les textes d’exemple issus du brief et une photo autorisée.
Leurs sections servent uniquement à tester les liens de navigation ; elles
ne constituent pas les pages éditoriales. Les routes sont injectées uniquement
quand `ASTRO_AUDIT=1`. Le build normal ne produit toujours aucune page.

## Reproduire les contrôles

```sh
npm test
npm run check
npm run build
npm run build:audit
npm run audit:liens -- .audit/dist
python3 -m http.server 4321 --bind 127.0.0.1 --directory .audit/dist
```

Dans un second terminal, avec Google Chrome installé :

```sh
npm run audit:front
npx --no-install lighthouse http://127.0.0.1:4321/audit/fr/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.audit/lighthouse-fr.json --chrome-flags="--headless" --quiet
npx --no-install lighthouse http://127.0.0.1:4321/en/audit/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.audit/lighthouse-en.json --chrome-flags="--headless" --quiet
```

Lancer les mesures Lighthouse l’une après l’autre, sans autres tests navigateur
simultanés. `audit:front` vérifie FR et EN à 375, 768 et 1280 px : absence de
débordement, navigation clavier, focus visible, lien d’évitement, changement de
langue, chargement local des polices, absence d’erreur JavaScript ou de requête
externe et mouvement réduit. Les captures et rapports bruts restent dans `.audit/`
(ignoré par Git). Les résultats synthétiques figurent dans le journal d’audit.
