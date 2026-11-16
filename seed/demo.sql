-- Données de démonstration pour le développement LOCAL (npm run api:demo). Rien de réel :
-- personnes fictives, adresses en example.invalid. Le script efface d’abord les tables de la
-- base locale, donc il peut être rejoué à volonté.
--
-- Dates en 2027 ; les délais des demandes en attente et acceptées sont loin dans l’avenir pour
-- que la démonstration reste utilisable (sinon elles passeraient à « expirée »). Le séjour
-- « expirée » sert à voir ce cas dans l’administration.

DELETE FROM occupations;
DELETE FROM journal;
DELETE FROM demandes;
DELETE FROM blocages;
DELETE FROM limites;
DELETE FROM sqlite_sequence;

INSERT INTO demandes (id, reference, statut, date_arrivee, date_depart, nb_adultes, nb_enfants, nb_chevaux, choix, devis, langue, nom, prenom, email, telephone, message, consentement_at, created_at, updated_at, expire_at) VALUES
 (1, 'CHB-2027-0001', 'confirmee', '2027-05-10', '2027-05-13', 3, 0, 0, '{"arrivee":"2027-05-10","depart":"2027-05-13","adultes":3,"enfants":0,"chevaux":0,"chambres":[],"litsDortoir":3}',
  '{"devise":"EUR","nuits":3,"lignes":[],"total_cents":31500,"complet":false,"provisoire":true,"acompte_cents":null,"calcule_le":"2026-11-10T09:00:00.000Z"}',
  'fr', 'Exemple', 'Camille', 'camille@example.invalid', '0600000001', 'Nous venons à trois, sans cheval.', '2026-11-10T09:00:00.000Z', '2026-11-10T09:00:00.000Z', '2026-11-12T08:00:00.000Z', NULL),
 (2, 'CHB-2027-0002', 'en_attente', '2027-06-04', '2027-06-07', 2, 0, 1, '{"arrivee":"2027-06-04","depart":"2027-06-07","adultes":2,"enfants":0,"chevaux":1,"chambres":["chambre_privee"],"litsDortoir":0}',
  '{"devise":"EUR","nuits":3,"lignes":[],"total_cents":27000,"complet":false,"provisoire":true,"acompte_cents":null,"calcule_le":"2026-11-14T18:30:00.000Z"}',
  'fr', 'Exemple', 'Inès', 'ines@example.invalid', NULL, 'Première visite avec ma jument.', '2026-11-14T18:30:00.000Z', '2026-11-14T18:30:00.000Z', '2026-11-14T18:30:00.000Z', '2027-12-31T12:00:00.000Z'),
 (3, 'CHB-2027-0003', 'acceptee', '2027-07-16', '2027-07-20', 2, 0, 2, '{"arrivee":"2027-07-16","depart":"2027-07-20","adultes":2,"enfants":0,"chevaux":2,"chambres":["chambre_3"],"litsDortoir":0}',
  '{"devise":"EUR","nuits":4,"lignes":[],"total_cents":38000,"complet":false,"provisoire":true,"acompte_cents":null,"calcule_le":"2026-11-08T11:00:00.000Z"}',
  'en', 'Example', 'Sam', 'sam@example.invalid', '0600000003', NULL, '2026-11-08T11:00:00.000Z', '2026-11-08T11:00:00.000Z', '2026-11-09T07:00:00.000Z', '2027-12-31T12:00:00.000Z'),
 (4, 'CHB-2027-0004', 'refusee', '2027-05-10', '2027-05-12', 2, 0, 0, '{"arrivee":"2027-05-10","depart":"2027-05-12","adultes":2,"enfants":0,"chevaux":0,"chambres":["chambre_2"],"litsDortoir":0}',
  '{"devise":"EUR","nuits":2,"lignes":[],"total_cents":15000,"complet":false,"provisoire":true,"acompte_cents":null,"calcule_le":"2026-11-11T10:00:00.000Z"}',
  'fr', 'Exemple', 'Louise', 'louise@example.invalid', NULL, NULL, '2026-11-11T10:00:00.000Z', '2026-11-11T10:00:00.000Z', '2026-11-11T15:00:00.000Z', NULL),
 (5, 'CHB-2027-0005', 'annulee', '2027-08-20', '2027-08-22', 1, 0, 0, '{"arrivee":"2027-08-20","depart":"2027-08-22","adultes":1,"enfants":0,"chevaux":0,"chambres":["chambre_2"],"litsDortoir":0}',
  '{"devise":"EUR","nuits":2,"lignes":[],"total_cents":15000,"complet":false,"provisoire":true,"acompte_cents":null,"calcule_le":"2026-11-02T10:00:00.000Z"}',
  'fr', 'Exemple', 'Jade', 'jade@example.invalid', NULL, NULL, '2026-11-02T10:00:00.000Z', '2026-11-02T10:00:00.000Z', '2026-11-05T10:00:00.000Z', NULL),
 (6, 'CHB-2027-0006', 'expiree', '2027-09-03', '2027-09-05', 2, 0, 0, '{"arrivee":"2027-09-03","depart":"2027-09-05","adultes":2,"enfants":0,"chevaux":0,"chambres":["chambre_3"],"litsDortoir":0}',
  '{"devise":"EUR","nuits":2,"lignes":[],"total_cents":15000,"complet":false,"provisoire":true,"acompte_cents":null,"calcule_le":"2026-10-01T10:00:00.000Z"}',
  'fr', 'Exemple', 'Manon', 'manon@example.invalid', NULL, NULL, '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z', '2026-10-03T10:00:00.000Z', '2026-10-03T10:00:00.000Z');

