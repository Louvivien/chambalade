-- Module de réservation, version 1 (docs/reservation.md, section 6). Cloudflare D1 / SQLite.
--
-- Conventions :
--  * Dates au format AAAA-MM-JJ (texte), horodatages en UTC au format ISO 8601.
--  * Une réservation porte sur des nuits : date d’arrivée incluse, date de départ exclue.
--    Les blocages suivent la même règle : date_debut incluse, date_fin exclue.
--  * Montants en centimes (entiers), dans le JSON du devis.
--  * Aucun prix ni aucune capacité ici : ils viennent de src/data/reservation.yaml.

CREATE TABLE demandes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  statut TEXT NOT NULL CHECK (statut IN ('en_attente', 'acceptee', 'confirmee', 'refusee', 'annulee', 'expiree')),
  date_arrivee TEXT NOT NULL CHECK (date_arrivee GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  date_depart TEXT NOT NULL CHECK (date_depart GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  nb_adultes INTEGER NOT NULL CHECK (nb_adultes >= 1),
  nb_enfants INTEGER NOT NULL DEFAULT 0 CHECK (nb_enfants >= 0),
  nb_chevaux INTEGER NOT NULL DEFAULT 0 CHECK (nb_chevaux >= 0),
  choix TEXT NOT NULL CHECK (json_valid(choix)),
  devis TEXT NOT NULL CHECK (json_valid(devis)),
  langue TEXT NOT NULL CHECK (langue IN ('fr', 'en')),
  nom TEXT NOT NULL CHECK (length(nom) > 0),
  prenom TEXT NOT NULL CHECK (length(prenom) > 0),
  email TEXT NOT NULL CHECK (length(email) > 0),
  telephone TEXT,
  message TEXT,
  consentement_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- Fin du blocage provisoire ; NULL une fois la réservation confirmée, refusée ou annulée.
  expire_at TEXT,
  CHECK (date_depart > date_arrivee)
);
CREATE INDEX idx_demandes_statut ON demandes (statut, expire_at);
CREATE INDEX idx_demandes_dates ON demandes (date_arrivee, date_depart);

-- Une ligne par unité et par nuit ; sert au calcul des disponibilités.
CREATE TABLE occupations (
  demande_id INTEGER NOT NULL REFERENCES demandes (id) ON DELETE CASCADE,
  unite TEXT NOT NULL CHECK (unite IN ('chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks')),
  nuit TEXT NOT NULL CHECK (nuit GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  quantite INTEGER NOT NULL CHECK (quantite >= 1),
  PRIMARY KEY (demande_id, unite, nuit)
);
CREATE INDEX idx_occupations_unite_nuit ON occupations (unite, nuit);

CREATE TABLE blocages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unite TEXT NOT NULL CHECK (unite IN ('toutes', 'chambre_privee', 'chambre_2', 'chambre_3', 'dortoir', 'paddocks')),
  date_debut TEXT NOT NULL CHECK (date_debut GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  date_fin TEXT NOT NULL CHECK (date_fin GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  motif TEXT NOT NULL CHECK (motif IN ('fermeture', 'travaux', 'reservation_exterieure', 'autre')),
  note TEXT,
  created_at TEXT NOT NULL,
  CHECK (date_fin > date_debut)
);
CREATE INDEX idx_blocages_dates ON blocages (date_debut, date_fin);

-- Historique des actions. demande_id est NULL pour une action sans demande (ex. blocage).
-- Le journal survit à la suppression d’une demande (anonymisation) : pas de clé étrangère
-- en cascade, et le détail ne doit contenir aucune donnée personnelle.
CREATE TABLE journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  demande_id INTEGER,
  action TEXT NOT NULL CHECK (length(action) > 0),
  auteur TEXT NOT NULL CHECK (length(auteur) > 0),
  detail TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_journal_demande ON journal (demande_id, created_at);
