/**
 * Génère des images de DÉMONSTRATION abstraites (dégradés vectoriels) dans sources/,
 * pour valider le rendu de la galerie avant d'y mettre les vraies photos.
 * Aucune photo réelle : uniquement des formes générées, libres de droits.
 * Chaque image porte la mention « Image de démonstration ».
 *
 * Usage : npm run demo   (n'écrase pas un fichier existant ; --force pour régénérer)
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');

// Générateur pseudo-aléatoire déterministe (mêmes images à chaque exécution).
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const label = (w, h) =>
  `<text x="${w * 0.03}" y="${h * 0.06}" font-family="Arial, sans-serif" font-size="${h * 0.028}" fill="#fff" fill-opacity=".55" letter-spacing="3">IMAGE DE DÉMONSTRATION</text>`;

/** Paysage : ciel en dégradé, soleil, couches de montagnes. */
function landscape(w, h, rand) {
  const palettes = [
    ['#f6d5a8', '#e9967a', '#5b6c8f', '#2e3a55', '#1b2236'],
    ['#cfe3ef', '#9cc3d9', '#6f8fa8', '#4b6478', '#2c3b47'],
    ['#fbe7c6', '#f4b183', '#a3704f', '#6b4a3a', '#3a2a24'],
    ['#e4ecdf', '#b8cfae', '#7f9b78', '#55704f', '#2f4230'],
  ];
  const p = palettes[Math.floor(rand() * palettes.length)];
  let layers = '';
  for (let i = 0; i < 4; i++) {
    const baseY = h * (0.45 + i * 0.13);
    let d = `M0 ${h} L0 ${baseY}`;
    const steps = 9;
    for (let s = 1; s <= steps; s++) d += ` L${(w * s) / steps} ${baseY - rand() * h * (0.22 - i * 0.04)}`;
    d += ` L${w} ${h} Z`;
    layers += `<path d="${d}" fill="${p[i + 1]}" opacity="${0.92 - i * 0.04}"/>`;
  }
  const sx = w * (0.2 + rand() * 0.6);
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>
  <radialGradient id="sun"><stop offset="0" stop-color="#fff8e7"/><stop offset="1" stop-color="#fff8e7" stop-opacity="0"/></radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/><circle cx="${sx}" cy="${h * 0.32}" r="${h * 0.22}" fill="url(#sun)"/>${layers}`;
}

/** Sport : lignes de piste et traînées de mouvement. */
function sport(w, h, rand) {
  const palettes = [
    ['#c2502f', '#e7e1d8', '#2d5d7b'],
    ['#2f6e4f', '#f1ede4', '#d9a441'],
    ['#2b4c7e', '#eef0f2', '#e45b4f'],
  ];
  const [bg, line, accent] = palettes[Math.floor(rand() * palettes.length)];
  let g = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  for (let i = 0; i < 7; i++) {
    const y = h * (0.15 + i * 0.12);
    g += `<path d="M${-w * 0.1} ${y + h * 0.25} Q ${w * 0.5} ${y - h * 0.08} ${w * 1.1} ${y + h * 0.1}" stroke="${line}" stroke-opacity=".75" stroke-width="${h * 0.008}" fill="none"/>`;
  }
  for (let i = 0; i < 14; i++) {
    const y = h * (0.3 + rand() * 0.4);
    const x = w * rand() * 0.6;
    g += `<rect x="${x}" y="${y}" width="${w * (0.15 + rand() * 0.35)}" height="${h * 0.012}" rx="${h * 0.006}" fill="${accent}" opacity="${0.25 + rand() * 0.5}"/>`;
  }
  g += `<circle cx="${w * (0.55 + rand() * 0.2)}" cy="${h * 0.5}" r="${h * 0.09}" fill="${accent}"/>`;
  return g;
}

/** Concert : fond sombre, faisceaux colorés, bokeh. */
function concert(w, h, rand) {
  const colors = ['#ff3d7f', '#7b5cff', '#00c2ff', '#ffb000', '#ff5a36', '#2bd9a8'];
  let g = `<defs><filter id="blur"><feGaussianBlur stdDeviation="${h * 0.012}"/></filter></defs><rect width="${w}" height="${h}" fill="#07070c"/>`;
  for (let i = 0; i < 6; i++) {
    const c = colors[Math.floor(rand() * colors.length)];
    const x = w * rand();
    const spread = w * (0.12 + rand() * 0.2);
    g += `<path d="M${x} 0 L${x - spread} ${h} L${x + spread} ${h} Z" fill="${c}" opacity="${0.18 + rand() * 0.2}" filter="url(#blur)"/>`;
  }
  for (let i = 0; i < 40; i++) {
    const c = colors[Math.floor(rand() * colors.length)];
    g += `<circle cx="${w * rand()}" cy="${h * (0.05 + rand() * 0.5)}" r="${h * (0.01 + rand() * 0.035)}" fill="${c}" opacity="${0.3 + rand() * 0.5}" filter="url(#blur)"/>`;
  }
  // Silhouette de foule au premier plan.
  let d = `M0 ${h}`;
  for (let x = 0; x <= w; x += w / 28) d += ` L${x} ${h * (0.8 + rand() * 0.08)} L${x + w / 56} ${h * (0.74 + rand() * 0.08)}`;
  g += `<path d="${d} L${w} ${h} Z" fill="#000"/>`;
  return g;
}

const GENERATORS = { paysages: landscape, sport, concerts: concert };
// Formats variés pour tester la mise en page (paysage, portrait, panoramique, carré).
const SIZES = [[3000, 2000], [2000, 3000], [3600, 2025], [3000, 2000], [2400, 2400], [2000, 3000]];

async function main() {
  const roomsDir = path.join(ROOT, 'src/content/rooms');
  let n = 0;
  for (const file of (await readdir(roomsDir)).filter((f) => f.endsWith('.json'))) {
    const roomId = file.replace(/\.json$/, '');
    const gen = GENERATORS[roomId] ?? landscape;
    const room = JSON.parse(await readFile(path.join(roomsDir, file), 'utf8'));
    const dir = path.join(ROOT, 'sources', roomId);
    await mkdir(dir, { recursive: true });
    for (const [i, photo] of room.photos.entries()) {
      if (!photo.fichier.startsWith('demo-')) continue; // ne touche jamais aux vraies photos
      const out = path.join(dir, photo.fichier);
      if (existsSync(out) && !FORCE) continue;
      const [w, h] = SIZES[i % SIZES.length];
      const rand = rng(roomId.length * 1000 + i * 97 + 7);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${gen(w, h, rand)}${label(w, h)}</svg>`;
      await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(out);
      n++;
    }
  }
  console.log(`[demo] ${n} image(s) de démonstration générée(s) dans sources/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
