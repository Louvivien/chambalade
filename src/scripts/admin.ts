import { creerClient, ErreurApi } from '../lib/admin/api';
import { lireVue, ongletDe } from '../lib/admin/routes';
import { remplir } from '../lib/reserver/formats';
import { trouver } from './dom';
import type { ContexteAdmin, Montage } from './admin/contexte';
import * as blocages from './admin/blocages';
import * as calendrier from './admin/calendrier';
import * as demandes from './admin/demandes';
import * as fiche from './admin/fiche';

const { text } = JSON.parse(trouver('admin-donnees').textContent ?? '{}') as { text: Record<string, any> };
const api = creerClient((...a) => fetch(...a), text.common.errors);
const bandeau = trouver('admin-bandeau');
const annonce = trouver('admin-annonce');
const montages: Record<string, Montage> = { demandes: demandes.monter, fiche: fiche.monter, calendrier: calendrier.monter, blocages: blocages.monter };
let courante = 0;

const ctx: ContexteAdmin = {
  text, api, email: '',
  annoncer: message => { annonce.textContent = ''; window.setTimeout(() => { annonce.textContent = message; }, 50); },
  aller: hash => { window.location.hash = hash; },
};

function montrerErreur(e: unknown) {
  trouver('admin-bandeau-texte').textContent = e instanceof ErreurApi ? e.message : text.common.errors.server;
  bandeau.hidden = false;
}

async function afficher(premiere = false) {
  const numero = ++courante;
  const v = lireVue(window.location.hash);
  bandeau.hidden = true;
  for (const nom of ['demandes', 'fiche', 'calendrier', 'blocages']) trouver(nom).hidden = nom !== v.vue;
  for (const lien of document.querySelectorAll<HTMLAnchorElement>('[data-onglet]')) {
    if (lien.dataset.onglet === ongletDe(v)) lien.setAttribute('aria-current', 'page'); else lien.removeAttribute('aria-current');
  }
  const zone = trouver(`contenu-${v.vue}`);
  try {
    await montages[v.vue](zone, ctx, v.vue === 'fiche' ? { id: v.id } : v.vue === 'calendrier' ? { mois: v.mois } : {});
    // Une vue plus récente a pu être demandée pendant le chargement : on ne touche plus à la page.
    if (numero !== courante) return;
    if (!premiere) trouver(`titre-${v.vue}`).focus();
  } catch (e) {
    if (numero === courante) montrerErreur(e);
  }
}

trouver('admin-reessayer').addEventListener('click', () => { void afficher(); });
window.addEventListener('hashchange', () => { void afficher(); });

// Qui est connecté·e : sert aussi de première vérification de l’accès.
api<{ email: string }>('GET', 'moi').then(r => {
  ctx.email = r.email;
  trouver('admin-moi').textContent = remplir(text.header.signedIn, { email: r.email });
}).catch(montrerErreur);
void afficher(true);
