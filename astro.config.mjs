// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import { SITE_URL } from './src/config/site-url.mjs';

// Configuration Astro : site 100 % statique.
// Toute la configuration « métier » (e-mail, Instagram, mesure d'audience…)
// se trouve dans src/config/site.ts.
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: {
    // CSS inline dans chaque page : pas de requête bloquante au rendu.
    // La feuille de style est petite (~15 ko), c'est le meilleur compromis.
    inlineStylesheets: 'always',
    format: 'directory',
  },
  // Les images sont préparées par scripts/build-images.mjs (pas par Astro),
  // on désactive donc le service d'image intégré.
  image: { service: passthroughImageService() },
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
