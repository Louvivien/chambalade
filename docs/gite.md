# Page du gîte français

La route `/gite/` utilise les textes de `src/content/gite/fr.md` et les tarifs de
`src/data/reservation.yaml`. L’accueil et son menu pointent maintenant vers cette
page. Le lieu et la demande de séjour restent accessibles par les sections de
l’accueil jusqu’à la construction de leurs pages dédiées.

## Source des tarifs

Le YAML n’existait pas avant l’étape 5. Il contient désormais la capacité totale
et les dix lignes tarifaires tirées de `docs/brief.md` et `docs/reservation.md`.
Tous les montants sont exprimés en centimes ; aucun montant n’est répété dans
le composant ou le Markdown. Le module de calcul et les règles complètes seront
construits à l’étape 7 en étendant ces données.

- `amount_cents` : montant entier positif ou nul ; `null` indique une valeur inconnue.
- `unit` : base de facturation connue, sinon `null`. Les unités des chambres, des
  draps et du forfait restent indéterminées.
- `validated` : `false` pour toutes les propositions actuelles. Les précisions de
  validation du Markdown sont alors rendues sous chaque montant, à la demande
  explicite de Vivien. Ne passer à `true` qu’après confirmation du montant et de
  l’unité, puis retirer les notes devenues obsolètes et régénérer l’inventaire.

La taxe de séjour est affichée « À confirmer », jamais comme gratuite. Le
petit-déjeuner utilise un montant nul et l’unité `included`. Le forfait cavalier
reste affiché avec sa valeur proposée et l’avertissement sur son contenu à définir.
Il n’y a ni calcul de devis, ni transmission d’une réservation à cette étape.

Le schéma dans `src/lib/tarifs.ts` refuse les montants négatifs, fractionnaires en
centimes ou hors de la plage des entiers sûrs, les montants confirmés incomplets,
et les prestations payantes déclarées comprises. Il faudra ajouter les unités
de facturation confirmées aux unités autorisées et à leurs libellés éditoriaux
lors de la résolution des ambiguïtés.

## Photos et informations en attente

Seules deux photos au statut « À utiliser » sont employées : la piscine et le
portail. Le bandeau piscine est recadré en CSS en 16:9, aligné en haut pour retirer
la terre et le robot du premier plan. Les originaux du dépôt restent inchangés.
La photo « piscine et table » et la projection ne sont pas utilisées. Les photos
des chambres et du dortoir seront ajoutées après les travaux.

Les horaires, l’accès en van/camion, le linge, les animaux, les documents du cheval
et les conditions d’acompte/annulation restent explicitement à confirmer. Les
mentions éditoriales sont visibles dans la page et inventoriées ; les notes sur
la validation générale des textes et l’inscription du portail restent dans le
fichier source. Aucune date précise d’ouverture ni politique non fournie n’a été
inventée.

## Vérification

Avec la version de Node indiquée dans `.nvmrc` :

```sh
npm run check
npm test
npm run build
npm run audit:liens
npm run audit:todos
npm run preview -- --host 127.0.0.1 --port 4321
```

Dans un autre terminal, Chrome installé :

```sh
npm run audit:gite
npm run audit:accueil
npx --no-install lighthouse http://127.0.0.1:4321/gite/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.audit/lighthouse-gite.json --chrome-flags="--headless" --quiet
npx --no-install lighthouse http://127.0.0.1:4321/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.audit/lighthouse-accueil-etape-5.json --chrome-flags="--headless" --quiet
```

Exécuter ces mesures successivement. L’audit du gîte compare les valeurs affichées
au YAML et les notes au Markdown, contrôle les ancres, la navigation au clavier,
les images, le mouvement réduit, les polices et les requêtes à 375, 768 et 1280 px.
L’audit de l’accueil vérifie aussi l’accès à la nouvelle page. Rapports bruts et
captures dans `.audit/` ; résumé partageable dans `docs/rapports/etape-5.json`.
