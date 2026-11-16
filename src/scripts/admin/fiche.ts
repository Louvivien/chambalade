import { dateHeure, dureeRestante, eurosEnCentimes, nombreDeNuits } from '../../lib/admin/demandes';
import { ErreurApi } from '../../lib/admin/api';
import { actionsPossibles, type ActionDemande } from '../../lib/reservation/transitions';
import type { Statut } from '../../lib/reservation/types';
import type { DevisApi } from '../../lib/reserver/devis';
import { dateComplete, euros, remplir } from '../../lib/reserver/formats';
import { dessinerDevis } from '../devis';
import { el, trouver, vider } from '../dom';
import type { ContexteAdmin, Montage } from './contexte';

interface Fiche {
  id: number; reference: string; statut: Statut; date_arrivee: string; date_depart: string; nb_adultes: number; nb_enfants: number; nb_chevaux: number;
  nom: string; prenom: string; email: string; telephone: string | null; message: string | null; langue: 'fr' | 'en';
  expire_at: string | null; acompte_cents: number | null;
  choix: { chambres?: string[]; litsDortoir?: number; diners?: Array<{ date: string }>; dejeuners?: Array<{ date: string }> };
  devis: DevisApi;
}
interface LigneJournal { action: string; auteur: string; detail: string | null; created_at: string }

/** Résultat de la dernière action, montré après le rechargement de la fiche. */
let resultat: string | null = null;

const ligne = (libelle: string, valeur: Array<Node | string> | string) => el('div', {}, [el('dt', {}, [libelle]), el('dd', {}, Array.isArray(valeur) ? valeur : [valeur])]);

