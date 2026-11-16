-- Limitation du nombre de demandes par adresse IP (docs/reservation.md, section 10).
-- La clé est un condensé salé de l’adresse IP, jamais l’adresse elle-même ; la fenêtre est
-- l’heure UTC (AAAA-MM-JJTHH). Les fenêtres passées sont supprimées au fil de l’eau.
CREATE TABLE limites (
  cle TEXT NOT NULL CHECK (length(cle) > 0),
  fenetre TEXT NOT NULL CHECK (length(fenetre) > 0),
  compteur INTEGER NOT NULL DEFAULT 0 CHECK (compteur >= 0),
  PRIMARY KEY (cle, fenetre)
);
