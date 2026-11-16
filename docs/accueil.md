# Accueil français

La route `/` utilise `src/content/accueil/fr.md`. Les textes, les légendes et les
textes alternatifs s’éditent dans son frontmatter Markdown, validé par la collection
`accueil`. Les notes de validation en fin de fichier ne sont pas rendues sur le site.
Les coordonnées du gabarit restent dans `src/data/site.yaml`.

## Photographies

Le bandeau utilise la forêt sous 768 px et le pré à partir de 768 px. Le titre
reste sur fond crème pour garantir son contraste ; sur ordinateur, il occupe la
droite de la photo sans masquer la cavalière ni le chien. La saturation du pré est
légèrement atténuée en CSS, conformément au tableau des photos.

`AccueilBandeau.astro` compose les sources AVIF, WebP et JPEG avec `getImage`, puis
un composant `Image` de repli. Cette adaptation suit la [recette officielle Astro
pour les images adaptées à l’écran](https://docs.astro.build/en/recipes/build-custom-img-component/).
Un seul fichier du bandeau est téléchargé au chargement. Les deux photos du corps
de page utilisent `Picture`, plusieurs largeurs et le chargement différé.

Le bandeau change aussi de sujet selon l’écran : une description unique serait
inexacte sur l’un des formats. Le `picture` est donc masqué aux technologies
d’assistance ; deux descriptions `role="img"` portent les textes exacts du tableau.
Les mêmes seuils CSS en exposent une seule dans l’arbre d’accessibilité, y compris
sans JavaScript et après redimensionnement. L’audit navigateur vérifie ces cas.

## Destinations provisoires

Depuis l’étape 5, le lien du gîte et « Découvrir le gîte » mènent à `/gite/`.
Les liens du lieu et de demande mènent encore aux sections de l’accueil, tant
que les pages correspondantes ne sont pas construites. La section de demande
annonce clairement que les coordonnées et le formulaire seront disponibles
ultérieurement. Elle ne collecte rien. Les liens anglais et légaux restent
désactivés dans le gabarit jusqu’à leurs étapes respectives.

L’ouverture au printemps 2027, les équipements et les qualifications viennent du
brief. Les balades et la pension restent signalées « Bientôt ». Aucune durée de
trajet ni aucun tarif n’est publié. La formulation sur le paddock ne prétend pas
que le prix du cheval est compris dans celui du couchage.

## Vérification locale

Avec Node indiqué par `.nvmrc` :

```sh
npm run check
npm test
npm run build
npm run audit:liens
npm run preview -- --host 127.0.0.1 --port 4321
```

Dans un autre terminal, pendant que la prévisualisation tourne :

```sh
npm run audit:accueil
npx --no-install lighthouse http://127.0.0.1:4321/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.audit/lighthouse-accueil.json --chrome-flags="--headless" --quiet
```

Chrome doit être installé. Exécuter Lighthouse après l’audit navigateur, sans autre
audit en parallèle. Le script vérifie les largeurs 375, 768 et 1280 px, la photo
choisie, la description accessible, le chargement unique du bandeau, le lien du gîte, les ancres,
le clavier, les polices, le mouvement réduit et l’absence de requête externe.
Captures et résultats bruts restent dans `.audit/`, ignoré par Git ; le résumé
partageable est `docs/rapports/etape-4.json`.
