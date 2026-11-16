import { corpsDemande, messagesDErreur, validerFormulaire, type ProblemeChamp, type TextesErreurs } from '../lib/reserver/envoi';
import { dateComplete } from '../lib/reserver/formats';
import { nomCourt, type DevisApi } from '../lib/reserver/devis';
import { sejourDepuisEtat } from '../lib/reserver/sejour';
import type { Contact, EtatFormulaire, Regles } from '../lib/reserver/types';
import { dessinerDevis, type TextesDevisDom } from './devis';
import { el, trouver, vider } from './dom';

interface Turnstile { render(cible: string | HTMLElement, options: Record<string, unknown>): string; reset(id?: string): void }
declare global { interface Window { turnstile?: Turnstile } }

interface OptionsEnvoi {
  etat: EtatFormulaire; regles: Regles; text: Record<string, any>; siteKey: string;
  nomsUnites: Record<string, string>;
  /** Après un refus du serveur sur les places : relire les disponibilités et le devis. */
  apresConflit: () => void;
}

const CHAMPS_ERREUR: Record<string, string> = { dates: 'erreur-dates', hebergement: 'erreur-hebergement', nom: 'erreur-nom', prenom: 'erreur-prenom', email: 'erreur-email', consentement: 'erreur-consentement', antirobot: 'erreur-antirobot' };
const CHAMPS_SAISIE: Record<string, string> = { nom: 'nom', prenom: 'prenom', email: 'email', consentement: 'consentement' };

