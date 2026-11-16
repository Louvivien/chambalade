# Recette du module de réservation

Procédure manuelle à dérouler **avant la mise en production**, sur l’environnement de prévisualisation
Cloudflare (D1 de test, vrais secrets de test, vrai service d’e-mail) puis, pour les points marqués
« prod », sur le site réel. Les tests automatiques (`npm test`, `npm run audit:*`) couvrent la logique ; cette
recette vérifie ce qu’ils ne peuvent pas voir : les vrais e-mails, Cloudflare Access, le rendu sur un vrai
téléphone, le ressenti d’Amaëlle.

En local, la même procédure se joue avec `npm run api:dev` (voir `docs/api.md`) ; les cases « e-mail »
et « Access » y sont sans objet (l’administration l’annonce).

**Comment noter** : pour chaque ligne, cocher `OK` ou `KO`, indiquer la date et la personne, et décrire
tout écart. Un `KO` bloque la mise en ligne tant qu’il n’est pas corrigé ou accepté par écrit.

Préparation : prévoir **deux adresses e-mail de test** (une cliente en français, une en anglais) et un
téléphone. Repartir d’une base de test vide, ou de `npm run api:demo` en local.

## A. Parcours de la cliente (`/reserver/`)

| N° | Étapes | Résultat attendu | OK / KO |
| --- | --- | --- | --- |
| A1 | Ouvrir la page sur ordinateur et téléphone. | Le calendrier s’affiche, les jours libres ressemblent à des boutons, les jours passés sont en pointillés. | |
| A2 | Choisir une arrivée puis un départ à la souris, puis au clavier (flèches, Entrée). | Les dates, le nombre de nuits et l’annonce « Arrivée choisie… » s’affichent. | |
| A3 | Choisir une chambre, 1 adulte, 0 cheval, puis cocher un dîner. | Le devis se met à jour sans recharger ; les lignes inconnues sont « à confirmer » ; la mention « Devis indicatif… » est visible. | |
| A4 | Envoyer sans rien remplir. | Un résumé d’erreurs apparaît, chaque ligne mène au champ ; les erreurs disparaissent à la correction. | |
| A5 | Tout remplir, valider l’anti-robot, envoyer. | Écran de confirmation avec la référence `CHB-AAAA-NNNN`, le récapitulatif, le délai de réponse. | |
| A6 | Vérifier la boîte de la cliente. | E-mail « demande reçue » dans la bonne langue, ton correct, montants lisibles, pas dans les indésirables. | |
| A7 | Refaire une demande avec la langue anglaise (adresse de test anglaise). | Pour l’instant la page est en français : vérifier que l’e-mail reste cohérent (langue de la demande). | |
| A8 | Envoyer 6 demandes de suite depuis le même réseau. | La 6e est refusée avec « trop de demandes » (limite de 5 par heure). | |

## B. Disponibilités et places

| N° | Étapes | Résultat attendu | OK / KO |
| --- | --- | --- | --- |
| B1 | Demander 4 lits de dortoir sur des nuits données, puis 4 lits sur les mêmes nuits. | La seconde est refusée : « Le dortoir n’a plus que 2 lits libres la nuit du… ». | |
| B2 | Demander la chambre 2 sur des nuits déjà prises. | Les nuits sont hachurées dans le calendrier ; l’envoi est refusé avec le message de la chambre. | |
| B3 | Poser un blocage (administration) sur ces nuits, recharger `/reserver/`. | Les nuits bloquées sont complètes ; la date de fin du blocage reste réservable. | |
| B4 | Demander un cheval tant que la capacité des paddocks est inconnue. | Refus clair : la capacité n’est pas encore définie. (À rejouer quand Amaëlle l’aura donnée.) | |
| B5 | Laisser une demande en attente dépasser son délai, puis ouvrir l’administration. | Elle passe à « Expirée » et ses nuits redeviennent libres. | |

## C. Administration (`/admin/`)

