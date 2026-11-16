import type { Montage } from './contexte';

// Provisoire : la vue est construite dans une tranche suivante de l’étape 10.
export const monter: Montage = async zone => { zone.textContent = '…'; };
