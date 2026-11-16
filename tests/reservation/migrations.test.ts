import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeEach, expect, it } from 'vitest';

const dir = new URL('../../migrations/', import.meta.url);
let db: DatabaseSync;

function demande(over: Record<string, unknown> = {}) {
  return {
    reference: 'CHB-2027-0001', statut: 'en_attente', date_arrivee: '2027-05-10', date_depart: '2027-05-12',
    nb_adultes: 2, nb_enfants: 0, nb_chevaux: 1, choix: '{}', devis: '{"total_cents":0}', langue: 'fr',
    nom: 'Test', prenom: 'Test', email: 'test@example.invalid', telephone: null, message: null,
    consentement_at: '2027-01-01T10:00:00Z', created_at: '2027-01-01T10:00:00Z', updated_at: '2027-01-01T10:00:00Z',
    expire_at: '2027-01-03T10:00:00Z', ...over,
  };
}
function insertDemande(over: Record<string, unknown> = {}) {
  const row = demande(over);
  const cols = Object.keys(row);
  return db.prepare(`INSERT INTO demandes (${cols.join(',')}) VALUES (${cols.map(c => '@' + c).join(',')})`).run(row as never);
}

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync(dir).filter(name => name.endsWith('.sql')).sort()) db.exec(readFileSync(new URL(file, dir), 'utf8'));
});

it('crée les tables du modèle de données et de la limitation', () => {
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
  expect(names.sort()).toEqual(['blocages', 'demandes', 'journal', 'limites', 'occupations']);
});

it('accepte une demande valide', () => {
  expect(insertDemande().changes).toBe(1);
});

it.each([
  ['statut inconnu', { statut: 'perdue' }],
  ['départ avant ou égal à l’arrivée', { date_depart: '2027-05-10' }],
  ['date mal formée', { date_arrivee: '10/05/2027' }],
  ['aucun adulte', { nb_adultes: 0 }],
  ['cheval négatif', { nb_chevaux: -1 }],
  ['langue inconnue', { langue: 'de' }],
  ['devis qui n’est pas du JSON', { devis: 'pas du json' }],
  ['nom vide', { nom: '' }],
])('refuse une demande invalide : %s', (_nom, over) => {
  expect(() => insertDemande(over)).toThrow();
});

it('refuse deux demandes avec la même référence', () => {
  insertDemande();
  expect(() => insertDemande()).toThrow();
});

it('lie les occupations à une demande existante et les supprime avec elle', () => {
  const { lastInsertRowid } = insertDemande();
  const add = (unite: string, nuit: string, quantite = 1) =>
    db.prepare('INSERT INTO occupations (demande_id, unite, nuit, quantite) VALUES (?, ?, ?, ?)').run(Number(lastInsertRowid), unite, nuit, quantite);
  add('dortoir', '2027-05-10', 3);
  expect(() => add('dortoir', '2027-05-10', 1)).toThrow();
  expect(() => add('salon', '2027-05-10')).toThrow();
  expect(() => add('dortoir', '2027-05-11', 0)).toThrow();
  expect(() => db.prepare('INSERT INTO occupations VALUES (999, ?, ?, 1)').run('dortoir', '2027-05-10')).toThrow();
  db.prepare('DELETE FROM demandes WHERE id = ?').run(Number(lastInsertRowid));
  expect(db.prepare('SELECT count(*) AS n FROM occupations').get()!.n).toBe(0);
});

it('valide les blocages : unité connue ou « toutes », motif connu, fin après début', () => {
  const add = (unite: string, debut: string, fin: string, motif: string) =>
    db.prepare('INSERT INTO blocages (unite, date_debut, date_fin, motif, created_at) VALUES (?, ?, ?, ?, ?)').run(unite, debut, fin, motif, '2027-01-01T00:00:00Z');
  expect(add('toutes', '2027-08-01', '2027-08-15', 'fermeture').changes).toBe(1);
  expect(() => add('salon', '2027-08-01', '2027-08-15', 'fermeture')).toThrow();
  expect(() => add('dortoir', '2027-08-01', '2027-08-15', 'caprice')).toThrow();
  expect(() => add('dortoir', '2027-08-15', '2027-08-15', 'travaux')).toThrow();
});

it('garde le journal même sans demande', () => {
  const add = (demande_id: number | null, action: string, auteur: string) =>
    db.prepare('INSERT INTO journal (demande_id, action, auteur, detail, created_at) VALUES (?, ?, ?, NULL, ?)').run(demande_id, action, auteur, '2027-01-01T00:00:00Z');
  expect(add(null, 'blocage_cree', 'amaelle').changes).toBe(1);
  expect(() => add(null, '', 'amaelle')).toThrow();
});
