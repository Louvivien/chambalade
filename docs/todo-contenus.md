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
| `docs/api.md:91` | \| `EMAIL_FROM` \| variable Cloudflare \| Expéditeur, par ex. `Chambalade <reservation@chambalade.fr>` ; le domaine doit être vérifié chez Resend. TODO(amaelle) : adresse d’expédition. \| |
| `docs/audit.md:21` | \| Contenus manquants \| `git grep -n "TODO(amaelle)"` \| chaque occurrence listée dans `docs/todo-contenus.md`, et inversement \| |
| `docs/audit.md:29` | `docs/brief.md` ou `src/data/reservation.yaml`. Sinon : `TODO(amaelle)`, jamais une invention. |
| `docs/audit.md:71` | - [ ] Liste finale des `TODO(amaelle)` restants, classés : bloquant / non bloquant. |
| `docs/audit.md:87` | Nouveaux TODO(amaelle) : … |
| `docs/avancement.md:14` | prix en €. `/admin/` reste en français (usage d’Amaëlle seule). Les `TODO(amaelle)` sont repris |
| `docs/avancement.md:54` | manque est `TODO(amaelle)` visible. Les textes décrivent ce que le site fait réellement |
| `docs/avancement.md:84` | dans un objet ou un en-tête d’e-mail. Informations inconnues = `TODO(amaelle)` visibles. |
| `docs/avancement.md:148` | navigateur : tout passe par l’API de l’étape 8. Informations inconnues = `TODO(amaelle)` |
| `docs/avancement.md:153` | l’accueil, du gîte et du lieu raccordés, `.env.example`, `TODO(amaelle)`. |
| `docs/avancement.md:237` | inventaire des `TODO(amaelle)`, rapport dans `docs/journal-audit.md`, PR. |
| `docs/avancement.md:254` | Principe sur les inconnues : toute valeur `TODO(amaelle)` reste `null` dans le YAML. La |
| `docs/avancement.md:283` | des `TODO(amaelle)`, rapport dans `docs/journal-audit.md`, PR. |
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
| `docs/journal-audit.md:26` | étape 9) · liens : 234 références internes, 0 cassée · inventaire des `TODO(amaelle)` à jour (142 lignes) · |
| `docs/journal-audit.md:36` | durée de conservation sont donc à faire à la main dans la base ; le texte le dit en `TODO(amaelle)`. À traiter avant |
| `docs/journal-audit.md:41` | Nouveaux TODO(amaelle) : exploitante, statut, SIRET, responsable de publication, adresse de l’hébergeur, médiateur, crédits photo, |
| `docs/journal-audit.md:73` | et inventaire des `TODO(amaelle)` à jour · secrets : aucune valeur réelle. |
| `docs/journal-audit.md:127` | Nouveaux TODO(amaelle) : valider les textes de l’administration ; relire le ton des e-mails |
| `docs/journal-audit.md:156` | 0 indication · liens : 181 références internes, 0 cassée · inventaire des `TODO(amaelle)` à jour · |
| `docs/journal-audit.md:221` | Nouveaux TODO(amaelle) : valider les textes de la page ; confirmer la réponse sous 48 h et le |
| `docs/journal-audit.md:249` | 0 cassée · inventaire des `TODO(amaelle)` à jour (95 lignes) · configuration des fonctions |
| `docs/journal-audit.md:296` | Nouveaux TODO(amaelle) : aucun. À vérifier par Vivien : les décisions ci-dessus, en particulier |
| `docs/journal-audit.md:305` | blocage (48 h, 7 jours), règles de devis. Toute valeur `TODO(amaelle)` reste `null`. |
| `docs/journal-audit.md:318` | 0 cassée · inventaire des `TODO(amaelle)` à jour (92 lignes) · secrets : aucune valeur réelle · |
| `docs/journal-audit.md:347` | Nouveaux TODO(amaelle) : aucun nouveau sujet ; les unités et règles inconnues sont |
| `docs/journal-audit.md:373` | inventaire des `TODO(amaelle)` à jour (75 lignes) · secrets : aucune valeur réelle |
| `docs/journal-audit.md:395` | Nouveaux TODO(amaelle) (6, déjà dans `docs/todo-contenus.md`) : validation des textes ; |
| `docs/journal-audit.md:439` | Nouveaux TODO(amaelle) : aucun point métier ajouté. |
| `docs/journal-audit.md:517` | Nouveaux TODO(amaelle) : validation des dix lignes tarifaires, bases de calcul des |
| `docs/journal-audit.md:590` | Nouveaux TODO(amaelle) : quatre notes dans le contenu — validation des textes, |
| `docs/journal-audit.md:662` | Nouveaux TODO(amaelle) : marqueurs FR/EN de contact et logo dans |
| `docs/journal-audit.md:699` | Nouveaux TODO(amaelle) : aucun ; inventaire des points existants créé. |
| `docs/journal-audit.md:732` | Nouveaux TODO(amaelle) : aucun ; les inconnues métier restent dans les sources. |
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
| `src/content.config.ts:93` | group: z.object({ legend: z.string(), adults: z.string(), children: z.string(), childrenHint: z.string().startsWith('TODO(amaelle)'), horses: z.string(), horsesHint: z.string().startsWith('TODO(amaelle)') }), |
| `src/content.config.ts:133` | messageLabel: texte, messageHint: texte, depositLabel: texte, depositHint: texte.startsWith('TODO(amaelle)'), extendLabel: texte, extendOptions: dico, confirm: texte, working: texte, depositInvalid: texte, done: texte, email: dico, journalActions: dico, journalBy: dico, |
| `src/content/accueil/en.md:58` | <!-- TODO(amaelle): validate the proposed home page texts, taken from the brief. --> |
| `src/content/accueil/en.md:59` | <!-- TODO(amaelle): provide a phone number and email address to reach Chambalade outside the booking form. --> |
| `src/content/accueil/en.md:60` | <!-- TODO(amaelle): confirm the distances from Lyon, Grenoble and Valence; no travel time is published until then. --> |
| `src/content/accueil/en.md:61` | <!-- TODO(amaelle): confirm what "paddock and hay included" covers; the horse rate is separate from the guest accommodation in the brief. --> |
| `src/content/accueil/fr.md:58` | <!-- TODO(amaelle): valider les textes proposés de l’accueil, issus du brief. --> |
| `src/content/accueil/fr.md:59` | <!-- TODO(amaelle): fournir téléphone et e-mail de contact pour joindre Chambalade en dehors du formulaire de réservation. --> |
| `src/content/accueil/fr.md:60` | <!-- TODO(amaelle): confirmer les distances depuis Lyon, Grenoble et Valence ; aucune durée publiée en attendant. --> |
| `src/content/accueil/fr.md:61` | <!-- TODO(amaelle): confirmer la portée de « paddock et foin compris » ; le tarif cheval est distinct de l’hébergement humain dans le brief. --> |
| `src/content/admin/fr.md:126` | depositHint: 'TODO(amaelle): confirmer le pourcentage d’acompte. En attendant, saisissez le montant à la main ; vide, l’e-mail ne chiffre rien.' |
| `src/content/admin/fr.md:211` | <!-- TODO(amaelle): valider les textes de l’administration (vocabulaire, libellés des actions). --> |
| `src/content/gite/en.md:45` | pending: 'TODO(amaelle): validate the rate, breakfast included.' |
| `src/content/gite/en.md:48` | pending: 'TODO(amaelle): validate the rate and specify whether it applies per bed per stay, or per night.' |
| `src/content/gite/en.md:51` | pending: 'TODO(amaelle): validate the rate per night, breakfast included. Specify per room or per person, and the price for one person.' |
| `src/content/gite/en.md:54` | pending: 'TODO(amaelle): validate the rate per night, breakfast included. Specify per room or per person, and the price for one person.' |
| `src/content/gite/en.md:57` | pending: 'TODO(amaelle): confirm that it is included in all accommodation.' |
| `src/content/gite/en.md:60` | pending: 'TODO(amaelle): validate the meal rate.' |
| `src/content/gite/en.md:63` | pending: 'TODO(amaelle): validate the meal rate.' |
| `src/content/gite/en.md:66` | pending: 'TODO(amaelle): validate the rate for the horse’s accommodation, separate from the rider’s bed.' |
| `src/content/gite/en.md:69` | pending: 'TODO(amaelle): validate the rate and define what is included. This package will not be offered for booking until its content is defined.' |
| `src/content/gite/en.md:72` | pending: 'TODO(amaelle): provide the applicable amount. It is not yet included in the rates shown.' |
| `src/content/gite/en.md:86` | pending: 'TODO(amaelle): specify arrival and departure times and the exact opening date.' |
| `src/content/gite/en.md:88` | pending: 'TODO(amaelle): provide directions and arrival arrangements for a vehicle carrying a horse.' |
| `src/content/gite/en.md:90` | pending: 'TODO(amaelle): specify the linen provided in the rooms and the arrangements for the dormitory.' |
| `src/content/gite/en.md:92` | pending: 'TODO(amaelle): specify the conditions for bringing pets.' |
| `src/content/gite/en.md:94` | pending: 'TODO(amaelle): specify the documents to show as proof of up-to-date vaccinations.' |
| `src/content/gite/en.md:96` | pending: 'TODO(amaelle): confirm the deposit amount, its payment deadline and the cancellation conditions. The deposit is paid by bank transfer.' |
| `src/content/gite/en.md:103` | <!-- TODO(amaelle): validate the guesthouse page texts and provide photos of the rooms, the dormitory and the shared areas after renovation. --> |
| `src/content/gite/en.md:104` | <!-- TODO(amaelle): confirm that the "Chez Amaëlle" sign visible on the gate is consistent with the Chambalade brand. --> |
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
| `src/content/legal/en/conditions.md:20` | - 'TODO(amaelle): deposit amount or percentage, and the bank details given with the acceptance email.' |
| `src/content/legal/en/conditions.md:26` | - 'TODO(amaelle): specify whether the tourist tax is added to the rates, its amount and exemptions.' |
| `src/content/legal/en/conditions.md:27` | - 'TODO(amaelle): specify the balance to pay, the date and the payment method.' |
| `src/content/legal/en/conditions.md:31` | - 'TODO(amaelle): arrival and departure times.' |
| `src/content/legal/en/conditions.md:32` | - 'TODO(amaelle): whether linen is provided, whether pets are allowed, the number of children and minimum age.' |
| `src/content/legal/en/conditions.md:37` | - 'TODO(amaelle): documents to show on arrival, the rider’s liability and insurance for their horse, paddock rules.' |
| `src/content/legal/en/conditions.md:41` | - 'TODO(amaelle): conditions for changes and cancellation by the guest, what happens to the deposit, and cancellation by Chambalade (for example in case of an unforeseen event).' |
| `src/content/legal/en/conditions.md:42` | - 'TODO(amaelle): have a professional validate the statement on the right of withdrawal, which in principle does not apply to accommodation for a specific date.' |
| `src/content/legal/en/confidentialite.md:15` | - 'TODO(amaelle): email address for exercising your rights.' |
| `src/content/legal/en/confidentialite.md:33` | - 'TODO(amaelle): have the legal basis validated. Proposal: pre-contractual steps taken at your request, together with the box you tick before sending the form.' |
| `src/content/legal/en/confidentialite.md:37` | - 'TODO(amaelle): confirm the retention period. Proposal from docs/reservation.md: deletion or anonymisation of requests 3 years after the stay, or 3 years after the request if it did not go through.' |
| `src/content/legal/en/confidentialite.md:38` | - 'TODO(amaelle): the website does not yet delete requests automatically. Plan the procedure (deletion on request, periodic purge) before opening.' |
| `src/content/legal/en/confidentialite.md:45` | - 'an email-sending service (Resend, provisional choice), to write to you and to notify Amaëlle. TODO(amaelle): confirm the provider chosen.' |
| `src/content/legal/en/confidentialite.md:47` | - 'TODO(amaelle): check whether these providers process data outside the European Union and state the safeguards that apply.' |
| `src/content/legal/en/confidentialite.md:56` | - 'Visits will be measured with Cloudflare Web Analytics, which sets no cookie and does not identify visitors. TODO(amaelle): this service is not yet active; confirm this paragraph when it is switched on, as well as the absence of a cookie from the anti-robot check.' |
| `src/content/legal/en/mentions.md:26` | - 'TODO(amaelle): full address of the host, to be taken from its website before publication.' |
| `src/content/legal/en/mentions.md:31` | - 'TODO(amaelle): confirm where the photographs come from and state the photo credits to display.' |
| `src/content/legal/en/mentions.md:44` | - 'TODO(amaelle): state the consumer mediator you can turn to in case of a dispute, with their contact details.' |
| `src/content/legal/fr/conditions.md:20` | - 'TODO(amaelle): montant ou pourcentage de l’acompte, et coordonnées bancaires communiquées avec l’e-mail d’acceptation.' |
| `src/content/legal/fr/conditions.md:26` | - 'TODO(amaelle): préciser si la taxe de séjour s’ajoute aux tarifs, son montant et ses exemptions.' |
| `src/content/legal/fr/conditions.md:27` | - 'TODO(amaelle): préciser le solde à régler, la date et le moyen de paiement.' |
| `src/content/legal/fr/conditions.md:31` | - 'TODO(amaelle): horaires d’arrivée et de départ.' |
| `src/content/legal/fr/conditions.md:32` | - 'TODO(amaelle): linge fourni ou non, animaux de compagnie admis ou non, nombre d’enfants et âge minimal.' |
| `src/content/legal/fr/conditions.md:37` | - 'TODO(amaelle): documents à présenter à l’arrivée, responsabilité et assurance du cavalier pour son cheval, règles de vie au paddock.' |
| `src/content/legal/fr/conditions.md:41` | - 'TODO(amaelle): conditions d’annulation et de modification par la cliente, sort de l’acompte, et annulation par Chambalade (par exemple en cas d’imprévu).' |
| `src/content/legal/fr/conditions.md:42` | - 'TODO(amaelle): faire valider par un professionnel la mention sur le droit de rétractation, qui ne s’applique en principe pas à un hébergement à date déterminée.' |
| `src/content/legal/fr/confidentialite.md:15` | - 'TODO(amaelle): adresse e-mail à laquelle exercer vos droits.' |
| `src/content/legal/fr/confidentialite.md:33` | - 'TODO(amaelle): faire valider la base légale. Proposition : les mesures précontractuelles prises à votre demande, complétées par la case que vous cochez avant d’envoyer le formulaire.' |
| `src/content/legal/fr/confidentialite.md:37` | - 'TODO(amaelle): confirmer la durée de conservation. Proposition de docs/reservation.md : suppression ou anonymisation des demandes 3 ans après le séjour, ou 3 ans après la demande si elle n’a pas abouti.' |
| `src/content/legal/fr/confidentialite.md:38` | - 'TODO(amaelle): le site ne supprime pas encore les demandes automatiquement. Prévoir la procédure (suppression à la demande, purge périodique) avant l’ouverture.' |
| `src/content/legal/fr/confidentialite.md:45` | - 'un service d’envoi d’e-mails (Resend, choix provisoire), pour vous écrire et pour prévenir Amaëlle. TODO(amaelle): confirmer le prestataire retenu.' |
| `src/content/legal/fr/confidentialite.md:47` | - 'TODO(amaelle): vérifier si ces prestataires traitent des données hors de l’Union européenne et indiquer les garanties applicables.' |
| `src/content/legal/fr/confidentialite.md:56` | - 'La fréquentation sera mesurée avec Cloudflare Web Analytics, qui ne dépose pas de cookie et n’identifie pas les visiteurs. TODO(amaelle): ce service n’est pas encore activé ; confirmer ce paragraphe à l’activation, ainsi que l’absence de cookie de la vérification anti-robot.' |
| `src/content/legal/fr/mentions.md:26` | - 'TODO(amaelle): adresse complète de l’hébergeur, à reprendre de son site avant publication.' |
| `src/content/legal/fr/mentions.md:31` | - 'TODO(amaelle): confirmer l’origine des photographies et indiquer les crédits photographiques à afficher.' |
| `src/content/legal/fr/mentions.md:44` | - 'TODO(amaelle): indiquer le médiateur de la consommation auquel vous pouvez recourir en cas de litige, avec ses coordonnées.' |
| `src/content/lieu/en.md:96` | <!-- TODO(amaelle): validate the proposed texts of The place page. --> |
| `src/content/lieu/en.md:97` | <!-- TODO(amaelle): specify the conditions for using the arena and the varied-terrain course, and for hosting horses in the paddocks. --> |
| `src/content/lieu/en.md:98` | <!-- TODO(amaelle): provide the portraits of Quinoa, Guiness and Saphir and the horse descriptions; no breed, personality or ridden service is invented. --> |
| `src/content/lieu/en.md:99` | <!-- TODO(amaelle): confirm the distance and horseback access to the Roybon waterfall, and provide recommended routes around Dionay. --> |
| `src/content/lieu/en.md:100` | <!-- TODO(amaelle): confirm distances and journey times from Lyon, Grenoble and Valence. --> |
| `src/content/lieu/en.md:101` | <!-- TODO(amaelle): provide directions for arriving by car, van and lorry, and the parking arrangements. --> |
| `src/content/lieu/fr.md:96` | <!-- TODO(amaelle): valider les textes proposés de la page Le lieu. --> |
| `src/content/lieu/fr.md:97` | <!-- TODO(amaelle): préciser les conditions d’utilisation de la carrière et du PTV, et les conditions d’accueil dans les paddocks. --> |
| `src/content/lieu/fr.md:98` | <!-- TODO(amaelle): fournir les portraits de Quinoa, Guiness et Saphir et les présentations des chevaux ; aucune race, personnalité ou prestation montée n’est inventée. --> |
| `src/content/lieu/fr.md:99` | <!-- TODO(amaelle): confirmer la distance et l’accès à cheval pour la cascade de Roybon, et fournir les itinéraires conseillés autour de Dionay. --> |
| `src/content/lieu/fr.md:100` | <!-- TODO(amaelle): confirmer les distances et temps de trajet depuis Lyon, Grenoble et Valence. --> |
| `src/content/lieu/fr.md:101` | <!-- TODO(amaelle): fournir les indications d’arrivée en voiture, van et camion, ainsi que les modalités de stationnement. --> |
| `src/content/reserver/en.md:10` | contact: 'TODO(amaelle): provide the contact phone number and email address.' |
| `src/content/reserver/en.md:48` | childrenHint: 'TODO(amaelle): specify whether children are welcome and at what rate.' |
| `src/content/reserver/en.md:50` | horsesHint: 'TODO(amaelle): specify how many horses can be hosted at the same time. While unknown, requests with a horse cannot be sent.' |
| `src/content/reserver/en.md:162` | <!-- TODO(amaelle): validate the proposed texts of the Book page. --> |
| `src/content/reserver/en.md:163` | <!-- TODO(amaelle): confirm that a reply within 48 hours and the temporary hold on the dates are acceptable. --> |
| `src/content/reserver/fr.md:10` | contact: 'TODO(amaelle): fournir le téléphone et l’adresse e-mail de contact.' |
| `src/content/reserver/fr.md:48` | childrenHint: 'TODO(amaelle): préciser si les enfants sont accueillis et à quel tarif.' |
| `src/content/reserver/fr.md:50` | horsesHint: 'TODO(amaelle): préciser le nombre de chevaux accueillis en même temps. Tant qu’il est inconnu, les demandes avec un cheval ne peuvent pas être envoyées.' |
| `src/content/reserver/fr.md:131` | <!-- TODO(amaelle): valider les textes proposés de la page Réserver. --> |
| `src/content/reserver/fr.md:132` | <!-- TODO(amaelle): confirmer que la réponse sous 48 h et le blocage provisoire des dates conviennent. --> |
| `src/data/emails.yaml:4` | # Ces textes sont des propositions à faire valider : TODO(amaelle) relire le ton et les formulations. |
| `src/data/legal.yaml:4` | nom: null # TODO(amaelle): nom et prénom de l’exploitante, ou raison sociale. |
| `src/data/legal.yaml:5` | statut: null # TODO(amaelle): forme juridique (entreprise individuelle en cours de création d’après docs/brief.md). |
| `src/data/legal.yaml:6` | siret: null # TODO(amaelle): numéro SIRET, dès l’immatriculation de l’entreprise individuelle. |
| `src/data/legal.yaml:7` | publication: null # TODO(amaelle): nom du ou de la responsable de la publication. |
| `src/data/legal.yaml:10` | adresse: null # TODO(amaelle): adresse du siège de l’hébergeur, à vérifier sur son site avant publication. |
| `src/data/legal.yaml:12` | nom: null # TODO(amaelle): médiateur de la consommation choisi (obligatoire pour un professionnel qui vend à des consommateurs). |
| `src/data/legal.yaml:15` | # tous les TODO(amaelle) des trois pages levés. L’étape 13 (SEO) doit le vérifier. |
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
| `src/lib/legal.ts:28` | export const estAConfirmer = (texte: string) => texte.includes('TODO(amaelle)'); |
| `tests/legal/legal.test.ts:35` | it('repère les points à confirmer', () => { expect(estAConfirmer('TODO(amaelle): x')).toBe(true); expect(estAConfirmer('ok')).toBe(false); }); |
| `tests/legal/legal.test.ts:52` | const sansMarqueur = t.replaceAll('TODO(amaelle):', '').replace(/https:\/\/\S+/g, '').replace(/\]\(\/[^)]*\)/g, ']'); |
