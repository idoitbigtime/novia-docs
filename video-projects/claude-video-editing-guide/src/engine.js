/* Runtime helpers that add tweens to one paused GSAP master timeline.
   Every tween is a fromTo with explicit values and immediateRender:false (CSS holds the
   initial state), so any frame can be rendered by seeking to it in any order.
   Each scene has its own camera (.scam); the chapter header sits outside it and never zooms. */
(function () {
  const E = (window.ENG = {});
  // The guide's no-overshoot spring (prompts 9 and 13).
  const SPRING = (p) => (1 - (1 + 7 * p) * Math.exp(-7 * p)) / (1 - 8 * Math.exp(-7));
  E.SPRING = SPRING;
  E.debug = (window.__ENG_DEBUG = { scenes: {} });
  E.q = (s, r) => (r || document).querySelector(s);
  E.qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const NI = { immediateRender: false };
  E.NI = NI;
  const A = (o) => Object.assign(o, NI);
  E.A = A;
  /* Deterministic PRNG (mulberry32): never use Math.random in scenes. */
  E.rand = function (seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  /* Offsets ignore transforms: measure layout before any tween moves things. */
  E.off = function (el, top) {
    let x = 0, y = 0, e = el;
    while (e && e !== top) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y };
  };
  E.center = function (el, top) {
    const o = E.off(el, top);
    return { x: o.x + el.offsetWidth / 2, y: o.y + el.offsetHeight / 2 };
  };

  E.fadeIn = function (tl, el, t, d, dy) {
    if (!el) return;
    tl.fromTo(el, { opacity: 0, y: dy || 0 }, A({ opacity: 1, y: 0, duration: d || 0.5, ease: SPRING }), t);
  };
  E.fadeOut = function (tl, el, t, d, dy, from) {
    if (!el) return;
    tl.fromTo(el, { opacity: from == null ? 1 : from, y: 0 }, A({ opacity: 0, y: dy || 0, duration: d || 0.3, ease: "power2.in" }), t);
  };
  E.dim = function (tl, el, t, to, from, d) {
    if (!el) return;
    tl.fromTo(el, { opacity: from == null ? 1 : from }, A({ opacity: to, duration: d || 0.35, ease: "power2.out" }), t);
  };

  /* Kinetic words: each word enters on its time with a spring (slightly above final size,
     then settles) and unblurs. Blur is animated separately from the spring and ends on
     0px then "none", so it never goes negative (prompt 2's pitfall). */
  E.kin = function (tl, root, S, o) {
    if (!root) return;
    o = o || {};
    const dy = o.dy == null ? 18 : o.dy;
    E.qa(".w", root).forEach((w) => {
      const t = S + parseFloat(w.dataset.t || "0");
      tl.fromTo(w, { opacity: 0 }, A({ opacity: 1, duration: 0.22, ease: "power2.out" }), t);
      tl.fromTo(w, { y: dy, scale: 0.82 }, A({ y: 0, scale: 1, duration: 0.62, ease: "back.out(2.1)" }), t);
      tl.fromTo(w, { filter: "blur(9px)" }, A({ filter: "blur(0px)", duration: 0.3, ease: "power2.out" }), t);
      tl.set(w, { filter: "none" }, t + 0.31);
    });
    E.qa(".ul", root).forEach((u) => {
      const t = S + parseFloat(u.dataset.t || "0");
      tl.fromTo(u, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.5, ease: "power3.inOut" }), t);
    });
  };

  /* White pill caption: switches in one frame, no animation (prompt 2). */
  E.pill = function (tl, el, tin, tout) {
    tl.set(el, { opacity: 1 }, tin);
    if (tout != null) tl.set(el, { opacity: 0 }, tout);
  };

  /* Bouncy zoom on the scene camera with the guide's spring. The focal x is clamped so a
     content column [colL, colR] scaled by (1+amt) stays inside the safe area x 140..940. */
  E.zoom = function (tl, ctx, cx, cy, t, amt, tBack, backDur, col) {
    const s = 1 + amt;
    const L = col ? col[0] : 220, R = col ? col[1] : 940;
    const lo = (s * R - 940) / (s - 1), hi = (s * L - 140) / (s - 1);
    if (lo <= hi) cx = Math.min(hi, Math.max(lo, cx));
    else cx = (L + R) / 2;
    tl.set(ctx.cam, { transformOrigin: cx.toFixed(1) + "px " + cy.toFixed(1) + "px" }, t);
    tl.fromTo(ctx.cam, { scale: 1 }, A({ scale: s, duration: 0.8, ease: SPRING }), t);
    if (tBack != null) {
      if (backDur) tl.fromTo(ctx.cam, { scale: s }, A({ scale: 1, duration: backDur, ease: "power2.inOut" }), tBack);
      else tl.set(ctx.cam, { scale: 1 }, tBack);
    }
    E.debug.zooms = (E.debug.zooms || []).concat([{ t: +t.toFixed(3), s, cx: Math.round(cx), cy: Math.round(cy) }]);
  };
  E.zoomOn = function (tl, ctx, el, t, amt, tBack, backDur, col) {
    const c = E.center(el, ctx.scene);
    E.zoom(tl, ctx, c.x, c.y, t, amt, tBack, backDur, col);
  };

  /* Prompt card: the full verbatim text, paged (static pages and short slides, so any
     paused frame is readable); holds on highlighted lines (highlight bar + bouncy zoom,
     the bar fades when the hold ends); section tabs follow the page; exits at t1. */
  E.prompt = function (tl, ctx, card, t0, t1, hls) {
    const vp = E.q(".pvp", card), ct = E.q(".pct", card), dim = E.q(".pdim", card);
    const ROW = 44, ROWS = 23;                     // the viewport is exactly 23 rows: no line is ever cut
    const totalRows = Math.round(ct.scrollHeight / ROW);
    const lastTop = Math.max(0, (totalRows - ROWS) * ROW);
    const H = (hls || []).map((h) => {
      const ln = E.q('[data-hl="' + h.id + '"]', card);
      const words = ln.textContent.trim().split(/\s+/).length;
      return { ln, top: ln.offsetTop, bot: ln.offsetTop + ln.offsetHeight, hold: h.hold || 2.4, words };
    });
    // pages advance by 22 rows (one row of overlap); a page is pulled up so a key line never straddles an edge
    const pages = [0];
    while (pages[pages.length - 1] < lastTop) {
      const cur = pages[pages.length - 1];
      let nxt = Math.min(lastTop, cur + (ROWS - 1) * ROW);
      for (const h of H) if (h.top > cur && h.top < cur + ROWS * ROW && h.bot > cur + ROWS * ROW) nxt = Math.min(nxt, h.top - 2 * ROW);
      if (nxt <= cur) nxt = Math.min(lastTop, cur + ROW);
      pages.push(nxt);
    }
    H.forEach((h) => { h.page = 0; pages.forEach((p, i) => { if (p <= h.top && h.bot <= p + ROWS * ROW) h.page = i; }); });
    // time: quick pages (full verbatim text, readable when paused) and long holds on the key lines
    const n = pages.length, slide = 0.25, lead = 0.25, exitD = 0.3, gap = 0.2;
    const holdPages = new Set(H.map((h) => h.page));
    const budget = t1 - t0 - lead - exitD - (n - 1) * slide;
    let holdsT = H.reduce((a, h) => a + h.hold + gap, 0);
    const minPage = 0.5;
    if (budget - holdsT < n * minPage) {
      const room = Math.max(H.length * 2.0, budget - n * minPage - gap * H.length);
      const k = room / H.reduce((a, h) => a + h.hold, 0);
      H.forEach((h) => { h.hold = Math.max(2.0, h.hold * k); });
      holdsT = H.reduce((a, h) => a + h.hold + gap, 0);
    }
    const dwell = Math.max(0.35, (budget - holdsT) / n);
    tl.fromTo(card, { opacity: 0 }, A({ opacity: 1, duration: 0.3, ease: "power1.out" }), t0);
    tl.fromTo(card, { scale: 0.97, y: 40 }, A({ scale: 1, y: 0, duration: 0.6, ease: SPRING }), t0);
    const arrivals = [], holdTimes = [];
    let t = t0 + lead;
    for (let i = 0; i < n; i++) {
      arrivals.push(t);
      const mine = H.filter((h) => h.page === i);
      let tt = t + (mine.length ? dwell * 0.4 : dwell);
      mine.forEach((h, j) => {
        const hb = E.q(".hlbg", h.ln);
        // key line lifts out of the page (bouncy zoom on the line itself); the rest of the page dims
        tl.set(h.ln, { zIndex: 2, transformOrigin: "50% 50%" }, tt);
        tl.fromTo(hb, { opacity: 0 }, A({ opacity: 1, duration: 0.2, ease: "power2.out" }), tt);
        tl.fromTo(h.ln, { scale: 1 }, A({ scale: 1.08, duration: 0.6, ease: SPRING }), tt);
        if (j === 0) tl.fromTo(dim, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), tt);
        tl.fromTo(h.ln, { scale: 1.08 }, A({ scale: 1, duration: 0.3, ease: "power2.inOut" }), tt + h.hold - 0.3);
        tl.fromTo(hb, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), tt + h.hold - 0.25);
        tl.set(h.ln, { zIndex: 0 }, tt + h.hold);
        if (j === mine.length - 1) tl.fromTo(dim, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), tt + h.hold - 0.3);
        holdTimes.push(+tt.toFixed(3));
        tt += h.hold + gap;
      });
      t = mine.length ? tt + dwell * 0.6 - gap : tt;
      if (i < n - 1) {
        tl.fromTo(ct, { y: -pages[i] }, A({ y: -pages[i + 1], duration: slide, ease: "power2.inOut" }), t);
        t += slide;
      }
    }
    // tabs follow the page: the section that fills most of the visible rows
    const tabs = E.qa(".tab", card);
    if (tabs.length) {
      const tags = tabs.map((tab) => E.q('.ptag[data-sec="' + tab.dataset.sec + '"]', card));
      const starts = tags.map((g) => (g ? g.offsetTop : 1e9));
      const secAt = (p) => {
        let best = 0, bestRows = -1;
        starts.forEach((st, j) => {
          const en = j + 1 < starts.length ? starts[j + 1] : 1e9;
          const vis = Math.max(0, Math.min(en, p + ROWS * ROW) - Math.max(st, p));
          if (vis > bestRows) { bestRows = vis; best = j; }
        });
        return best;
      };
      let cur = -1;
      for (let i = 0; i < n; i++) {
        const k = secAt(pages[i]);
        if (k === cur) continue;
        const ta = i === 0 ? t0 + 0.1 : arrivals[i] - slide * 0.5;
        if (cur >= 0) {
          tl.fromTo(tabs[cur], { color: "#f5f2ea" }, A({ color: "#9c99ae", duration: 0.2 }), ta);
          tl.fromTo(E.q(".tul", tabs[cur]), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), ta);
        }
        tl.fromTo(tabs[k], { color: "#9c99ae" }, A({ color: "#f5f2ea", duration: 0.2 }), ta);
        tl.fromTo(E.q(".tul", tabs[k]), { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), ta);
        cur = k;
      }
      // on the last page, once its key lines are done, the last visible section takes over
      const lastP = pages[n - 1];
      let lastVis = cur;
      starts.forEach((st, j) => { if (st < lastP + ROWS * ROW && st >= lastP) lastVis = Math.max(lastVis, j); });
      if (lastVis > cur) {
        const mineLast = H.filter((h) => h.page === n - 1);
        const ta = mineLast.length ? holdTimes[holdTimes.length - 1] + mineLast[mineLast.length - 1].hold + 0.05 : arrivals[n - 1] + dwell * 0.5;
        tl.fromTo(tabs[cur], { color: "#f5f2ea" }, A({ color: "#9c99ae", duration: 0.2 }), ta);
        tl.fromTo(E.q(".tul", tabs[cur]), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), ta);
        tl.fromTo(tabs[lastVis], { color: "#9c99ae" }, A({ color: "#f5f2ea", duration: 0.2 }), ta);
        tl.fromTo(E.q(".tul", tabs[lastVis]), { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), ta);
      }
    }
    tl.fromTo(card, { opacity: 1 }, A({ opacity: 0, duration: exitD, ease: "power2.in" }), t1 - exitD);
    return { pages: n, tops: pages, arrivals: arrivals.map((x) => +x.toFixed(3)), dwell: +dwell.toFixed(3), holds: holdTimes, holdLens: H.map((h) => +h.hold.toFixed(2)) };
  };

  /* Standard topic scene. Layout is measured once (static), then:
     title + explanation centred -> dock to the top (smaller, dimmed) -> simulation ->
     fact (simulation and explanation leave, fact centred) -> prompt card -> tip. */
  E.topic = function (tl, ctx, cfg) {
    const S = cfg.S, sc = ctx.scene;
    const hdr = E.q(".hdr", sc), main = E.q(".main", sc), exp = E.q(".exp", sc);
    const stage = E.q(".stage", sc), simtag = E.q(".simtag", sc), fact = E.q(".factbox", sc);
    // static layout
    const h = main.offsetHeight;
    const top0 = Math.round(Math.max(380, 930 - h / 2));
    main.style.top = top0 + "px";
    const dockTop = 382, dockS = 0.86;
    const stTop = Math.round(dockTop + h * dockS + 40);
    stage.style.top = stTop + "px";
    stage.style.height = Math.max(600, 1562 - stTop) + "px";

    E.fadeIn(tl, hdr, S + 0.05, 0.5, 0);
    E.kin(tl, E.q(".ttl", sc), S);
    E.kin(tl, exp, S);
    const acc = E.q(".exp .accgrp", sc);
    if (acc && cfg.expZoom) E.zoomOn(tl, ctx, acc, S + parseFloat(acc.dataset.t), cfg.expZoom, S + cfg.tDock - 0.05, 0.4);
    // dock
    tl.set(main, { transformOrigin: "100% 0%" }, S + cfg.tDock);
    tl.fromTo(main, { y: 0, scale: 1 }, A({ y: dockTop - top0, scale: dockS, duration: 0.75, ease: SPRING }), S + cfg.tDock);
    E.dim(tl, exp, S + cfg.tDock, 0.3, 1, 0.5);
    E.qa(".accgrp", exp).forEach((g) => tl.fromTo(g, { color: "#ff453a" }, A({ color: "#dcd9e6", duration: 0.5 }), S + cfg.tDock));
    E.qa(".ul", exp).forEach((u) => tl.fromTo(u, { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), S + cfg.tDock));
    // simulation
    E.fadeIn(tl, simtag, S + cfg.tStage - 0.15, 0.4, 0);
    tl.fromTo(stage, { opacity: 0, y: 46 }, A({ opacity: 1, y: 0, duration: 0.8, ease: SPRING }), S + cfg.tStage);
    if (window.SIMS[cfg.sim]) window.SIMS[cfg.sim](tl, ctx, cfg, S);
    const tNext = cfg.tPrompt != null ? cfg.tPrompt : cfg.tTip != null ? cfg.tTip : cfg.D - 0.05;
    const tOut1 = cfg.tFact != null ? cfg.tFact - 0.45 : tNext - 0.35;
    E.dim(tl, stage, S + tOut1, 0, 1, 0.35);
    E.dim(tl, simtag, S + tOut1, 0, 1, 0.3);
    E.dim(tl, exp, S + tOut1, 0, 0.3, 0.35);
    if (cfg.tFact != null) {
      const pill = E.q(".factbox .pill", sc);
      if (pill) {
        tl.fromTo(pill, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), S + cfg.tFact - 0.1);
        tl.fromTo(pill, { scale: 0.92, y: 20 }, A({ scale: 1, y: 0, duration: 0.45, ease: SPRING }), S + cfg.tFact - 0.1);
      }
      E.kin(tl, fact, S, { dy: 12 });
    }
    // first cut: the docked title (and the fact) leave before the card or the tip arrives
    tl.fromTo(main, { opacity: 1 }, A({ opacity: 0, duration: 0.25, ease: "power2.in" }), S + tNext - 0.3);
    if (fact) E.fadeOut(tl, fact, S + tNext - 0.3, 0.25, -20);
    let info = null;
    if (cfg.tPrompt != null) {
      const pend = cfg.tTip != null ? cfg.tTip : cfg.tPromptEnd;
      info = E.prompt(tl, ctx, E.q(".pcard", sc), S + cfg.tPrompt, S + pend, cfg.hls);
    }
    if (cfg.tTip != null) {
      const tip = E.q(".tipcard", sc);
      tl.fromTo(tip, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), S + cfg.tTip);
      tl.fromTo(tip, { scale: 0.96, y: 30 }, A({ scale: 1, y: 0, duration: 0.6, ease: SPRING }), S + cfg.tTip);
      E.kin(tl, E.q(".tip-text", sc), S);
      E.fadeOut(tl, tip, S + cfg.D - 0.4, 0.3, -20);
    }
    E.fadeOut(tl, hdr, S + cfg.D - 0.4, 0.3, 0);
    E.debug.scenes[cfg.id] = { S, D: cfg.D, layout: { top0, stTop, h }, prompt: info };
  };

  /* Chapter title card. */
  E.chapter = function (tl, ctx, cfg) {
    const S = cfg.S, sc = ctx.scene;
    const k = E.q(".ch-k", sc), n = E.q(".ch-n", sc), line = E.q(".ch-line", sc), dots = E.q(".ch-dots", sc);
    tl.fromTo(n, { opacity: 0, scale: 0.72, y: 30 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.9, ease: SPRING }), S + 0.12);
    tl.fromTo(n, { filter: "blur(14px)" }, A({ filter: "blur(0px)", duration: 0.45, ease: "power2.out" }), S + 0.12);
    tl.set(n, { filter: "none" }, S + 0.58);
    E.fadeIn(tl, k, S + 0.25, 0.5, 14);
    E.kin(tl, E.q(".ch-title", sc), S);
    tl.fromTo(line, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.7, ease: "power3.inOut" }), S + 0.75);
    E.kin(tl, E.q(".ch-sub", sc), S, { dy: 12 });
    E.kin(tl, E.q(".ch-tag", sc), S, { dy: 10 });
    E.fadeIn(tl, dots, S + 0.6, 0.6, 10);
    tl.fromTo(E.q(".chap", sc), { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 1.04, duration: 0.38, ease: "power2.in" }), S + cfg.D - 0.4);
    E.debug.scenes[cfg.id] = { S, D: cfg.D, type: "chapter" };
  };

  window.SIMS = window.SIMS || {};
})();
