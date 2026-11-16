export interface TextesErreursAdmin { unauthenticated: string; forbidden: string; notConfigured: string; network: string; server: string; notFound: string; conflict: string }

export class ErreurApi extends Error {
  constructor(message: string, readonly status: number | null, readonly code: string | null) { super(message); this.name = 'ErreurApi'; }
}

/** Client des routes /api/admin/** : un message lisible pour chaque échec, jamais de détail technique. */
export function creerClient(appelerReseau: typeof fetch, t: TextesErreursAdmin) {
  return async function appeler<T = unknown>(methode: 'GET' | 'POST' | 'DELETE', chemin: string, corps?: unknown): Promise<T> {
    let reponse: Response;
    try {
      reponse = await appelerReseau(`/api/admin/${chemin}`, {
        method: methode, headers: { Accept: 'application/json', ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: corps === undefined ? undefined : JSON.stringify(corps), credentials: 'same-origin',
      });
    } catch {
      throw new ErreurApi(t.network, null, 'reseau');
    }
    const donnees = (await reponse.json().catch(() => null)) as { ok?: boolean; erreur?: { code?: string; message?: string } } | null;
    if (reponse.ok) return donnees as T;
    const code = donnees?.erreur?.code ?? null;
    const precis = donnees?.erreur?.message;
    if (reponse.status === 401) throw new ErreurApi(t.unauthenticated, 401, code);
    if (reponse.status === 403 && code === 'non_autorise') throw new ErreurApi(t.forbidden, 403, code);
    if (reponse.status === 503 && code === 'acces_non_configure') throw new ErreurApi(t.notConfigured, 503, code);
    if (reponse.status === 404) throw new ErreurApi(t.notFound, 404, code);
    if (reponse.status === 409 && code === 'transition_impossible') throw new ErreurApi(precis ?? t.conflict, 409, code);
    // Erreurs de saisie (400, 422) : le message précis du serveur ; le reste : message général.
    if (reponse.status >= 400 && reponse.status < 500 && precis) throw new ErreurApi(precis, reponse.status, code);
    throw new ErreurApi(t.server, reponse.status, code);
  };
}
