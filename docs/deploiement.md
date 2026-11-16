# Mise en ligne sur Cloudflare Pages (étape 14)

Ce guide dit **dans quel ordre** et **avec quelles commandes** passer du dépôt au site en ligne sur
`chambalade.fr`. Il a été écrit sans accès aux comptes Cloudflare, Resend ni au domaine : tout ce qui
touche un compte est à faire par Vivien (ou Amaëlle), et chaque point qu’on ne peut pas vérifier depuis
le dépôt est marqué **« à vérifier »** (les menus de Cloudflare changent ; en cas d’écart, la
documentation officielle fait foi). Ce que le dépôt sait contrôler l’est par deux commandes :

- avant la mise en ligne : `npm run build && npm run deploiement:verifier` ;
- après la mise en ligne : `npm run deploiement:smoke -- https://<adresse>` (voir l’étape 9).

Aucun secret ne va dans le dépôt ni dans une conversation. Les valeurs se saisissent directement dans
Cloudflare ou dans votre terminal.

## Vue d’ensemble

| # | Étape | Où | Qui |
| --- | --- | --- | --- |
| 1 | Comptes et accès | Cloudflare, GitHub, Resend | Vivien |
| 2 | Projet Cloudflare Pages relié au dépôt | Cloudflare | Vivien |
| 3 | Base D1 et migrations | terminal | Vivien |
| 4 | Turnstile (anti-robot) | Cloudflare | Vivien |
| 5 | Secrets et variables | Cloudflare / terminal | Vivien |
| 6 | E-mails (Resend) | Resend, DNS | Vivien |
| 7 | Protection de `/admin/` (Access) | Cloudflare Zero Trust | Vivien |
| 8 | Prévisualisation et recette | navigateur | Vivien et Amaëlle |
| 9 | Contrôle automatique du site déployé | terminal | Vivien |
| 10 | Domaine `chambalade.fr` | DNS, Cloudflare | Vivien |
| 11 | Ouverture au public | dépôt | Amaëlle valide, Vivien publie |
| 12 | Après l’ouverture | Cloudflare, Google | Vivien |

Faire d’abord les étapes 1 à 9 **sur l’adresse de prévisualisation** (`https://chambalade.pages.dev`
ou celle que Cloudflare attribue), sans toucher au domaine : le site actuel sur Wix reste en place.

## 1. Comptes et accès

- Un compte Cloudflare (gratuit suffit pour Pages, D1, Turnstile, Access jusqu’à 50 utilisateurs — **à vérifier**
  sur la page des tarifs Cloudflare).
- Le dépôt sur GitHub, accessible au compte Cloudflare (autorisation de l’application « Cloudflare Pages »).
- Un compte Resend (ou le service d’e-mail finalement retenu, voir `docs/api.md`).
- L’accès au nom de domaine `chambalade.fr` chez son registrar (et à sa zone DNS actuelle).

## 2. Projet Cloudflare Pages

Cloudflare → Workers & Pages → Créer → **Pages** → Se connecter à Git → choisir le dépôt.

| Réglage | Valeur |
| --- | --- |
| Nom du projet | `chambalade` (il doit correspondre à `name` dans `wrangler.toml`) |
| Branche de production | `main` |
| Préréglage (framework) | Astro, ou « Aucun » avec les deux valeurs suivantes |
| Commande de build | `npm run build` |
| Dossier de sortie | `dist` |
| Dossier racine | *(vide)* |

Variables de **construction** (Paramètres → Variables et secrets, ou « Build » selon l’interface) :

| Nom | Valeur | Remarque |
| --- | --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | clé de site Turnstile (étape 4) | Publique, lue à la construction. Sans elle, le formulaire s’affiche mais ne peut pas être envoyé. |
| `NODE_VERSION` | `24` | Le dépôt demande Node ≥ 24.10 et < 25 (`package.json`, `.nvmrc`). **À vérifier** : versions de Node disponibles dans l’image de build de Pages ; sinon, adapter `engines`. |