INSERT INTO occupations (demande_id, unite, nuit, quantite) VALUES
 (1, 'dortoir', '2027-05-10', 3), (1, 'dortoir', '2027-05-11', 3), (1, 'dortoir', '2027-05-12', 3),
 (2, 'chambre_privee', '2027-06-04', 1), (2, 'chambre_privee', '2027-06-05', 1), (2, 'chambre_privee', '2027-06-06', 1),
 (2, 'paddocks', '2027-06-04', 1), (2, 'paddocks', '2027-06-05', 1), (2, 'paddocks', '2027-06-06', 1),
 (3, 'chambre_3', '2027-07-16', 1), (3, 'chambre_3', '2027-07-17', 1), (3, 'chambre_3', '2027-07-18', 1), (3, 'chambre_3', '2027-07-19', 1),
 (3, 'paddocks', '2027-07-16', 2), (3, 'paddocks', '2027-07-17', 2), (3, 'paddocks', '2027-07-18', 2), (3, 'paddocks', '2027-07-19', 2),
 (4, 'chambre_2', '2027-05-10', 1), (4, 'chambre_2', '2027-05-11', 1),
 (5, 'chambre_2', '2027-08-20', 1), (5, 'chambre_2', '2027-08-21', 1),
 (6, 'chambre_3', '2027-09-03', 1), (6, 'chambre_3', '2027-09-04', 1);

INSERT INTO blocages (id, unite, date_debut, date_fin, motif, note, created_at) VALUES
 (1, 'toutes', '2027-08-02', '2027-08-16', 'fermeture', 'Fermeture d’été (exemple)', '2026-11-01T09:00:00.000Z'),
 (2, 'dortoir', '2027-04-12', '2027-04-14', 'travaux', 'Peinture (exemple)', '2026-11-01T09:05:00.000Z');

INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES
 (1, 'demande_creee', 'cliente', NULL, '2026-11-10T09:00:00.000Z'),
 (1, 'acceptee', 'dev@example.invalid', 'Avec plaisir !', '2026-11-10T12:00:00.000Z'),
 (1, 'acompte_recu', 'dev@example.invalid', NULL, '2026-11-12T08:00:00.000Z'),
 (2, 'demande_creee', 'cliente', NULL, '2026-11-14T18:30:00.000Z'),
 (3, 'demande_creee', 'cliente', NULL, '2026-11-08T11:00:00.000Z'),
 (3, 'acceptee', 'dev@example.invalid', NULL, '2026-11-09T07:00:00.000Z'),
 (4, 'demande_creee', 'cliente', NULL, '2026-11-11T10:00:00.000Z'),
 (4, 'refusee', 'dev@example.invalid', 'Dortoir et chambres complets ces nuits-là (exemple)', '2026-11-11T15:00:00.000Z'),
 (5, 'demande_creee', 'cliente', NULL, '2026-11-02T10:00:00.000Z'),
 (5, 'annulee', 'dev@example.invalid', NULL, '2026-11-05T10:00:00.000Z'),
 (6, 'demande_creee', 'cliente', NULL, '2026-10-01T10:00:00.000Z'),
 (6, 'expiree', 'systeme', NULL, '2026-10-03T10:00:00.000Z'),
 (NULL, 'blocage_cree', 'dev@example.invalid', 'toutes du 2027-08-02 au 2027-08-16 (fermeture)', '2026-11-01T09:00:00.000Z');
