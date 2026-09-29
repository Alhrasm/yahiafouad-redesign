/**
 * Guided booking wizard.
 * - Live availability + prices: POST {rest}/jet-engine/v2/appointment-date-slots (read-only query).
 * - Handoff: the existing WordPress booking engine is pre-filled by the YF Booking Bridge
 *   (integrations/wordpress). Same-origin → sessionStorage; cross-origin → URL fragment
 *   (fragments are never sent to servers, and the bridge clears it immediately).
 */
import { track } from './site';

type Config = {
  rest: string;
  engine: string;
  engineSameOrigin: string;
  productionHosts: string[];
  weekdays: number[];
  horizonDays: number;
  intents: Record<string, { title: string; rec: string }>;
  services: Record<string, { key: string; name: string; price: number }>;
};
type Slot = { slot: number; end: number; time: string; price: number; date: number };
type State = {
  intent?: string;
  service_id?: string;
  date?: number; // UTC-midnight timestamp (seconds) — the format JetAppointments uses
  slot?: number;
  slotEnd?: number;
  time?: string;
  price?: number;
  phone?: string;
  email?: string;
};

const cfg: Config = JSON.parse(document.getElementById('booking-config')!.textContent!);
const form = document.querySelector<HTMLFormElement>('[data-booking]')!;
const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
const btnNext = form.querySelector<HTMLButtonElement>('[data-next]')!;
const btnBack = form.querySelector<HTMLButtonElement>('[data-back]')!;
const status = form.querySelector<HTMLElement>('[data-status]')!;
const STORE = 'yf-wizard';

const fmtNum = new Intl.NumberFormat('ar-EG');
/** Isolate LTR fragments (times, phone, email) inside Arabic text. */
const ltr = (v?: string) => `⁦${v || ''}⁩`;
const tm = (v?: string) => ltr((v || '').replace('-', ' – '));
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const price = (n?: number) => (n ? `${fmtNum.format(n)} ج.م` : '—');
const dayFmt = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dowFmt = new Intl.DateTimeFormat('ar-EG', { weekday: 'short', timeZone: 'UTC' });

let state: State = {};
try { state = JSON.parse(sessionStorage.getItem(STORE) || '{}'); } catch { /* ignore */ }
let step = 1;
if (state.intent && !cfg.intents[state.intent]) state = {};
if (state.service_id && !cfg.services[state.service_id]) state.service_id = undefined;
const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch { /* ignore */ } };

/* ---------- Dates (Cairo "today") ---------- */
const cairoParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(new Date()).split('-').map(Number);
const todayUTC = Date.UTC(cairoParts[0], cairoParts[1] - 1, cairoParts[2]) / 1000;
const DAY = 86400;
const maxDate = todayUTC + cfg.horizonDays * DAY;
const isOpenDay = (ts: number) => ts > todayUTC && ts <= maxDate && cfg.weekdays.includes(new Date(ts * 1000).getUTCDay());

/* ---------- Live slots ---------- */
const slotCache = new Map<string, Promise<Slot[]>>();
function fetchSlots(service: string, date: number): Promise<Slot[]> {
  const key = `${service}:${date}`;
  if (!slotCache.has(key)) {
    const body = new URLSearchParams({ service, provider: '0', date: String(date), timestamp: String(date) });
    slotCache.set(
      key,
      fetch(cfg.rest, { method: 'POST', body })
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then((j) => {
          const html: string = j?.data?.slots || '';
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return [...doc.querySelectorAll<HTMLElement>('.jet-apb-slot')]
            .filter((el) => !el.classList.contains('jet-apb-slot--disabled'))
            .map((el) => ({
              slot: +el.dataset.slot!,
              end: +el.dataset.slotEnd!,
              time: el.dataset.friendlyTime || el.textContent!.trim(),
              price: +(el.dataset.price || 0),
              date: +el.dataset.date!,
            }));
        })
        .catch((e) => { slotCache.delete(key); throw e; }),
    );
  }
  return slotCache.get(key)!;
}

/* Live price per session type: read from the first open day that returns slots. */
async function loadLivePrices() {
  const firstOpen: number[] = [];
  for (let d = todayUTC + DAY; d <= maxDate && firstOpen.length < 3; d += DAY) if (isOpenDay(d)) firstOpen.push(d);
  for (const id of Object.keys(cfg.services)) {
    for (const d of firstOpen) {
      try {
        const slots = await fetchSlots(id, d);
        if (slots[0]?.price) {
          cfg.services[id].price = slots[0].price;
          document.querySelectorAll(`[data-price="${id}"]`).forEach((el) => (el.textContent = price(slots[0].price)));
          break;
        }
      } catch { break; }
    }
  }
  renderSummary();
}