> **Important — `wrangler.toml`.** Le dépôt contient un `wrangler.toml` avec `pages_build_output_dir`.
> Dans ce cas, Cloudflare lit la configuration (liaisons, variables non secrètes) **dans ce fichier** et
> peut verrouiller ces réglages dans le tableau de bord. Les **secrets** se saisissent toujours dans
> Cloudflare (étape 5). **À vérifier** dans l’interface après le premier déploiement.

Lancer un premier déploiement : il réussira pour la partie statique ; les fonctions échoueront tant que la
base D1 (étape 3) et les secrets (étape 5) n’existent pas.

## 3. Base D1 et migrations

Dans un terminal, à la racine du dépôt, connecté à Cloudflare (`npx wrangler@4.156.1 login` ouvre le navigateur) :

```sh
npx wrangler@4.156.1 d1 create chambalade
```

La commande affiche un `database_id`. Ce n’est **pas un secret** : le recopier dans `wrangler.toml`
(ligne `database_id`, à la place de l’identifiant de test), puis committer ce changement.

Appliquer les migrations sur la base **distante** (`--remote`, à ne pas confondre avec `--local` utilisé par
`npm run api:migrer`) :

```sh
npx wrangler@4.156.1 d1 migrations list chambalade --remote      # ce qui reste à appliquer
npx wrangler@4.156.1 d1 migrations apply chambalade --remote
```

Ne **jamais** exécuter `npm run api:demo` contre la base distante : il insère des demandes fictives
(`seed/demo.sql`).

**Prévisualisations séparées (recommandé).** Par défaut, une branche d’aperçu utiliserait la même base que
la production. Pour l’éviter, créer une seconde base (`npx wrangler@4.156.1 d1 create chambalade-preview`,
puis `migrations apply chambalade-preview --remote`) et la déclarer pour l’environnement d’aperçu dans
`wrangler.toml` :

```toml
[env.preview]
[[env.preview.d1_databases]]
binding = "DB"
database_name = "chambalade-preview"
database_id = "<identifiant de la base d’aperçu>"
```

**À vérifier** : la syntaxe exacte des environnements `preview` / `production` dans un `wrangler.toml` de
Pages (documentation « Pages configuration »). Les deux identifiants doivent être réels avant la mise en
ligne ; `npm run deploiement:verifier` les contrôle tous.

**Sauvegardes.** D1 propose une restauration à un instant donné (« Time Travel ») et l’export
`npx wrangler@4.156.1 d1 export chambalade --remote --output=sauvegarde.sql` (**à vérifier** : durée de
conservation du Time Travel selon l’offre). Une sauvegarde contient des données personnelles : la stocker
hors du dépôt, la chiffrer, et la supprimer quand elle ne sert plus.

## 4. Turnstile

Cloudflare → Turnstile → Ajouter un site. Nom : « Chambalade ». Noms d’hôte : `chambalade.fr`,
`www.chambalade.fr` et le domaine `*.pages.dev` du projet (pour la prévisualisation). Mode : géré (« Managed »).

- La **clé de site** (publique) va dans la variable de construction `PUBLIC_TURNSTILE_SITE_KEY` (étape 2).
- La **clé secrète** est un secret : `TURNSTILE_SECRET` (étape 5).

Jamais de clé de test de Cloudflare en production (`1x000…`, `2x000…`, `3x000…`) : elles valident ou refusent
tout. `npm run deploiement:verifier` repère une clé de test dans le site construit.

## 5. Secrets et variables

Les noms et rôles sont décrits dans `docs/api.md` (« Secrets et variables »). Créer chaque secret **sur le
projet Pages** :

```sh
npx wrangler@4.156.1 pages secret put TURNSTILE_SECRET --project-name chambalade
npx wrangler@4.156.1 pages secret put RATE_LIMIT_SALT --project-name chambalade     # openssl rand -hex 32
npx wrangler@4.156.1 pages secret put EMAIL_API_KEY --project-name chambalade
npx wrangler@4.156.1 pages secret put VIREMENT_INFOS --project-name chambalade
npx wrangler@4.156.1 pages secret put ADMIN_EMAILS --project-name chambalade        # adresses d’Amaëlle et de Vivien, séparées par des virgules
npx wrangler@4.156.1 pages secret put ACCESS_TEAM_DOMAIN --project-name chambalade
npx wrangler@4.156.1 pages secret put ACCESS_AUD --project-name chambalade
```

