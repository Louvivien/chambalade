import { corpsBlocage, validerBlocage, type FormulaireBlocage } from '../../lib/admin/blocages';
import { ErreurApi } from '../../lib/admin/api';
import { dateParis } from '../../lib/reservation/dates';
import { dateLongue } from '../../lib/reservation/dates';
import { remplir } from '../../lib/reserver/formats';
import { el, vider } from '../dom';
import type { Montage } from './contexte';

interface Blocage { id: number; unite: string; date_debut: string; date_fin: string; motif: string; note: string | null }
const complete = (d: string) => `${dateLongue(d)} ${d.slice(0, 4)}`;

/** Message qui survit au rechargement de la liste (création ou suppression réussie). */
let message: { texte: string; conflits: Array<{ id: number; reference: string; statut: string }> } | null = null;

export const monter: Montage = async (zone, ctx) => {
  const t = ctx.text.blocages;
  const unites = ctx.text.unites as Record<string, string>;
  const motifs = t.motifs as Record<string, string>;
  const statuts = ctx.text.statuts as Record<string, string>;
  const r = await ctx.api<{ blocages: Blocage[] }>('GET', 'blocages');

  const unite = el('select', { id: 'bl-unite', required: true }, [el('option', { value: '' }, ['—']), ...Object.entries(unites).map(([v, l]) => el('option', { value: v }, [l]))]);
  const debut = el('input', { id: 'bl-debut', type: 'date', min: dateParis(new Date()) });
  const fin = el('input', { id: 'bl-fin', type: 'date', min: dateParis(new Date()) });
  const motif = el('select', { id: 'bl-motif' }, [el('option', { value: '' }, ['—']), ...Object.entries(motifs).map(([v, l]) => el('option', { value: v }, [l]))]);
  const note = el('input', { id: 'bl-note', type: 'text', maxlength: 500 });
  const erreur = el('p', { class: 'erreur', role: 'alert', hidden: true });
  const envoyer = el('button', { type: 'submit', class: 'bouton' }, [t.create]);
  const champs = { unite, debut, fin, motif } as const;
  const form = el('form', { class: 'action-form', novalidate: true, 'aria-labelledby': 'bl-titre' }, [
    el('h2', { id: 'bl-titre' }, [t.formTitle]),
    el('div', { class: 'champ' }, [el('label', { for: 'bl-unite' }, [t.unitLabel]), unite]),
    el('div', { class: 'champ' }, [el('label', { for: 'bl-debut' }, [t.startLabel]), debut]),
    el('div', { class: 'champ' }, [el('label', { for: 'bl-fin' }, [t.endLabel]), fin]),
    el('div', { class: 'champ' }, [el('label', { for: 'bl-motif' }, [t.motifLabel]), motif]),
    el('div', { class: 'champ' }, [el('label', { for: 'bl-note' }, [t.noteLabel]), note]),
    erreur, envoyer,
  ]);

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    erreur.hidden = true;
    for (const c of Object.values(champs)) c.removeAttribute('aria-invalid');
    const f: FormulaireBlocage = { unite: unite.value, debut: debut.value, fin: fin.value, motif: motif.value, note: note.value };
    const problemes = validerBlocage(f, t.errors);
    if (problemes.length > 0) {
      for (const p of problemes) champs[p.champ].setAttribute('aria-invalid', 'true');
      erreur.textContent = [...new Set(problemes.map(p => p.message))].join(' ');
      erreur.hidden = false;
      champs[problemes[0].champ].focus();
      return;
    }
    envoyer.disabled = true;
    try {
      const rep = await ctx.api<{ conflits: Array<{ id: number; reference: string; statut: string }> }>('POST', 'blocages', corpsBlocage(f));
      message = { texte: t.created, conflits: rep.conflits };
      await monter(zone, ctx, {});
    } catch (e) {
      envoyer.disabled = false;
      erreur.textContent = e instanceof ErreurApi ? e.message : ctx.text.common.errors.server;
      erreur.hidden = false;
    }
  });

  // — Liste des blocages à venir, avec suppression en deux temps —
  const liste = el('ul', { class: 'liste-blocages' });
  for (const b of r.blocages) {
    const nom = unites[b.unite] ?? b.unite;
    const supprimer = el('button', { type: 'button', class: 'bouton-secondaire' }, [t.delete]);
    const zoneConfirmation = el('div', { class: 'confirmation-suppression' });
    supprimer.addEventListener('click', () => {
      vider(zoneConfirmation);
      const oui = el('button', { type: 'button', class: 'bouton' }, [ctx.text.fiche.confirm]);
      const non = el('button', { type: 'button', class: 'bouton-secondaire' }, [ctx.text.common.cancel]);
      zoneConfirmation.append(el('p', { role: 'alert' }, [remplir(t.deleteConfirm, { unite: nom, debut: complete(b.date_debut), fin: complete(b.date_fin) })]), el('div', { class: 'action-boutons' }, [oui, non]));
      oui.focus();
      non.addEventListener('click', () => { vider(zoneConfirmation); supprimer.focus(); });
      oui.addEventListener('click', async () => {
        oui.disabled = true; non.disabled = true;
        try { await ctx.api('DELETE', `blocages/${b.id}`); message = { texte: t.deleted, conflits: [] }; await monter(zone, ctx, {}); }
        catch (e) { oui.disabled = false; non.disabled = false; zoneConfirmation.append(el('p', { class: 'erreur', role: 'alert' }, [e instanceof ErreurApi ? e.message : ctx.text.common.errors.server])); }
      });
    });
    liste.append(el('li', { class: 'bloc-item' }, [
      el('p', {}, [el('strong', {}, [nom]), ` · ${remplir(ctx.text.demandes.period, { debut: complete(b.date_debut), fin: complete(b.date_fin) })}`]),
      el('p', {}, [`${motifs[b.motif] ?? b.motif}${b.note ? ` · ${b.note}` : ''}`]),
      supprimer, zoneConfirmation,
    ]));
  }

  vider(zone);
  zone.append(el('p', {}, [t.intro]));
  if (message) {
    const resultatMsg = message;
    message = null;
    zone.append(el('p', { class: 'resultat', role: 'status' }, [resultatMsg.texte]));
    ctx.annoncer(resultatMsg.texte);
    if (resultatMsg.conflits.length > 0) {
      zone.append(el('div', { class: 'conflits', role: 'alert' }, [el('p', {}, [t.conflicts]), el('ul', {}, resultatMsg.conflits.map(c => el('li', {}, [el('a', { href: `#demande-${c.id}` }, [c.reference]), ` · ${statuts[c.statut] ?? c.statut}`])))]));
    }
  }
  zone.append(form, el('h2', {}, [t.list]), r.blocages.length > 0 ? liste : el('p', {}, [t.empty]));
};
