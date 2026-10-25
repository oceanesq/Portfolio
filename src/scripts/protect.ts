/**
 * Dissuasion légère contre la copie des photos.
 *
 * Bloque UNIQUEMENT sur les photos : le menu contextuel (« Enregistrer l'image… »)
 * et le glisser-déposer. Le clic droit reste disponible partout ailleurs, et la
 * navigation au clavier / lecteur d'écran n'est pas affectée.
 *
 * Honnêtement : cela n'empêche pas une copie déterminée (capture d'écran, outils
 * de développement, cache du navigateur). La vraie protection est la faible
 * résolution publiée + le filigrane + la preuve de paternité (docs/PROTECTION.md).
 */

const PHOTO = '.frame__img, .lightbox__figure, .door__mini';

const isPhoto = (target: EventTarget | null) => target instanceof Element && target.closest(PHOTO) !== null;

document.addEventListener('contextmenu', (e) => {
  if (isPhoto(e.target)) e.preventDefault();
});
document.addEventListener('dragstart', (e) => {
  if (isPhoto(e.target)) e.preventDefault();
});