export function brancherEnvoi(o: OptionsEnvoi) {
  const { etat, regles, text, siteKey } = o;
  const formulaire = trouver<HTMLFormElement>('formulaire');
  const bouton = trouver<HTMLButtonElement>('envoyer');
  const erreurEnvoi = trouver('erreur-envoi');
  const resume = trouver('resume-erreurs');
  let jeton: string | null = null;
  let widget: string | undefined;

  // — Turnstile : on attend que son script (chargé en différé) soit prêt —
  function monterTurnstile(essai = 0) {
    if (!siteKey) { montrer('erreur-antirobot', text.submit.missingKey); bouton.disabled = true; return; }
    // Le script de Cloudflare crée `window.turnstile` avant d’être réellement prêt : on attend `render`.
    if (typeof window.turnstile?.render !== 'function') {
      if (essai > 50) { montrer('erreur-antirobot', text.submit.missingKey); return; }
      window.setTimeout(() => monterTurnstile(essai + 1), 200);
      return;
    }
    try {
      widget = window.turnstile.render('#turnstile', {
        sitekey: siteKey, language: 'fr',
        callback: (t: string) => { jeton = t; cacher('erreur-antirobot'); },
        'expired-callback': () => { jeton = null; },
        'error-callback': () => { jeton = null; },
      });
    } catch {
      // Une panne de la vérification ne doit pas empêcher d’afficher le formulaire : le message l’explique.
      montrer('erreur-antirobot', text.submit.missingKey);
    }
  }
  const reinitialiserTurnstile = () => { jeton = null; if (widget !== undefined) window.turnstile?.reset(widget); };

  function montrer(id: string, message: string) { const e = trouver(id); e.textContent = message; e.hidden = false; }
  function cacher(id: string) { const e = trouver(id); e.hidden = true; e.textContent = ''; }

  function nettoyerErreurs() {
    resume.hidden = true; vider(resume.querySelector('ul')!);
    for (const id of Object.values(CHAMPS_ERREUR)) cacher(id);
    cacher('erreur-envoi');
    for (const id of Object.values(CHAMPS_SAISIE)) { const c = document.getElementById(id); c?.removeAttribute('aria-invalid'); c?.removeAttribute('aria-errormessage'); }
  }

  function focusCible(champ: string) {
    const cible = champ === 'dates' ? document.querySelector<HTMLElement>('#calendrier button[tabindex="0"]')
      : champ === 'hebergement' ? document.querySelector<HTMLElement>('input[name="chambres"]')
      : champ === 'antirobot' ? trouver('turnstile')
      : document.getElementById(CHAMPS_SAISIE[champ] ?? champ);
    if (cible) { if (!cible.hasAttribute('tabindex') && !(cible instanceof HTMLInputElement) && !(cible instanceof HTMLButtonElement)) cible.setAttribute('tabindex', '-1'); cible.focus(); }
  }

  function montrerProblemes(problemes: ProblemeChamp[]) {
    const liste = resume.querySelector('ul')!;
    for (const p of problemes) {
      montrer(CHAMPS_ERREUR[p.champ], p.message);
      const saisie = document.getElementById(CHAMPS_SAISIE[p.champ] ?? '');
      if (saisie) { saisie.setAttribute('aria-invalid', 'true'); saisie.setAttribute('aria-errormessage', CHAMPS_ERREUR[p.champ]); }
      const lien = el('a', { href: `#${CHAMPS_SAISIE[p.champ] ?? CHAMPS_ERREUR[p.champ]}` }, [p.message]);
      lien.addEventListener('click', ev => { ev.preventDefault(); focusCible(p.champ); });
      liste.append(el('li', {}, [lien]));
    }
    resume.hidden = false;
    resume.focus();
  }

  const contact = (): Contact => ({
    nom: trouver<HTMLInputElement>('nom').value, prenom: trouver<HTMLInputElement>('prenom').value, email: trouver<HTMLInputElement>('email').value,
    telephone: trouver<HTMLInputElement>('telephone').value, message: trouver<HTMLTextAreaElement>('message').value,
  });

  formulaire.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (bouton.disabled) return;
    nettoyerErreurs();
    const e: TextesErreurs = text.errors;
    const problemes = validerFormulaire(etat, contact(), trouver<HTMLInputElement>('consentement').checked, jeton, e, text.errors.fields);
    if (problemes.length > 0) { montrerProblemes(problemes); return; }
    const sejour = sejourDepuisEtat(etat, regles);
    if (!sejour) { montrerProblemes([{ champ: 'hebergement', message: e.noLodging }]); return; }

    bouton.disabled = true;
    bouton.textContent = text.submit.sending;
    try {
      let reponse: Response;
      try {
        reponse = await fetch('/api/demandes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpsDemande(sejour, contact(), jeton!)) });
      } catch {
        montrer('erreur-envoi', e.network);
        return;
      }
      const corps = await reponse.json().catch(() => null);
      // Un jeton Turnstile ne sert qu’une fois, quelle que soit l’issue.
      reinitialiserTurnstile();
      if (reponse.status === 201) { afficherConfirmation(corps as { reference: string; devis: DevisApi }); return; }
      const messages = messagesDErreur(reponse.status, corps, Number(reponse.headers.get('Retry-After')) || null, e);
      const zone = trouver('erreur-envoi');
      vider(zone);
      zone.append(...messages.flatMap((m, i) => (i === 0 ? [m] : [el('br'), m])));
      zone.hidden = false;
      zone.focus?.();
      if (reponse.status === 409 || reponse.status === 422) o.apresConflit();
    } finally {
      bouton.disabled = !siteKey;
      bouton.textContent = text.submit.label;
    }
  });

  // Le résumé suit les corrections : une ligne disparaît dès que son problème est réglé, le bloc avec la dernière.
  function actualiserResume() {
    if (resume.hidden) return;
    const restants = new Set(validerFormulaire(etat, contact(), trouver<HTMLInputElement>('consentement').checked, jeton, text.errors, text.errors.fields).map(p => p.champ));
    for (const [champ, id] of Object.entries(CHAMPS_ERREUR)) {
      if (restants.has(champ) || trouver(id).hidden) continue;
      cacher(id);
      const saisie = document.getElementById(CHAMPS_SAISIE[champ] ?? '');
      saisie?.removeAttribute('aria-invalid');
    }
    for (const li of [...resume.querySelectorAll('li')]) {
      const lien = li.querySelector('a')!;
      const champ = Object.entries(CHAMPS_SAISIE).find(([, id]) => lien.getAttribute('href') === `#${id}`)?.[0] ?? lien.getAttribute('href')!.replace('#erreur-', '');
      if (!restants.has(champ)) li.remove();
    }
    if (resume.querySelectorAll('li').length === 0) resume.hidden = true;
  }
  formulaire.addEventListener('input', ev => {
    const c = ev.target as HTMLElement;
    if (c.id && CHAMPS_SAISIE[c.id]) { c.removeAttribute('aria-invalid'); cacher(CHAMPS_ERREUR[c.id]); }
    actualiserResume();
  });
  formulaire.addEventListener('change', actualiserResume);
  document.addEventListener('reserver:change', actualiserResume);
  trouver('consentement').addEventListener('change', () => { cacher('erreur-consentement'); trouver('consentement').removeAttribute('aria-invalid'); });

  function afficherConfirmation(r: { reference: string; devis: DevisApi }) {
    trouver('confirmation-reference').textContent = r.reference;
    const recap = trouver('confirmation-recap');
    vider(recap);
    const ligne = (dt: string, dd: string[]) => el('div', {}, [el('dt', {}, [dt]), ...dd.map(d => el('dd', {}, [d]))]);
    const hebergement = [...etat.chambres.map(c => nomCourt(text.lodging.rooms[c])), ...(etat.litsDortoir > 0 ? [`${text.lodging.dormitory.split(' (')[0]} : ${etat.litsDortoir}`] : [])];
    recap.append(el('dl', { class: 'recap' }, [
      ligne(text.dates.arrival, [dateComplete(etat.arrivee!)]),
      ligne(text.dates.departure, [dateComplete(etat.depart!)]),
      ligne(text.group.adults, [String(etat.adultes)]),
      ...(etat.enfants > 0 ? [ligne(text.group.children, [String(etat.enfants)])] : []),
      ...(etat.chevaux > 0 ? [ligne(text.group.horses, [String(etat.chevaux)])] : []),
      ligne(text.lodging.legend, hebergement),
    ]));
    const zoneDevis = el('div', { class: 'devis-recap' });
    recap.append(el('h4', {}, [text.quote.title]), zoneDevis, el('p', { class: 'aide' }, [text.quote.mention]));
    dessinerDevis(zoneDevis, r.devis, text.quote, o.nomsUnites);
    formulaire.hidden = true;
    const conf = trouver('confirmation');
    conf.hidden = false;
    conf.focus();
    conf.scrollIntoView({ block: 'start' });
  }

  trouver('refaire').addEventListener('click', () => { window.location.assign('/reserver/'); });
  monterTurnstile();
  bouton.disabled = !siteKey;
}
