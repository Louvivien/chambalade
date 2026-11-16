# Avancement

Le dernier état est en haut. À chaque reprise, lire ce fichier, `git log -5` et
`git status`, puis reprendre la première tranche non cochée. Chaque tranche
terminée donne lieu à un commit après un build sans erreur ni avertissement.

## Étape en cours : 5 — Le gîte (FR) — 2026-11-16

Branche : `etape-5-gite` · [PR #4](https://github.com/Louvivien/chambalade/pull/4)
Base : `etape-4-accueil`. Statut : réalisation terminée ; reprise documentaire
après la réorganisation `09509cf`, puis clôture technique de l’étape.

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

- [ ] Tranche 5 — Synchronisation après réorganisation et clôture : examiner les
  références au starter supprimé, corriger le texte du générateur d’inventaire,
  régénérer `docs/todo-contenus.md`, vérifier build, tests, types, liens et fichiers
  suivis, puis consigner le résultat dans le journal. Statut : à faire.

Dernière action : lecture des nouvelles consignes, des cinq derniers commits et
des rapports ; `npm run audit:todos` confirme que l’inventaire est désynchronisé.
Prochaine action : committer cet état, puis commencer la tranche 5. La terminer
par `wip(etape-5): tranche 5 — synchroniser le suivi après réorganisation`.

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
