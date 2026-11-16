# Journal d’audit

## Étape 2 — Photos — 2026-11-16

Branche : `audit/etapes-1-2` · Pull request : à ouvrir après commit des corrections.

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

Branche : `audit/etapes-1-2` · Pull request : à ouvrir après commit des corrections.

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
