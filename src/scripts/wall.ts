/**
 * Mur d'exposition : déplacement horizontal fluide.
 *
 * Le mur utilise le défilement NATIF du navigateur (overflow-x), ce qui garantit
 * la fluidité au doigt et au trackpad. Ce script ajoute uniquement :
 *  - molette verticale → déplacement horizontal (avec lissage) ;
 *  - glisser à la souris (avec inertie) ;
 *  - flèches du clavier, Début/Fin, boutons précédent/suivant ;
 *  - parallaxe du sol et des reflets (transform uniquement) ;
 *  - compteur « 03 / 10 » et annonce pour les lecteurs d'écran.
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const PARALLAX_POOLS = 1.12; // reflets au sol : un peu plus rapides que le mur
const PLANK = 112; // largeur d'une lame de parquet (7rem), pour boucler la translation

export function initWalls(): void {
  document.querySelectorAll<HTMLElement>('[data-wall]').forEach(setupWall);
}

function setupWall(wall: HTMLElement): void {
  const room = wall.closest<HTMLElement>('.room')!;
  const plane = room.querySelector<HTMLElement>('.floor__plane');
  const pools = room.querySelector<HTMLElement>('.floor__pools');
  const works = [...wall.querySelectorAll<HTMLElement>('.work')];
  const prevBtn = room.querySelector<HTMLButtonElement>('[data-wall-prev]');
  const nextBtn = room.querySelector<HTMLButtonElement>('[data-wall-next]');
  const counter = room.querySelector<HTMLElement>('[data-wall-counter]');
  const live = room.querySelector<HTMLElement>('[data-wall-live]');
  const total = String(works.length).padStart(2, '0');

  let centers: number[] = [];
  let pos = wall.scrollLeft; // position animée (flottante)
  let target = pos;
  let animating = false;
  let announce = false;
  let frameRequested = false;

  const maxScroll = () => wall.scrollWidth - wall.clientWidth;
  const clamp = (x: number) => Math.max(0, Math.min(maxScroll(), x));
  const viewCenter = () => wall.scrollLeft + wall.clientWidth / 2;

  /** Mesure la position des œuvres et place les reflets au sol. */
  function measure(): void {
    centers = works.map((w) => w.offsetLeft + w.offsetWidth / 2);
    if (pools) {
      const half = wall.clientWidth / 2;
      pools.replaceChildren(
        ...centers.map((c) => {
          const el = document.createElement('span');
          el.className = 'floor__pool';
          // Le reflet est exactement sous l'œuvre quand celle-ci est centrée à l'écran.
          el.style.left = `${PARALLAX_POOLS * (c - half) + half}px`;
          return el;
        }),
      );
    }
    render();
  }

  /** Index de l'œuvre la plus proche du centre de l'écran. */
  function currentIndex(): number {
    const vc = viewCenter();
    let best = 0;
    centers.forEach((c, i) => {
      if (Math.abs(c - vc) < Math.abs(centers[best] - vc)) best = i;
    });
    return best;
  }

  /** Met à jour parallaxe, compteur et boutons (appelé au plus une fois par image). */
  function render(): void {
    frameRequested = false;
    const x = wall.scrollLeft;
    if (!reducedMotion.matches) {
      plane?.style.setProperty('--floor-x', `${-(x % PLANK)}px`);
      pools?.style.setProperty('--pools-x', `${-x * PARALLAX_POOLS}px`);
    } else {
      pools?.style.setProperty('--pools-x', `${-x}px`);
    }
    const i = currentIndex();
    if (counter) counter.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`;
    if (prevBtn) prevBtn.disabled = x <= 2;
    if (nextBtn) nextBtn.disabled = x >= maxScroll() - 2;
  }

  wall.addEventListener(
    'scroll',
    () => {
      if (!frameRequested) {
        frameRequested = true;
        requestAnimationFrame(render);
      }
    },
    { passive: true },
  );

  // --- Animation lissée ------------------------------------------------------
  function step(): void {
    pos += (target - pos) * 0.14;
    if (Math.abs(target - pos) < 0.5) {
      pos = target;
      animating = false;
      wall.style.scrollSnapType = '';
      if (announce && live) {
        live.textContent = (live.dataset.template ?? '').replace('{i}', String(currentIndex() + 1));
        announce = false;
      }
    }
    wall.scrollLeft = pos;
    if (animating) requestAnimationFrame(step);
  }

  function animateTo(x: number): void {
    target = clamp(x);
    if (reducedMotion.matches) {
      wall.scrollLeft = target;
      pos = target;
      return;
    }
    if (!animating) {
      pos = wall.scrollLeft;
      animating = true;
      // L'aimantation (mobile) gênerait l'animation : suspendue le temps du trajet.
      wall.style.scrollSnapType = 'none';
      requestAnimationFrame(step);
    }
  }
  const stop = () => {
    animating = false;
    target = pos = wall.scrollLeft;
    wall.style.scrollSnapType = '';
  };

  function goTo(i: number, speak = true): void {
    announce = speak;
    if (i < 0) return animateTo(0);
    if (i >= works.length) return animateTo(maxScroll());
    animateTo(centers[i] - wall.clientWidth / 2);
  }
  function next(): void {
    const vc = viewCenter();
    const i = centers.findIndex((c) => c > vc + 8);
    goTo(i === -1 ? works.length : i);
  }
  function prev(): void {
    const vc = viewCenter();
    let i = -1;
    centers.forEach((c, k) => c < vc - 8 && (i = k));
    goTo(i);
  }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // --- Molette verticale → horizontal -------------------------------------------
  wall.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) return; // zoom du navigateur
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; // trackpad horizontal : natif
      if (window.scrollY > 2) return; // la page est descendue (pied de page) : défilement normal
      const base = animating ? target : wall.scrollLeft;
      const max = maxScroll();
      // Aux extrémités du mur, on laisse la page défiler (accès au pied de page).
      if ((e.deltaY > 0 && base >= max - 1) || (e.deltaY < 0 && base <= 1)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? wall.clientWidth : 1;
      animateTo(base + e.deltaY * unit * 1.1);
    },
    { passive: false },
  );

  // --- Glisser à la souris (le tactile utilise le défilement natif) ---------------
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragging = false;
  let pressed = false;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;

  wall.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if ((e.target as Element).closest('.cartel, a')) return; // texte sélectionnable, liens
    stop();
    pressed = true;
    dragging = false;
    dragStartX = lastX = e.clientX;
    dragStartScroll = wall.scrollLeft;
    lastT = performance.now();
    velocity = 0;
  });
  window.addEventListener('pointermove', (e) => {
    if (!pressed) return;
    const dx = e.clientX - dragStartX;
    if (!dragging && Math.abs(dx) > 6) {
      dragging = true;
      wall.classList.add('is-dragging');
    }
    if (!dragging) return;
    const now = performance.now();
    velocity = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX;
    lastT = now;
    wall.scrollLeft = dragStartScroll - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    if (!dragging) return;
    wall.classList.remove('is-dragging');
    // Le clic qui suit immédiatement un glisser ne doit pas ouvrir la visionneuse.
    suppressClick = true;
    setTimeout(() => (suppressClick = dragging = false), 0);
    animateTo(wall.scrollLeft - velocity * 280); // inertie
  });
  let suppressClick = false;
  wall.addEventListener(
    'click',
    (ev) => {
      if (!suppressClick) return;
      ev.stopPropagation();
      ev.preventDefault();
    },
    { capture: true },
  );

  // --- Clavier -------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.querySelector('dialog[open]')) return;
    const active = document.activeElement;
    const free = !active || active === document.body || active.id === 'main' || wall.contains(active);
    if (!free) return;
    const keys: Record<string, () => void> = {
      ArrowRight: next,
      ArrowLeft: prev,
      Home: () => goTo(-1),
      End: () => goTo(works.length),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  });

  // Tabulation : l'œuvre qui reçoit le focus est centrée.
  wall.addEventListener('focusin', (e) => {
    const work = (e.target as Element).closest<HTMLElement>('.work');
    if (work) goTo(works.indexOf(work), false);
  });

  // La visionneuse demande de se placer sur une œuvre (après navigation dans celle-ci).
  room.addEventListener('gallery:goto', (e) => goTo((e as CustomEvent<number>).detail, false));

  // Annule l'animation si l'utilisatrice reprend la main au doigt.
  wall.addEventListener('touchstart', stop, { passive: true });

  new ResizeObserver(measure).observe(wall);
  measure();
}
