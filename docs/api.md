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
| `POST /api/admin/demandes/:id/actions` | `accepter` (avec `acompte_cents` facultatif), `refuser`, `confirmer` (acompte reçu), `annuler`, `prolonger` (`heures`, 1 à 720, plafonné à 30 jours). Un `message` facultatif est repris dans l’e-mail à la cliente. La réponse indique `email` : `envoye`, `echec`, `non_configure` ou `null` (prolongation). |
| `GET /api/admin/moi` | Adresse de la personne connectée (affichée en haut de l’administration). |
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
| `EMAIL_API_KEY` | secret Cloudflare | Clé du service d’e-mail (Resend), droit d’envoi seulement. Absente : aucun e-mail, l’administration l’indique. |
| `EMAIL_FROM` | variable Cloudflare | Expéditeur, par ex. `Chambalade <reservation@chambalade.fr>` ; le domaine doit être vérifié chez Resend. TODO(amaelle) : adresse d’expédition. |
| `EMAIL_REPLY_TO` | variable Cloudflare | Adresse de réponse des e-mails à la cliente (celle d’Amaëlle). |
| `NOTIFY_EMAILS` | variable Cloudflare | Destinataires des notifications à Amaëlle (nouvelle demande, demande bientôt expirée), séparés par des virgules ; à défaut, `ADMIN_EMAILS`. |
| `VIREMENT_INFOS` | secret Cloudflare | Coordonnées bancaires pour l’acompte, texte libre repris dans l’e-mail d’acceptation. Jamais dans le dépôt. |
| `ENVIRONMENT`, `ACCESS_DEV_EMAIL` | `.dev.vars` local seulement | Contournement de développement : actif uniquement si `ENVIRONMENT=development` **et** depuis `localhost` ou `127.0.0.1`. À ne jamais définir en production. |

## E-mails (étape 10)

Les modèles sont dans `src/data/emails.yaml` (français et anglais pour les clientes, français pour
Amaëlle) ; `npm run config:generer` les exporte pour les fonctions. L’envoi passe par
`src/lib/emails/envoi.ts` (service Resend) : pour changer de service (Brevo…), seul ce fichier change.

| E-mail | Déclencheur | Destinataire |
| --- | --- | --- |
| Demande reçue (« ce n’est pas encore une réservation ») | création d’une demande | la cliente, dans sa langue |
| Nouvelle demande, avec lien direct vers la fiche | création d’une demande | Amaëlle (`NOTIFY_EMAILS`) |
| Demande acceptée (acompte, échéance, coordonnées bancaires) | action « Accepter » | la cliente |
| Réservation confirmée | action « Marquer l’acompte reçu » | la cliente |
| Demande refusée / réservation annulée | actions « Refuser » / « Annuler » | la cliente |
| Demande bientôt expirée (moins de 12 h) | consultation de la liste des demandes, une fois par demande | Amaëlle |

Règles : un e-mail qui échoue **ne fait jamais échouer** une demande ni une action ; l’issue
(`email_envoye`, `email_echec`, `email_ignore`) est consignée au journal avec le nom du modèle et
jamais d’adresse ; sans service configuré, rien n’est envoyé et l’administration le dit à Amaëlle
(« écrivez directement à la cliente »). Les noms et messages des clientes sont échappés dans le HTML et
assainis dans les objets (aucun retour à la ligne : pas d’injection d’en-tête).

### Brancher le service d’e-mail (Resend)

1. Créer un compte sur resend.com ; y ajouter le domaine `chambalade.fr` et copier les enregistrements
   DNS demandés (SPF, DKIM) dans le DNS du domaine (zone Cloudflare), puis lancer la vérification.
2. Créer une clé d’API **limitée à l’envoi**, la copier une seule fois.
3. Dans Cloudflare Pages, projet → Paramètres → Variables et secrets (production et aperçus) :
   secrets `EMAIL_API_KEY` et `VIREMENT_INFOS` ; variables `EMAIL_FROM`, `EMAIL_REPLY_TO`,
   `NOTIFY_EMAILS`. En ligne de commande : `npx wrangler@4.156.1 pages secret put EMAIL_API_KEY --project-name chambalade`.
4. Envoyer une demande d’essai (voir `docs/recette-reservation.md`) et vérifier l’arrivée, le dossier
   des indésirables et le rendu sur téléphone. Les quotas de l’offre gratuite sont à vérifier chez le
   service au moment du choix.

## Protéger `/admin/` avec Cloudflare Access (étape 10)

L’administration repose sur **deux verrous** : Cloudflare Access devant le site, et le contrôle du jeton
Access dans les fonctions elles-mêmes (page `/admin/` par `functions/admin/_middleware.ts`, API par
`gererAdmin`). Si Access était mal réglé ou désactivé, les fonctions refuseraient quand même tout.

1. Cloudflare → Zero Trust → Access → Applications → Ajouter une application → **Auto-hébergée**.
2. Nom : « Chambalade, administration ». Destinations : domaine `chambalade.fr`, chemins `admin` et
   `api/admin` (avec tout ce qui suit). **Ajouter aussi les adresses d’aperçu** (`*.pages.dev` du projet) ou
   désactiver les déploiements d’aperçu publics : sinon l’administration y resterait ouverte au niveau Access
   (les fonctions la refuseraient tout de même).
3. Politique : action « Autoriser », règle « adresses e-mail » : celles d’Amaëlle et de Vivien. La connexion
   se fait par code reçu par e-mail (aucun mot de passe géré par le site).
4. Dans l’application, relever la balise d’audience (**AUD**), et dans Zero Trust → Paramètres le domaine
   d’équipe (`<équipe>.cloudflareaccess.com`).
5. Renseigner dans Cloudflare Pages les variables `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` et `ADMIN_EMAILS`
   (mêmes adresses que la politique). Sans elles, toute l’administration répond `503`.
6. Vérifier : en navigation privée, `/admin/` demande un code e-mail ; une adresse non listée est refusée ;
   `curl -i https://chambalade.fr/api/admin/demandes` répond `401` sans jeton.

Les noms exacts des menus Cloudflare évoluent : en cas d’écart, se fier à la documentation « Cloudflare
Access, self-hosted application ».

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
