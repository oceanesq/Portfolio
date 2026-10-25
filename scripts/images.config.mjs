/**
 * Réglages du pipeline d'images (scripts/build-images.mjs).
 * Toute modification ici régénère les images au prochain `npm run images`
 * (les noms de fichiers publiés changent, le cache navigateur est donc invalidé).
 */
export default {
  /**
   * Dossier des exports Lightroom pleine résolution (exclu de git et du déploiement).
   * Peut être remplacé par la variable d'environnement IMAGES_SOURCES
   * (ex. un disque externe : IMAGES_SOURCES="D:/Photos/exports-site").
   */
  sourcesDir: process.env.IMAGES_SOURCES || 'sources',
  /** Dossier des versions web publiées (noms neutres et hachés). */
  outputDir: 'public/photos',
  /** Dossier des images Open Graph (aperçus pour les réseaux sociaux, basse définition). */
  ogDir: 'public/og',
  /** Manifeste lu par les composants Astro (dimensions, srcset, placeholder). */
  manifest: 'src/generated/images.json',

  /** Grand côté maximum des versions publiées, en pixels. Ne pas dépasser 2000. */
  maxLongSide: 2000,
  /** Largeurs générées pour srcset (filtrées selon la taille réelle de l'image). */
  widths: [320, 640, 1024, 1440, 2000],

  /** Qualité des formats (AVIF en priorité, WebP puis JPEG en secours). */
  formats: {
    avif: { quality: 52, effort: 4, chromaSubsampling: '4:2:0' },
    webp: { quality: 78, effort: 5 },
    jpeg: { quality: 80, mozjpeg: true, progressive: true },
  },

  /**
   * Filigrane incrusté dans les versions web.
   *  - enabled  : true / false
   *  - text     : texte affiché (ou utiliser `image` pour une signature PNG transparente)
   *  - image    : chemin d'un PNG transparent (ex. 'scripts/signature.png'), prioritaire sur `text`
   *  - position : 'bottom-right' | 'bottom-left' | 'bottom-center'
   *  - opacity  : 0 à 1 (0.3 à 0.45 = discret)
   *  - size     : hauteur du texte en proportion du petit côté de l'image (0.022 ≈ 2,2 %)
   *  - margin   : marge au bord, en proportion du petit côté
   *  - minWidth : pas de filigrane sur les versions plus petites (vignettes)
   */
  watermark: {
    enabled: true,
    text: '© Océane Saqué',
    image: '',
    position: 'bottom-right',
    opacity: 0.38,
    size: 0.024,
    margin: 0.028,
    color: '#ffffff',
    fontFamily: 'Georgia, "Times New Roman", serif',
    minWidth: 640,
  },

  /** Métadonnées IPTC / XMP écrites dans chaque fichier publié. */
  metadata: {
    enabled: true,
    creator: 'Océane Saqué',
    email: 'oceane.saque@gmail.com',
    copyright: '© Océane Saqué — Tous droits réservés / All rights reserved',
    usageTerms:
      "Toute reproduction, représentation ou utilisation sans autorisation écrite préalable est interdite. " +
      'Fouille de textes et de données (TDM) et entraînement d’IA interdits (art. L122-5-3 CPI). / ' +
      'No reproduction or use without prior written permission. Text and data mining and AI training prohibited.',
  },
};
