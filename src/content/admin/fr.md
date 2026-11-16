---
title: Administration, Chambalade
header:
  title: Administration Chambalade
  signedIn: 'Connecté·e : {email}'
  navLabel: Sections de l’administration
  skip: Aller au contenu
  nav:
    demandes: Demandes
    calendrier: Calendrier
    blocages: Blocages
common:
  loading: Chargement…
  retry: Réessayer
  back: Retour à la liste
  cancel: Annuler
  close: Fermer
  noscript: Cette page a besoin de JavaScript.
  errors:
    unauthenticated: Votre connexion a expiré. Rechargez la page pour vous reconnecter.
    forbidden: Ce compte n’a pas accès à l’administration.
    notConfigured: L’accès à l’administration n’est pas encore configuré. Voir docs/api.md.
    network: La connexion a échoué. Vérifiez votre réseau, puis réessayez.
    server: Une erreur est survenue. Réessayez dans un instant.
    notFound: Introuvable.
    conflict: Cette demande vient de changer. Rechargez-la avant de recommencer.
statuts:
  en_attente: En attente
  acceptee: Acceptée, acompte attendu
  confirmee: Confirmée
  refusee: Refusée
  annulee: Annulée
  expiree: Expirée
unites:
  chambre_privee: Chambre avec salle de bain privée
  chambre_2: Chambre 2
  chambre_3: Chambre 3
  dortoir: Dortoir
  paddocks: Paddocks
  toutes: Tout le gîte
demandes:
  title: Demandes
  filterLabel: Statut
  filterAll: Toutes les demandes
  filterPending: À traiter (en attente)
  empty: Aucune demande.
  reference: Référence
  stay: Séjour
  people: Personnes
  total: Total indicatif
  status: Statut
  open: Ouvrir
  expiresIn: 'Expire dans {duree}'
  expired: Délai dépassé
  hours: '{n} h'
  days: '{n} j'
  minutes: '{n} min'
  adults: '{n} adulte(s)'
  children: '{n} enfant(s)'
  horses: '{n} cheval(aux)'
  pending: à confirmer
  openCount: '{n} demande(s) à traiter'
