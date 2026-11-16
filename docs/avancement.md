# Avancement

Le dernier état est en haut. À chaque reprise, lire ce fichier, `git log -5` et
`git status`, puis reprendre la première tranche non cochée. Chaque tranche
terminée donne lieu à un commit après un build sans erreur ni avertissement.

## Étape en cours : 12 — Version anglaise — 2026-11-16

Branche : `etape-12-en` · Base : `etape-11-legal`.
Statut : tranche 1 terminée.
Périmètre (`docs/etapes.md` étape 12) : toutes les pages publiques en anglais sous `/en/`
(`/en/`, `/en/guesthouse/`, `/en/the-place/`, `/en/book/`, `/en/legal/`, `/en/privacy/`,
`/en/booking-terms/`), `hreflang`, sélecteur de langue. Traduction naturelle, mêmes informations,
prix en €. `/admin/` reste en français (usage d’Amaëlle seule). Les `TODO(amaelle)` sont repris
à l’identique dans les contenus anglais.

Principes : mêmes composants pour les deux langues (les pages deviennent des « vues » qui
reçoivent la langue), aucune route ni aucun texte en dur ; table de routes unique
`src/lib/routes.ts` ; la langue de la demande (`langue`) part à l’API et pilote l’e-mail à la
cliente ; formats de dates et de montants selon la langue.

- [x] Tranche 1 — Fondations : table de routes, `hreflang`/`lang` dans `BaseLayout`, en-tête,
  pied de page, interface EN complète, pages converties en vues paramétrées par la langue
  (le français ne change pas) ; tests des routes.
  Fait : `src/lib/routes.ts`, vues `src/views/*` (une vue par page, langue en paramètre), `hreflang` et x-default dans `BaseLayout`,
  contenus légaux déplacés dans `src/content/legal/fr/`, 5 tests de routes (501 au total). Les pages `/en/*` sont créées avec leur contenu
  dans les tranches suivantes : en attendant, le sélecteur de langue pointe vers des pages anglaises pas encore construites.
  Défaut des audits corrigé : une requête abandonnée par une navigation (`ERR_ABORTED`) était comptée comme panne.
- [ ] Tranche 2 — Accueil et gîte en anglais (`en.md`, tarifs en €).
- [ ] Tranche 3 — Le lieu en anglais.
- [ ] Tranche 4 — Réserver en anglais : formulaire, calendrier, devis, messages d’erreur du
  serveur, langue envoyée à l’API ; tests.
- [ ] Tranche 5 — Pages légales en anglais.
- [ ] Tranche 6 — Audit : hreflang réciproques, parité FR/EN des contenus (tests), navigateur,
  Lighthouse, rapport, `docs/rapports/etape-12.json`.

## Étape précédente : 11 — Pages légales (FR) — 2026-11-16

Branche : `etape-11-legal` · Base : `etape-10-admin`.
Statut : tranches 1 à 3 terminées ; étape prête pour revue, sans fusion.
PR à créer sur GitHub (base `etape-10-admin`).
Périmètre (`docs/etapes.md` étape 11) : brouillons de mentions légales, de politique de
confidentialité (données de réservation incluses) et de conditions de réservation, marqués
« à faire valider », sans inventer d’information. La version anglaise relève de l’étape 12
(`/en/legal/`, `/en/privacy/`).

Principes : aucun SIRET, statut juridique, hébergeur, durée ou clause inventés ; tout ce qui
manque est `TODO(amaelle)` visible. Les textes décrivent ce que le site fait réellement
(données collectées par le formulaire, sous-traitants effectivement utilisés : Cloudflare,
service d’e-mail). Chaque page affiche un bandeau « Brouillon à faire valider » et reste
`noindex` tant qu’elle n’est pas validée. Textes en Markdown/YAML, pas en dur dans les composants.

- [x] Tranche 1 (15–30 min) — Contenus : collection `legal` (mentions, confidentialité, conditions),
  `src/data/legal.yaml` (identité de l’éditeur, valeurs inconnues à `null`), schéma, tests.
- [x] Tranche 2 (15–30 min) — Pages `/mentions-legales/`, `/confidentialite/`,
  `/conditions-de-reservation/`, gabarit commun, bandeau « à faire valider », pied de page
  et lien de consentement du formulaire Réserver.
  Fait : tranches 1 et 2 committées ensemble (`5e1bb10`) ; `valide: false` dans `src/data/legal.yaml` = bandeau + noindex.
