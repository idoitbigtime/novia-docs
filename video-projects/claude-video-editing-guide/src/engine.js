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

  /* ---------- effects (all pure transforms/opacity, created once before the first seek) ---------- */
  /* Light sweep across an element, right to left (the reading direction). The element must be
     positioned; it clips the band to its own shape. o.color tints the band. */
  E.sweep = function (tl, el, t, d, o) {
    if (!el) return;
    o = o || {};
    const fx = document.createElement("i"), b = document.createElement("b");
    fx.className = "fx-sweep";
    if (o.color) fx.style.setProperty("--sweep", o.color);
    fx.appendChild(b);
    // the sweep clips to the element's own box, so a static element becomes the containing block
    // (only when none of its absolutely placed children depends on an outer one)
    if (getComputedStyle(el).position === "static") {
      const outer = Array.from(el.querySelectorAll("*")).some((c) => /absolute|fixed/.test(getComputedStyle(c).position) && c.offsetParent !== el && el.contains(c.offsetParent) === false);
      if (!outer) el.style.position = "relative";
    }
    el.appendChild(fx);
    // the band is 180% of the swept box's height and skewed 16 degrees, so its ends lean by ~0.26 of the
    // height: it starts and ends that far outside, never as a wedge inside a tall box
    const w = fx.offsetWidth || el.offsetWidth, h = fx.offsetHeight || el.offsetHeight;
    const bw = Math.max(60, Math.round(w * 0.34)), slant = Math.ceil(h * 0.27) + 12;
    b.style.width = bw + "px";
    b.style.left = w + slant + "px";
    tl.fromTo(b, { x: 0 }, A({ x: -(w + 2 * slant + bw), duration: d || 0.8, ease: "power2.inOut" }), t);
  };
  /* A soft light band crosses the whole frame (scene change). */
  E.band = function (tl, scene, t) {
    const b = document.createElement("i");
    b.className = "fx-band";
    scene.appendChild(b);
    tl.fromTo(b, { x: 0 }, A({ x: -1900, duration: 0.85, ease: "power2.inOut" }), t);
    tl.fromTo(b, { opacity: 0 }, A({ opacity: 1, duration: 0.25, ease: "power1.out" }), t);
    tl.fromTo(b, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power1.in" }), t + 0.55);
  };
  /* Particle burst from (x, y) inside parent: n dots fly out and fade (deterministic). */
  E.burst = function (tl, parent, x, y, t, o) {
    if (!parent) return;
    o = o || {};
    const n = o.n || 14, rnd = E.rand(o.seed || 7), col = o.color || "#ff6b61", r0 = o.r0 || 30, r1 = o.r1 || 120;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.className = "fx-dot";
      const sz = 5 + rnd() * 7;
      d.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + sz.toFixed(1) + "px;height:" + sz.toFixed(1) + "px;margin:" + (-sz / 2).toFixed(1) + "px 0 0 " + (-sz / 2).toFixed(1) + "px;background:" + col + ";box-shadow:0 0 10px " + col;
      parent.appendChild(d);
      const ang = (i / n) * Math.PI * 2 + rnd() * 0.5, dist = r0 + rnd() * (r1 - r0), dur = 0.55 + rnd() * 0.35;
      tl.fromTo(d, { x: 0, y: 0, scale: 1 }, A({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, scale: 0.35, duration: dur, ease: "power3.out" }), t);
      tl.fromTo(d, { opacity: 1 }, A({ opacity: 0, duration: dur, ease: "power2.in" }), t);
    }
  };
  /* Draw an SVG stroke on (path, line, polyline, circle, rect). */
  E.draw = function (tl, el, t, d, ease) {
    if (!el) return;
    // the hidden dash ends before the path starts, so a round cap never leaves a dot there
    const L = Math.ceil(el.getTotalLength ? el.getTotalLength() : 200) + 2, pad = 12;
    el.style.strokeDasharray = L + " " + (L + 2 * pad);
    el.style.strokeDashoffset = L + pad;
    tl.fromTo(el, { strokeDashoffset: L + pad }, A({ strokeDashoffset: 0, duration: d || 0.6, ease: ease || "power2.inOut" }), t);
  };
  /* Short glitch: the element jolts sideways with a skew and settles (chained, explicit values). */
  E.glitch = function (tl, el, t, amp) {
    if (!el) return;
    const a = amp || 8;
    const seq = [[0, 0], [a, -7], [-a * 0.7, 5], [a * 0.45, -3], [-a * 0.2, 1.5], [0, 0]];
    for (let i = 1; i < seq.length; i++) {
      tl.fromTo(el, { x: seq[i - 1][0], skewX: seq[i - 1][1] }, A({ x: seq[i][0], skewX: seq[i][1], duration: 0.05, ease: "none" }), t + (i - 1) * 0.05);
    }
  };
  /* Bouncy zoom inside the illustration (the guide's spring): the stage camera punches in on a
     focal element and comes back at tBack. The camera box clips, so text above is never touched. */
  E.zoomStage = function (tl, ctx, el, t, amt, tBack) {
    const cam = ctx.stcam, fit = ctx.fit || 1, sf = ctx.stfit;
    let cx = cam.offsetWidth / 2, cy = cam.offsetHeight / 2;
    if (el) {
      const c = E.center(el, sf);
      const hw = sf.offsetWidth / 2, hh = sf.offsetHeight / 2;
      cx = sf.offsetLeft + hw + (c.x - hw) * fit;
      cy = sf.offsetTop + hh + (c.y - hh) * fit;
    }
    const s = 1 + amt;
    tl.set(cam, { transformOrigin: cx.toFixed(1) + "px " + cy.toFixed(1) + "px" }, t);
    tl.fromTo(cam, { scale: 1 }, A({ scale: s, duration: 0.8, ease: SPRING }), t);
    if (tBack != null) tl.fromTo(cam, { scale: s }, A({ scale: 1, duration: 0.45, ease: "power2.inOut" }), tBack);
    // the frame's edges soften while the camera is pushed in (content beyond them is cropped)
    const clip = cam.parentElement;
    if (clip && clip.classList.contains("stclip")) {
      tl.fromTo(clip, { "--edge": "0px" }, A({ "--edge": "26px", duration: 0.3, ease: "power2.out" }), t);
      if (tBack != null) tl.fromTo(clip, { "--edge": "26px" }, A({ "--edge": "0px", duration: 0.3, ease: "power2.in" }), tBack + 0.15);
    }
    E.debug.zooms = (E.debug.zooms || []).concat([{ t: +t.toFixed(3), s, cx: Math.round(cx), cy: Math.round(cy) }]);
  };
  /* Slow drifting dust over the whole video (depth; deterministic). */
  E.dust = function (tl, bg, total) {
    const rnd = E.rand(11);
    for (let i = 0; i < 28; i++) {
      const d = document.createElement("i"), sz = 2 + rnd() * 3.5;
      d.className = "dust";
      d.style.cssText = "left:" + (rnd() * 1080).toFixed(0) + "px;top:" + (200 + rnd() * 1700).toFixed(0) + "px;width:" + sz.toFixed(1) + "px;height:" + sz.toFixed(1) + "px;opacity:" + (0.15 + rnd() * 0.35).toFixed(2);
      bg.appendChild(d);
      tl.fromTo(d, { x: 0, y: 0 }, A({ x: (rnd() - 0.5) * 160, y: -(140 + rnd() * 320), duration: total, ease: "none" }), 0);
    }
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
    // a short text (an excerpt) gets a card sized to it, centred where the full card would be
    if (totalRows < ROWS) {
      const cut = vp.offsetTop + totalRows * ROW + 28, top = card.offsetTop + (card.offsetHeight - cut) / 2;
      [card, E.q(".plift", ctx.scene)].forEach((el) => { if (el) { el.style.height = cut + "px"; el.style.top = top + "px"; } });
      vp.style.height = totalRows * ROW + "px";
    }
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
    // schedule: plain pages flip on a ~0.52 s cadence (slide included); key lines get the rest of the
    // time, in proportion to their wanted holds; the page stays dimmed across a slide between two holds
    const n = pages.length;
    const LEAD = 0.25, EXIT = 0.3, SLIDE = 0.25, DSLIDE = 0.25, UNLIFT = 0.25, UNDIM = 0.3, MINH = 2.0;
    const LIFT = 1.1, DIM = 0.38;
    const mineOf = (i) => H.filter((h) => h.page === i);
    const isHold = (i) => i >= 0 && i < n && mineOf(i).length > 0;
    const liftDelay = (i) => (i === 0 ? Math.max(0.2, 0.92 - LEAD) : i > 0 && isHold(i - 1) ? 0.05 : 0.2);
    // a plain last page stays settled a little longer before the exit
    let fixed = LEAD + EXIT, nPlain = 0, tail = isHold(n - 1) ? 0.2 : 0.45;
    for (let i = 0; i < n; i++) {
      const mine = mineOf(i);
      if (!mine.length) nPlain++;
      else fixed += liftDelay(i) + (mine.length - 1) * UNLIFT + (isHold(i + 1) ? UNLIFT : UNDIM);
      if (i < n - 1) fixed += isHold(i) && isHold(i + 1) ? DSLIDE : SLIDE;
    }
    fixed += tail;
    const want = H.reduce((a, h) => a + h.want, 0);
    let dwell = 0.45;
    let room = t1 - t0 - fixed - nPlain * dwell;
    if (H.length && room < Math.max(want, H.length * MINH) && nPlain) {
      dwell = Math.max(0.18, dwell - (Math.max(want, H.length * MINH) - room) / nPlain);
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
    // the lines around a lifted key line make room for it: the ones next to it move up to PUSH px,
    // each gap between two lines shrinks by at most COMP px, and the line at the page edge moves
    // only EDGE px (inside its own leading, so no glyph is ever cut by the viewport)
    const PUSH = 10, COMP = 4, EDGE = 2, plines = E.qa(".pl", body);
    H.forEach((h) => {
      // a tall key line zooms less, and grows toward the side of the page that has more lines to push
      const lh = h.bot - h.top;
      h.s = 1 + Math.min(LIFT - 1, 10 / lh);
      const p0 = pages[h.page], p1 = p0 + ROWS * ROW;
      const vis = plines.filter((l) => l !== h.ln && l.offsetTop >= p0 - 1 && l.offsetTop + l.offsetHeight <= p1 + 1);
      const above = vis.filter((l) => l.offsetTop + l.offsetHeight <= h.top + 1).reverse();
      const below = vis.filter((l) => l.offsetTop >= h.bot - 1);
      const f = above.length + below.length ? Math.min(0.85, Math.max(0.15, above.length / (above.length + below.length))) : 0.5;
      h.lift.style.transformOrigin = "50% " + (f * 100).toFixed(1) + "%";
      // each side is pushed by what the panel grows on that side, plus a gap
      const grow = [f * lh * (h.s - 1), (1 - f) * lh * (h.s - 1)];
      h.push = [];
      [[above, -1, grow[0]], [below, 1, grow[1]]].forEach(([ls, sgn, g]) => {
        const m = ls.length, want = Math.max(PUSH, Math.round(g + 8));
        ls.forEach((l, j) => h.push.push([l, sgn * Math.min(want, EDGE + COMP * (m - 1 - j))]));
      });
    });
    // the lifted copies sit over their line on the page where it is held (static layout)
    H.forEach((h) => {
      h.lift.style.left = (bw + vp.offsetLeft + ct.offsetLeft + h.ln.offsetLeft) + "px";
      h.lift.style.top = (bw + vp.offsetTop + h.top - pages[h.page]) + "px";
      h.lift.style.width = h.ln.offsetWidth + "px";
    });
    tl.fromTo(card, { opacity: 0 }, A({ opacity: 1, duration: 0.3, ease: "power1.out" }), t0);
    tl.fromTo(card, { rotationX: 16, y: 90, scale: 0.94, transformPerspective: 1600 }, A({ rotationX: 0, y: 0, scale: 1, duration: 0.8, ease: SPRING }), t0);
    E.sweep(tl, card, t0 + 0.4, 1.0, { color: "rgba(201, 194, 255, 0.16)" });
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
          tl.fromTo(h.lift, { scale: 1 }, A({ scale: h.s, duration: 0.6, ease: SPRING }), t);
          h.push.forEach(([l, s]) => tl.fromTo(l, { y: 0 }, A({ y: s, duration: 0.45, ease: "power3.out" }), t));
          holdTimes.push(+t.toFixed(3));
          h.t0 = t;
          t += h.hold;
          const keepDim = j < mine.length - 1 || isHold(i + 1);
          const d = keepDim ? UNLIFT : UNDIM;
          // the copy settles exactly onto its line first, then dissolves into it (never two offset copies)
          tl.fromTo(h.lift, { scale: h.s }, A({ scale: 1, duration: d * 0.6, ease: "power2.out" }), t);
          h.push.forEach(([l, s]) => tl.fromTo(l, { y: s }, A({ y: 0, duration: d, ease: "power2.inOut" }), t));
          tl.fromTo(h.lift, { opacity: 1 }, A({ opacity: 0, duration: d * 0.4, ease: "power1.in" }), t + d * 0.6);
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
      // while a key line is lifted, the underline sits on that line's own section
      const secOf = (y) => { let k = 0; starts.forEach((st, j) => { if (st <= y) k = j; }); return k; };
      const ev = [];
      for (let i = 1; i < n; i++) {
        const mine = mineOf(i);
        const k = mine.length ? secOf(mine[0].top) : i === n - 1 ? lastVisible(pages[i]) : secAt(pages[i]);
        ev.push([slides[i - 1][0], k, Math.max(0.3, slides[i - 1][1])]);
      }
      H.forEach((h) => ev.push([h.t0, secOf(h.top), 0.3]));
      ev.sort((a, b) => a[0] - b[0]).forEach(([ta, k, d]) => { if (k !== cur) move(k, ta, d); });
      // a last page with key lines: its last section takes over when the page undims
      if (isHold(n - 1) && tFinal != null && lastVisible(pages[n - 1]) !== cur) move(lastVisible(pages[n - 1]), tFinal, 0.3);
    }
    tl.fromTo(card, { opacity: 1 }, A({ opacity: 0, duration: EXIT, ease: "power2.in" }), t1 - EXIT);
    return {
      pages: n, tops: pages, arrivals: arrivals.map((x) => +x.toFixed(3)), dwell: +dwell.toFixed(3),
      holds: holdTimes, holdLens: H.map((h) => +h.hold.toFixed(2)), slack: +(t1 - EXIT - t).toFixed(3),
      lifts: H.map((h) => ({ id: h.id, page: h.page, lineH: h.ln.offsetHeight, s: +h.s.toFixed(3), origin: h.lift.style.transformOrigin, push: h.push.map((x) => Math.round(x[1])).join(" ") })),
    };
  };

  /* Standard topic scene. Layout is measured once (static):
     the title and the explanation sit at the top; the illustration fills the safe area below.
     title -> illustration enters -> explanation phrase by phrase (current phrase bright, the
     illustration shows each phrase, bouncy zoom inside it on the key phrase) -> payoff ->
     fact over the dimmed illustration -> prompt card -> tip. */
  E.topic = function (tl, ctx, cfg) {
    const S = cfg.S, sc = ctx.scene;
    const hdr = E.q(".hdr", sc), main = E.q(".main", sc), exp = E.q(".exp", sc), ttl = E.q(".ttl", sc);
    const stage = E.q(".stage", sc), simtag = E.q(".simtag", sc), fact = E.q(".factbox", sc);
    const stcam = E.q(".stcam", sc), stfit = E.q(".stfit", sc);
    // static layout
    const TOP = 376, BOTTOM = 1566;
    const h = main.offsetHeight;
    const stTop = Math.round(TOP + h + 30);
    stage.style.top = stTop + "px";
    stage.style.height = BOTTOM - stTop + "px";
    const camH = BOTTOM - stTop - 50;
    const simH = (E.q(".simwrap", sc) || { offsetHeight: 700 }).offsetHeight || 700;
    stfit.style.height = simH + "px";
    stfit.style.marginTop = -simH / 2 + "px";
    const fit = Math.min(1, camH / simH);
    if (fit < 1) stfit.style.transform = "scale(" + fit.toFixed(3) + ")";
    if (fact) { fact.style.top = stTop + 50 + "px"; fact.style.height = camH + "px"; }
    Object.assign(ctx, { stcam, stfit, fit, stTop });
    // scene change: a light band crosses the frame while the camera settles
    E.band(tl, sc, S);
    tl.fromTo(ctx.cam, { scale: 1.035 }, A({ scale: 1, duration: 1.0, ease: SPRING }), S);
    E.fadeIn(tl, hdr, S, 0.3, 0);
    E.kin(tl, ttl, S);
    // the illustration enters with the explanation
    E.fadeIn(tl, simtag, S + cfg.tStage, 0.4, 0);
    tl.fromTo(stage, { opacity: 0, y: 46 }, A({ opacity: 1, y: 0, duration: 0.8, ease: SPRING }), S + cfg.tStage);
    // explanation: phrase by phrase; the phrase being read is bright, the ones before step back
    E.kin(tl, exp, S, { dy: 14 });
    const phs = E.qa(".ph", exp);
    phs.forEach((ph, i) => {
      const tEnd = i + 1 < phs.length ? cfg.phr[i + 1] : cfg.phrEnd + 0.8;
      tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0.5, duration: 0.45, ease: "power2.out" }), S + tEnd);
      E.qa(".accgrp", ph).forEach((g) => tl.fromTo(g, { color: "#ff453a" }, A({ color: "#dcd9e6", duration: 0.45 }), S + tEnd));
      E.qa(".ul", ph).forEach((u) => tl.fromTo(u, { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), S + tEnd));
    });
    if (window.SIMS[cfg.sim]) window.SIMS[cfg.sim](tl, ctx, cfg, S);
    // bouncy zoom inside the illustration on the key phrase (focus: [data-focus="<phrase>"])
    const acc = E.q(".exp .accgrp", sc);
    if (acc && cfg.expZoom) {
      const p = +(acc.closest(".ph") || { dataset: { p: 0 } }).dataset.p;
      const tb = p + 1 < cfg.phr.length ? cfg.phr[p + 1] : cfg.phrEnd + 0.6;
      const focus = E.q('[data-focus="' + p + '"]', stage) || E.q("[data-focus]", stage);
      E.zoomStage(tl, ctx, focus, S + parseFloat(acc.dataset.t) + 0.1, cfg.expZoom, S + tb);
    }
    const tNext = cfg.tPrompt != null ? cfg.tPrompt : cfg.tTip != null ? cfg.tTip : cfg.D - 0.05;
    if (cfg.tFact != null) {
      // the fact takes over the illustration's area; the illustration steps far back
      E.dim(tl, stage, S + cfg.tFact - 0.45, 0.06, 1, 0.4);
      E.dim(tl, exp, S + cfg.tFact - 0.45, 0, 0.5, 0.35);
      const scrim = E.q(".factbox .fscrim", sc);
      if (scrim) tl.fromTo(scrim, { opacity: 0 }, A({ opacity: 1, duration: 0.4, ease: "power2.out" }), S + cfg.tFact - 0.45);
      const pill = E.q(".factbox .pill", sc);
      if (pill) {
        tl.fromTo(pill, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), S + cfg.tFact - 0.1);
        tl.fromTo(pill, { scale: 0.92, y: 20 }, A({ scale: 1, y: 0, duration: 0.45, ease: SPRING }), S + cfg.tFact - 0.1);
        E.sweep(tl, pill, S + cfg.tFact + 0.25, 0.7, { color: "rgba(120, 100, 255, 0.28)" });
        E.burst(tl, fact, fact.offsetWidth / 2, fact.offsetHeight / 2 - 40, S + cfg.tFact + 0.05, { n: 16, seed: 3, r0: 140, r1: 300, color: "#c9c2ff" });
      }
      E.kin(tl, fact, S, { dy: 12 });
      E.dim(tl, stage, S + tNext - 0.3, 0, 0.06, 0.25);
    } else {
      E.dim(tl, stage, S + tNext - 0.35, 0, 1, 0.3);
      E.dim(tl, exp, S + tNext - 0.35, 0, 0.5, 0.3);
    }
    E.dim(tl, simtag, S + (cfg.tFact != null ? cfg.tFact - 0.45 : tNext - 0.35), 0, 1, 0.3);
    // first cut: the title (and the fact) leave before the card or the tip arrives
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
      tl.fromTo(tip, { scale: 0.96, y: 30, rotationX: 10, transformPerspective: 1400 }, A({ scale: 1, y: 0, rotationX: 0, duration: 0.7, ease: SPRING }), S + cfg.tTip);
      E.qa(".tip-ico .dr", sc).forEach((pth, i) => E.draw(tl, pth, S + cfg.tTip + 0.15 + i * 0.18, 0.55));
      E.kin(tl, E.q(".tip-text", sc), S);
      E.fadeOut(tl, tip, S + cfg.D - 0.4, 0.3, -20);
    }
    E.fadeOut(tl, hdr, S + cfg.D - 0.4, 0.3, 0);
    E.debug.scenes[cfg.id] = { S, D: cfg.D, layout: { stTop, h, fit: +fit.toFixed(3) }, prompt: info };
  };

  /* Chapter title card. Frame 0 already shows the number (springing from 0.9), its rings, the kicker and
     the dots, so a cut never lands on an empty frame; the title follows, the subtitle (and tag) only after
     it, and the chapter's line-art motif draws itself beside the number. The hold stays alive: a slow
     1.00 -> 1.03 push of the whole card, a glow that breathes on the number, a small motion in the motif.
     The exit is a 0.22 s push-through. */
  E.chapter = function (tl, ctx, cfg) {
    const S = cfg.S, sc = ctx.scene, T = cfg.T || {}, D = cfg.D;
    const chap = E.q(".chap", sc), cam = E.q(".ch-cam", sc);
    const k = E.q(".ch-k", sc), n = E.q(".ch-n", sc), line = E.q(".ch-line", sc), dots = E.q(".ch-dots", sc);
    // static layout: the title is one line no wider than 760 px; the divider and texts flow under it
    const tt = E.q(".ch-title", sc), tin = E.q(".ch-tin", sc);
    if (tin && tin.offsetWidth > 760) tt.style.fontSize = (78 * 760 / tin.offsetWidth).toFixed(1) + "px";
    const tBot = tt.offsetTop + tt.offsetHeight;
    line.style.top = tBot + 30 + "px";
    const sub = E.q(".ch-sub", sc), tag = E.q(".ch-tag", sc);
    if (sub) sub.style.top = tBot + 66 + "px";
    if (tag && sub) tag.style.top = tBot + 66 + sub.offsetHeight + 34 + "px";
    // scene change: light band; the number is there from the first frame, rings and sparks go out from it
    E.band(tl, sc, S);
    tl.fromTo(n, { scale: 0.9, rotationY: -16, transformPerspective: 1200 }, A({ scale: 1, rotationY: 0, duration: 0.9, ease: SPRING }), S);
    E.qa(".ch-ring", sc).forEach((r, i) => {
      tl.fromTo(r, { scale: 0.66 + i * 0.14, opacity: 0.85 - i * 0.2 }, A({ scale: 1.55 + i * 0.25, opacity: 0, duration: 1.1 + i * 0.2, ease: "power2.out" }), S);
    });
    // sparks leave from the ring's edge (never a stack of dots over the number)
    const rnd = E.rand(5);
    for (let i = 0; i < 18; i++) {
      const d = document.createElement("i"), sz = 5 + rnd() * 6, ang = (i / 18) * Math.PI * 2 + rnd() * 0.3;
      const r0 = 128, r1 = 210 + rnd() * 150, dur = 0.6 + rnd() * 0.35;
      d.className = "fx-dot";
      d.style.cssText = "left:" + (540 + Math.cos(ang) * r0).toFixed(1) + "px;top:" + (670 + Math.sin(ang) * r0).toFixed(1) + "px;width:" + sz.toFixed(1) + "px;height:" + sz.toFixed(1) + "px;margin:" + (-sz / 2).toFixed(1) + "px 0 0 " + (-sz / 2).toFixed(1) + "px;background:#ffffff;box-shadow:0 0 10px #ffffff";
      sc.appendChild(d);
      tl.fromTo(d, { x: 0, y: 0, scale: 1 }, A({ x: Math.cos(ang) * (r1 - r0), y: Math.sin(ang) * (r1 - r0), scale: 0.35, duration: dur, ease: "power3.out" }), S + 0.03);
      tl.fromTo(d, { opacity: 1 }, A({ opacity: 0, duration: dur, ease: "power2.in" }), S + 0.03);
    }
    tl.fromTo(k, { opacity: 0.35, y: 8 }, A({ opacity: 1, y: 0, duration: 0.4, ease: SPRING }), S);
    tl.fromTo(dots, { opacity: 0.4, y: 8 }, A({ opacity: 1, y: 0, duration: 0.5, ease: SPRING }), S);
    E.kin(tl, tt, S);
    tl.fromTo(line, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.6, ease: "power3.inOut" }), S + (T.line || 0.5));
    E.kin(tl, sub, S, { dy: 12 });
    E.kin(tl, tag, S, { dy: 10 });
    // the chapter motif draws itself, then keeps a small motion through the hold
    const mo = E.q(".ch-mo", sc), mq = (s) => E.q(s, mo), mqa = (s) => E.qa(s, mo);
    if (mo) {
      E.qa(".dr", mo).forEach((p, i) => E.draw(tl, p, S + 0.06 + i * 0.035, 0.7));
      E.qa(".mo-solid", mo).forEach((p) => tl.fromTo(p, { fillOpacity: 0 }, A({ fillOpacity: 1, duration: 0.3 }), S + 0.3));
      E.qa(".fl", mo).forEach((p, i) => tl.fromTo(p, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), S + 0.25 + i * 0.06));
      const hold0 = Math.max(1.0, (T.lw || 1) - 0.4), N = cfg.n;
      if (N === 1) {
        // the cursor blinks
        const cur = mq(".mo-cur");
        for (let a = hold0, on = false; a < D - 0.3; a += 0.5, on = !on) tl.set(cur, { opacity: on ? 1 : 0 }, S + a);
      } else if (N === 2) {
        // a playhead runs over the waveform
        const ph = mq(".mo-ph");
        tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), S + 0.8);
        tl.fromTo(ph, { x: 0 }, A({ x: 164, duration: D - 1.1, ease: "none" }), S + 0.8);
      } else if (N === 3) {
        // the cube settles in and turns slowly
        const mi = mq(".mo-in");
        tl.fromTo(mi, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.8, ease: SPRING }), S + 0.05);
        tl.fromTo(mq(".mo-cube"), { rotationY: -10 }, A({ rotationY: 62, duration: D, ease: "power1.out" }), S);
      } else if (N === 4) {
        // the play mark pulses
        const pl = mq(".mo-play");
        for (let a = hold0, j = 0; a + 0.6 < D - 0.25; a += 0.6, j++) {
          tl.fromTo(pl, { scale: j % 2 ? 1.16 : 1, transformOrigin: "50% 50%" }, A({ scale: j % 2 ? 1 : 1.16, duration: 0.6, ease: "sine.inOut" }), S + a);
        }
      } else if (N === 5) {
        // the plug goes into the socket and the connection glows
        tl.fromTo(mq(".mo-plug"), { y: 0 }, A({ y: -18, duration: 0.55, ease: "back.out(1.6)" }), S + hold0);
        const rg = mq(".mo-ring");
        tl.fromTo(rg, { opacity: 0.9, scale: 0.6, transformOrigin: "50% 50%" }, A({ opacity: 0, scale: 1.7, duration: 0.8, ease: "power2.out" }), S + hold0 + 0.4);
      } else if (N === 6) {
        // a scan line runs down the window; the sensitive line blurs as it passes
        const scn = mq(".mo-scan"), tB = hold0 + 0.75;
        tl.fromTo(scn, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), S + hold0);
        tl.fromTo(scn, { y: 0 }, A({ y: 108, duration: 1.2, ease: "none" }), S + hold0);
        tl.fromTo(scn, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), S + hold0 + 1.0);
        tl.fromTo(mq(".mo-sharp"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), S + tB);
        tl.fromTo(mq(".mo-blur"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), S + tB);
      } else if (N === 7) {
        // the draft bar fills fast and gets its check; the full render crawls
        const f1 = mq(".mo-f1"), f2 = mq(".mo-f2");
        [f1, f2].forEach((f) => tl.fromTo(f, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), S + 0.75));
        tl.fromTo(f2, { scaleX: 0.04, transformOrigin: "0% 50%" }, A({ scaleX: 1, duration: 1.0, ease: "power1.inOut" }), S + 0.75);
        tl.fromTo(f1, { scaleX: 0.04, transformOrigin: "0% 50%" }, A({ scaleX: 0.3, duration: D - 1.0, ease: "none" }), S + 0.75);
        E.draw(tl, mq(".mo-ck"), S + 1.8, 0.35);
      } else {
        // the list gets checked, one row after another
        mqa(".mo-ck").forEach((p, i) => E.draw(tl, p, S + hold0 + i * 0.35, 0.3));
      }
    }
    // the hold: a slow push of the whole card and a soft glow that breathes on the number
    tl.fromTo(cam, { scale: 1 }, A({ scale: 1.03, duration: D, ease: "none" }), S);
    const G0 = "0 0 40px rgba(255, 69, 58, 0.35)", G1 = "0 0 70px rgba(255, 69, 58, 0.8)";
    for (let a = 0.9, up = true; a + 1.0 <= D - 0.2; a += 1.0, up = !up) {
      tl.fromTo(n, { textShadow: up ? G0 : G1 }, A({ textShadow: up ? G1 : G0, duration: 1.0, ease: "sine.inOut" }), S + a);
    }
    // exit: a short push-through into the next scene
    tl.fromTo(chap, { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 1.025, duration: 0.22, ease: "power2.in" }), S + D - 0.22);
    E.debug.scenes[cfg.id] = { S, D, type: "chapter" };
  };

  window.SIMS = window.SIMS || {};
})();
