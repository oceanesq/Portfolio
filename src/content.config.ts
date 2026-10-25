/**
 * Schémas des contenus. Une erreur de saisie dans un fichier JSON ou Markdown
 * (champ manquant, faute de frappe dans un nom de champ…) est signalée clairement
 * au lancement de `npm run dev` ou `npm run build`.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Une photo exposée. */
const photo = z.object({
  /** Nom du fichier dans sources/<salle>/ (export Lightroom). */
  fichier: z.string(),
  titre_fr: z.string(),
  titre_en: z.string(),
  /** Texte du cartel, 2 à 3 lignes. */
  texte_fr: z.string().default(''),
  texte_en: z.string().default(''),
  lieu: z.string().default(''),
  annee: z.union([z.number(), z.string()]).optional(),
  /** Texte alternatif (accessibilité) : décrire ce que montre la photo. */
  alt_fr: z.string(),
  alt_en: z.string(),
  /** true = exposée dans le hall d'entrée (3 maximum, dans l'ordre des salles). */
  vedette: z.boolean().optional(),
  /**
   * Réservé à une future boutique de tirages (non affiché pour l'instant).
   * Exemple : { "disponible": true, "formats": [{ "nom": "30×45", "prix_eur": 90 }] }
   */
  tirage: z
    .object({
      disponible: z.boolean().default(false),
      edition_limitee: z.number().int().positive().optional(),
      formats: z.array(z.object({ nom: z.string(), prix_eur: z.number().positive() })).default([]),
    })
    .optional(),
});

/** Une salle = un fichier src/content/rooms/<id>.json (l'id est le nom du fichier). */
const rooms = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/rooms' }),
  schema: z.object({
    ordre: z.number(),
    slug_fr: z.string().regex(/^[a-z0-9-]+$/, 'minuscules, chiffres et tirets uniquement'),
    slug_en: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only'),
    nom_fr: z.string(),
    nom_en: z.string(),
    intro_fr: z.string().default(''),
    intro_en: z.string().default(''),
    /** 'claire' (murs blanc cassé), 'sombre' (murs anthracite), 'sport' (béton clair, sol de piste) ou 'nature' (vert forêt, courbes de niveau, caillebotis). */
    ambiance: z.enum(['claire', 'sombre', 'sport', 'nature']),
    /** Couleur des cadres de la salle. */
    cadre: z.enum(['noir', 'chene', 'blanc', 'alu']),
    photos: z.array(photo).min(1),
  }),
});

/** Pages de texte (à propos, mentions légales…) : src/content/pages/<langue>/<clé>.md */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { rooms, pages };
