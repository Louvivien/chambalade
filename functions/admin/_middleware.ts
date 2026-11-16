import { protegerPageAdmin } from '../../src/lib/api/admin-page';
import { contexte, type PagesContext } from '../../src/lib/api/runtime';

// S’applique à /admin et à tout ce qu’il contient (page, scripts, styles).
export const onRequest = (c: PagesContext) => protegerPageAdmin(c.request, contexte(c.env, c.waitUntil?.bind(c)), () => c.next!());
