/* The sitemap, written by hand rather than by @astrojs/sitemap: seven pages do not need a
 * dependency, and building it from the same collections the pages come from means a new
 * app or guide is listed the moment its file exists. The 404 is left out on purpose. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const [apps, guides] = await Promise.all([getCollection('apps'), getCollection('guides')]);
  const paths = [
    '/',
    '/apps/',
    '/about/',
    ...apps.map((a) => `/apps/${a.data.slug}/`),
    ...guides.map((g) => `/apps/${g.data.app}/guide/`),
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
