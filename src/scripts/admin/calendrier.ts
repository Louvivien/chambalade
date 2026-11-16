import { construireMois, jourDeSemaine, jourDuMois, libelleCellule, moisEstValide, moisVoisin, texteCellule, type CelluleCal, type DonneesCalendrier } from '../../lib/admin/calendrier';
import { dateParis } from '../../lib/reservation/dates';
import { dateLongue } from '../../lib/reservation/dates';
import { remplir } from '../../lib/reserver/formats';
import { el, vider } from '../dom';
import type { Montage } from './contexte';

const NOM_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const JOURS_COURTS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

export const monter: Montage = async (zone, ctx, params) => {
  const t = ctx.text.calendrier;
  const unites = ctx.text.unites as Record<string, string>;
  const courant = dateParis(new Date()).slice(0, 7);
  const mois = typeof params.mois === 'string' && moisEstValide(params.mois) ? params.mois : courant;
  const donnees = await ctx.api<DonneesCalendrier>('GET', `calendrier?mois=${mois}`);
  const m = construireMois(donnees);
  const titreMois = NOM_MOIS.format(new Date(`${mois}-01T00:00:00Z`));

  const precedent = el('button', { type: 'button', class: 'bouton-secondaire' }, [t.previous]);
  const suivant = el('button', { type: 'button', class: 'bouton-secondaire' }, [t.next]);
  const aujourdhui = el('button', { type: 'button', class: 'bouton-secondaire' }, [t.today]);
  precedent.addEventListener('click', () => ctx.aller(`#calendrier-${moisVoisin(mois, -1)}`));
  suivant.addEventListener('click', () => ctx.aller(`#calendrier-${moisVoisin(mois, 1)}`));
  aujourdhui.addEventListener('click', () => ctx.aller('#calendrier'));
  aujourdhui.disabled = mois === courant;

  const details = el('div', { class: 'cal-details', role: 'region', 'aria-live': 'polite', 'aria-label': t.details });

  function montrerDetails(c: CelluleCal) {
    vider(details);
    details.append(el('h3', {}, [`${unites[c.unite]}, ${dateLongue(c.jour)}`]));
    if (c.blocage) {
      const motif = (ctx.text.blocages.motifs as Record<string, string>)[c.blocage.motif] ?? c.blocage.motif;
      details.append(el('p', {}, [el('strong', {}, [t.states.bloque]), ` : ${motif}${c.blocage.note ? `, ${c.blocage.note}` : ''} `, el('a', { href: '#blocages' }, [ctx.text.header.nav.blocages])]));
    }
    const ul = el('ul', { class: 'cal-details-liste' });
    for (const o of c.occupants) {
      ul.append(el('li', {}, [el('a', { href: `#demande-${o.demande_id}` }, [remplir(t.openRequest, { reference: o.reference })]), ` · ${o.prenom ? `${o.prenom} ` : ''}${o.nom} · ${t.states[o.statut]} · ${remplir(t.quantity, { n: o.quantite })}`]));
    }
    details.append(ul);
  }

  const entete = el('tr', {}, [el('th', { scope: 'col', class: 'cal-unite' }, [t.unit]), ...m.jours.map(j => {
    const s = jourDeSemaine(j);
    return el('th', { scope: 'col', class: s >= 6 ? 'weekend' : '', abbr: dateLongue(j) }, [String(jourDuMois(j)), el('span', { class: 'cal-sem' }, [JOURS_COURTS[s - 1]])]);
  })]);
  const corps = el('tbody');
  for (const ligne of m.lignes) {
    const tr = el('tr', {}, [el('th', { scope: 'row', class: 'cal-unite' }, [unites[ligne.unite]])]);
    for (const c of ligne.cellules) {
      const td = el('td', { class: jourDeSemaine(c.jour) >= 6 ? 'weekend' : '' });
      if (c.etat !== 'libre') {
        const b = el('button', { type: 'button', class: `cell etat-${c.etat}${c.conflit ? ' conflit' : ''}`, 'aria-label': libelleCellule(c, { ...t, unites, capacityUnknown: t.capacityUnknown }) }, [texteCellule(c, t.codes)]);
        b.addEventListener('click', () => montrerDetails(c));
        td.append(b);
      }
      tr.append(td);
    }
    corps.append(tr);
  }

  vider(zone);
  zone.append(
    el('div', { class: 'barre-outils' }, [el('h2', { class: 'cal-mois', 'aria-live': 'polite' }, [titreMois]), el('div', { class: 'action-boutons' }, [precedent, aujourdhui, suivant])]),
    el('div', { class: 'cal-defile', role: 'region', 'aria-label': `${t.title}, ${titreMois}`, tabindex: 0 }, [el('table', { class: 'cal-admin' }, [el('caption', { class: 'visuellement-cache' }, [`${t.title}, ${titreMois}`]), el('thead', {}, [entete]), corps])]),
    el('div', { class: 'cal-legende' }, [el('h3', {}, [t.legendTitle]), el('ul', {}, ['confirmee', 'acceptee', 'en_attente', 'bloque'].map(e => el('li', {}, [el('span', { class: `cell etat-${e}`, 'aria-hidden': 'true' }, [t.codes[e]]), ` ${t.states[e]}`])))]),
    el('p', { class: 'aide' }, [t.note]),
    details,
  );
};
