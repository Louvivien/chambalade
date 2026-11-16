import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { convertPhotos, readPhotoTable, resolveInside } from '../scripts/convertir-photos.mjs';

const table = (rows) => `| Fichier d'origine | Fichier cible | Statut |\n| --- | --- | --- |\n${rows}`;
const directories = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(directories.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('Manifeste des photos', () => {
  it('ignore les lignes sans cible et conserve les accents et espaces', () => {
    expect(readPhotoTable(table('| Forêt été.HEIC | foret.jpg | À utiliser |\n| Moustique.HEIC | — | |')))
      .toEqual([{ source: 'Forêt été.HEIC', target: 'foret.jpg' }]);
  });
  it('refuse un tableau absent', () => expect(() => readPhotoTable('')).toThrow());
  it('refuse une cible dupliquée', () => {
    expect(() => readPhotoTable(table('| a.png | a.jpg | |\n| b.png | a.jpg | |'))).toThrow(/dupliquée/);
  });
  it.each(['../dehors.jpg', '/dehors.jpg'])('refuse une sortie hors dossier : %s', (name) => {
    expect(() => resolveInside('/photos', name)).toThrow(/hors/);
  });
});

describe('Conversion réelle avec ImageMagick', () => {
  it('oriente, limite les dimensions, retire les métadonnées et préserve les originaux', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'chambalade-photos-'));
    directories.push(root);
    await mkdir(path.join(root, 'docs'));
    await mkdir(path.join(root, 'photos-originales'));
    await writeFile(path.join(root, 'docs/photos.md'), table([
      '| Grande photo été.JPEG | grande.jpg | |',
      '| petite.png | petite.jpg | |',
      '| logo.png | logo/chambalade.png | |',
      '| absente.HEIC | absente.jpg | |',
      '| ignorer.png | — | |',
    ].join('\n')));
    const original = await sharp({ create: { width: 3200, height: 1600, channels: 3, background: '#8e9b7c' } })
      .jpeg().withMetadata({ orientation: 6 }).toBuffer();
    await writeFile(path.join(root, 'photos-originales/Grande photo été.JPEG'), original);
    const transparent = await sharp({ create: { width: 100, height: 80, channels: 4, background: '#00000000' } }).png().toBuffer();
    for (const name of ['petite.png', 'logo.png', 'ignorer.png']) await writeFile(path.join(root, 'photos-originales', name), transparent);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await convertPhotos(root)).toEqual({ converted: 3, missing: 1, failed: 0 });
    const large = await sharp(path.join(root, 'src/assets/photos/grande.jpg')).metadata();
    expect([large.width, large.height]).toEqual([1280, 2560]);
    for (const field of ['exif', 'icc', 'iptc', 'xmp', 'orientation']) expect(large[field]).toBeUndefined();
    const small = await sharp(path.join(root, 'src/assets/photos/petite.jpg')).metadata();
    expect([small.width, small.height, small.format]).toEqual([100, 80, 'jpeg']);
    const logo = await sharp(path.join(root, 'src/assets/logo/chambalade.png')).metadata();
    expect([logo.format, logo.hasAlpha]).toEqual(['png', true]);
    expect(await readFile(path.join(root, 'photos-originales/Grande photo été.JPEG'))).toEqual(original);
    expect((await readdir(path.join(root, 'src/assets/photos'))).sort()).toEqual(['grande.jpg', 'petite.jpg']);
    // Une source corrompue ne doit pas remplacer une ancienne sortie valide.
    const previous = await readFile(path.join(root, 'src/assets/photos/grande.jpg'));
    await writeFile(path.join(root, 'photos-originales/Grande photo été.JPEG'), 'corrompu');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await convertPhotos(root)).failed).toBe(1);
    expect(await readFile(path.join(root, 'src/assets/photos/grande.jpg'))).toEqual(previous);
  }, 30_000);
});
