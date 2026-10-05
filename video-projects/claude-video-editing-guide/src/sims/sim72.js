/* 7.2 check frames, because Claude doesn't watch video: one visual beat per explanation phrase, then the caught frame.
   Every tween is a fromTo with explicit values (immediateRender:false via E.A); times are scene-local via T(). */
window.SIMS = window.SIMS || {};
window.SIMS.sim72 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const tw = (el, from, to, t) => tl.fromTo(el, from, A(to), T(t));
  const pop = (el, t, s0) => tw(el, { opacity: 0, scale: s0 || 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, t);
  const check = (badge, t) => { pop(badge, t, 0.5); E.draw(tl, E.q("path", badge), T(t + 0.05), 0.28); };
  const ts = cfg.tStage, b0 = P[0], b1 = P[1], b2 = P[2], b3 = P[3];

  // the magnifier (the check) persists; it moves by offsets from its CSS place, lens centre at (cx, cy)
  const mag = q(".s72-mag");
  const M0 = [586, 320];
  mag.style.left = (M0[0] - 48) + "px";
  mag.style.top = (M0[1] - 48) + "px";
  let mp = { x: 0, y: 0 };
  const magTo = (cx, cy, t, d) => {
    const to = { x: cx - M0[0], y: cy - M0[1] };
    tw(mag, { x: mp.x, y: mp.y }, { x: to.x, y: to.y, duration: d, ease: "power2.inOut" }, t);
    mp = to;
  };

  // establishing shot: the video
  const vid = q(".s72-vid");
  tw(vid, { scale: 0.92 }, { scale: 1, duration: 0.7, ease: E.SPRING }, ts + 0.1);

  // B0 "Claude checks pictures and doesn't watch the video": play is struck out, stills fan out, the magnifier checks them
  const play = q(".s72-play");
  tw(play, { scale: 1 }, { scale: 1.12, duration: 0.15, ease: "power2.out" }, b0 + 0.02);
  tw(play, { scale: 1.12 }, { scale: 1, duration: 0.2, ease: "power2.in" }, b0 + 0.17);
  E.draw(tl, q(".s72-no path"), T(b0 + 0.25), 0.3);
  E.glitch(tl, vid, T(b0 + 0.3), 7);
  const ROT = [-9, -4, 4, 9];
  [2, 1, 3, 0].forEach((i, n) => {
    const st = q(".s72-st" + i);
    const cx = st.offsetLeft + st.offsetWidth / 2, cy = st.offsetTop + st.offsetHeight / 2;
    tw(st, { x: 400 - cx, y: 319 - cy, scale: 0.55, rotation: 0, opacity: 0 }, { x: 0, y: 0, scale: 1, rotation: ROT[i], opacity: 1, duration: 0.7, ease: E.SPRING }, b0 + 0.55 + n * 0.08);
  });
  pop(mag, b0 + 1.05, 0.7);
  check(q(".s72-st2 .s72-ok"), b0 + 1.35);
  magTo(700, 344, b0 + 1.45, 0.35);
  check(q(".s72-st3 .s72-ok"), b0 + 1.8);

  // B1 "so after every render it takes a frame at every important moment and looks at it":
  // the rendered strip arrives, markers drop on the text entry, the effect and the cut; the magnifier visits each
  E.fadeOut(tl, q(".s72-b0"), T(b1), 0.3, -10);
  const strip = q(".s72-strip"), edge = q(".s72-edge"), sfs = qa(".s72-sf");
  tw(strip, { clipPath: "inset(0px 0px 0px 100%)" }, { clipPath: "inset(0px 0px 0px 0%)", duration: 0.7, ease: "power2.inOut" }, b1 + 0.15);
  tw(edge, { opacity: 0 }, { opacity: 1, duration: 0.1 }, b1 + 0.12);
  tw(edge, { x: 0 }, { x: -(strip.offsetWidth - 3), duration: 0.7, ease: "power2.inOut" }, b1 + 0.15);
  tw(edge, { opacity: 1 }, { opacity: 0, duration: 0.12 }, b1 + 0.8);
  const marks = [q(".s72-mt"), q(".s72-mf"), q(".s72-mc")];
  const under = [[1], [3], [5, 6]];        // strip frames under each marker (the cut sits between frames 5 and 6)
  const RING0 = "0 0 0 1.5px rgba(201, 194, 255, 0.38)", RING1 = "0 0 0 2.5px rgba(255, 255, 255, 0.95), 0 0 14px rgba(201, 194, 255, 0.7)";
  marks.forEach((m, i) => {
    const t = b1 + 0.75 + i * 0.18;
    tw(m, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }, t);
    E.draw(tl, E.q(".s72-stem path", m), T(t + 0.2), 0.25);
    under[i].forEach((k) => tw(sfs[k], { boxShadow: RING0 + ", 0 0 0px rgba(201, 194, 255, 0)" }, { boxShadow: RING1, duration: 0.3 }, t + 0.35));
  });
  // each marked frame is taken out of the strip (a copy drops into a row) and the magnifier looks at it
  const wrap = q(".sim72"), exs = qa(".s72-ex"), src = [sfs[1], sfs[3], sfs[6]];
  exs.forEach((ex, i) => {
    const t = b1 + 1.05 + i * 0.12, os = E.off(src[i], wrap), oe = E.off(ex, wrap);
    tw(ex, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t);
    tw(ex, { x: os.x - oe.x, y: os.y - oe.y, scale: +(src[i].offsetWidth / ex.offsetWidth).toFixed(4) }, { x: 0, y: 0, scale: 1, duration: 0.6, ease: E.SPRING }, t);
  });
  magTo(640, 422, b1 + 1.45, 0.4);
  check(E.q(".s72-ok", exs[0]), b1 + 1.8);
  magTo(456, 422, b1 + 1.95, 0.35);
  check(E.q(".s72-ok", exs[1]), b1 + 2.25);
  magTo(226, 422, b1 + 2.4, 0.4);
  check(E.q(".s72-ok", exs[2]), b1 + 2.75);

  // B2 "and around every transition, a frame every tenth of a second": the cut opens into a dense strip
  E.fadeOut(tl, marks[0], T(b2), 0.3, -8);
  E.fadeOut(tl, marks[1], T(b2), 0.3, -8);
  exs.forEach((ex) => E.fadeOut(tl, ex, T(b2), 0.3, 12));
  [0, 1, 2, 3, 4, 7].forEach((k) => tw(sfs[k], { opacity: 1 }, { opacity: 0.32, duration: 0.35 }, b2 + 0.05));
  qa(".s72-cl").forEach((l, i) => E.draw(tl, l, T(b2 + 0.1 + i * 0.05), 0.4));
  tw(q(".s72-cf"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, b2 + 0.2);
  const dense = q(".s72-dense"), dfs = qa(".s72-df");
  tw(dense, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }, b2 + 0.2);
  dfs.forEach((d, i) => pop(d, b2 + 0.35 + i * 0.07, 0.8));
  qa(".s72-ticks i").forEach((k, i) => tw(k, { opacity: 0 }, { opacity: 1, duration: 0.2 }, b2 + 0.42 + i * 0.07));
  magTo(439, 453, b2 + 0.35, 0.5);
  E.draw(tl, q(".s72-dim path"), T(b2 + 1.0), 0.4);
  E.fadeIn(tl, q(".s72-step"), T(b2 + 1.1), 0.45, 10);

  // B3 "to catch things that jump or freeze": two identical frames (freeze), a title that jumps
  tw(q(".s72-dim"), { opacity: 1 }, { opacity: 0, duration: 0.25 }, b3);
  E.fadeOut(tl, q(".s72-step"), T(b3), 0.25, 0);
  magTo(555, 453, b3 + 0.05, 0.35);
  const hl1 = q(".s72-hl1"), hl2 = q(".s72-hl2"), hl6 = q(".s72-hl6"), eq = q(".s72-eq"), fz = q(".s72-fz"), fj = q(".s72-fj"), ja = q(".s72-jarrow");
  pop(hl1, b3 + 0.4, 0.9);
  pop(hl2, b3 + 0.4, 0.9);
  pop(eq, b3 + 0.45, 0.5);
  pop(fz, b3 + 0.5, 0.8);
  magTo(244, 453, b3 + 0.8, 0.4);
  pop(hl6, b3 + 1.15, 0.9);
  tw(ja, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2.4)" }, b3 + 1.15);
  pop(fj, b3 + 1.2, 0.8);

  // payoff: the frame without a caption is caught: red mark, it lifts and grows, its empty caption place, the label
  [hl1, hl2, hl6, eq, ja].forEach((el) => tw(el, { opacity: 1 }, { opacity: 0, duration: 0.3 }, pe));
  E.fadeOut(tl, fz, T(pe), 0.3, 8);
  E.fadeOut(tl, fj, T(pe), 0.3, 8);
  // the automatic check has passed...
  const auto = q(".s72-auto");
  pop(auto, pe + 0.25, 0.8);
  E.draw(tl, q(".s72-aok path"), T(pe + 0.32), 0.28);
  // ...but the frame itself is looked at: no caption
  magTo(400, 453, pe + 0.25, 0.45);
  const red = q(".s72-red");
  E.draw(tl, q(".s72-red rect"), T(pe + 0.75), 0.35);
  E.glitch(tl, dfs[4], T(pe + 0.75), 5);
  tw(auto, { opacity: 1 }, { opacity: 0.42, duration: 0.35 }, pe + 0.9);
  E.fadeOut(tl, strip, T(pe + 0.85), 0.35, 0);
  E.fadeOut(tl, marks[2], T(pe + 0.85), 0.35, 0);
  tw(q(".s72-call"), { opacity: 1 }, { opacity: 0, duration: 0.35 }, pe + 0.85);
  tw(mag, { opacity: 1 }, { opacity: 0, duration: 0.3 }, pe + 1.0);
  const big = q(".s72-big"), d4 = dfs[4];
  const od = E.off(d4, wrap), ob = E.off(big, wrap);
  const fromBig = { x: +(od.x - ob.x).toFixed(1), y: +(od.y - ob.y).toFixed(1), scale: +(d4.offsetWidth / big.offsetWidth).toFixed(4) };
  tw(big, { opacity: 0 }, { opacity: 1, duration: 0.15 }, pe + 1.1);
  tw(big, fromBig, { x: 0, y: 0, scale: 1, duration: 0.75, ease: E.SPRING }, pe + 1.1);
  // the red mark lifts off with the copy (which starts exactly over it); the frame's place keeps a dashed
  // lavender outline, so only one red thing is on screen besides the badge
  tw(red, { opacity: 1 }, { opacity: 0, duration: 0.15 }, pe + 1.1);
  tw(q(".s72-slot"), { opacity: 0 }, { opacity: 0.6, duration: 0.35 }, pe + 1.15);
  const ph = q(".s72-ph");
  tw(ph, { opacity: 0, scale: 0.9, transformOrigin: "50% 81%" }, { opacity: 1, scale: 1, transformOrigin: "50% 81%", duration: 0.35, ease: "back.out(2)" }, pe + 1.85);
  E.burst(tl, big, 93, 269, T(pe + 1.9), { n: 12, seed: 72, r0: 30, r1: 80, color: "#c9c2ff" });
  E.fadeIn(tl, q(".s72-ct1"), T(pe + 1.95), 0.45, 12);
  E.fadeIn(tl, q(".s72-ct2"), T(pe + 2.25), 0.45, 12);
  // the fact takes over: the texts outside its dark backing leave completely as the stage dims
  [q(".s72-catch"), q(".s72-autorow")].forEach((el) => tw(el, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "power2.in" }, cfg.tSimEnd - 0.45));
};