- [x] Tranche 3 (15–30 min) — Audit navigateur (375/768/1280 px, clavier, sans JS), liens,
  inventaire des TODO, rapport, `docs/rapports/etape-11.json`, avancement.
  Fait : `npm run audit:legal`, Lighthouse, rapport. Points en suspens : aucune suppression/anonymisation des demandes n’existe encore
  (à traiter avant l’ouverture) ; étape 12 = versions anglaises ; étape 13 = passer `valide` à true après validation.

## Étape précédente : 10 — Réservation : administration et e-mails — 2026-11-16

Branche : `etape-10-admin` · Base : `etape-9-reserver` (PR vers `etape-8-api`).
Statut : tranches 1 à 7 terminées ; étape prête pour revue, sans fusion.
PR à créer sur GitHub (base `etape-9-reserver`) : l’outil `gh` n’est pas installé ici. Une PR dédiée en fin d’étape, sans fusion.
Périmètre (`docs/etapes.md` étape 10, `docs/reservation.md` sections 8 et 9) : `/admin/` (demandes,
fiche, calendrier, blocages) pour Amaëlle, modèles d’e-mails FR/EN branchés sur l’API, protection
par Cloudflare Access et service d’e-mail documentés, `docs/recette-reservation.md`.

Principes : l’API d’administration existe déjà (étape 8) ; cette étape ajoute son interface, les
e-mails et la protection de la page elle-même. Aucun secret dans le dépôt (clé du service d’e-mail,
adresse d’expédition, coordonnées bancaires : variables Cloudflare). Un e-mail qui échoue ne fait
jamais échouer une demande ni une action : l’issue est consignée au journal, sans adresse. Tout
texte venu d’une cliente est affiché en texte brut (aucun HTML injecté) et assaini avant d’entrer
dans un objet ou un en-tête d’e-mail. Informations inconnues = `TODO(amaelle)` visibles.

- [x] Tranche 1 (15–30 min) — Modèles d’e-mails : textes FR/EN dans `src/data/emails.yaml`
  (exportés en JSON pour les fonctions), modèles (reçue, acceptée, confirmée, refusée, annulée,
  nouvelle demande, demande bientôt expirée), formats par langue, échappement ; tests.
  Fait : `src/data/emails.yaml` (FR/EN), `src/generated/emails.json` (exporté avec la configuration),
  `src/lib/emails/{formats,modeles}.ts` (7 modèles, texte brut et HTML, échappement, objet assaini),
  38 tests (356 au total). Défaut trouvé et corrigé : les montants avec centimes s’écrivaient
  « 76,5 € » (page Réserver, tarifs du gîte, e-mails) ; ils s’écrivent « 76,50 € ».
- [x] Tranche 2 (15–30 min) — Envoi et branchement : service d’e-mail (Resend) derrière une
  interface, migration `0003` (acompte saisi à l’acceptation), envois depuis la création et les
  actions, alerte d’expiration à la consultation, journal ; tests.
  Fait : `migrations/0003_acompte.sql`, `src/lib/emails/envoi.ts` (Resend, ne lève jamais), `src/lib/api/
  notifications.ts` (journal sans adresse, alerte d’expiration unique), envois branchés sur la
  création (reçue + nouvelle) et sur accepter/refuser/confirmer/annuler (réponse `email`), acompte
  saisi à l’acceptation ; 29 tests (385 au total).
- [x] Tranche 3 (15–30 min) — Protection et socle de `/admin/` : contrôle du jeton Access sur la
  page elle-même (intergiciel), en-têtes `noindex` et sans cache, contenus `admin`, page et
  navigation ; tests.
  Fait : `functions/admin/_middleware.ts` + `src/lib/api/admin-page.ts` (jeton Access exigé pour la page
  elle-même, `noindex`, sans cache, `frame-ancestors 'none'`), `src/content/admin/fr.md` + schéma,
  `AdminLayout`, `/admin/` (onglets, routage par `#`, bandeau d’erreur), client d’API et routes testés,
  route `GET /api/admin/moi` ; 33 tests (418 au total). Vues encore provisoires. À prévoir à
  l’étape 13 : `robots.txt` doit interdire `/admin/`.
