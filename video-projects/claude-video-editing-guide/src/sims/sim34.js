window.SIMS = window.SIMS || {};
window.SIMS.sim34 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim34, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const cam = q(".s34-cam"), yaw = q(".s34-yaw");
  const TX = +cam.dataset.tx, TY = +cam.dataset.ty, ZB = +cam.dataset.zb, YAW = +cam.dataset.yaw, PITCH = +cam.dataset.pitch;
  const pls = [q(".s34-room"), q(".s34-wall"), q(".s34-me"), q(".s34-fx")];
  const FW = 640, FH = 360, FL = 400 - FW / 2, FT = 322 - FH / 2;   // the frame box in the canvas
  const Z = c.depth.map((d) => d * FW);      // depth of each layer while apart (px)
  const edges = pls.map((p) => E.q(".s34-edge", p));
  // light sweep across a plate, right to left (local helper: the band starts and ends outside the plate)
  const sweep = (band, t, d) => tl.fromTo(band, { x: 0 }, A({ x: -(640 + 72 + 170 + 70), duration: d, ease: "power2.inOut" }), T(t));
  const rails = qa(".s34-rail"), zFront = Z[3];

  // B0 (establishing): the frame settles in; the wall text and the floating effects arrive
  const tin = cfg.tStage;
  tl.fromTo(q(".s34-in"), { scale: 0.95 }, A({ scale: 1, duration: 0.9, ease: E.SPRING }), T(tin));
  qa(".s34-wt span").forEach((w, i) => {
    tl.fromTo(w, { opacity: 0 }, A({ opacity: 1, duration: 0.26, ease: "power2.out" }), T(tin + 0.2 + i * 0.16));
    tl.fromTo(w, { y: 26 }, A({ y: 0, duration: 0.6, ease: E.SPRING }), T(tin + 0.2 + i * 0.16));
  });
  [q(".s34-gem"), q(".s34-orb")].forEach((el, i) => {
    tl.fromTo(el, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }), T(tin + 0.3 + i * 0.12));
  });
  qa(".s34-sp").forEach((el, i) => tl.fromTo(el, { opacity: 0, scale: 0.3 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(tin + 0.4 + i * 0.05)));
  // the effects float gently for the whole scene (they are meant to float)
  const gem = q(".s34-gem"), orb = q(".s34-orb");
  const fl = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (i % 2 ? [-7, 0] : [0, -7]));
  fl.forEach(([a, b], i) => {
    tl.fromTo(gem, { y: a }, A({ y: b, duration: 1.6, ease: "sine.inOut" }), T(tin + 0.9 + i * 1.6));
    tl.fromTo(orb, { rotation: i * 8 }, A({ rotation: (i + 1) * 8, duration: 1.6, ease: "none" }), T(tin + 0.9 + i * 1.6));
  });

  // B1 "על המילה שבחרתם הפריים נפרד לשכבות בעומק": the chosen word, a light line around the frame, the layers come apart
  const b1 = P[0], chip0 = q(".s34-chip0");
  tl.fromTo(chip0, { opacity: 0, y: 12, scale: 0.86 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }), T(b1 + 0.05));
  // the word is hit: a lilac pulse and the chip's rim lights up (the word itself stays white: red is kept for the accent)
  tl.fromTo(chip0, { borderColor: "rgba(201, 194, 255, 0.32)" }, A({ borderColor: "#c9c2ff", duration: 0.15 }), T(b1 + 0.35));
  tl.fromTo(E.q(".s34-pulse", chip0), { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 1.35, duration: 0.7, ease: "power2.out" }), T(b1 + 0.35));
  const ring = q(".s34-ring path");
  E.draw(tl, ring, T(b1 + 0.38), 0.55);
  const tSplit = b1 + 0.98;
  pls.forEach((p, i) => {
    if (!Z[i]) return;
    tl.fromTo(p, { z: 0 }, A({ z: Z[i], duration: 1.1, ease: E.SPRING }), T(tSplit + [0, 0.06, 0, 0.11][i]));
  });
  edges.forEach((e, i) => tl.fromTo(e, { opacity: 0 }, A({ opacity: 1, duration: 0.4, ease: "power2.out" }), T(tSplit + 0.05 + i * 0.04)));
  rails.forEach((r) => {
    tl.fromTo(r, { z: 0, rotationY: 90, scaleX: 0 }, A({ z: zFront, rotationY: 90, scaleX: 1, duration: 1.1, ease: E.SPRING }), T(tSplit));
    tl.fromTo(r, { opacity: 0 }, A({ opacity: 0.75, duration: 0.4 }), T(tSplit + 0.1));
  });
  tl.fromTo(q(".s34-ring"), { opacity: 1 }, A({ opacity: 0, duration: 0.35 }), T(tSplit + 0.12));
  tl.fromTo(chip0, { opacity: 1, y: 0 }, A({ opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }), T(P[1] - 0.35));

  // B2 "החדר הריק, הטקסט שעל הקיר, אתם בלי הרקע והאפקטים שלפניכם": the layers, back to front
  const b2 = P[1], DIM = 0.18, hs = [0, 1, 2, 3].map((k) => b2 + 0.15 + k * 0.6), hEnd = b2 + 0.15 + 4 * 0.6;
  const op = (el, a, b, t) => tl.fromTo(el, { opacity: a }, A({ opacity: b, duration: 0.25, ease: "power2.inOut" }), T(t));
  pls.forEach((p, i) => {
    if (i !== 0) op(p, 1, DIM, hs[0]);
    if (i > 0) op(p, DIM, 1, hs[i]);
    if (i < 3) { op(p, 1, DIM, hs[i + 1]); op(p, DIM, 1, hEnd); }
    sweep(E.q(".s34-sw b", p), hs[i] + 0.05, 0.6);
  });
  // "you without the background": the cut-out outline is traced around the person
  const cut = q(".s34-cut path");
  E.draw(tl, cut, T(hs[2] + 0.05), 0.5, "power2.inOut");
  tl.fromTo(q(".s34-cut"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(hEnd));

  // B3 "המצלמה מסתובבת, כל שכבה מקבלת שם בעברית": the camera turns ~40 deg to the side, 9 from above, and pulls back
  const b3 = P[2], tTurn = b3 + 0.05, dTurn = 1.1;
  tl.fromTo(cam, { x: 0, y: 0, z: 0, rotationX: 0 }, A({ x: TX, y: TY, z: -ZB, rotationX: PITCH, duration: dTurn, ease: E.SPRING }), T(tTurn));
  tl.fromTo(yaw, { rotationY: 0 }, A({ rotationY: YAW, duration: dTurn, ease: E.SPRING }), T(tTurn));
  // the top-down map: the camera moves 40 deg around the layers; the counter rolls to 40
  const mm = q(".s34-mm");
  tl.fromTo(mm, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b3));
  tl.fromTo(q(".s34-mmarm"), { rotation: 0 }, A({ rotation: -c.yaw, duration: dTurn, ease: E.SPRING }), T(tTurn));
  E.draw(tl, q(".s34-mmarc"), T(tTurn), dTurn * 0.75, E.SPRING);
  // rolling counter: the units follow the camera's eased angle; the tens roll only while the units pass 9 -> 0
  const units = q(".s34-units .s34-strip"), tens = q(".s34-tens .s34-strip");
  tl.fromTo(units, { y: 0 }, A({ y: -36 * c.yaw, duration: dTurn, ease: E.SPRING }), T(tTurn));
  const inv = (v) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (E.SPRING(m) < v) lo = m; else hi = m; } return hi; };
  for (let k = 1; k <= c.yaw / 10; k++) {
    const p0 = inv((10 * k - 1) / c.yaw), p1 = inv((10 * k) / c.yaw);
    tl.fromTo(tens, { y: -36 * (k - 1) }, A({ y: -36 * k, duration: Math.max(0.06, (p1 - p0) * dTurn), ease: "none" }), T(tTurn + p0 * dTurn));
  }
  // names, back to front: dot on the corner, the line grows, the name lands
  qa(".s34-lab").forEach((lab, k) => {
    const t = T(b3 + 0.7 + k * 0.2);
    const dot = E.q(".s34-dot", lab), ln = E.q(".s34-ln", lab), nm = E.q(".s34-name", lab);
    tl.fromTo(dot, { opacity: 0, scale: 0.3 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.2)" }), t);
    tl.fromTo(ln, { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.3, ease: "power2.out" }), t + 0.1);
    tl.fromTo(nm, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), t + 0.3);
    tl.fromTo(nm, { y: (k < 2 ? 12 : -12) }, A({ y: 0, duration: 0.5, ease: E.SPRING }), t + 0.3);
  });

  // B4 "ועל מילת האיחוד הכל נוחת בחזרה בדיוק בתמונה המקורית": the merge word; everything returns on one spring
  const b4 = P[3], chip1 = q(".s34-chip1");
  qa(".s34-lab").forEach((lab) => {
    ["s34-dot", "s34-ln", "s34-name"].forEach((cl) => tl.fromTo(E.q("." + cl, lab), { opacity: 1 }, A({ opacity: 0, duration: 0.22, ease: "power2.in" }), T(b4 + 0.2)));
  });
  tl.fromTo(mm, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(b4 + 0.2));
  tl.fromTo(chip1, { opacity: 0, y: 12, scale: 0.86 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }), T(b4 + 0.4));
  tl.fromTo(chip1, { borderColor: "rgba(201, 194, 255, 0.32)" }, A({ borderColor: "#c9c2ff", duration: 0.15 }), T(b4 + 0.56));
  tl.fromTo(E.q(".s34-pulse", chip1), { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 1.35, duration: 0.7, ease: "power2.out" }), T(b4 + 0.56));
  const tM = b4 + 0.58, dM = 1.2;
  tl.fromTo(cam, { x: TX, y: TY, z: -ZB, rotationX: PITCH }, A({ x: 0, y: 0, z: 0, rotationX: 0, duration: dM, ease: E.SPRING }), T(tM));
  tl.fromTo(yaw, { rotationY: YAW }, A({ rotationY: 0, duration: dM, ease: E.SPRING }), T(tM));
  pls.forEach((p, i) => { if (Z[i]) tl.fromTo(p, { z: Z[i] }, A({ z: 0, duration: dM, ease: E.SPRING }), T(tM)); });
  rails.forEach((r) => {
    tl.fromTo(r, { z: zFront, rotationY: 90, scaleX: 1 }, A({ z: 0, rotationY: 90, scaleX: 0, duration: dM, ease: E.SPRING }), T(tM));
    tl.fromTo(r, { opacity: 0.75 }, A({ opacity: 0, duration: 0.4 }), T(tM + 0.55));
  });
  // in the last third the frames of light let go: the original picture is back
  edges.forEach((e) => tl.fromTo(e, { opacity: 1 }, A({ opacity: 0, duration: 0.4, ease: "power2.inOut" }), T(tM + dM * 0.62)));
  sweep(E.qa(".s34-sw b", pls[0])[1], tM + dM * 0.7, 0.7);
  // it lands exactly: the corner marks lock onto the frame
  const regs = qa(".s34-reg"), out = [[16, -16], [-16, -16], [-16, 16], [16, 16]];
  regs.forEach((g, i) => {
    tl.fromTo(g, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(tM + dM * 0.72));
    tl.fromTo(g, { x: out[i][0], y: out[i][1] }, A({ x: 0, y: 0, duration: 0.45, ease: E.SPRING }), T(tM + dM * 0.72));
  });

  // payoff: the landed frame is checked against the original picture: no difference at all
  tl.fromTo(chip1, { opacity: 1, y: 0 }, A({ opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }), T(pe + 0.05));
  // (after the punch-in has come back) a scan compares it with the original, right to left
  const scan = q(".s34-scan"), tS = pe + 0.7;
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(tS));
  tl.fromTo(scan, { x: 0 }, A({ x: -(FW + 130), duration: 1.05, ease: "power1.inOut" }), T(tS));
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(tS + 0.9));
  const ok = q(".s34-ok");
  tl.fromTo(ok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(tS + 1.0));
  E.draw(tl, q(".s34-ok path"), T(tS + 1.06), 0.35);
  E.burst(tl, q(".simwrap.sim34"), FL + FW, FT, T(tS + 1.05), { n: 12, seed: 34, r0: 30, r1: 96, color: "#c9c2ff" });
  E.fadeIn(tl, q(".s34-done"), T(tS + 1.15), 0.5, 16);
  regs.forEach((g) => tl.fromTo(g, { opacity: 1 }, A({ opacity: 0.6, duration: 0.4 }), T(tS + 1.6)));
};
