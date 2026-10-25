/**
 * Textes courts de l'interface, en français et en anglais.
 * Les textes longs (à propos, pages légales) sont dans src/content/pages/.
 * Les textes des salles et des photos sont dans src/content/rooms/.
 */

export const languages = { fr: 'Français', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'fr';
export const langs = Object.keys(languages) as Lang[];

export const ui = {
  fr: {
    'site.title': 'Océane Saqué — Photographie',
    'site.description':
      'Galerie de photographies d’Océane Saqué : paysages, sport, concerts et festivals. Toulouse et Céret.',
    'skip': 'Aller au contenu',
    'nav.label': 'Navigation principale',
    'nav.hall': 'Hall',
    'nav.about': 'À propos',
    'nav.menu': 'Salles',
    'lang.switch': 'Read in English',
    'lang.short': 'EN',

    'hall.tagline': 'Paysages, sport et scènes de concert : une galerie personnelle, entre Toulouse et Céret.',
    'hall.featured': 'Œuvres exposées dans le hall',
    'hall.rooms': 'Choisir une salle',
    'hall.enter': 'Entrer',
    'hall.count': '{n} œuvres',

    'room.label': 'Salle',
    'room.wall': 'Mur d’exposition, faites défiler horizontalement',
    'room.hint': 'Faites défiler, glissez ou utilisez les flèches',
    'room.prev': 'Œuvre précédente',
    'room.next': 'Œuvre suivante',
    'room.position': 'Œuvre {i} sur {n}',
    'room.open': 'Agrandir « {title} »',
    'room.nextRoom': 'Salle suivante',
    'room.backHall': 'Retour au hall',
    'room.missing': 'Image à venir',

    'lightbox.label': 'Visionneuse',
    'lightbox.close': 'Fermer la visionneuse',
    'lightbox.prev': 'Photo précédente',
    'lightbox.next': 'Photo suivante',

    'footer.rights': 'Tous droits réservés',
    'footer.notice': 'Toute reproduction, représentation ou utilisation sans autorisation écrite préalable est interdite.',
    'footer.legal': 'Mentions légales',
    'footer.privacy': 'Confidentialité',
    'footer.cookies': 'Gérer la mesure d’audience',
    'footer.imageRights': 'Droit à l’image',
    'footer.contact': 'Contact',
    'footer.instagram': 'Instagram',

    'consent.label': 'Mesure d’audience',
    'consent.text':
      'Puis-je mesurer la fréquentation de ce site de façon anonyme (sans cookie ni donnée personnelle) ? Votre choix peut être modifié à tout moment.',
    'consent.accept': 'Accepter',
    'consent.refuse': 'Refuser',
    'consent.more': 'En savoir plus',

    'about.gear': 'Mon matériel',
    'about.body': 'Boîtier',
    'about.lens': 'Objectif',
    'about.gearAlt': 'Illustration du boîtier hybride Sony A7 IV équipé de l’objectif Sigma 28-70 mm f/2.8',
    'about.gearPhotoAlt': 'Le Sony A7 IV d’Océane, équipé de son objectif Sigma 28-70 mm f/2.8',
    'about.contact': 'Écrire à Océane',
    'about.portrait': 'Portrait d’Océane Saqué',
    'about.portraitMissing': 'Portrait à venir',

    '404.title': 'Œuvre introuvable',
    '404.text': 'Ce mur est vide : la page demandée n’existe pas ou a été déplacée.',
    '404.back': 'Retourner au hall',
  },
  en: {
    'site.title': 'Océane Saqué — Photography',
    'site.description':
      'Photography gallery by Océane Saqué: landscapes, sport, concerts and festivals. Toulouse and Céret, France.',
    'skip': 'Skip to content',
    'nav.label': 'Main navigation',
    'nav.hall': 'Hall',
    'nav.about': 'About',
    'nav.menu': 'Rooms',
    'lang.switch': 'Lire en français',
    'lang.short': 'FR',

    'hall.tagline': 'Landscapes, sport and concert stages: a personal gallery, between Toulouse and Céret.',
    'hall.featured': 'Works on display in the hall',
    'hall.rooms': 'Choose a room',
    'hall.enter': 'Enter',
    'hall.count': '{n} works',

    'room.label': 'Room',
    'room.wall': 'Exhibition wall, scroll horizontally',
    'room.hint': 'Scroll, swipe or use the arrow keys',
    'room.prev': 'Previous work',
    'room.next': 'Next work',
    'room.position': 'Work {i} of {n}',
    'room.open': 'Enlarge “{title}”',
    'room.nextRoom': 'Next room',
    'room.backHall': 'Back to the hall',
    'room.missing': 'Image coming soon',

    'lightbox.label': 'Viewer',
    'lightbox.close': 'Close viewer',
    'lightbox.prev': 'Previous photo',
    'lightbox.next': 'Next photo',

    'footer.rights': 'All rights reserved',
    'footer.notice': 'No reproduction, display or use is permitted without prior written consent.',
    'footer.legal': 'Legal notice',
    'footer.privacy': 'Privacy',
    'footer.cookies': 'Audience measurement settings',
    'footer.imageRights': 'Image rights',
    'footer.contact': 'Contact',
    'footer.instagram': 'Instagram',

    'consent.label': 'Audience measurement',
    'consent.text':
      'May I measure visits to this site anonymously (no cookies, no personal data)? You can change your choice at any time.',
    'consent.accept': 'Accept',
    'consent.refuse': 'Decline',
    'consent.more': 'Learn more',

    'about.gear': 'My gear',
    'about.body': 'Camera',
    'about.lens': 'Lens',
    'about.gearAlt': 'Illustration of the Sony A7 IV mirrorless camera fitted with the Sigma 28-70 mm f/2.8 lens',
    'about.gearPhotoAlt': 'Océane’s Sony A7 IV, fitted with her Sigma 28-70 mm f/2.8 lens',
    'about.contact': 'Write to Océane',
    'about.portrait': 'Portrait of Océane Saqué',
    'about.portraitMissing': 'Portrait coming soon',

    '404.title': 'Work not found',
    '404.text': 'This wall is empty: the page you are looking for does not exist or has moved.',
    '404.back': 'Return to the hall',
  },
} as const;

export type UiKey = keyof (typeof ui)['fr'];

/** Renvoie une fonction de traduction : t('room.position', { i: 2, n: 10 }). */
export function useTranslations(lang: Lang) {
  return (key: UiKey, vars: Record<string, string | number> = {}) =>
    (ui[lang][key] ?? ui[defaultLang][key]).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/**
 * Adresses des pages fixes, par langue. Ajouter une page = ajouter une ligne ici
 * et un fichier Markdown dans src/content/pages/<langue>/<clé>.md.
 */
export const staticRoutes = {
  about: { fr: 'a-propos', en: 'about' },
  legal: { fr: 'mentions-legales', en: 'legal-notice' },
  privacy: { fr: 'confidentialite', en: 'privacy' },
  imageRights: { fr: 'droit-a-l-image', en: 'image-rights' },
} as const;
export type StaticKey = keyof typeof staticRoutes;

/** Construit une URL interne : path('fr', 'paysages') → '/fr/paysages/'. */
export function path(lang: Lang, slug = ''): string {
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');