- [x] Tranche 4 (15–30 min) — Demandes : liste filtrable, fiche, actions (accepter avec acompte,
  refuser, acompte reçu, annuler, prolonger) ; logique pure testée.
  Fait : `src/lib/reservation/transitions.ts` (table partagée API et interface), `src/lib/admin/demandes.ts`,
  vues `demandes` et `fiche` (liste filtrable, fiche, formulaires d’action avec message, acompte en euros,
  prolongation, résultat et état de l’e-mail), devis de démonstration réalistes ; 43 tests (461 au total).
  Vérifié dans un vrai navigateur : acceptation avec acompte de bout en bout.
- [x] Tranche 5 (15–30 min) — Calendrier mensuel par unité (états lisibles sans la couleur) et
  blocages (création, suppression, conflits signalés) ; logique pure testée.
  Fait : `src/lib/admin/{calendrier,blocages}.ts`, vues `calendrier` (une ligne par unité, lettres et
  motifs, détail de la case, navigation de mois, tient à 1280 px, défile dans son cadre sur mobile) et
  `blocages` (création avec contrôles, conflits signalés, suppression en deux temps) ; 16 tests
  (477 au total). Vérifié dans un vrai navigateur.
- [x] Tranche 6 (15–30 min) — Documentation (Access, service d’e-mail, variables), recette
  `docs/recette-reservation.md`, audit navigateur de l’administration (375/1280, clavier),
  Lighthouse.
  Fait : `docs/api.md` (e-mails, variables, Access pas à pas, service d’e-mail), `docs/recette-reservation.md`,
  `npm run audit:admin` (en-têtes, refus hors localhost, **test d’injection**, liste, fiche, actions,
  calendrier, blocages, clavier, 375/1280 px), Lighthouse `/admin/` : perf 100, a11y 100, BP 100 (SEO sans objet).
- [x] Tranche 7 (15–30 min) — Contrôles finaux, rapport dans `docs/journal-audit.md`, PR.
  Fait : 477 tests, build et types sans alerte, 184 liens, audits des pages rejoués, rapport,
  `docs/rapports/etape-10.json`. Reste : ouverture de la PR.

Dernière action : tranche 7 terminée (contrôles et rapport).
Prochaine action : ouvrir la PR (base `etape-9-reserver`), relecture par Vivien, aucune fusion
automatique. Étape 11 (pages légales) non commencée.

## Étape 9 — Réservation : parcours client, prête pour revue — 2026-11-16

Branche : `etape-9-reserver` · Base : `etape-8-api` (PR en attente de création par Vivien).
Statut : tranches 1 à 6 terminées ; étape prête pour revue, sans fusion.
PR à créer sur GitHub (base `etape-8-api`) : l’outil `gh` n’est pas installé ici. Une PR dédiée en fin d’étape, sans fusion.
Périmètre (`docs/etapes.md` étape 9, `docs/reservation.md` section 7) : page `/reserver/`
en français : calendrier, composition du séjour, devis en direct, coordonnées, confirmation.
Pas d’administration ni d’e-mails (étape 10), pas de version anglaise (étape 12).

Principes : textes dans `src/content/reserver/fr.md` ; logique pure (état du formulaire →
requête, état des nuits du calendrier, formatage) dans `src/lib/reserver/`, testée sous
Vitest ; le script du navigateur ne fait que relier le DOM à cette logique et à l’API.
JavaScript côté client assumé ici (calendrier, devis, envoi) ; sans lui, la page affiche
un message et les coordonnées. Prix, disponibilités et devis ne viennent jamais du
navigateur : tout passe par l’API de l’étape 8. Informations inconnues = `TODO(amaelle)`
visibles. Turnstile : clé publique en variable `PUBLIC_TURNSTILE_SITE_KEY`.

- [x] Tranche 1 (15–30 min) — Contenus et page : collection `reserver`, page `/reserver/`
  (structure HTML complète des champs, accessible, sans script), liens « Réserver » de
  l’accueil, du gîte et du lieu raccordés, `.env.example`, `TODO(amaelle)`.
  Fait : `src/content/reserver/fr.md` + schéma, `src/pages/reserver.astro` (champs complets, aide,
  erreurs, devis, confirmation, message sans JavaScript), liens de l’accueil, du gîte et du lieu
  raccordés à `/reserver/`, audits d’accueil et du gîte adaptés, `.env.example`, jeton `--erreur`.
  Le script `src/scripts/reserver.ts` est provisoire (affiche le formulaire). Suite : logique pure.
