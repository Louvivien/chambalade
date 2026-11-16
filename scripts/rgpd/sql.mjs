// Droit à l’effacement et durée de conservation (docs/reservation.md §10, docs/deploiement.md).
// Le site n’efface rien tout seul : ces requêtes sont lancées par une personne, sur la base D1 (voir scripts/rgpd.mjs).
// Règle : une demande encore active (en attente, acceptée, ou confirmée pour un séjour à venir) n’est jamais touchée :
// il faut d’abord la refuser ou l’annuler dans l’administration.

export const MARQUE = 'anonymisé';
const REFERENCE = /^CHB-\d{4}-\d{4}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HORODATAGE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const exiger = (ok, message) => { if (!ok) throw new Error(message); };
const q = (valeur) => `'${valeur}'`; // les valeurs ont été validées par un motif strict : aucun guillemet possible

/** Demandes que l’on peut effacer : terminées. `jour` = aujourd’hui (AAAA-MM-JJ). */
const terminee = (jour) => `(statut IN ('refusee', 'annulee', 'expiree') OR (statut = 'confirmee' AND date_depart < ${q(jour)}))`;

/** Remplace les données personnelles d’une demande par une marque ; garde dates, composition, devis (comptabilité). */
export function anonymiserDemande({ reference, jour, maintenant }) {
  exiger(REFERENCE.test(reference), 'Référence attendue : CHB-AAAA-NNNN');
  exiger(DATE.test(jour) && HORODATAGE.test(maintenant), 'Dates invalides');
  return [
    `INSERT INTO journal (demande_id, action, auteur, detail, created_at) SELECT id, 'anonymisee', 'rgpd', NULL, ${q(maintenant)} FROM demandes WHERE reference = ${q(reference)} AND nom <> ${q(MARQUE)} AND ${terminee(jour)};`,
    `UPDATE demandes SET nom = ${q(MARQUE)}, prenom = ${q(MARQUE)}, email = 'anonyme@invalid.invalid', telephone = NULL, message = NULL, updated_at = ${q(maintenant)} WHERE reference = ${q(reference)} AND nom <> ${q(MARQUE)} AND ${terminee(jour)};`,
  ];
}

/** Supprime entièrement une demande terminée (ses occupations partent avec elle) ; le journal garde une trace sans donnée personnelle. */
export function supprimerDemande({ reference, jour, maintenant }) {
  exiger(REFERENCE.test(reference), 'Référence attendue : CHB-AAAA-NNNN');
  exiger(DATE.test(jour) && HORODATAGE.test(maintenant), 'Dates invalides');
  return [
    `INSERT INTO journal (demande_id, action, auteur, detail, created_at) SELECT id, 'supprimee', 'rgpd', ${q(reference)}, ${q(maintenant)} FROM demandes WHERE reference = ${q(reference)} AND ${terminee(jour)};`,
    `DELETE FROM demandes WHERE reference = ${q(reference)} AND ${terminee(jour)};`,
  ];
}

/** Condition de la purge : terminée, pas encore anonymisée, et plus ancienne que `avant`. */
const perimetrePurge = (avant, jour) => `nom <> ${q(MARQUE)} AND ${terminee(jour)} AND ((statut = 'confirmee' AND date_depart < ${q(avant)}) OR (statut <> 'confirmee' AND substr(updated_at, 1, 10) < ${q(avant)}))`;

/** Liste (sans donnée personnelle) ce qu’une purge toucherait. */
export function apercuPurge({ avant, jour }) {
  exiger(DATE.test(avant) && DATE.test(jour), 'Dates invalides');
  return [`SELECT reference, statut, date_depart, substr(updated_at, 1, 10) AS modifiee FROM demandes WHERE ${perimetrePurge(avant, jour)} ORDER BY reference;`];
}

/** Anonymise toutes les demandes terminées plus anciennes que `avant` (AAAA-MM-JJ). */
export function purger({ avant, jour, maintenant }) {
  exiger(DATE.test(avant) && DATE.test(jour) && HORODATAGE.test(maintenant), 'Dates invalides');
  exiger(avant < jour, 'La date limite doit être passée');
  return [
    `INSERT INTO journal (demande_id, action, auteur, detail, created_at) SELECT id, 'anonymisee', 'rgpd', NULL, ${q(maintenant)} FROM demandes WHERE ${perimetrePurge(avant, jour)};`,
    `UPDATE demandes SET nom = ${q(MARQUE)}, prenom = ${q(MARQUE)}, email = 'anonyme@invalid.invalid', telephone = NULL, message = NULL, updated_at = ${q(maintenant)} WHERE ${perimetrePurge(avant, jour)};`,
  ];
}