/* ---------- Rendering ---------- */
function renderProgress() {
  document.querySelectorAll<HTMLElement>('[data-progress-step]').forEach((li) => {
    const n = +li.dataset.progressStep!;
    if (n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    li.toggleAttribute('data-done', n < step);
  });
}

function renderSummary() {
  const set = (k: string, v: string) => { const el = document.querySelector(`[data-sum="${k}"]`); if (el) el.textContent = v; };
  set('intent', state.intent ? cfg.intents[state.intent].title : '—');
  set('service', state.service_id ? cfg.services[state.service_id].name : '—');
  set('slot', state.slot ? `${dayFmt.format(state.date! * 1000)} · ${tm(state.time)}` : '—');
  set('price', price(state.price ?? (state.service_id ? cfg.services[state.service_id].price : undefined)));
}

function markRecommended() {
  const rec = state.intent ? cfg.intents[state.intent].rec : null;
  form.querySelectorAll<HTMLElement>('[data-service-card]').forEach((card) => {
    const on = card.dataset.serviceCard === rec;
    card.querySelector<HTMLElement>('[data-rec-badge]')!.hidden = !on;
  });
  // Pre-select the recommendation only if nothing chosen yet
  if (rec && !state.service_id) {
    const id = Object.entries(cfg.services).find(([, s]) => s.key === rec)?.[0];
    const input = form.querySelector<HTMLInputElement>(`input[name="service_id"][value="${id}"]`);
    if (input) { input.checked = true; state.service_id = id; save(); renderSummary(); }
  }
}

/* Calendar */
const calGrid = form.querySelector<HTMLElement>('[data-cal-grid]')!;
const calMonth = form.querySelector<HTMLElement>('[data-cal-month]')!;
const calPrev = form.querySelector<HTMLButtonElement>('[data-cal-prev]')!;
const calNext = form.querySelector<HTMLButtonElement>('[data-cal-next]')!;
const slotsBox = form.querySelector<HTMLElement>('[data-slots]')!;
let viewY = cairoParts[0];
let viewM = cairoParts[1] - 1;
if (state.date) { const d = new Date(state.date * 1000); viewY = d.getUTCFullYear(); viewM = d.getUTCMonth(); }

function renderCalendar() {
  calMonth.textContent = monthFmt.format(Date.UTC(viewY, viewM, 1));
  calGrid.innerHTML = '';
  // Week starts Saturday (common in Egypt): Sat..Fri
  const order = [6, 0, 1, 2, 3, 4, 5];
  for (const dow of order) {
    const h = document.createElement('div');
    h.className = 'cal__dow';
    h.setAttribute('aria-hidden', 'true');
    h.textContent = dowFmt.format(Date.UTC(2024, 0, 7 + dow)); // 2024-01-07 is a Sunday
    calGrid.appendChild(h);
  }
  const first = new Date(Date.UTC(viewY, viewM, 1));
  const lead = order.indexOf(first.getUTCDay());
  for (let i = 0; i < lead; i++) calGrid.appendChild(document.createElement('span'));
  const days = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  for (let d = 1; d <= days; d++) {
    const ts = Date.UTC(viewY, viewM, d) / 1000;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal__day num';
    b.textContent = fmtNum.format(d);
    b.dataset.date = String(ts);
    b.setAttribute('aria-label', dayFmt.format(ts * 1000));
    b.disabled = !isOpenDay(ts);
    b.setAttribute('aria-pressed', String(state.date === ts));
    calGrid.appendChild(b);
  }
  const minM = cairoParts[0] * 12 + cairoParts[1] - 1;
  const maxD = new Date(maxDate * 1000);
  calPrev.disabled = viewY * 12 + viewM <= minM;
  calNext.disabled = viewY * 12 + viewM >= maxD.getUTCFullYear() * 12 + maxD.getUTCMonth();
}

calPrev.addEventListener('click', () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCalendar(); });
calNext.addEventListener('click', () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCalendar(); });
calGrid.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.cal__day');
  if (!b || b.disabled) return;
  const ts = +b.dataset.date!;
  if (state.date !== ts) { state.slot = undefined; state.time = undefined; state.slotEnd = undefined; }
  state.date = ts;
  save();
  calGrid.querySelectorAll('.cal__day').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  loadDaySlots();
  renderSummary();
});