- [x] Tranche 2 (15–30 min) — Logique pure : état du formulaire, requête `sejour`
  (dont personnes par chambre dérivées), statut des nuits, formatage, messages ; tests.
  Fait : `src/lib/reserver/{types,formats,sejour,calendrier,devis,envoi}.ts`, 61 tests (315 au total).
  Hypothèse signalée : la répartition des personnes par chambre (utile seulement si le prix de la
  chambre est « par personne ») est calculée, pas demandée. Suite : calendrier accessible.
- [x] Tranche 3 (15–30 min) — Calendrier accessible : grille mensuelle au clavier, choix
  arrivée/départ, nuits complètes grisées d’après `/api/disponibilites`.
  Fait : `src/scripts/{dom,calendrier,reserver}.ts`, grille ARIA au clavier (flèches, Début/Fin,
  Page haut/bas), nuits complètes hachurées et annoncées, départ possible/impossible, repas par jour.
  Vérifié dans un vrai navigateur sur `wrangler pages dev`. Défaut trouvé et corrigé : un clic sur un
  jour était perdu quand un champ numérique avait le focus (la grille était reconstruite entre
  l’appui et le relâchement) ; la grille se met maintenant à jour sur place. Suite : devis et envoi.
- [x] Tranche 4 (15–30 min) — Devis en direct, validation, Turnstile, envoi, erreurs
  précises, écran de confirmation avec référence.
  Fait : `src/scripts/{devis,envoi}.ts` : devis en direct (API, jamais un calcul local), résumé
  d’erreurs lié aux champs, Turnstile explicite (jeton à usage unique réinitialisé), envoi, messages
  précis, confirmation avec référence et récapitulatif. Vérifié dans un vrai navigateur : parcours
  complet (201, `CHB-2026-0001`) et échec « places prises » (409, message du serveur, formulaire
  conservé). Défaut trouvé et corrigé : `window.turnstile` existe avant que `render` soit prêt.
- [x] Tranche 5 (15–30 min) — Audit : parcours complet dans un vrai navigateur sur
  `wrangler pages dev`, clavier, 375/768/1280, Lighthouse, build, types, tests, secrets.
  Fait : `npm run audit:reserver` (3 largeurs, parcours complet, demande retrouvée côté serveur),
  Lighthouse, audits des pages modifiées, contrastes de `--erreur`, 6 défauts trouvés et corrigés.
- [x] Tranche 6 (15–30 min) — Rapport dans `docs/journal-audit.md`, `docs/rapports/etape-9.json`, PR.
  Reste : ouverture de la PR.

Dernière action : tranche 6 terminée (audit, rapport).
Prochaine action : ouvrir la PR (base `etape-8-api`), relecture par Vivien, aucune fusion automatique.
Étape 10 (administration et e-mails) non commencée.

## Étape 8 — Réservation : API, prête pour revue — 2026-11-16

