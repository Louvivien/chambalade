# Journal d’audit

## Étape 5 — Le gîte français — 2026-11-16

Branche : `etape-5-gite` · Pull request : [#4](https://github.com/Louvivien/chambalade/pull/4).
Base : `etape-4-accueil` (PR #3), sans fusion dans main.

Fait :
- Page `/gite/` : présentation, chambres et dortoir, accueil du cheval, tarifs,
  repas et espaces communs, préparation de l’arrivée, information de demande.
- Textes éditables dans `src/content/gite/fr.md`. Création du fichier
  `src/data/reservation.yaml`, absent jusqu’ici, avec les montants du brief en
  centimes et la capacité totale. Les unités et montants inconnus restent `null`.
- Dix lignes tarifaires alimentées par ce YAML. Les dix propositions affichent
  leur mention de validation ; six informations pratiques restent également
  signalées à l’écran. Aucune ambiguïté tarifaire tranchée à la place d’Amaëlle.
- Schéma de validation des données et tests sur les montants, les inconnues et
  les centimes. Pas de calcul de devis ou de logique serveur anticipés sur l’étape 7.
- Photos autorisées de la piscine (bandeau recadré) et du portail (chargement
  différé), variantes AVIF/WebP et plusieurs largeurs via Picture.
- Menu et bouton « Découvrir le gîte » de l’accueil reliés à `/gite/` ; audit et
  documentation de l’accueil adaptés à ce parcours réel.

Contrôles automatiques : build OK, 2 pages, sans erreur ni avertissement ·
17 tests OK (6 photos, 3 contrastes, 8 tarifs) · `check` : 0 erreur, 0 avertissement,
0 indication · secrets : aucune valeur réelle · liens : 87 références internes,
0 cassée. Inventaire éditorial synchronisé. Aucun original, `.env`, build ou
rapport brut ajouté au commit. `git diff --check` propre.

Lighthouse mobile (perf / a11y / BP / SEO), Chrome headless, simulation mobile par
défaut, serveur statique local, mesures successives :

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| `/gite/` | 100 | 100 | 100 | 100 |
| `/` | 100 | 100 | 100 | 100 |

Résumé machine dans `docs/rapports/etape-5.json`. Rapports bruts dans `.audit/`.
Les recommandations sur le cache/compression du serveur local, les images et
la chaîne CSS/polices seront réévaluées lors du déploiement Cloudflare.

Qualité front : les deux pages vérifiées à 375, 768 et 1280 px, aucun débordement
horizontal. Parcours au clavier, focus visible, lien d’évitement, ancres des tarifs
et de demande, liens entre les pages vérifiés. Les dix prix rendus sont comparés
au YAML et les mentions visibles au Markdown à chaque largeur. Images et polices
locales, aucune requête externe ou en échec, aucune animation, aucun JavaScript
client. Contrastes AA du design system conservés, focus crème sur le bloc foncé.
Pas d’étiquettes en capitales, ombres, dégradés ou animations décoratives.
Captures du gîte inspectées aux trois largeurs dans `.audit/screenshots/`.

Contenu : capacité, couchages, équipements, qualifications, ouverture et montants
issus du brief et du cahier des charges de réservation. Petit-déjeuner affiché
« Compris » à partir de sa valeur nulle dans le YAML ; taxe affichée « À confirmer »
à partir de `null`, jamais assimilée à zéro. Le forfait garde son prix proposé et
son contenu explicitement indéfini. Photos uniquement « À utiliser », alternatives
du tableau avec typographie française. Aucune projection utilisée. Marque et
vouvoiement respectés. Page anglaise prévue à l’étape 12, non créée ici.

Écarts et décisions :
- Création anticipée de la partie tarifaire de `reservation.yaml`, nécessaire à
  l’instruction de l’étape 5. Les unités réservables, capacités détaillées et
  règles métier seront ajoutées à l’étape 7 ; ce fichier devra être enrichi.
- Les mentions de validation sont volontairement publiques, conformément à la
  demande explicite de Vivien. Elles ne sont pas cachées dans des commentaires.
- Photo « piscine et table » en attente d’original remplacée par la piscine
  autorisée. Recadrage CSS 16:9 aligné en haut : robot et terre nue exclus,
  source inchangée. Photos des chambres et du dortoir encore attendues.
- Le portail porte « Chez Amaëlle » : photo autorisée, point de marque rappelé
  dans les notes éditoriales. Pas de retouche de l’inscription.
- Demandes non opérationnelles : téléphone et e-mail absents, formulaire prévu
  plus tard. Les appels mènent à une information explicite. Logo provisoire,
  pages du lieu, légales et anglaises toujours prévus aux étapes suivantes.
- Seul changement de l’accueil : raccordement de la navigation au gîte et
  adaptation de son contrôle navigateur. Aucune fonctionnalité hors périmètre.

Nouveaux TODO(amaelle) : validation des dix lignes tarifaires, bases de calcul des
chambres et draps, contenu du forfait, montant de la taxe ; horaires et ouverture
exacte, accès, linge, animaux, documents du cheval, acompte/annulation ; textes,
photos après travaux et inscription du portail. Ces précisions reprennent les
points ouverts des sources et figurent dans `docs/todo-contenus.md`.

À vérifier visuellement par Vivien : lecture des tarifs et de leurs validations
sur mobile, photographie de la piscine, présentation des couchages et informations
d’arrivée. Faire confirmer les montants et modalités par Amaëlle avant publication.
Aucune fusion ni publication effectuée.

## Étape 4 — Accueil français — 2026-11-16

Branche : `etape-4-accueil` · Pull request : [#3](https://github.com/Louvivien/chambalade/pull/3).
Base : `etape-3-gabarit` (PR #2), sans fusion dans main.

Fait :
- Accueil `/` : bandeau, présentation avec Amaëlle et Instinct, gîte, balades et
  pension « Bientôt », raisons de venir, Chambarans et section de demande de séjour.
- Textes, légendes, photos et alternatives dans `src/content/accueil/fr.md`, avec
  schéma Astro. Aucun texte éditorial ni prix ajouté dans les composants.
- Bandeau adapté : forêt sous 768 px, pré à partir de 768 px, AVIF/WebP/JPEG et
  plusieurs largeurs. Un seul téléchargement au chargement ; alternatives exactes
  du tableau exposées selon l’écran, sans JavaScript. Saturation du pré légèrement
  réduite. Autres photos via Picture et chargement différé.
- Navigation vers les sections existantes ; méthode de contrôle dans
  `docs/accueil.md`, audit reproductible `npm run audit:accueil`.

Contrôles automatiques : build OK, 1 page, aucune erreur ni avertissement ·
9 tests OK (6 photos, 3 contrastes) · `check` : 0 erreur, 0 avertissement, 0 indication ·
secrets : aucune valeur réelle (occurrences de documentation, tokens CSS et noms
de dépendances) · liens : 51 références internes, 0 cassée. Inventaire éditorial
synchronisé. Aucun original, `.env`, build ou rapport brut dans le commit.
`git diff --check` propre.

Lighthouse mobile (perf / a11y / BP / SEO) : `/` — **94 / 100 / 100 / 100**.
Mesure finale sur serveur statique local, Chrome headless, simulation mobile par
défaut. La première mesure donnait 100 / 100 / 100 / 100 ; celle réalisée après
l’ajustement de saturation ci-dessus est retenue. Tous les seuils sont atteints.
Les recommandations restantes portent notamment sur le cache/compression du
serveur local, les images et la chaîne CSS/polices ; à réévaluer sur Cloudflare à
l’étape de mise en ligne. Résumé conservé dans `docs/rapports/etape-4.json`.

Qualité front : rendus 375, 768 et 1280 px inspectés ; aucun débordement horizontal.
11 liens parcourus dans l’ordre du document avec focus visible ; lien d’évitement
et ancres du gîte et du séjour vérifiés. Descriptions des images testées dans
l’arbre d’accessibilité, y compris après redimensionnement. Page vérifiée sans
JavaScript, polices réellement chargées en local, aucune requête externe ou en
échec, aucune animation en mouvement réduit. Contrastes du gabarit conservés
(forêt/crème 10,18, forêt/horizon 6,20, crème/kaki foncé 5,65). Pas de décor générique
interdit. Captures locales : `.audit/screenshots/accueil-{375,768,1280}.png`.

Contenu : informations issues du brief (20 hectares, douze couchages, ouverture,
équipements, qualifications, futures activités). Aucun tarif ni temps de trajet
non confirmé. « Paddock et foin » ne signifie pas une inclusion dans le prix du
couchage humain. Vouvoiement, marque et typographie respectés. L’accueil anglais
n’existe pas encore ; sa construction relève de l’étape de traduction.

Écarts et décisions :
- Le pré n’a pas le statut strict « À utiliser » : sa sélection est explicitement
  demandée par Vivien à l’étape 4. Cette instruction autorise son utilisation ; le
  statut « Original à demander (utilisable en attendant) » est conservé dans la
  source. Toutes les autres photos utilisées ont le statut « À utiliser ».
- Le téléphone et l’e-mail manquent, le formulaire est prévu plus tard. Les liens
  de demande mènent à une explication honnête de leur disponibilité à venir.
  L’appel final proposé par le brief est adapté pour ne pas prétendre qu’une
  demande peut déjà être transmise. Raccorder les appels au formulaire lorsqu’il
  sera prêt ; les demandes ne sont pas encore opérationnelles à cette étape.
- Les pages gîte/lieu, anglaises et légales restent à construire aux étapes
  prévues. Les deux premières disposent ici d’ancres réelles ; les autres restent
  des libellés désactivés du gabarit. Logo typographique provisoire inchangé.
- Aucun travail hors du périmètre de l’accueil. Réservation serveur : non applicable.

Nouveaux TODO(amaelle) : quatre notes dans le contenu — validation des textes,
coordonnées, distances, clarification de l’inclusion du paddock/foin. Les points
déjà ouverts dans le brief sont rappelés au plus près du contenu et inventoriés.

À vérifier visuellement par Vivien : équilibre du titre sur le pré, lecture du
bandeau mobile, portrait d’Amaëlle, enchaînement des sections et formulation des
demandes en attente. Faire relire les textes proposés par Amaëlle. Aucune fusion
ni publication effectuée.

## Étape 3 — Design system et gabarit — 2026-11-16

Branche : `etape-3-gabarit` · Pull request : [#2](https://github.com/Louvivien/chambalade/pull/2).
Base : `audit/etapes-1-2` (PR #1), sans fusion de cette branche dans main.

Fait :
- Tokens de palette, typographie, espacements et largeurs ; styles natifs, sans
  framework UI et sans JavaScript côté client.
- Gabarit sémantique, en-tête avec nom typographique provisoire, navigation FR/EN,
  sélecteur de langue, lien d’évitement et pied de page avec adresse issue du brief.
- Libellés et textes d’interface dans deux fichiers Markdown ; coordonnées en YAML.
  Les coordonnées absentes ne sont pas inventées et les routes non construites
  restent des libellés sans lien.
- Deux routes de contrôle, injectées seulement avec `ASTRO_AUDIT=1`, hors du build
  de production. Photo autorisée `foret-chambaran.jpg`, texte alternatif du tableau,
  variantes AVIF/WebP via Picture. Les ancres du spécimen simulent les destinations
  de navigation ; les pages éditoriales restent à construire aux étapes suivantes.
- Contrôles navigateur reproductibles et documentation dans `docs/gabarit.md`.

Contrôles automatiques : build normal et build de contrôle OK sans avertissement ·
9 tests OK (6 conversion/manifeste, 3 contrastes) · `check` : 0 erreur, 0 avertissement,
0 indication · secrets : aucune valeur réelle · liens : 44 références internes
vérifiées, 0 cassée sur les 2 spécimens. Inventaire des marqueurs éditoriaux à jour.
`npm audit --omit=optional` : 0 vulnérabilité. Aucun original, fichier `.env`, build
ou rapport brut `.audit/` dans le commit. `git diff --check` propre.

Lighthouse mobile (perf / a11y / BP / SEO), Chrome headless, simulation mobile par
défaut, serveur statique local, mesures séquentielles du 16 novembre 2026 :

| Spécimen | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| `/audit/fr/` | 100 | 100 | 100 | 100 |
| `/en/audit/` | 100 | 100 | 100 | 100 |

Les scores valident les spécimens du gabarit, pas le futur site complet. Résumé
machine conservé dans `docs/rapports/etape-3.json` ; rapports bruts et captures
locales dans `.audit/`.

Contenu : textes issus du brief ou libellés d’interface traduits ; aucun tarif
ajouté. Adresse exacte du brief. Aucun texte éditorial dans les composants.
Nom en un mot, vouvoiement FR, apostrophes typographiques. Une seule photo autorisée,
sans projection. Aucune requête externe déclenchée lors des 6 parcours navigateur.

Qualité front : FR et EN vérifiés à 375, 768 et 1280 px, aucun défilement horizontal.
Les 11 liens de chaque spécimen sont atteignables au clavier avec focus visible ;
le lien d’évitement déplace le focus vers le contenu et le sélecteur change la langue.
Les polices locales sont réellement chargées. Mouvement réduit vérifié, aucune
animation. Pas d’étiquettes en capitales, ombres, dégradés ou animations décoratives.
Contrastes : forêt/crème 10,18:1 ; crème/kaki foncé 5,65:1 ; forêt/horizon 6,20:1.

Points non conformes et décision :
- Le premier bouton forêt sur kaki n’atteignait que 4,02:1 : corrigé avec le kaki
  foncé et texte crème, puis retesté.
- Import Zod obsolète signalé par Astro : remplacé par `astro/zod`, sans indication
  résiduelle dans `check`.
- Favicon absent (404 Lighthouse) : favicon typographique provisoire ajouté.
- Première mesure FR à 70 en performance pendant des contrôles simultanés : mesure
  finale répétée séquentiellement après corrections et optimisation des images du
  spécimen ; EN et FR atteignent désormais les seuils. Ce premier écart n’est pas
  masqué ; les scores dépendent de l’environnement de mesure.
- Logo définitif, téléphone et e-mail restent à fournir. Ce sont des limites de
  contenu connues, pas des valeurs inventées ni des liens vides.

Nouveaux TODO(amaelle) : marqueurs FR/EN de contact et logo dans
`src/content/interface/`, repris dans `docs/todo-contenus.md` ; les besoins étaient
déjà identifiés dans le brief. Aucun nouveau fait métier à valider.
À vérifier visuellement par Vivien : choix typographique, rythme des espacements,
logo provisoire et navigation mobile toujours visible. Les sections vides des
spécimens sont des ancres de test, pas des pages de contenu terminées.

## Étape 2 — Photos — 2026-11-16

Branche : `audit/etapes-1-2` · Pull request : [#1](https://github.com/Louvivien/chambalade/pull/1).

Fait :
- Audit rétrospectif du script et des 14 JPEG issus du tableau.
- Correction du logo : sa cible PNG est conservée, avec transparence, dans
  `src/assets/logo/` ; son original manque toujours et est signalé sans arrêter le lot.
- Tests réels sur orientation EXIF, suppression des métadonnées, redimensionnement,
  absence d’agrandissement, PNG transparent, fichiers absents, sources corrompues,
  conservation des originaux et de l’ancienne sortie en cas d’échec.

Contrôles automatiques : build OK sans avertissement · 6 tests OK · `check` :
0 erreur / 0 avertissement · secrets : aucune valeur réelle, seulement consignes
et noms de dépendances · liens : non applicables (0 page construite).

`npm run photos` : 14 conversions, 1 original manquant (logo), 0 erreur.
Vérification indépendante des 14 sorties : JPEG, grand côté ≤ 2560 px,
aucune métadonnée EXIF/ICC/IPTC/XMP, orientation ou commentaire.
Les fichiers sans cible sont ignorés. Aucun original, `.env` ou `dist/` suivi
par Git ; `git status --ignored` vérifié. Les marqueurs éditoriaux sont recensés
par `npm run audit:todos` dans `docs/todo-contenus.md` (index hors auto-collecte).

Lighthouse mobile (perf / a11y / BP / SEO) : non applicable, étape sans page.
Contenu : aucune page touchée. Les quatre photos dont le statut n’est pas strictement
« À utiliser » restent préparées conformément à la demande de conversion de toutes
les cibles ; elles ne sont référencées par aucune page. Leur publication reste exclue
jusqu’à validation. La projection nécessitera sa légende si elle est utilisée.
Points non conformes et décision : incompatibilité du logo corrigée ; logo manquant,
qualité des originaux et nature de la projection restent ouverts dans `docs/photos.md`.
Nouveaux TODO(amaelle) : aucun ; inventaire des points existants créé.
À vérifier visuellement par Vivien : couleurs, orientation, netteté, recadrages à
réaliser aux étapes des pages. Ces critères ne sont pas validés par les tests.

## Étape 1 — Initialisation — 2026-11-16

Branche : `audit/etapes-1-2` · Pull request : [#1](https://github.com/Louvivien/chambalade/pull/1).

Fait :
- Lecture de l’AGENTS actualisé et de la grille fournie dans
  `chambalade-starter/docs/audit.md`, intégrée à `docs/audit.md`.
- Alignement du brief et de l’ordre des 14 étapes avec les documents actualisés.
- Copie du cahier des charges réservation à l’emplacement référencé par AGENTS.
- Retrait de l’ancienne variable de formulaire externe ; le statique ne nécessite
  aucune variable, et les secrets de réservation seront configurés dans Cloudflare.
- Ajout de `npm test` (Vitest), d’un inventaire vérifiable des marqueurs éditoriaux
  et d’un contrôleur de liens internes/fichiers/ancres du build.
- Correction des prérequis du README (Node 24, ImageMagick pour les tests photos).

Contrôles automatiques : build OK sans avertissement · 6 tests OK dans la suite
commune · `check` : 0 erreur / 0 avertissement · secrets : aucune valeur réelle ·
liens : non applicables (0 page construite). `npm audit` : 0 vulnérabilité.
`npm run audit:todos` vérifie la correspondance de l’inventaire avec toutes les
occurrences dans les sources suivies, copies starter et consignes comprises.
Les fichiers ignorés ont été contrôlés et ne figurent pas dans le commit.

Lighthouse mobile (perf / a11y / BP / SEO) : non applicable, aucune page.
Contenu : configuration statique et i18n FR sans préfixe / EN sous `/en/` conformes.
Lora et Nunito Sans sont locales via Fontsource ; le chargement effectif sera
contrôlé avec le gabarit à l’étape 3. Structure demandée et scripts présents.
Points non conformes et décision : absence de tests, inventaire et contrôle de
liens corrigée ; références obsolètes au formulaire externe corrigées.
Le dernier Astro stable reste celui installé lors de l’initialisation (7.4.12).
Nouveaux TODO(amaelle) : aucun ; les inconnues métier restent dans les sources.
À vérifier visuellement par Vivien : rien pour cette étape sans page.

Les corrections rétrospectives des étapes 1 et 2 partagent une branche et une PR,
conformément à la demande explicite. Les étapes suivantes auront chacune leur
branche, leur PR et leur rapport. Aucune fusion n’est effectuée par l’agent.