La commande demande la valeur au clavier : elle ne s’écrit ni dans l’historique ni dans un fichier.
Pour la prévisualisation, ajouter `--env preview` (ou saisir les mêmes noms dans l’environnement « Aperçu »
du tableau de bord). Variables non secrètes : `EMAIL_FROM`, `EMAIL_REPLY_TO`, `NOTIFY_EMAILS` (dans le tableau
de bord, ou `[vars]` de `wrangler.toml` si l’adresse n’a rien de sensible).

**Ne jamais définir** `ENVIRONMENT` ni `ACCESS_DEV_EMAIL` sur Cloudflare : ils ouvrent l’administration
depuis `localhost`. Les fonctions les ignorent hors `localhost`, mais le contrôle les refuse par principe.

Après tout changement de secret ou de variable, redéployer (un secret n’est lu qu’au démarrage d’un
déploiement).

## 6. E-mails (Resend)

Voir « E-mails » dans `docs/api.md`. En résumé : ajouter le domaine `chambalade.fr` chez Resend, publier les
enregistrements DNS qu’il indique (SPF, DKIM — **ne pas remplacer** les enregistrements MX ni les SPF existants
d’une boîte de messagerie : les fusionner), attendre l’état « Verified », créer une clé d’API limitée à
l’envoi, puis renseigner `EMAIL_API_KEY`, `EMAIL_FROM` (par ex. `Chambalade <reservation@chambalade.fr>`),
`EMAIL_REPLY_TO` et `NOTIFY_EMAILS`.

Non testé depuis le dépôt : l’envoi réel (aucun compte). La recette (lignes D1 à D7) le vérifie.

## 7. Protéger `/admin/` avec Cloudflare Access

Suivre pas à pas « Protéger `/admin/` avec Cloudflare Access » dans `docs/api.md`. Points d’attention pour la
mise en ligne :

- Destinations : `chambalade.fr/admin*` et `chambalade.fr/api/admin*`, **et** les mêmes chemins sur le domaine
  `*.pages.dev` (prévisualisations incluses).
- La politique n’autorise que les adresses d’Amaëlle et de Vivien ; `ACCESS_AUD` et `ACCESS_TEAM_DOMAIN` viennent
  de cette application.
- Même si Access était mal réglé, les fonctions refusent toute requête sans jeton valide (deux verrous).

## 8. Prévisualisation et recette

Ouvrir l’adresse de prévisualisation. Dérouler `docs/recette-reservation.md` : parcours de la cliente (A), places
(B), administration (C), e-mails réels (D), sécurité (E), puis la liste de reprise (F). Les lignes qui exigent un
vrai compte (Access, Resend, Turnstile) ne peuvent se cocher qu’ici.

## 9. Contrôle automatique du site déployé

```sh
npm run deploiement:smoke -- https://chambalade.pages.dev
```

Le script vérifie, sans rien écrire dans la base : pages en français et en anglais, 404, `hreflang`,
`robots.txt`, `sitemap.xml`, en-têtes, administration fermée (`/admin/` et `/api/admin/` refusent sans Access),
API de disponibilités, absence de clé de test.

## 10. Domaine `chambalade.fr`

Le site actuel est sur Wix : **ne rien couper avant que l’étape 8 soit validée.**

1. **DNS chez Cloudflare (recommandé).** Ajouter `chambalade.fr` comme site Cloudflare, puis, chez le registrar,
   remplacer les serveurs de noms par ceux que Cloudflare indique. Avant de changer, **recopier tous les
   enregistrements existants** (MX, SPF/TXT, etc.) dans la zone Cloudflare, sinon la messagerie s’arrête.
   Baisser le TTL des enregistrements une journée avant le basculement.
2. Cloudflare → projet Pages → **Domaines personnalisés** → ajouter `chambalade.fr` puis `www.chambalade.fr`.
   Cloudflare crée les enregistrements `CNAME` et émet le certificat HTTPS automatiquement.
