# Yahia Fouad — personal brand website (redesign)

Arabic-first, editorial, conversion-focused redesign of **[yahiafouad.com](https://yahiafouad.com/)**.
Built as a fast static front-end (Astro) that **keeps the existing WordPress booking, payment,
workshop-registration and content systems working unchanged**.

- All copy, testimonials, prices, photos and facts come from the live site. Nothing is invented.
- Testimonials are verbatim and anonymous (as published on `/ourreviwe/`).
- The booking wizard reads **live availability and prices** from the existing JetAppointments API
  and hands off to the existing WooCommerce checkout.

---

## 1. Audit of the current site (before)

| Area | Finding |
|---|---|
| **Stack** | WordPress 7.1 · Elementor + Elementor Pro · XStore theme (+ child) · WooCommerce 11 · Tutor LMS (+Pro) · JetEngine / JetAppointments / JetWooBuilder / JetBlog / JetReviews · Site Reviews · Contact Form 7 · Mail Mint (Pro) · AIOSEO · Site Kit · XPay gateway · price-by-country plugin |
| **Pages** | Home, `/about-us/`, `/booking-app/` (+ duplicate `/booking-ap/`), `/ourreviwe/`, `/articles/`, `/العلاقات/`, `/gratitude-workshop/`, terms/privacy, contact, shop/cart/checkout/account, Tutor LMS pages, Mail Mint pages, 7 articles (all in «التربية وتنشئة الأبناء») |
| **Booking** | JetEngine form #5964 → `service_id` (5959 استشارية · 5960 خاصة · 5961 عائلية) → JetAppointments calendar (Sun–Thu, 10:00–18:00, 60-min slots) → phone/email → WooCommerce product #5958 → checkout (XPay). Live prices: 1,500 / 3,000 / 4,500 EGP |
| **Forms** | Booking (JetEngine), newsletter (Elementor form → Mail Mint), workshop registration (custom mu-plugin `yf-workshop`, admin-ajax + WhatsApp group), feedback, Woo login |
| **Analytics** | Site Kit installed but **no GA tag is emitted** in the page HTML (only a dns-prefetch) |
| **SEO** | AIOSEO: sitemaps, Organization/WebSite/BreadcrumbList schema. Meta description = raw scraped "About" text; no Person/Article/FAQ schema |
| **Must not break** | Booking form + slot logic, WooCommerce cart/checkout/payment, account/login, workshop registration + WhatsApp flow, Mail Mint lists, Tutor LMS, article URLs (Arabic slugs) |

### Main UX problems found
1. Homepage opens with a job title (“Consultant / Motivation Speaker”) and a generic “About” — not the visitor’s problem or outcome.
2. The strongest brand line (“رسالتي ليست أن أعلّم… بل أن أُذكّر”) is buried in a tab widget.
3. Service cards use generic “إقرأ المزيد” buttons that **link nowhere**; footer links «الدورات / الأنشطة / المحاضرات / اتصل بنا» are `#`.
4. Footer social icons (Facebook/Instagram/YouTube/Snapchat) have **no URLs**.
5. Consultation is the only visible offer; workshop, community («رفيق») and programs are invisible.
6. Booking is one long form with policies above the fold, no guidance on which session to choose, no price shown before checkout.
7. Contact page contains unrelated template claims (“2.5k+ reviews”, “Trusted by 17,300 teams” on FAQ) — **removed** in the redesign, not reused.
8. Heavy page weight (Elementor + ~20 plugins, ~300 KB HTML before assets); stock photography mixed with real portraits.
9. Two duplicate booking pages; typo URL `/ourreviwe/` (preserved for SEO).

---

## 2. What was built

### Information architecture / funnel
```
Content (/articles/, pillars) → Consultation (/consultations/, /booking-app/)
  → Programs (/programs/#programs) → Workshops (/programs/#workshops) → Community (/programs/#community)
```
Offers live in `src/data/site.ts → offers[]`. Adding a new program/workshop = adding data, not redesigning.

### Pages
| URL | Notes |
|---|---|
| `/` | 10 sections: hero → problem → philosophy → pillars → journey → offers → proof → content → about → final CTA |
| `/about-us/` | Story in 3 chapters, values/vision/mission/message, all 6 media appearances |
| `/consultations/` | *(new)* reasons, 3 session types + prices, how it works, FAQ (FAQPage schema), policies |
| `/booking-app/` | **Guided 5-step booking** (preserved URL) |
| `/programs/` | *(new)* ecosystem ladder, current free workshop, programs waitlist, «رفيق الوعي» community |
| `/articles/` | Content hub |
| `/<arabic-slug>/` | All 7 articles at their **original WordPress URLs**; Article + FAQPage schema |
| `/العلاقات/` (preserved), `/التربية/`, `/تطوير-الذات/` | Pillar pages (one template) |
| `/ourreviwe/` | All testimonials, filterable, verbatim |
| `/contact-us/` | Real channels only (email, phone, location) |
| `/category/parenting/`, `/contact/` | Redirect to new equivalents |

### Component system (`src/components`)
`Header` (+ mobile menu) · `Footer` · `Logo` · `SectionHeader` · `PillarCard` · `OfferCard` · `TestimonialCard` ·
`ArticleCard` (`lead` / `grid` / `row`) · `MediaCard` · `CtaBand` · `Newsletter` · `MobileCta` · `Breadcrumbs` (+schema) ·
`Motif` (line visuals derived from the logo’s open circle) · `Redirect`. Layout: `BaseLayout` (SEO, OG, JSON-LD, fonts).

### Design system (`src/styles/global.css`)
- **Colour tokens:** warm paper `#F5F1EA`, charcoal ink `#1C1B19`, sand `#D6C3A3`, muted olive `#5D6A43`, night `#151412`. All text pairs meet WCAG AA.
- **Type:** *Markazi Text* (display, editorial naskh) + *IBM Plex Sans Arabic* (body) — self-hosted, subset, preloaded. Fluid scale `--fs-display … --fs-caption`, body line-height 1.9 for Arabic.
- **Spacing:** 4-px scale `--s-1 … --s-10`, fluid `--section`, `--gutter` (16 px on phones).
- **Motion:** fade-up reveals (IntersectionObserver), CSS scroll-driven parallax where supported, all disabled under `prefers-reduced-motion`.
- **Imagery:** only real photography of Yahia. Studio portraits are cropped from the existing article art (text removed) and feathered into dark sections (`.blend-edges`). Stock photos from the old site are not used.

---

## 3. Booking — how the existing system is preserved

```
/booking-app/ (new wizard)                         WordPress (unchanged)
1 ما تحتاجه  → recommends a session type
2 نوع الجلسة → live price  ─┐
3 الموعد     → live slots  ─┼─ POST /wp-json/jet-engine/v2/appointment-date-slots  (read-only)
4 التواصل    → validated    │
5 المراجعة   → consent      └─► handoff ─► /booking-app/ (JetEngine form #5964)
                                         pre-filled by YF Booking Bridge
                                         → «أستكمال الحجز» → WooCommerce checkout → payment
```

- **Nothing is submitted automatically.** The bridge fills service, date, slot, phone and email, then asks the
  visitor to press the original button. If the slot was taken in the meantime, the visitor is told to pick another.
- Handoff transport: `sessionStorage` when the wizard runs on yahiafouad.com; otherwise a URL **fragment**
  (never sent to any server) that the bridge reads and **immediately removes** from the address bar.
- If the slots API is unreachable, the wizard shows a direct link to the existing booking page.

### Install the bridge on WordPress
Copy both files from `integrations/wordpress/` into `wp-content/mu-plugins/`:
```
yf-booking-bridge.php
yf-booking-bridge.js
```
It only enqueues on the `booking-app` / `booking-ap` pages. Verified against the live form: it selects the
service, pages the calendar to the right month, picks the day and the slot, and fills contact fields.

When the new front-end replaces the WordPress theme on yahiafouad.com, keep the engine form on `/booking-ap/`
(it already exists with the same form) — the wizard targets it automatically on the production host.

---

## 4. SEO
- Unique titles/descriptions per page, canonical URLs, Open Graph + Twitter cards (1200×630 generated per page).
- JSON-LD: `Person`, `WebSite`, `ProfessionalService` (home), `ProfilePage` (about), `Service` + `Offer` (consultations, booking, pillars), `Article` + `FAQPage` (articles), `FAQPage` (consultations), `CollectionPage` (articles), `BreadcrumbList` (all inner pages).
- `sitemap.xml` + `robots.txt` generated. **Preview builds are `noindex` and `Disallow: /`** so they never compete with the live site.
- All article URLs, `/about-us/`, `/booking-app/`, `/ourreviwe/`, `/العلاقات/`, `/articles/`, `/contact-us/` keep their existing paths. Redirects for retired URLs: see `docs/REDIRECTS.md`.

## 5. Performance
- Static HTML, ~0 JS on content pages beyond a small progressive-enhancement script; the booking script loads only on `/booking-app/`.
- Responsive AVIF/WebP via `astro:assets`, lazy-loading below the fold, hero image `fetchpriority=high`.
- Fonts self-hosted with `unicode-range` subsets and preloads; no third-party scripts. GA4 loads **only** on the production host and only if `integrations.ga4Id` is set.

## 6. Accessibility
Semantic landmarks, one `h1` per page, skip link, visible focus rings, 44 px+ touch targets, labelled form fields with
inline error messages (`aria-invalid`, live regions), keyboard-operable menu (Esc closes), `aria-current` on nav and
progress, reduced-motion support, alt text on all content images.

---

## 7. Content still needed from the brand (not invented)
- Real URLs for Facebook / Instagram / YouTube / Snapchat (the current icons have no links).
- Details of the first recorded program (name, outline, price) — the page shows an honest “قريبًا” waitlist.
- GA4 Measurement ID (Site Kit is installed but not outputting a tag).
- Mail Mint form endpoint/ID for the newsletter (preview shows a clear “preview mode” message).
- Articles for «العلاقات» and «تطوير الذات» (pillar pages show a waitlist until then).
- The radio-9090 appearance on the current About page links to the same video as «يحكي أن» — a correct link is needed.

---

## Development
```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # → dist/
npm run import:wp    # re-import articles from the WordPress REST API
python scripts/make-crops.py   # regenerate portrait crops / icons from assets-src/
```
Environment: `SITE_URL`, `BASE_PATH` (e.g. `/yahiafouad-redesign` on GitHub Pages), `PUBLIC_SITE_ENV=preview` (noindex).
Deployment to GitHub Pages runs from `.github/workflows/deploy.yml` on every push to `main`.
