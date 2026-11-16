# Journal d’audit

## Étape 4 — Accueil français — 2026-11-16

Branche : `etape-4-accueil` · Pull request : à renseigner après création.
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
