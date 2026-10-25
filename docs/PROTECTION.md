# Protection des photos : checklist d'Océane

Ce que fait le site (réduction à 2000 px, filigrane, métadonnées, réserve TDM, robots.txt…) **dissuade et signale** : il n'empêche pas une copie déterminée. Ta vraie protection repose sur deux choses :

1. ne jamais publier de fichiers en pleine résolution (le site ne publie que des versions réduites) ;
2. **pouvoir prouver que tu es l'autrice** de chaque image, à une date donnée.

Cette checklist sert surtout le point 2.

---

## 1. Conserver les preuves d'origine (à chaque séance)

- [ ] Garder les **fichiers RAW** (.ARW du Sony A7 IV) **sans les modifier**. Leurs métadonnées EXIF (numéro de série du boîtier, date, objectif) sont une preuve forte.
- [ ] Garder le **catalogue Lightroom** (historique des développements).
- [ ] Sauvegarder selon la règle **3-2-1** : 3 copies, sur 2 supports différents, dont 1 hors de chez toi (disque chez un proche ou stockage en ligne chiffré).
- [ ] Ne jamais mettre les RAW ni les exports pleine résolution dans le dossier du site : seul `sources/` (exclu de git) sert d'entrée au pipeline.

## 2. Archiver les exports publiés (à chaque mise en ligne)

- [ ] Créer un dossier daté, par ex. `Archives/2026-10-24_mise-en-ligne/`, contenant :
  - les exports JPEG pleine résolution envoyés dans `sources/` ;
  - une copie de `src/content/rooms/*.json` (titres et textes) ;
  - une capture d'écran des pages publiées.
- [ ] Si le projet est sur GitHub, chaque commit date aussi les versions publiées (sans contenir les originaux).

## 3. Donner une date certaine (optionnel, recommandé pour les séries importantes)

- [ ] **Enveloppe e-Soleau** (INPI, dépôt en ligne payant, de l'ordre de 15 € ; tarif, taille maximale et durée de conservation à vérifier sur [inpi.fr](https://www.inpi.fr)) : prouve que tu détenais ces fichiers à cette date.
- [ ] **Constat de commissaire de justice** (ex-huissier) : utile si une reprise illicite est découverte, pour figer la preuve de la copie en ligne avant qu'elle disparaisse.
- [ ] **Adhésion à la SAIF** (Société des auteurs des arts visuels et de l'image fixe) : gestion collective de certains droits, conseil juridique, aide en cas de litige.

## 4. Surveiller les copies (rappel mensuel suggéré)

Le premier lundi de chaque mois, environ 15 minutes :

- [ ] Recherche d'image inversée sur tes 5 à 10 photos les plus fortes :
  - [Google Lens](https://lens.google.com/) ;
  - [TinEye](https://tineye.com/) ;
  - [Bing Visual Search](https://www.bing.com/visualsearch).
- [ ] Option : [Pixsy](https://www.pixsy.com/) (surveillance automatique ; peut gérer le recouvrement en cas d'usage commercial).
- [ ] Noter les résultats dans un tableau : date, URL, photo, action.

> Astuce : crée un rappel récurrent dans ton agenda : « Surveillance photos — 1er lundi du mois ».

## 5. Si une photo est reprise sans autorisation

1. **Ne pas réagir à chaud.** Faire des **captures d'écran datées** de la page (URL visible), l'enregistrer en PDF, et l'archiver sur [archive.org](https://web.archive.org/save). Pour un usage commercial ou un enjeu important, faire faire un **constat** par un commissaire de justice.
2. **Identifier** l'auteur de la reprise : site, mentions légales, réseau social, hébergeur (outils « whois », « hosting checker »).
3. **Premier contact courtois** par e-mail ou message : rappeler que tu es l'autrice, demander le retrait ou la régularisation (crédit + licence payante si usage commercial).
4. Sans réponse sous 8 à 15 jours : **mise en demeure** par lettre recommandée avec AR (articles L122-4 et L335-2 du Code de la propriété intellectuelle), avec un délai précis pour le retrait et, le cas échéant, une demande d'indemnisation.
5. En parallèle ou ensuite : **notification de retrait à l'hébergeur ou à la plateforme** (procédure LCEN en France, formulaire « DMCA » ou « droit d'auteur » sur Instagram, Facebook, Pinterest, Google…). L'hébergeur doit agir promptement une fois informé.
6. Si le préjudice est important : se faire accompagner (SAIF, avocate ou avocat en propriété intellectuelle). Pixsy peut aussi prendre le dossier à sa charge contre une commission.

## 6. Personnes photographiées et commandes

- Privilégier les **plans larges** ou les personnes non reconnaissables dans les foules (concerts, courses).
- Pour un portrait ou une personne isolée et reconnaissable : obtenir un **accord écrit** (un simple message suffit, à conserver).
- **Mineurs** : accord des parents indispensable.
- Toute demande de retrait (voir la page « Droit à l'image ») : retirer la photo de `src/content/rooms/*.json`, relancer `npm run build`, redéployer. Le pipeline supprime automatiquement les fichiers web devenus inutiles.
- **Photos de commande** (club, festival, association) : relire le contrat ou l'accord de cession **avant** de les publier. Une cession exclusive peut t'interdire de les exposer sur ton site.

## Ce que le site fait déjà pour toi

| Mesure | Effet | Limite |
|---|---|---|
| Versions réduites à 2000 px max | Pas d'exploitation en grand tirage | Suffisant pour un usage web |
| Filigrane « © Océane Saqué » | Identifie l'autrice | Peut être recadré ou retouché |
| Métadonnées IPTC/XMP (créatrice, copyright, conditions, e-mail) | Preuve et contact intégrés au fichier | Facilement supprimées (captures, réseaux sociaux) |
| Suppression des EXIF d'origine (GPS, n° de série) | Protège ta vie privée | — |
| robots.txt, TDMRep, `noai` | Réserve de droits lisible par machine (art. L122-5-3 CPI) | Respectée seulement par les robots de bonne foi |
| Clic droit et glisser bloqués sur les photos | Décourage la copie « en un clic » | Capture d'écran et outils du navigateur restent possibles |
| Mention de copyright sur chaque page et dans la visionneuse | Rappel clair des droits | — |
