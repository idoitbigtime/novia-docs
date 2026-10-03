window.SIMS = window.SIMS || {};
window.SIMS.sim22 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim22;
  const T = (x) => S + cfg.tStage + x;   // sim times are relative to the stage entrance
  const rows = E.qa(".s22-fix", sc), caps = E.qa(".s22-cap", sc);
  // transcription fixes: list row and the same word inside the phone, resolved together
  rows.forEach((row, i) => {
    const t = T(c.fix0 + i * c.fixStep);
    const bad = E.q(".s22-bad", row), st = E.q(".s22-strike", row);
    const ar = E.q(".s22-arrow", row), good = E.q(".s22-good", row);
    tl.fromTo(bad, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), t);
    tl.fromTo(st, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.35, ease: "power2.inOut" }), t + 0.3);
    // a resolved row goes quiet: the struck word turns grey, its strike stays at 60%
    tl.fromTo(bad, { color: "#ff6b61" }, A({ color: "#5e5870", duration: 0.35 }), t + 0.62);
    tl.fromTo(st, { opacity: 1 }, A({ opacity: 0.6, duration: 0.35 }), t + 0.62);
    tl.fromTo(ar, { opacity: 0, x: 12 }, A({ opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }), t + 0.48);
    tl.fromTo(good, { opacity: 0 }, A({ opacity: 1, duration: 0.22 }), t + 0.62);
    tl.fromTo(good, { scale: 0.82 }, A({ scale: 1, duration: 0.55, ease: "back.out(2)" }), t + 0.62);
    tl.fromTo(good, { filter: "blur(8px)" }, A({ filter: "blur(0px)", duration: 0.3, ease: "power2.out" }), t + 0.62);
    tl.set(good, { filter: "none" }, t + 0.93);
    // the phone caption shows the same word: wrong (red, struck) -> corrected (white)
    const cap = caps[i];
    const cb = E.q(".s22-capbad", cap), cs = E.q(".s22-capstrike", cap), cg = E.q(".s22-capgood", cap);
    tl.set(cap, { opacity: 1 }, t);
    tl.fromTo(cs, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.35, ease: "power2.inOut" }), t + 0.3);
    // swap in sequence: the wrong word leaves first, then the correction springs in (no overlap)
    tl.fromTo(cb, { opacity: 1 }, A({ opacity: 0, duration: 0.12, ease: "power1.in" }), t + 0.6);
    tl.fromTo(cb, { filter: "blur(0px)" }, A({ filter: "blur(6px)", duration: 0.12 }), t + 0.6);
    tl.fromTo(cg, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t + 0.73);
    tl.fromTo(cg, { scale: 0.94 }, A({ scale: 1, duration: 0.3, ease: E.SPRING }), t + 0.73);
    const tEnd = i < rows.length - 1 ? T(c.fix0 + (i + 1) * c.fixStep) : T(c.pills0 - 0.35);
    tl.set(cap, { opacity: 0 }, tEnd);
  });
  // style 1: white pill in the centre of the screen, switching in one frame (no gap, no overlap)
  E.dim(tl, E.q(".s22-fixes", sc), T(c.pills0 - 0.35), 0.3);
  E.fadeIn(tl, E.q(".s22-l1", sc), T(c.pills0 - 0.3), 0.5, 16);
  let tp = c.pills0;
  c.pills.forEach((p, i) => { E.pill(tl, E.q("#t22-p" + (i + 1), sc), T(tp), T(tp + c.pillStep)); tp += c.pillStep; });
  // style 2: kinetic words in a band below the face
  E.dim(tl, E.q(".s22-l1", sc), T(c.kin0 - 0.3), 0.35);
  E.fadeIn(tl, E.q(".s22-l2", sc), T(c.kin0 - 0.25), 0.5, 16);
  E.kin(tl, E.q(".s22-kinrow", sc), S, { dy: 14 });
};