async function loadDaySlots() {
  if (!state.date || !state.service_id) return;
  slotsBox.innerHTML = '<p class="muted">جارٍ تحميل الأوقات المتاحة…</p>';
  try {
    const slots = await fetchSlots(state.service_id, state.date);
    if (!slots.length) {
      slotsBox.innerHTML = '<p class="muted">لا توجد أوقات متاحة في هذا اليوم. جرّب يومًا آخر.</p>';
      return;
    }
    const title = `<p class="slots__title">الأوقات المتاحة يوم ${esc(dayFmt.format(state.date * 1000))} <span class="muted small">(بتوقيت القاهرة)</span></p>`;
    const items = slots
      .map((s) => `<label class="slot"><input type="radio" name="slot" value="${esc(s.slot)}" data-end="${esc(s.end)}" data-time="${esc(s.time)}" data-price="${esc(s.price)}" ${state.slot === s.slot ? 'checked' : ''} required><span>${esc(s.time)}</span></label>`)
      .join('');
    slotsBox.innerHTML = `${title}<div class="slots__grid" role="radiogroup" aria-label="الأوقات المتاحة">${items}</div>`;
  } catch {
    slotsBox.innerHTML = `<p class="error">تعذّر تحميل المواعيد الآن. يمكنك المحاولة مرة أخرى، أو <a href="${esc(cfg.engine)}">الحجز مباشرة من هنا</a>.</p>`;
  }
}

slotsBox.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.name !== 'slot') return;
  state.slot = +input.value;
  state.slotEnd = +input.dataset.end!;
  state.time = input.dataset.time;
  state.price = +input.dataset.price! || cfg.services[state.service_id!].price;
  save();
  renderSummary();
  status.textContent = '';
});

/* Review */
function renderReview() {
  const box = form.querySelector<HTMLElement>('[data-review]')!;
  const rows: [string, string, number][] = [
    ['ما تحتاجه', cfg.intents[state.intent!].title, 1],
    ['نوع الجلسة', cfg.services[state.service_id!].name, 2],
    ['الموعد', `${dayFmt.format(state.date! * 1000)} · ${tm(state.time)} بتوقيت القاهرة`, 3],
    ['التواصل', `${ltr(state.phone)} · ${ltr(state.email)}`, 4],
    ['التكلفة', price(state.price ?? cfg.services[state.service_id!].price), 2],
  ];
  box.innerHTML = rows
    .map(([k, v, s]) => `<div><dt>${esc(k)}</dt><dd><bdi>${esc(v)}</bdi><button type="button" data-edit="${s}" aria-label="تعديل ${esc(k)}">تعديل</button></dd></div>`)
    .join('');
}
form.querySelector('[data-review]')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-edit]');
  if (b) go(+b.dataset.edit!);
});

/* ---------- Validation ---------- */
function setError(id: string, msg: string) {
  const input = document.getElementById(id) as HTMLInputElement;
  const err = document.getElementById(`${id}-err`)!;
  err.textContent = msg;
  input.setAttribute('aria-invalid', String(!!msg));
}

function validate(n: number): boolean {
  status.textContent = '';
  if (n === 1 && !state.intent) { status.textContent = 'اختر ما يصف احتياجك للمتابعة.'; return false; }
  if (n === 2 && !state.service_id) { status.textContent = 'اختر نوع الجلسة للمتابعة.'; return false; }
  if (n === 3 && !state.slot) { status.textContent = state.date ? 'اختر وقتًا من الأوقات المتاحة.' : 'اختر يومًا ثم وقتًا مناسبًا.'; return false; }
  if (n === 4) {
    const phone = (document.getElementById('bk-phone') as HTMLInputElement).value.trim();
    const email = (document.getElementById('bk-email') as HTMLInputElement).value.trim();
    const digits = phone.replace(/[^\d]/g, '');
    const phoneOk = /^\+?[\d\s\-()]+$/.test(phone) && digits.length >= 8 && digits.length <= 15;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setError('bk-phone', phoneOk ? '' : 'اكتب رقم موبايل صحيح (مع كود الدولة لو خارج مصر).');
    setError('bk-email', emailOk ? '' : 'اكتب بريدًا إلكترونيًا صحيحًا.');
    if (!phoneOk) (document.getElementById('bk-phone') as HTMLInputElement).focus();
    else if (!emailOk) (document.getElementById('bk-email') as HTMLInputElement).focus();
    if (phoneOk && emailOk) { state.phone = phone; state.email = email; save(); }
    return phoneOk && emailOk;
  }
  if (n === 5) {
    const c = form.querySelector<HTMLInputElement>('input[name="consent"]')!;
    const err = form.querySelector<HTMLElement>('[data-consent-err]')!;
    err.textContent = c.checked ? '' : 'من فضلك وافق على الشروط والأحكام للمتابعة.';
    if (!c.checked) c.focus();
    return c.checked;
  }
  return true;
}

