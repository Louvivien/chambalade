# Journal d’audit

## Étape 9 — Réservation : parcours client — 2026-11-16

Branche : `etape-9-reserver` · Base : `etape-8-api` (PR #7 ouverte vers `etape-6-lieu`) · Pull request : à créer (voir `docs/avancement.md`).

Fait (page `/reserver/` en français ; pas d’administration ni d’e-mails, étape 10 ; pas d’anglais, étape 12) :
- Calendrier de séjour accessible : grille ARIA au clavier (flèches, Début/Fin, Page haut/bas),
  nuits complètes hachurées, barrées et annoncées « complet », arrivée puis départ, départs
  impossibles signalés, disponibilités lues sur `/api/disponibilites`.
- Composition du séjour : adultes, enfants, chevaux, chambres, lits en dortoir, dîners et
  déjeuners par jour. Devis en direct : celui de `/api/devis`, jamais un calcul du navigateur.
- Coordonnées, consentement, Turnstile, envoi à `/api/demandes`, résumé d’erreurs lié aux champs,
  messages précis du serveur (« Le dortoir n’a plus que 2 lits libres la nuit du 12 mai »),
  confirmation avec la référence et le récapitulatif.
- Textes dans `src/content/reserver/fr.md` ; logique pure dans `src/lib/reserver/` (testée) ;
  le script du navigateur (`src/scripts/`) relie seulement le DOM, la logique et l’API.
- Liens « Demander un séjour » de l’accueil, du gîte et du lieu raccordés à `/reserver/`
  (les mentions « formulaire bientôt disponible » sont retirées).
- `npm run audit:reserver` : audit navigateur du parcours complet (voir ci-dessous).

Contrôles automatiques : build OK, 4 pages, sans erreur ni avertissement · 318 tests OK
(64 nouveaux : logique du parcours 62, contrastes 2) · types : 0 erreur, 0 avertissement,
0 indication · liens : 181 références internes, 0 cassée · inventaire des `TODO(amaelle)` à jour ·
secrets : aucune valeur réelle ; la clé Turnstile du widget est publique par nature et se règle
par `PUBLIC_TURNSTILE_SITE_KEY`.

Audit navigateur (`npm run audit:reserver`, sur `wrangler pages dev` avec D1 locale) à 375, 768
et 1280 px : titre, `h1`, page courante ; aucun prix dans les données de la page ; un seul jour
dans l’ordre de tabulation ; contour de focus visible ; choix de l’arrivée au clavier ; devis avec
ses mentions ; résumé d’erreurs (focus, liens vers les champs, disparition des erreurs corrigées) ;
envoi réel ; confirmation ; **la demande est retrouvée côté serveur** avec le bon statut, les bonnes
dates, le délai de 48 h et un total identique à celui affiché ; aucun défilement horizontal ;
aucune animation avec `prefers-reduced-motion` ; seules requêtes hors site : Turnstile ; aucune
erreur de console ; sans JavaScript, le formulaire reste masqué et un message l’explique.
Audits d’accueil, du gîte et du lieu rejoués : OK.

Lighthouse mobile (perf / a11y / BP / SEO) :
| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| `/reserver/` (3 mesures) | 96 · 89 · 100 | 100 | 100 | 91 |
| `/`, `/gite/`, `/le-lieu/` | 100 | 100 | 100 | 100 |

Écarts : (1) performance de `/reserver/` variable (89 à 100) : seul le temps de blocage change
(54 à 432 ms), probablement le script Turnstile ; une mesure sur trois est sous 90 ; à reconfirmer
sur Cloudflare. (2) SEO 91 : `robots.txt` absent et `wrangler dev` répond une page HTML en 200,
d’où l’alerte ; artefact de développement, `robots.txt` et sitemap relèvent de l’étape 13.

Défauts trouvés et corrigés pendant l’étape (vérifiés dans un vrai navigateur) :
- un clic sur un jour était perdu quand un champ numérique avait le focus (la grille était
  reconstruite entre l’appui et le relâchement) : elle se met maintenant à jour sur place ;
- `window.turnstile` existe avant que `render` soit prêt : le script attend et n’empêche plus
  l’affichage du formulaire en cas de panne ;
- le devis affichait « Total 0 € » quand tout était « à confirmer » : il affiche « à confirmer » ;
- ordre des titres (titre du mois en `h3` juste après le `h1`) : c’est un paragraphe ;
- le résumé d’erreurs restait affiché après correction : il suit les corrections ;
- sur le gîte, deux liens « Demander un séjour » menaient à deux endroits : tous deux vont à `/reserver/`.

Décisions de conception à valider (aucune ne tranche une question métier) :
- Calendrier sur mesure (grille de boutons) plutôt que deux champs date natifs, pour griser les
  nuits complètes. Il est testé au clavier ; **pas testé avec un lecteur d’écran**.
- JavaScript assumé sur cette page (calendrier, devis, envoi). Sans lui : message et coordonnées.
- Valeurs de départ : 1 adulte, 0 enfant, 0 cheval (0 cheval tant que la capacité des paddocks est
  inconnue, sinon l’envoi serait refusé).
- Les repas cochés valent pour toutes les personnes du séjour (l’API accepte un nombre de personnes
  par repas ; l’interface ne le demande pas encore).
- Répartition des personnes par chambre calculée (une au moins par chambre, puis jusqu’à la
  capacité) : elle ne sert que si le prix d’une chambre devient « par personne » (règle encore
  inconnue) ; c’est une hypothèse de calcul, pas une information donnée par la cliente.
- Un calendrier « sans choix d’hébergement » marque une nuit disponible dès qu’une unité l’est ;
  avec des chevaux, une capacité de paddocks inconnue rend toutes les nuits « inconnu ».
- Après un refus du serveur pour places prises, le calendrier et le devis sont relus.

Prérequis de déploiement (étape 14) : définir `PUBLIC_TURNSTILE_SITE_KEY` dans les variables de
construction de Cloudflare Pages ; sans elle, la page se construit mais l’envoi est désactivé avec
un message visible.

Nouveaux TODO(amaelle) : valider les textes de la page ; confirmer la réponse sous 48 h et le
blocage provisoire ; accueil des enfants et tarif ; capacité des paddocks (déjà listée) ; lien vers
la politique de confidentialité (étape 11). Voir `docs/todo-contenus.md`.

À vérifier par Vivien : le parcours à la main sur ordinateur et téléphone (`npm run api:dev`, puis
http://localhost:8788/reserver/) ; la lisibilité des états du calendrier ; les textes ; l’usage au
clavier et, si possible, avec un lecteur d’écran.

## Étape 8 — Réservation : API — 2026-11-16

Branche : `etape-8-api` · Base : `etape-6-lieu` (contient l’étape 7, PR #5) · Pull request : à créer (voir `docs/avancement.md`).

Fait (aucune interface, aucun e-mail : étapes 9 et 10) :
- API publique : `GET /api/disponibilites`, `POST /api/devis`, `POST /api/demandes`
  (validation stricte, limitation par adresse IP, Turnstile, insertion gardée).
- Administration : `/api/admin/**` derrière un point d’entrée unique qui authentifie avant tout
  routage ; liste et fiche des demandes, actions (accepter, refuser, confirmer, annuler,
  prolonger), calendrier, blocages ; journal de chaque action.
- Jeton Cloudflare Access vérifié dans la fonction (RS256, émetteur, audience, expiration,
  liste blanche d’adresses) ; `503` si Access n’est pas configuré.
- `wrangler.toml`, scripts `api:migrer`, `api:demo`, `api:dev`, `seed/demo.sql` (personnes
  fictives), `.dev.vars.example`, migration `0002_limites.sql`, documentation `docs/api.md`.
- Logique dans `src/lib/api/` (fonctions pures qui reçoivent base, configuration, horloge et
  `fetch`) ; `functions/` ne contient que de minces adaptateurs.

Contrôles automatiques : build OK, 3 pages, sans erreur ni avertissement · 254 tests OK
(146 nouveaux : jeton Access 21, administration 55, création 30, démonstration 4, fondations 13,
API publique 23) · types : 0 erreur, 0 avertissement, 0 indication · liens : 170 références,
0 cassée · inventaire des `TODO(amaelle)` à jour (95 lignes) · configuration des fonctions
synchronisée avec le YAML · secrets : aucune valeur réelle (noms de variables et documentation
seulement) · `.dev.vars` et `.wrangler/` ignorés par Git. Lighthouse et rendus : non rejoués,
aucune page ni aucun asset du site modifié.

Vérifié aussi sur `wrangler pages dev` (moteur D1 de Cloudflare, wrangler 4.156.1), pas
seulement sur SQLite : migrations appliquées ; devis ; création avec appel réel à Turnstile
(clé de test) ; deux demandes simultanées sur les dernières places → un `201` et un `409` avec
« Le dortoir n’a plus que 2 lits libres la nuit du 4 octobre » ; administration ; refus `503`
hors localhost sans Access configuré. Cela confirme `changes()`, `json_each` et `WITH … INSERT`
dans un batch D1.

Couverture de la section 4 de `docs/audit.md` : chaque règle de `docs/reservation.md` testée,
dont capacités, dortoir au lit, chevaux, blocages, durées, expiration, demandes concurrentes,
devis figé · devis et disponibilité recalculés côté serveur, un montant du navigateur est ignoré
(test à l’appui) · création en un seul batch gardé · entrées validées, erreurs précises sans
détail technique · routes d’administration refusées sans jeton Access valide, vérifié dans la
fonction · aucune donnée personnelle dans les URL ni dans les journaux (les `console.error`
n’écrivent que le type d’erreur) · prix et paramètres lus dans `reservation.yaml`.

Décisions de conception à valider (aucune ne tranche une question métier) :
- La référence `CHB-AAAA-NNNN` porte l’année de **création** de la demande (le cahier des
  charges donne l’exemple `CHB-2027-0001` sans préciser). Les références de démonstration
  portent 2027, la création locale donne l’année en cours.
- Limitation : 5 demandes par adresse IP et par heure (`api.rate_limit_per_hour`), **chaque
  tentative compte**, y compris une demande invalide ; l’adresse n’est jamais stockée, seulement
  un condensé salé.
- Refus, annulation et expiration conservent les lignes d’occupation (historique) ; seules
  les demandes en attente, acceptées ou confirmées non expirées retirent des places.
- « Prolonger » repousse depuis l’échéance actuelle, plafonnée à 30 jours après l’action.
  « Accepter » fixe le délai de 7 jours de la configuration.
- Un blocage n’annule rien : la réponse liste les demandes déjà placées sur ces nuits.
- Sans capacité connue pour les paddocks, toute création avec cheval répond `409`.
- wrangler est lancé par `npx` en version épinglée plutôt qu’ajouté aux dépendances, pour ne
  pas toucher au `package-lock.json`. À réévaluer à l’étape 14.
- La clé de test Turnstile de `.dev.vars.example` est à contrôler dans la documentation
  Cloudflare ; elle ne sert qu’au développement local.

Points d’attention pour les étapes suivantes :
- Étape 9/10 : échapper toute donnée venue d’une cliente à l’affichage (nom, message) ; les
  réponses de l’API sont du JSON brut, non assaini.
- Étape 10 (e-mails) : nom et prénom acceptent les retours à la ligne ; les assainir avant de
  les mettre dans un objet ou un en-tête d’e-mail.
- Étape 14 : créer la base D1 de production (remplacer le `database_id` de test), définir les
  secrets Cloudflare listés dans `docs/api.md`, créer l’application Access sur `/admin/*` et
  `/api/admin/*`, ne jamais définir `ENVIRONMENT` ni `ACCESS_DEV_EMAIL` en production.

Nouveaux TODO(amaelle) : aucun. À vérifier par Vivien : les décisions ci-dessus, en particulier
l’année de la référence et la limite de 5 demandes par heure.

## Étape 7 — Réservation : données et règles — 2026-11-16

Branche : `etape-7-reservation` · Base : `etape-6-lieu` · Pull request : à créer (voir `docs/avancement.md`).

Fait (bibliothèque pure, sans réseau, sans interface, sans API) :
- `src/data/reservation.yaml` étendu : cinq unités réservables, règles de séjour, délais de
  blocage (48 h, 7 jours), règles de devis. Toute valeur `TODO(amaelle)` reste `null`.
- `src/lib/reservation/` : schéma de configuration (`config.ts`), dates en UTC et jour de
  Paris (`dates.ts`), statuts avec expiration à la lecture (`statuts.ts`), disponibilités et
  contraintes de séjour (`disponibilites.ts`), devis en centimes et devis figé (`devis.ts`),
  préparation d’une demande (`demande.ts`).
- `migrations/0001_reservation.sql` : `demandes`, `occupations`, `blocages`, `journal`,
  avec contraintes ; vérifiée sur une base SQLite en mémoire, clés étrangères actives.
- Jeu de test complet à part (`tests/reservation/config-test.ts`) : la configuration réelle
  garde ses inconnues, le code est exercé avec des valeurs de test sans portée métier.

Contrôles automatiques : build OK, 3 pages, sans erreur ni avertissement · 108 tests OK
(dont 81 nouveaux : config 10, dates 6, statuts 7, disponibilités 31, devis 14, demande 9,
migrations 14) · types : 0 erreur, 0 avertissement, 0 indication · liens : 170 références,
0 cassée · inventaire des `TODO(amaelle)` à jour (92 lignes) · secrets : aucune valeur réelle ·
rien d’ignoré ajouté. Lighthouse et rendus : non rejoués, aucune page ni aucun asset modifié.
La page du gîte lit toujours `reservation.yaml` et se construit sans changement.

Couverture des règles de `docs/reservation.md` (section 4 de `docs/audit.md`, limitée à
l’étape 7) : capacités par unité · dortoir au lit, presque plein et complet · chevaux
au-delà de la capacité · séjour à cheval sur un blocage · durées minimale et maximale ·
J-1, 12 mois et première nuit · expiration d’une demande en attente ou acceptée · deux
demandes sur la dernière place · devis figé · montant envoyé par le navigateur ignoré ·
toutes les valeurs lues dans la configuration.

Décisions de conception à valider (aucune ne tranche une question métier) :
- Une valeur inconnue n’est jamais remplacée : ligne « à confirmer », devis `complet: false`,
  pas d’acompte calculé. Avec la configuration réelle, la chambre (règle par chambre ou par
  personne), les draps (par séjour ou par nuit) et la taxe de séjour sont « à confirmer ».
- Une capacité inconnue n’est jamais illimitée : tant que le nombre de chevaux accueillis
  n’est pas fourni, toute demande avec un cheval est refusée par la bibliothèque.
- Tous les tarifs étant encore « non validés », le devis porte `provisoire: true`.
- Le forfait cavalier reste hors du devis tant que `rider_package_enabled` est faux.
- Blocages : date de fin exclue, comme un séjour (une fermeture du 1er au 15 libère le 15).
- Les enfants occupent un couchage ; leur acceptation et leur tarif restent inconnus
  (aucun refus tant que `children_accepted` n’est pas explicitement faux).
- Le jour de départ compte pour un déjeuner mais pas pour un dîner.

Point d’attention pour l’étape 8 : D1 n’offre pas de transaction interactive. La vérification
des places doit être rejouée au moment de l’insertion, dans un seul `batch` (insertion
conditionnelle de type `INSERT … SELECT … WHERE` qui compare la somme déjà occupée à la
capacité). Les tests simulent cette fenêtre de concurrence mais ne peuvent pas la fermer.

Nouveaux TODO(amaelle) : aucun nouveau sujet ; les unités et règles inconnues sont
désormais portées par `src/data/reservation.yaml` (capacité des paddocks, privatisation du
dortoir, première nuit, durée minimale, règle des chambres, règle des draps, forfait
cavalier, acompte, enfants), en plus des tarifs déjà listés.

À vérifier par Vivien : que les valeurs par défaut du cahier des charges conviennent
en attendant Amaëlle (durée minimale 1 nuit, maximale 14, J-1, 12 mois, blocages de 48 h
puis 7 jours), et les décisions de conception ci-dessus.

## Étape 6 — Le lieu (FR) — 2026-11-16

Branche : `etape-6-lieu` · Base : `etape-5-gite` ([PR #4](https://github.com/Louvivien/chambalade/pull/4)) · Pull request : à créer (voir `docs/avancement.md`).

Fait :
- Page `/le-lieu/` : vue aérienne avec trois repères cliquables (gîte, carrière, prés),
  réduits à un petit rond pour ne pas masquer les lieux, doublés d’une légende textuelle, équipements, chevaux, alentours, accès, appel au séjour.
- Textes dans `src/content/lieu/fr.md`, positions des repères dans `src/data/lieu.yaml`
  (attribution confirmée par Vivien). Aucun texte ni position en dur dans le composant.
- Lien « Le lieu » de l’accueil et du gîte raccordé à `/le-lieu/`.
- Script `npm run audit:lieu` (navigateur, JavaScript désactivé comme en production) :
  titre, h1, page courante, image prioritaire unique, repères placés d’après le YAML,
  cibles tactiles ≥ 44 px, ancres, parcours clavier complet avec focus visible,
  absence de défilement horizontal, polices, aucune requête externe ni en échec.

Contrôles automatiques : build OK, 3 pages, sans erreur ni avertissement · 17 tests OK ·
types : 0 erreur, 0 avertissement, 0 indication · liens : 170 références internes, 0 cassée ·
inventaire des `TODO(amaelle)` à jour (75 lignes) · secrets : aucune valeur réelle
(occurrences de documentation, tokens CSS) · rien d’ignoré ajouté (`photos-originales/`, `dist/`).

Lighthouse mobile (perf / a11y / BP / SEO), serveur statique local sur le build :

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| `/le-lieu/` | 91 | 100 | 100 | 100 |
| `/gite/` | 100 | 100 | 100 | 100 |
| `/` | 100 | 100 | 100 | 100 |

Écart signalé : la performance de `/le-lieu/` varie d’une mesure à l’autre
(91, 100, 88 sur trois essais, LCP ≈ 1,05 s, CLS 0). Seul le temps de blocage total
change (0 à 480 ms) ; la page n’a pas de JavaScript. Une mesure sur trois est sous 90.
Piste si cela persiste : réduire la plus grande largeur de la vue aérienne (1920) ou
sa qualité. Non traité pour ne pas optimiser sur du bruit ; à reconfirmer sur le
déploiement Cloudflare.

Contenu : conforme. Seules les photos « À utiliser » sont employées ; la photo de la
carrière reste exclue. Aucune distance, aucun accès van/camion, aucun portrait de
Quinoa, Guiness ou Saphir inventés : tout est signalé à l’écran.
Version anglaise : hors périmètre (pages FR uniquement à cette étape).
Nouveaux TODO(amaelle) (6, déjà dans `docs/todo-contenus.md`) : validation des textes ;
conditions carrière, PTV et paddocks ; portraits des trois autres chevaux ; distance et
accès à cheval pour la cascade, itinéraires de Dionay ; distances depuis Lyon, Grenoble
et Valence ; accès en voiture, van et camion.

À vérifier visuellement par Vivien :
- Les trois repères sont bien sur le gîte, la carrière et les prés (positions confirmées
  sur la photo, pas sur un rendu final).
- Les repères sont de petits ronds (22 px, zone tactile de 44 px) avec le nom décalé
  sur le côté sur ordinateur : la zone désignée reste visible. Sur téléphone, seules
  les lettres G, C et P s’affichent, les noms sont dans la légende sous la photo.
  À confirmer sur un vrai téléphone.
- Le recadrage du portrait de Baraka et l’équilibre général de la page.

Captures : `.audit/screenshots/lieu-375.png`, `-768.png`, `-1280.png` (non versionnées).
Résumé machine : `docs/rapports/etape-6.json`.

## Étape 5 — Reprise par tranches après réorganisation — 2026-11-16

Branche : `etape-5-gite` · Pull request : [#4](https://github.com/Louvivien/chambalade/pull/4).

Fait : état réel et découpage des travaux consignés dans `docs/avancement.md`,
plan committé dans `fc92233` avant la tranche de reprise. Le découpage des travaux
antérieurs est explicitement rétrospectif. Tranche 5 : mise à jour du générateur
d’inventaire et de la documentation d’initialisation après la suppression du
starter par Vivien (`09509cf`), régénération de l’inventaire et clôture du suivi.
Les rapports historiques ci-dessous gardent les résultats de leur date de rédaction.

Contrôles automatiques : build OK sans erreur ni avertissement · 17 tests OK ·
types : 0 erreur, 0 avertissement, 0 indication · liens : 87 références internes,
0 cassée sur 2 pages · inventaire synchronisé avec les fichiers encore suivis.
Secrets : aucune valeur réelle ; occurrences de documentation, tokens CSS et noms
de dépendances uniquement. Aucun original, `.env`, build ou rapport brut ajouté.
Diff vérifié sans erreur d’espacement.

Contenu et qualité front : aucune modification des sources du site, des assets,
de sa configuration ou de ses dépendances depuis `0e97118` (comparaison Git).
Les contrôles visuels et Lighthouse de la livraison de l’étape 5 ci-dessous
restent les derniers résultats mesurés ; ils ne sont pas présentés comme rejoués
pendant cette reprise documentaire.

Écart corrigé : l’ancien inventaire référençait encore les fichiers du starter
supprimés. Les sources métier à la racine sont conservées ; aucune réponse ni
validation n’est déduite de la suppression de ces doublons.
Nouveaux TODO(amaelle) : aucun point métier ajouté.
À vérifier par Vivien : relecture de la PR et des points de validation déjà
signalés. Étape 5 techniquement terminée ; aucune tranche de réalisation restante,
aucune fusion ni publication. L’étape 6 n’est pas engagée par cette reprise.

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