Branche : `etape-8-api` · Base : `etape-7-reservation` (déjà fusionnée dans `etape-6-lieu`, PR #5).
Statut : tranches 1 à 6 terminées ; étape prête pour revue, sans fusion.
PR à créer sur GitHub (base `etape-6-lieu`) : l’outil `gh` n’est pas installé ici. Une PR dédiée en fin d’étape, sans fusion.
Périmètre (`docs/etapes.md`, étape 8) : Pages Functions de l’API (disponibilités, devis,
création de demande avec transaction, Turnstile et limitation par IP, actions
d’administration) et wrangler avec un D1 local et des données de démonstration. Pas
d’interface publique (étape 9), pas d’administration visuelle ni d’e-mails (étape 10).

Principes : la logique vit dans `src/lib/api/` (fonctions pures qui reçoivent la base, la
configuration, l’horloge et `fetch` en paramètres) ; `functions/` ne contient que de minces
adaptateurs. Les tests passent par une vraie base SQLite en mémoire derrière une façade
compatible D1, pour exercer le SQL réel. Aucun secret dans le dépôt ; la protection de
`/admin/` est vérifiée aussi dans les fonctions (jeton Cloudflare Access).

- [x] Tranche 1 (15–30 min) — Fondations : types, façade D1 de test (SQLite en mémoire),
  configuration exportée pour les fonctions avec test de dérive, utilitaires HTTP (JSON,
  origine, type de contenu, taille), migration `0002` de limitation par IP, paramètres
  d’API dans le YAML.
  Fait : `src/lib/api/{types,http}.ts`, `tests/api/d1.ts` (façade SQLite), `src/generated/reservation.json`
  (`npm run config:generer` / `config:verifier`), `migrations/0002_limites.sql`, bloc `api` du YAML ;
  121 tests au total. Suite : disponibilités et devis.
- [x] Tranche 2 (15–30 min) — API publique en lecture : `GET /api/disponibilites`,
  `POST /api/devis`, chargement de l’instantané depuis la base, adaptateurs `functions/`.
  Fait : `src/lib/api/{schemas,instantane,runtime,disponibilites,devis}.ts`, adaptateurs
  `functions/api/{disponibilites,devis}.ts`, 23 tests (144 au total). Les champs inconnus sont
  ignorés (montant du navigateur sans effet). Suite : création de demande.
- [x] Tranche 3 (15–30 min) — Création de demande : validation stricte, Turnstile,
  limitation par IP, expiration à la lecture, insertion gardée dans un seul `batch`,
  référence `CHB-AAAA-NNNN` ; tests de concurrence sur du SQL réel.
  Fait : `turnstile.ts`, `limites.ts`, `expiration.ts`, `creation.ts`, `functions/api/demandes.ts` ;
  insertion gardée en un seul `batch` (lignes passées en JSON pour rester sous les 100 paramètres
  de D1, `changes()` pour n’écrire que si la demande a été insérée) ; 30 tests (174 au total).
  À confirmer sur wrangler local (tranche 5) : `changes()` et `json_each` dans un batch D1.
- [x] Tranche 4 (15–30 min) — Administration : vérification du jeton Cloudflare Access,
  liste et fiche des demandes, actions (accepter, refuser, confirmer, annuler, prolonger),
  calendrier, blocages ; journal ; tests.
  Fait : `access.ts` (RS256, audience, émetteur, expiration, liste blanche, 503 si non configuré,
  contournement local limité à localhost), `admin.ts` (point d’entrée unique qui authentifie
  avant toute route : demandes, fiche, actions gardées, calendrier, blocages),
  `functions/api/admin/[[chemin]].ts` ; 76 tests (250 au total). Suite : wrangler et démo.
- [x] Tranche 5 (15–30 min) — wrangler et démonstration : `wrangler.toml`, scripts D1
  local, données de démonstration, `.dev.vars.example`, vérification du bundle des
  fonctions, documentation.
  Fait : `wrangler.toml`, `seed/demo.sql`, `.dev.vars.example`, scripts `api:*` (wrangler épinglé
  en 4.156.1), `docs/api.md`, 4 tests de démo (254 au total). Vérifié sur `wrangler pages dev` :
  migrations, devis, création, concurrence réelle (201 + 409), administration, refus hors localhost.
- [x] Tranche 6 (15–30 min) — Audit et livraison : build, types, tests, secrets, liens,
  inventaire des `TODO(amaelle)`, rapport dans `docs/journal-audit.md`, PR.
  Fait : 254 tests, build et types sans alerte, 170 liens, inventaire à jour, rapport en tête de
  `docs/journal-audit.md`, résumé `docs/rapports/etape-8.json`. Reste : ouverture de la PR.

Dernière action : tranche 6 terminée (audit et rapport).
Prochaine action : ouvrir la PR (base `etape-6-lieu`), relecture par Vivien, aucune fusion
automatique. Étape 9 (parcours client) non commencée.

## Étape 7 — Réservation : données et règles, fusionnée (PR #5) — 2026-11-16

Branche : `etape-7-reservation` · Base : `etape-6-lieu` (étape 6 prête, PR ouverte par Vivien).
Statut : tranches 1 à 5 terminées ; étape prête pour revue, sans fusion.
PR à créer sur GitHub (base `etape-6-lieu`) : l’outil `gh` n’est pas installé ici. Une PR dédiée en fin d’étape, sans fusion.
Périmètre (`docs/etapes.md`, étape 7) : configuration, migrations D1 et bibliothèque pure
(sans réseau ni interface) pour disponibilités et devis, avec tests Vitest. Pas d’API
(étape 8), pas d’interface (étape 9).

Principe sur les inconnues : toute valeur `TODO(amaelle)` reste `null` dans le YAML. La
bibliothèque ne la remplace jamais par une valeur inventée ; la ligne de devis concernée
est marquée « à confirmer » et le devis « incomplet ». Les tests utilisent une
configuration de test complète, distincte de la configuration réelle.

- [x] Tranche 1 (15–30 min) — Configuration et schéma : unités, capacités, règles de séjour,
  délais, acompte et taxe dans `src/data/reservation.yaml` (inconnues à `null`), schéma
  Zod dans `src/lib/reservation/config.ts`, tests ; page du gîte inchangée.
  Fait : YAML étendu, schéma avec contrôle de la capacité totale (12), configuration de
  test `tests/reservation/config-test.ts`, 10 nouveaux tests (27 au total). Suite : migrations.
- [x] Tranche 2 (15–30 min) — Migrations D1 : `migrations/0001_*.sql` (`demandes`,
  `occupations`, `blocages`, `journal`, index, contraintes), vérifiées par un test sur une
  base SQLite en mémoire.
  Fait : `migrations/0001_reservation.sql`, 14 tests sur SQLite en mémoire (`node:sqlite`,
  clés étrangères actives). Blocages : date de fin exclue, comme les séjours. Suite :
  disponibilités.
- [x] Tranche 3 (15–30 min) — Disponibilités : nuits d’un séjour, occupations actives
  (statuts, expiration à la lecture), blocages, capacité par unité et par nuit, contraintes
  de séjour, messages d’erreur précis ; tests (dortoir presque plein, chevaux au-delà de la
  capacité, séjour sur un blocage, expiration).
  Fait : `src/lib/reservation/{dates,statuts,disponibilites,types}.ts`, 40 tests (81 au total).
  Capacité inconnue = refus, jamais illimité. Suite : devis et prise de place.
- [x] Tranche 4 (15–30 min) — Devis et prise de place : devis en centimes depuis la
  configuration seule, lignes inconnues « à confirmer », devis figé ; fonction qui décide
  des occupations à insérer ; tests dont deux demandes sur la dernière place.
  Fait : `devis.ts` (lignes en centimes, « à confirmer » pour les inconnues, devis figé et gelé),
  `demande.ts` (`preparerDemande`, occupations), contraintes de repas, de couchages et de
  personnes par chambre ; 108 tests au total. Suite : audit et PR.
- [x] Tranche 5 (15–30 min) — Audit et livraison : build, types, tests, liens, inventaire
  des `TODO(amaelle)`, rapport dans `docs/journal-audit.md`, PR.
  Fait : 108 tests, build et types sans alerte, 170 liens, inventaire à jour, rapport en tête
  de `docs/journal-audit.md`, résumé `docs/rapports/etape-7.json`. Reste : ouverture de la PR.

Dernière action : tranche 5 terminée (audit et rapport).
Prochaine action : ouvrir la PR (base `etape-6-lieu`), relecture par Vivien, aucune fusion
automatique. Étape 8 (API) non commencée ; voir le point d’attention sur les batchs D1 dans
le journal d’audit.

## Étape 6 — Le lieu (FR), prête pour revue — 2026-11-16

Branche : `etape-6-lieu` · Base : `etape-5-gite` (PR #4).
Statut : tranches 1 à 3 terminées ; étape prête pour revue, sans fusion.
PR à créer sur GitHub (base `etape-5-gite`) : l’outil `gh` n’est pas installé ici.

- [x] Tranche 1 (15–30 min) — Contenus et repères : textes Markdown à partir du
  brief et du tableau des photos, données des repères de la vue aérienne,
  informations inconnues identifiées. Fait : collection typée, six notes de
  validation, positions confirmées en YAML. Suite : page et navigation.
- [x] Tranche 2 (15–30 min) — Page et intégration : vue aérienne accessible,
  équipements, chevaux, alentours et accès, photos optimisées, navigation des
  trois pages vers `/le-lieu/`, vérification des liens. Fait : page `/le-lieu/`, composant
  `VueDuCiel`, liens depuis l’accueil et le gîte ; build sans avertissement, 0 diagnostic
  Astro, 17 tests, 170 références internes sans lien cassé. Suite : tranche 3.
- [x] Tranche 3 (15–30 min) — Audit et livraison : contrôles automatiques, clavier,
  rendus 375/768/1280, Lighthouse des pages touchées, inventaire, rapport et PR.
  Fait : `npm run audit:lieu` OK aux trois largeurs, Lighthouse 91/100/100/100 sur
  `/le-lieu/` (variable : 88 à 100 en performance), rapport en tête de
  `docs/journal-audit.md`. Reste : ouverture de la PR.

Dernière action : tranche 3 terminée (audit, rapport, résumé `docs/rapports/etape-6.json`).
Prochaine action : ouvrir la PR (base `etape-5-gite`), puis relecture par Vivien. Aucune
fusion automatique. Étape 7 non commencée.

Repères confirmés par Vivien : gîte sur le grand bâtiment central, carrière sur
le rectangle clair à droite, prés au premier plan. Distances, accès en van/camion
et portraits des chevaux manquants restent à confirmer.

Modification locale préexistante : `package-lock.json` contient uniquement le
retrait de drapeaux `dev` sur des dépendances Sharp. Conserver ce changement intact
et hors des commits de cette étape ; ne pas réinstaller les dépendances.

## Étape 5 — Le gîte (FR) — terminée le 2026-11-16

Branche : `etape-5-gite` · [PR #4](https://github.com/Louvivien/chambalade/pull/4)
Base : `etape-4-accueil`. Statut : réalisation et reprise documentaire terminées ;
étape prête pour revue, sans fusion. Réorganisation prise en compte : `09509cf`.

### Déjà réalisé

Ce découpage décrit rétrospectivement le travail livré avant l’ajout de la règle
des tranches. Il ne prétend pas qu’un commit distinct avait été créé pour chacune.
Implémentation : `856ea77` ; liaison du rapport à la PR : `0e97118`.

- [x] Tranche 1 — Contenus et structure : `/gite/`, textes Markdown, couchages,
  cheval, repas, espaces communs et arrivée. Suite réalisée : tarifs.
- [x] Tranche 2 — Données tarifaires : YAML en centimes, inconnues conservées,
  mentions de validation visibles et schéma de contrôle. Suite réalisée : intégration.
- [x] Tranche 3 — Présentation et navigation : photos autorisées, rendu adaptatif,
  liens depuis l’accueil et parcours clavier. Suite réalisée : audit.
- [x] Tranche 4 — Audit de livraison : 17 tests, 87 références internes sans erreur,
  six rendus navigateur ; Lighthouse 100 dans les quatre catégories sur l’accueil
  et le gîte. Rapports : `docs/journal-audit.md` et `docs/rapports/etape-5.json`.
  Suite : reprise documentaire ci-dessous.

### Tranche de reprise — prévue pour 15 à 30 minutes

- [x] Tranche 5 — Synchronisation après réorganisation et clôture : générateur et
  documentation corrigés, inventaire régénéré, build/types/tests/liens vérifiés,
  reprise consignée dans le journal. Suite : relecture de la PR #4 par Vivien.

Dernière action : plan committé dans `fc92233`, puis tranche 5 terminée ; build
sans avertissement, 17 tests réussis, aucun diagnostic Astro, 87 références
internes sans lien cassé. Les pages et leurs assets sont inchangés depuis `0e97118`.
Prochaine action : revue de l’étape 5. Aucune tranche de réalisation restante dans
cette étape ; les réponses métier ci-dessous restent à fournir avant publication.
Commit de reprise à retrouver dans `git log` :
`wip(etape-5): tranche 5 — synchroniser le suivi après réorganisation`.

### Points en suspens

- Relecture visuelle de Vivien et validation de la PR ; aucune fusion automatique.
- Confirmation par Amaëlle des tarifs, unités des chambres et draps, forfait,
  taxe, horaires, accès, linge, animaux, documents du cheval et acompte/annulation.
  Les mentions sont maintenues dans les contenus et l’inventaire tant que les
  réponses ne sont pas fournies ; elles ne bloquent pas la réalisation de l’étape 5.
- Photos intérieures après travaux, coordonnées et logo transparent attendus.
- Le formulaire et les règles complètes de réservation relèvent des étapes 7 à 10.

La prochaine étape du parcours est l’étape 6, « Le lieu (FR) ». Elle n’est pas
commencée dans cette reprise de l’étape 5. À son lancement : créer sa branche,
écrire ses tranches de 15 à 30 minutes ici et committer le plan avant de coder.
