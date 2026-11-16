-- Acompte demandé à l’acceptation (docs/reservation.md, section 4 : pourcentage encore inconnu).
-- Amaëlle le saisit en acceptant la demande ; il est repris dans l’e-mail à la cliente.
-- Centimes ; NULL tant qu’il n’est pas fixé.
ALTER TABLE demandes ADD COLUMN acompte_cents INTEGER CHECK (acompte_cents IS NULL OR acompte_cents >= 0);
