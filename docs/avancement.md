# Avancement

Le dernier état est en haut. À chaque reprise, lire ce fichier, `git log -5` et
`git status`, puis reprendre la première tranche non cochée. Chaque tranche
terminée donne lieu à un commit après un build sans erreur ni avertissement.

## Étape en cours : 7 — Réservation : données et règles — 2026-11-16

Branche : `etape-7-reservation` · Base : `etape-6-lieu` (étape 6 prête, PR ouverte par Vivien).
Statut : tranche 1 terminée ; tranche 2 à faire. Une PR dédiée en fin d’étape, sans fusion.
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
- [ ] Tranche 2 (15–30 min) — Migrations D1 : `migrations/0001_*.sql` (`demandes`,
  `occupations`, `blocages`, `journal`, index, contraintes), vérifiées par un test sur une
  base SQLite en mémoire.
- [ ] Tranche 3 (15–30 min) — Disponibilités : nuits d’un séjour, occupations actives
  (statuts, expiration à la lecture), blocages, capacité par unité et par nuit, contraintes
  de séjour, messages d’erreur précis ; tests (dortoir presque plein, chevaux au-delà de la
  capacité, séjour sur un blocage, expiration).
- [ ] Tranche 4 (15–30 min) — Devis et prise de place : devis en centimes depuis la
  configuration seule, lignes inconnues « à confirmer », devis figé ; fonction qui décide
  des occupations à insérer ; tests dont deux demandes sur la dernière place.
- [ ] Tranche 5 (15–30 min) — Audit et livraison : build, types, tests, liens, inventaire
  des `TODO(amaelle)`, rapport dans `docs/journal-audit.md`, PR.

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
