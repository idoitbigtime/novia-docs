window.SIMS = window.SIMS || {};
window.SIMS.sim35 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim35, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  // geometry shared with sims/sim35.py
  const CX = 380, CY = 395, R = 140;                       // circle (screen-local) when it forms
  const SX = 20, SY = 30, TOX = 630, TOY = 196, TOS = 0.9; // screen box; where the circle settles
  const Z_SHUT = [-7, -3, 1, 7], Z_OPEN = [-150, -50, 50, 150], PITCH = 60, YAW = 208;
  const clip = (t, r, b, l, rad) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;
  const FULL = clip(0, 0, 0, 0, 24), SQ = clip(CY - R, 760 - CX - R, 640 - CY - R, CX - R, 44), DISC = clip(CY - R, 760 - CX - R, 640 - CY - R, CX - R, R);
  const bg = q(".s35-bg"), circ = q(".s35-circ"), vid = q(".s35-vid"), ring = q(".s35-ring circle"), shadow = q(".s35-shadow");
  const prod = q(".s35-prod"), pv = q(".s35-pv"), pr = q(".s35-pr"), py = q(".s35-py"), parts = qa(".s35-part"), axis = q(".s35-axis");
  const glow = q(".s35-glow");
  // the backdrop's waves drift slowly for the whole scene
  tl.fromTo(q(".s35-waves"), { x: 0 }, A({ x: -760, duration: cfg.tSimEnd - cfg.tStage, ease: "none" }), T(cfg.tStage));

  // establishing: the full video (the room and you)
  tl.fromTo(vid, { scale: 0.97 }, A({ scale: 1, duration: 0.8, ease: E.SPRING }), T(cfg.tStage));

  // B1 "הסרטון שלכם מתכווץ לעיגול בצד אחד של המסך": the edges pull in, it becomes a circle, the circle moves aside
  const b1 = P[0];
  tl.fromTo(bg, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 0.05));
  tl.fromTo(vid, { clipPath: FULL }, A({ clipPath: SQ, duration: 0.6, ease: E.SPRING }), T(b1 + 0.1));
  tl.fromTo(vid, { clipPath: SQ }, A({ clipPath: DISC, duration: 0.4, ease: "power2.inOut" }), T(b1 + 0.62));
  E.draw(tl, ring, T(b1 + 0.85), 0.55);
  tl.fromTo(shadow, { opacity: 0 }, A({ opacity: 1, duration: 0.5 }), T(b1 + 0.9));
  tl.fromTo(circ, { x: 0, y: 0, scale: 1 }, A({ x: TOX - SX - CX, y: TOY - SY - CY, scale: TOS, duration: 0.85, ease: E.SPRING }), T(b1 + 1.25));

  // B2 "ובצד השני מרחף מוצר בתלת ממד": the phone rises from below, stops and hovers, turning up to 25 deg each way
  const b2 = P[1], H = c.hover;
  tl.fromTo(prod, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.05));
  tl.fromTo(pv, { y: 330 }, A({ y: 0, duration: 1.0, ease: E.SPRING }), T(b2 + 0.05));     // rises into the screen box (it clips)
  tl.fromTo(glow, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.6, ease: E.SPRING }), T(b2 + 0.55));
  tl.fromTo(py, { rotationY: -H }, A({ rotationY: 0, duration: 1.0, ease: E.SPRING }), T(b2 + 0.05));
  tl.fromTo(py, { rotationY: 0 }, A({ rotationY: H, duration: 1.15, ease: "sine.inOut" }), T(b2 + 1.05));
  tl.fromTo(q(".s35-sheen b"), { x: 0 }, A({ x: -390, duration: 0.9, ease: "power2.inOut" }), T(b2 + 1.0));   // band starts and ends outside (skew included)
  tl.fromTo(pr, { y: 0 }, A({ y: -10, duration: 0.9, ease: "sine.inOut" }), T(b2 + 0.9));
  tl.fromTo(pr, { y: -10 }, A({ y: 0, duration: 0.6, ease: "sine.inOut" }), T(b2 + 1.8));

  // B3 "על המילה שבחרתם הוא מתפרק לחלקים האמיתיים שלו": the word (a ripple from the circle), the phone swings to a
  // back/side view and the parts come apart along the depth axis, each on its own spring
  const b3 = P[2];
  qa(".s35-rip").forEach((rp, i) => {
    tl.fromTo(rp, { opacity: 0.9, scale: 1 }, A({ opacity: 0, scale: 1.32, duration: 0.75, ease: "power2.out" }), T(b3 + 0.05 + i * 0.16));
  });
  const tSw = b3 + 0.3, dSw = 1.2;
  tl.fromTo(pr, { rotationX: 0 }, A({ rotationX: PITCH, duration: dSw, ease: E.SPRING }), T(tSw));
  tl.fromTo(py, { rotationY: H }, A({ rotationY: YAW, duration: dSw, ease: E.SPRING }), T(tSw));
  tl.fromTo(glow, { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), T(tSw));
  parts.forEach((p, i) => tl.fromTo(p, { z: Z_SHUT[i] }, A({ z: Z_OPEN[i], duration: 1.0, ease: E.SPRING }), T(tSw + 0.18 + i * 0.09)));
  tl.fromTo(axis, { z: 0, rotationY: 90, scaleX: 0, x: 0 }, A({ z: Z_OPEN[3] + 40, rotationY: 90, scaleX: 1, x: 0, duration: 1.0, ease: E.SPRING }), T(tSw + 0.2));
  tl.fromTo(axis, { opacity: 0 }, A({ opacity: 0.7, duration: 0.4 }), T(tSw + 0.3));

  // B4 "כל חלק מרכזי מקבל תווית בעברית": names, one after another (dot on the part, the line, the name)
  const b4 = P[3];
  qa(".s35-lab").forEach((lab, k) => {
    const t = T(b4 + 0.1 + k * 0.25);
    const dot = E.q(".s35-dot", lab), ln = E.q(".s35-ln", lab), nm = E.q(".s35-name", lab);
    tl.fromTo(dot, { opacity: 0, scale: 0.3 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.2)" }), t);
    tl.fromTo(ln, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.3, ease: "power2.out" }), t + 0.08);
    tl.fromTo(nm, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), t + 0.28);
    tl.fromTo(nm, { x: (k === 0 || k === 3 ? 14 : -14) }, A({ x: 0, duration: 0.5, ease: E.SPRING }), t + 0.28);
  });

  // B5 "ואחר כך הכל מתרכב חזרה והעיגול נפתח למסך מלא": the names gather, the parts return in reverse order with a click
  const b5 = P[4];
  qa(".s35-lab").forEach((lab, k) => {
    const nm = E.q(".s35-name", lab), ln = E.q(".s35-ln", lab), dot = E.q(".s35-dot", lab);
    tl.fromTo(nm, { opacity: 1 }, A({ opacity: 0, duration: 0.2, ease: "power2.in" }), T(b5 + 0.05));
    tl.fromTo(ln, { scaleX: 1 }, A({ scaleX: 0, duration: 0.25, ease: "power2.in" }), T(b5 + 0.1));
    tl.fromTo(dot, { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 0.3, duration: 0.2, ease: "power2.in" }), T(b5 + 0.3));
  });
  const order = [3, 2, 1, 0];                 // the reverse of the order they came apart
  order.forEach((i, k) => {
    const t = b5 + 0.42 + k * 0.2, p = parts[i];
    tl.fromTo(p, { z: Z_OPEN[i] }, A({ z: Z_SHUT[i], duration: 0.42, ease: "power3.in" }), T(t));
    const f = E.q(".s35-pf", p);
    tl.fromTo(f, { opacity: 0 }, A({ opacity: 1, duration: 0.06 }), T(t + 0.42));
    tl.fromTo(f, { opacity: 1 }, A({ opacity: 0, duration: 0.35, ease: "power2.out" }), T(t + 0.48));
  });
  tl.fromTo(axis, { z: Z_OPEN[3] + 40, rotationY: 90, scaleX: 1, x: 0 }, A({ z: 0, rotationY: 90, scaleX: 0, x: 0, duration: 0.9, ease: "power2.inOut" }), T(b5 + 0.4));
  tl.fromTo(axis, { opacity: 0.7 }, A({ opacity: 0, duration: 0.3 }), T(b5 + 1.0));
  // a small bump as the last part clicks in (sparks), then the phone turns back to you, whole
  const tWhole = b5 + 0.42 + 3 * 0.2 + 0.42;
  E.burst(tl, q(".simwrap.sim35"), 300, 380, T(tWhole), { n: 12, seed: 35, r0: 60, r1: 150, color: "#c9c2ff" });
  tl.fromTo(pr, { scale: 1 }, A({ scale: 1.04, duration: 0.08, ease: "power2.out" }), T(tWhole));
  tl.fromTo(pr, { scale: 1.04 }, A({ scale: 1, duration: 0.3, ease: E.SPRING }), T(tWhole + 0.08));
  tl.fromTo(pr, { rotationX: PITCH }, A({ rotationX: 0, duration: 1.0, ease: E.SPRING }), T(tWhole + 0.2));
  tl.fromTo(py, { rotationY: YAW }, A({ rotationY: 360 + 22, duration: 1.0, ease: E.SPRING }), T(tWhole + 0.2));

  // payoff: the product leaves the screen, then the circle glides back and opens through a rounded rectangle,
  // landing exactly on the original picture
  tl.fromTo(prod, { opacity: 1 }, A({ opacity: 0, duration: 0.45, ease: "power2.in" }), T(pe + 0.05));
  tl.fromTo(pv, { y: 0 }, A({ y: 120, duration: 0.5, ease: "power2.in" }), T(pe + 0.05));
  tl.fromTo(circ, { x: TOX - SX - CX, y: TOY - SY - CY, scale: TOS }, A({ x: 0, y: 0, scale: 1, duration: 0.8, ease: E.SPRING }), T(pe + 0.45));
  tl.fromTo(q(".s35-ring"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 1.15));
  tl.fromTo(shadow, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 1.15));
  tl.fromTo(vid, { clipPath: DISC }, A({ clipPath: SQ, duration: 0.35, ease: "power2.inOut" }), T(pe + 1.2));
  tl.fromTo(vid, { clipPath: SQ }, A({ clipPath: FULL, duration: 0.75, ease: E.SPRING }), T(pe + 1.55));
  tl.fromTo(bg, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 2.3));
  const fl = q(".s35-fl path");
  E.draw(tl, fl, T(pe + 2.1), 0.7);
  tl.fromTo(q(".s35-fl"), { opacity: 1 }, A({ opacity: 0, duration: 0.5 }), T(pe + 3.0));
  tl.fromTo(q(".s35-sw b"), { x: 0 }, A({ x: -(760 + 110 + 220 + 120), duration: 0.9, ease: "power2.inOut" }), T(pe + 2.2));
};
