/**
 * robots.txt généré au build (l'adresse du sitemap suit SITE_URL).
 * Les moteurs de recherche classiques sont autorisés ; les robots de collecte
 * pour l'IA sont refusés (réserve de droits, art. L122-5-3 CPI).
 * Liste à mettre à jour de temps en temps (voir README).
 */
import type { APIRoute } from 'astro';
import { site } from '../config/site';

export const AI_BOTS = [
  // OpenAI
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  // Anthropic
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Claude-Web', 'anthropic-ai',
  // Common Crawl (base de nombreux jeux d'entraînement)
  'CCBot',
  // Google (IA uniquement : Googlebot reste autorisé pour la recherche)
  'Google-Extended', 'GoogleOther', 'GoogleOther-Image',
  // Apple (IA uniquement : Applebot reste autorisé)
  'Applebot-Extended',
  // Perplexity, ByteDance, Amazon, Meta
  'PerplexityBot', 'Perplexity-User', 'Bytespider', 'TikTokSpider', 'Amazonbot',
  'FacebookBot', 'Meta-ExternalAgent', 'Meta-ExternalFetcher',
  // Autres collecteurs IA / jeux de données d'images
  'cohere-ai', 'cohere-training-data-crawler', 'MistralAI-User', 'Diffbot', 'ImagesiftBot',
  'img2dataset', 'Omgilibot', 'Omgili', 'YouBot', 'Timpibot', 'AI2Bot', 'Ai2Bot-Dolma',
  'DuckAssistBot', 'PanguBot', 'Kangaroo Bot', 'Webzio-Extended', 'VelenPublicWebCrawler',
  'iaskspider/2.0', 'ICC-Crawler', 'Scrapy',
];

export const GET: APIRoute = () => {
  const body = `# Océane Saqué — Photographie
# Réserve de droits : fouille de textes et de données et entraînement d'IA interdits
# (art. L122-5-3 CPI, art. 4 directive (UE) 2019/790). Voir aussi /.well-known/tdmrep.json.

${AI_BOTS.map((b) => `User-agent: ${b}`).join('\n')}
Disallow: /

User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', site.url).href}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
