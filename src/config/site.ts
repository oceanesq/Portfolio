/**
 * Configuration générale du site.
 * C'est LE fichier à modifier pour les informations de contact,
 * les réseaux sociaux et la mesure d'audience.
 */
import { SITE_URL } from './site-url.mjs';

export const site = {
  url: SITE_URL,
  author: 'Océane Saqué',
  /** Wordmark provisoire (remplaçable par un logo : voir src/components/Logo.astro). */
  wordmark: 'Océane Saqué',
  wordmarkSuffix: 'Photographie',
  email: 'oceane.saque@gmail.com',
  /** Année de début du copyright : la mention affichera « 2026 » puis « 2026–2027 », etc. */
  copyrightStartYear: 2026,

  /**
   * Réseaux sociaux. Pour activer Instagram : renseigner l'URL complète
   * (ex. 'https://www.instagram.com/oceane.saque/'). Laisser '' pour masquer le lien.
   */
  social: {
    instagram: '',
  },

  /**
   * Mesure d'audience respectueuse de la vie privée, chargée UNIQUEMENT après
   * acceptation dans le bandeau de consentement.
   *  - provider : 'plausible' | 'umami' | 'none'  ('none' = pas de bandeau du tout)
   *  - scriptSrc : URL du script (Plausible cloud, ou votre instance auto-hébergée)
   *  - domain    : (Plausible) nom de domaine déclaré dans Plausible
   *  - websiteId : (Umami) identifiant du site
   * Actuellement désactivée ('none') : pas de bandeau, pas de lien dans le pied de page.
   * Pour l'activer plus tard : voir la section « Mesure d'audience » du README
   * (penser aussi à la CSP de public/_headers et à la politique de confidentialité).
   */
  analytics: {
    provider: 'none' as 'plausible' | 'umami' | 'none',
    scriptSrc: 'https://plausible.io/js/script.js',
    domain: '',
    websiteId: '',
  },

  /** Matériel affiché sur la page « À propos ». */
  gear: {
    body: 'Sony A7 IV',
    lens: 'Sigma 28-70 mm f/2.8 DG DN | Contemporary',
  },
} as const;

/** Mention de copyright avec année dynamique (calculée au build). */
export function copyrightYears(): string {
  const now = new Date().getFullYear();
  const start = site.copyrightStartYear;
  return now > start ? `${start}–${now}` : `${start}`;
}
