import { gererDevis } from '../../src/lib/api/devis';
import { contexte, type PagesContext } from '../../src/lib/api/runtime';

export const onRequest = (c: PagesContext) => gererDevis(c.request, contexte(c.env));
