# Océane Saqué — Photographie

Portfolio photographique en forme de **galerie d'art virtuelle en 2D** : un hall d'entrée, puis une salle par univers (Paysages, Sport, Concerts & Festivals), où l'on se déplace le long d'un mur. Site statique, bilingue FR/EN, rapide (Lighthouse 99–100) et pensé pour protéger les photos.

- **Stack** : [Astro 5](https://astro.build) + TypeScript, CSS natif, moins de 8 ko de JavaScript vanilla (≈ 4 ko compressés). Aucun framework, aucune base de données.
- **Images** : pipeline maison avec [sharp](https://sharp.pixelplumbing.com) (AVIF / WebP / JPEG, filigrane, placeholders flous) et [exiftool](https://exiftool.org) (métadonnées de droits d'auteur).

---

## Démarrage

Prérequis : **Node.js 20.9 ou plus** (`node -v`).

```bash
npm install
npm run dev          # http://localhost:4321  (prépare d'abord les images)
npm run build        # site final dans dist/
npm run preview      # sert dist/ en local pour vérifier le build
```

| Commande | Rôle |
|---|---|
| `npm run images` | Traite les nouvelles photos de `sources/` (incrémental, lancé automatiquement par `dev` et `build`) |
| `npm run images:force` | Régénère **toutes** les images (après un changement de filigrane, par ex.) |
| `npm run demo` | Recrée les images de démonstration (abstraites, libres de droits) |
| `npm run check` | Vérifie les types TypeScript et les composants |

---

## Structure du projet

```
├── sources/                  ← TES EXPORTS LIGHTROOM (jamais publiés, ignorés par git)
│   ├── paysages/  sport/  concerts/
│   └── a-propos/portrait.jpg  (+ materiel.jpg facultatif)
├── scripts/
│   ├── images.config.mjs     ← réglages : tailles, qualité, FILIGRANE, métadonnées
│   ├── build-images.mjs      ← pipeline sources/ → public/photos/
│   └── generate-demo.mjs     ← images de démonstration
├── src/
│   ├── config/
│   │   ├── site.ts           ← e-mail, Instagram, mesure d'audience, matériel
│   │   └── site-url.mjs      ← adresse du site (nom de domaine)
│   ├── content/
│   │   ├── rooms/*.json      ← UNE SALLE PAR FICHIER : photos, titres, textes FR/EN
│   │   └── pages/{fr,en}/*.md← à propos, mentions légales, confidentialité, droit à l'image
│   ├── i18n/ui.ts            ← textes courts de l'interface FR/EN + adresses des pages
│   ├── components/           ← Work (cadre+spot+cartel), Room, Door, Lightbox, Header…
│   ├── scripts/              ← wall.ts (mur), lightbox.ts, consent.ts, protect.ts, prefetch.ts
│   ├── styles/global.css     ← toute la mise en forme (variables en tête de fichier)
│   ├── lib/gallery.ts        ← lecture des données
│   ├── generated/images.json ← manifeste produit par le pipeline (ne pas éditer)
│   └── pages/                ← routes : /fr/…, /en/…, 404, sitemap.xml, robots.txt
├── public/
│   ├── photos/  og/          ← versions web générées (à committer)
│   ├── _headers  _redirects  ← en-têtes de sécurité, cache, TDM (Netlify / Cloudflare)
│   └── .well-known/tdmrep.json
└── docs/PROTECTION.md        ← checklist de protection et de preuve de paternité
```

**Pages générées** : `/fr/` (hall), `/fr/paysages/`, `/fr/sport/`, `/fr/concerts-festivals/`, `/fr/a-propos/`, `/fr/mentions-legales/`, `/fr/confidentialite/`, `/fr/droit-a-l-image/`, et leurs équivalents `/en/…`.

---

## Ajouter ou remplacer une photo

1. Exporter depuis Lightroom en JPEG, **sRGB**, qualité 90 à 100, grand côté ≥ 2000 px. Le nom du fichier n'a aucune importance : il ne sera jamais publié.
2. Déposer le fichier dans `sources/<salle>/`, par ex. `sources/paysages/canigou-aube.jpg`.
3. Ajouter une entrée dans `src/content/rooms/paysages.json`, dans l'ordre d'accrochage voulu :

```json
{
  "fichier": "canigou-aube.jpg",
  "titre_fr": "Le Canigó à l'aube",
  "titre_en": "Canigó at dawn",
  "texte_fr": "Deux ou trois lignes sur la prise de vue.",
  "texte_en": "Two or three lines about the shot.",
  "lieu": "Pyrénées-Orientales",
  "annee": 2026,
  "alt_fr": "Description de ce que montre la photo, pour les personnes aveugles.",
  "alt_en": "Description of what the photo shows, for blind users.",
  "vedette": false
}
```

4. `npm run dev` : la photo est traitée puis accrochée.

- **Remplacer** une photo : écraser le fichier dans `sources/` (même nom), ou changer `fichier`.
- **Retirer** une photo : supprimer son entrée du JSON. Ses versions web sont effacées automatiquement au prochain `npm run images`.
- **Photos du hall** : `"vedette": true` (3 au maximum, dans l'ordre des salles ; la première est la plus grande).
- **Portrait** (page À propos) : `sources/a-propos/portrait.jpg`.
- **Matériel** (page À propos) : une illustration du Sony A7 IV + Sigma est affichée par défaut (`src/components/GearIllustration.astro`). Pour la remplacer par ta propre photo, déposer `sources/a-propos/materiel.jpg`.
- **Supprimer la démo** : retirer les entrées `demo-…` des JSON et les fichiers `sources/*/demo-*.jpg`.
- Champ facultatif `tirage` réservé à une future boutique (voir `src/content.config.ts`) : il n'est pas affiché pour l'instant.

Une erreur de saisie (virgule oubliée, champ manquant) est signalée clairement au lancement de `npm run dev`.

### Ajouter une salle

Créer `src/content/rooms/<id>.json` (copier une salle existante) avec `ordre`, `slug_fr`, `slug_en`, `nom_fr`, `nom_en`, `ambiance` (`claire`, `sombre`, `sport` ou `nature`) et `cadre` (`noir`, `chene`, `blanc` ou `alu`), puis le dossier `sources/<id>/`. La salle, sa porte dans le hall et son lien dans le menu apparaissent automatiquement.

---

## Pipeline d'images

`npm run images` (lancé automatiquement par `dev` et `build`) produit pour chaque photo :

- 5 largeurs (320, 640, 1024, 1440, 2000 px ; **grand côté plafonné à 2000 px**) × 3 formats (AVIF, WebP, JPEG de secours) ;
- un **filigrane** discret sur les versions ≥ 640 px ;
- les **métadonnées IPTC/XMP** : créatrice, copyright, conditions d'utilisation, e-mail, titre, légende. Vérifié : elles sont bien présentes dans les trois formats, AVIF compris ;
- la suppression des métadonnées d'origine (**GPS**, numéro de série du boîtier…) ;
- un placeholder flou (~0,5 ko) et la couleur dominante, affichés pendant le chargement ;
- une image Open Graph 1200 × 630 basse qualité par salle (aperçus sur les réseaux sociaux).

Les fichiers publiés ont des **noms neutres et hachés** (`public/photos/207bd1c7fd81-1440.avif`) : ils ne révèlent pas le nom d'origine et peuvent être mis en cache un an. Le traitement est incrémental : seules les photos modifiées sont ré-encodées.

Les originaux peuvent rester sur un disque externe :

```bash
IMAGES_SOURCES="D:/Photos/site" npm run images
```

### Régler le filigrane

Dans `scripts/images.config.mjs`, bloc `watermark` :

| Clé | Effet |
|---|---|
| `enabled` | `true` / `false` |
| `text` | Texte affiché (`© Océane Saqué`) |
| `image` | Chemin d'un PNG transparent (ta signature), prioritaire sur le texte |
| `position` | `bottom-right`, `bottom-left` ou `bottom-center` |
| `opacity` | 0 à 1 (0,3 à 0,45 reste discret) |
| `size` | Hauteur relative au petit côté de l'image (0,024 ≈ 2,4 %) |
| `minWidth` | Pas de filigrane sous cette largeur (vignettes) |

Puis `npm run images:force`.

---

## Modifier les textes

| Quoi | Où |
|---|---|
| Titres, textes et lieux des photos, noms et intros des salles | `src/content/rooms/*.json` |
| À propos, mentions légales, confidentialité, droit à l'image | `src/content/pages/fr/*.md` et `src/content/pages/en/*.md` |
| Boutons, menus, phrase d'accroche du hall, bandeau de consentement | `src/i18n/ui.ts` |
| E-mail, Instagram, matériel, année de début du copyright | `src/config/site.ts` |
| Nom de domaine | `src/config/site-url.mjs` |
| Couleurs, tailles, espacements | variables en tête de `src/styles/global.css` |
| Logo | `src/components/Logo.astro` (wordmark provisoire, procédure en commentaire) |

**Instagram** : renseigner `social.instagram` dans `src/config/site.ts` ; le lien apparaît dans le pied de page.

**Année du copyright** : calculée au moment du build (« 2026 », puis « 2026–2027 »…). Penser à reconstruire le site au moins une fois par an.

---

## Mesure d'audience et consentement

- Le bandeau propose **Refuser** et **Accepter**, avec exactement le même style. Le choix est mémorisé 6 mois (stockage local, pas de cookie) et modifiable via « Gérer la mesure d'audience » dans le pied de page.
- **Aucun script de mesure n'est chargé avant acceptation.** Aucun autre service tiers n'est utilisé : polices auto-hébergées, ni carte ni vidéo embarquée.
- Configuration dans `src/config/site.ts` → `analytics` :
  - **Plausible** : `provider: 'plausible'`, `domain: 'ton-domaine.fr'` ;
  - **Umami** : `provider: 'umami'`, `scriptSrc` (ton instance) et `websiteId`. Remplacer aussi `https://plausible.io` dans `public/_headers` (CSP) ;
  - **aucune mesure** : `provider: 'none'` (le bandeau disparaît).
- *Choix par défaut* : Plausible, avec un domaine vide. Le bandeau s'affiche pour valider le rendu, mais rien n'est chargé tant que `domain` n'est pas renseigné.

---

## Déploiement (hébergement statique)

Le dossier `dist/` produit par `npm run build` se dépose sur n'importe quel hébergeur statique. **Avant le premier déploiement**, committer `public/photos/`, `public/og/` et `src/generated/images.json` : l'hébergeur n'a pas accès à `sources/` (c'est voulu), et le pipeline réutilise alors les versions déjà générées.

### Netlify

1. Pousser le projet sur GitHub (dépôt privé conseillé).
2. Netlify → *Add new site* → *Import from Git*. `netlify.toml` fournit déjà `npm run build`, `dist` et Node 20.
3. *Domain management* : ajouter ton domaine, puis activer HTTPS (automatique).

### Cloudflare Pages

1. *Workers & Pages* → *Create* → *Pages* → *Connect to Git*.
2. Build command `npm run build`, output `dist`, variable d'environnement `NODE_VERSION = 20`.
3. *Custom domains* : ajouter ton domaine.

Les deux lisent automatiquement :

- `public/_headers` : CSP stricte, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noai, noimageai`, `tdm-reservation: 1`, et cache d'un an `immutable` sur `/_astro/`, `/photos/` et `/og/` (noms hachés) ;
- `public/_redirects` : `/` → `/fr/` (301) ;
- `404.html` : la page 404 « œuvre introuvable ».

---

## Protection des photos : ce qui est en place, et ses limites

| Mesure | Où |
|---|---|
| Originaux jamais publiés, versions ≤ 2000 px, noms neutres | `.gitignore` (`sources/`, `assets/`, RAW), pipeline |
| Mention « © Océane Saqué, 2026 — Tous droits réservés » + interdiction de reproduction | pied de page de chaque page et visionneuse |
| Filigrane configurable | `scripts/images.config.mjs` |
| Métadonnées IPTC/XMP | pipeline (exiftool) |
| Réserve TDM / IA : `robots.txt` (≈ 40 robots d'IA), `noai, noimageai`, TDMRep (`/.well-known/tdmrep.json`, en-tête et balise `tdm-reservation`), section dans les mentions légales | `src/pages/robots.txt.ts`, `Base.astro`, `public/` |
| Clic droit et glisser-déposer bloqués **uniquement sur les photos** ; calque transparent dans la visionneuse ; photos masquées à l'impression | `src/scripts/protect.ts`, `global.css` |
| Page « Droit à l'image » avec procédure de retrait | `src/content/pages/*/image-rights.md` |

**Limites, honnêtement :**

- Les **métadonnées** se suppriment en un clic, et les réseaux sociaux les effacent. C'est un complément, pas une protection.
- `robots.txt`, `noai` et TDMRep ne sont **respectés que par les robots de bonne foi**. Certains collecteurs les ignorent ou changent de nom. La réserve garde néanmoins une **valeur juridique** (art. L122-5-3 CPI). Mettre à jour la liste des robots de temps en temps (`AI_BOTS` dans `src/pages/robots.txt.ts`).
- Le blocage du clic droit **n'empêche pas** une capture d'écran ni l'usage des outils du navigateur. Il décourage seulement la copie en un clic, sans gêner la navigation au clavier ni les lecteurs d'écran.
- **La vraie protection** : faible résolution publiée + filigrane + **preuve de paternité**. Voir [`docs/PROTECTION.md`](docs/PROTECTION.md).

### Droit à l'image

- Privilégier les **plans larges** et les personnes non reconnaissables, surtout en concert et en compétition.
- Pour une personne isolée et reconnaissable : vérifier son **accord** (un message écrit suffit) ; pour un mineur, celui des parents.
- **Photos de commande** (club, festival…) : vérifier le **contrat de cession** avant de les publier sur le site.
- En cas de demande de retrait : supprimer l'entrée du JSON, `npm run build`, redéployer.

---

## Checklist avant mise en ligne

- [ ] Remplacer les photos de démonstration par les tiennes (et supprimer les entrées `demo-…`)
- [ ] Déposer le portrait : `sources/a-propos/portrait.jpg`
- [ ] Relire et ajuster les textes « À propos » FR/EN
- [ ] Choisir un nom de domaine → `src/config/site-url.mjs`
- [ ] Choisir l'hébergeur → compléter les **mentions légales** FR/EN (nom, adresse, contact de l'hébergeur)
- [ ] Compléter la **politique de confidentialité** (outil de mesure, durées, date) ; rechercher `[À COMPLÉTER]` / `[TO COMPLETE]` dans `src/content/pages/`
- [ ] Mesure d'audience : renseigner `domain` (Plausible) ou `websiteId` (Umami), ou `provider: 'none'`
- [ ] Optionnel : logo (`Logo.astro`), lien Instagram (`site.ts`), favicon définitif (`public/favicon.svg`, puis supprimer `public/apple-touch-icon.png` pour le régénérer)
- [ ] `npm run build` puis `npm run preview` : vérifier chaque salle, la visionneuse, le mobile
- [ ] Après déploiement : tester les en-têtes sur [securityheaders.com](https://securityheaders.com) et la performance sur [PageSpeed Insights](https://pagespeed.web.dev)
- [ ] Déclarer le site et `sitemap.xml` dans Google Search Console
- [ ] Mettre en place le rappel mensuel de surveillance des copies (`docs/PROTECTION.md`)

---

## Choix par défaut (faits sans te demander)

- **Polices** : Cormorant Garamond (titres) et Jost (texte), sous-ensemble latin (accents français et œ inclus), licence SIL OFL, dans `src/assets/fonts/`.
- **Couleur d'accent** : terre de Sienne `#8a5a32` (ambre `#e0a86c` dans la salle sombre).
- **Cadres** : chêne clair pour Paysages, noir pour Sport et Concerts. Passe-partout blanc cassé partout.
- **Transitions entre salles** : View Transitions natives du navigateur (fondu-glissement, sans JavaScript). Sur Firefox, la navigation reste instantanée, sans animation.
- **Mobile** : même mur horizontal, une œuvre par écran, aimantée au centre ; menu en `popover` natif.
- **Racine `/`** : redirige vers `/fr/` (pas de détection automatique de langue).
- **Dossier `assets/`** déjà présent à la racine (photos personnelles) : non utilisé par le site, et **ajouté au `.gitignore`** pour ne jamais être publié. Pour les utiliser, les déplacer dans `sources/<salle>/` et les déclarer dans le JSON.
- **Dépendance figée** : `@astrojs/language-server` est épinglé (bloc `overrides` de `package.json`) pour que `npm run check` fonctionne sous Node 20. Il peut être retiré en passant à Node 22.
