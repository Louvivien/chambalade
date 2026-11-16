---
title: Book — Chambalade, equestrian guesthouse in the Chambarans
description: 'Request your stay at the Chambalade equestrian guesthouse in Roybon: choose your dates, build your stay with your horse and get an indicative quote.'
hero:
  title: Request your stay
  text: Choose your dates, build your stay and get an indicative quote. Amaëlle replies within {heures} hours. Your request only becomes a booking once it is accepted.
  opening: The guesthouse opens in spring 2027.
noscript:
  text: This form needs JavaScript to show availability and calculate your quote. Please turn it on, or contact us directly.
  contact: 'TODO(amaelle): provide the contact phone number and email address.'
dates:
  legend: Your dates
  instructions: Tap or click your arrival day, then your departure day. With a keyboard, use the arrow keys to move and Enter to choose.
  calendarLabel: Availability calendar
  previousMonth: Previous month
  nextMonth: Next month
  arrival: Arrival
  departure: Departure
  none: Not chosen yet
  nightsOne: '{n} night'
  nightsMany: '{n} nights'
  clear: Clear the dates
  keyAvailable: Available
  keyFull: Full
  keyChosen: Your stay
  full: full
  stateAvailable: available
  stateClosed: not yet open for booking
  stateUnknown: availability unknown
  stateArrival: arrival
  stateDeparture: departure
  stateInStay: in your stay
  stateDeparturePossible: departure possible
  stateDepartureImpossible: departure not possible
  selectedArrival: 'Arrival chosen: {date}.'
  selectedStay: 'Stay from {arrivee} to {depart}, {nuits}.'
  loading: Loading availability…
  loadError: Availability could not be loaded, so you cannot choose your dates for now.
  loadErrorDev: 'Local development: the booking API must be running. Run npm run api:dev and open http://localhost:8788/en/book/ (see docs/api.md).'
  retry: Try again
  pickDeparture: Now choose your departure day.
  tooEarly: This date is not yet open for stays.
  weekdays: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
group:
  legend: Your group
  adults: Adults
  children: Children
  childrenHint: 'TODO(amaelle): specify whether children are welcome and at what rate.'
  horses: Horses
  horsesHint: 'TODO(amaelle): specify how many horses can be hosted at the same time. While unknown, requests with a horse cannot be sent.'
lodging:
  legend: Your accommodation
  intro: Choose one or more rooms, dormitory beds, or both.
  rooms:
    chambre_privee: Room with private bathroom, one double bed
    chambre_2: Room 2, one double bed, shared washrooms
    chambre_3: Room 3, one double bed, shared washrooms
  dormitory: Dormitory beds (6 single beds, shared washrooms)
  dormitoryCount: Number of beds
  breakfast: Breakfast is included in the accommodation.
meals:
  legend: Your meals
  intro: Meals are available on request, for everyone in the stay.
  dinner: Dinner on {date}
  lunch: Lunch or picnic on {date}
  noDates: Choose your dates first to select your meals.
contact:
  legend: Your details
  lastName: Last name
  firstName: First name
  email: Email address
  phone: Phone number (optional)
  message: A word about your stay (optional)
  messageHint: Your horse, your habits, your questions.
  consent: I agree that Chambalade may use this information to reply to my stay request.
  consentPrivacy: 'Your information is only used to handle your request. See the [privacy policy](/en/privacy/) and the [booking terms](/en/booking-terms/).'
  antiRobot: Anti-robot check
quote:
  title: Your indicative quote
  mention: Indicative quote, confirmed by Chambalade when your request is accepted.
  provisional: 'The rates are still being validated: this quote may still change.'
  incomplete: Some lines are still to be confirmed by Chambalade; the total does not include them yet.
  empty: Choose your dates and accommodation to see the quote.
  pending: to be confirmed
  included: included
  total: Indicative total
  deposit: Deposit
  depositUnknown: The deposit amount will be given to you when your request is accepted.
  availabilityWarning: 'Please note, these dates are not all available:'
  updating: Updating the quote…
  error: The quote could not be calculated. Check your stay or try again.
  lines:
    chambre_privee: Room with private bathroom
    chambre_partagee: Room, shared washrooms
    dortoir: Dormitory beds
    draps_dortoir: Bed linen (dormitory)
    petit_dejeuner: Breakfast
    dejeuner: Lunches and picnics
    diner: Dinners
    cheval: Horse in a paddock, hay included
    forfait_cavalier: Rider package
    taxe_sejour: Tourist tax
submit:
  label: Send my booking request
  sending: Sending…
  summaryTitle: Your request has not been sent
  missingKey: The anti-robot check is not available at the moment. Please try again later or contact us.
errors:
  fields:
    nom: The last name
    prenom: The first name
    email: The email address
  required: '{champ} is required.'
  email: This email address does not look valid.
  noDates: Choose your arrival and departure dates.
  noLodging: Choose at least one room or one dormitory bed.
  consent: Your consent is needed to send the request.
  antiRobot: Tick the anti-robot check.
  network: The connection failed. Check your network and try again; nothing has been sent.
  server: Something went wrong on our side. Your request has not been saved, please try again in a moment.
  rateLimit: You have sent too many requests. Please try again in {minutes} minutes.
confirmation:
  title: Your request has been sent
  reference: Your reference
  next: Amaëlle will reply within {heures} hours at the email address you gave. Your dates are held until she replies.
  notBooking: This is not a booking yet. It is confirmed once your request is accepted and the deposit has been received by bank transfer.
  recap: Summary
  again: Make another request
unitNames:
  chambre_privee: the room with private bathroom
  chambre_2: Room 2
  chambre_3: Room 3
  dortoir: the dormitory
  paddocks: the paddocks
serverErrors:
  donnees_invalides: Some of the information is not valid. Please check the form.
  dates_invalides: The dates of your stay are not valid.
  depart_avant_arrivee: Your departure must be after your arrival.
  sejour_trop_court: 'The minimum length of stay is {minNights}.'
  sejour_trop_long: 'A stay cannot be longer than {maxNights}.'
  avant_ouverture: 'Stays start from {firstNight}.'
  trop_tard: It is too late to book this arrival date online.
  trop_tot: 'Bookings cannot be made more than {months} months ahead.'
  adulte_requis: At least one adult is needed.
  enfants_invalides: The number of children is not valid.
  chevaux_invalides: The number of horses is not valid.
  enfants_refuses: Children are not accepted.
  lits_invalides: The number of dormitory beds is not valid.
  hebergement_requis: Choose at least one room or one dormitory bed.
  chambre_en_double: A room cannot be chosen twice.
  places_insuffisantes: The accommodation you chose does not have enough beds for your group.
  personnes_chambre_invalides: The number of people in a room is not valid.
  repas_invalide: A meal you asked for is not valid (date outside your stay or wrong number of people).
  forfait_invalide: The number of rider packages is not valid.
  cheval_sans_personne: A horse needs at least one person staying.
  capacite_inconnue: 'The capacity of {room} is not defined yet: booking is not possible.'
  indisponible: '{room} is not available on the night of {night}.'
  verification_echouee: The anti-robot check failed. Reload the page and try again.
  verification_indisponible: The anti-robot check is temporarily unavailable. Please try again in a moment.
---

<!-- TODO(amaelle): validate the proposed texts of the Book page. -->
<!-- TODO(amaelle): confirm that a reply within 48 hours and the temporary hold on the dates are acceptable. -->
