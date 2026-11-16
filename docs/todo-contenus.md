# Informations et validations en attente

Inventaire des occurrences du marqueur éditorial dans les fichiers suivis par Git,
y compris les consignes et les fichiers de contenu. Ce fichier généré est
exclu de sa propre collecte pour éviter les doublons récursifs. Les occurrences
dans les consignes sont des exemples, pas des informations métier à demander.

Régénération : `npm run audit:todos -- --write` après ajout des nouveaux fichiers
à l'index Git. Vérification : `npm run audit:todos`.

Les points métier restent à confirmer par Amaëlle avant publication : coordonnées,
logo, origine de la projection, tarifs et règles de réservation, équipements et
conditions pratiques, identité légale. Les sources ci-dessous font autorité.

| Source | Occurrence exacte |
| --- | --- |
| `AGENTS.md:85` | Une information absente de `docs/brief.md` devient un `TODO(amaelle): …` visible dans le |
| `AGENTS.md:128` | `TODO(amaelle)`, ce qu'il faut vérifier visuellement). |
| `docs/audit.md:21` | \| Contenus manquants \| `git grep -n "TODO(amaelle)"` \| chaque occurrence listée dans `docs/todo-contenus.md`, et inversement \| |
| `docs/audit.md:29` | `docs/brief.md` ou `src/data/reservation.yaml`. Sinon : `TODO(amaelle)`, jamais une invention. |
| `docs/audit.md:71` | - [ ] Liste finale des `TODO(amaelle)` restants, classés : bloquant / non bloquant. |
| `docs/audit.md:87` | Nouveaux TODO(amaelle) : … |
| `docs/avancement.md:16` | Principe sur les inconnues : toute valeur `TODO(amaelle)` reste `null` dans le YAML. La |
| `docs/avancement.md:45` | des `TODO(amaelle)`, rapport dans `docs/journal-audit.md`, PR. |
| `docs/brief.md:5` | pas définitifs : les mettre en ligne avec un `TODO(amaelle)`. |
| `docs/brief.md:22` | - Téléphone : TODO(amaelle). E-mail de contact : TODO(amaelle). |
| `docs/brief.md:53` | TODO(amaelle) (environ 1 h, à vérifier). |
| `docs/brief.md:78` | \| Chambre double, sanitaires partagés \| 75 € par nuit \| TODO(amaelle) : par chambre ou par personne ? petit-déjeuner compris \| |
| `docs/brief.md:84` | \| Forfait cavalier \| 70 € \| TODO(amaelle) : contenu exact (nuit, dîner, petit-déjeuner, cheval, draps, pique-nique ?) \| |
| `docs/brief.md:86` | Taxe de séjour : TODO(amaelle). |
| `docs/brief.md:91` | accès en voiture et en van : `TODO(amaelle)`. |
| `docs/etapes.md:31` | > restent visibles avec TODO(amaelle) et sont listées dans docs/todo-contenus.md. |
| `docs/etapes.md:38` | > avec les TODO(amaelle)), les migrations D1, et une bibliothèque pure (sans accès réseau) qui |
| `docs/initialisation.md:50` | des routes de contrôle séparées via `npm run dev:audit`. Aucun nouveau `TODO(amaelle)` à cette étape ; les |
| `docs/journal-audit.md:9` | blocage (48 h, 7 jours), règles de devis. Toute valeur `TODO(amaelle)` reste `null`. |
| `docs/journal-audit.md:22` | 0 cassée · inventaire des `TODO(amaelle)` à jour (89 lignes) · secrets : aucune valeur réelle · |
| `docs/journal-audit.md:51` | Nouveaux TODO(amaelle) : aucun nouveau sujet ; les unités et règles inconnues sont |
| `docs/journal-audit.md:77` | inventaire des `TODO(amaelle)` à jour (75 lignes) · secrets : aucune valeur réelle |
| `docs/journal-audit.md:99` | Nouveaux TODO(amaelle) (6, déjà dans `docs/todo-contenus.md`) : validation des textes ; |
| `docs/journal-audit.md:143` | Nouveaux TODO(amaelle) : aucun point métier ajouté. |
| `docs/journal-audit.md:221` | Nouveaux TODO(amaelle) : validation des dix lignes tarifaires, bases de calcul des |
| `docs/journal-audit.md:294` | Nouveaux TODO(amaelle) : quatre notes dans le contenu — validation des textes, |
| `docs/journal-audit.md:366` | Nouveaux TODO(amaelle) : marqueurs FR/EN de contact et logo dans |
| `docs/journal-audit.md:403` | Nouveaux TODO(amaelle) : aucun ; inventaire des points existants créé. |
| `docs/journal-audit.md:436` | Nouveaux TODO(amaelle) : aucun ; les inconnues métier restent dans les sources. |
| `docs/photos.md:22` | \| cascade de Roybon.HEIC \| cascade-roybon.jpg \| Le lieu, les alentours \| Distance et accès à cheval : TODO(amaelle) \| Cascade de Roybon dans un sous-bois \| À utiliser \| |
| `docs/reservation.md:4` | étapes 7 à 10). Les valeurs marquées `TODO(amaelle)` sont des paramètres à obtenir : le code doit |
| `docs/reservation.md:33` | Cloudflare. Expéditeur : adresse sur le domaine chambalade.fr, TODO(amaelle). |
| `docs/reservation.md:46` | \| Dortoir \| dortoir \| 6 lits \| vendu au lit ; somme des lits réservés ≤ 6 par nuit. Privatisation entière : TODO(amaelle) \| |
| `docs/reservation.md:47` | \| Paddocks \| paddock \| TODO(amaelle) chevaux \| somme des chevaux ≤ capacité par nuit \| |
| `docs/reservation.md:50` | - première nuit réservable : TODO(amaelle) (ouverture au printemps 2027) ; |
| `docs/reservation.md:51` | - durée minimale : TODO(amaelle) (par défaut 1 nuit) ; durée maximale : 14 nuits par défaut ; |
| `docs/reservation.md:62` | \| Chambre \| par nuit, TODO(amaelle) : par chambre ou par personne \| 75 € (sanitaires partagés), 80 € (salle de bain privée) \| |
| `docs/reservation.md:64` | \| Draps (dortoir) \| TODO(amaelle) : par lit et par séjour, ou par nuit \| 5 € \| |
| `docs/reservation.md:69` | \| Forfait cavalier \| TODO(amaelle) : contenu exact. Désactivé dans le devis tant qu'il n'est pas défini \| 70 € \| |
| `docs/reservation.md:70` | \| Taxe de séjour \| par adulte et par nuit \| TODO(amaelle) \| |
| `docs/reservation.md:71` | \| Acompte \| pourcentage du total \| TODO(amaelle) (proposition : 30 %) \| |
| `docs/reservation.md:142` | l'acompte, coordonnées bancaires TODO(amaelle) et date limite ; réservation confirmée ; |
| `docs/reservation.md:153` | (TODO(amaelle), proposition : anonymisation 3 ans après le séjour), droits d'accès et |
| `src/content.config.ts:51` | items: z.record(z.enum(priceIds), z.object({ label: z.string(), pending: z.string().startsWith('TODO(amaelle)').optional() })), |
| `src/content/accueil/fr.md:58` | <!-- TODO(amaelle): valider les textes proposés de l’accueil, issus du brief. --> |
| `src/content/accueil/fr.md:59` | <!-- TODO(amaelle): fournir téléphone et e-mail pour rendre la demande de séjour possible avant le module de réservation. --> |
| `src/content/accueil/fr.md:60` | <!-- TODO(amaelle): confirmer les distances depuis Lyon, Grenoble et Valence ; aucune durée publiée en attendant. --> |
| `src/content/accueil/fr.md:61` | <!-- TODO(amaelle): confirmer la portée de « paddock et foin compris » ; le tarif cheval est distinct de l’hébergement humain dans le brief. --> |
| `src/content/gite/fr.md:45` | pending: 'TODO(amaelle) : valider le tarif, petit-déjeuner compris.' |
| `src/content/gite/fr.md:48` | pending: 'TODO(amaelle) : valider le tarif et préciser s’il s’applique par lit et par séjour, ou par nuit.' |
| `src/content/gite/fr.md:51` | pending: 'TODO(amaelle) : valider le tarif par nuit, petit-déjeuner compris. Préciser par chambre ou par personne, et le prix pour une personne seule.' |
| `src/content/gite/fr.md:54` | pending: 'TODO(amaelle) : valider le tarif par nuit, petit-déjeuner compris. Préciser par chambre ou par personne, et le prix pour une personne seule.' |
| `src/content/gite/fr.md:57` | pending: 'TODO(amaelle) : confirmer qu’il est compris dans tous les hébergements.' |
| `src/content/gite/fr.md:60` | pending: 'TODO(amaelle) : valider le tarif du repas.' |
| `src/content/gite/fr.md:63` | pending: 'TODO(amaelle) : valider le tarif du repas.' |
| `src/content/gite/fr.md:66` | pending: 'TODO(amaelle) : valider le tarif de l’hébergement du cheval, distinct du couchage du cavalier.' |
| `src/content/gite/fr.md:69` | pending: 'TODO(amaelle) : valider le tarif et définir les prestations comprises. Ce forfait ne sera pas proposé à la réservation tant que son contenu n’est pas défini.' |
| `src/content/gite/fr.md:72` | pending: 'TODO(amaelle) : fournir le montant applicable. Il n’est pas encore compris dans les tarifs présentés.' |
| `src/content/gite/fr.md:86` | pending: 'TODO(amaelle) : préciser les horaires d’arrivée et de départ ainsi que la date exacte d’ouverture.' |
| `src/content/gite/fr.md:88` | pending: 'TODO(amaelle) : fournir les indications d’accès et les modalités d’arrivée avec un véhicule transportant un cheval.' |
| `src/content/gite/fr.md:90` | pending: 'TODO(amaelle) : préciser le linge fourni dans les chambres et les modalités pour le dortoir.' |
| `src/content/gite/fr.md:92` | pending: 'TODO(amaelle) : préciser les conditions d’accueil des animaux de compagnie.' |
| `src/content/gite/fr.md:94` | pending: 'TODO(amaelle) : préciser les documents à présenter pour les vaccins à jour.' |
| `src/content/gite/fr.md:96` | pending: 'TODO(amaelle) : confirmer le montant de l’acompte, son délai de paiement et les conditions d’annulation. L’acompte sera réglé par virement.' |
| `src/content/gite/fr.md:103` | <!-- TODO(amaelle): valider les textes de la page du gîte et fournir les photos des chambres, du dortoir et des espaces communs après rénovation. --> |
| `src/content/gite/fr.md:104` | <!-- TODO(amaelle): confirmer la cohérence de l’inscription « Chez Amaëlle » visible sur le portail avec la marque Chambalade. --> |
| `src/content/interface/en.md:9` | contactPending: 'TODO(amaelle): provide the contact phone number and email address.' |
| `src/content/interface/en.md:10` | logoPending: 'TODO(amaelle): provide a transparent logo; temporary typographic name.' |
| `src/content/interface/fr.md:9` | contactPending: 'TODO(amaelle): fournir le téléphone et l’adresse e-mail de contact.' |
| `src/content/interface/fr.md:10` | logoPending: 'TODO(amaelle): fournir le logo transparent ; nom typographique provisoire.' |
| `src/content/lieu/fr.md:96` | <!-- TODO(amaelle): valider les textes proposés de la page Le lieu. --> |
| `src/content/lieu/fr.md:97` | <!-- TODO(amaelle): préciser les conditions d’utilisation de la carrière et du PTV, et les conditions d’accueil dans les paddocks. --> |
| `src/content/lieu/fr.md:98` | <!-- TODO(amaelle): fournir les portraits de Quinoa, Guiness et Saphir et les présentations des chevaux ; aucune race, personnalité ou prestation montée n’est inventée. --> |
| `src/content/lieu/fr.md:99` | <!-- TODO(amaelle): confirmer la distance et l’accès à cheval pour la cascade de Roybon, et fournir les itinéraires conseillés autour de Dionay. --> |
| `src/content/lieu/fr.md:100` | <!-- TODO(amaelle): confirmer les distances et temps de trajet depuis Lyon, Grenoble et Valence. --> |
| `src/content/lieu/fr.md:101` | <!-- TODO(amaelle): fournir les indications d’arrivée en voiture, van et camion, ainsi que les modalités de stationnement. --> |
| `src/data/reservation.yaml:3` | # Toute valeur TODO(amaelle) reste null : le code ne la remplace jamais par une valeur inventée. |
| `src/data/reservation.yaml:30` | privatisable: null # TODO(amaelle): le dortoir est-il privatisable en entier, et à quel prix ? |
| `src/data/reservation.yaml:34` | capacity_horses: null # TODO(amaelle): nombre de chevaux accueillis en même temps. |
| `src/data/reservation.yaml:38` | first_night: null # TODO(amaelle): première nuit réservable (ouverture au printemps 2027), AAAA-MM-JJ. |
| `src/data/reservation.yaml:39` | min_nights: 1 # TODO(amaelle): confirmer la durée minimale. |
| `src/data/reservation.yaml:51` | room_pricing: null # TODO(amaelle): per_room_night ou per_person_night. |
| `src/data/reservation.yaml:52` | sheets_pricing: null # TODO(amaelle): per_bed_stay ou per_bed_night. |
| `src/data/reservation.yaml:53` | rider_package_enabled: false # TODO(amaelle): contenu du forfait ; exclu du devis tant que false. |
| `src/data/reservation.yaml:54` | deposit_percent: null # TODO(amaelle): pourcentage d’acompte (proposition : 30). |
| `src/data/reservation.yaml:55` | children_accepted: null # TODO(amaelle): enfants acceptés ? tarif ? |
| `src/data/reservation.yaml:56` | # TODO(amaelle): valider l’ensemble des tarifs proposés avant publication. |
| `src/data/reservation.yaml:64` | unit: null # TODO(amaelle): par lit et par séjour ou par nuit ? |
| `src/data/reservation.yaml:68` | unit: null # TODO(amaelle): par chambre ou par personne et par nuit ; prix en occupation seule ? |
| `src/data/reservation.yaml:72` | unit: null # TODO(amaelle): par chambre ou par personne et par nuit ; prix en occupation seule ? |
| `src/data/reservation.yaml:92` | unit: null # TODO(amaelle): définir le contenu exact ; forfait exclu du futur devis tant qu’il reste indéfini. |
| `src/data/reservation.yaml:95` | amount_cents: null # TODO(amaelle): montant par adulte et par nuit ; ne pas assimiler une valeur absente à zéro. |
