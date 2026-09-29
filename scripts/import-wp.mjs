/**
 * Import published articles from the live WordPress site (REST API) into the
 * Astro content collection. Re-runnable: new posts on WordPress become new
 * article pages here, keeping the original WordPress slug (URL preserved).
 *
 *   npm run import:wp
 *
 * - Cleans Elementor / inline-style markup down to semantic HTML.
 * - Lifts the "الإجابة باختصار" summary box into frontmatter (`tldr`).
 * - Extracts Q&A pairs under a "أسئلة" heading into `faq` (FAQPage schema).
 * - Drops the hard-coded CTA + byline boxes (the template renders its own).
 * - Downloads the featured image locally so Astro can optimise it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const WP = process.env.WP_URL || 'https://yahiafouad.com';
const OUT_MD = 'src/content/articles';
const OUT_IMG = 'src/assets/articles';

const CATEGORY_MAP = { 60: { key: 'parenting', label: 'التربية' } };

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, '…');

const text = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

function clean(html, featuredUrl) {
  let h = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '');

  // Summary box -> tldr
  let tldr = null;
  h = h.replace(
    /<div[^>]*>\s*<p[^>]*>\s*الإجابة باختصار\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/,
    (_, inner) => {
      tldr = inner.replace(/\s(style|class)="[^"]*"/g, '').trim();
      return '';
    },
  );

  // Cut the trailing CTA / byline boxes (template renders its own)
  const cta = h.search(/<div[^>]*>\s*<h3[^>]*>\s*محتاج/);
  if (cta > -1) h = h.slice(0, cta);
  const share = h.search(/إذا وجدت المقال مفيدًا/);
  if (share > -1) h = h.slice(0, h.lastIndexOf('<p', share));

  // Remove the featured image if repeated as the first figure
  h = h.replace(/<figure[^>]*>\s*<img[^>]+>\s*<\/figure>/, (m) =>
    featuredUrl && m.includes(path.basename(featuredUrl).split('.')[0]) ? '' : m,
  );

  // Unwrap layout containers + spans
  h = h.replace(/<\/?(div|span|section)[^>]*>/g, '');
  // Strip presentation attributes
  h = h.replace(/\s(style|class|id|data-[\w-]+|srcset|sizes|fetchpriority|loading|decoding)="[^"]*"/g, '');
  // <p><strong>Short heading</strong></p> -> <h2>
  h = h.replace(/<p>\s*<strong>([^<]{3,90})<\/strong>\s*<\/p>/g, '<h2>$1</h2>');
  // Leading <br> inside paragraphs, empty paragraphs
  h = h.replace(/<p>\s*(<br\s*\/?>\s*)+/g, '<p>');
  h = h.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '');
  // Images: lazy + async; empty alt → derive from the (Arabic) file name
  h = h.replace(/<img /g, '<img loading="lazy" decoding="async" ');
  h = h.replace(/<img([^>]*?)src="([^"]+)"([^>]*?)alt=""/g, (m, a, src, b) => {
    const name = decodeURIComponent(src.split('/').pop() || '')
      .replace(/\.(webp|jpe?g|png)$/i, '')
      .replace(/-(\d+x\d+|scaled|\d)$/g, '')
      .replace(/-(\d+x\d+|scaled|\d)$/g, '')
      .replace(/-/g, ' ')
      .trim();
    return `<img${a}src="${src}"${b}alt="${name}"`;
  });
  // Internal links -> root-relative (base path is applied by the template)
  h = h.replace(/href="https:\/\/yahiafouad\.com\/booking-app\/"/g, 'href="/booking-app/"');
  h = h.replace(/\n{3,}/g, '\n\n').trim();

  // FAQ extraction: h3 question + following paragraph(s) after a "أسئلة" h2
  const faq = [];
  const faqStart = h.search(/<h2>[^<]*أسئلة[^<]*<\/h2>/);
  if (faqStart > -1) {
    const block = h.slice(faqStart);
    for (const m of block.matchAll(/<h3>([\s\S]*?)<\/h3>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/g)) {
      faq.push({ q: text(m[1]), a: text(m[2]) });
    }
  }
  return { body: h, tldr, faq };
}

const yamlStr = (s) => JSON.stringify(s ?? '');

async function main() {
  await fs.mkdir(OUT_MD, { recursive: true });
  await fs.mkdir(OUT_IMG, { recursive: true });
  const posts = await (await fetch(`${WP}/wp-json/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`)).json();
  for (const p of posts) {
    const media = p._embedded?.['wp:featuredmedia']?.[0];
    const imgUrl = media?.source_url;
    let imgFile = null;
    if (imgUrl) {
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      imgFile = `${p.id}${ext}`;
      const buf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
      await fs.writeFile(path.join(OUT_IMG, imgFile), buf);
    }
    const { body, tldr, faq } = clean(p.content.rendered, imgUrl);
    const cat = CATEGORY_MAP[p.categories?.[0]] ?? { key: 'parenting', label: 'التربية' };
    const words = text(body).split(' ').length;
    const fm = [
      '---',
      `title: ${yamlStr(decode(p.title.rendered))}`,
      `slug: ${yamlStr(decodeURIComponent(p.slug))}`,
      `wpId: ${p.id}`,
      `date: ${p.date}`,
      `modified: ${p.modified}`,
      `excerpt: ${yamlStr(text(p.excerpt.rendered).replace(/…$/, '').trim())}`,
      `category: ${cat.key}`,
      imgFile ? `image: "../../assets/articles/${imgFile}"` : '',
      `imageAlt: ${yamlStr(decode(media?.alt_text || p.title.rendered))}`,
      tldr ? `tldr: ${yamlStr(tldr)}` : '',
      `readingMinutes: ${Math.max(2, Math.round(words / 180))}`,
      faq.length ? `faq: ${JSON.stringify(faq)}` : '',
      '---',
    ].filter(Boolean);
    await fs.writeFile(path.join(OUT_MD, `${p.id}.md`), fm.join('\n') + '\n\n' + body + '\n');
    console.log('✓', p.id, decodeURIComponent(p.slug), faq.length ? `(faq ${faq.length})` : '');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
