const ENTETES = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export function json(donnees: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(donnees), { status, headers: { ...ENTETES, ...extra } });
}

/** Réponse d’erreur : un code stable pour le code, un message lisible pour la personne, jamais de détail technique. */
export function erreur(status: number, code: string, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}): Response {
  return json({ ok: false, erreur: { code, message, ...extra } }, status, headers);
}

export function methodeNonAutorisee(request: Request, autorisees: string[]): Response | null {
  if (autorisees.includes(request.method)) return null;
  return erreur(405, 'methode_non_autorisee', 'Cette méthode n’est pas acceptée ici.', {}, { Allow: autorisees.join(', ') });
}

/**
 * Protection contre les requêtes envoyées depuis un autre site : si le navigateur indique une
 * origine, elle doit être celle du site. Les clients sans en-tête Origin (outils en ligne de
 * commande) ne sont pas concernés : ils n’ont pas de session de navigateur à détourner.
 */
export function origineAutorisee(request: Request): boolean {
  const origine = request.headers.get('Origin');
  return origine === null || origine === new URL(request.url).origin;
}

export type LectureJson = { ok: true; donnees: unknown } | { ok: false; reponse: Response };

export async function lireJson(request: Request, tailleMax = 20_000): Promise<LectureJson> {
  if (!origineAutorisee(request)) return { ok: false, reponse: erreur(403, 'origine_refusee', 'Cette requête ne vient pas du site.') };
  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) {
    return { ok: false, reponse: erreur(415, 'type_non_accepte', 'Le contenu doit être au format JSON.') };
  }
  const annonce = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(annonce) && annonce > tailleMax) return { ok: false, reponse: erreur(413, 'trop_volumineux', 'La requête est trop volumineuse.') };
  const texte = await request.text();
  if (new TextEncoder().encode(texte).length > tailleMax) return { ok: false, reponse: erreur(413, 'trop_volumineux', 'La requête est trop volumineuse.') };
  try {
    return { ok: true, donnees: JSON.parse(texte) };
  } catch {
    return { ok: false, reponse: erreur(400, 'json_invalide', 'Le contenu envoyé n’est pas du JSON valide.') };
  }
}
