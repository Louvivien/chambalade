import { gererDisponibilites } from '../../src/lib/api/disponibilites';
import { contexte, type PagesContext } from '../../src/lib/api/runtime';

export const onRequest = (c: PagesContext) => gererDisponibilites(c.request, contexte(c.env));
