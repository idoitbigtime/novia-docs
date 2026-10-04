/* 7.1 approve 15 low-resolution seconds before the full render: one visual beat per explanation phrase, then the race.
   Every tween is a fromTo with explicit values (immediateRender:false via E.A); times are scene-local via T(). */
window.SIMS = window.SIMS || {};
window.SIMS.sim71 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim71, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const tw = (el, from, to, t) => tl.fromTo(el, from, A(to), T(t));
  const pop = (el, t, s0) => tw(el, { opacity: 0, scale: s0 || 0.7 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2)" }, t);
  const ts = cfg.tStage, b0 = P[0], b1 = P[1], b2 = P[2], b3 = P[3], tEnd = cfg.tSimEnd - 0.45;
  const wrap = q(".sim71");
  const sweep = (el, t, d, color) => {       // light sweep, right to left, for tall frames
    const fx = document.createElement("i"), b = document.createElement("b");
    fx.className = "s71-swp";
    if (color) fx.style.setProperty("--sw", color);
    fx.appendChild(b);
    el.appendChild(fx);
    tw(b, { x: 0 }, { x: -(el.clientWidth * 1.8 + 10), duration: d, ease: "power2.inOut" }, t);
  };

  const ghost = q(".s71-ghost"), draft = q(".s71-draft"), scene = q(".s71-scene"), px = q(".s71-px");
  const scans = qa(".s71-scan"), t540 = q(".s71-tr540 .s71-tag"), t1080 = q(".s71-tr1080 .s71-tag"), dok = q(".s71-dok");
  const scanLine = (el, t, d) => {           // a render pass: a bright line runs down the frame
    tw(el, { opacity: 0 }, { opacity: 1, duration: 0.06 }, t - 0.04);
    tw(el, { y: 0 }, { y: 256, duration: d, ease: "none" }, t);
    tw(el, { opacity: 1 }, { opacity: 0, duration: 0.08 }, t + d - 0.02);
  };

  // establishing shot: the outline of the full frame, the strip of the whole video
  E.fadeIn(tl, ghost, T(ts + 0.1), 0.5, 12);
  E.fadeIn(tl, q(".s71-strip"), T(ts + 0.2), 0.5, 10);

  // B0 "before the full render, Claude renders 15 seconds from the busiest stretch":
  // the strip is scanned, the busiest stretch is bracketed (15 seconds) and flies into the small draft, which renders
  const sn = q(".s71-scanner");
  tw(sn, { opacity: 0 }, { opacity: 1, duration: 0.12 }, b0 + 0.05);
  tw(sn, { x: 0 }, { x: -396, duration: 1.0, ease: "none" }, b0 + 0.05);
  tw(sn, { opacity: 1 }, { opacity: 0, duration: 0.15 }, b0 + 0.95);
  tw(q(".s71-lit"), { clipPath: "inset(0px 0px 0px 100%)" }, { clipPath: "inset(0px 0px 0px 0%)", duration: 1.0, ease: "none" }, b0 + 0.05);
  qa(".s71-lit .s71-hot").forEach((b, i) => {
    tw(b, { scaleY: 1 }, { scaleY: 1.16, duration: 0.18, ease: "power2.out" }, b0 + 1.0 + i * 0.015);
    tw(b, { scaleY: 1.16 }, { scaleY: 1, duration: 0.3, ease: "power2.inOut" }, b0 + 1.18 + i * 0.015);
  });
  E.draw(tl, q(".s71-brk rect"), T(b0 + 1.0), 0.5);
  E.fadeIn(tl, q(".s71-busy"), T(b0 + 1.2), 0.45, 12);
  pop(q(".s71-p15"), b0 + 1.35);
  const clip = q(".s71-clip"), co = E.off(clip, wrap), dr = E.off(draft, wrap);
  const fly = { x: +(dr.x - co.x).toFixed(1), y: +(dr.y - co.y).toFixed(1), scaleX: +(draft.offsetWidth / clip.offsetWidth).toFixed(4), scaleY: +(draft.offsetHeight / clip.offsetHeight).toFixed(4) };
  tw(clip, { opacity: 0 }, { opacity: 1, duration: 0.15 }, b0 + 1.7);
  tw(clip, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, Object.assign({}, fly, { duration: 0.6, ease: "power3.inOut" }), b0 + 1.8);
  tw(clip, { opacity: 1 }, { opacity: 0, duration: 0.2 }, b0 + 2.3);
  tw(draft, { opacity: 0 }, { opacity: 1, duration: 0.2 }, b0 + 2.3);
  tw(scene, { clipPath: "inset(0px 0px 100% 0px)" }, { clipPath: "inset(0px 0px 0% 0px)", duration: 0.55, ease: "none" }, b0 + 2.36);
  scanLine(scans[0], b0 + 2.36, 0.55);

  // B1 "at 540 x 960, and waits for you to approve the style": the two sizes, the style card, waiting, approved
  E.fadeOut(tl, q(".s71-b0"), T(b1), 0.3, -10);
  pop(t540, b1 + 0.12);
  pop(t1080, b1 + 0.32);
  tw(ghost, { borderColor: "rgba(201, 194, 255, 0.38)" }, { borderColor: "rgba(201, 194, 255, 0.72)", duration: 0.4 }, b1 + 0.32);
  sweep(draft, b1 + 0.2, 0.7, "rgba(255, 255, 255, 0.3)");
  E.fadeIn(tl, q(".s71-stl"), T(b1 + 0.45), 0.45, 12);
  const st = q(".s71-style");
  tw(st, { opacity: 0 }, { opacity: 1, duration: 0.3 }, b1 + 0.5);
  tw(st, { y: 26, rotationX: 22, transformPerspective: 900 }, { y: 0, rotationX: 0, transformPerspective: 900, duration: 0.7, ease: E.SPRING }, b1 + 0.5);
  const wait = q(".s71-wait");
  pop(wait, b1 + 0.85, 0.8);
  qa(".s71-wait i").forEach((d, i) => {
    for (let k = 0; k < 2; k++) {
      const t = b1 + 1.0 + k * 0.3 + i * 0.08;
      tw(d, { y: 0 }, { y: -9, duration: 0.11, ease: "power2.out" }, t);
      tw(d, { y: -9 }, { y: 0, duration: 0.13, ease: "power2.in" }, t + 0.11);
    }
  });
  tw(wait, { opacity: 1 }, { opacity: 0, duration: 0.15 }, b1 + 1.62);
  const sok = q(".s71-sok");
  pop(sok, b1 + 1.65, 0.5);
  E.draw(tl, q(".s71-sok path"), T(b1 + 1.7), 0.35);
  E.burst(tl, q(".s71-b1"), sok.offsetLeft + 22, sok.offsetTop + 22, T(b1 + 1.72), { n: 10, seed: 71, r0: 30, r1: 72, color: "#c9c2ff" });
  pop(dok, b1 + 1.75, 0.5);
  E.draw(tl, q(".s71-dok path"), T(b1 + 1.8), 0.3);

  // B2 "every round of fixes stays in the low resolution": draft -> fix -> draft; each fix enlarges the caption,
  // each draft re-renders the same small frame
  E.fadeOut(tl, q(".s71-b1"), T(b2), 0.3, -10);
  tw(dok, { opacity: 1 }, { opacity: 0, duration: 0.25 }, b2 + 0.35);
  const loop = q(".s71-loop"), nd = q(".s71-nd"), nf = q(".s71-nf"), arm = q(".s71-arm");
  tw(loop, { opacity: 0 }, { opacity: 1, duration: 0.3 }, b2 + 0.15);
  pop(nd, b2 + 0.18, 0.8);
  pop(nf, b2 + 0.28, 0.8);
  E.draw(tl, q(".s71-arcr"), T(b2 + 0.25), 0.4);
  E.draw(tl, q(".s71-arcl"), T(b2 + 0.35), 0.4);
  qa(".s71-ah").forEach((a, i) => E.draw(tl, a, T(b2 + 0.62 + i * 0.1), 0.15));
  const dots = qa(".s71-dot");
  dots.forEach((d) => tw(d, { opacity: 0 }, { opacity: 1, duration: 0.15 }, b2 + 0.3));
  const half = (b3 - (b2 + 0.35)) / 4;      // four half-turns: fix, draft, fix, back to the draft as B3 starts
  for (let k = 0; k < 4; k++) tw(arm, { rotation: k * 180 }, { rotation: (k + 1) * 180, duration: half, ease: "none" }, b2 + 0.35 + k * half);
  const cap = q(".s71-cap"), wr = q(".s71-wr");
  [1.16, 1.32].forEach((s, k) => {
    const t = b2 + 0.35 + (2 * k + 1) * half;          // the dot reaches the fix node
    tw(wr, { rotation: 0 }, { rotation: -28, duration: 0.12, ease: "power2.out" }, t - 0.05);
    tw(wr, { rotation: -28 }, { rotation: 0, duration: 0.3, ease: "back.out(2)" }, t + 0.07);
    tw(nf, { borderColor: "rgba(201, 194, 255, 0.6)" }, { borderColor: "rgba(255, 255, 255, 1)", duration: 0.1 }, t - 0.05);
    tw(nf, { borderColor: "rgba(255, 255, 255, 1)" }, { borderColor: "rgba(201, 194, 255, 0.6)", duration: 0.3 }, t + 0.1);
    tw(cap, { scale: k ? 1.16 : 1 }, { scale: s, duration: 0.4, ease: "back.out(2.2)" }, t + 0.05);
    E.burst(tl, scene, 72.5, 216, T(t + 0.08), { n: 8, seed: 710 + k, r0: 14, r1: 34, color: "#ffffff" });
  });
  {
    const t = b2 + 0.35 + 2 * half;                     // back at the draft node: re-render, still 540 x 960
    tw(nd, { borderColor: "rgba(201, 194, 255, 0.6)" }, { borderColor: "rgba(255, 255, 255, 1)", duration: 0.1 }, t - 0.05);
    tw(nd, { borderColor: "rgba(255, 255, 255, 1)" }, { borderColor: "rgba(201, 194, 255, 0.6)", duration: 0.3 }, t + 0.1);
    scanLine(scans[1], t, 0.4);
    tw(t540, { scale: 1 }, { scale: 1.12, duration: 0.15, ease: "power2.out" }, t + 0.1);
    tw(t540, { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "power2.inOut" }, t + 0.25);
  }

  // B3 "and the full version is rendered only when there are no more fixes": the fix node goes out,
  // one exit arrow, and the draft grows into the one full render (the punch-in lands on this pair)
  tw(nf, { opacity: 1 }, { opacity: 0.32, duration: 0.35 }, b3 + 0.05);
  tw(q(".s71-strike"), { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.3, ease: "power2.inOut" }, b3 + 0.08);
  tw(q(".s71-arcs"), { opacity: 1 }, { opacity: 0.28, duration: 0.35 }, b3 + 0.05);
  dots.forEach((d) => tw(d, { opacity: 1 }, { opacity: 0, duration: 0.15 }, b3 + 0.2));
  tw(nd, { borderColor: "rgba(201, 194, 255, 0.6)" }, { borderColor: "rgba(255, 255, 255, 1)", duration: 0.2 }, b3 + 0.1);
  E.draw(tl, q(".s71-exit path"), T(b3 + 0.22), 0.4);
  const xd = q(".s71-xdot");
  tw(xd, { opacity: 0 }, { opacity: 1, duration: 0.1 }, b3 + 0.24);
  tw(xd, { x: 0 }, { x: 100, duration: 0.42, ease: "power2.in" }, b3 + 0.26);
  tw(xd, { opacity: 1 }, { opacity: 0, duration: 0.1 }, b3 + 0.62);
  E.fadeIn(tl, q(".s71-one"), T(b3 + 0.3), 0.45, 12);
  tw(t540, { opacity: 1 }, { opacity: 0, duration: 0.25 }, b3 + 0.55);
  tw(draft, { scale: 1 }, { scale: 2, duration: 0.9, ease: E.SPRING }, b3 + 0.65);
  tw(draft, { boxShadow: "0 0 0 2px rgba(201,194,255,0.7), 0 0 18px rgba(201,194,255,0.35)" }, { boxShadow: "0 0 0 0px rgba(201,194,255,0), 0 0 0px rgba(201,194,255,0)", duration: 0.5 }, b3 + 0.65);
  tw(px, { opacity: 1 }, { opacity: 0, duration: 0.45 }, b3 + 0.8);
  tw(q(".s71-gsolid"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, b3 + 1.2);
  tw(t1080, { scale: 1 }, { scale: 1.14, duration: 0.2, ease: "power2.out" }, b3 + 1.25);
  tw(t1080, { scale: 1.14 }, { scale: 1, duration: 0.35, ease: "power2.inOut" }, b3 + 1.45);
  scanLine(scans[2], b3 + 1.45, 1.0);
  sweep(ghost, b3 + 2.3, 0.8, "rgba(255, 255, 255, 0.22)");

  // payoff: the race. The draft bar finishes; the full-render bar has crawled a tenth of the way
  // (a quarter hour vs a minute and a half). Then the single-frame tag. The bars start once the red accent
  // phrase has faded (the coral bar is then the only red mark); both labels share the lavender dot.
  E.fadeOut(tl, loop, T(pe), 0.3, -10);
  tw(q(".s71-exit"), { opacity: 1 }, { opacity: 0, duration: 0.3 }, pe);
  E.fadeOut(tl, q(".s71-one"), T(pe), 0.3, -10);
  tw(ghost, { opacity: 1 }, { opacity: 0.4, duration: 0.4 }, pe + 0.05);
  const rb1 = q(".s71-rb1"), rb2 = q(".s71-rb2");
  E.fadeIn(tl, q(".s71-rl1"), T(pe + 0.35), 0.45, 12);
  E.fadeIn(tl, rb1, T(pe + 0.42), 0.45, 12);
  E.fadeIn(tl, q(".s71-rl2"), T(pe + 0.5), 0.45, 12);
  E.fadeIn(tl, rb2, T(pe + 0.57), 0.45, 12);
  const r0 = pe + 1.0, dDraft = 0.9, R = c.raceRatio || 10;
  tw(E.q(".s71-rf", rb1), { scaleX: 0 }, { scaleX: 1, duration: dDraft, ease: "none" }, r0);
  tw(E.q(".s71-rf", rb2), { scaleX: 0 }, { scaleX: +((tEnd - r0) / dDraft / R).toFixed(4), duration: tEnd - r0, ease: "none" }, r0);
  const rok = q(".s71-rok");
  pop(rok, r0 + dDraft, 0.5);
  E.draw(tl, q(".s71-rok path"), T(r0 + dDraft + 0.05), 0.3);
  E.burst(tl, q(".s71-race"), rok.offsetLeft + 22, rok.offsetTop + 22, T(r0 + dDraft + 0.03), { n: 10, seed: 17, r0: 24, r1: 46, color: "#c9c2ff" });
  const snap = q(".s71-snap");
  // the tag lands in 0.5 s (settled within 0.4 s) and then stays still; it grows into place, so its bottom
  // (6 px above the canvas edge) never crosses the canvas
  tw(snap, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, pe + 2.0);
  tw(snap, { y: 6, scale: 0.95 }, { y: 0, scale: 1, duration: 0.5, ease: E.SPRING }, pe + 2.0);
  E.sweep(tl, snap, T(pe + 2.6), 0.9, { color: "rgba(201, 194, 255, 0.2)" });
};
