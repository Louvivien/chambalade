import { nomCourt, lignesVue, messagesDisponibilite, type DevisApi, type TextesDevis } from '../lib/reserver/devis';
import { euros } from '../lib/reserver/formats';
import type { DemandeSejour } from '../lib/reservation/types';
import { el, vider } from './dom';

export interface TextesDevisDom extends TextesDevis {
  total: string; deposit: string; depositUnknown: string; provisional: string; incomplete: string; empty: string;
  availabilityWarning: string; updating: string; error: string;
}

/** Dessine un devis (celui de l’API, jamais un calcul local) dans une zone. */
export function dessinerDevis(zone: HTMLElement, devis: DevisApi, t: TextesDevisDom, nomsUnites: Record<string, string>, avertissements: string[] = []) {
  vider(zone);
  const liste = el('ul', { class: 'devis-lignes' });
  for (const l of lignesVue(devis, t, nomsUnites)) {
    liste.append(el('li', {}, [
      el('span', {}, [l.libelle, ...(l.detail ? [el('span', { class: 'detail' }, [l.detail])] : [])]),
      el('span', { class: 'montant' }, [l.montant]),
    ]));
  }
  zone.append(liste);
  zone.append(el('p', { class: 'devis-total' }, [el('span', {}, [t.total]), el('span', {}, [euros(devis.total_cents)])]));
  zone.append(el('p', { class: 'aide' }, [devis.acompte_cents !== null ? `${t.deposit} : ${euros(devis.acompte_cents)}` : t.depositUnknown]));
  if (devis.provisoire) zone.append(el('p', { class: 'aide alerte' }, [t.provisional]));
  if (!devis.complet) zone.append(el('p', { class: 'aide alerte' }, [t.incomplete]));
  if (avertissements.length > 0) {
    zone.append(el('div', { class: 'alerte' }, [el('p', {}, [t.availabilityWarning]), el('ul', {}, avertissements.map(m => el('li', {}, [m])))]));
  }
}

interface OptionsDevis {
  zone: HTMLElement;
  textes: TextesDevisDom;
  nomsUnites: Record<string, string>;
  sejour: () => DemandeSejour | null;
}

/** Devis en direct : redemandé à l’API (délai de frappe) à chaque changement du séjour. */
export function creerDevis(o: OptionsDevis) {
  let minuteur: number | undefined;
  let requete: AbortController | undefined;

  async function actualiser() {
    requete?.abort();
    const sejour = o.sejour();
    if (!sejour) { vider(o.zone); o.zone.append(el('p', { class: 'aide' }, [o.textes.empty])); return; }
    requete = new AbortController();
    o.zone.setAttribute('aria-busy', 'true');
    try {
      const reponse = await fetch('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sejour), signal: requete.signal });
      const corps = await reponse.json().catch(() => null) as { ok?: boolean; devis?: DevisApi; disponibilite?: { erreurs: Array<{ message: string }> }; erreurs?: Array<{ message: string }>; erreur?: { message?: string } } | null;
      if (reponse.ok && corps?.devis) {
        dessinerDevis(o.zone, corps.devis, o.textes, o.nomsUnites, messagesDisponibilite(corps.disponibilite?.erreurs ?? []));
      } else {
        // Séjour hors règles : on dit précisément pourquoi (message de l’API), sinon message général.
        vider(o.zone);
        const messages = [...(corps?.erreurs ?? []).map(e => e.message), corps?.erreur?.message].filter((m): m is string => !!m);
        o.zone.append(el('div', { class: 'alerte' }, messages.length > 0 ? [el('ul', {}, messages.map(m => el('li', {}, [m])))] : [el('p', {}, [o.textes.error])]));
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      vider(o.zone);
      o.zone.append(el('p', { class: 'alerte' }, [o.textes.error]));
    } finally {
      o.zone.removeAttribute('aria-busy');
    }
  }

  return { planifier: () => { window.clearTimeout(minuteur); minuteur = window.setTimeout(() => void actualiser(), 350); }, actualiser };
}

export { nomCourt };
