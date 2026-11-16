# Conversion des photos — étape 2

## Utilisation

Avec Node 24 et ImageMagick 7 installé avec le décodeur HEIC :

```sh
# Installation de l'outil sur macOS, si nécessaire :
brew install imagemagick
npm run photos
```

Sur les autres systèmes, installer ImageMagick 7 avec libheif via le gestionnaire
de paquets. `magick identify -list format` doit annoncer HEIC en lecture.

Le script lit le tableau de `docs/photos.md` à chaque exécution. Il ne parcourt
pas librement le dossier des originaux : seules les lignes avec une cible sont
traitées. Les chemins sont résolus depuis le script, indépendamment du dossier
courant. Les originaux restent intacts et ne sont jamais versionnés.

Les sources HEIC/HEIF, JPEG et PNG sont converties en JPEG progressifs de qualité
88, limités à 2560 px sur le grand côté, sans agrandissement ni recadrage.
L'orientation est appliquée avant de supprimer les métadonnées, profils et
commentaires. La transparence éventuelle est aplatie sur blanc.

Les sorties sont régénérées à chaque exécution. Chaque fichier est remplacé
seulement après une conversion réussie ; les sorties sans correspondance dans
le tableau ne sont pas supprimées. Un original absent est signalé sans bloquer
les autres conversions. Une erreur de conversion provoque un code de sortie 1.

## Cas particulier du logo

La ligne `Chambalade Pony Garden Logo.png` cible `logo/chambalade.png` et l'original
est absent. Le script signale ce manque. Si ce fichier est ajouté, il sera traité
en PNG dans `src/assets/logo/chambalade.png`, sans métadonnées, en conservant la
transparence éventuelle et avec le même plafond de dimensions. Cette exception
respecte le format du tableau et l'emplacement prévu par `AGENTS.md`.

## Validation avant publication

La conversion prépare les fichiers, y compris ceux en attente de validation ;
elle ne change pas leur statut et ne les publie pas. Les pages doivent respecter
les statuts de `docs/photos.md`.

Vérifier visuellement l'orientation, les couleurs et la netteté. Les recadrages,
annotations et ajustements de couleur du tableau restent à faire lors de la
préparation des pages. Les demandes d'originaux et la confirmation du statut de
`projection-gite.jpg` restent ouvertes dans `docs/photos.md` ; aucune nouvelle
information éditoriale n'a été ajoutée.
