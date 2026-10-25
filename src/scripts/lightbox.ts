/**
 * Visionneuse : ouvre une œuvre en grand dans le <dialog> de la page.
 * Clavier : ← → pour naviguer, Échap pour fermer (natif), Tab reste dans la visionneuse.
 * Tactile : balayage horizontal pour naviguer.
 */

export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog.lightbox');
  if (!dialog) return;
  const figure = dialog.querySelector<HTMLElement>('.lightbox__figure')!;
  const text = dialog.querySelector<HTMLElement>('.lightbox__text')!;
  const stage = dialog.querySelector<HTMLElement>('.lightbox__stage')!;
  const works = [...document.querySelectorAll<HTMLElement>('.work')].filter((w) => w.querySelector('[data-open]'));
  let index = 0;

  function render(i: number): void {
    index = (i + works.length) % works.length;
    const work = works[index];
    const picture = work.querySelector('picture')?.cloneNode(true) as HTMLElement | undefined;
    if (!picture) return;
    // En grand : le navigateur choisit la meilleure définition disponible (2000 px max).
    picture.querySelectorAll('source, img').forEach((el) => el.setAttribute('sizes', '100vw'));
    const img = picture.querySelector('img')!;
    img.loading = 'eager';
    img.removeAttribute('fetchpriority');

    // Calque transparent au-dessus de la photo (protection basique, cf. docs/PROTECTION.md).
    const shield = document.createElement('div');
    shield.className = 'lightbox__shield';
    figure.classList.remove('is-entering');
    figure.replaceChildren(picture, shield);
    void figure.offsetWidth; // relance l'animation d'entrée
    figure.classList.add('is-entering');

    const title = work.querySelector('.cartel__title')?.textContent ?? '';
    const body = work.querySelector('.cartel__text')?.textContent ?? '';
    const meta = work.querySelector('.cartel__meta')?.textContent ?? '';
    const h = document.createElement('h2');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = [body, meta].filter(Boolean).join(' — ');
    text.replaceChildren(h, p);
  }

  function open(i: number): void {
    render(i);
    document.documentElement.style.overflow = 'hidden';
    dialog!.showModal();
  }

  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    figure.replaceChildren();
    // Le mur se place sur la dernière œuvre regardée.
    works[index].closest('.room')?.dispatchEvent(new CustomEvent('gallery:goto', { detail: index }));
    works[index].querySelector<HTMLElement>('[data-open]')?.focus({ preventScroll: true });
  });

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-open]');
    if (!btn) return;
    const i = works.indexOf(btn.closest('.work')!);
    if (i >= 0) open(i);
  });

  dialog.addEventListener('click', (e) => {
    const action = (e.target as Element).closest<HTMLElement>('[data-lb]')?.dataset.lb;
    if (action === 'prev') render(index - 1);
    else if (action === 'next') render(index + 1);
    else if (action === 'close' || e.target === stage) dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') render(index + 1);
    else if (e.key === 'ArrowLeft') render(index - 1);
  });

  // Balayage tactile
  let startX = 0;
  let startY = 0;
  dialog.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });
  dialog.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - startY)) render(index + (dx < 0 ? 1 : -1));
  });
}
