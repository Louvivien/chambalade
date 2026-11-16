import configBrute from '../../generated/reservation.json';
import { parseReservationConfig, type ReservationConfig } from '../reservation/config';
import type { ApiDeps, ApiEnv } from './types';

/** Ce que Cloudflare Pages passe à une fonction ; seuls les champs utilisés sont déclarés. */
export interface PagesContext {
  request: Request;
  env: ApiEnv;
  params: Record<string, string | string[] | undefined>;
}

let config: ReservationConfig | undefined;

/** Valide la configuration une fois par instance : une erreur de configuration fait échouer tôt et clairement. */
export function contexte(env: ApiEnv): ApiDeps {
  config ??= parseReservationConfig(configBrute);
  return { env, config, now: () => new Date(), fetch: (...args) => fetch(...args) };
}