3. Rediriger `www` vers le domaine nu (ou l’inverse) par une règle de redirection Cloudflare, pour n’avoir qu’une
   adresse canonique : `https://chambalade.fr` (c’est celle que déclarent le sitemap et les balises canoniques).
4. Si la zone DNS reste chez un autre prestataire : le domaine nu (`chambalade.fr`) ne peut généralement pas pointer
   vers Pages sans « aplatissement de CNAME » ; seul `www` le peut. **À vérifier** auprès du prestataire.
5. Retirer ou rediriger l’ancien site Wix **après** la bascule (pour ne pas laisser deux sites concurrents).
6. Ajouter `chambalade.fr` aux noms d’hôte de Turnstile (étape 4) et au domaine de Resend (étape 6) si ce n’est pas fait.
7. Relancer le contrôle : `npm run deploiement:smoke -- https://chambalade.fr`.

## 11. Ouverture au public

Rien ne doit être publié tant que : `npm run deploiement:verifier -- --strict --ouverture` n’affiche plus que
des « OK ». Concrètement :

- pages légales relues et validées → `valide: true` dans `src/data/legal.yaml` (lève le bandeau et le `noindex`,
  ajoute les pages au sitemap) ;
- coordonnées (`src/data/site.yaml`), identité de l’éditeur (`src/data/legal.yaml`) renseignées ;
- tarifs et règles de `src/data/reservation.yaml` validés par Amaëlle (`validated: true`, valeurs non nulles) ;
- `docs/todo-contenus.md` : plus de point bloquant (voir `docs/journal-audit.md`, étape 13, liste des restes) ;
- recette signée sur la prévisualisation.

## 12. Après l’ouverture

- **Statistiques sans cookie** : Cloudflare → projet Pages → Métriques → activer Web Analytics, puis relire le
  paragraphe « Cookies et mesure d’audience » de la politique de confidentialité (il dit que le service n’est pas
  encore actif) et le mettre à jour dans les deux langues. **À vérifier** : comportement de l’injection automatique.
- **Google Search Console** : ajouter le domaine, soumettre `https://chambalade.fr/sitemap.xml`.
- **Surveillance** : regarder les journaux des fonctions (Cloudflare → projet → Fonctions → journaux) la première
  semaine ; ils ne contiennent aucune donnée personnelle par conception.
- **Retour arrière** : Pages garde l’historique des déploiements ; « Rollback » sur un déploiement précédent
  remet le site statique et les fonctions d’avant. Les migrations de base ne se « défont » pas : écrire une
  migration corrective.

## 13. Données personnelles en production

Le site ne supprime **rien tout seul**. L’effacement d’une demande et la purge périodique se font à la main, avec
`scripts/rgpd.mjs` (requêtes testées sur SQLite et sur la D1 locale). Par défaut, le script **affiche** les requêtes
sans rien exécuter ; il vise la base locale tant qu’on n’ajoute pas `--remote`.

| Besoin | Commande (ajouter `--executer`, et `--remote` pour la production) |
| --- | --- |
| Effacer les données personnelles d’une demande (nom, e-mail, téléphone, message), en gardant dates et devis | `npm run rgpd -- anonymiser CHB-2027-0001` |
| Supprimer une demande entièrement | `npm run rgpd -- supprimer CHB-2027-0001` |
| Voir ce qu’une purge toucherait (aucune donnée personnelle affichée) | `npm run rgpd -- apercu --avant 2024-12-31` |
| Anonymiser toutes les demandes terminées plus anciennes qu’une date | `npm run rgpd -- purger --avant 2024-12-31` |

Règles : une demande **active** (en attente, acceptée, ou confirmée pour un séjour à venir) n’est jamais touchée : la
refuser ou l’annuler d’abord dans l’administration. Les nuits restent bloquées après anonymisation. Chaque opération
laisse une ligne dans le journal (`anonymisee` ou `supprimee`), sans donnée personnelle. La durée de conservation
(proposition : 3 ans) et le rythme de la purge sont à décider par Amaëlle (voir la politique de confidentialité).

Demande d’une cliente : l’identifier par sa référence (affichée dans l’administration et dans ses e-mails), vérifier
que la demande vient bien de la personne concernée, répondre dans le mois, puis noter la date de traitement.
