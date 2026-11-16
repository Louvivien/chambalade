import { authentifierAdmin } from './access';
import type { ApiDeps } from './types';

// La page /admin/ est un fichier statique : sans ce contrôle, n’importe qui pourrait la lire si la
// protection de Cloudflare Access était désactivée ou contournée. L’intergiciel (functions/admin/
// _middleware.ts) la protège aussi dans la fonction, comme les routes /api/admin/**.

const ENTETES_ADMIN: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  // Pas d’intégration dans une autre page, pas de <base>, pas d’objets, formulaires vers le site seulement.
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'",
};

const echapper = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Laisse passer vers la page seulement si le jeton Access est valide ; sinon répond sans rien révéler de la page. */
export async function protegerPageAdmin(request: Request, deps: ApiDeps, suite: () => Promise<Response>): Promise<Response> {
  const auth = await authentifierAdmin(request, deps);
  if (!auth.ok) {
    const { erreur } = (await auth.reponse.clone().json()) as { erreur: { message: string } };
    return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Accès refusé</title><p>${echapper(erreur.message)}</p>`, {
      status: auth.reponse.status, headers: { ...ENTETES_ADMIN, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  const reponse = await suite();
  const securisee = new Response(reponse.body, reponse);
  for (const [cle, valeur] of Object.entries(ENTETES_ADMIN)) securisee.headers.set(cle, valeur);
  return securisee;
}
