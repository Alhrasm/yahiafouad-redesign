/** Prefix an internal path with the configured base (GitHub Pages sub-path etc.). */
export function u(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** Absolute URL on the configured site origin. */
export function abs(path: string, site: URL | undefined): string {
  return new URL(u(path), site ?? 'https://yahiafouad.com').href;
}

const arDigits = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (v: string | number) => String(v).replace(/\d/g, (d) => arDigits[+d]);

export const formatDateAr = (d: Date) =>
  new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);

export const formatPrice = (n: number) =>
  `${new Intl.NumberFormat('ar-EG').format(n)} ج.م`;
