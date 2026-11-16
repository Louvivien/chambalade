# Audit de fin d'étape

À appliquer par l'agent à la fin de **chaque** étape de `docs/etapes.md`, avant de proposer
la fusion. Le résultat est ajouté en haut de `docs/journal-audit.md` (créer le fichier s'il
n'existe pas), avec le modèle de rapport en bas de ce document. Un point non conforme n'est
pas caché : il est signalé, expliqué et corrigé, ou listé comme reste à faire.

## Méthode de travail

- Une branche par étape (`etape-4-accueil`), une pull request par étape, fusion seulement
  après validation de Vivien.
- Pas de modification hors du périmètre de l'étape, sauf correction nécessaire, signalée
  dans le rapport.

## 1. Contrôles automatiques (toujours)

| Contrôle | Commande | Attendu |
| --- | --- | --- |
| Build | `npm run build` | aucune erreur, aucun avertissement |
| Tests | `npm test` | tous verts ; nombre de tests indiqué dans le rapport |
| Contenus manquants | `git grep -n "TODO(amaelle)"` | chaque occurrence listée dans `docs/todo-contenus.md`, et inversement |
| Secrets | `git grep -niE "api[_-]?key\|secret\|password\|token" -- ':!docs' ':!.env.example'` | aucun secret réel |
| Fichiers indésirables | `git status --ignored` | rien de `photos-originales/`, `.env`, `dist/` dans le commit |
| Liens internes | vérification des liens du site construit (outil au choix, par ex. `linkinator dist`) | aucun lien cassé |

## 2. Contenu (toujours, pour toute page touchée)

- [ ] Chaque prix, horaire, distance, capacité ou équipement affiché figure dans
      `docs/brief.md` ou `src/data/reservation.yaml`. Sinon : `TODO(amaelle)`, jamais une invention.
- [ ] Aucun texte de contenu ni prix écrit en dur dans un composant.
- [ ] Photos : uniquement des photos « À utiliser » de `docs/photos.md`, avec le texte
      alternatif prévu ; la projection du gîte porte la légende « Projection ».
- [ ] Nom « Chambalade » en un mot ; vouvoiement ; typographie française (espaces
      insécables, « », ’).
- [ ] Version anglaise à jour si la page existe en anglais.

## 3. Qualité front (étapes 3 à 6, 9, 12, 13)

- [ ] Lighthouse mobile ≥ 90 en performance, accessibilité, bonnes pratiques et SEO sur
      chaque page touchée ; scores reportés dans le rapport.
- [ ] Navigation complète au clavier, focus visible, ordre logique.
- [ ] Contrastes WCAG AA (le kaki n'est jamais utilisé comme couleur de texte sur le crème).
- [ ] Affichage vérifié à 375 px, 768 px et 1280 px de large ; aucun défilement horizontal.
- [ ] `prefers-reduced-motion` respecté.
- [ ] Aucun signe de site générique listé dans la section Design d'`AGENTS.md`.
- [ ] Aucune requête vers un domaine externe autre que ceux prévus (Cloudflare, service
      d'e-mail, Turnstile).

## 4. Réservation (étapes 7 à 10)

- [ ] Chaque règle de `docs/reservation.md` a au moins un test : capacités, dortoir au lit,
      chevaux, blocages, durées min/max, expiration, demandes concurrentes, devis figé.
- [ ] Le devis et la disponibilité sont recalculés côté serveur ; un montant envoyé par le
      navigateur est ignoré (test à l'appui).
- [ ] La création d'une demande vérifie et insère les occupations dans une seule transaction.
- [ ] Toutes les entrées de l'API sont validées ; les erreurs renvoient un message précis
      sans détail technique.
- [ ] `/admin/` et les routes d'administration de l'API refusent toute requête sans
      Cloudflare Access (vérifié aussi côté fonction, pas seulement par la configuration).
- [ ] Aucune donnée personnelle dans les URL ni dans les logs.
- [ ] Les prix et paramètres viennent tous de `src/data/reservation.yaml`.

## 5. Avant la mise en ligne (étape 14)

- [ ] Toutes les cases des sections 1 à 4 cochées sur l'ensemble du site.
- [ ] `docs/recette-reservation.md` déroulée de bout en bout sur l'environnement de
      prévisualisation Cloudflare, résultats notés.
- [ ] Mentions légales, confidentialité et conditions de réservation présentes, marquées
      « à faire valider » tant qu'Amaëlle ne les a pas relues.
- [ ] `sitemap.xml`, `robots.txt`, `hreflang`, Open Graph et données structurées vérifiés.
- [ ] Liste finale des `TODO(amaelle)` restants, classés : bloquant / non bloquant.

## Modèle de rapport (à ajouter dans docs/journal-audit.md)

```markdown
## Étape N — titre — AAAA-MM-JJ

Branche : etape-N-… · Pull request : #…

Fait :
- …

Contrôles automatiques : build OK · N tests OK · secrets : rien · liens : OK
Lighthouse mobile (perf / a11y / BP / SEO) : page — 9x / 9x / 9x / 9x
Contenu : conforme / écarts : …
Points non conformes et décision : …
Nouveaux TODO(amaelle) : …
À vérifier visuellement par Vivien : …
```
