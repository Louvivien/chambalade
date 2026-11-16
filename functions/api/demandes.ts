import { gererCreationDemande } from '../../src/lib/api/creation';
import { contexte, type PagesContext } from '../../src/lib/api/runtime';

export const onRequest = (c: PagesContext) => gererCreationDemande(c.request, contexte(c.env));
