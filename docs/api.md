# API de réservation (étape 8)

Pages Functions dans `functions/api/`, logique dans `src/lib/api/` et `src/lib/reservation/`.
Les règles métier sont décrites dans `docs/reservation.md` ; ce document décrit l'API et son
exploitation. Les réponses sont toujours en JSON, sans mise en cache (`Cache-Control: no-store`).

## Routes publiques

| Route | Rôle |
| --- | --- |
| `GET /api/disponibilites?du=AAAA-MM-JJ&au=AAAA-MM-JJ` | Places libres par unité et par nuit (`au` exclu, 62 jours au plus). Une capacité inconnue donne `null`, jamais « illimité ». |
| `POST /api/devis` | Devis recalculé côté serveur à partir du séjour. Signale la disponibilité sans la garantir. |
| `POST /api/demandes` | Pré-réservation : validation, limitation par IP, Turnstile, insertion gardée. Réponse `201` avec la référence. |

Les champs inconnus d'une requête sont ignorés : un montant, un tarif ou un statut envoyé par le
navigateur n'a aucun effet.

### Création d'une demande

Corps : `{ sejour, contact: { nom, prenom, email, telephone?, message? }, langue: "fr"|"en", consentement: true, turnstile_token }`.
Ordre des contrôles : origine et type de contenu → limitation par IP (chaque tentative compte)
→ validation des champs → Turnstile → règles du séjour → disponibilités → insertion.

| Code | Cas |
| --- | --- |
| 201 | Demande enregistrée, statut `en_attente`, référence `CHB-AAAA-NNNN` (année de création). |
| 400 | Champ invalide, JSON illisible. |
| 403 | Origine étrangère ou vérification anti-robot refusée. |
| 409 | Place prise ou capacité inconnue ; `erreurs[]` donne le message précis. |
| 413 / 415 | Corps trop gros (20 Ko) / type de contenu autre que JSON. |
| 422 | Séjour hors règles (durée, délais, couchages…). |
| 429 | Trop de demandes pour cette adresse IP ; en-tête `Retry-After`. |
| 503 | Vérification anti-robot indisponible : on refuse par prudence. |

**Pas de double réservation.** D1 n'offre pas de transaction interactive. La demande, ses
occupations et sa ligne de journal sont donc écrites dans un seul `batch` : la première requête
n'insère la demande que si, pour chaque nuit et chaque unité, la capacité restante suffit
(occupations actives et blocages compris) ; les suivantes n'écrivent rien si elle a échoué. La
vérification faite avant n'est qu'un confort : c'est cette garde SQL qui fait foi.

## Administration

Toutes les routes `/api/admin/**` passent par un seul point d'entrée
(`functions/api/admin/[[chemin]].ts`) qui authentifie **avant** de router : une route ajoutée plus
tard ne peut pas oublier la protection.

| Route | Rôle |
| --- | --- |
| `GET /api/admin/demandes?statut=&du=&au=` | Liste : en attente d'abord, les plus pressées en tête, avec le temps restant. |
| `GET /api/admin/demandes/:id` | Fiche : coordonnées, choix, devis figé, journal. |
| `POST /api/admin/demandes/:id/actions` | `accepter`, `refuser`, `confirmer` (acompte reçu), `annuler`, `prolonger` (`heures`, 1 à 720, plafonné à 30 jours). |
| `GET /api/admin/calendrier?mois=AAAA-MM` | Occupations actives par nuit et par unité, blocages. |
| `GET/POST /api/admin/blocages`, `DELETE /api/admin/blocages/:id` | Blocages de dates (date de fin exclue). Un blocage signale, sans les annuler, les demandes déjà placées. |

Transitions autorisées : `accepter` et `refuser` depuis `en_attente` ; `confirmer` depuis
`acceptee` ; `annuler` depuis `acceptee` ou `confirmee` ; `prolonger` depuis `en_attente` ou
`acceptee`. Toute autre transition répond `409`. Les mises à jour sont gardées (statut et délai
revérifiés dans la requête) et chaque action écrit une ligne de journal avec son auteur.

L'expiration se calcule à la lecture : chaque appel à l'administration et chaque création de
demande passent d'abord à `expiree` les demandes dont le délai est dépassé (aucune tâche planifiée).

### Authentification : Cloudflare Access, vérifiée dans la fonction

La fonction vérifie elle-même le jeton `Cf-Access-Jwt-Assertion` : signature RS256 avec les clés
publiées par Cloudflare (mises en cache une heure, relues en cas de rotation), émetteur,
audience, expiration, puis adresse e-mail présente dans la liste blanche. Les algorithmes `none`
et `HS256` sont refusés. Si Access n'est pas configuré, toute route répond `503` : rien n'est ouvert
par défaut.

Réglages (secrets ou variables Cloudflare, jamais dans le dépôt) :

| Nom | Rôle |
| --- | --- |
| `ACCESS_TEAM_DOMAIN` | Domaine d'équipe, par ex. `monequipe.cloudflareaccess.com`. |
| `ACCESS_AUD` | Audience (AUD) de l'application Access protégeant `/admin/*` et `/api/admin/*`. |
| `ADMIN_EMAILS` | Adresses autorisées, séparées par des virgules (Amaëlle, Vivien). |

La protection de `/admin/` et de `/api/admin/` par une application Access sera décrite pas à pas
à l'étape 10 (administration) et à l'étape 14 (déploiement).

## Secrets et variables

| Nom | Où | Rôle |
| --- | --- | --- |
| `TURNSTILE_SECRET` | secret Cloudflare | Vérification du jeton anti-robot. Absent : les créations répondent `503`. |
| `RATE_LIMIT_SALT` | secret Cloudflare | Sel du condensé d'adresse IP de la limitation (l'adresse n'est jamais stockée). |
| `ACCESS_*`, `ADMIN_EMAILS` | secrets Cloudflare | Voir ci-dessus. |
| `ENVIRONMENT`, `ACCESS_DEV_EMAIL` | `.dev.vars` local seulement | Contournement de développement : actif uniquement si `ENVIRONMENT=development` **et** depuis `localhost` ou `127.0.0.1`. À ne jamais définir en production. |

## Travailler en local

Prérequis : Node et le réseau (wrangler est lancé par `npx`, version épinglée dans `package.json`).

1. `cp .dev.vars.example .dev.vars` (fichier ignoré par Git).
2. `npm run api:migrer` crée la base D1 locale (`.wrangler/`, ignoré par Git).
3. `npm run api:demo` charge les données de démonstration (`seed/demo.sql`, personnes fictives en
   `example.invalid`). Rejouable : il efface d'abord la base locale.
4. `npm run api:dev` régénère la configuration, construit le site et lance `wrangler pages dev`
   sur http://localhost:8788. Les routes `/api/…` répondent ; l'administration accepte
   `ACCESS_DEV_EMAIL` depuis localhost.

`src/generated/reservation.json` est la copie de `src/data/reservation.yaml` lue par les
fonctions : `npm run config:generer` la met à jour, `npm run config:verifier` (et un test)
détecte une dérive.

## Tests

`npm test` exerce l'API contre une vraie base SQLite en mémoire (`tests/api/d1.ts`) : le SQL des
migrations et des requêtes est exécuté pour de bon. Vérifié aussi à la main sur `wrangler pages dev`
(moteur D1 de Cloudflare) : migrations, insertion gardée avec deux demandes simultanées (un `201`,
un `409`), Turnstile, administration.

Hors périmètre de cette étape : e-mails et interface publique et d'administration (étapes 9 et 10),
création de la base D1 de production et réglage d'Access (étape 14).
