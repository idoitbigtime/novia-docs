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
     paused frame is readable). On a key line the page text dims and a copy of the line
     lifts above the card (bouncy zoom on the line; it sits in its own layer, so its backing
     is never clipped). One underline slides between the section tabs. Exits at t1. */
  E.prompt = function (tl, ctx, card, t0, t1, hls) {
    const vp = E.q(".pvp", card), ct = E.q(".pct", card), body = E.q(".pbody", card);
    const ROW = 44, ROWS = 23;                     // the viewport is exactly 23 rows: no line is ever cut
    const totalRows = Math.round(body.offsetHeight / ROW);
    const lastTop = Math.max(0, (totalRows - ROWS) * ROW);
    const bw = parseFloat(getComputedStyle(card).borderTopWidth) || 0;
    const H = (hls || []).map((h) => {
      const ln = E.q('[data-hl="' + h.id + '"]', card);
      const lift = E.q('.pl-lift[data-for="' + h.id + '"]', ctx.scene);
      return { id: h.id, ln, lift, top: ln.offsetTop, bot: ln.offsetTop + ln.offsetHeight, want: h.hold || 2.4 };
    }).sort((a, b) => a.top - b.top);
    // pages advance by 22 rows (one row of overlap); a page is pulled up so a key line never straddles an edge
    const pages = [0];
    while (pages[pages.length - 1] < lastTop) {
      const cur = pages[pages.length - 1];
      let nxt = Math.min(lastTop, cur + (ROWS - 1) * ROW);
      for (const h of H) if (h.top > cur && h.top < cur + ROWS * ROW && h.bot > cur + ROWS * ROW) nxt = Math.min(nxt, h.top - 2 * ROW);
      if (nxt <= cur) nxt = Math.min(lastTop, cur + ROW);
      pages.push(nxt);
    }
    // a key line is held on the page where it sits furthest from the edges (the lift needs room)
    H.forEach((h) => {
      let bestM = -1e9;
      h.page = 0;
      pages.forEach((p, i) => {
        const m = Math.min(h.top - p, p + ROWS * ROW - h.bot);
        if (m >= 0 && m > bestM + 0.5) { bestM = m; h.page = i; }
      });
    });
    // schedule: plain pages flip on a 0.6 s cadence (slide included); key lines get the rest of the
    // time, in proportion to their wanted holds; the page stays dimmed across a slide between two holds
    const n = pages.length;
    const LEAD = 0.25, EXIT = 0.3, SLIDE = 0.25, DSLIDE = 0.35, UNLIFT = 0.25, UNDIM = 0.3, MINH = 2.0;
    const LIFT = 1.1, DIM = 0.38;
    const mineOf = (i) => H.filter((h) => h.page === i);
    const isHold = (i) => i >= 0 && i < n && mineOf(i).length > 0;
    const liftDelay = (i) => (i === 0 ? Math.max(0.2, 0.62 - LEAD) : i > 0 && isHold(i - 1) ? 0.15 : 0.2);
    let fixed = LEAD + EXIT, nPlain = 0, tail = 0.2;
    for (let i = 0; i < n; i++) {
      const mine = mineOf(i);
      if (!mine.length) nPlain++;
      else fixed += liftDelay(i) + (mine.length - 1) * UNLIFT + (isHold(i + 1) ? UNLIFT : UNDIM);
      if (i < n - 1) fixed += isHold(i) && isHold(i + 1) ? DSLIDE : SLIDE;
    }
    fixed += tail;
    const want = H.reduce((a, h) => a + h.want, 0);
    let dwell = 0.35;
    let room = t1 - t0 - fixed - nPlain * dwell;
    if (H.length && room < Math.max(want, H.length * MINH) && nPlain) {
      dwell = Math.max(0.2, dwell - (Math.max(want, H.length * MINH) - room) / nPlain);
      room = t1 - t0 - fixed - nPlain * dwell;
    }
    if (H.length) {
      let k = room / want;
      if (k > 1.35) {
        const extra = room - want * 1.35;
        k = 1.35;
        dwell += extra / (nPlain + 1);
        tail += extra / (nPlain + 1);
      }
      H.forEach((h) => { h.hold = h.want * k; });
      // keep a 2 s floor on every hold where the budget allows it
      for (let it = 0; it < 3; it++) {
        const low = H.filter((h) => h.hold < MINH), high = H.filter((h) => h.hold >= MINH);
        if (!low.length || !high.length) break;
        const need = low.reduce((a, h) => a + MINH - h.hold, 0);
        const spare = high.reduce((a, h) => a + h.hold - MINH, 0);
        const take = Math.min(need, spare);
        low.forEach((h) => { h.hold += (MINH - h.hold) * (take / need); });
        high.forEach((h) => { h.hold -= (h.hold - MINH) * (take / spare); });
      }
    } else {
      dwell = Math.max(dwell, (t1 - t0 - fixed) / Math.max(1, nPlain));
    }
    // the lifted copies sit over their line on the page where it is held (static layout)
    H.forEach((h) => {
      h.lift.style.left = (bw + vp.offsetLeft + ct.offsetLeft + h.ln.offsetLeft) + "px";
      h.lift.style.top = (bw + vp.offsetTop + h.top - pages[h.page]) + "px";
      h.lift.style.width = h.ln.offsetWidth + "px";
    });
    tl.fromTo(card, { opacity: 0 }, A({ opacity: 1, duration: 0.3, ease: "power1.out" }), t0);
    tl.fromTo(card, { scale: 0.97, y: 40 }, A({ scale: 1, y: 0, duration: 0.6, ease: SPRING }), t0);
    const arrivals = [], slides = [], holdTimes = [];
    let t = t0 + LEAD, dimmed = false, tFinal = null;
    for (let i = 0; i < n; i++) {
      arrivals.push(t);
      const mine = mineOf(i);
      if (!mine.length) t += dwell;
      else {
        t += liftDelay(i);
        mine.forEach((h, j) => {
          if (!dimmed) tl.fromTo(body, { opacity: 1 }, A({ opacity: DIM, duration: 0.3, ease: "power2.out" }), t);
          dimmed = true;
          tl.fromTo(h.lift, { opacity: 0 }, A({ opacity: 1, duration: 0.18, ease: "power2.out" }), t);
          tl.fromTo(h.lift, { scale: 1 }, A({ scale: LIFT, duration: 0.6, ease: SPRING }), t);
          holdTimes.push(+t.toFixed(3));
          t += h.hold;
          const keepDim = j < mine.length - 1 || isHold(i + 1);
          const d = keepDim ? UNLIFT : UNDIM;
          tl.fromTo(h.lift, { scale: LIFT }, A({ scale: 1, duration: d, ease: "power2.inOut" }), t);
          tl.fromTo(h.lift, { opacity: 1 }, A({ opacity: 0, duration: d, ease: "power2.in" }), t);
          if (!keepDim) {
            tl.fromTo(body, { opacity: DIM }, A({ opacity: 1, duration: UNDIM, ease: "power2.inOut" }), t);
            dimmed = false;
            if (i === n - 1) tFinal = t;
          }
          t += d;
        });
      }
      if (i < n - 1) {
        const sd = dimmed ? DSLIDE : SLIDE;
        tl.fromTo(ct, { y: -pages[i] }, A({ y: -pages[i + 1], duration: sd, ease: "power2.inOut" }), t);
        slides.push([t, sd]);
        t += sd;
      }
    }
    // tabs: one underline slides with the page to the section that fills most of the visible rows
    const tabs = E.qa(".tab", card), ul = E.q(".tabul", card);
    if (tabs.length && ul) {
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
      const MUTED = "#9c99ae", INK = "#f5f2ea";
      const pos = (k) => ({ left: tabs[k].offsetLeft, width: tabs[k].offsetWidth });
      let cur = secAt(pages[0]);
      ul.style.left = pos(cur).left + "px";
      ul.style.width = pos(cur).width + "px";
      tl.fromTo(ul, { opacity: 0 }, A({ opacity: 1, duration: 0.3, ease: "power2.out" }), t0 + 0.1);
      tl.fromTo(tabs[cur], { color: MUTED }, A({ color: INK, duration: 0.2 }), t0 + 0.1);
      const move = (k, ta, d) => {
        const a = pos(cur), b = pos(k);
        tl.fromTo(ul, { left: a.left, width: a.width }, A({ left: b.left, width: b.width, duration: d, ease: "power3.inOut" }), ta);
        tl.fromTo(tabs[cur], { color: INK }, A({ color: MUTED, duration: 0.2 }), ta + d / 2 - 0.1);
        tl.fromTo(tabs[k], { color: MUTED }, A({ color: INK, duration: 0.2 }), ta + d / 2 - 0.1);
        cur = k;
      };
      // the section that holds the last visible row (the end of the prompt on the last page)
      const lastVisible = (p) => { let k = 0; starts.forEach((st, j) => { if (st < p + ROWS * ROW) k = Math.max(k, j); }); return k; };
      for (let i = 1; i < n; i++) {
        const k = i === n - 1 && !isHold(i) ? lastVisible(pages[i]) : secAt(pages[i]);
        if (k !== cur) move(k, slides[i - 1][0], Math.max(0.3, slides[i - 1][1]));
      }
      // a last page with key lines: its last section takes over when the page undims
      if (isHold(n - 1) && tFinal != null && lastVisible(pages[n - 1]) > cur) move(lastVisible(pages[n - 1]), tFinal, 0.3);
    }
    tl.fromTo(card, { opacity: 1 }, A({ opacity: 0, duration: EXIT, ease: "power2.in" }), t1 - EXIT);
    return {
      pages: n, tops: pages, arrivals: arrivals.map((x) => +x.toFixed(3)), dwell: +dwell.toFixed(3),
      holds: holdTimes, holdLens: H.map((h) => +h.hold.toFixed(2)), slack: +(t1 - EXIT - t).toFixed(3),
      lifts: H.map((h) => ({ id: h.id, page: h.page, lineH: h.ln.offsetHeight, liftH: h.lift.offsetHeight })),
    };
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
