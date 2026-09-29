# URL map & redirects

Existing URLs are preserved wherever possible. When the new front-end goes live on
yahiafouad.com, add these **301** redirects on the server (nginx / Cloudflare / the
WordPress *Redirection* plugin). Static hosts (GitHub Pages) use the meta-refresh
pages generated in `src/pages/category/parenting/` and `src/pages/contact/`.

## Preserved (same URL)
| URL | Page |
|---|---|
| `/` | Home |
| `/about-us/` | About |
| `/booking-app/` | Guided booking |
| `/ourreviwe/` | Testimonials |
| `/articles/` | Content hub |
| `/العلاقات/` | Relationships pillar |
| `/<article-slug>/` (×7) | Articles — original WordPress slugs |
| `/gratitude-workshop/` | Stays on WordPress (registration + WhatsApp flow) |
| `/الشروط-والأحكام-و-سياسة-الخصوصية/` | Stays on WordPress (legal text unchanged) |
| `/checkout-6/`, `/cart-6/`, `/my-account-2-2/`, `/shop-2/`, `/dashboard/`, Tutor LMS & Mail Mint pages | Stay on WordPress — do not redirect |

## New
| URL | Purpose |
|---|---|
| `/consultations/` | Services & session types |
| `/programs/` | Programs, workshops, community |
| `/التربية/`, `/تطوير-الذات/` | Pillar pages |

## 301 redirects
| From | To |
|---|---|
| `/category/parenting/` | `/التربية/` |
| `/contact/` | `/contact-us/` |
| `/courses/` | `/programs/#programs` |
| `/faq/` | `/consultations/#faq-title` |
| `/instructor/` | `/about-us/` |

## Keep as-is (booking engine)
`/booking-ap/` keeps the original JetEngine booking form. On the production host the
new wizard at `/booking-app/` hands off to `/booking-ap/`, which the YF Booking Bridge
pre-fills. Do **not** redirect `/booking-ap/`.
