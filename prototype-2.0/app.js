/* ============================================================
   SIGALE 2.0 - ASTROMELIAS (raw HTML/CSS/JS port)

   Vanilla rebuild of docs/design2.0/ (lib.jsx, home.jsx, flow.jsx,
   proto.jsx) with no React, no Babel, no build step. Screens:
   Public Landing, Organizer Home, the 7-step purchase flow, and the
   five-state purchase status machine (IMPLEMENTATION_GUIDE.md s.6).

   Spanish UI copy, English identifiers, AM/PM times, es-CO currency.
   ============================================================ */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var timers = []; // intervals/listeners to clear between renders

  /* ---------------------------------------------------------- */
  /* Domain data (mirrors the mockup)                            */
  /* ---------------------------------------------------------- */
  var EVENT = {
    name: 'Astromelias',
    tagline: 'Festival',
    date: 'Vie 24 Jul',
    doors: '5:00 PM',
    venue: 'Aca Parchamos',
    address: 'Cl. 49 #9-85',
    phone: '321 261 9103',
    whatsapp: '573212619103',
    flyer: 'assets/flyer.png',
    flyerFallback: '../docs/design2.0/1-FLYER.png'
  };
  var ACTS = ['Cold Tropics', 'Itawa', 'Deglorian', 'Catalina', 'Siluetas del Ayer', 'Amaltea'];
  var STAGE = { label: 'Etapa 1 . Preventa', price: 30000, cupos: 48 };
  var TYPES = [
    { k: 'Taquilla', v: 45000, n: 0 },
    { k: 'Etapa 1', v: 30000, n: 16 },
    { k: 'Etapa 2', v: 35000, n: 10 },
    { k: 'Cortesia', v: 0, n: 18 }
  ];
  var HOLDERS = [
    { name: 'Valentina Rios', id: '1.001.234.567' },
    { name: 'David Ramirez', id: '1.020.998.112' }
  ];

  // mutable purchase state for the flow
  var flow = { qty: 2, unit: STAGE.price, folio: '123', delivery: 'wa' };
  function total() { return flow.qty * flow.unit; }

  /* ---------------------------------------------------------- */
  /* Helpers                                                     */
  /* ---------------------------------------------------------- */
  function esCO(n) { return Number(n).toLocaleString('es-CO'); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // currency -> matches formatCurrency() "$30.000" (CO grouping)
  function money(v, cls) {
    return '<span class="' + (cls || 'price') + '"><span class="cur">$</span>' + esCO(v) + '</span>';
  }

  // deterministic PRNG so star/QR layouts are stable per seed
  function mulberry(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // seeded starfield (density 40 of 100, ~8% larger glowing stars)
  function starField(seed, density, w, h) {
    seed = seed || 1; density = density || 40; w = w || 430; h = h || 880;
    var rnd = mulberry(seed * 9176 + 17);
    var count = Math.round((w * h) / 5200 * (density / 40));
    var out = '';
    for (var i = 0; i < count; i++) {
      var big = rnd() > 0.92;
      var s = big ? 2.2 + rnd() * 1.3 : 0.7 + rnd() * 1.2;
      var op = big ? 0.7 + rnd() * 0.3 : 0.18 + rnd() * 0.55;
      var shadow = big ? '0 0 ' + (3 + rnd() * 4).toFixed(1) + 'px rgba(255,255,255,0.8)' : 'none';
      out += '<span class="star" style="left:' + (rnd() * 100).toFixed(2) + '%;top:' +
        (rnd() * 100).toFixed(2) + '%;width:' + s.toFixed(2) + 'px;height:' + s.toFixed(2) +
        'px;opacity:' + op.toFixed(2) + ';box-shadow:' + shadow + '"></span>';
    }
    return '<div class="starfield" aria-hidden="true">' + out + '</div>';
  }

  // icon set (stroke, currentColor) - ported from lib.jsx
  var ICONS = {
    home: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9',
    menu: 'M4 7h16M4 12h16M4 17h16',
    pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z',
    cal: 'M4 6.5h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
    clock: 'M12 12V7.5M12 12l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    ticket: 'M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5V10a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5V14a2 2 0 0 0 0-4Z',
    plus: 'M12 5v14M5 12h14',
    chevD: 'M6 9.5 12 15l6-5.5',
    chevR: 'M9.5 6 15 12l-5.5 6',
    arrowL: 'M15 6l-6 6 6 6',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.3 3.1-6 7-6s7 2.7 7 6',
    id: 'M3.5 6h17v12h-17zM7 10a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 7 10ZM4.6 15c.4-1.7 1.3-2.6 2.4-2.6s2 .9 2.4 2.6M13 9h5M13 12.5h5M13 16h3',
    phone: 'M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A14 14 0 0 1 5 6 2 2 0 0 1 5 4Z',
    wa: 'M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm-3 5.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.3 0 .6a6 6 0 0 0 2.6 2.3c.3.1.5.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.8c.2.1.4.2.4.4s0 .9-.3 1.3c-.3.4-1 .8-1.5.8a7 7 0 0 1-5.9-5.9c0-.5 0-1.3.5-2.6Z',
    check: 'M5 12.5 10 17l9-10',
    copy: 'M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15M4 10.5h9.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19v-7A1.5 1.5 0 0 1 4 10.5Z',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
    share: 'M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
    star: 'M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 6-5.3-3.1L6.7 19.7 8 13.7l-4.5-4 6-.6z',
    bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 19a2 2 0 0 0 4 0',
    lock: 'M6 10.5V8a6 6 0 0 1 12 0v2.5M5 10.5h14v9.5H5zM12 14.5v2.5',
    sparkle: 'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z',
    x: 'M6 6l12 12M18 6 6 18',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'
  };
  function ic(n, s, sw, fill) {
    var d = ICONS[n] || '';
    s = s || 22; sw = sw || 1.7;
    var segs = d.split('M').filter(Boolean).map(function (seg) { return '<path d="M' + seg + '"/>'; }).join('');
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' +
      (fill ? 'currentColor' : 'none') + '" stroke="' + (fill ? 'none' : 'currentColor') +
      '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + segs + '</svg>';
  }

  // stylised wordmark with optional italic-swash letters
  function wordmark(text, opt) {
    opt = opt || {};
    var swash = opt.swash || [];
    var chars = text.split('').map(function (c, i) {
      return swash.indexOf(i) >= 0 ? '<span class="sw">' + c + '</span>' : c;
    }).join('');
    return '<div class="wordmark ' + (opt.cls || '') + '" style="' + (opt.style || '') + '">' + chars + '</div>';
  }

  var SB_SIGNAL =
    '<span class="sb-ic">' +
    '<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>' +
    '<svg width="16" height="11" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.5c2 0 3.9.8 5.3 2.1l1.1-1.2A9.5 9.5 0 0 0 8 .8 9.5 9.5 0 0 0 1.6 3.4l1.1 1.2A7.5 7.5 0 0 1 8 2.5Zm0 3.2c1.1 0 2.1.4 2.9 1.2l1.1-1.2A6 6 0 0 0 8 5a6 6 0 0 0-4 1.9l1.1 1.2A4 4 0 0 1 8 5.7Zm0 3.1 1.9 2-1.9-2Z"/><circle cx="8" cy="9.4" r="1.6"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="1" y="1" width="21" height="10" rx="2.5" stroke="currentColor" stroke-opacity="0.5"/><rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor"/><rect x="23.5" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" fill-opacity="0.5"/></svg>' +
    '</span>';
  function statusbar(right) {
    return '<div class="statusbar"><span>9:41</span>' + (right !== undefined ? right : SB_SIGNAL) + '</div>';
  }

  // deterministic faux QR (looks like a real code; generated from a seed)
  function fauxQR(seed) {
    var N = 23, cell = 6, size = N * cell;
    var rnd = mulberry(seed);
    function inFinder(r, c) {
      return (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
    }
    var rects = '';
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        if (inFinder(r, c)) continue;
        if (rnd() > 0.5) rects += '<rect x="' + (c * cell) + '" y="' + (r * cell) + '" width="' + cell + '" height="' + cell + '"/>';
      }
    }
    function finder(ox, oy) {
      return '<rect x="' + (ox * cell) + '" y="' + (oy * cell) + '" width="' + (7 * cell) + '" height="' + (7 * cell) + '"/>' +
        '<rect x="' + ((ox + 1) * cell) + '" y="' + ((oy + 1) * cell) + '" width="' + (5 * cell) + '" height="' + (5 * cell) + '" fill="#fbf3e6"/>' +
        '<rect x="' + ((ox + 2) * cell) + '" y="' + ((oy + 2) * cell) + '" width="' + (3 * cell) + '" height="' + (3 * cell) + '" fill="#0c0710"/>';
    }
    var finders = finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7);
    return '<svg class="qr-svg" viewBox="0 0 ' + size + ' ' + size + '" fill="#0c0710" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR de la boleta">' +
      rects + finders + '</svg>';
  }

  /* ---------------------------------------------------------- */
  /* Screen: Public Landing  (/evento/:id)                       */
  /* ---------------------------------------------------------- */
  function Landing() {
    var floats = [
      { l: '8%', t: 60, c: 'var(--yellow)', sz: 12, ic: 'sparkle' },
      { l: '82%', t: 30, c: 'var(--lilac)', sz: 16, ic: 'star' },
      { l: '68%', t: 150, c: 'var(--orange-soft)', sz: 10, ic: 'sparkle' },
      { l: '16%', t: 210, c: 'var(--purple-2)', sz: 14, ic: 'star' },
      { l: '46%', t: 6, c: 'var(--lilac-deep)', sz: 9, ic: 'sparkle' }
    ];
    var floatHtml = floats.map(function (f, i) {
      return '<span class="floatel" data-speed="' + [0.07, -0.05, 0.1, -0.07, 0.05][i] +
        '" style="left:' + f.l + ';top:' + f.t + 'px;color:' + f.c + ';animation-delay:' + (i * 0.6) + 's">' +
        ic(f.ic, f.sz, 1.7, true) + '</span>';
    }).join('');

    var actsHtml = ACTS.map(function (a, i) {
      return '<div class="serif actbig" style="font-size:' + (i % 2 ? 30 : 34) + 'px;color:' +
        (i % 3 === 1 ? 'var(--yellow)' : 'var(--cream)') + ';line-height:1.04">' + a + '</div>';
    }).join('');

    return '' +
    '<div class="scr t3">' +
      '<div class="lscroll" id="lscroll">' +

        '<div class="lhead" id="lhead">' +
          '<img src="' + EVENT.flyer + '" alt="" class="lhead-img" id="lheadImg" />' +
          '<div class="lhead-grad"></div>' +
          '<div class="lhead-txt">' +
            wordmark(EVENT.name, { style: "font-family:'Playfair Display',serif;font-weight:700;font-size:30px;line-height:0.9" }) +
            '<div style="display:flex;align-items:baseline;gap:7px;margin-top:3px">' +
              '<span class="serif" style="font-family:\'Cormorant\',serif;font-style:italic;font-size:19px;color:var(--yellow)">' + EVENT.tagline + '</span>' +
              '<span class="label" style="color:var(--cream-dim)">. ' + EVENT.date + ' . ' + EVENT.doors + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<section class="lhero">' +
          starField(2, 42) +
          '<div class="lhero-overlay" id="heroOverlay" style="opacity:0"></div>' +
          '<div class="statusbar" id="heroSB" style="position:absolute;top:0;left:0;right:0;z-index:4">' +
            '<span>9:41</span><span class="kicker" style="letter-spacing:2px">Bogota, CO</span>' +
          '</div>' +
          '<div class="lhero-flyer" id="heroFlyer">' +
            '<img src="' + EVENT.flyer + '" alt="' + EVENT.name + '" id="flyer" />' +
          '</div>' +
          '<div class="lhero-hint" id="heroHint">' +
            '<span class="label" style="color:var(--cream-dim)">Desliza</span>' + ic('chevD', 20) +
          '</div>' +
        '</section>' +

        '<section class="lbody">' +
          starField(9, 34, 430, 1500) +

          '<div class="pad" style="position:relative;z-index:2;padding-top:172px;display:flex;flex-direction:column;gap:12px">' +
            '<div class="tile purple stub" style="display:flex;justify-content:space-between;align-items:center">' +
              '<div>' +
                '<div class="chip" style="background:rgba(255,255,255,0.16);border-color:rgba(255,255,255,0.24);color:#fff;margin-bottom:8px">Etapa activa</div>' +
                '<div class="label" style="color:rgba(255,255,255,0.8);white-space:nowrap">' + STAGE.label + '</div>' +
                '<div class="serif" style="font-size:38px;color:var(--yellow);line-height:1;margin-top:3px">$' + esCO(STAGE.price) + '</div>' +
              '</div>' +
              '<div style="text-align:center">' +
                '<div class="serif" style="font-size:36px;color:#fff">' + STAGE.cupos + '</div>' +
                '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.75)">cupos</div>' +
              '</div>' +
            '</div>' +
            '<button class="btn" data-action="buy">' + ic('ticket', 20) + ' Comprar boleta</button>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
              '<div class="tile yellow">' +
                '<div class="label">Etapa 2</div>' +
                '<div class="serif" style="font-size:26px">$35.000</div>' +
                '<div style="font-size:11px;font-weight:700;text-transform:uppercase">Proximamente</div>' +
              '</div>' +
              '<div class="tile orange">' +
                '<div class="label" style="color:rgba(255,255,255,0.85)">Taquilla</div>' +
                '<div class="serif" style="font-size:26px;color:#fff">$45.000</div>' +
                '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:rgba(255,255,255,0.85)">En puerta</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="lineupx">' + floatHtml +
            '<div class="pad" style="position:relative;z-index:2">' +
              '<div class="label" style="color:var(--orange-soft);text-align:center;margin-bottom:18px">Line-up</div>' +
              '<div style="display:flex;flex-direction:column;gap:4px;text-align:center">' + actsHtml + '</div>' +
            '</div>' +
          '</div>' +

          '<div class="pad" style="position:relative;z-index:2;margin-top:8px;padding-bottom:30px">' +
            '<div class="info-card">' +
              '<div style="display:flex;gap:14px">' +
                '<div style="display:flex;gap:10px;align-items:flex-start;flex:1">' +
                  '<span style="color:var(--lilac)">' + ic('pin', 20) + '</span>' +
                  '<div><div style="font-weight:600">' + EVENT.venue + '</div><div class="muted" style="font-size:13px">' + EVENT.address + '</div></div>' +
                '</div>' +
                '<div style="display:flex;gap:10px;align-items:flex-start;flex:1">' +
                  '<span style="color:var(--lilac)">' + ic('clock', 20) + '</span>' +
                  '<div><div style="font-weight:600">Puertas</div><div class="muted" style="font-size:13px">' + EVENT.doors + '</div></div>' +
                '</div>' +
              '</div>' +
              '<div class="divider" style="margin:16px 0"></div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<div><div class="label" style="color:var(--cream-dim)">Info y reservas</div><div style="font-weight:600">' + EVENT.phone + '</div></div>' +
                '<button class="wa-text-btn" data-action="wa-contact">WhatsApp</button>' +
              '</div>' +
            '</div>' +
            '<button class="btn" data-action="buy" style="margin-top:16px">' + ic('ticket', 20) + ' Comprar boleta</button>' +
          '</div>' +

        '</section>' +
      '</div>' +
    '</div>';
  }

  function wireLanding() {
    // flyer fallback chain: assets -> docs source -> generated poster
    var flyer = document.getElementById('flyer');
    var head = document.getElementById('lheadImg');
    if (flyer) {
      var stage = 0;
      flyer.onerror = function () {
        if (stage === 0) { stage = 1; flyer.src = EVENT.flyerFallback; }
        else { flyer.onerror = null; flyer.outerHTML = flyerPoster(); }
      };
    }
    if (head) {
      var hstage = 0;
      head.onerror = function () {
        if (hstage === 0) { hstage = 1; head.src = EVENT.flyerFallback; }
        else { head.onerror = null; head.style.display = 'none'; }
      };
    }

    // parallax (gated behind reduced-motion)
    var scroll = document.getElementById('lscroll');
    if (!scroll) return;
    var heroFlyer = document.getElementById('heroFlyer');
    var overlay = document.getElementById('heroOverlay');
    var sb = document.getElementById('heroSB');
    var hint = document.getElementById('heroHint');
    var lhead = document.getElementById('lhead');
    var floatEls = Array.prototype.slice.call(scroll.querySelectorAll('.floatel'));

    function onScroll() {
      var y = scroll.scrollTop;
      if (reduceMQ.matches) { lhead.style.opacity = y > 560 ? 1 : 0; return; }
      overlay.style.opacity = clamp(y / 760, 0, 0.74);
      heroFlyer.style.transform = 'translateY(' + (y * 0.32) + 'px) scale(' + (1 - clamp(y, 0, 900) / 7000) + ')';
      heroFlyer.style.opacity = 1 - clamp((y - 380) / 520, 0, 0.6);
      sb.style.opacity = 1 - clamp(y / 280, 0, 1);
      hint.style.opacity = 1 - clamp(y / 160, 0, 1);
      lhead.style.opacity = clamp((y - 560) / 220, 0, 1);
      lhead.style.pointerEvents = clamp((y - 560) / 220, 0, 1) > 0.6 ? 'auto' : 'none';
      for (var i = 0; i < floatEls.length; i++) {
        floatEls[i].style.transform = 'translateY(' + (y * Number(floatEls[i].dataset.speed)) + 'px)';
      }
    }
    scroll.addEventListener('scroll', onScroll, { passive: true });
    timers.push(function () { scroll.removeEventListener('scroll', onScroll); });
    onScroll();
  }

  // generated poster fallback in the Astromelias palette
  function flyerPoster() {
    return '' +
    '<svg viewBox="0 0 300 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Astromelias">' +
      '<defs><radialGradient id="g" cx="50%" cy="38%" r="70%">' +
      '<stop offset="0%" stop-color="#46294C"/><stop offset="100%" stop-color="#09060A"/></radialGradient></defs>' +
      '<rect width="300" height="440" rx="10" fill="url(#g)" stroke="rgba(203,183,218,0.4)"/>' +
      '<circle cx="150" cy="150" r="58" fill="none" stroke="#E7AE3F" stroke-width="1.5" opacity="0.7"/>' +
      '<g fill="#B468BC" opacity="0.85">' +
      '<circle cx="150" cy="120" r="14"/><circle cx="180" cy="150" r="14"/><circle cx="150" cy="180" r="14"/>' +
      '<circle cx="120" cy="150" r="14"/><circle cx="150" cy="150" r="10" fill="#E7AE3F"/></g>' +
      '<text x="150" y="300" font-family="Georgia, serif" font-size="34" fill="#F3E8D6" text-anchor="middle">Astromelias</text>' +
      '<text x="150" y="330" font-family="Georgia, serif" font-style="italic" font-size="17" fill="#E7AE3F" text-anchor="middle">Festival</text>' +
      '<text x="150" y="372" font-family="sans-serif" font-size="12" letter-spacing="2" fill="rgba(243,232,214,0.6)" text-anchor="middle">VIE 24 JUL . 5:00 PM</text>' +
    '</svg>';
  }

  /* ---------------------------------------------------------- */
  /* Screen: Organizer Home  (/)                                 */
  /* ---------------------------------------------------------- */
  function infoBlock(icn, label, value, sub, accent) {
    return '<div style="display:flex;gap:10px;align-items:flex-start">' +
      '<span style="color:' + (accent || 'var(--lilac)') + ';margin-top:2px">' + ic(icn, 20) + '</span>' +
      '<div>' +
        '<div class="label" style="font-size:10px;margin-bottom:2px">' + label + '</div>' +
        '<div style="font-weight:600;font-size:15px;white-space:nowrap">' + value + '</div>' +
        (sub ? '<div class="muted" style="font-size:12px">' + sub + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  function Home() {
    var rows = TYPES.map(function (t) {
      return '<div class="trow stub" style="background:var(--black-2)">' +
        '<span class="tname" style="flex:1">' + t.k + '</span>' +
        '<span class="serif" style="font-size:20px;color:var(--yellow);margin-right:12px">$' + esCO(t.v) + '</span>' +
        '<span class="badge">' + t.n + '</span>' +
      '</div>';
    }).join('');

    return '' +
    '<div class="scr t3">' +
      statusbar() +
      '<div class="topbar">' +
        '<button class="tb-btn icon" data-action="go-landing">' + ic('home', 20) + '</button>' +
        '<button class="tb-btn" data-action="open-launch">' + ic('menu', 18) + ' Menu</button>' +
      '</div>' +
      '<div class="scr-body scroll">' +
        '<div class="pad">' +
          '<div class="tile purple" style="padding:20px">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
              '<div>' +
                '<div class="chip" style="background:rgba(255,255,255,0.16);border-color:rgba(255,255,255,0.24);color:#fff;margin-bottom:8px">Evento activo</div>' +
                wordmark(EVENT.name, { style: 'font-size:36px;line-height:0.95' }) +
              '</div>' +
              '<button data-action="buy" style="width:52px;height:52px;border-radius:var(--r-md);background:rgba(95,190,123,0.10);border:1.5px solid var(--green);color:var(--green);flex:0 0 52px;cursor:pointer">' + ic('plus', 24) + '</button>' +
            '</div>' +
            '<div style="display:flex;gap:24px;margin-top:16px">' +
              infoBlock('pin', 'Ubicacion', EVENT.venue, EVENT.address, 'var(--yellow)') +
              infoBlock('clock', 'Puertas', 'vie 24 . 5:00 PM', null, 'var(--yellow)') +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">' +
            '<div class="tile yellow"><div class="label">Vendidas</div><div class="serif" style="font-size:40px;line-height:1">69</div></div>' +
            '<div class="tile orange"><div class="label" style="color:rgba(255,255,255,0.85)">Ingresos</div><div class="serif" style="font-size:28px;color:#fff;line-height:1.1">$1.625.000</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="pad" style="margin-top:18px;padding-bottom:24px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
            '<span style="width:32px;height:32px;border-radius:8px;background:var(--orange);display:grid;place-items:center;color:#fff">' + ic('ticket', 18) + '</span>' +
            '<div class="serif" style="font-size:24px">Tipos de Boletas</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px">' + rows + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------- */
  /* Screen: 7-step purchase flow  (/compra)                     */
  /* ---------------------------------------------------------- */
  function flowShell(o) {
    return '' +
    '<div class="scr t3">' +
      statusbar() +
      '<div class="topbar" style="padding-bottom:8px">' +
        '<button class="tb-btn icon" data-action="flow-back">' + ic('arrowL', 20) + '</button>' +
        '<div class="serif" style="font-size:18px;color:var(--cream)">Astromelias</div>' +
        '<div style="width:44px"></div>' +
      '</div>' +
      '<div class="pad" style="position:relative;z-index:2">' +
        '<div class="steps">' + stepsDots(o.step, 6) + '</div>' +
        '<div style="margin-top:12px">' +
          '<div style="display:flex;align-items:baseline;gap:8px;white-space:nowrap">' +
            '<span class="serif" style="font-size:30px;color:var(--yellow);line-height:1">Paso ' + o.step + '</span>' +
            '<span class="label" style="color:var(--cream-dim);font-size:13px">de 6</span>' +
            '<span class="label" style="color:var(--orange-soft)">. ' + o.kicker + '</span>' +
          '</div>' +
          '<div class="serif" style="font-size:28px;color:var(--cream);line-height:1.06;margin-top:8px">' + o.title + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="scr-body scroll pad" style="z-index:1;margin-top:16px">' + o.body + '</div>' +
      '<div class="pad" style="position:relative;z-index:2;padding-bottom:18px;padding-top:8px">' +
        (o.footnote || '') +
        (o.ghost ? '<button class="btn ghost sm" style="margin-bottom:10px" data-action="' + (o.ghostAction || 'flow-back') + '">' + o.ghost + '</button>' : '') +
        (o.cta ? '<button class="' + (o.ctaClass || 'btn') + '" data-action="' + (o.ctaAction || 'flow-next') + '">' + (o.ctaIcon || '') + o.cta + '</button>' : '') +
      '</div>' +
    '</div>';
  }
  function stepsDots(step, total) {
    var out = '';
    for (var i = 1; i <= total; i++) out += '<i class="' + (i < step ? 'done' : i === step ? 'on' : '') + '"></i>';
    return out;
  }

  function Step1() {
    var body = '' +
      '<div class="tile purple" style="display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<div class="chip" style="background:rgba(255,255,255,0.16);border-color:rgba(255,255,255,0.24);color:#fff;margin-bottom:8px">Etapa activa</div>' +
          '<div class="label" style="color:rgba(255,255,255,0.8);white-space:nowrap">' + STAGE.label + '</div>' +
          '<div class="serif" style="font-size:32px;color:var(--yellow);line-height:1;margin-top:3px">$' + esCO(STAGE.price) + '</div>' +
        '</div>' +
        '<div style="text-align:center">' +
          '<div class="serif" style="font-size:30px;color:#fff">' + STAGE.cupos + '</div>' +
          '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.75)">cupos</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:16px;margin-top:14px;display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<div style="font-weight:600;font-size:16px">Cantidad</div>' +
          '<div class="muted" style="font-size:13px">Max. 6 por persona</div>' +
        '</div>' +
        '<div class="stepper">' +
          '<button data-action="qty-dec"' + (flow.qty <= 1 ? ' disabled' : '') + '>-</button>' +
          '<span class="qv">' + flow.qty + '</span>' +
          '<button data-action="qty-inc"' + (flow.qty >= 6 ? ' disabled' : '') + '>+</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">' +
        '<div class="trow" style="opacity:0.55;background:var(--black-2)">' +
          '<span class="tname" style="flex:1">Etapa 2</span>' + money(35000) +
          '<span class="chip lilac" style="margin-left:10px;height:24px">Proximamente</span>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:16px;margin-top:14px;display:flex;justify-content:space-between;align-items:center;border-color:rgba(231,174,63,0.25)">' +
        '<div class="label" style="color:var(--cream-dim)">Total</div>' +
        '<div class="serif" style="font-size:28px;color:var(--yellow)">$' + esCO(total()) + '</div>' +
      '</div>';
    return flowShell({ step: 1, kicker: 'Seleccion', title: 'Elige tu boleta', body: body, cta: 'Continuar', ctaIcon: ic('chevR', 20) });
  }

  function Step2() {
    var body = '' +
      '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:8px">' +
        '<div class="charly" style="width:76px;height:76px;font-size:34px">&#10022;</div>' +
        '<div class="serif" style="font-size:22px;color:var(--cream);margin-top:16px">Apartamos ' + flow.qty + ' boletas para ti</div>' +
        '<p class="muted" style="font-size:15px;margin-top:6px;max-width:270px">Guardamos tu lugar mientras completas el pago. Este es tu numero de orden:</p>' +
        '<div class="tile" style="background:linear-gradient(150deg,var(--purple),var(--purple-deep));padding:18px 30px;margin-top:16px;text-align:center">' +
          '<div class="label" style="color:rgba(255,255,255,0.7)">Orden</div>' +
          '<div class="folio" style="font-size:38px;color:var(--yellow)">#' + flow.folio + '</div>' +
        '</div>' +
        '<div class="chip lilac" style="margin-top:18px">' + ic('lock', 14) + ' Guardala, no la compartas</div>' +
      '</div>' +
      '<div class="card" style="padding:16px;margin-top:22px;display:flex;justify-content:space-between">' +
        '<div><div class="label" style="color:var(--cream-dim)">Etapa 1 x ' + flow.qty + '</div><div class="muted" style="font-size:13px">Preventa</div></div>' +
        '<div class="serif" style="font-size:26px;color:var(--yellow)">$' + esCO(total()) + '</div>' +
      '</div>';
    return flowShell({ step: 2, kicker: 'Confirmar compra', title: 'Tu cupo esta reservado', body: body, cta: 'Continuar con mis datos', ctaIcon: ic('chevR', 20) });
  }

  function holderCard(n) {
    var h = HOLDERS[n - 1] || { name: '', id: '' };
    return '<div class="card" style="padding:14px">' +
      '<div class="label" style="margin-bottom:12px;color:var(--orange-soft)">Boleta ' + n + '</div>' +
      '<div class="field" style="margin-bottom:10px">' +
        '<div class="flabel"><span style="color:var(--lilac)">' + ic('user', 16) + '</span><span class="label" style="color:var(--cream-dim)">Nombre</span></div>' +
        '<input class="input" type="text" placeholder="Nombre completo" value="' + h.name + '" />' +
      '</div>' +
      '<div class="field">' +
        '<div class="flabel"><span style="color:var(--lilac)">' + ic('id', 16) + '</span><span class="label" style="color:var(--cream-dim)">Documento</span></div>' +
        '<input class="input" type="text" inputmode="numeric" placeholder="N.o de cedula" value="' + h.id + '" />' +
      '</div>' +
    '</div>';
  }

  function Step3() {
    var cards = '';
    for (var i = 1; i <= flow.qty; i++) cards += holderCard(i);
    var body = '<div style="display:flex;flex-direction:column;gap:12px">' + cards +
      '<div class="card" style="padding:14px">' +
        '<div class="label" style="margin-bottom:10px;color:var(--cream-dim)">Como te enviamos las boletas?</div>' +
        '<div class="seg">' +
          '<div class="opt' + (flow.delivery === 'wa' ? ' on' : '') + '" data-action="deliver-wa">' + ic('wa', 16, 1.7, true) + ' WhatsApp</div>' +
          '<div class="opt' + (flow.delivery === 'email' ? ' on' : '') + '" data-action="deliver-email">' + ic('share', 16) + ' Email</div>' +
        '</div>' +
        (flow.delivery === 'wa'
          ? '<input class="input" type="tel" placeholder="+57 . numero de WhatsApp" style="margin-top:10px" />'
          : '<input class="input" type="email" placeholder="correo@ejemplo.com" style="margin-top:10px" />') +
      '</div>' +
    '</div>';
    return flowShell({ step: 3, kicker: 'Datos de boletas', title: 'Para quien son?', body: body, cta: 'Ir a pagar', ctaIcon: ic('chevR', 20) });
  }

  function Step4() {
    var body = '' +
      '<div class="tile" style="background:rgba(231,174,63,0.10);border:1px solid rgba(231,174,63,0.3);display:flex;align-items:center;justify-content:space-between;padding:14px 18px">' +
        '<div>' +
          '<div class="label" style="color:var(--cream-dim)">Tienes</div>' +
          '<div class="count"><span class="t" id="countdown">20:00</span><span class="muted" style="font-size:14px">min</span></div>' +
        '</div>' +
        '<div style="text-align:right;max-width:150px">' +
          '<div class="muted" style="font-size:13px;line-height:1.3">Tranquilo, tu cupo esta guardado mientras tanto</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:18px;margin-top:14px;display:flex;flex-direction:column;align-items:center">' +
        '<div class="label" style="color:var(--cream-dim);white-space:nowrap">Total a transferir</div>' +
        '<div class="serif" style="font-size:40px;color:var(--yellow);line-height:1">$' + esCO(total()) + '</div>' +
        '<div class="qr" style="margin-top:14px"></div>' +
        '<div class="muted" style="font-size:13px;margin-top:10px">Bancolombia . Ahorros 123-456789-00</div>' +
        '<button class="copy-folio" data-action="copy-folio" style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:8px 14px;border-radius:var(--r-full);background:var(--black-3);border:none;cursor:pointer">' +
          '<span class="label" style="color:var(--cream-dim)">Orden</span>' +
          '<span class="folio" style="font-size:20px;color:var(--yellow)">#' + flow.folio + '</span>' +
          '<span style="color:var(--lilac)">' + ic('copy', 16) + '</span>' +
        '</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-top:14px" class="muted">' +
        ic('bell', 16) + '<span style="font-size:13px">Guarda el pantallazo de la transferencia</span>' +
      '</div>';
    return flowShell({ step: 4, kicker: 'Realiza el pago', title: 'Transfiere y guarda el pantallazo', body: body, cta: 'Ya transferi, continuar', ctaIcon: ic('check', 20) });
  }

  function Step5() {
    var msg = 'Hola! Envio pantallazo de compra #' + flow.folio;
    var body = '' +
      '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:12px">' +
        '<div class="emblem green">' + ic('wa', 40, 1.7, true) + '</div>' +
        '<div class="serif" style="font-size:22px;color:var(--cream);margin-top:16px;max-width:280px">Confirma tu pago por WhatsApp</div>' +
        '<p class="muted" style="font-size:15px;margin-top:6px;max-width:270px">Toca el boton y envianos la imagen de tu transferencia. Ya dejamos el mensaje listo.</p>' +
      '</div>' +
      '<div class="card" style="padding:16px;margin-top:22px">' +
        '<div class="label" style="color:var(--cream-dim);margin-bottom:8px">Mensaje</div>' +
        '<div style="padding:12px 14px;border-radius:var(--r-md);background:rgba(95,190,123,0.10);border:1px solid rgba(95,190,123,0.2);font-size:15px">' +
          msg.replace('#' + flow.folio, '<b style="color:var(--yellow)">#' + flow.folio + '</b>') +
        '</div>' +
      '</div>';
    return flowShell({ step: 5, kicker: 'Enviar comprobante', title: 'Envianos tu pantallazo', body: body, cta: 'Abrir WhatsApp', ctaIcon: ic('wa', 20, 1.7, true), ctaAction: 'wa-next' });
  }

  function Step6() {
    var body = '' +
      '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:12px">' +
        '<div class="spinner"><div class="spinner-ring"></div><div class="spinner-core">' + ic('ticket', 30) + '</div></div>' +
        '<span class="pill sent" style="margin-top:18px;height:34px"><span class="dot"></span> Pago enviado</span>' +
        '<p class="muted" style="font-size:15.5px;margin-top:16px;max-width:292px;line-height:1.45">Nuestro equipo esta verificando tu pago. En cuanto lo confirmemos, recibiras tus boletas por <b style="color:var(--green)">WhatsApp</b>.</p>' +
        '<p class="muted" style="font-size:13.5px;margin-top:12px;max-width:292px;line-height:1.45;opacity:0.8">Si tu compra fue fuera del horario habil, te pedimos un poco de paciencia.</p>' +
      '</div>' +
      '<div class="card" style="padding:16px;margin-top:22px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div>' +
            '<div class="label" style="color:var(--cream-dim)">Orden #' + flow.folio + ' . Etapa 1 x ' + flow.qty + '</div>' +
            '<div class="muted" style="font-size:13px">' + EVENT.venue + ' . 24 jul . ' + EVENT.doors + '</div>' +
          '</div>' +
          '<div class="serif" style="font-size:22px;color:var(--yellow)">$' + esCO(total()) + '</div>' +
        '</div>' +
      '</div>';
    return flowShell({
      step: 6, kicker: 'Verificando pago', title: 'Tus boletas estan en camino', body: body,
      cta: 'Ver estado de mi compra', ctaIcon: ic('chevR', 20), ctaAction: 'go-status',
      ghost: 'Volver al inicio', ghostAction: 'go-landing'
    });
  }

  var FLOW_STEPS = [Step1, Step2, Step3, Step4, Step5, Step6];

  function wireStep4() {
    var el = document.getElementById('countdown');
    if (!el) return;
    var remaining = 20 * 60; // cosmetic 20-minute soft countdown (yellow)
    var id = setInterval(function () {
      remaining = Math.max(0, remaining - 1);
      var m = Math.floor(remaining / 60), s = remaining % 60;
      el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }, 1000);
    timers.push(function () { clearInterval(id); });
  }

  /* ---------------------------------------------------------- */
  /* Screen: purchase status state machine  (/estado/:folio)     */
  /* ---------------------------------------------------------- */
  var STATES = {
    pending_payment: { cls: 'wait', label: 'Esperando pago' },
    payment_submitted: { cls: 'sent', label: 'Pago enviado' },
    confirmed: { cls: 'ok', label: 'Confirmada' },
    rejected: { cls: 'no', label: 'Rechazada' },
    expired: { cls: 'dead', label: 'Vencida' }
  };
  var STATE_ORDER = ['pending_payment', 'payment_submitted', 'confirmed', 'rejected', 'expired'];

  function Status(folio, state) {
    if (!STATES[state]) state = 'payment_submitted';
    var st = STATES[state];
    var summary = '' +
      '<div class="card" style="padding:16px;margin-bottom:18px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div>' +
            '<div class="label" style="color:var(--cream-dim)">Orden</div>' +
            '<div class="folio" style="font-size:26px;color:var(--yellow)">#' + folio + '</div>' +
          '</div>' +
          '<span class="pill ' + st.cls + '"><span class="dot"></span> ' + st.label + '</span>' +
        '</div>' +
        '<div class="divider" style="margin:14px 0"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-weight:600">' + EVENT.name + '</div><div class="muted" style="font-size:13px">' + EVENT.venue + ' . 24 jul . ' + EVENT.doors + '</div></div>' +
          '<div class="serif" style="font-size:22px;color:var(--yellow)">$' + esCO(total()) + '</div>' +
        '</div>' +
      '</div>';

    var body = summary + statusBody(folio, state) + stateSwitch(folio, state);

    return '' +
    '<div class="scr t3">' +
      statusbar() +
      '<div class="topbar" style="padding-bottom:8px">' +
        '<button class="tb-btn icon" data-action="go-landing">' + ic('arrowL', 20) + '</button>' +
        '<div class="serif" style="font-size:18px;color:var(--cream)">Estado de compra</div>' +
        '<div style="width:44px"></div>' +
      '</div>' +
      '<div class="scr-body scroll pad" style="z-index:1">' + body + '</div>' +
    '</div>';
  }

  function statusBody(folio, state) {
    if (state === 'pending_payment') {
      return centered(
        '<div class="emblem" style="background:rgba(231,174,63,0.12);border:1px solid rgba(231,174,63,0.35);color:var(--yellow)">' + ic('clock', 40) + '</div>',
        'Esperando tu pago',
        'Aun no recibimos tu comprobante. Transfiere y enviralo por WhatsApp para confirmar tu cupo.',
        '<button class="btn" data-action="go-step5" style="margin-top:22px">' + ic('wa', 20, 1.7, true) + ' Enviar comprobante</button>'
      );
    }
    if (state === 'payment_submitted') {
      return centered(
        '<div class="spinner"><div class="spinner-ring"></div><div class="spinner-core">' + ic('ticket', 30) + '</div></div>',
        'Verificando tu pago',
        'Nuestro equipo esta revisando tu comprobante. En cuanto lo confirmemos recibiras tus boletas por WhatsApp.',
        ''
      );
    }
    if (state === 'confirmed') {
      var qrs = HOLDERS.slice(0, flow.qty).map(function (h, i) {
        return '<div class="card" style="padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px">' +
          '<div class="label" style="color:var(--orange-soft)">Boleta ' + (i + 1) + '</div>' +
          fauxQR(7 * (i + 1) + folio.charCodeAt(0)) +
          '<div style="text-align:center">' +
            '<div style="font-weight:600;font-size:16px">' + h.name + '</div>' +
            '<div class="muted" style="font-size:13px">Etapa 1 . CC ' + h.id + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      return '' +
        centered(
          '<div class="emblem green">' + ic('check', 42) + '</div>',
          'Confirmada!',
          'Tu pago fue verificado. Estas son tus boletas: presentalas en la puerta. Guardalas, no las compartas.',
          ''
        ) +
        '<div style="display:flex;flex-direction:column;gap:12px;margin-top:18px;padding-bottom:8px">' + qrs + '</div>';
    }
    if (state === 'rejected') {
      return centered(
        '<div class="emblem red">' + ic('x', 40) + '</div>',
        'Compra rechazada',
        'No pudimos verificar tu pago. Si crees que es un error, escribenos por WhatsApp con tu comprobante y tu numero de orden.',
        '<button class="btn" data-action="wa-contact" style="margin-top:22px">' + ic('wa', 20, 1.7, true) + ' Escribir por WhatsApp</button>'
      );
    }
    // expired
    return centered(
      '<div class="emblem muted">' + ic('clock', 40) + '</div>',
      'Reserva vencida',
      'Tu reserva expiro y el cupo volvio a estar disponible. Puedes intentar comprar de nuevo.',
      '<button class="btn" data-action="go-landing" style="margin-top:22px">' + ic('ticket', 20) + ' Comprar de nuevo</button>'
    );
  }

  function centered(emblem, title, text, cta) {
    return '<div style="display:flex;flex-direction:column;align-items:center;text-align:center">' +
      emblem +
      '<div class="serif" style="font-size:24px;color:var(--cream);margin-top:16px">' + title + '</div>' +
      '<p class="muted" style="font-size:15px;margin-top:8px;max-width:300px;line-height:1.45">' + text + '</p>' +
      cta +
    '</div>';
  }

  function stateSwitch(folio, state) {
    var btns = STATE_ORDER.map(function (k) {
      return '<button class="' + (k === state ? 'on' : '') + '" data-action="state:' + k + '">' + STATES[k].label + '</button>';
    }).join('');
    return '<div style="margin-top:26px;padding-top:18px;border-top:1px solid var(--hair-2)">' +
      '<div class="label" style="color:var(--cream-faint);text-align:center;margin-bottom:10px;font-size:10px">Prototipo . ver estados</div>' +
      '<div class="state-switch">' + btns + '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------- */
  /* Router                                                      */
  /* ---------------------------------------------------------- */
  function parseRoute() {
    var h = location.hash.replace(/^#/, '');
    if (!h || h === '/') return { name: 'landing' };
    var p = h.split('/').filter(Boolean);
    if (p[0] === 'home') return { name: 'home' };
    if (p[0] === 'compra') return { name: 'flow', step: clamp(parseInt(p[1] || '1', 10) || 1, 1, 6) };
    if (p[0] === 'estado') return { name: 'status', folio: p[1] || flow.folio, state: p[2] || 'payment_submitted' };
    return { name: 'landing' };
  }

  function clearTimers() {
    timers.forEach(function (fn) { try { fn(); } catch (e) {} });
    timers = [];
  }

  function render() {
    clearTimers();
    var r = parseRoute();
    var html;
    if (r.name === 'home') html = Home();
    else if (r.name === 'flow') html = FLOW_STEPS[r.step - 1]();
    else if (r.name === 'status') html = Status(r.folio, r.state);
    else html = Landing();

    app.innerHTML = html;
    app.scrollTop = 0;

    if (r.name === 'landing') wireLanding();
    if (r.name === 'flow' && r.step === 4) wireStep4();
    updateLauncher(r);
  }

  /* ---------------------------------------------------------- */
  /* Actions (event delegation)                                  */
  /* ---------------------------------------------------------- */
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  function currentStep() {
    var r = parseRoute();
    return r.name === 'flow' ? r.step : 1;
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:120;' +
      'background:var(--black-3);color:var(--cream);border:1px solid var(--frame);' +
      'padding:10px 16px;border-radius:var(--r-full);font-family:var(--font-ui);font-size:14px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,0.5)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1600);
  }

  function openWhatsApp() {
    var msg = 'Hola! Envio pantallazo de compra #' + flow.folio;
    window.open('https://wa.me/' + EVENT.whatsapp + '?text=' + encodeURIComponent(msg), '_blank');
  }

  document.addEventListener('click', function (e) {
    var node = e.target.closest('[data-action]');
    if (!node) return;
    var a = node.dataset.action;

    if (a === 'buy') return go('#/compra/1');
    if (a === 'go-landing') return go('#/');
    if (a === 'go-home') return go('#/home');
    if (a === 'go-status') return go('#/estado/' + flow.folio + '/payment_submitted');
    if (a === 'go-step5') return go('#/compra/5');

    if (a === 'flow-next') {
      var s = currentStep();
      return s < 6 ? go('#/compra/' + (s + 1)) : go('#/');
    }
    if (a === 'flow-back') {
      var b = currentStep();
      return b > 1 ? go('#/compra/' + (b - 1)) : go('#/');
    }
    if (a === 'wa-next') { openWhatsApp(); return go('#/compra/6'); }
    if (a === 'wa-contact') { openWhatsApp(); return; }

    if (a === 'qty-dec') { flow.qty = clamp(flow.qty - 1, 1, 6); return render(); }
    if (a === 'qty-inc') { flow.qty = clamp(flow.qty + 1, 1, 6); return render(); }

    if (a === 'deliver-wa') { flow.delivery = 'wa'; return render(); }
    if (a === 'deliver-email') { flow.delivery = 'email'; return render(); }

    if (a === 'copy-folio') {
      var text = '#' + flow.folio;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('Orden ' + text + ' copiada'); }, function () { toast(text); });
      } else { toast(text); }
      return;
    }

    if (a.indexOf('state:') === 0) return go('#/estado/' + flow.folio + '/' + a.slice(6));

    if (a === 'open-launch') return openLauncher(true);
    if (a === 'close-launch') return openLauncher(false);
    if (a.indexOf('nav:') === 0) { openLauncher(false); return go(a.slice(4)); }
  });

  /* ---------------------------------------------------------- */
  /* Prototype screen launcher (replaces the original nav panel) */
  /* ---------------------------------------------------------- */
  var launchOverlay;
  function buildLauncher() {
    var btn = document.createElement('button');
    btn.className = 'launch-btn';
    btn.setAttribute('aria-label', 'Pantallas del prototipo');
    btn.dataset.action = 'open-launch';
    btn.innerHTML = ic('grid', 20);
    document.body.appendChild(btn);

    launchOverlay = document.createElement('div');
    launchOverlay.className = 'launch-overlay';
    var flowLabels = ['Seleccion', 'Confirmar', 'Datos', 'Pago', 'WhatsApp', 'Verificando'];
    var flowItems = flowLabels.map(function (l, i) {
      return '<button class="launch-item" data-nav-key="compra/' + (i + 1) + '" data-action="nav:#/compra/' + (i + 1) + '">' +
        '<span class="launch-num">' + (i + 1) + '</span>' + l + '</button>';
    }).join('');
    var stateItems = STATE_ORDER.map(function (k) {
      return '<button class="launch-item" data-nav-key="estado/' + k + '" data-action="nav:#/estado/' + flow.folio + '/' + k + '">' +
        '<span class="launch-num">' + ic('qr', 13) + '</span>' + STATES[k].label + '</button>';
    }).join('');
    launchOverlay.innerHTML =
      '<div class="launch-sheet" role="dialog" aria-label="Pantallas">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div><h2>Sigale 2.0 . Astromelias</h2><div class="sub">Prototipo en HTML/CSS/JS</div></div>' +
          '<button class="tb-btn icon" data-action="close-launch" aria-label="Cerrar">' + ic('x', 18) + '</button>' +
        '</div>' +
        '<div class="launch-group">Pantallas</div>' +
        '<button class="launch-item" data-nav-key="landing" data-action="nav:#/"><span class="launch-num">' + ic('home', 13) + '</span>Landing<span class="launch-sub">Flyer + parallax</span></button>' +
        '<button class="launch-item" data-nav-key="home" data-action="nav:#/home"><span class="launch-num">' + ic('menu', 13) + '</span>Home<span class="launch-sub">Organizador</span></button>' +
        '<div class="launch-group">Flujo de compra</div>' + flowItems +
        '<div class="launch-group">Estado de compra</div>' + stateItems +
      '</div>';
    document.body.appendChild(launchOverlay);
    launchOverlay.addEventListener('click', function (e) { if (e.target === launchOverlay) openLauncher(false); });
  }
  function openLauncher(open) { if (launchOverlay) launchOverlay.classList.toggle('open', open); }
  function updateLauncher(r) {
    if (!launchOverlay) return;
    var key = r.name === 'landing' ? 'landing'
      : r.name === 'home' ? 'home'
      : r.name === 'flow' ? 'compra/' + r.step
      : 'estado/' + r.state;
    launchOverlay.querySelectorAll('.launch-item').forEach(function (it) {
      it.classList.toggle('on', it.dataset.navKey === key);
    });
  }

  /* ---------------------------------------------------------- */
  /* Boot                                                        */
  /* ---------------------------------------------------------- */
  buildLauncher();
  window.addEventListener('hashchange', render);
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', render);
  render();
})();
