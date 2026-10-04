window.SIMS = window.SIMS || {};
window.SIMS.sim32 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(".sim32 " + s, sc), qa = (s) => E.qa(".sim32 " + s, sc);
  const mover = q(".s32-mover"), root = mover.parentNode, plane = q(".s32-plane"), fol = q(".s32-fol");
  const lgw = q(".s32-lgw"), lg3 = q(".s32-lg3"), lp = q(".s32-lp"), light = q(".s32-light");
  const ghs = [q(".s32-gh1"), q(".s32-gh2")];
  const LAG = 0.2;                            // drawn a little longer than 0.1 s so the lag reads on screen
  const C50 = { transformOrigin: "50% 50%" };

  // establishing: the hand, drawn in thin glowing lines
  E.draw(tl, q(".s32-ol"), T(cfg.tStage + 0.1), 0.95, "power2.inOut");
  tl.fromTo(q(".s32-fill"), { opacity: 0 }, A({ opacity: 1, duration: 0.5 }), T(cfg.tStage + 0.6));

  // B0 "בכל פריים קלוד יודע איפה היד שלכם": the 21 tracking points and their bones; a strip of frames, each one tracked
  const b0 = P[0];
  qa(".s32-lm").forEach((d, i) => tl.fromTo(d, Object.assign({ opacity: 0, scale: 0.2 }, C50), A({ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }), T(b0 + 0.05 + i * 0.03)));
  E.draw(tl, q(".s32-bn"), T(b0 + 0.2), 0.85, "power1.inOut");
  tl.fromTo(q(".s32-plab"), { opacity: 0, y: -10 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b0 + 0.8));
  qa(".s32-th").forEach((th, i) => tl.fromTo(th, { opacity: 0, x: -20 }, A({ opacity: 1, x: 0, duration: 0.45, ease: E.SPRING }), T(b0 + 0.1 + i * 0.08)));
  const fsel = q(".s32-fsel"), steps = [[0, 0], [6, -4], [12, -8], [7, -3]];
  tl.fromTo(fsel, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b0 + 0.6));
  for (let k = 1; k < 4; k++) {
    const t = T(b0 + 0.6 + k * 0.38);
    tl.fromTo(fsel, { y: (k - 1) * 134 }, A({ y: k * 134, duration: 0.25, ease: "power2.inOut" }), t);
    tl.fromTo(mover, { x: steps[k - 1][0], y: steps[k - 1][1] }, A({ x: steps[k][0], y: steps[k][1], duration: 0.25, ease: "power2.inOut" }), t);
  }
  tl.fromTo(mover, { x: 7, y: -3 }, A({ x: 0, y: 0, duration: 0.3, ease: "power2.inOut" }), T(b0 + 2.02));

  // B1 "מעליה הוא מעמיד לוגו בתלת ממד": the hand lies back, palm up; the palm centre (points 0, 5, 9, 13, 17) and the
  // midpoint of 2 and 5 give the hover point, just over the fingers; the logo's place turns there in 3D
  const b1 = P[1], ghost = q(".s32-ghost"), hov = q(".s32-hov"), hlab = q(".s32-hlab"), hl = q(".s32-hl");
  tl.fromTo(q(".s32-frames"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b1));
  tl.fromTo(q(".s32-plab"), { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1));
  tl.fromTo(plane, { rotationX: 0 }, A({ rotationX: 50, duration: 0.95, ease: E.SPRING }), T(b1 + 0.05));
  qa(".s32-pp").forEach((d, i) => {
    tl.fromTo(d, Object.assign({ scale: 1 }, C50), A({ scale: 1.7, duration: 0.25, ease: "power2.out" }), T(b1 + 0.75 + i * 0.04));
    tl.fromTo(d, Object.assign({ scale: 1.7 }, C50), A({ scale: 1, duration: 0.3, ease: "power2.in" }), T(b1 + 1.05 + i * 0.04));
  });
  tl.fromTo(q(".s32-sp"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 0.8));
  tl.fromTo(q(".s32-m25"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 0.9));
  tl.fromTo(q(".s32-pcm"), Object.assign({ opacity: 0, scale: 0.4 }, C50), A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), T(b1 + 1.0));
  E.draw(tl, q(".s32-hl path"), T(b1 + 1.2), 0.35);
  tl.fromTo(hov, { opacity: 0, scale: 0.4 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b1 + 1.45));
  tl.fromTo(hlab, { opacity: 0, x: 12 }, A({ opacity: 1, x: 0, duration: 0.45, ease: E.SPRING }), T(b1 + 1.5));
  tl.fromTo(ghost, { opacity: 0, scale: 0.6 }, A({ opacity: 0.9, scale: 1, duration: 0.45, ease: E.SPRING }), T(b1 + 1.5));
  tl.fromTo(ghost, { rotationY: -50, transformPerspective: 600 }, A({ rotationY: 50, duration: 1.75, ease: "sine.inOut" }), T(b1 + 1.5));

  // B2 "שנכנס על המילה שבחרתם ומאיר את כף היד בצבע של הלוגו": a playhead reaches the chosen word; a point of light
  // ignites at the hover point and the logo grows from it with one turn; its light falls on the palm and the fingers
  const b2 = P[2], ws = q(".s32-wstrip"), wph = q(".s32-wph"), cw = q(".s32-cw"), wlab = q(".s32-wlab");
  [q(".s32-sp"), q(".s32-m25"), q(".s32-pcm")].forEach((el) => tl.fromTo(el, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2)));
  tl.fromTo(ws, { opacity: 0, y: -12 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b2 + 0.05));
  tl.fromTo(wlab, { opacity: 0, y: -8 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), T(b2 + 0.3));
  tl.fromTo(cw, { borderColor: "rgba(201, 194, 255, 0.55)" }, A({ borderColor: "#ffffff", duration: 0.3 }), T(b2 + 0.3));
  const wsW = ws.offsetWidth, cwC = cw.offsetLeft + cw.offsetWidth / 2;
  const x1 = cwC - (wsW - 1.5), x2 = -(wsW - 4);
  tl.fromTo(wph, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b2 + 0.45));
  tl.fromTo(wph, { x: 0 }, A({ x: x1, duration: 0.6, ease: "none" }), T(b2 + 0.45));
  tl.fromTo(wph, { x: x1 }, A({ x: x2, duration: 0.9, ease: "none" }), T(b2 + 1.05));
  tl.fromTo(wph, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b2 + 1.8));
  const whl = E.q(".hl", cw);
  tl.fromTo(whl, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(b2 + 1.05));
  tl.fromTo(whl, { opacity: 1 }, A({ opacity: 0.35, duration: 0.6 }), T(b2 + 1.3));
  E.draw(tl, q(".s32-wlink path"), T(b2 + 1.05), 0.3, "power2.in");
  const tg = b2 + 1.3;
  tl.fromTo(lp, { opacity: 0, scale: 0.2 }, A({ opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }), T(tg));
  [ghost, hov, hlab, hl].forEach((el) => tl.fromTo(el, { opacity: el === ghost ? 0.9 : 1 }, A({ opacity: 0, duration: 0.3 }), T(tg)));
  tl.fromTo(lgw, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(tg + 0.12));
  tl.fromTo(lg3, { scale: 0.05, rotationY: -360 }, A({ scale: 1, rotationY: 0, duration: 0.9, ease: E.SPRING }), T(tg + 0.12));
  tl.fromTo(lp, { opacity: 1 }, A({ opacity: 0, duration: 0.35 }), T(tg + 0.5));
  tl.fromTo(light, { opacity: 0 }, A({ opacity: 1, duration: 0.6 }), T(tg + 0.45));
  tl.fromTo(q(".s32-beam"), { opacity: 0 }, A({ opacity: 1, duration: 0.6 }), T(tg + 0.5));
  tl.fromTo(q(".s32-lglow"), { opacity: 0 }, A({ opacity: 1, duration: 0.5 }), T(tg + 0.4));
  tl.fromTo(q(".s32-wlink"), { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), T(tg + 0.9));
  E.burst(tl, root, E.center(lp, root).x, E.center(lp, root).y, T(tg + 0.05), { n: 10, seed: 32, r0: 16, r1: 60, color: "#ffb3a3" });
  // from here on it turns slowly (its edge shows the depth), until it leaves
  const tx = pe + 2.6;
  let ta = tg + 1.02, a0 = 0;
  const swing = [26, -22, 20, -18, 14], seg = (tx - ta) / swing.length;
  swing.forEach((a1) => { tl.fromTo(lg3, { rotationY: a0 }, A({ rotationY: a1, duration: seg - 0.02, ease: "sine.inOut" }), T(ta)); a0 = a1; ta += seg; });

  // the hand moves; the logo layer follows LAG later, with a light trail; the palm light dims while the logo lags
  const move = (x0, y0, x1m, y1m, t, d) => {
    tl.fromTo(mover, { x: x0, y: y0 }, A({ x: x1m, y: y1m, duration: d, ease: "sine.inOut" }), T(t));
    tl.fromTo(fol, { x: x0, y: y0 }, A({ x: x1m, y: y1m, duration: d, ease: "sine.inOut" }), T(t + LAG));
    ghs.forEach((g, j) => tl.fromTo(g, { x: x0, y: y0 }, A({ x: x1m, y: y1m, duration: d, ease: "sine.inOut" }), T(t + LAG + (j + 1) * 0.08)));
  };
  // the palm light weakens while the logo lags behind the hand
  const dim = (t0, t1) => {
    tl.fromTo(light, { opacity: 1 }, A({ opacity: 0.5, duration: LAG + 0.15, ease: "power1.out" }), T(t0));
    if (t1 != null) tl.fromTo(light, { opacity: 0.5 }, A({ opacity: 1, duration: 0.35, ease: "power1.inOut" }), T(t1));
  };
  const trail = (t0, t1) => ghs.forEach((g, j) => {
    tl.fromTo(g, { opacity: 0 }, A({ opacity: j ? 0.22 : 0.4, duration: 0.15 }), T(t0));
    tl.fromTo(g, { opacity: j ? 0.22 : 0.4 }, A({ opacity: 0, duration: 0.25 }), T(t1));
  });

  // B3 "הלוגו עוקב אחרי היד באיחור של עשירית שנייה": the hand moves, the logo follows a little late; the two paths
  const b3 = P[3], gr = q(".s32-graph");
  tl.fromTo([ws, wlab], { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b3));
  tl.fromTo(gr, { opacity: 0, x: -16 }, A({ opacity: 1, x: 0, duration: 0.5, ease: E.SPRING }), T(b3 + 0.05));
  E.draw(tl, q(".s32-gsv .gh"), T(b3 + 0.3), 0.7);
  tl.fromTo(q(".s32-gsv .gl"), { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(b3 + 0.7));
  E.draw(tl, q(".s32-gsv .br"), T(b3 + 1.0), 0.3);
  tl.fromTo(q(".s32-lag"), { opacity: 0, y: 8 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), T(b3 + 1.05));
  const m0 = b3 + 0.25;
  trail(m0 + LAG, m0 + 1.75 + LAG);
  dim(m0, m0 + 1.75 + LAG);
  move(0, 0, 90, -36, m0, 0.75);
  move(90, -36, 0, 0, m0 + 1.0, 0.75);

  // B4 "כמו משהו שמרחף מעליה": it floats: a slow bob; its glow breathes on the palm (punch-in on the logo)
  const b4 = P[4], glow = q(".s32-lglow");
  tl.fromTo(gr, { opacity: 1 }, A({ opacity: 0.35, duration: 0.35 }), T(b4));
  tl.fromTo(lgw, { y: 0 }, A({ y: -12, duration: 0.75, ease: "sine.inOut" }), T(b4 + 0.12));
  tl.fromTo(lgw, { y: -12 }, A({ y: 0, duration: 0.72, ease: "sine.inOut" }), T(b4 + 0.88));
  tl.fromTo(glow, { scale: 1 }, A({ scale: 1.14, duration: 0.75, ease: "sine.inOut" }), T(b4 + 0.12));
  tl.fromTo(glow, { scale: 1.14 }, A({ scale: 1, duration: 0.72, ease: "sine.inOut" }), T(b4 + 0.88));
  tl.fromTo(light, { opacity: 1 }, A({ opacity: 0.78, duration: 0.75, ease: "sine.inOut" }), T(b4 + 0.12));
  tl.fromTo(light, { opacity: 0.78 }, A({ opacity: 1, duration: 0.72, ease: "sine.inOut" }), T(b4 + 0.88));

  // payoff: a big move (the lag, the trail, the light following), then the exit: back into a point of light
  tl.fromTo(gr, { opacity: 0.35 }, A({ opacity: 0, duration: 0.3 }), T(pe));
  trail(pe + 0.1 + LAG, pe + 2.35 + LAG);
  dim(pe + 0.1, null);
  move(0, 0, -170, -20, pe + 0.1, 0.8);
  move(-170, -20, 60, -50, pe + 0.95, 0.8);
  move(60, -50, 0, 0, pe + 1.8, 0.55);
  tl.fromTo(lg3, { scale: 1 }, A({ scale: 0.05, duration: 0.4, ease: "power2.in" }), T(tx));
  tl.fromTo(lgw, { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), T(tx + 0.4));
  tl.fromTo(lp, { opacity: 0, scale: 0.4 }, A({ opacity: 1, scale: 1.3, duration: 0.3, ease: "power2.out" }), T(tx + 0.3));
  tl.fromTo(lp, { scale: 1.3 }, A({ scale: 1, duration: 0.45, ease: "sine.inOut" }), T(tx + 0.6));
  tl.fromTo(q(".s32-beam"), { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), T(tx + 0.1));
  tl.fromTo(light, { opacity: 0.5 }, A({ opacity: 0.22, duration: 0.5 }), T(tx + 0.2));
  tl.fromTo(glow, { opacity: 1 }, A({ opacity: 0.45, duration: 0.5 }), T(tx + 0.2));
  E.burst(tl, root, E.center(lp, root).x, E.center(lp, root).y, T(tx + 0.35), { n: 12, seed: 23, r0: 20, r1: 70, color: "#ffb3a3" });
};
