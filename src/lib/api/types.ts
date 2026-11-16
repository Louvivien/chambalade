import type { ReservationConfig } from '../reservation/config';

// Types minimaux de Cloudflare D1 : la bibliothèque n’a pas besoin des types de Workers,
// et les tests branchent une base SQLite en mémoire derrière la même forme.
export interface D1Meta { changes: number; last_row_id: number }
export interface D1Result<T = unknown> { results: T[]; success: boolean; meta: D1Meta }
export interface D1Statement {
  bind(...valeurs: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
export interface D1Like {
  prepare(sql: string): D1Statement;
  /** Exécute les requêtes dans une seule transaction : tout passe ou rien ne passe. */
  batch(requetes: D1Statement[]): Promise<D1Result[]>;
}

/** Variables et secrets Cloudflare. Les secrets ne sont jamais dans le dépôt. */
export interface ApiEnv {
  DB: D1Like;
  TURNSTILE_SECRET?: string;
  RATE_LIMIT_SALT?: string;
  /** Domaine d’équipe Cloudflare Access, par ex. « monequipe.cloudflareaccess.com ». */
  ACCESS_TEAM_DOMAIN?: string;
  /** Audience (AUD) de l’application Access. */
  ACCESS_AUD?: string;
  /** Adresses e-mail autorisées, séparées par des virgules. */
  ADMIN_EMAILS?: string;
  /** « development » autorise ACCESS_DEV_EMAIL, uniquement depuis localhost. */
  ENVIRONMENT?: string;
  ACCESS_DEV_EMAIL?: string;
  /** Clé du service d’e-mail (Resend). Absente : aucun e-mail n’est envoyé, l’issue est consignée au journal. */
  EMAIL_API_KEY?: string;
  /** Expéditeur, par ex. « Chambalade <reservation@chambalade.fr> » (domaine vérifié chez le service d’e-mail). */
  EMAIL_FROM?: string;
  /** Adresse de réponse des e-mails à la cliente (celle d’Amaëlle). */
  EMAIL_REPLY_TO?: string;
  /** Destinataires des notifications à Amaëlle, séparés par des virgules ; à défaut, ADMIN_EMAILS. */
  NOTIFY_EMAILS?: string;
  /** Coordonnées bancaires pour l’acompte, texte libre repris dans l’e-mail d’acceptation. */
  VIREMENT_INFOS?: string;
}

/** Tout ce dont un gestionnaire a besoin, injecté pour pouvoir le tester sans réseau. */
export interface ApiDeps {
  env: ApiEnv;
  config: ReservationConfig;
  now: () => Date;
  fetch: typeof fetch;
  /** Poursuit un travail après la réponse (e-mails), quand la plateforme le permet ; sinon on l’attend. */
  apresReponse?: (travail: Promise<unknown>) => void;
}
