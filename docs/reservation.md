# Module de réservation — cahier des charges de la version 1

Version du 16 novembre 2026. À construire sur mesure dans ce dépôt (voir `docs/etapes.md`,
étapes 7 à 10). Les valeurs marquées `TODO(amaelle)` sont des paramètres à obtenir : le code doit
les lire depuis la configuration, jamais les coder en dur.

## 1. Objectif et périmètre

Permettre à une cliente de voir les disponibilités, de composer son séjour (hébergement,
cheval, repas), d'obtenir un devis immédiat et d'envoyer une **pré-réservation** qu'Amaëlle
accepte ou refuse en un clic. L'acompte est payé par virement et marqué reçu à la main.

Dans la version 1 :
- calendrier des disponibilités par chambre, par lit en dortoir et par paddock ;
- devis calculé automatiquement ;
- pré-réservation avec blocage provisoire des dates ;
- administration pour Amaëlle : demandes, calendrier, blocages de dates ;
- e-mails automatiques à la cliente et à Amaëlle.

Hors version 1 (prévu ensuite, à ne pas construire maintenant) :
- v2 : acompte payé en ligne par Stripe à l'acceptation ;
- v3 : synchronisation iCal avec Airbnb, Booking ou Gîtes de France ;
- réservation des balades (phase 2 du site).

## 2. Architecture

- Site Astro statique (inchangé) + **Cloudflare Pages Functions** pour l'API (`functions/api/…`).
- Base de données **Cloudflare D1** (SQLite). Migrations versionnées dans `migrations/`.
- Anti-spam : **Cloudflare Turnstile** sur le formulaire public.
- Administration sous `/admin/`, protégée par **Cloudflare Access** (connexion par e-mail
  d'Amaëlle et de Vivien). Aucun mot de passe géré par le code.
- E-mails : service transactionnel avec offre gratuite (Brevo ou Resend), clé en secret
  Cloudflare. Expéditeur : adresse sur le domaine chambalade.fr, TODO(amaelle).
- Paramètres métier (unités, capacités, prix, règles) dans `src/data/reservation.yaml`,
  lus au build et exposés aux fonctions. Ce fichier est la seule source des prix.
- Fuseau horaire : Europe/Paris. Une réservation porte sur des **nuits** : date d'arrivée
  incluse, date de départ exclue.

## 3. Unités réservables

| Unité | Type | Capacité | Règle d'occupation |
| --- | --- | --- | --- |
| Chambre salle de bain privée | chambre | 2 personnes, 1 lit double | une seule réservation par nuit |
| Chambre 2 | chambre | 2 personnes, 1 lit double | une seule réservation par nuit |
| Chambre 3 | chambre | 2 personnes, 1 lit double | une seule réservation par nuit |
| Dortoir | dortoir | 6 lits | vendu au lit ; somme des lits réservés ≤ 6 par nuit. Privatisation entière : TODO(amaelle) |
| Paddocks | paddock | TODO(amaelle) chevaux | somme des chevaux ≤ capacité par nuit |

Contraintes de séjour (paramètres) :
- première nuit réservable : TODO(amaelle) (ouverture au printemps 2027) ;
- durée minimale : TODO(amaelle) (par défaut 1 nuit) ; durée maximale : 14 nuits par défaut ;
- réservation au plus tard J-1, au plus tôt 12 mois à l'avance ;
- un cheval implique au moins une personne hébergée ;
- jours ou périodes de fermeture : gérés par les blocages (section 6).

## 4. Calcul du devis

Lignes du devis, toutes lues dans `reservation.yaml` :

| Ligne | Règle | Valeur actuelle |
| --- | --- | --- |
| Chambre | par nuit, TODO(amaelle) : par chambre ou par personne | 75 € (sanitaires partagés), 80 € (salle de bain privée) |
| Lit en dortoir | par lit et par nuit | 35 € |
| Draps (dortoir) | TODO(amaelle) : par lit et par séjour, ou par nuit | 5 € |
| Petit-déjeuner | inclus dans l'hébergement | 0 € |
| Dîner | par personne et par soir choisi | 20 € |
| Pique-nique ou déjeuner | par personne et par jour choisi | 15 € |
| Cheval en paddock, foin compris | par cheval et par nuit | 10 € |
| Forfait cavalier | TODO(amaelle) : contenu exact. Désactivé dans le devis tant qu'il n'est pas défini | 70 € |
| Taxe de séjour | par adulte et par nuit | TODO(amaelle) |
| Acompte | pourcentage du total | TODO(amaelle) (proposition : 30 %) |

Règles :
- Tous les montants en centimes dans le code, arrondis à l'affichage.
- Le devis affiché porte la mention « Devis indicatif, confirmé par Chambalade à l'acceptation ».
- Le devis est recalculé côté serveur à l'enregistrement : le montant envoyé par le navigateur
  n'est jamais pris en compte.
- Le devis enregistré avec la demande ne change plus, même si les prix changent ensuite.

## 5. Statuts d'une demande

| Statut | Signification | Bloque les dates ? |
| --- | --- | --- |
| `en_attente` | demande envoyée, pas encore traitée | oui, pendant 48 h (paramètre) |
| `acceptee` | acceptée, acompte attendu | oui, pendant 7 jours (paramètre) |
| `confirmee` | acompte reçu | oui |
| `refusee` | refusée par Amaëlle | non |
| `annulee` | annulée après acceptation ou confirmation | non |
| `expiree` | délai dépassé sans action | non |

L'expiration se calcule à la lecture (pas de tâche planifiée) : une demande `en_attente` ou
`acceptee` dont le délai est dépassé est traitée comme `expiree` et son statut est mis à jour
au passage. Amaëlle peut prolonger un délai depuis l'administration.

## 6. Modèle de données (D1)

- `demandes` : id, reference (`CHB-2027-0001`), statut, date_arrivee, date_depart, nb_adultes,
  nb_enfants, nb_chevaux, choix (JSON : unités, repas par jour), devis (JSON figé, total en
  centimes, acompte en centimes), langue (fr/en), nom, prenom, email, telephone, message,
  consentement_at, created_at, updated_at, expire_at.
- `occupations` : demande_id, unite, nuit (date), quantite. Une ligne par unité et par nuit ;
  sert au calcul des disponibilités.
- `blocages` : id, unite (ou `toutes`), date_debut, date_fin, motif (fermeture, travaux,
  réservation extérieure, autre), note, created_at.
- `journal` : id, demande_id, action, auteur, detail, created_at.

Disponibilité d'une unité pour une nuit = capacité − occupations actives − blocages.
L'enregistrement d'une demande vérifie la disponibilité et insère les occupations **dans une
même transaction** (batch D1) : deux demandes simultanées ne peuvent pas prendre la même place.

## 7. Parcours de la cliente (`/reserver/` et `/en/book/`)

1. Choisir les dates sur un calendrier qui grise les nuits complètes pour le type d'hébergement
   choisi.
2. Indiquer le nombre de personnes et de chevaux, choisir l'hébergement (chambre(s), lits en
   dortoir), cocher les repas.
