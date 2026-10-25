/**
 * Accès aux données de la galerie : salles, photos localisées et images générées.
 * Les composants n'ont jamais à connaître la structure des fichiers JSON.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import manifest from '../generated/images.json';
import type { Lang } from '../i18n/ui';

export type RoomEntry = CollectionEntry<'rooms'>;
export type Theme = 'light' | 'dark' | 'sport' | 'nature';
export type FrameStyle = RoomEntry['data']['cadre'];

/** Correspondance entre le champ "ambiance" des JSON et le thème CSS (data-theme). */
const THEMES: Record<RoomEntry['data']['ambiance'], Theme> = { claire: 'light', sombre: 'dark', sport: 'sport', nature: 'nature' };
type RawPhoto = RoomEntry['data']['photos'][number];

/** Image web générée par scripts/build-images.mjs. */
export interface WebImage {
  id: string;
  width: number;
  height: number;
  widths: number[];
  color: string;
  lqip: string;
}

/** Photo prête à afficher, dans une langue donnée. */
export interface Photo {
  key: string;
  title: string;
  text: string;
  alt: string;
  place: string;
  year: string;
  image: WebImage | null;
  /** Données de vente futures (non utilisées pour l'instant). */
  print?: RawPhoto['tirage'];
}

/** Salle prête à afficher, dans une langue donnée. */
export interface Room {
  id: string;
  order: number;
  slug: string;
  slugs: Record<Lang, string>;
  name: string;
  intro: string;
  /** Ambiance de la salle (thème de couleurs, cf. global.css). */
  theme: Theme;
  frame: FrameStyle;
  photos: Photo[];
}

const images = (manifest as { images: Record<string, WebImage> }).images;
export const ogImages = (manifest as { og: Record<string, string> }).og;

export function getImage(key: string): WebImage | null {
  return images[key] ?? null;
}

function localizePhoto(roomId: string, p: RawPhoto, lang: Lang): Photo {
  const key = `${roomId}/${p.fichier}`;
  return {
    key,
    title: lang === 'fr' ? p.titre_fr : p.titre_en,
    text: lang === 'fr' ? p.texte_fr : p.texte_en,
    alt: lang === 'fr' ? p.alt_fr : p.alt_en,
    place: p.lieu,
    year: p.annee !== undefined ? String(p.annee) : '',
    image: getImage(key),
    print: p.tirage,
  };
}

function localizeRoom(entry: RoomEntry, lang: Lang): Room {
  const d = entry.data;
  return {
    id: entry.id,
    order: d.ordre,
    slug: lang === 'fr' ? d.slug_fr : d.slug_en,
    slugs: { fr: d.slug_fr, en: d.slug_en },
    name: lang === 'fr' ? d.nom_fr : d.nom_en,
    intro: lang === 'fr' ? d.intro_fr : d.intro_en,
    theme: THEMES[d.ambiance],
    frame: d.cadre,
    photos: d.photos.map((p) => localizePhoto(entry.id, p, lang)),
  };
}

/** Toutes les salles, triées par ordre de visite. */
export async function getRooms(lang: Lang): Promise<Room[]> {
  const entries = await getCollection('rooms');
  return entries.sort((a, b) => a.data.ordre - b.data.ordre).map((e) => localizeRoom(e, lang));
}

/** Photos « vedette » du hall (3 maximum). À défaut, la première photo de chaque salle. */
export async function getFeatured(lang: Lang): Promise<Photo[]> {
  const rooms = await getRooms(lang);
  const featured: Photo[] = [];
  const entries = (await getCollection('rooms')).sort((a, b) => a.data.ordre - b.data.ordre);
  for (const e of entries) {
    e.data.photos.forEach((p) => p.vedette && featured.push(localizePhoto(e.id, p, lang)));
  }
  return (featured.length ? featured : rooms.map((r) => r.photos[0])).slice(0, 3);
}

/** Construit l'attribut srcset d'une image pour un format donné. */
export function srcset(img: WebImage, ext: 'avif' | 'webp' | 'jpg'): string {
  return img.widths.map((w) => `/photos/${img.id}-${w}.${ext} ${w}w`).join(', ');
}

/** URL d'une variante précise (la plus proche de la largeur demandée). */
export function variant(img: WebImage, width: number, ext: 'avif' | 'webp' | 'jpg' = 'jpg'): string {
  const w = img.widths.find((x) => x >= width) ?? img.widths[img.widths.length - 1];
  return `/photos/${img.id}-${w}.${ext}`;
}
