// Contrôles avant mise en ligne. Fonctions pures : elles reçoivent des contenus déjà lus, pour être testées sans disque.
// Chaque contrôle renvoie { id, niveau, ok, message } ; « bloquant » = ne pas mettre en ligne tant que ce n’est pas réglé.

export const ZERO_ID = '00000000-0000-0000-0000-000000000000';
// Clés de test publiques de Cloudflare Turnstile (toujours valides / toujours refusées / défi forcé) : jamais en production.
export const CLES_TURNSTILE_TEST = /\b[123]x0{20,}[A-Z]{1,2}\b/;

const ctl = (id, niveau, ok, message) => ({ id, niveau, ok, message });

/** wrangler.toml : identifiant D1 réel, aucune variable de développement. */
export function controlerWrangler(toml) {
  const ids = [...toml.matchAll(/^\s*database_id\s*=\s*"([^"]*)"/gm)].map(m => m[1]);
  const resultats = [];
  resultats.push(ctl('wrangler-database-id', 'bloquant', ids.length > 0 && ids.every(id => id !== ZERO_ID && id.trim() !== ''),
    ids.length === 0 ? 'wrangler.toml : aucune base D1 déclarée' : 'wrangler.toml : database_id est encore l’identifiant de test ; mettre celui de la base créée sur Cloudflare (docs/deploiement.md, étape 3)'));
  resultats.push(ctl('wrangler-sortie', 'bloquant', /^\s*pages_build_output_dir\s*=\s*"dist"/m.test(toml), 'wrangler.toml : pages_build_output_dir doit valoir "dist"'));
  const hors = toml.replace(/^\s*#.*$/gm, '');
  resultats.push(ctl('wrangler-pas-de-dev', 'bloquant', !/ENVIRONMENT|ACCESS_DEV_EMAIL/.test(hors), 'wrangler.toml : ENVIRONMENT et ACCESS_DEV_EMAIL ne doivent jamais figurer (contournement de développement)'));
  resultats.push(ctl('wrangler-pas-de-secret', 'bloquant', !/TURNSTILE_SECRET|EMAIL_API_KEY|RATE_LIMIT_SALT|VIREMENT_INFOS/.test(hors), 'wrangler.toml : aucun secret dans le fichier (ils se règlent dans Cloudflare)'));
  return resultats;
}

/** Les migrations sont numérotées sans trou : 0001, 0002… */
export function controlerMigrations(noms) {
  const sql = noms.filter(n => n.endsWith('.sql')).sort();
  const attendu = sql.map((_, i) => `${String(i + 1).padStart(4, '0')}_`);
  const ok = sql.length > 0 && sql.every((n, i) => n.startsWith(attendu[i]));
  return [ctl('migrations', 'bloquant', ok, ok ? `${sql.length} migrations, numérotation continue` : `migrations : numérotation interrompue (${sql.join(', ')})`)];
}

/** Le site construit : fichiers attendus, aucune clé de test, clé Turnstile publique présente. */
export function controlerSite({ fichiers, reserverFr, reserverEn }) {
  const presents = new Set(fichiers);
  const requis = ['index.html', 'en/index.html', 'reserver/index.html', 'en/book/index.html', 'admin/index.html', '404.html', '_headers', 'robots.txt', 'sitemap.xml'];
  const manquants = requis.filter(f => !presents.has(f));
  const resultats = [ctl('site-fichiers', 'bloquant', manquants.length === 0, manquants.length === 0 ? 'dist : tous les fichiers attendus sont présents' : `dist : fichiers manquants : ${manquants.join(', ')} (npm run build)`)];
  for (const [nom, html] of [['reserver', reserverFr], ['en/book', reserverEn]]) {
    const cle = html?.match(/"siteKey":"([^"]*)"/)?.[1] ?? null;
    resultats.push(ctl(`turnstile-cle-${nom}`, 'bloquant', !!cle && !CLES_TURNSTILE_TEST.test(cle),
      cle === null ? `${nom} : page introuvable ou illisible` : cle === '' ? `${nom} : PUBLIC_TURNSTILE_SITE_KEY n’était pas définie à la construction (variable de construction Cloudflare Pages)` : CLES_TURNSTILE_TEST.test(cle) ? `${nom} : la clé Turnstile est une clé de test` : `${nom} : clé Turnstile publique présente`));
  }
  return resultats;
}

/** Recherche de clés de test ou de secrets dans les fichiers texte construits. */
export function controlerSecrets(contenus) {
  const suspects = [];
  for (const [fichier, texte] of Object.entries(contenus)) {
    if (/(sk_live_|re_[A-Za-z0-9]{20,}|BEGIN (RSA |EC )?PRIVATE KEY|ACCESS_DEV_EMAIL=)/.test(texte)) suspects.push(fichier);
  }
  return [ctl('site-secrets', 'bloquant', suspects.length === 0, suspects.length === 0 ? 'dist : aucun secret reconnaissable' : `dist : motif de secret trouvé dans ${suspects.join(', ')}`)];
}

/** Fichiers locaux sensibles : jamais suivis par Git. */
export function controlerSuivis(fichiersSuivis) {
  const interdits = fichiersSuivis.filter(f => /(^|\/)(\.dev\.vars|\.env|\.env\.[^e].*|photos-originales\/.*)$/.test(f) && !/\.example$/.test(f));
  return [ctl('git-sensibles', 'bloquant', interdits.length === 0, interdits.length === 0 ? 'Git : aucun fichier sensible suivi' : `Git suit des fichiers sensibles : ${interdits.join(', ')}`)];
}

/** Ce qui doit être réglé avant d’ouvrir au public (avertissements, jamais une panne technique). */
export function controlerOuverture({ legal, site, nbPointsAConfirmer, prixNonValides }) {
  return [
    ctl('legal-valide', 'ouverture', legal.valide === true, legal.valide === true ? 'Pages légales validées' : 'Pages légales encore en brouillon (valide: false dans src/data/legal.yaml) : bandeau et noindex'),
    ctl('contact', 'ouverture', !!site.phone || !!site.email, site.phone || site.email ? 'Coordonnées de contact renseignées' : 'Aucun téléphone ni e-mail de contact publié (src/data/site.yaml)'),
    ctl('identite', 'ouverture', !!legal.editeur?.siret && !!legal.editeur?.nom, legal.editeur?.siret && legal.editeur?.nom ? 'Identité de l’éditeur renseignée' : 'Identité de l’éditeur incomplète (nom, SIRET) dans src/data/legal.yaml'),
    ctl('tarifs', 'ouverture', prixNonValides === 0, prixNonValides === 0 ? 'Tous les tarifs sont validés' : `${prixNonValides} tarifs non validés dans src/data/reservation.yaml`),
    ctl('todo', 'ouverture', nbPointsAConfirmer === 0, nbPointsAConfirmer === 0 ? 'Aucun point à confirmer' : `${nbPointsAConfirmer} points à confirmer (docs/todo-contenus.md)`),
  ];
}

export function resume(resultats) {
  const bloquants = resultats.filter(r => !r.ok && r.niveau === 'bloquant');
  const ouverture = resultats.filter(r => !r.ok && r.niveau === 'ouverture');
  return { bloquants, ouverture, pret: bloquants.length === 0 };
}
