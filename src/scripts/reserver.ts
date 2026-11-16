import { dateParis, nuits } from '../lib/reservation/dates';
import { dateComplete, dateCourte, libelleNuits, remplir } from '../lib/reserver/formats';
import { entierBorne, nettoyerRepas, sejourDepuisEtat } from '../lib/reserver/sejour';
import { etatInitial, type EtatFormulaire, type LibresParNuit, type Regles } from '../lib/reserver/types';
import { creerCalendrier } from './calendrier';
import { creerDevis, nomCourt } from './devis';
import { brancherEnvoi } from './envoi';
import { el, trouver, vider } from './dom';

// Données publiques posées dans la page à la construction : textes du contenu, règles de séjour, clé Turnstile.
interface Donnees { text: Record<string, any>; regles: Regles; siteKey: string }
const donnees: Donnees = JSON.parse(trouver('reserver-donnees').textContent ?? '{}');
const { text, regles } = donnees;
const nomsUnites = Object.fromEntries(Object.entries(text.lodging.rooms as Record<string, string>).map(([id, libelle]) => [id, nomCourt(libelle)]));

const etat: EtatFormulaire = etatInitial();
/** Un choix a changé : le devis est redemandé et le résumé d’erreurs se remet à jour. */
const signaler = () => { devis.planifier(); document.dispatchEvent(new CustomEvent('reserver:change')); };
const formulaire = trouver<HTMLFormElement>('formulaire');
const champ = <T extends HTMLElement>(id: string) => trouver<T>(id);
const devis = creerDevis({ zone: trouver('devis-contenu'), textes: text.quote, nomsUnites, sejour: () => sejourDepuisEtat(etat, regles) });
const casesChambres = () => [...formulaire.querySelectorAll<HTMLInputElement>('input[name="chambres"]')];

/** Relit les champs de groupe et d’hébergement dans l’état. */
function lireChoix() {
  etat.adultes = entierBorne(champ<HTMLInputElement>('adultes').value, 30, 1);
  etat.enfants = entierBorne(champ<HTMLInputElement>('enfants').value, 30);
  etat.chevaux = entierBorne(champ<HTMLInputElement>('chevaux').value, 30);
  etat.litsDortoir = entierBorne(champ<HTMLInputElement>('lits').value, regles.litsDortoir);
  etat.chambres = casesChambres().filter(c => c.checked).map(c => c.value as EtatFormulaire['chambres'][number]);
}

/** Affiche les dates choisies. */
function afficherDates() {
  champ('date-arrivee').textContent = etat.arrivee ? dateComplete(etat.arrivee) : text.dates.none;
  champ('date-depart').textContent = etat.depart ? dateComplete(etat.depart) : text.dates.none;
  const n = etat.arrivee && etat.depart ? nuits(etat.arrivee, etat.depart).length : 0;
  champ('nombre-nuits').textContent = n > 0 ? libelleNuits(n, text.dates.nightsOne, text.dates.nightsMany) : '';
  champ('effacer-dates').hidden = !etat.arrivee;
}

/** Une case à cocher de repas par soir et par déjeuner du séjour. */
function afficherRepas() {
  const zone = champ('repas');
  vider(zone);
  if (!etat.arrivee || !etat.depart) { zone.append(el('p', { class: 'aide' }, [text.meals.noDates])); return; }
  const soirs = new Set(nuits(etat.arrivee, etat.depart));
  const jours = [...soirs, etat.depart];
  for (const jour of jours) {
    const ligne = el('div', { class: 'repas-jour', role: 'group', 'aria-label': dateComplete(jour) });
    const case_ = (type: 'dejeuners' | 'diners', libelle: string) => {
      const input = el('input', { type: 'checkbox', 'data-repas': type, value: jour });
      input.checked = etat[type].includes(jour);
      return el('label', { class: 'case' }, [input, el('span', {}, [remplir(libelle, { date: dateCourte(jour) })])]);
    };
    ligne.append(case_('dejeuners', text.meals.lunch));
    if (soirs.has(jour)) ligne.append(case_('diners', text.meals.dinner));
    zone.append(ligne);
  }
}

async function chargerDisponibilites(du: string, au: string): Promise<LibresParNuit> {
  const reponse = await fetch(`/api/disponibilites?du=${du}&au=${au}`, { headers: { Accept: 'application/json' } });
  if (!reponse.ok) throw new Error('disponibilités indisponibles');
  const corps = (await reponse.json()) as { nuits: Array<{ nuit: string; libres: LibresParNuit[string] }> };
  return Object.fromEntries(corps.nuits.map(n => [n.nuit, n.libres]));
}


const calendrier = creerCalendrier({
  racine: champ('calendrier'),
  textes: text.dates,
  regles,
  aujourdhui: dateParis(new Date()),
  choix: () => etat,
  selection: () => etat,
  charger: chargerDisponibilites,
  onSelection: (arrivee, depart) => {
    etat.arrivee = arrivee; etat.depart = depart;
    Object.assign(etat, nettoyerRepas(etat));
    afficherDates();
    afficherRepas();
    signaler();
  },
});

formulaire.addEventListener('change', ev => {
  const cible = ev.target as HTMLInputElement;
  if (cible.dataset.repas) {
    const type = cible.dataset.repas as 'dejeuners' | 'diners';
    etat[type] = cible.checked ? [...new Set([...etat[type], cible.value])] : etat[type].filter(d => d !== cible.value);
  } else if (['adultes', 'enfants', 'chevaux', 'lits', 'chambres'].includes(cible.name)) {
    lireChoix();
    calendrier.rafraichir();
  } else return;
  signaler();
});
// Les champs numériques se mettent à jour pendant la frappe pour que le calendrier suive.
formulaire.addEventListener('input', ev => {
  const cible = ev.target as HTMLInputElement;
  if (['adultes', 'enfants', 'chevaux', 'lits'].includes(cible.name)) { lireChoix(); calendrier.rafraichir(); signaler(); }
});

champ('effacer-dates').addEventListener('click', () => {
  etat.arrivee = null; etat.depart = null;
  Object.assign(etat, nettoyerRepas(etat));
  afficherDates(); afficherRepas(); calendrier.rafraichir();
  signaler();
});

lireChoix();
afficherDates();
brancherEnvoi({ etat, regles, text, siteKey: donnees.siteKey, nomsUnites, apresConflit: () => { calendrier.invalider(); devis.actualiser(); } });
formulaire.hidden = false;
