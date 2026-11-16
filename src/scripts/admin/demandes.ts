import { lignesListe, type DemandeListe } from '../../lib/admin/demandes';
import { remplir } from '../../lib/reserver/formats';
import { el, vider } from '../dom';
import type { Montage } from './contexte';

let filtre = '';

export const monter: Montage = async (zone, ctx) => {
  const t = ctx.text.demandes;
  const statuts = ctx.text.statuts as Record<string, string>;

  const select = el('select', { id: 'filtre-statut' }, [
    el('option', { value: '' }, [t.filterAll]),
    ...Object.entries(statuts).map(([valeur, libelle]) => el('option', { value: valeur }, [libelle])),
  ]);
  select.value = filtre;
  const actualiser = el('button', { type: 'button', class: 'bouton-secondaire' }, [t.refresh]);
  const resume = el('p', { class: 'resume-liste', role: 'status' });
  const liste = el('div', { class: 'liste-zone' });
  vider(zone);
  zone.append(el('div', { class: 'barre-outils' }, [el('div', { class: 'champ-ligne' }, [el('label', { for: 'filtre-statut' }, [t.filterLabel]), select]), actualiser]), resume, liste);

  async function charger() {
    liste.setAttribute('aria-busy', 'true');
    try {
      const r = await ctx.api<{ demandes: DemandeListe[] }>('GET', `demandes${filtre ? `?statut=${filtre}` : ''}`);
      const lignes = lignesListe(r.demandes, t);
      const aTraiter = r.demandes.filter(d => d.statut === 'en_attente').length;
      resume.textContent = aTraiter > 0 ? remplir(t.openCount, { n: aTraiter }) : '';
      vider(liste);
      if (lignes.length === 0) { liste.append(el('p', {}, [t.empty])); return; }
      const ul = el('ul', { class: 'liste-demandes' });
      for (const l of lignes) {
        ul.append(el('li', {}, [el('a', { class: `demande-lien${l.urgente ? ' urgente' : ''}`, href: `#demande-${l.id}` }, [
          el('span', { class: 'demande-id' }, [el('strong', {}, [l.reference]), ` · ${l.nom}`]),
          el('span', { class: `statut statut-${l.statut}` }, [statuts[l.statut] ?? l.statut]),
          el('span', { class: 'demande-dates' }, [remplir(t.period, { debut: l.sejour[0], fin: l.sejour[1] })]),
          el('span', { class: 'demande-personnes' }, [l.personnes]),
          el('span', { class: 'demande-total' }, [`${t.total} : ${l.total}`]),
          ...(l.reste ? [el('span', { class: 'demande-reste' }, [l.reste])] : []),
        ])]));
      }
      liste.append(ul);
    } finally {
      liste.removeAttribute('aria-busy');
    }
  }

  select.addEventListener('change', () => { filtre = select.value; void charger().catch(() => undefined); });
  actualiser.addEventListener('click', () => { void charger().then(() => ctx.annoncer(resume.textContent ?? '')).catch(() => undefined); });
  await charger();
};
