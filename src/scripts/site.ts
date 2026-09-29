/**
 * Site-wide progressive enhancement. Everything works without JS; this adds
 * reveal motion, the mobile menu, the sticky mobile CTA, newsletter handling
 * and a lightweight analytics event layer (dataLayer; GA4 only on production).
 */
import { integrations } from '../data/site';

declare global {
  interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void }
}

/* ---------- Analytics ---------- */
window.dataLayer = window.dataLayer || [];
export function track(event: string, params: Record<string, unknown> = {}) {
  window.dataLayer.push({ event, ...params });
  window.gtag?.('event', event, params);
}
(window as unknown as { yfTrack: typeof track }).yfTrack = track;

const isProduction = integrations.productionHosts.includes(location.hostname);
if (isProduction && integrations.ga4Id) {
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${integrations.ga4Id}`;
  document.head.appendChild(s);
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', integrations.ga4Id);
}

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
  if (!el) return;
  track(el.dataset.track!, { location: el.dataset.trackLoc, label: el.textContent?.trim().slice(0, 60) });
});

/* ---------- Reveal on scroll ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduce || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ---------- Header state ---------- */
const header = document.querySelector<HTMLElement>('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu ---------- */
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu = document.querySelector<HTMLElement>('[data-menu]');
function setMenu(open: boolean) {
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.querySelector('.sr-only')!.textContent = open ? 'إغلاق القائمة' : 'فتح القائمة';
  menu.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) menu.querySelector<HTMLElement>('a')?.focus();
}
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});
matchMedia('(min-width: 1024px)').addEventListener('change', (m) => m.matches && setMenu(false));

/* ---------- Sticky mobile CTA ---------- */
const bar = document.querySelector<HTMLElement>('[data-mobile-cta]');
if (bar) {
  const link = bar.querySelector('a')!;
  let pastHero = false;
  let footerVisible = false;
  const update = () => {
    const show = pastHero && !footerVisible;
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', String(!show));
    link.tabIndex = show ? 0 : -1;
  };
  addEventListener('scroll', () => { pastHero = scrollY > innerHeight * 0.6; update(); }, { passive: true });
  const footer = document.querySelector('.site-footer');
  if (footer) new IntersectionObserver(([en]) => { footerVisible = en.isIntersecting; update(); }).observe(footer);
}

/* ---------- Newsletter ---------- */
document.querySelectorAll<HTMLFormElement>('[data-newsletter]').forEach((form) => {
  const input = form.querySelector<HTMLInputElement>('input[type=email]')!;
  const msg = form.querySelector<HTMLElement>('[role=status]')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
      msg.textContent = 'اكتب بريدًا إلكترونيًا صحيحًا.';
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    const endpoint = form.dataset.endpoint;
    track('newsletter_signup', { location: form.dataset.source });
    if (!endpoint) {
      msg.textContent = 'شكرًا لك! (نسخة معاينة: سيُربط النموذج بقائمة Mail Mint عند النشر.)';
      form.reset();
      return;
    }
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form) });
      msg.textContent = res.ok ? 'تم الاشتراك. شكرًا لك!' : 'تعذّر الاشتراك الآن، حاول مرة أخرى.';
      if (res.ok) form.reset();
    } catch {
      msg.textContent = 'تعذّر الاتصال، حاول مرة أخرى.';
    }
  });
});
