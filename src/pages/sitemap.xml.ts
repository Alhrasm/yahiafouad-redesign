import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pillars } from '../data/pillars';
import { abs } from '../lib/url';

export const GET: APIRoute = async ({ site }) => {
  const articles = await getCollection('articles');
  const staticPages = ['/', '/about-us/', '/consultations/', '/booking-app/', '/programs/', '/articles/', '/ourreviwe/', '/contact-us/'];
  const urls = [
    ...staticPages.map((p) => ({ loc: abs(p, site), lastmod: undefined as string | undefined })),
    ...pillars.map((p) => ({ loc: abs(`/${p.slug}/`, site), lastmod: undefined })),
    ...articles.map((a) => ({ loc: abs(`/${a.data.slug}/`, site), lastmod: a.data.modified.toISOString() })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${encodeURI(decodeURI(u.loc))}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
