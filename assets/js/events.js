/* Cyclelava events — lists upcoming Hikencyc events from the portal and books them without an account.
   Same flow as the mobile app: details + payment screenshot -> "Pending" -> admin approves -> QR ticket. */
(function () {
  'use strict';

  var API = 'https://hikencyc.runasp.net/api/public/events'; // live Hikencyc portal
  var ORIGIN = API.replace(/\/api\/.*$/, '');
  var WA_NUMBER = '923001294738';                            // keep in sync with main.js
  var STORE_KEY = 'cyclelava_bookings_v1';
  var MAX_RIDERS = 50;
  var MAX_PROOF_BYTES = 5 * 1024 * 1024;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var money = function (n) { return 'Rs. ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 }); };
  var imgUrl = function (u) {
    if (typeof u !== 'string' || !u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    return u.charAt(0) === '/' && u.charAt(1) !== '/' ? ORIGIN + u : '';
  };
  var validPhone = function (p) { return /^((\+92)|(0092)|(92)|0)?3\d{9}$/.test(String(p || '').replace(/[\s-]/g, '')); };
  var validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var waLink = function (text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); };

  var ICON = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg>',
    bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17l4-8h6l3 8M9.5 9L8 6H6m6.5 3L10 17m5.5-8l-1-3h2.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5m0 0l-4 4m4-4l4 4M5 19h14"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.08 2.53.72 2.98.68.46-.05 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/></svg>'
  };

  /* ---------------- API ---------------- */
  function api(path, opts) {
    return fetch(API + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { /* 429 and gateway errors are plain text */ }
        if (!r.ok) {
          var err = new Error((data && data.message) || (r.status === 429 ? 'Too many attempts. Please wait a few minutes and try again.' : 'Something went wrong. Please try again.'));
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  var eventsPromise = null;
  function loadEvents(force) {
    if (!eventsPromise || force) {
      eventsPromise = api('').then(function (list) { return Array.isArray(list) ? list : []; });
      eventsPromise.catch(function () { eventsPromise = null; });
    }
    return eventsPromise;
  }

  /* ---------------- Saved bookings (this device only) ---------------- */
  var Store = {
    read: function () {
      try { var v = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
    },
    add: function (b) {
      var list = Store.read().filter(function (x) { return x.token !== b.token; });
      list.unshift(b);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) {}
    },
    remove: function (token) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(Store.read().filter(function (x) { return x.token !== token; }))); } catch (e) {}
    }
  };

  /* ---------------- Event cards ---------------- */
  function priceChips(ev) {
    if (ev.isFree) return '<span class="ev-chip free">Free to join</span>';
    var out = '';
    if (ev.registrationFee > 0) out += '<span class="ev-chip">' + ICON.ticket + money(ev.registrationFee) + ' / rider</span>';
    if (ev.pricePerCycle > 0) out += '<span class="ev-chip">' + ICON.bike + 'Rental ' + money(ev.pricePerCycle) + '</span>';
    return out;
  }

  /* Booking limits set in the portal: every *Left value is null when that limit is not set. */
  function rentalOffered(ev) { return ev.maxRentalCycles !== 0 && (ev.pricePerCycle > 0 || ev.maxRentalCycles > 0); }
  function availChips(ev) {
    if (ev.soldOut) return '<span class="ev-chip full">Fully booked</span>';
    var out = '';
    if (ev.spotsLeft != null) out += '<span class="ev-chip' + (ev.spotsLeft <= 5 ? ' low' : '') + '">' + ev.spotsLeft + (ev.spotsLeft === 1 ? ' spot left' : ' spots left') + '</span>';
    if (rentalOffered(ev) && ev.rentalCyclesLeft != null) out += '<span class="ev-chip' + (ev.rentalCyclesLeft <= 2 ? ' low' : '') + '">' + (ev.rentalCyclesLeft ? ev.rentalCyclesLeft + (ev.rentalCyclesLeft === 1 ? ' rental cycle left' : ' rental cycles left') : 'Rentals booked out') + '</span>';
    return out;
  }

  function dateParts(ev) {
    // "14 Dec 2026, 6:30 AM" — formatted by the portal, so no timezone guessing in the browser.
    var m = /^(\d{1,2}) (\w{3}) (\d{4}), (.+)$/.exec(ev.dateFormatted || '');
    return m ? { day: m[1], mon: m[2], time: m[4] } : null;
  }

  function eventCard(ev) {
    var img = imgUrl(ev.imageUrl), d = dateParts(ev);
    return '<article class="ev-card">' +
      '<div class="ev-img">' + (img ? '<img loading="lazy" src="' + esc(img) + '" alt="" onerror="this.remove()">' : '') +
        '<div class="ev-noimg">' + ICON.bike + '</div>' +
        (d ? '<div class="ev-date"><strong>' + esc(d.day) + '</strong><span>' + esc(d.mon) + '</span></div>' : '') +
      '</div>' +
      '<div class="ev-body">' +
        '<h3 class="ev-title">' + esc(ev.title) + '</h3>' +
        '<ul class="ev-meta"><li>' + ICON.cal + '<span>' + esc(ev.dateFormatted) + '</span></li><li>' + ICON.pin + '<span>' + esc(ev.location) + '</span></li></ul>' +
        (ev.description ? '<p class="ev-desc">' + esc(ev.description) + '</p>' : '') +
        '<div class="ev-chips">' + priceChips(ev) + availChips(ev) + '</div>' +
        (ev.soldOut
          ? '<button class="btn btn-dark ev-book" type="button" disabled>Fully booked</button>'
          : '<button class="btn btn-primary ev-book" type="button" data-book-event="' + ev.id + '">Book now ' + ICON.arrow + '</button>') +
      '</div></article>';
  }

  function renderGrids() {
    var grids = $$('[data-events-grid]');
    if (!grids.length) return;
    grids.forEach(function (g) { g.innerHTML = new Array(Math.min(3, +g.dataset.limit || 3) + 1).join('<div class="ev-skel"></div>'); });
    loadEvents().then(function (list) {
      grids.forEach(function (g) {
        var limit = +g.dataset.limit || 0;
        var shown = limit ? list.slice(0, limit) : list;
        var wrap = g.closest('[data-events-wrap]');
        if (!shown.length) {
          if (wrap && wrap.hasAttribute('data-hide-empty')) { wrap.hidden = true; return; }
          g.innerHTML = '<div class="ev-empty"><h3>No special events open right now</h3>' +
            '<p>New events appear here as soon as they are announced. The weekly Friday night and Sunday morning rides are always on.</p>' +
            '<a class="btn btn-wa" href="' + waLink('Assalam-o-Alaikum! When is the next Hikencyc event?') + '" target="_blank" rel="noopener">' + ICON.wa + ' Ask about the next event</a></div>';
          return;
        }
        g.innerHTML = shown.map(eventCard).join('');
        var more = wrap && $('[data-events-more]', wrap);
        if (more) more.hidden = !(limit && list.length > limit);
      });
    }).catch(function () {
      grids.forEach(function (g) {
        var wrap = g.closest('[data-events-wrap]');
        if (wrap && wrap.hasAttribute('data-hide-empty')) { wrap.hidden = true; return; }
        g.innerHTML = '<div class="ev-empty"><h3>Could not load events</h3><p>Please check your connection and try again, or message us on WhatsApp.</p>' +
          '<button class="btn btn-dark" type="button" data-events-retry>Try again</button></div>';
      });
    });
  }

  /* ---------------- Hero "Reserve your slot" toggle ---------------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function dayName(ev) {
    // weekday straight from the date part of the portal's timestamp, so the visitor's timezone cannot shift it
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ev.eventDate || '');
    return m ? DAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] : '';
  }

  /* Shows the next event that still has places. With no such event the toggle stays hidden and the hero
     looks exactly as it does without it; it appears by itself once an event is listed in the portal. */
  function fillReserve() {
    var btn = $('[data-hero-reserve]');
    if (!btn) return;
    var grid = btn.closest('.hero-grid');
    var hide = function () { btn.hidden = true; if (grid) grid.classList.remove('has-reserve'); };
    loadEvents().then(function (list) {
      var open = list.filter(function (e) { return !e.soldOut; });
      var ev = open[0];
      if (!ev) return hide();
      var d = dateParts(ev), day = dayName(ev);
      var when = d ? (day ? day + ', ' : '') + d.day + ' ' + d.mon + ' · ' + d.time : ev.dateFormatted;
      btn.setAttribute('data-book-event', ev.id);
      btn.setAttribute('aria-label', 'Reserve your slot for ' + ev.title + ', ' + when);
      btn.innerHTML =
        '<span class="hr-top"><span class="hr-live"><span class="hr-dot"></span>Reserve your slot</span><span class="hr-switch" aria-hidden="true"></span></span>' +
        '<span class="hr-main">' +
          (d ? '<span class="hr-date"><strong>' + esc(d.day) + '</strong><span>' + esc(d.mon) + '</span></span>' : '') +
          '<span class="hr-info"><strong class="hr-title">' + esc(ev.title) + '</strong>' +
            '<span class="hr-line">' + ICON.cal + '<span>' + esc(when) + '</span></span>' +
            '<span class="hr-line">' + ICON.pin + '<span>' + esc(ev.location) + '</span></span></span>' +
        '</span>' +
        '<span class="hr-foot"><span class="ev-chips">' + priceChips(ev) + availChips(ev) + '</span>' +
          '<span class="hr-cta">' + (open.length > 1 ? 'Book · +' + (open.length - 1) + ' more' : 'Book now') + ' ' + ICON.arrow + '</span></span>';
      btn.hidden = false;
      if (grid) grid.classList.add('has-reserve');
    }).catch(hide);
  }
  /* ---------------- Booking sheet ---------------- */
  var sheet, overlay, body, titleEl, lastFocus = null;
  var state = null; // { events, ev, cycles (rental), own, proof, proofName, busy, name, phone, email }

  function mountSheet() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="bk-overlay"></div>' +
      '<aside class="bk-sheet" role="dialog" aria-modal="true" aria-labelledby="bkTitle" aria-hidden="true" tabindex="-1">' +
        '<div class="bk-head"><h3 id="bkTitle">Book an event</h3><button class="bk-close" type="button" aria-label="Close">&times;</button></div>' +
        '<div class="bk-body"></div>' +
      '</aside>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    sheet = $('.bk-sheet'); overlay = $('.bk-overlay'); body = $('.bk-body'); titleEl = $('#bkTitle');
    overlay.addEventListener('click', closeSheet);
    $('.bk-close').addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet(); });
  }

  function setToggles(open) {
    $$('.hero-reserve').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  }

  function openSheet(title) {
    if (!sheet.classList.contains('open')) lastFocus = document.activeElement;
    titleEl.textContent = title;
    sheet.classList.add('open'); overlay.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('bk-open');
    setToggles(true);
    body.scrollTop = 0;
    sheet.focus();
  }

  function closeSheet() {
    sheet.classList.remove('open'); overlay.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('bk-open');
    setToggles(false);
    state = null;
    // drop ?book= / ?booking= so a refresh does not reopen the sheet
    if (/[?&](book|booking)=/.test(location.search)) history.replaceState(null, '', location.pathname);
    renderMyBookings();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function message(html) { body.innerHTML = '<div class="bk-msg">' + html + '</div>'; }

  /* ---- form ---- */
  function openBooking(eventId) {
    openSheet('Book an event');
    message('<div class="bk-spin"></div><p>Loading events…</p>');
    loadEvents().then(function (list) {
      if (!sheet.classList.contains('open')) return;
      if (!list.length) {
        message('<h4>No events open for booking</h4><p>There is no special event open right now. Message us and we will tell you about the next one.</p>' +
          '<a class="btn btn-wa" href="' + waLink('Assalam-o-Alaikum! When is the next Hikencyc event?') + '" target="_blank" rel="noopener">' + ICON.wa + ' Ask on WhatsApp</a>');
        return;
      }
      var ev = list.filter(function (e) { return e.id === eventId; })[0];
      if (eventId && !ev) {
        message('<h4>This event is closed</h4><p>It has already taken place or is no longer open for booking.</p><button class="btn btn-dark" type="button" data-book-event>See open events</button>');
        return;
      }
      // opened without a specific event: start on the first one that still has places
      var open = list.filter(function (e) { return !e.soldOut; })[0];
      state = { events: list, ev: ev || open || list[0], cycles: 0, own: 1, proof: '', proofName: '', busy: false, name: '', phone: '', email: '' };
      renderForm();
    }).catch(function () {
      if (!sheet.classList.contains('open')) return;
      message('<h4>Could not load events</h4><p>Please check your connection and try again.</p>' +
        '<button class="btn btn-dark" type="button" data-book-event' + (eventId ? '="' + eventId + '"' : '') + '>Try again</button>');
    });
  }

  function riders() { return state.cycles + state.own; }
  function total() {
    var ev = state.ev;
    return ev.registrationFee * riders() + ev.pricePerCycle * state.cycles;
  }
  var cap = function (v) { return v == null ? MAX_RIDERS : v; };

  /* Highest value each stepper may reach under the event's limits (rental cycles, own-cycle places, total spots). */
  function maxFor(key) {
    var ev = state.ev, spots = Math.min(MAX_RIDERS, cap(ev.spotsLeft));
    if (key === 'cycles') return rentalOffered(ev) ? Math.max(0, Math.min(cap(ev.rentalCyclesLeft), spots - state.own)) : 0;
    return Math.max(0, Math.min(cap(ev.ownCyclesLeft), spots - state.cycles));
  }
  function leftHint(text, left) { return left == null ? text : text + ' · ' + left + ' left'; }
  function stepper(key, label, hint, value) {
    return '<div class="bk-step"><div><span class="bk-step-l">' + label + '</span><span class="bk-step-h">' + hint + '</span></div>' +
      '<div class="bk-qty"><button type="button" data-step="' + key + '" data-d="-1" aria-label="Fewer: ' + label + '">&minus;</button>' +
      '<output id="bk-' + key + '">' + value + '</output>' +
      '<button type="button" data-step="' + key + '" data-d="1" aria-label="More: ' + label + '">+</button></div></div>';
  }

  function renderForm() {
    var ev = state.ev, img = imgUrl(ev.imageUrl);
    var rental = rentalOffered(ev);
    // keep the selection inside this event's limits (it may have been made for another event)
    state.cycles = Math.min(state.cycles, maxFor('cycles'));
    state.own = Math.min(state.own, maxFor('own'));
    if (riders() === 0 && maxFor('own') === 0 && maxFor('cycles') > 0) state.cycles = 1; // only rental places are left
    var picker = state.events.length > 1
      ? '<div class="field"><label for="bk-event">Event</label><select id="bk-event">' + state.events.map(function (e) {
          return '<option value="' + e.id + '"' + (e.id === ev.id ? ' selected' : '') + '>' + esc(e.title) + ' — ' + esc(e.dateFormatted) + (e.soldOut ? ' (fully booked)' : '') + '</option>';
        }).join('') + '</select></div>'
      : '';

    body.innerHTML =
      '<form class="bk-form" novalidate>' +
        picker +
        '<div class="bk-event">' + (img ? '<img src="' + esc(img) + '" alt="" onerror="this.remove()">' : '') +
          '<div><strong>' + esc(ev.title) + '</strong>' +
          '<span>' + ICON.cal + esc(ev.dateFormatted) + '</span><span>' + ICON.pin + esc(ev.location) + '</span>' +
          '<div class="ev-chips">' + priceChips(ev) + availChips(ev) + '</div></div></div>' +

        '<div class="field"><label for="bk-name">Full name</label><input id="bk-name" name="name" autocomplete="name" maxlength="100" placeholder="e.g. Ali Ahmed" value="' + esc(state.name) + '" required></div>' +
        '<div class="field"><label for="bk-phone">Phone number</label><input id="bk-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="03001234567" value="' + esc(state.phone) + '" required>' +
          '<span class="bk-hint" id="bk-phone-hint" hidden>Enter a Pakistani mobile number, e.g. 03001234567 or +923001234567.</span></div>' +
        '<div class="field"><label for="bk-email">Email <small>(optional)</small></label><input id="bk-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="256" placeholder="you@example.com" value="' + esc(state.email) + '">' +
          '<span class="bk-note">Your PDF ticket is emailed here once the booking is approved.</span></div>' +

        '<span class="bk-label">Who is riding?</span>' +
        '<div class="bk-steps">' +
          (rental ? stepper('cycles', 'Rental cycles', leftHint('Riders who need a cycle from us', ev.rentalCyclesLeft), state.cycles) : '') +
          stepper('own', 'Riders with own cycle', leftHint('Bringing their own cycle', ev.ownCyclesLeft), state.own) +
          '<p class="bk-own" id="bk-sum"></p>' +
        '</div>' +
        '<div class="bk-pay" id="bk-pay"></div>' +
        '<div class="bk-error" id="bk-error" role="alert" hidden></div>' +
        '<button class="btn btn-primary bk-submit" type="submit"></button>' +
        '<p class="form-note">No account needed. The organizers review your booking and your ticket appears on this device once it is approved.</p>' +
      '</form>';

    renderPay();
    var first = $('#bk-name', body); if (first && !state.name) first.focus();
  }

  function renderPay() {
    var ev = state.ev, t = total(), n = riders();
    var pay = $('#bk-pay', body), btn = $('.bk-submit', body);
    if (!pay) return;

    // steppers: current values, which buttons can still move, and the summary line
    ['cycles', 'own'].forEach(function (k) {
      var out = $('#bk-' + k, body); if (!out) return;
      out.textContent = state[k];
      $('[data-step="' + k + '"][data-d="-1"]', body).disabled = state[k] <= 0;
      $('[data-step="' + k + '"][data-d="1"]', body).disabled = state[k] >= maxFor(k);
    });
    var sum = $('#bk-sum', body);
    if (sum) {
      sum.className = 'bk-own' + (ev.soldOut ? ' bad' : '');
      sum.textContent = ev.soldOut ? 'This event is fully booked.'
        : n === 0 ? 'Add at least one rider.'
        : n + (n === 1 ? ' rider' : ' riders') + ' in total' + (ev.spotsLeft != null ? ' · ' + ev.spotsLeft + (ev.spotsLeft === 1 ? ' spot' : ' spots') + ' left for this event.' : '.');
    }
    if (t > 0) {
      var rows = '';
      if (ev.bankName) rows += '<div><dt>Bank / wallet</dt><dd>' + esc(ev.bankName) + '</dd></div>';
      if (ev.accountHolderName) rows += '<div><dt>Account holder</dt><dd>' + esc(ev.accountHolderName) + '</dd></div>';
      rows += ev.accountNumber
        ? '<div><dt>Account number</dt><dd><span class="bk-acc">' + esc(ev.accountNumber) + '</span> <button type="button" class="bk-copy" data-copy="' + esc(ev.accountNumber) + '">Copy</button></dd></div>'
        : '<div><dt>Account number</dt><dd><a href="' + waLink('Assalam-o-Alaikum! Please share the payment account for "' + ev.title + '".') + '" target="_blank" rel="noopener">Ask on WhatsApp</a></dd></div>';

      var lines = '';
      if (ev.registrationFee > 0) lines += '<div><dt>Registration · ' + n + ' × ' + money(ev.registrationFee) + '</dt><dd>' + money(ev.registrationFee * n) + '</dd></div>';
      if (ev.pricePerCycle > 0 && state.cycles > 0) lines += '<div><dt>Rental cycles · ' + state.cycles + ' × ' + money(ev.pricePerCycle) + '</dt><dd>' + money(ev.pricePerCycle * state.cycles) + '</dd></div>';

      pay.innerHTML =
        '<h4>Payment</h4><p class="bk-pay-sub">Send the total to this account, then upload a screenshot of the transfer.</p>' +
        '<dl class="bk-dl">' + rows + '</dl>' +
        '<dl class="bk-dl bk-sum">' + lines + '<div class="bk-total"><dt>Total to pay</dt><dd>' + money(t) + '</dd></div></dl>' +
        '<input type="file" id="bk-proof" accept="image/*" hidden>' +
        '<label for="bk-proof" class="bk-upload' + (state.proof ? ' has' : '') + '" tabindex="0" role="button">' + ICON.upload +
          '<span>' + (state.proof ? esc(state.proofName) + ' · change' : 'Upload payment screenshot') + '</span></label>';
      pay.hidden = false;
    } else {
      pay.innerHTML = ''; pay.hidden = true;
    }

    btn.innerHTML = state.busy ? 'Submitting…' : (t > 0 ? 'Confirm booking · ' + money(t) : 'Confirm booking') + ' ' + ICON.arrow;
    btn.disabled = state.busy || ev.soldOut;
  }

  /* The form is re-rendered when the event or a stepper changes; carry over what was typed. */
  function keepInputs() {
    state.name = $('#bk-name', body).value; state.phone = $('#bk-phone', body).value; state.email = $('#bk-email', body).value;
  }

  function showError(text) {
    var e = $('#bk-error', body); if (!e) return;
    e.textContent = text || ''; e.hidden = !text;
    if (text) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* Phone screenshots are often several MB; shrink them before upload (also turns HEIC into JPEG on iPhones). */
  function readProof(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      var raw = function () {
        URL.revokeObjectURL(url);
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Please choose a JPG or PNG screenshot.'));
        if (file.size > MAX_PROOF_BYTES) return reject(new Error('The screenshot is larger than 5 MB. Please choose a smaller image.'));
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = function () { reject(new Error('Could not read that file.')); };
        fr.readAsDataURL(file);
      };
      img.onload = function () {
        try {
          var max = 1600, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          var out = c.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(url);
          if (out.indexOf('data:image/jpeg') !== 0) return raw();
          resolve(out);
        } catch (e) { raw(); }
      };
      img.onerror = raw;
      img.src = url;
    });
  }

  function submit() {
    if (!state || state.busy) return;
    var name = $('#bk-name', body).value.trim(), phone = $('#bk-phone', body).value.trim();
    var email = $('#bk-email', body).value.trim();
    state.name = name; state.phone = phone; state.email = email;
    var t = total();
    showError('');
    if (email && !validEmail(email)) return showError('Please enter a valid email address, or leave it empty.');
    if (name.length < 2) return showError('Please enter your full name.');
    if (!validPhone(phone)) { $('#bk-phone-hint', body).hidden = false; return showError('Please enter a valid Pakistani mobile number.'); }
    if (state.ev.soldOut) return showError('This event is fully booked.');
    if (riders() <= 0) return showError('Please add at least one rider.');
    if (t > 0 && !state.proof) return showError('Please upload a screenshot of your payment.');

    var ev = state.ev;
    state.busy = true; renderPay();
    api('/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: ev.id, name: name, phoneNumber: phone, email: email, numberOfCycles: state.cycles, membersWithOwnCycle: state.own,
        paymentProofBase64: t > 0 ? state.proof : '' })
    }).then(function (res) {
      Store.add({ token: res.token, ref: res.reference, title: ev.title, date: ev.dateFormatted });
      state = null;
      showStatus(res.token, true);
      loadEvents(true); renderGrids(); fillReserve(); // places left have changed
    }).catch(function (err) {
      if (!state) return;
      state.busy = false;
      if (err.status !== 409) { renderPay(); return showError(err.status ? err.message : 'Could not reach the server. Please check your connection and try again.'); }
      // Someone else took the places meanwhile: reload the limits so the form shows what is really left.
      loadEvents(true).then(function (list) {
        if (!state) return;
        state.events = list;
        state.ev = list.filter(function (e) { return e.id === ev.id; })[0] || state.ev;
        renderForm(); renderGrids();
        showError(err.message);
      }).catch(function () { renderPay(); showError(err.message); });
    });
  }

  /* ---- status / ticket ---- */
  function statusLink(token) { return location.origin + '/events/?booking=' + encodeURIComponent(token); }

  function showStatus(token, justBooked) {
    openSheet('Your booking');
    message('<div class="bk-spin"></div><p>Checking your booking…</p>');
    api('/booking/' + encodeURIComponent(token)).then(function (b) {
      if (!sheet.classList.contains('open')) return;
      Store.add({ token: token, ref: b.reference, title: b.eventTitle, date: b.eventDate, status: b.status });

      var riders = '';
      if (b.numberOfCycles > 0) riders += '<div><dt>Rental cycles</dt><dd>' + b.numberOfCycles + '</dd></div>';
      if (b.membersWithOwnCycle > 0) riders += '<div><dt>Own cycle</dt><dd>' + b.membersWithOwnCycle + '</dd></div>';

      var details = '<dl class="bk-dl"><div><dt>Event</dt><dd>' + esc(b.eventTitle) + '</dd></div><div><dt>When</dt><dd>' + esc(b.eventDate) + '</dd></div>' +
        '<div><dt>Where</dt><dd>' + esc(b.eventLocation) + '</dd></div><div><dt>Name</dt><dd>' + esc(b.name) + '</dd></div>' + riders +
        '<div><dt>' + (b.status === 'Approved' ? 'Paid' : 'Amount') + '</dt><dd>' + (b.amountPaid > 0 ? money(b.amountPaid) : 'Free') + '</dd></div>' +
        '<div><dt>Reference</dt><dd>#' + b.reference + '</dd></div></dl>';

      var top, actions;
      if (b.status === 'Approved') {
        top = '<div class="bk-ticket"><span class="bk-badge ok">Booking confirmed</span>' +
          (b.qrCodeImage && /^data:image\/png;base64,/.test(b.qrCodeImage) ? '<img class="bk-qr" src="' + b.qrCodeImage + '" alt="Ticket QR code">' : '') +
          '<div class="bk-code">' + esc(b.ticketCode) + '</div><p>Show this code at check-in.</p>' +
          (b.arriveBy ? '<p class="bk-arrive">Be there by <strong>' + esc(b.arriveBy) + '</strong>, 30 minutes before the ride starts.</p>' : '') +
          (b.ticketEmail && b.ticketEmailed ? '<p>Your ticket was also emailed to ' + esc(b.ticketEmail) + '. Check your spam folder if you cannot find it.</p>' : '') + '</div>';
        actions = '<a class="btn btn-primary" href="' + API + '/booking/' + encodeURIComponent(token) + '/ticket.pdf" target="_blank" rel="noopener" download>Download ticket (PDF)</a>' +
          '<button class="btn btn-dark" type="button" data-print>Print</button>';
      } else if (b.status === 'Rejected') {
        top = '<div class="bk-state no"><span class="bk-badge no">Not approved</span><h4>This booking was not approved</h4>' +
          (b.rejectionReason ? '<p><strong>Reason:</strong> ' + esc(b.rejectionReason) + '</p>' : '') + '</div>';
        actions = (b.eventOpen ? '<button class="btn btn-primary" type="button" data-book-event="' + b.eventId + '">Book again ' + ICON.arrow + '</button>' : '') +
          '<a class="btn btn-wa" href="' + waLink('Assalam-o-Alaikum! My booking #' + b.reference + ' for "' + b.eventTitle + '" was not approved. Can you help?') + '" target="_blank" rel="noopener">' + ICON.wa + ' Message us</a>';
      } else {
        top = '<div class="bk-state wait"><span class="bk-badge wait">Pending review</span><h4>' + (justBooked ? 'Booking received!' : 'Waiting for approval') + '</h4>' +
          '<p>' + (b.amountPaid > 0 ? 'The organizers are checking your payment. ' : 'The organizers are reviewing your booking. ') +
          'Your ticket with a QR code will appear here as soon as it is approved' + (b.ticketEmail ? ', and we will email it to ' + esc(b.ticketEmail) : '') + '.</p></div>';
        actions = '<button class="btn btn-dark" type="button" data-status="' + esc(token) + '">Refresh status</button>' +
          '<a class="btn btn-wa" href="' + waLink('Assalam-o-Alaikum! I booked "' + b.eventTitle + '" on the Cyclelava website. Booking #' + b.reference + ', name ' + b.name + '.') + '" target="_blank" rel="noopener">' + ICON.wa + ' Tell us on WhatsApp</a>';
      }

      body.innerHTML = '<div class="bk-status">' + top + details + '<div class="bk-actions">' + actions + '</div>' +
        '<div class="bk-keep"><strong>Keep this link</strong><p>This booking is saved on this device. To open it elsewhere, use your private link:</p>' +
        '<div class="bk-linkrow"><input readonly value="' + esc(statusLink(token)) + '" aria-label="Booking link"><button type="button" class="bk-copy" data-copy="' + esc(statusLink(token)) + '">Copy</button></div></div></div>';
    }).catch(function (err) {
      if (!sheet.classList.contains('open')) return;
      if (err.status === 404) {
        Store.remove(token);
        message('<h4>Booking not found</h4><p>This booking link is not valid any more.</p><button class="btn btn-dark" type="button" data-book-event>See open events</button>');
      } else {
        message('<h4>Could not check your booking</h4><p>Please check your connection and try again.</p><button class="btn btn-dark" type="button" data-status="' + esc(token) + '">Try again</button>');
      }
    });
  }

  /* ---------------- "Your bookings" strip ---------------- */
  function renderMyBookings() {
    var box = $('[data-my-bookings]');
    if (!box) return;
    var list = Store.read();
    box.hidden = !list.length;
    if (!list.length) return;
    var cls = { Approved: 'ok', Rejected: 'no', Pending: 'wait' };
    var label = { Approved: 'Confirmed', Rejected: 'Not approved', Pending: 'Pending review' };
    $('[data-my-list]', box).innerHTML = list.map(function (b) {
      var s = b.status || 'Pending';
      return '<button class="my-bk" type="button" data-status="' + esc(b.token) + '"><span><strong>' + esc(b.title || 'Event booking') + '</strong>' +
        '<small>' + esc(b.date || '') + (b.ref ? ' · #' + esc(b.ref) : '') + '</small></span>' +
        '<span class="bk-badge ' + (cls[s] || 'wait') + '" data-badge="' + esc(b.token) + '">' + (label[s] || s) + '</span></button>';
    }).join('');
  }

  function refreshMyBookings() {
    var box = $('[data-my-bookings]');
    if (!box) return;
    var pending = Store.read().filter(function (b) { return (b.status || 'Pending') === 'Pending'; }).slice(0, 5);
    if (!pending.length) return;
    Promise.all(pending.map(function (b) {
      return api('/booking/' + encodeURIComponent(b.token)).then(function (r) {
        Store.add({ token: b.token, ref: r.reference, title: r.eventTitle, date: r.eventDate, status: r.status });
      }).catch(function (e) { if (e.status === 404) Store.remove(b.token); });
    })).then(renderMyBookings);
  }

  /* ---------------- Events (delegated) ---------------- */
  function copy(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book-event],[data-status],[data-step],[data-copy],[data-print],[data-events-retry]');
    if (!t) return;
    if (t.hasAttribute('data-book-event')) { e.preventDefault(); openBooking(+t.getAttribute('data-book-event') || 0); }
    else if (t.hasAttribute('data-status')) { showStatus(t.getAttribute('data-status')); }
    else if (t.hasAttribute('data-step') && state) {
      var k = t.getAttribute('data-step');
      state[k] = Math.max(0, Math.min(maxFor(k), state[k] + (+t.getAttribute('data-d'))));
      keepInputs();
      renderPay();
    }
    else if (t.hasAttribute('data-copy')) { copy(t.getAttribute('data-copy'), t); }
    else if (t.hasAttribute('data-print')) { window.print(); } // print styles show only the open sheet
    else if (t.hasAttribute('data-events-retry')) { loadEvents(true); renderGrids(); fillReserve(); }
  });

  document.addEventListener('change', function (e) {
    if (!state) return;
    if (e.target.id === 'bk-event') {
      var id = +e.target.value;
      keepInputs();
      state.ev = state.events.filter(function (x) { return x.id === id; })[0] || state.ev;
      renderForm();
    } else if (e.target.id === 'bk-proof') {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      showError('');
      readProof(file).then(function (dataUrl) {
        if (!state) return;
        // base64 is ~4/3 of the byte size; the server rejects anything over 5 MB
        if (dataUrl.length * 0.75 > MAX_PROOF_BYTES) return showError('The screenshot is larger than 5 MB. Please choose a smaller image.');
        state.proof = dataUrl; state.proofName = file.name || 'Screenshot';
        keepInputs();
        renderPay();
      }).catch(function (err) { showError(err.message); });
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'bk-phone') { var h = $('#bk-phone-hint', body); if (h) h.hidden = !e.target.value || validPhone(e.target.value); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('bk-upload')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.classList && e.target.classList.contains('bk-form')) { e.preventDefault(); submit(); }
  });

  /* ---------------- boot ---------------- */
  mountSheet();
  renderGrids();
  fillReserve();
  renderMyBookings();
  refreshMyBookings();

  var qs = new URLSearchParams(location.search);
  if (qs.get('booking')) showStatus(qs.get('booking'));
  else if (qs.has('book')) openBooking(+qs.get('book') || 0);
})();
