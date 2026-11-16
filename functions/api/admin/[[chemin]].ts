import { gererAdmin } from '../../../src/lib/api/admin';
import { contexte, type PagesContext } from '../../../src/lib/api/runtime';

// Un seul point d’entrée pour toute l’administration : l’authentification est faite dans gererAdmin.
export const onRequest = (c: PagesContext) => {
  const chemin = c.params.chemin;
  return gererAdmin(c.request, contexte(c.env, c.waitUntil?.bind(c)), Array.isArray(chemin) ? chemin : chemin ? [chemin] : []);
};