/* ---------- Navigation ---------- */
function go(n: number, focus = true) {
  step = n;
  steps.forEach((fs) => (fs.hidden = +fs.dataset.step! !== n));
  btnBack.hidden = n === 1;
  btnNext.innerHTML = n === 5 ? 'تأكيد والانتقال للدفع <span class="arrow" aria-hidden="true">←</span>' : 'التالي <span class="arrow" aria-hidden="true">←</span>';
  status.textContent = '';
  if (n === 2) markRecommended();
  if (n === 3) { renderCalendar(); if (state.date) loadDaySlots(); }
  if (n === 4) {
    (document.getElementById('bk-phone') as HTMLInputElement).value = state.phone || '';
    (document.getElementById('bk-email') as HTMLInputElement).value = state.email || '';
  }
  if (n === 5) renderReview();
  renderProgress();
  renderSummary();
  if (focus) {
    const title = steps[n - 1].querySelector<HTMLElement>('.bk-step__title')!;
    title.focus({ preventScroll: true });
    const top = form.getBoundingClientRect().top + scrollY - 120;
    if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  track('booking_step', { step: n });
}

form.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.name === 'intent') { state.intent = t.value; state.service_id = undefined; form.querySelectorAll<HTMLInputElement>('input[name="service_id"]').forEach((i) => (i.checked = false)); }
  if (t.name === 'service_id') { state.service_id = t.value; state.slot = undefined; state.time = undefined; state.price = undefined; }
  save();
  renderSummary();
});
// Choosing an intent advances automatically — one less tap on mobile.
form.addEventListener('click', (e) => {
  const input = (e.target as HTMLElement).closest('label.choice')?.querySelector<HTMLInputElement>('input[name="intent"]');
  if (input && step === 1) setTimeout(() => state.intent && go(2), 220);
});

btnBack.addEventListener('click', () => go(Math.max(1, step - 1)));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate(step)) return;
  if (step < 5) return go(step + 1);
  handoff();
});

function handoff() {
  const payload = {
    v: 1,
    service_id: +state.service_id!,
    date: state.date,
    slot: state.slot,
    slot_end: state.slotEnd,
    phone: state.phone,
    email: state.email,
    intent: state.intent,
  };
  track('booking_handoff', { service: cfg.services[state.service_id!].key, value: state.price, currency: 'EGP' });
  btnNext.setAttribute('aria-disabled', 'true');
  status.textContent = 'جارٍ تحويلك إلى صفحة الدفع الآمن…';
  const json = JSON.stringify(payload);
  try { sessionStorage.removeItem(STORE); } catch { /* ignore */ }
  if (cfg.productionHosts.includes(location.hostname)) {
    try { sessionStorage.setItem('yf-booking', json); } catch { /* ignore */ }
    location.href = cfg.engineSameOrigin;
  } else {
    let bin = '';
    new TextEncoder().encode(json).forEach((b) => (bin += String.fromCharCode(b)));
    const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    location.href = `${cfg.engine}#yf-booking=${b64}`;
  }
}

/* ---------- Init ---------- */
function restoreInputs() {
  if (state.intent) form.querySelector<HTMLInputElement>(`input[name="intent"][value="${state.intent}"]`)!.checked = true;
  if (state.service_id) {
    const i = form.querySelector<HTMLInputElement>(`input[name="service_id"][value="${state.service_id}"]`);
    if (i) i.checked = true;
  }
}
const qsIntent = new URLSearchParams(location.search).get('intent');
if (qsIntent && cfg.intents[qsIntent] && state.intent !== qsIntent) {
  state = { intent: qsIntent };
  save();
}
restoreInputs();
go(state.intent ? 2 : 1, false);
loadLivePrices();