export const monter: Montage = async (zone, ctx, params) => {
  const id = Number(params.id);
  const t = ctx.text.fiche;
  const statuts = ctx.text.statuts as Record<string, string>;
  const r = await ctx.api<{ demande: Fiche; journal: LigneJournal[] }>('GET', `demandes/${id}`);
  const d = r.demande;
  trouver('titre-fiche').textContent = `${d.reference} · ${d.prenom} ${d.nom}`;
  vider(zone);

  zone.append(el('p', {}, [el('a', { href: '#demandes' }, [ctx.text.common.back])]));
  if (resultat) { zone.append(el('p', { class: 'resultat', role: 'status' }, [resultat])); ctx.annoncer(resultat); resultat = null; }

  const restant = d.expire_at ? Math.round((Date.parse(d.expire_at) - Date.now()) / 1000) : null;
  zone.append(el('p', { class: 'fiche-statut' }, [
    el('span', { class: `statut statut-${d.statut}` }, [statuts[d.statut] ?? d.statut]),
    ...(d.expire_at && (d.statut === 'en_attente' || d.statut === 'acceptee')
      ? [` ${t.deadline} : ${dateHeure(d.expire_at)}${restant !== null && restant > 0 ? ` (${remplir(ctx.text.demandes.expiresIn, { duree: dureeRestante(restant, ctx.text.demandes) })})` : ''}`] : []),
  ]));

  // — Séjour —
  const n = nombreDeNuits(d.date_arrivee, d.date_depart);
  const heberg = [...(d.choix.chambres ?? []).map(c => (t.rooms as Record<string, string>)[c] ?? c), ...((d.choix.litsDortoir ?? 0) > 0 ? [remplir(t.dormitory, { n: d.choix.litsDortoir ?? 0 })] : [])];
  const repas = [...((d.choix.diners?.length ?? 0) > 0 ? [remplir(t.dinners, { n: d.choix.diners!.length })] : []), ...((d.choix.dejeuners?.length ?? 0) > 0 ? [remplir(t.lunches, { n: d.choix.dejeuners!.length })] : [])];
  zone.append(el('section', { class: 'fiche-bloc' }, [
    el('h2', {}, [t.stay]),
    el('dl', { class: 'fiche-liste' }, [
      ligne(t.arrival, dateComplete(d.date_arrivee)), ligne(t.departure, dateComplete(d.date_depart)), ligne('', remplir(t.nights, { n })),
      ligne(t.group, [remplir(ctx.text.demandes.adults, { n: d.nb_adultes }), ...(d.nb_enfants > 0 ? [`, ${remplir(ctx.text.demandes.children, { n: d.nb_enfants })}`] : []), ...(d.nb_chevaux > 0 ? [`, ${remplir(ctx.text.demandes.horses, { n: d.nb_chevaux })}`] : [])]),
      ligne(t.lodging, heberg.join(', ')),
      ligne(t.meals, repas.length > 0 ? repas.join(', ') : t.noMeals),
    ]),
  ]));

  // — Coordonnées (texte brut : aucune donnée de cliente n’est interprétée comme du HTML) —
  zone.append(el('section', { class: 'fiche-bloc' }, [
    el('h2', {}, [t.contact]),
    el('dl', { class: 'fiche-liste' }, [
      ligne('', `${d.prenom} ${d.nom}`),
      ligne('E-mail', [el('a', { href: `mailto:${encodeURIComponent(d.email).replace(/%40/g, '@')}` }, [d.email])]),
      ...(d.telephone ? [ligne('Téléphone', [el('a', { href: `tel:${d.telephone.replace(/[^\d+]/g, '')}` }, [d.telephone])])] : []),
      ligne(t.language, (t.languages as Record<string, string>)[d.langue] ?? d.langue),
      ligne(t.message, [el('span', { class: 'message-cliente' }, [d.message ?? t.noMessage])]),
    ]),
  ]));

  // — Devis enregistré —
  const zoneDevis = el('div', { class: 'devis-recap' });
  dessinerDevis(zoneDevis, d.devis, {
    pending: t.quotePending, included: t.quoteIncluded, lines: t.lines, total: t.quoteTotal, deposit: t.deposit, depositUnknown: '',
    provisional: t.quoteProvisional, incomplete: t.quoteIncomplete, empty: '', availabilityWarning: '', updating: '', error: '',
  }, t.rooms);
  zone.append(el('section', { class: 'fiche-bloc' }, [el('h2', {}, [t.quote]), zoneDevis,
    el('p', {}, [`${t.deposit} : ${d.acompte_cents !== null ? euros(d.acompte_cents) : t.depositNone}`])]));

  // — Actions —
  const actions = actionsPossibles(d.statut);
  const zoneAction = el('div', { class: 'action-zone' });
  const boutons = el('div', { class: 'action-boutons' });
  for (const a of actions) {
    const b = el('button', { type: 'button', class: a === 'refuser' || a === 'annuler' ? 'bouton-secondaire' : 'bouton' }, [t.action[a]]);
    b.addEventListener('click', () => ouvrirFormulaire(a, b));
    boutons.append(b);
  }
  zone.append(el('section', { class: 'fiche-bloc' }, [el('h2', {}, [t.actions]), actions.length > 0 ? boutons : el('p', {}, [t.noActions]), zoneAction]));

  function ouvrirFormulaire(action: ActionDemande, declencheur: HTMLElement) {
    vider(zoneAction);
    const idTitre = `action-titre-${action}`;
    const message = el('textarea', { id: 'action-message', rows: 4, maxlength: 1000, 'aria-describedby': 'action-message-aide' });
    const acompte = el('input', { id: 'action-acompte', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-describedby': 'action-acompte-aide' });
    if (action === 'accepter' && d.devis.acompte_cents !== null) acompte.value = String(d.devis.acompte_cents / 100).replace('.', ',');
    const heures = el('select', { id: 'action-heures' }, Object.entries(t.extendOptions as Record<string, string>).map(([v, libelle]) => el('option', { value: v }, [libelle])));
    const erreur = el('p', { class: 'erreur', role: 'alert', hidden: true });
    const envoyer = el('button', { type: 'submit', class: 'bouton' }, [t.confirm]);
    const annuler = el('button', { type: 'button', class: 'bouton-secondaire' }, [ctx.text.common.cancel]);
    const form = el('form', { class: 'action-form', 'aria-labelledby': idTitre, novalidate: true }, [
      el('h3', { id: idTitre }, [t.action[action]]),
      el('p', {}, [t.actionHelp[action]]),
      ...(action !== 'prolonger' ? [el('div', { class: 'champ' }, [el('label', { for: 'action-message' }, [t.messageLabel]), message, el('p', { class: 'aide', id: 'action-message-aide' }, [t.messageHint])])] : []),
      ...(action === 'accepter' ? [el('div', { class: 'champ' }, [el('label', { for: 'action-acompte' }, [t.depositLabel]), acompte, el('p', { class: 'aide pending', id: 'action-acompte-aide' }, [t.depositHint])])] : []),
      ...(action === 'prolonger' ? [el('div', { class: 'champ' }, [el('label', { for: 'action-heures' }, [t.extendLabel]), heures])] : []),
      erreur, el('div', { class: 'action-boutons' }, [envoyer, annuler]),
    ]);
    zoneAction.append(form);
    (action === 'prolonger' ? heures : message).focus();

    annuler.addEventListener('click', () => { vider(zoneAction); declencheur.focus(); });
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      erreur.hidden = true;
      const corps: Record<string, unknown> = { action };
      if (action !== 'prolonger' && message.value.trim()) corps.message = message.value.trim();
      if (action === 'prolonger') corps.heures = Number(heures.value);
      if (action === 'accepter') {
        const c = eurosEnCentimes(acompte.value);
        if (c === 'invalide') { erreur.textContent = t.depositInvalid; erreur.hidden = false; acompte.focus(); return; }
        if (c !== null) corps.acompte_cents = c;
      }
      envoyer.disabled = true; annuler.disabled = true; envoyer.textContent = t.working;
      try {
        const rep = await ctx.api<{ email: string | null }>('POST', `demandes/${id}/actions`, corps);
        resultat = [t.done, rep.email ? (t.email as Record<string, string>)[rep.email] : null].filter(Boolean).join(' ');
        await monter(zone, ctx, params);
      } catch (e) {
        envoyer.disabled = false; annuler.disabled = false; envoyer.textContent = t.confirm;
        erreur.textContent = e instanceof ErreurApi ? e.message : ctx.text.common.errors.server;
        erreur.hidden = false;
      }
    });
  }

  // — Historique —
  const par = (a: string) => (ctx.text.fiche.journalBy as Record<string, string>)[a] ?? a;
  zone.append(el('section', { class: 'fiche-bloc' }, [el('h2', {}, [t.journal]), el('ol', { class: 'journal' }, r.journal.map(j => el('li', {}, [
    el('time', { datetime: j.created_at }, [dateHeure(j.created_at)]), ' · ',
    el('strong', {}, [(t.journalActions as Record<string, string>)[j.action] ?? j.action]), ` (${par(j.auteur)})`,
    ...(j.detail ? [el('span', { class: 'journal-detail' }, [` : ${j.detail}`])] : []),
  ])))]));
};
