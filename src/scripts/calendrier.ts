import { ajouterJours, ajouterMois } from '../lib/reservation/dates';
import { bornesArrivee, clicSurJour, estSelectionnable, fenetreDuMois, grilleDuMois, moisDe, sejourPossible, statutNuit } from '../lib/reserver/calendrier';
import { dateComplete, remplir } from '../lib/reserver/formats';
import type { EtatFormulaire, LibresParNuit, Regles, StatutNuit } from '../lib/reserver/types';
import { el, vider } from './dom';

export interface TextesCalendrier {
  calendarLabel: string; previousMonth: string; nextMonth: string; weekdays: string[]; loading: string; loadError: string;
  stateAvailable: string; full: string; stateClosed: string; stateUnknown: string; stateArrival: string; stateDeparture: string; stateInStay: string;
  stateDeparturePossible: string; stateDepartureImpossible: string; pickDeparture: string; tooEarly: string; selectedArrival: string;
}

export interface OptionsCalendrier {
  racine: HTMLElement;
  textes: TextesCalendrier;
  regles: Regles;
  aujourdhui: string;
  /** Les choix qui influencent la disponibilité (hébergement, chevaux), relus à chaque affichage. */
  choix: () => Pick<EtatFormulaire, 'chambres' | 'litsDortoir' | 'chevaux'>;
  selection: () => { arrivee: string | null; depart: string | null };
  charger: (du: string, au: string) => Promise<LibresParNuit>;
  onSelection: (arrivee: string | null, depart: string | null) => void;
}

const MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Calendrier de séjour : une grille de boutons, un seul dans l’ordre de tabulation (tabindex
 * itinérant), navigation aux flèches. Les nuits complètes restent atteignables au clavier et
 * annoncées (« complet »), mais ne se choisissent pas ; l’état n’est jamais porté par la
 * couleur seule (hachures, texte, forme).
 */