3. Voir le devis se mettre à jour en direct.
4. Saisir nom, prénom, e-mail, téléphone, message ; cocher le consentement ; valider Turnstile.
5. Bouton « Envoyer ma demande de réservation ». Écran de confirmation avec la référence,
   le récapitulatif et ce qui se passe ensuite (réponse sous 48 h).

Accessible au clavier, utilisable sur mobile, en français et en anglais. Messages d'erreur
précis (« Le dortoir n'a plus que 2 lits libres la nuit du 12 mai »).

## 8. Administration (`/admin/`, français uniquement)

- **Demandes** : liste filtrable par statut et par date ; les demandes en attente en premier,
  avec le temps restant avant expiration.
- **Fiche demande** : récapitulatif, devis, coordonnées, journal. Actions : Accepter (avec
  message facultatif), Refuser (avec message), Marquer l'acompte reçu, Annuler, Prolonger
  le délai.
- **Calendrier** : vue mensuelle, une ligne par unité, occupation par nuit et par statut
  (couleurs + légende, pas seulement la couleur).
- **Blocages** : créer et supprimer un blocage de dates pour une unité ou pour tout le gîte.
- Interface simple, utilisable sur téléphone : Amaëlle traitera souvent les demandes depuis
  l'écurie.

## 9. E-mails

Modèles en français et en anglais (langue de la demande), dans `src/emails/` :
- à la cliente : demande reçue (pas une confirmation) ; demande acceptée avec montant de
  l'acompte, coordonnées bancaires TODO(amaelle) et date limite ; réservation confirmée ;
  demande refusée ; réservation annulée ;
- à Amaëlle : nouvelle demande, avec lien direct vers la fiche ; demande bientôt expirée
  (envoyé au moment où elle consulte l'administration, pas de tâche planifiée).

## 10. Sécurité et RGPD

- Aucune donnée personnelle dans les URL ni dans les logs.
- Validation de toutes les entrées côté serveur (types, bornes, dates cohérentes).
- Limitation du nombre de demandes par adresse IP.
- Politique de confidentialité mise à jour : finalité, durée de conservation
  (TODO(amaelle), proposition : anonymisation 3 ans après le séjour), droits d'accès et
  de suppression, sous-traitants (Cloudflare, service d'e-mail).
- Pas de paiement en ligne en version 1 : pas de données bancaires stockées.

## 11. Tests et critères d'acceptation

- Tests unitaires (Vitest) pour le calcul du devis et des disponibilités, y compris : dortoir
  presque plein, chevaux au-delà de la capacité, séjour à cheval sur un blocage, deux demandes
  concurrentes sur la dernière place, expiration d'une demande.
- Environnement local avec D1 local (`wrangler pages dev`) et données de démonstration.
- Recette manuelle documentée dans `docs/recette-reservation.md` avant la mise en production.

## 12. Questions pour Amaëlle (à régler avant la mise en production)

1. Prix des chambres : par chambre ou par personne ? Prix pour une personne seule ?
2. Dortoir : vendu uniquement au lit, ou privatisable en entier ? À quel prix ?
3. Draps : 5 € par lit et par séjour, ou par nuit ?
4. Nombre de chevaux accueillis en paddock en même temps.
5. Contenu exact du forfait cavalier, et s'il vaut en chambre ou seulement en dortoir.
6. Taxe de séjour par adulte et par nuit.
7. Pourcentage d'acompte, délai de paiement, conditions d'annulation et de remboursement.
8. Date d'ouverture, périodes de fermeture, durée minimale de séjour.
9. Coordonnées bancaires à communiquer pour l'acompte, et adresse e-mail d'expédition.
10. Enfants : acceptés ? tarif ?
