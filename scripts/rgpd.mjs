// Effacement et purge des données personnelles (docs/deploiement.md, « Données personnelles »).
//   node scripts/rgpd.mjs anonymiser CHB-2027-0001
//   node scripts/rgpd.mjs supprimer  CHB-2027-0001
//   node scripts/rgpd.mjs apercu --avant 2024-12-31       (liste ce qu’une purge toucherait)
//   node scripts/rgpd.mjs purger  --avant 2024-12-31
// Sans --executer : affiche les requêtes et ne fait rien. Avec --executer : les lance sur la base locale (par défaut)
// ou sur la base de production avec --remote. Une demande encore active n’est jamais touchée.
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { anonymiserDemande, apercuPurge, purger, supprimerDemande } from './rgpd/sql.mjs';

const [, , commande, ...reste] = process.argv;
const option = (nom) => { const i = reste.indexOf(nom); return i >= 0 ? reste[i + 1] : undefined; };
const maintenant = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const jour = maintenant.slice(0, 10);
const reference = reste.find(a => /^CHB-/.test(a));

let requetes;
try {
  if (commande === 'anonymiser') requetes = anonymiserDemande({ reference, jour, maintenant });
  else if (commande === 'supprimer') requetes = supprimerDemande({ reference, jour, maintenant });
  else if (commande === 'apercu') requetes = apercuPurge({ avant: option('--avant'), jour });
  else if (commande === 'purger') requetes = purger({ avant: option('--avant'), jour, maintenant });
  else throw new Error('Commandes : anonymiser <référence> · supprimer <référence> · apercu --avant AAAA-MM-JJ · purger --avant AAAA-MM-JJ');
} catch (e) { console.error(e.message); process.exit(2); }

const cible = reste.includes('--remote') ? '--remote' : '--local';
console.log(`Base visée : ${cible === '--remote' ? 'PRODUCTION (distante)' : 'locale'}\n`);
for (const r of requetes) console.log(r + '\n');
if (!reste.includes('--executer')) { console.log('Rien n’a été exécuté (ajouter --executer).'); process.exit(0); }

const dossier = await mkdtemp(join(tmpdir(), 'rgpd-'));
try {
  const fichier = join(dossier, 'requetes.sql');
  await writeFile(fichier, requetes.join('\n') + '\n');
  execFileSync('npx', ['--yes', 'wrangler@4.156.1', 'd1', 'execute', 'chambalade', cible, `--file=${fichier}`], { stdio: 'inherit' });
} finally { await rm(dossier, { recursive: true, force: true }); }