export function creerCalendrier(o: OptionsCalendrier) {
  const { racine, textes: t, regles, aujourdhui } = o;
  const bornes = bornesArrivee(regles, aujourdhui);
  const premierMois = moisDe(bornes.premiere);
  const dernierMois = moisDe(ajouterJours(bornes.derniere, regles.nuitsMax));
  const donnees: LibresParNuit = {};
  const mois = new Set<string>(); // mois déjà demandés à l’API
  let affiche = { ...premierMois };
  let focus = bornes.premiere;
  let erreurChargement = false;
  let chargement = 0;

  const cleMois = (a: number, m: number) => `${a}-${String(m).padStart(2, '0')}`;
  const ordre = (a: number, m: number) => a * 12 + m;

  async function assurer(du: string, au: string) {
    // Charge chaque mois du segment [du, au) qui ne l’est pas encore.
    let { annee, mois: m } = moisDe(du);
    const fin = moisDe(ajouterJours(au, -1));
    while (ordre(annee, m) <= ordre(fin.annee, fin.mois)) {
      const cle = cleMois(annee, m);
      if (!mois.has(cle) && ordre(annee, m) >= ordre(premierMois.annee, premierMois.mois) && ordre(annee, m) <= ordre(dernierMois.annee, dernierMois.mois)) {
        mois.add(cle);
        chargement++;
        const f = fenetreDuMois(annee, m, regles.fenetreMax);
        try { Object.assign(donnees, await o.charger(f.du, f.au)); erreurChargement = false; }
        catch { mois.delete(cle); erreurChargement = true; }
        finally { chargement--; }
      }
      if (m === 12) { annee++; m = 1; } else m++;
    }
  }

  /** Message d’état annoncé aux lecteurs d’écran ; il reste affiché jusqu’au prochain geste. */
  function message(texte: string) { statutRegion.dataset.message = texte; statutRegion.textContent = texte; }

  const statut = (nuit: string): StatutNuit => statutNuit(nuit, donnees, o.choix(), bornes);

  /** Ce qu’un jour permet, selon qu’on choisit l’arrivée ou le départ. */
  function etatJour(jour: string) {
    const sel = o.selection();
    const s = statut(jour);
    if (sel.arrivee && !sel.depart && jour > sel.arrivee) {
      const possible = sejourPossible(sel.arrivee, jour, regles, statut);
      return { cliquable: possible, classe: possible ? 'depart-possible' : 'impossible', texte: possible ? t.stateDeparturePossible : t.stateDepartureImpossible };
    }
    const texte = s === 'disponible' ? t.stateAvailable : s === 'complet' ? t.full : s === 'ferme' ? t.stateClosed : t.stateUnknown;
    return { cliquable: estSelectionnable(s), classe: s === 'disponible' ? 'libre' : s === 'complet' ? 'complet' : s === 'ferme' ? 'ferme' : 'inconnu', texte };
  }

  const statutRegion = el('p', { class: 'calendrier-statut', role: 'status' });
  const titre = el('h3', { class: 'cal-titre', id: 'cal-titre', 'aria-live': 'polite' });
  const precedent = el('button', { type: 'button', class: 'cal-nav', 'aria-label': t.previousMonth }, ['‹']);
  const suivant = el('button', { type: 'button', class: 'cal-nav', 'aria-label': t.nextMonth }, ['›']);
  const grille = el('table', { class: 'cal-grille', role: 'grid', 'aria-labelledby': 'cal-titre' });

  let moisConstruit = '';

  /** Met à jour, sur place, l’état de chaque jour. Les boutons ne sont pas recréés : un clic en cours ne doit jamais perdre sa cible. */
  function majJours() {
    const sel = o.selection();
    for (const bouton of grille.querySelectorAll<HTMLButtonElement>('button[data-date]')) {
      const jour = bouton.dataset.date!;
      const e = etatJour(jour);
      const estArrivee = jour === sel.arrivee;
      const estDepart = jour === sel.depart;
      const dedans = !!(sel.arrivee && sel.depart && jour > sel.arrivee && jour < sel.depart);
      const etat = estArrivee ? t.stateArrival : estDepart ? t.stateDeparture : dedans ? t.stateInStay : e.texte;
      bouton.className = ['cal-jour', e.classe, estArrivee ? 'arrivee' : '', estDepart ? 'depart' : '', dedans ? 'dedans' : ''].filter(Boolean).join(' ');
      bouton.setAttribute('aria-label', `${dateComplete(jour)}, ${etat}`);
      if (e.cliquable || estArrivee || estDepart) bouton.removeAttribute('aria-disabled'); else bouton.setAttribute('aria-disabled', 'true');
      if (estArrivee || estDepart) bouton.setAttribute('aria-pressed', 'true'); else bouton.removeAttribute('aria-pressed');
      bouton.tabIndex = jour === focus ? 0 : -1;
    }
    // Sans jour atteignable au clavier dans ce mois (le jour mémorisé est ailleurs), le premier jour prend le relais.
    if (!grille.querySelector('[tabindex="0"]')) grille.querySelector('button')?.setAttribute('tabindex', '0');
  }

  function dessiner(redonnerFocus = false) {
    titre.textContent = MOIS.format(new Date(Date.UTC(affiche.annee, affiche.mois - 1, 1)));
    precedent.disabled = ordre(affiche.annee, affiche.mois) <= ordre(premierMois.annee, premierMois.mois);
    suivant.disabled = ordre(affiche.annee, affiche.mois) >= ordre(dernierMois.annee, dernierMois.mois);
    const cle = cleMois(affiche.annee, affiche.mois);
    if (cle !== moisConstruit) {
      moisConstruit = cle;
      const entete = el('thead', {}, [el('tr', {}, t.weekdays.map(j => el('th', { scope: 'col' }, [j])))]);
      const corps = el('tbody');
      for (const semaine of grilleDuMois(affiche.annee, affiche.mois)) {
        const ligne = el('tr');
        for (const jour of semaine) {
          const cellule = el('td', { role: 'gridcell' });
          if (jour) cellule.append(el('button', { type: 'button', 'data-date': jour }, [el('span', { 'aria-hidden': 'true' }, [String(Number(jour.slice(8)))])]));
          ligne.append(cellule);
        }
        corps.append(ligne);
      }
      vider(grille);
      grille.append(entete, corps);
    }
    majJours();
    statutRegion.textContent = chargement > 0 ? t.loading : erreurChargement ? t.loadError : statutRegion.dataset.message ?? '';
    racine.dataset.etat = chargement > 0 ? 'chargement' : erreurChargement ? 'erreur' : 'pret';
    if (redonnerFocus) grille.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus();
  }

  async function afficherMois(annee: number, m: number, redonnerFocus = false) {
    affiche = { annee, mois: m };
    const f = fenetreDuMois(annee, m, regles.fenetreMax);
    const pending = assurer(f.du, f.au);
    dessiner(redonnerFocus);
    await pending;
    dessiner(redonnerFocus);
  }

  const decaler = (delta: number) => { const d = ajouterMois(`${affiche.annee}-${String(affiche.mois).padStart(2, '0')}-01`, delta); const x = moisDe(d); return x; };

  async function choisir(jour: string) {
    const sel = o.selection();
    const e = etatJour(jour);
    if (!e.cliquable && !(sel.arrivee && !sel.depart && jour > sel.arrivee)) { message(t.tooEarly); return; }
    // Les nuits entre l’arrivée et le jour cliqué doivent être connues avant de juger le séjour.
    if (sel.arrivee && !sel.depart && jour > sel.arrivee) await assurer(sel.arrivee, jour);
    const r = clicSurJour(jour, sel, regles, statut);
    if (r.arrivee === null) { message(t.tooEarly); return; }
    o.onSelection(r.arrivee, r.depart);
    message(r.message === 'depart' ? `${remplir(t.selectedArrival, { date: dateComplete(r.arrivee) })} ${t.pickDeparture}` : '');
    dessiner(true);
  }

  grille.addEventListener('click', ev => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-date]');
    if (!b) return;
    focus = b.dataset.date!;
    void choisir(focus);
  });

  grille.addEventListener('keydown', ev => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-date]');
    if (!b) return;
    const jour = b.dataset.date!;
    const pas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let cible: string | null = null;
    if (ev.key in pas) cible = ajouterJours(jour, pas[ev.key]);
    else if (ev.key === 'Home') cible = ajouterJours(jour, -((new Date(`${jour}T00:00:00Z`).getUTCDay() + 6) % 7));
    else if (ev.key === 'End') cible = ajouterJours(jour, 6 - ((new Date(`${jour}T00:00:00Z`).getUTCDay() + 6) % 7));
    else if (ev.key === 'PageUp') cible = ajouterMois(jour, -1);
    else if (ev.key === 'PageDown') cible = ajouterMois(jour, 1);
    if (cible === null) return; // Entrée et Espace déclenchent le clic natif du bouton.
    ev.preventDefault();
    const m = moisDe(cible);
    if (ordre(m.annee, m.mois) < ordre(premierMois.annee, premierMois.mois) || ordre(m.annee, m.mois) > ordre(dernierMois.annee, dernierMois.mois)) return;
    focus = cible;
    if (m.annee !== affiche.annee || m.mois !== affiche.mois) void afficherMois(m.annee, m.mois, true);
    else { dessiner(true); }
  });

  precedent.addEventListener('click', () => { const m = decaler(-1); focus = `${m.annee}-${String(m.mois).padStart(2, '0')}-01`; void afficherMois(m.annee, m.mois); });
  suivant.addEventListener('click', () => { const m = decaler(1); focus = `${m.annee}-${String(m.mois).padStart(2, '0')}-01`; void afficherMois(m.annee, m.mois); });

  vider(racine);
  racine.setAttribute('role', 'group');
  racine.setAttribute('aria-label', t.calendarLabel);
  racine.append(el('div', { class: 'cal-entete' }, [precedent, titre, suivant]), grille, statutRegion);
  void afficherMois(affiche.annee, affiche.mois);

  return {
    /** À appeler quand les choix d’hébergement ou les dates changent. */
    rafraichir: () => dessiner(),
    /** Après un conflit signalé par le serveur : on oublie ce qu’on savait et on relit le mois affiché. */
    invalider: () => { mois.clear(); for (const k of Object.keys(donnees)) delete donnees[k]; void afficherMois(affiche.annee, affiche.mois); },
  };
}
