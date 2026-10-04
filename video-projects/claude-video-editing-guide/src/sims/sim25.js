window.SIMS = window.SIMS || {};
window.SIMS.sim25 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim25");
  const popIn = (el, t, dy, d) => {
    tl.fromTo(el, { opacity: 0 }, A({ opacity: 1, duration: 0.22 }), t);
    tl.fromTo(el, { y: dy == null ? 10 : dy, scale: 0.9 }, A({ y: 0, scale: 1, duration: d || 0.55, ease: E.SPRING }), t);
  };
  const fade = (el, t, d, from) => tl.fromTo(el, { opacity: from == null ? 1 : from }, A({ opacity: 0, duration: d || 0.25, ease: "power2.in" }), t);
  // the meter level (loudness in dB -> bar fraction), chained from state to state
  const lvl = q(".s25-lvl"), frac = (L) => 1 + L / 30;
  let curL = null;
  const level = (L, t, d, ease) => {
    const from = curL == null ? 0 : frac(curL);
    tl.fromTo(lvl, { scaleY: from }, A({ scaleY: frac(L), duration: d, ease: ease || E.SPRING }), t);
    curL = L;
  };

  // establishing shot: the meter at the right, the feed at the left
  const t0 = cfg.tStage, phone = q(".s25-phone");
  E.fadeIn(tl, q(".s25-meter"), T(t0 + 0.05), 0.6, 20);
  [".s25-mtitle", ".s25-track"].forEach((s, i) => E.fadeIn(tl, q(s), T(t0 + 0.2 + i * 0.06), 0.5, 10));
  qa(".s25-ticks").forEach((tk) => tl.fromTo(tk, { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(t0 + 0.3)));
  tl.fromTo(phone, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(t0 + 0.1));
  tl.fromTo(phone, { y: 40, rotationX: 12, transformPerspective: 1200 }, A({ y: 0, rotationX: 0, transformPerspective: 1200, duration: 0.85, ease: E.SPRING }), T(t0 + 0.1));

  // B0 "גוללים בפיד, סרטון אחד צועק והבא כמעט לוחש?": the loud video (burnt peaks), a swipe, the quiet one
  const b0 = P[0], burn = q(".s25-burn");
  level(-4, T(b0 + 0.1), 0.45, "power2.out");
  popIn(burn, T(b0 + 0.45), 8);
  // the peaks hit the ceiling: one red line appears there (the "נשרף" tag lands on it) and flickers
  E.qa(".s25-ca .s25-wcap", root).forEach((p) => {
    tl.fromTo(p, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(b0 + 0.3));
    tl.fromTo(p, { opacity: 1 }, A({ opacity: 0.45, duration: 0.12 }), T(b0 + 0.55));
    tl.fromTo(p, { opacity: 0.45 }, A({ opacity: 1, duration: 0.12 }), T(b0 + 0.67));
  });
  E.glitch(tl, q(".s25-ca .s25-cw"), T(b0 + 0.55), 6);
  level(-6, T(b0 + 0.6), 0.25, "power1.inOut");
  level(-3.5, T(b0 + 0.85), 0.2, "power1.inOut");
  // the swipe: a finger dot rises, the feed scrolls to the next video
  const sw = q(".s25-swipe"), feed = q(".s25-feed");
  tl.fromTo(sw, { opacity: 0, y: 40 }, A({ opacity: 0.9, y: 0, duration: 0.15 }), T(b0 + 1.0));
  tl.fromTo(sw, { y: 0 }, A({ y: -220, duration: 0.45, ease: "power2.in" }), T(b0 + 1.15));
  tl.fromTo(sw, { opacity: 0.9 }, A({ opacity: 0, duration: 0.15 }), T(b0 + 1.45));
  tl.fromTo(feed, { y: 0 }, A({ y: -500, duration: 0.55, ease: "power3.inOut" }), T(b0 + 1.2));
  level(-27, T(b0 + 1.45), 0.5, "power2.inOut");
  level(-25.5, T(b0 + 1.95), 0.2, "power1.inOut");
  level(-27, T(b0 + 2.15), 0.2, "power1.inOut");

  // B1 "היעד הוא מינוס 14 LUFS": the target readout (punch-in) and the target line on the meter
  const b1 = P[1], ro = q(".s25-ro"), ring = q(".s25-ring circle");
  tl.fromTo(phone, { opacity: 1, x: 0 }, A({ opacity: 0, x: -40, duration: 0.3, ease: "power2.in" }), T(b1));
  tl.fromTo(ro, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(b1 + 0.2));
  tl.fromTo(ro, { scale: 0.7 }, A({ scale: 1, duration: 0.7, ease: E.SPRING }), T(b1 + 0.2));
  E.draw(tl, ring, T(b1 + 0.3), 0.8);
  tl.fromTo(q(".s25-ro b"), { filter: "blur(10px)" }, A({ filter: "blur(0px)", duration: 0.35, ease: "power2.out" }), T(b1 + 0.2));
  tl.set(q(".s25-ro b"), { filter: "none" }, T(b1 + 0.56));
  E.burst(tl, ro, 200, 160, T(b1 + 0.4), { n: 14, seed: 25, r0: 120, r1: 175, color: "#c9c2ff" });
  const tline = q(".s25-tline"), ttag = q(".s25-ttag");
  tl.fromTo(tline, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.5, ease: "power2.out" }), T(b1 + 0.35));
  popIn(ttag, T(b1 + 0.5), 8);
  level(-14, T(b1 + 0.4), 0.9);

  // B2 "היחידה שמודדת כמה חזק משהו נשמע לאוזן": the readout steps up, sound reaches an ear, the unit glows
  const b2 = P[2], earw = q(".s25-earw");
  // the readout steps up (to 70%: "LUFS" stays readable) and the ear comes in under it
  tl.fromTo(ro, { y: 0, scale: 1 }, A({ y: -170, scale: 0.7, duration: 0.65, ease: E.SPRING }), T(b2));
  tl.fromTo(earw, { opacity: 0, x: 24 }, A({ opacity: 1, x: 0, duration: 0.55, ease: E.SPRING }), T(b2 + 0.2));
  E.qa(".s25-ear path", earw).forEach((p, i) => E.draw(tl, p, T(b2 + 0.25 + i * 0.12), 0.6));
  const arcs = qa(".s25-arc");
  [0, 0.55].forEach((w) => arcs.forEach((a, i) => {
    const t = T(b2 + 0.55 + w + i * 0.12);
    tl.fromTo(a, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), t);
    tl.fromTo(a, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), t + 0.2);
  }));
  const mt = q(".s25-mtitle");
  tl.fromTo(mt, { textShadow: "0 0 0px rgba(201, 194, 255, 0)", color: "#ece9f7" }, A({ textShadow: "0 0 18px rgba(201, 194, 255, 1)", color: "#ffffff", duration: 0.35 }), T(b2 + 0.7));
  tl.fromTo(mt, { textShadow: "0 0 18px rgba(201, 194, 255, 1)", color: "#ffffff" }, A({ textShadow: "0 0 0px rgba(201, 194, 255, 0)", color: "#ece9f7", duration: 0.6 }), T(b2 + 1.6));

  // B3 "קלוד מודד, מכוון ומודד שוב": pass 1 measures, pass 2 (linear) levels it, a second measurement confirms
  const b3 = P[3], gp = q(".s25-gp"), p1 = q(".s25-p1"), p2 = q(".s25-p2"), scan = q(".s25-gs1"), scan2 = q(".s25-gs2");
  fade(ro, T(b3 - 0.3), 0.25);
  fade(earw, T(b3 - 0.3), 0.25);
  tl.fromTo(gp, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 0.05));
  popIn(p1, T(b3 + 0.12), 8, 0.45);
  qa(".s25-gl").forEach((l, i) => tl.fromTo(l, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.45, ease: "power2.out" }), T(b3 + 0.15 + i * 0.05)));
  // pass 1 finds the spikes over the ceiling: the ceiling is the beat's one red line, with the "נשרף" tag on it
  const gcr = q(".s25-gcr"), gbw = q(".s25-gbw");
  tl.fromTo(gcr, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.45, ease: "power2.out" }), T(b3 + 0.2));
  popIn(gbw, T(b3 + 0.5), 8, 0.45);
  const cline = q(".s25-cline"), ctag = q(".s25-ctag");
  tl.fromTo(cline, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.45, ease: "power2.out" }), T(b3 + 0.2));
  popIn(ctag, T(b3 + 0.3), 6, 0.45);
  const sx = scan.offsetLeft, span = sx - 6, dS = 0.5;
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.08 }), T(b3 + 0.25));
  tl.fromTo(scan, { x: 0 }, A({ x: -span, duration: dS, ease: "none" }), T(b3 + 0.25));
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.08 }), T(b3 + 0.25 + dS - 0.06));
  level(-19, T(b3 + 0.3), 0.45, "power2.inOut");
  // pass 2: one linear gain; the spikes were limited first, so nothing crosses the ceiling
  tl.fromTo(p1, { opacity: 1 }, A({ opacity: 0, duration: 0.12 }), T(b3 + 0.82));
  popIn(p2, T(b3 + 0.85), 8, 0.45);
  qa(".s25-gb").forEach((bar) => {
    const b = +bar.dataset.b, a = +bar.dataset.a;
    tl.fromTo(bar, { scaleY: 1 }, A({ scaleY: a / b, duration: 0.6, ease: E.SPRING }), T(b3 + 0.9));
  });
  // nothing crosses the ceiling any more: the red line and its tag step back to the dashed ceiling
  fade(gcr, T(b3 + 1.15), 0.3);
  fade(gbw, T(b3 + 1.1), 0.25);
  level(-14, T(b3 + 0.95), 0.55);
  // measure again
  tl.fromTo(scan2, { opacity: 0 }, A({ opacity: 1, duration: 0.06 }), T(b3 + 1.4));
  tl.fromTo(scan2, { x: 0 }, A({ x: -span, duration: 0.24, ease: "none" }), T(b3 + 1.4));
  tl.fromTo(scan2, { opacity: 1 }, A({ opacity: 0, duration: 0.06 }), T(b3 + 1.6));
  const ok = q(".s25-ok");
  tl.fromTo(ok, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }), T(b3 + 1.5));
  E.draw(tl, q(".s25-ok path"), T(b3 + 1.55), 0.3);
  fade(p2, T(P[4] - 0.05), 0.2);

  // B4 "ובדרך מנקה את הבס מהאפקטים הקוליים": a highpass at 200Hz takes the bass out of the effects
  const b4 = P[4], sp = q(".s25-sp");
  E.dim(tl, gp, T(b4 + 0.02), 0.4, 1, 0.35);
  tl.fromTo(sp, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b4 + 0.05));
  const sbs = qa(".s25-sb");
  sbs.forEach((b, i) => tl.fromTo(b, { scaleY: 0 }, A({ scaleY: 1, duration: 0.45, ease: E.SPRING }), T(b4 + 0.1 + i * 0.015)));
  E.draw(tl, q(".s25-hp path"), T(b4 + 0.55), 0.55);
  tl.fromTo(q(".s25-cut"), { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.35, ease: "power2.out" }), T(b4 + 0.7));
  popIn(q(".s25-hpt"), T(b4 + 0.75), 8);
  qa(".s25-low").forEach((b, i) => tl.fromTo(b, { scaleY: 1 }, A({ scaleY: 0.06, duration: 0.5, ease: "power2.inOut" }), T(b4 + 0.85 + i * 0.03)));
  E.burst(tl, sp, q(".s25-cut").offsetLeft, 600, T(b4 + 0.9), { n: 10, seed: 26, r0: 24, r1: 62, color: "#c9c2ff" });
  popIn(q(".s25-nb"), T(b4 + 1.05), 8);

  // payoff: three channels at the target; a playhead runs through the mix, the meter holds -14
  fade(gp, T(pe + 0.05), 0.3, 0.4);
  fade(sp, T(pe + 0.05), 0.3);
  const lanes = q(".s25-lanes");
  tl.fromTo(lanes, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(pe + 0.35));
  qa(".s25-lane").forEach((ln, i) => {
    const t = T(pe + 0.4 + i * 0.18);
    popIn(E.q(".s25-lh", ln), t, 8);
    tl.fromTo(E.q(".s25-lwv", ln), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.7, ease: "power2.inOut" }), t + 0.05);
  });
  popIn(q(".s25-duck"), T(pe + 1.25), 6);
  const ph = q(".s25-ph"), dP = 1.6, tP = T(pe + 1.55);
  tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), tP);
  tl.fromTo(ph, { x: 0 }, A({ x: -562, duration: dP, ease: "none" }), tP);
  tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), tP + dP - 0.1);
  level(-13.2, tP + 0.1, 0.35, "power1.inOut");
  level(-14.6, tP + 0.5, 0.4, "power1.inOut");
  level(-13.6, tP + 0.95, 0.35, "power1.inOut");
  level(-14, tP + 1.35, 0.4, "power1.inOut");
  tl.fromTo(ok, { scale: 1 }, A({ scale: 1.25, duration: 0.2, ease: "power2.out" }), tP + dP + 0.05);
  tl.fromTo(ok, { scale: 1.25 }, A({ scale: 1, duration: 0.4, ease: "power2.inOut" }), tP + dP + 0.25);
  E.sweep(tl, q(".s25-meter"), tP + dP + 0.1, 0.8, { color: "rgba(201, 194, 255, 0.22)" });
};
