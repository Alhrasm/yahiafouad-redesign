/**
 * YF Booking Bridge — runs on the existing WordPress booking page
 * (JetEngine form #5964 + JetAppointments calendar + WooCommerce checkout).
 *
 * The new guided booking wizard collects: intent → session type → date/slot →
 * phone/email. It then hands the selection to this page, which pre-fills the
 * ORIGINAL form so the proven booking + payment flow stays untouched.
 * Nothing is submitted automatically — the visitor presses the original
 * "أستكمال الحجز" button, which continues to WooCommerce checkout as before.
 *
 * Payload sources (first match wins, then cleared):
 *   1. sessionStorage['yf-booking']       (same-origin: wizard hosted on yahiafouad.com)
 *   2. location.hash  #yf-booking=<b64>    (cross-origin preview → live site)
 */
(function () {
  'use strict';
  var KEY = 'yf-booking';

  function readPayload() {
    try {
      var s = sessionStorage.getItem(KEY);
      if (s) { sessionStorage.removeItem(KEY); return JSON.parse(s); }
    } catch (e) { /* storage blocked */ }
    var m = location.hash.match(/yf-booking=([^&]+)/);
    if (m) {
      history.replaceState(null, '', location.pathname + location.search); // never leave contact data in the URL
      try {
        var b64 = decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/');
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return JSON.parse(new TextDecoder().decode(bytes));
      } catch (e) { return null; }
    }
    return null;
  }

  var data = readPayload();
  if (!data || !data.service_id) return;

  function wait(test, timeout) {
    return new Promise(function (resolve, reject) {
      var t0 = Date.now();
      (function tick() {
        var v = test();
        if (v) return resolve(v);
        if (Date.now() - t0 > (timeout || 8000)) return reject(new Error('timeout'));
        setTimeout(tick, 120);
      })();
    });
  }

  function setVal(el, v) {
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.jQuery) window.jQuery(el).trigger('change');
  }

  function banner(text, ok) {
    var form = document.querySelector('.jet-form');
    if (!form) return;
    var b = document.getElementById('yf-bridge-banner') || document.createElement('div');
    b.id = 'yf-bridge-banner';
    b.setAttribute('role', 'status');
    b.style.cssText = 'margin:0 0 20px;padding:16px 20px;border-radius:12px;font-weight:600;line-height:1.8;' +
      (ok ? 'background:#dfe0cc;color:#2f3620;' : 'background:#f3e3d6;color:#6b2f1f;');
    b.textContent = text;
    form.parentNode.insertBefore(b, form);
  }

  async function run() {
    var form = await wait(function () { return document.querySelector('.jet-form'); });
    setVal(form.querySelector('select[name="service_id"]'), String(data.service_id));

    // Navigate the calendar to the chosen month and pick the day
    var cell = null;
    for (var i = 0; i < 4 && !cell; i++) {
      try {
        cell = await wait(function () {
          return form.querySelector('.jet-apb-calendar-date[data-calendar-date="' + data.date + '"]');
        }, 2500);
      } catch (e) {
        var next = form.querySelector('[data-calendar-toggle="next"]');
        if (next) next.click();
      }
    }
    if (cell && !cell.classList.contains('jet-apb-calendar-date--disabled')) {
      (cell.querySelector('.jet-apb-calendar-date-body') || cell).click();
      try {
        var slot = await wait(function () {
          return form.querySelector('.jet-apb-slot[data-slot="' + data.slot + '"]');
        }, 8000);
        slot.click();
      } catch (e) { /* slot taken meanwhile — visitor picks another */ }
    }

    setVal(form.querySelector('[name="user_phone"]'), data.phone || '');
    setVal(form.querySelector('[name="user_email"]'), data.email || '');

    var picked = form.querySelector('[name="appointment_date"]');
    var ok = picked && picked.value;
    banner(ok
      ? 'جهّزنا حجزك: راجع الموعد وبياناتك، ثم اضغط «أستكمال الحجز» للانتقال إلى الدفع الآمن.'
      : 'اخترنا نوع الجلسة وبياناتك. الموعد الذي اخترته لم يعد متاحًا — من فضلك اختر موعدًا آخر من التقويم.', ok);
    var submit = form.querySelector('.jet-form__submit');
    if (submit) {
      submit.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submit.focus({ preventScroll: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
