/**
 * Préchargement discret :
 *  - pendant l'inactivité du navigateur, la page de la salle suivante et sa première
 *    image (liens marqués data-prefetch) ;
 *  - au survol / focus d'un lien interne, la page visée.
 * Désactivé si la visiteuse ou le visiteur a activé l'économie de données.
 */

const done = new Set<string>();
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function prefetch(href: string, as?: 'image'): void {
  if (done.has(href)) return;
  done.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  if (as) link.as = as;
  document.head.append(link);
}

if (!saveData) {
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
  idle(() => {
    document.querySelectorAll<HTMLAnchorElement>('a[data-prefetch]').forEach((a) => {
      prefetch(a.href);
      if (a.dataset.prefetchImg) prefetch(a.dataset.prefetchImg, 'image');
    });
  });

  const onIntent = (e: Event) => {
    const a = (e.target as Element).closest?.('a');
    if (a && a.origin === location.origin && a.pathname !== location.pathname && !a.hash) prefetch(a.href);
  };
  document.addEventListener('pointerover', onIntent, { passive: true });
  document.addEventListener('focusin', onIntent);
}
