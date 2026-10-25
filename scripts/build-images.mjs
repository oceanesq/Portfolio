/**
 * Pipeline d'images : sources/ (exports Lightroom) → public/photos/ (versions web).
 *
 * Pour chaque photo déclarée dans src/content/rooms/*.json :
 *   1. lit sources/<salle>/<fichier> et applique l'orientation EXIF ;
 *   2. réduit le grand côté à 2000 px max et produit plusieurs largeurs ;
 *   3. incruste un filigrane discret (configurable) ;
 *   4. encode en AVIF, WebP et JPEG ; les métadonnées d'origine (EXIF, GPS…)
 *      sont supprimées par sharp ;
 *   5. écrit les métadonnées IPTC/XMP de droits d'auteur (exiftool) ;
 *   6. calcule un placeholder flou (LQIP) et la couleur dominante ;
 *   7. met à jour src/generated/images.json (lu par les composants).
 *
 * Le traitement est incrémental : une photo n'est ré-encodée que si le fichier
 * source, ses textes ou les réglages ont changé (le nom publié est un hash).
 *
 * Usage : npm run images            (incrémental)
 *         npm run images -- --force (tout régénérer)
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import config from './images.config.mjs';
import { SITE_URL } from '../src/config/site-url.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.resolve(ROOT, p); // relatif au projet, ou absolu
const FORCE = process.argv.includes('--force');
const PIPELINE_VERSION = 3; // à incrémenter si la logique d'encodage change
const IMAGE_EXT = /\.(jpe?g|png|tiff?|webp)$/i;

const log = (...a) => console.log('[images]', ...a);
const warn = (...a) => console.warn('[images] ⚠', ...a);

// ---------------------------------------------------------------------------
// Lecture des données
// ---------------------------------------------------------------------------

/** Liste des images à produire, à partir des fichiers JSON des salles. */
async function collectJobs() {
  const roomsDir = r('src/content/rooms');
  const jobs = [];
  const files = (await readdir(roomsDir)).filter((f) => f.endsWith('.json'));
  const rooms = await Promise.all(
    files.map(async (file) => ({ roomId: file.replace(/\.json$/, ''), room: JSON.parse(await readFile(path.join(roomsDir, file), 'utf8')) })),
  );
  rooms.sort((a, b) => (a.room.ordre ?? 99) - (b.room.ordre ?? 99));
  for (const { roomId, room } of rooms) {
    for (const p of room.photos ?? []) {
      jobs.push({
        key: `${roomId}/${p.fichier}`,
        roomId,
        source: r(path.join(config.sourcesDir, roomId, p.fichier)),
        meta: { title: p.titre_fr, description: p.texte_fr, alt: p.alt_fr, place: p.lieu, year: p.annee },
        watermark: true,
        featured: Boolean(p.vedette),
      });
    }
  }
  // Portrait de la page « À propos » (facultatif).
  const portrait = r(path.join(config.sourcesDir, 'a-propos', 'portrait.jpg'));
  jobs.push({
    key: 'a-propos/portrait.jpg',
    roomId: 'a-propos',
    source: portrait,
    meta: { title: 'Portrait d’Océane Saqué', description: '', alt: 'Portrait d’Océane Saqué', place: '', year: '' },
    watermark: false,
    optional: true,
  });
  // Photo du matériel (facultative) : remplace l'illustration de la page « À propos ».
  jobs.push({
    key: 'a-propos/materiel.jpg',
    roomId: 'a-propos',
    source: r(path.join(config.sourcesDir, 'a-propos', 'materiel.jpg')),
    meta: { title: 'Matériel photo d’Océane Saqué', description: 'Sony A7 IV et Sigma 28-70 mm f/2.8 DG DN', alt: '', place: '', year: '' },
    watermark: false,
    optional: true,
  });
  return jobs;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Filigrane
// ---------------------------------------------------------------------------

const escapeXml = (s) =>
  String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

/** Construit l'overlay du filigrane (Buffer PNG/SVG) pour une image w × h. */
async function watermarkOverlay(w, h) {
  const wm = config.watermark;
  const short = Math.min(w, h);
  const margin = Math.round(short * wm.margin);

  // Variante « signature » : PNG transparent fourni par l'utilisatrice.
  if (wm.image && existsSync(r(wm.image))) {
    const targetH = Math.max(12, Math.round(short * wm.size * 1.8));
    const sig = await sharp(r(wm.image)).resize({ height: targetH }).ensureAlpha().toBuffer({ resolveWithObject: true });
    const { width: sw, height: sh } = sig.info;
    const faded = await sharp(sig.data)
      .composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * wm.opacity)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }])
      .png()
      .toBuffer();
    return { input: faded, ...placement(w, h, sw, sh, margin) };
  }

  // Variante texte (par défaut), rendue en SVG.
  const fontSize = Math.max(10, Math.round(short * wm.size));
  const anchor = wm.position === 'bottom-left' ? 'start' : wm.position === 'bottom-center' ? 'middle' : 'end';
  const x = anchor === 'start' ? margin : anchor === 'middle' ? w / 2 : w - margin;
  const y = h - margin;
  const text = escapeXml(wm.text);
  const shadow = Math.max(1, Math.round(fontSize / 18));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g font-family='${wm.fontFamily}' font-size="${fontSize}" text-anchor="${anchor}" letter-spacing="${fontSize * 0.04}">
      <text x="${x + shadow}" y="${y + shadow}" fill="#000" fill-opacity="${(wm.opacity * 0.45).toFixed(3)}">${text}</text>
      <text x="${x}" y="${y}" fill="${wm.color}" fill-opacity="${wm.opacity}">${text}</text>
    </g></svg>`;
  return { input: Buffer.from(svg), top: 0, left: 0 };
}

function placement(w, h, ow, oh, margin) {
  const top = h - oh - margin;
  const pos = config.watermark.position;
  const left = pos === 'bottom-left' ? margin : pos === 'bottom-center' ? Math.round((w - ow) / 2) : w - ow - margin;
  return { top: Math.max(0, top), left: Math.max(0, left) };
}

// ---------------------------------------------------------------------------
// Métadonnées (exiftool)
// ---------------------------------------------------------------------------

let exiftool = null;
async function getExiftool() {
  if (exiftool !== null) return exiftool;
  try {
    const mod = await import('exiftool-vendored');
    exiftool = mod.exiftool;
  } catch (e) {
    warn('exiftool-vendored indisponible : métadonnées IPTC/XMP non écrites.', e.message);
    exiftool = false;
  }
  return exiftool;
}

function metadataTags(meta, ext) {
  const m = config.metadata;
  const year = meta.year ? ` ${meta.year}` : '';
  const title = meta.title || '';
  const caption = [meta.description, meta.place && `${meta.place}${year}`].filter(Boolean).join(' — ');
  const tags = {
    'XMP-dc:Creator': [m.creator],
    'XMP-dc:Rights': m.copyright,
    'XMP-dc:Title': title,
    'XMP-dc:Description': caption,
    'XMP-xmpRights:Marked': true,
    'XMP-xmpRights:UsageTerms': m.usageTerms,
    'XMP-xmpRights:WebStatement': `${SITE_URL}/fr/mentions-legales/`,
    'XMP-iptcCore:CreatorWorkEmail': m.email,
    'XMP-photoshop:Credit': m.creator,
    'XMP-plus:CopyrightOwnerName': m.creator,
    'EXIF:Artist': m.creator,
    'EXIF:Copyright': m.copyright,
  };
  if (ext === 'jpg') {
    Object.assign(tags, {
      'IPTC:CodedCharacterSet': 'UTF8',
      'IPTC:By-line': m.creator,
      'IPTC:CopyrightNotice': m.copyright,
      'IPTC:ObjectName': title.slice(0, 64),
      'IPTC:Caption-Abstract': caption.slice(0, 2000),
      'IPTC:Credit': m.creator,
    });
  }
  return tags;
}

async function writeMetadata(files, meta) {
  if (!config.metadata.enabled) return;
  const et = await getExiftool();
  if (!et) return;
  await Promise.all(
    files.map(async ({ file, ext }) => {
      try {
        await et.write(file, metadataTags(meta, ext), { writeArgs: ['-overwrite_original'] });
      } catch (e) {
        warn(`métadonnées non écrites pour ${path.basename(file)} (${ext}) : ${e.message}`);
      }
    }),
  );
}

// ---------------------------------------------------------------------------
// Traitement d'une photo
// ---------------------------------------------------------------------------

function hashOf(...parts) {
  const h = createHash('sha1');
  for (const p of parts) h.update(typeof p === 'string' ? p : Buffer.isBuffer(p) ? p : JSON.stringify(p));
  return h.digest('hex').slice(0, 12);
}

/** LQIP : mini-image floutée (SVG + WebP 24 px), ~0,5 ko, affichée pendant le chargement. */
async function makeLqip(img, w, h) {
  const tiny = await img.clone().resize(24, Math.max(1, Math.round((24 * h) / w))).webp({ quality: 40 }).toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Math.round(Math.min(w, h) / 40)}"/><feComponentTransfer><feFuncA type="discrete" tableValues="1 1"/></feComponentTransfer></filter><image width="100%" height="100%" preserveAspectRatio="none" filter="url(#b)" href="data:image/webp;base64,${tiny.toString('base64')}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function processJob(job, previous) {
  const srcBuf = await readFile(job.source);
  const id = hashOf(PIPELINE_VERSION, srcBuf, config.widths, config.maxLongSide, config.formats, job.watermark && config.watermark, config.metadata, job.meta);

  const outDir = r(config.outputDir);
  const expected = (entry) => entry.widths.flatMap((w) => ['avif', 'webp', 'jpg'].map((e) => path.join(outDir, `${entry.id}-${w}.${e}`)));
  if (!FORCE && previous && previous.id === id && expected(previous).every((f) => existsSync(f))) {
    return { entry: previous, files: expected(previous), cached: true };
  }

  // Image « maîtresse » : orientation EXIF appliquée, sRGB, grand côté ≤ maxLongSide.
  // sharp ne recopie aucune métadonnée d'origine (EXIF, GPS, numéro de série du boîtier…).
  const { data: masterBuf, info } = await sharp(srcBuf, { failOn: 'none' })
    .rotate()
    .resize({ width: config.maxLongSide, height: config.maxLongSide, fit: 'inside', withoutEnlargement: true })
    .toColourspace('srgb')
    .toBuffer({ resolveWithObject: true });
  const base = sharp(masterBuf);
  const maxW = info.width;
  const maxH = info.height;
  const widths = [...new Set([...config.widths.filter((w) => w < maxW), maxW])].sort((a, b) => a - b);

  const files = [];
  for (const w of widths) {
    const h = Math.round((w * maxH) / maxW);
    let pipeline = base.clone().resize(w, h, { fit: 'fill', kernel: 'lanczos3' });
    if (job.watermark && config.watermark.enabled && w >= config.watermark.minWidth) {
      pipeline = sharp(await pipeline.toBuffer()).composite([await watermarkOverlay(w, h)]);
    }
    const buf = await pipeline.toBuffer();
    const stem = path.join(outDir, `${id}-${w}`);
    await Promise.all([
      sharp(buf).avif(config.formats.avif).toFile(`${stem}.avif`),
      sharp(buf).webp(config.formats.webp).toFile(`${stem}.webp`),
      sharp(buf).jpeg(config.formats.jpeg).toFile(`${stem}.jpg`),
    ]);
    files.push({ file: `${stem}.avif`, ext: 'avif' }, { file: `${stem}.webp`, ext: 'webp' }, { file: `${stem}.jpg`, ext: 'jpg' });
  }
  await writeMetadata(files, job.meta);

  const small = base.clone().resize(200);
  const { dominant } = await small.stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('');
  const entry = { id, width: maxW, height: maxH, widths, color, lqip: await makeLqip(base, maxW, maxH) };
  return { entry, files: files.map((f) => f.file), cached: false, buffer: srcBuf };
}

/** Image Open Graph 1200 × 630, JPEG basse qualité, avec filigrane. */
async function makeOg(srcBuf, name) {
  const dir = r(config.ogDir);
  const id = hashOf(PIPELINE_VERSION, 'og', srcBuf, config.watermark);
  const file = path.join(dir, `${name}-${id}.jpg`);
  if (!existsSync(file) || FORCE) {
    let img = sharp(await sharp(srcBuf, { failOn: 'none' }).rotate().resize(1200, 630, { fit: 'cover', position: 'attention' }).toBuffer());
    if (config.watermark.enabled) img = img.composite([await watermarkOverlay(1200, 630)]);
    await img.jpeg({ quality: 58, mozjpeg: true }).toFile(file);
  }
  return `/og/${path.basename(file)}`;
}

/** Image Open Graph par défaut si aucune photo n'est disponible. */
async function makeFallbackOg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="#f4f1ec"/><text x="600" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#2b2b2b">Océane Saqué</text><text x="600" y="380" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="6" fill="#6b6259">PHOTOGRAPHIE</text></svg>`;
  return makeOg(await sharp(Buffer.from(svg)).png().toBuffer(), 'site');
}