| N° | Étapes | Résultat attendu | OK / KO |
| --- | --- | --- | --- |
| C1 (prod) | Ouvrir `/admin/` en navigation privée. | Cloudflare Access demande un code par e-mail ; une adresse non listée est refusée. | |
| C2 (prod) | `curl -i https://…/api/admin/demandes` sans connexion. | `401`, aucune donnée. | |
| C3 | Ouvrir la liste. | Les demandes en attente sont en premier, avec le temps restant ; le nombre à traiter est annoncé. | |
| C4 | Ouvrir une fiche (aussi par le lien de l’e-mail « nouvelle demande »). | Séjour, coordonnées, devis, historique, actions ; le message de la cliente s’affiche en texte brut. | |
| C5 | Accepter avec un acompte de 76,50 € et un mot pour la cliente. | Statut « Acceptée » ; message « E-mail envoyé » ; e-mail reçu avec l’acompte, l’échéance, les coordonnées bancaires, le mot d’Amaëlle. | |
| C6 | Marquer l’acompte reçu. | Statut « Confirmée » ; e-mail de confirmation reçu. | |
| C7 | Refuser une autre demande avec un mot ; annuler une demande confirmée. | E-mails « refusée » et « annulée » reçus ; les nuits redeviennent libres. | |
| C8 | Prolonger le délai d’une demande en attente. | La nouvelle échéance s’affiche ; aucun e-mail n’est envoyé. | |
| C9 | Consulter le calendrier du mois. | Chaque case occupée porte une lettre et un motif ; un clic donne le détail et le lien vers la demande. | |
| C10 | Créer un blocage sur des nuits déjà occupées. | Les demandes concernées sont signalées (non annulées). Le supprimer : les nuits redeviennent libres. | |
| C11 | Laisser une demande à moins de 12 h de son échéance, ouvrir la liste. | Amaëlle reçoit un e-mail d’alerte, une seule fois. | |
| C12 | Utiliser l’administration sur un téléphone. | Tout est utilisable au pouce, sans défilement horizontal de la page (le calendrier défile dans son cadre). | |

## D. E-mails

Lire chaque e-mail sur ordinateur **et** téléphone : objet, ton, orthographe, montants, dates, liens, pied de page.

| N° | E-mail | FR | EN | Notes |
| --- | --- | --- | --- | --- |
| D1 | Demande reçue | | | |
| D2 | Demande acceptée (acompte connu / sans montant) | | | |
| D3 | Réservation confirmée | | | |
| D4 | Demande refusée | | | |
| D5 | Réservation annulée | | | |
| D6 | Nouvelle demande (pour Amaëlle) | — | — | |
| D7 | Demande bientôt expirée (pour Amaëlle) | — | — | |

Cas particuliers : nom avec un accent ou une apostrophe ; message de la cliente avec des retours à la ligne ;
adresse e-mail en majuscules. Le journal d’une demande indique chaque envoi (`E-mail envoyé`), sans adresse.

## E. Sécurité et données personnelles

| N° | Contrôle | Résultat attendu | OK / KO |
| --- | --- | --- | --- |
| E1 | Saisir `<b>test</b>` comme nom et message. | Affiché tel quel (texte) dans l’administration et dans l’e-mail, jamais interprété. | |
| E2 | Envoyer sans cocher le consentement. | Refus clair, rien n’est enregistré. | |
| E3 | Vérifier une URL de l’administration et les journaux Cloudflare. | Aucune adresse e-mail, aucun nom dans les URL ni les journaux. | |
| E4 | Anti-robot : rejouer un envoi avec un jeton déjà utilisé. | Refus (« vérification échouée ») ; la page propose de recommencer. | |
| E5 | Contrôler `robots.txt` et l’en-tête de `/admin/`. | `/admin/` n’est pas indexable (`X-Robots-Tag: noindex`). | |

## F. Avant la mise en production (liste de reprise)

- [ ] Réponses d’Amaëlle reçues (`docs/todo-contenus.md` : prix des chambres, paddocks, draps, taxe, acompte, première nuit, enfants) et `src/data/reservation.yaml` mis à jour ; tests relancés.
- [ ] Base D1 de production créée, migrations `0001` à `0003` appliquées, `database_id` réel dans `wrangler.toml` (guide : `docs/deploiement.md`, étape 3).
- [ ] Secrets et variables définis (`docs/api.md`) : Turnstile (secret + `PUBLIC_TURNSTILE_SITE_KEY` à la construction), Access, e-mail, virement.
- [ ] `ENVIRONMENT` et `ACCESS_DEV_EMAIL` **non** définis en production.
- [ ] Application Access en place sur `/admin/*` et `/api/admin/*` (aperçus compris).
- [ ] Domaine d’expédition vérifié chez le service d’e-mail ; e-mails d’essai reçus.
- [ ] Mentions légales, confidentialité, conditions de réservation validées (étape 11), lien de confidentialité ajouté au formulaire.
- [ ] `npm run build && npm run deploiement:verifier -- --strict` : aucun point bloquant.
- [ ] `npm run deploiement:smoke -- <adresse de prévisualisation>` : tous les contrôles réussis (administration fermée comprise).
- [ ] Procédure d’effacement des données essayée sur la prévisualisation (`docs/deploiement.md`, étape 13) ; durée de conservation décidée par Amaëlle.
- [ ] Ce document déroulé en entier sur la prévisualisation, tous les `OK`.
