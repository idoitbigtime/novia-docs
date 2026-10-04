window.SIMS = window.SIMS || {};
window.SIMS.sim37 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim37, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const Z = 1 + c.zoom / 100, ZP = 1 + c.push / 100, DZ = 0.8, H = 30;    // punch-in scale, push scale, spring length, digit height
  const GX0 = 360, GX1 = 44, GY0 = 362, GY1 = 150;                       // the plot (as in sims/sim37.py)
  const R0 = { rotation: 0, skewX: 0, skewY: 0 };
  const frame = q(".s37-frame"), rig = q(".s37-rig"), p0 = q(".s37-p0"), p1 = q(".s37-p1"), p2 = q(".s37-p2");
  const ins = qa(".s37-in"), caps = qa(".s37-cap"), hud = q(".s37-hud");
  const units = q(".s37-units .s37-strip"), tens = q(".s37-tens .s37-strip");
  const waves = qa(".s37-wave");
  const kw = (i) => E.q(".s37-kw", caps[i]), ul = (i) => E.q(".s37-ul", caps[i]);

  // ---- helpers (every change is a chained fromTo; "one frame" = 0.02 s) ----
  const inv = (v) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (E.SPRING(m) < v) lo = m; else hi = m; } return hi; };
  const punch = (t) => {                     // the picture punches in on the face, the HUD rolls 100 -> 112
    ins.forEach((el) => tl.fromTo(el, { scale: 1 }, A({ scale: Z, duration: DZ, ease: E.SPRING }), T(t)));
    tl.fromTo(units, { y: 0 }, A({ y: -H * c.zoom, duration: DZ, ease: E.SPRING }), T(t));
    const a = inv(9.5 / c.zoom), b = inv(10 / c.zoom);
    tl.fromTo(tens, { y: 0 }, A({ y: -H, duration: Math.max(0.04, (b - a) * DZ), ease: "none" }), T(t + a * DZ));
  };
  const reset = (t, from) => {               // back to 100% in one frame
    ins.forEach((el) => tl.fromTo(el, { scale: from }, A({ scale: 1, duration: 0.02, ease: "none" }), T(t)));
    const u = Math.round((from - 1) * 100);
    tl.fromTo(units, { y: -H * u }, A({ y: 0, duration: 0.02, ease: "none" }), T(t));
    if (u >= 10) tl.fromTo(tens, { y: -H }, A({ y: 0, duration: 0.02, ease: "none" }), T(t));
  };
  const swap = (t, a, b) => {                // the next sentence's caption, in one frame
    tl.fromTo(caps[a], { opacity: 1 }, A({ opacity: 0, duration: 0.02, ease: "none" }), T(t));
    tl.fromTo(caps[b], { opacity: 0 }, A({ opacity: 1, duration: 0.02, ease: "none" }), T(t));
  };
  const light = (t, i) => {                  // the important word is said
    tl.fromTo(kw(i), { color: "#ffffff" }, A({ color: "#ff6b61", duration: 0.12 }), T(t));
    tl.fromTo(ul(i), { scaleX: 0 }, A({ scaleX: 1, duration: 0.3, ease: "power2.out" }), T(t));
    waves.forEach((w, k) => {
      tl.fromTo(w, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(t + k * 0.08));
      tl.fromTo(w, { opacity: 1 }, A({ opacity: 0, duration: 0.45, ease: "power1.in" }), T(t + 0.2 + k * 0.08));
    });
  };
  const unlight = (t, i) => {
    tl.fromTo(kw(i), { color: "#ff6b61" }, A({ color: "#ffffff", duration: 0.02, ease: "none" }), T(t));
    tl.fromTo(ul(i), { scaleX: 1 }, A({ scaleX: 0, duration: 0.02, ease: "none" }), T(t));
  };
  const gclip = q(".s37-gclip"), gdot = q(".s37-gdot");
  const HID = "inset(0px 0px 0px " + (GX0 + 6) + "px)", ALL = "inset(0px 0px 0px " + (GX1 - 8) + "px)";
  const drawCurve = (t) => {                 // the spring curve draws in real time; a dot rides it
    tl.fromTo(gclip, { clipPath: HID }, A({ clipPath: ALL, duration: DZ, ease: "none" }), T(t));
    tl.fromTo(gdot, { x: 0 }, A({ x: GX1 - GX0, duration: DZ, ease: "none" }), T(t));
    tl.fromTo(gdot, { y: 0 }, A({ y: GY1 - GY0, duration: DZ, ease: E.SPRING }), T(t));
  };
  const clearCurve = (t) => {
    tl.fromTo(gclip, { clipPath: ALL }, A({ clipPath: HID, duration: 0.02, ease: "none" }), T(t));
    tl.fromTo(gdot, { x: GX1 - GX0, y: GY1 - GY0 }, A({ x: 0, y: 0, duration: 0.02, ease: "none" }), T(t));
  };

  // establishing: the video arrives as a 3D stack of layers
  tl.fromTo(rig, { ...R0, rotationY: -40, rotationX: -8 }, A({ ...R0, rotationY: -28, rotationX: -8, duration: 0.9, ease: E.SPRING }), T(cfg.tStage));
  tl.fromTo(p2, { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(cfg.tStage + 0.2));

  // B1 "לא כל סרטון צריך תלת ממד": the effect layer goes, the layers merge and the frame turns flat
  const b1 = P[0];
  tl.fromTo(p2, { opacity: 1 }, A({ opacity: 0, duration: 0.45, ease: "power2.in" }), T(b1 + 0.1));
  tl.fromTo(q(".s37-ring"), { scale: 1 }, A({ scale: 0.8, duration: 0.45, ease: "power2.in" }), T(b1 + 0.1));
  tl.fromTo(p0, { z: -90 }, A({ z: 0, duration: 1.1, ease: E.SPRING }), T(b1 + 0.3));
  tl.fromTo(p2, { z: 60 }, A({ z: 0, duration: 1.1, ease: E.SPRING }), T(b1 + 0.3));
  tl.fromTo(rig, { ...R0, rotationY: -28, rotationX: -8 }, A({ ...R0, rotationY: 0, rotationX: 0, duration: 1.1, ease: E.SPRING }), T(b1 + 0.3));
  [p0, p1].forEach((p) => tl.fromTo(E.q(".s37-edge", p), { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), T(b1 + 0.95)));
  tl.fromTo(q(".s37-border"), { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(b1 + 1.0));
  tl.fromTo(hud, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(b1 + 1.3));

  // B2 "בכל משפט יש מילה אחת שהכי חשובה": the frame moves aside; sentences, one important word in each
  const b2 = P[1], panel = q(".s37-panel");
  tl.fromTo(frame, { x: 0 }, A({ x: 215, duration: 0.75, ease: E.SPRING }), T(b2 + 0.05));
  tl.fromTo(panel, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(b2 + 0.3));
  const rows = qa(".s37-row");
  rows.forEach((r, i) => {
    tl.fromTo(r, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.4 + i * 0.1));
    tl.fromTo(r, { x: -18 }, A({ x: 0, duration: 0.5, ease: E.SPRING }), T(b2 + 0.4 + i * 0.1));
  });
  tl.fromTo(caps[0], { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(b2 + 0.45));
  rows.forEach((r, i) => {
    const t = b2 + 0.85 + i * 0.42, k = E.q(".s37-kw", r), u = E.q(".s37-ul", r);
    tl.fromTo(k, { color: "#ffffff" }, A({ color: "#ff6b61", duration: 0.15 }), T(t));
    tl.fromTo(u, { scaleX: 0 }, A({ scaleX: 1, duration: 0.3, ease: "power2.out" }), T(t));
    if (i < rows.length - 1) {               // stays marked, in light colours, as the next sentence's word lights
      tl.fromTo(k, { color: "#ff6b61" }, A({ color: "#ffffff", duration: 0.1 }), T(t + 0.36));
      tl.fromTo(u, { backgroundColor: "#ff453a" }, A({ backgroundColor: "#c9c2ff", duration: 0.1 }), T(t + 0.36));
    }
  });
  light(b2 + 0.85, 0);                       // in the video, the first sentence's word

  // B3 "וקלוד מקרב עליה את התמונה ב-10 עד 15 אחוז": the picture punches in 12% on the word, inside the 10-15% range
  const b3 = P[2], meter = q(".s37-meter");
  tl.fromTo(q(".s37-rows"), { opacity: 1 }, A({ opacity: 0, duration: 0.25, ease: "power2.in" }), T(b3));
  tl.fromTo(meter, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 0.3));
  const tZ1 = b3 + 0.65, mk = q(".s37-mk"), mx = (v) => 356 - v * (316 / 15);
  punch(tZ1);
  tl.fromTo(mk, { x: 0 }, A({ x: mx(c.zoom) - mx(0), duration: DZ, ease: E.SPRING }), T(tZ1));
  tl.fromTo(q(".s37-mkv"), { opacity: 0, y: 8 }, A({ opacity: 1, y: 0, duration: 0.3, ease: E.SPRING }), T(tZ1 + 0.45));
  tl.fromTo(q(".s37-band"), { opacity: 0.45 }, A({ opacity: 1, duration: 0.3 }), T(tZ1 + 0.45));

  // B4 "בתנועת קפיץ, בדיוק כשהיא נאמרת": the next sentence (back to 100%); its word is said and at that very moment
  // the picture springs in while the guide's spring curve draws in real time
  const b4 = P[3], graph = q(".s37-graph");
  tl.fromTo(meter, { opacity: 1 }, A({ opacity: 0, duration: 0.25, ease: "power2.in" }), T(b4));
  tl.fromTo(graph, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b4 + 0.22));
  swap(b4 + 0.1, 0, 1);
  reset(b4 + 0.1, Z);
  const tZ2 = b4 + 0.45;
  tl.fromTo(gdot, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(tZ2 - 0.1));
  light(tZ2, 1);
  punch(tZ2);
  drawCurve(tZ2);

  // B5 "מרכז הזום תמיד על הפנים, והוא מתאפס בחיתוך הבא": the zoom centre is the face; at the next cut, 100% at once
  const b5 = P[4], face = q(".s37-face"), tline = q(".s37-tline"), ph = q(".s37-ph");
  tl.fromTo(face, { opacity: 0, scale: 1.3 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: E.SPRING }), T(b5 + 0.1));
  tl.fromTo(graph, { opacity: 1 }, A({ opacity: 0, duration: 0.25, ease: "power2.in" }), T(b5 + 0.15));
  tl.fromTo(tline, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b5 + 0.4));
  const tP = b5 + 0.75, dP = 1.7, cutF = (370 - 196) / 340, tCut = tP + cutF * dP;
  tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(tP - 0.1));
  tl.fromTo(ph, { x: 0 }, A({ x: -340, duration: dP, ease: "none" }), T(tP));
  tl.fromTo(q(".s37-zclip"), { clipPath: "inset(0px 0px 0px 370px)" }, A({ clipPath: "inset(0px 0px 0px 30px)", duration: dP, ease: "none" }), T(tP));
  // the cut: a new shot, and the zoom is back to 100% in one frame
  tl.fromTo(q(".s37-flash"), { opacity: 0 }, A({ opacity: 0.8, duration: 0.04, ease: "none" }), T(tCut));
  tl.fromTo(q(".s37-flash"), { opacity: 0.8 }, A({ opacity: 0, duration: 0.3, ease: "power2.out" }), T(tCut + 0.04));
  reset(tCut, Z);
  tl.fromTo(q(".s37-win"), { x: 0 }, A({ x: -150, duration: 0.02, ease: "none" }), T(tCut));
  tl.fromTo(face, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(tCut + 0.1));
  tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(tP + dP));

  // payoff: the guide's opening, sentence by sentence: a punch-in on each important word (the curve redraws),
  // 100% again at each next sentence, and a slow 3% push on the long last sentence
  tl.fromTo(tline, { opacity: 1 }, A({ opacity: 0, duration: 0.25, ease: "power2.in" }), T(pe));
  clearCurve(pe + 0.1);
  tl.fromTo(graph, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(pe + 0.2));
  unlight(pe + 0.08, 0);
  swap(pe + 0.1, 1, 0);
  const STEP = 1.1;
  [0, 1, 2].forEach((i) => {
    const t0 = pe + 0.1 + i * STEP;
    if (i > 0) {
      if (i === 1) unlight(t0 - 0.02, 1);
      swap(t0, i - 1, i);
      reset(t0, Z);
      clearCurve(t0);
    }
    light(t0 + 0.25, i);
    punch(t0 + 0.25);
    drawCurve(t0 + 0.25);
  });
  // the long sentence: no punch-in, a slow push of 3%; the curve gives way to a straight slow line
  const tD = pe + 0.1 + 3 * STEP, dD = 1.4, gclip2 = q(".s37-gclip2");
  swap(tD, 2, 3);
  reset(tD, Z);
  clearCurve(tD);
  ins.forEach((el) => tl.fromTo(el, { scale: 1 }, A({ scale: ZP, duration: dD, ease: "none" }), T(tD + 0.1)));
  tl.fromTo(units, { y: 0 }, A({ y: -H * c.push, duration: dD, ease: "none" }), T(tD + 0.1));
  tl.fromTo(gclip2, { clipPath: HID }, A({ clipPath: ALL, duration: dD, ease: "none" }), T(tD + 0.1));
  const pushY = (GY1 - GY0) * c.push / c.zoom;
  tl.fromTo(gdot, { x: 0, y: 0 }, A({ x: GX1 - GX0, y: pushY, duration: dD, ease: "none" }), T(tD + 0.1));
};
