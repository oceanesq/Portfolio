/**
 * Sitemap généré au build (sans dépendance), avec les alternatives de langue.
 */
import type { APIRoute } from 'astro';
import { getRooms } from '../lib/gallery';
import { site } from '../config/site';
import { path, staticRoutes, type Lang } from '../i18n/ui';

export const GET: APIRoute = async () => {
  const rooms = await getRooms('fr');
  const pages: Record<Lang, string>[] = [
    { fr: path('fr'), en: path('en') },
    ...rooms.map((r) => ({ fr: path('fr', r.slugs.fr), en: path('en', r.slugs.en) })),
    ...Object.values(staticRoutes).map((s) => ({ fr: path('fr', s.fr), en: path('en', s.en) })),
  ];
  const abs = (p: string) => new URL(p, site.url).href;
  const urls = pages
    .flatMap((alt) =>
      (['fr', 'en'] as const).map(
        (lang) => `  <url>
    <loc>${abs(alt[lang])}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${abs(alt.fr)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(alt.en)}"/>
  </url>`,
      ),
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
