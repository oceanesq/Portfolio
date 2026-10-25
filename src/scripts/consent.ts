/**
 * Consentement à la mesure d'audience.
 *  - Aucun script de mesure n'est chargé tant que la visiteuse ou le visiteur n'a pas accepté.
 *  - Le choix est mémorisé 6 mois dans le navigateur (localStorage, pas de cookie),
 *    puis redemandé. Il est modifiable à tout moment depuis le pied de page.
 */

const KEY = 'os-consent';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182; // ~6 mois

type Choice = 'granted' | 'denied';

function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw) as { v: Choice; t: number };
    if (Date.now() - t > MAX_AGE_MS) return null;
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function saveChoice(v: Choice): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v, t: Date.now() }));
  } catch {
    /* navigation privée stricte : le bandeau sera simplement redemandé */
  }
}

/** Charge Plausible ou Umami (configuré dans src/config/site.ts). */
function loadAnalytics(el: HTMLElement): void {
  const { provider, src, domain, websiteId } = el.dataset;
  if (!src || document.querySelector('script[data-analytics]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = src;
  s.dataset.analytics = provider;
  if (provider === 'plausible') {
    if (!domain) return console.info('[mesure d’audience] domaine Plausible non configuré : rien n’est chargé.');
    s.dataset.domain = domain;
  } else if (provider === 'umami') {
    if (!websiteId) return console.info('[mesure d’audience] identifiant Umami non configuré : rien n’est chargé.');
    s.dataset.websiteId = websiteId;
    s.dataset.doNotTrack = 'true';
  }
  document.head.append(s);
}

export function initConsent(): void {
  const el = document.getElementById('consent');
  if (!el) return;

  const show = (focus = false) => {
    el.hidden = false;
    if (focus) el.querySelector<HTMLButtonElement>('[data-consent]')?.focus();
  };

  const choice = readChoice();
  if (choice === 'granted') loadAnalytics(el);
  else if (!choice) show();

  el.addEventListener('click', (e) => {
    const v = (e.target as Element).closest<HTMLElement>('[data-consent]')?.dataset.consent as Choice | undefined;
    if (!v) return;
    const before = readChoice();
    saveChoice(v);
    el.hidden = true;
    if (v === 'granted') loadAnalytics(el);
    // Retrait du consentement : on recharge pour décharger le script déjà présent.
    else if (before === 'granted') location.reload();
  });

  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-consent-open]')) show(true);
  });
}