fiche:
  stay: Séjour
  arrival: Arrivée
  departure: Départ
  nights: '{n} nuit(s)'
  group: Groupe
  lodging: Hébergement
  dormitory: 'Lits en dortoir : {n}'
  meals: Repas
  dinners: 'Dîners : {n}'
  lunches: 'Déjeuners : {n}'
  noMeals: Aucun repas demandé
  contact: Coordonnées
  language: Langue de la cliente
  languages:
    fr: Français
    en: Anglais
  message: Message de la cliente
  noMessage: Pas de message.
  quote: Devis enregistré
  quoteTotal: Total indicatif
  quotePending: à confirmer
  quoteIncluded: compris
  quoteIncomplete: Certaines lignes sont à confirmer ; le total ne les compte pas.
  quoteProvisional: Tarifs encore en cours de validation.
  deposit: Acompte demandé
  depositNone: Pas encore fixé
  deadline: Délai de réponse
  journal: Historique
  actions: Actions
  noActions: Aucune action possible sur une demande de ce statut.
  lines:
    chambre_privee: Chambre avec salle de bain privée
    chambre_partagee: Chambre, sanitaires partagés
    dortoir: Lits en dortoir
    draps_dortoir: Draps (dortoir)
    petit_dejeuner: Petit-déjeuner
    dejeuner: Déjeuners et pique-niques
    diner: Dîners
    cheval: Cheval en paddock, foin compris
    forfait_cavalier: Forfait cavalier
    taxe_sejour: Taxe de séjour
  rooms:
    chambre_privee: Chambre avec salle de bain privée
    chambre_2: Chambre 2
    chambre_3: Chambre 3
  action:
    accepter: Accepter
    refuser: Refuser
    confirmer: Marquer l’acompte reçu
    annuler: Annuler la réservation
    prolonger: Prolonger le délai
  actionHelp:
    accepter: La demande passe à « Acceptée » et la cliente reçoit un e-mail avec l’acompte à verser. Ses dates restent retenues 7 jours.
    refuser: La demande est refusée, ses dates sont libérées et la cliente reçoit un e-mail.
    confirmer: La réservation est confirmée et la cliente reçoit un e-mail de confirmation.
    annuler: La réservation est annulée, ses dates sont libérées et la cliente reçoit un e-mail.
    prolonger: Repousse la fin du délai de retenue des dates. Aucun e-mail n’est envoyé.
  messageLabel: Message pour la cliente (facultatif)
  messageHint: Il sera repris tel quel dans l’e-mail.
  depositLabel: Acompte demandé (en euros)
  depositHint: 'TODO(amaelle): confirmer le pourcentage d’acompte. En attendant, saisissez le montant à la main ; vide, l’e-mail ne chiffre rien.'
  extendLabel: Prolonger de
  extendOptions:
    '24': 24 heures
    '48': 48 heures
    '72': 3 jours
    '168': 7 jours
  confirm: Confirmer
  done: Fait.
  email:
    envoye: E-mail envoyé à la cliente.
    echec: 'L’e-mail n’a pas pu être envoyé : écrivez directement à la cliente.'
    non_configure: 'Aucun e-mail envoyé (service d’e-mail non configuré) : écrivez directement à la cliente.'
  journalActions:
    demande_creee: Demande envoyée
    acceptee: Demande acceptée
    refusee: Demande refusée
    acompte_recu: Acompte reçu
    annulee: Réservation annulée
    delai_prolonge: Délai prolongé
    expiree: Délai dépassé, demande expirée
    email_envoye: E-mail envoyé
    email_echec: E-mail non envoyé (échec)
    email_ignore: E-mail non envoyé (service non configuré)
    alerte_expiration: Alerte d’expiration envoyée
    blocage_cree: Blocage créé
    blocage_supprime: Blocage supprimé
  journalBy:
    cliente: la cliente
    systeme: le système
calendrier:
  title: Calendrier
  monthLabel: Mois affiché
  previous: Mois précédent
  next: Mois suivant
  today: Mois en cours
  unit: Unité
  legendTitle: Légende
  free: Libre
  states:
    confirmee: Confirmée
    acceptee: Acceptée
    en_attente: En attente
    bloque: Bloqué
  codes:
    confirmee: C
    acceptee: A
    en_attente: E
    bloque: B
  cellLabel: '{unite}, {jour} : {etat}'
  cellFree: '{unite}, {jour} : libre'
  details: Détails de la case
  quantity: '{n} place(s)'
  capacityUnknown: capacité inconnue
  openRequest: Ouvrir la demande {reference}
  note: 'Les couleurs ne sont pas le seul repère : chaque case porte une lettre et un motif.'
blocages:
  title: Blocages de dates
  intro: Un blocage retire des dates à la réservation (fermeture, travaux, réservation passée ailleurs). Le jour de fin n’est pas bloqué.
  formTitle: Nouveau blocage
  unitLabel: Unité
  startLabel: Du (nuit incluse)
  endLabel: Au (jour de départ, nuit non bloquée)
  motifLabel: Motif
  noteLabel: Note (facultatif)
  create: Créer le blocage
  list: Blocages à venir
  empty: Aucun blocage à venir.
  delete: Supprimer
  deleteConfirm: 'Supprimer le blocage « {unite}, du {debut} au {fin} » ? Les dates redeviennent réservables.'
  created: Blocage créé.
  deleted: Blocage supprimé.
  conflicts: 'Attention, ces demandes occupent déjà des nuits bloquées (elles ne sont pas annulées) :'
  motifs:
    fermeture: Fermeture
    travaux: Travaux
    reservation_exterieure: Réservation extérieure
    autre: Autre
  errors:
    dates: La date de fin doit être après la date de début.
    required: Renseignez l’unité, le motif et les deux dates.
---

<!-- TODO(amaelle): valider les textes de l’administration (vocabulaire, libellés des actions). -->