/** Icônes PNG dérivées du favicon SVG (générées une seule fois). */
async function makeIcons() {
  const svg = r('public/favicon.svg');
  if (!existsSync(svg)) return;
  const target = r('public/apple-touch-icon.png');
  if (!existsSync(target) || FORCE) await sharp(svg, { density: 300 }).resize(180, 180).flatten({ background: '#f4f1ec' }).png().toFile(target);
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

async function main() {
  const t0 = Date.now();
  await mkdir(r(config.outputDir), { recursive: true });
  await mkdir(r(config.ogDir), { recursive: true });
  await mkdir(path.dirname(r(config.manifest)), { recursive: true });

  const previous = await readJson(r(config.manifest), { images: {}, og: {} });
  const manifest = { images: {}, og: {} };
  const keep = new Set();
  const jobs = await collectJobs();
  let encoded = 0;
  const firstOfRoom = new Map();
  let featuredBuf = null;

  for (const job of jobs) {
    const prev = previous.images?.[job.key];
    if (!existsSync(job.source)) {
      if (prev) {
        // Source absente (ex. clone sans sources/) : on conserve la version déjà publiée.
        manifest.images[job.key] = prev;
        prev.widths.forEach((w) => ['avif', 'webp', 'jpg'].forEach((e) => keep.add(`${prev.id}-${w}.${e}`)));
      } else if (!job.optional) {
        warn(`source introuvable : ${path.relative(ROOT, job.source)} (un cadre vide sera affiché)`);
      }
      continue;
    }
    const res = await processJob(job, prev);
    if (!res.cached) {
      encoded++;
      log(`✓ ${job.key} → ${res.entry.id} (${res.entry.widths.join(', ')} px)`);
    }
    manifest.images[job.key] = res.entry;
    res.files.forEach((f) => keep.add(path.basename(f)));
    if (job.roomId !== 'a-propos' && !firstOfRoom.has(job.roomId)) firstOfRoom.set(job.roomId, job.source);
    if (job.featured && !featuredBuf) featuredBuf = job.source;
  }

  // Images Open Graph : une par salle + une par défaut (photo vedette).
  const ogKeep = new Set();
  for (const [roomId, src] of firstOfRoom) {
    manifest.og[roomId] = await makeOg(await readFile(src), roomId);
    ogKeep.add(path.basename(manifest.og[roomId]));
  }
  const defaultSrc = featuredBuf ?? [...firstOfRoom.values()][0];
  // Sans aucune source (ex. build sur l'hébergeur), on garde l'image déjà publiée.
  manifest.og.default = defaultSrc
    ? await makeOg(await readFile(defaultSrc), 'site')
    : (previous.og?.default ?? (await makeFallbackOg()));
  ogKeep.add(path.basename(manifest.og.default));
  // Conserver les OG précédentes si leurs sources sont absentes.
  for (const [k, v] of Object.entries(previous.og ?? {})) {
    if (!manifest.og[k]) {
      manifest.og[k] = v;
      ogKeep.add(path.basename(v));
    }
  }
  await makeIcons();

  // Nettoyage des fichiers publiés devenus orphelins.
  let removed = 0;
  for (const [dir, set] of [[config.outputDir, keep], [config.ogDir, ogKeep]]) {
    for (const f of await readdir(r(dir))) {
      if (!set.has(f) && /\.(avif|webp|jpg)$/.test(f)) {
        await rm(path.join(r(dir), f));
        removed++;
      }
    }
  }

  // Signale les fichiers déposés dans sources/ mais non déclarés dans un JSON.
  const declared = new Set(jobs.map((j) => path.normalize(j.source)));
  if (existsSync(r(config.sourcesDir))) {
    for (const d of await readdir(r(config.sourcesDir), { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      for (const f of await readdir(path.join(r(config.sourcesDir), d.name))) {
        const full = path.normalize(path.join(r(config.sourcesDir), d.name, f));
        if (IMAGE_EXT.test(f) && !declared.has(full)) log(`ℹ ${d.name}/${f} n'est déclarée dans aucun fichier src/content/rooms/*.json`);
      }
    }
  }

  await writeFile(r(config.manifest), JSON.stringify(manifest, null, 2) + '\n');
  if (exiftool) await exiftool.end();
  log(`${Object.keys(manifest.images).length} image(s), ${encoded} encodée(s), ${removed} fichier(s) obsolète(s) supprimé(s) — ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

main().catch(async (e) => {
  console.error(e);
  if (exiftool) await exiftool.end();
  process.exit(1);
});
