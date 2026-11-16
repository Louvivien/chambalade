# Brief Chambalade — marque, contenus, tarifs

Version du 16 novembre 2026. Source : document de travail « Chambalade — Marque & structure
du site (phase 1) » et tableur de tarifs d'Amaëlle. Les éléments marqués « à valider » ne sont
pas définitifs : les mettre en ligne avec un `TODO(amaelle)`.

## Marque

- Nom : **Chambalade**, en un mot, partout. Jamais « Chamb'alade ».
- Signature sous le logo : « L'équitation de pleine nature en Chambarans ».
- Titre de la page d'accueil : « Venez avec votre cheval, repartez ressourcée ».
- Phrase de marque : Chambalade, c'est l'équitation de pleine nature en Chambarans, simple,
  amicale et rurale, où le bien-être du cheval passe en premier.
- Preuves à mettre en avant : 20 ha au cœur des Chambarans ; départ des balades depuis le gîte ;
  paddock et foin pour les chevaux ; encadrement diplômé (Sylvie : ATE et BPJEPS tourisme
  équestre) ; piscine ; repas maison sur réservation ; carrière éclairée ; parcours en terrain
  varié (PTV).

## Coordonnées

- Adresse : 2333 route de la Croix de Toutes Aures, 38940 Roybon, Isère.
- Téléphone : TODO(amaelle). E-mail de contact : TODO(amaelle).
- Instagram : @chambalade (compte à créer). Facebook : à créer.
- Référencement : [CDTE Isère](https://tourisme-equestre-ara.com/cdte/isere), lien en pied de page.

## Arborescence phase 1

| Page | FR | EN | Contenu |
| --- | --- | --- | --- |
| Accueil | `/` | `/en/` | Bandeau, Chambalade en quelques mots, trois activités, pourquoi venir, les Chambarans, appel à réserver |
| Le gîte | `/gite/` | `/en/guesthouse/` | Chambres et tarifs, votre cheval, repas, espaces communs, infos pratiques |
| Le lieu | `/le-lieu/` | `/en/the-place/` | Vue du ciel annotée, équipements (carrière, PTV, paddocks), les chevaux, les alentours, accès |
| Réserver | `/reserver/` | `/en/book/` | Module de pré-réservation (voir `docs/reservation.md`), coordonnées, carte |
| Légal | `/mentions-legales/`, `/confidentialite/` | `/en/legal/`, `/en/privacy/` | Brouillons à faire valider |

Phase 2 (ne pas construire maintenant) : `/balades/`, `/pension/`. Sur l'accueil, ces deux
activités apparaissent comme des blocs « Bientôt » qui renvoient vers le formulaire.

## Textes : page d'accueil (proposés, à valider par Amaëlle)

1. Bandeau : titre « Venez avec votre cheval, repartez ressourcée ». Sous-titre « Gîte équestre
   au cœur des Chambarans, à Roybon (Isère). Ouverture au printemps 2027. » Boutons
   « Découvrir le gîte » et « Demander un séjour ».
2. Chambalade en quelques mots : « Sur 20 hectares de prés et de bois, Chambalade vous accueille
   dans une ambiance simple, amicale et rurale. Ici, le bien-être du cheval passe en premier,
   et les chemins des Chambarans commencent au bout du paddock. » Photo : Amaëlle et Instinct.
3. Trois activités : Le gîte équestre (12 couchages, repas sur demande, piscine, paddock pour
   votre cheval) ; Les balades (encadrées par Sylvie, accompagnatrice diplômée, bientôt) ;
   La pension (prés avec abris, surveillance 24 h/24, bientôt).
4. Pourquoi venir : départ des balades depuis le gîte ; paddock et foin compris pour votre
   cheval ; repas maison sur réservation ; encadrement diplômé.
5. Les Chambarans : forêt, chemins, situation. Distances depuis Lyon, Grenoble et Valence :
   TODO(amaelle) (environ 1 h, à vérifier).
6. Appel final : « Demandez dès maintenant votre séjour pour le printemps 2027 ».
7. Pied de page : adresse, e-mail, téléphone, Instagram, CDTE Isère, mentions légales, confidentialité.

## Textes : page Le gîte

Accroche : « Un gîte équestre pensé pour les cavaliers et leurs chevaux, ouvert aussi aux
randonneurs à pied ou à VTT. » La page répond dans cet ordre : où vais-je dormir, où sera mon
cheval, combien ça coûte.

Hébergement (12 personnes) :
- 1 chambre avec lit double et salle de bain privée ;
- 2 chambres avec lit double et sanitaires partagés ;
- 1 dortoir de 6 lits simples, sanitaires partagés ;
- espaces communs : salle à manger, salon TV, cuisine à disposition, piscine.

Votre cheval : hébergement en paddock, foin compris. Infos pratiques à prévoir : accès van et
camion, documents demandés (vaccins à jour), balade possible avec Sylvie (phase 2).

## Tarifs (src/data/reservation.yaml) — à valider

| Prestation | Prix | Remarque |
| --- | --- | --- |
| Lit en dortoir | 35 € par personne et par nuit | petit-déjeuner compris |
| Draps (dortoir seulement) | 5 € | |
| Chambre double, sanitaires partagés | 75 € par nuit | TODO(amaelle) : par chambre ou par personne ? petit-déjeuner compris |
| Chambre double, salle de bain privée | 80 € par nuit | idem |
| Petit-déjeuner | compris | |
| Déjeuner ou pique-nique | 15 € | |
| Dîner | 20 € | |
| Cheval en paddock, foin compris | 10 € par nuit | |
| Forfait cavalier | 70 € | TODO(amaelle) : contenu exact (nuit, dîner, petit-déjeuner, cheval, draps, pique-nique ?) |

Taxe de séjour : TODO(amaelle).

## Infos pratiques — toutes à fournir

Horaires d'arrivée et de départ, linge, animaux de compagnie, acompte, conditions d'annulation,
accès en voiture et en van : `TODO(amaelle)`.

## Points ouverts (à ne pas trancher sans Amaëlle)

- Logo : version transparente (PNG ou SVG) à livrer ; le fichier actuel a un fond noir.
- Image « vue gîte (après réno) » : photo ou projection ?
- Le portail affiche « Chez Amaëlle » : cohérence avec le nom Chambalade.
- Mentions légales : SIRET en attente de la création de l'entreprise individuelle.
