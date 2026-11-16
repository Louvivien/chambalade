// npm run deploiement:smoke -- https://chambalade.pages.dev [--autoriser-cle-test]
import { verifierSite } from './deploiement/smoke.mjs';

const base = process.argv[2]?.replace(/\/+$/, '');
if (!base || !/^https?:\/\//.test(base)) { console.error('Usage : npm run deploiement:smoke -- https://adresse-du-site [--autoriser-cle-test]'); process.exit(2); }
const resultats = await verifierSite(base, { autoriserCleTest: process.argv.includes('--autoriser-cle-test') });
for (const r of resultats) console.log(`${r.ok ? 'OK ' : '!! '} ${r.message}`);
const echecs = resultats.filter(r => !r.ok);
console.log(`\n${resultats.length - echecs.length}/${resultats.length} contrôles réussis sur ${base}.`);
if (/^https?:\/\/(localhost|127\.0\.0\.1)/.test(base)) console.log('Site local : la fermeture de l’administration n’est pas jugée (le contournement de développement y est voulu).');
process.exit(echecs.length > 0 ? 1 : 0);
