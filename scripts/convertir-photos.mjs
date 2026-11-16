import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));

export function readPhotoTable(markdown) {
  const lines = markdown.split(/\r?\n/);
  const cells = (line) => line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
  const headerIndex = lines.findIndex((line) =>
    line.trim().startsWith('| Fichier d\'origine | Fichier cible |'),
  );
  if (headerIndex === -1) throw new Error('Tableau des photos introuvable dans docs/photos.md.');

  const entries = [];
  const targets = new Set();
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim().startsWith('|')) break;
    const [source, target] = cells(line);
    if (/^:?-+:?$/.test(source)) continue;
    if (!target || ['—', '–', '-'].includes(target)) continue;
    if (!source) throw new Error(`Source absente pour ${target}.`);
    if (targets.has(target)) throw new Error(`Cible dupliquée dans docs/photos.md : ${target}.`);
    targets.add(target);
    entries.push({ source, target });
  }
  if (!entries.length) throw new Error('Aucun fichier cible dans docs/photos.md.');
  return entries;
}

export function resolveInside(directory, filename) {
  const resolved = path.resolve(directory, filename);
  const relative = path.relative(directory, resolved);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Chemin hors du dossier autorisé : ${filename}.`);
  }
  return resolved;
}

export async function convertPhotos(projectRoot = root) {
  const sources = path.join(projectRoot, 'photos-originales');
  const destination = path.join(projectRoot, 'src/assets/photos');
  const manifest = path.join(projectRoot, 'docs/photos.md');
  const entries = readPhotoTable(await readFile(manifest, 'utf8'));
  try {
    await execFileAsync('magick', ['-version']);
  } catch {
    throw new Error('ImageMagick 7 est requis, avec le support HEIC. Sur macOS : brew install imagemagick.');
  }
  await mkdir(destination, { recursive: true });

  let converted = 0;
  let missing = 0;
  let failed = 0;

  for (const { source, target } of entries) {
    let temporaryDirectory;
    try {
      const input = resolveInside(sources, source);
      const isLogo = target === 'logo/chambalade.png';
      const output = isLogo
        ? resolveInside(path.join(projectRoot, 'src/assets'), target)
        : resolveInside(destination, target);
      try {
        await access(input);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        console.warn(`MANQUANT : ${source} (cible : ${target})`);
        missing += 1;
        continue;
      }
      if (!/\.(heic|heif|jpe?g|png)$/i.test(source)) {
        throw new Error(`Format source non pris en charge : ${source}.`);
      }
      if (!isLogo && !/\.jpe?g$/i.test(target)) {
        throw new Error(`La cible « ${target} » n'est pas un JPEG ni le logo PNG prévu.`);
      }

      await mkdir(path.dirname(output), { recursive: true });
      // Écriture temporaire sur le même volume : une erreur conserve la sortie précédente.
      temporaryDirectory = await mkdtemp(path.join(path.dirname(output), '.conversion-'));
      const temporaryOutput = path.join(temporaryDirectory, isLogo ? 'logo.png' : 'photo.jpg');
      // execFile transmet les chemins avec espaces/accents sans interprétation par un shell.
      // [0] sélectionne seulement l'image principale d'un éventuel conteneur multi-image.
      const { stderr } = await execFileAsync('magick', [
        `${input}[0]`,
        '-auto-orient',
        '-colorspace', 'sRGB',
        '-resize', '2560x2560>',
        ...(isLogo ? [] : ['-background', 'white', '-alpha', 'remove', '-alpha', 'off']),
        '-strip',
        ...(isLogo ? [] : ['-interlace', 'Plane', '-quality', '88']),
        temporaryOutput,
      ], { timeout: 120_000, maxBuffer: 1024 * 1024 });
      if (stderr.trim()) console.warn(`${source} : ${stderr.trim()}`);
      await rename(temporaryOutput, output);
      converted += 1;
      console.log(`OK : ${source} → ${target}`);
    } catch (error) {
      failed += 1;
      console.error(`ERREUR : ${source} : ${error.message}`);
    } finally {
      if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }

  console.log(`\n${converted} converti(s), ${missing} manquant(s), ${failed} erreur(s).`);
  return { converted, missing, failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  convertPhotos().then(({ failed }) => {
    if (failed) process.exitCode = 1;
  }).catch((error) => {
    console.error(`ERREUR : ${error.message}`);
    process.exitCode = 1;
  });
}
