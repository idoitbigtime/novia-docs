window.SIMS = window.SIMS || {};
window.SIMS.sim23 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim23"), d = root.dataset;
  const crop0 = +d.crop0, dx1 = +d.dx1, crop1 = +d.crop1, sway1 = +d.sway1, dx2 = +d.dx2, crop2 = +d.crop2, sway2 = +d.sway2, k = +d.scale;
  const fx0 = +d.facex, fy0 = +d.facey;      // face centre at rest (source px)
  const persons = qa(".s23-p"), crop = q(".s23-crop"), oin = q(".s23-oin"), zlead = q(".s23-zlead");
  const src = q(".s23-src"), out = q(".s23-out"), zone = q(".s23-zone");
  // the presenter moves in both frames at once (the output copy is the same scene, scaled)
  const move = (t, a, b, dur, ease) => persons.forEach((p) => tl.fromTo(p, { x: a }, A({ x: b, duration: dur, ease: ease || "power2.inOut" }), t));
  // the crop window, its leader and the output copy move together (crop left a -> b, source px)
  const ghosts = qa(".s23-ghost");
  const follow = (t, a, b, dur) => {
    tl.fromTo(crop, { x: a - crop0 }, A({ x: b - crop0, duration: dur, ease: E.SPRING }), t);
    // a soft trail: lagging outlines that fade as the frame settles
    ghosts.forEach((g, i) => {
      const lag = 0.06 * (i + 1), op = [0.42, 0.26, 0.14][i];
      tl.fromTo(g, { x: a - crop0 }, A({ x: b - crop0, duration: dur, ease: E.SPRING }), t + lag);
      tl.fromTo(g, { opacity: 0 }, A({ opacity: op, duration: 0.12 }), t + lag);
      tl.fromTo(g, { opacity: op }, A({ opacity: 0, duration: 0.35, ease: "power2.in" }), t + lag + dur * 0.45);
    });
    tl.fromTo(zlead, { x: a - crop0 }, A({ x: b - crop0, duration: dur, ease: E.SPRING }), t);
    tl.fromTo(oin, { x: -(a - crop0) }, A({ x: -(b - crop0), duration: dur, ease: E.SPRING }), t);
  };
  const pulseZone = (t) => {
    tl.fromTo(zone, { backgroundColor: "rgba(201, 194, 255, 0.13)" }, A({ backgroundColor: "rgba(201, 194, 255, 0.34)", duration: 0.2, ease: "power2.out" }), t);
    tl.fromTo(zone, { backgroundColor: "rgba(201, 194, 255, 0.34)" }, A({ backgroundColor: "rgba(201, 194, 255, 0.13)", duration: 0.45, ease: "power2.inOut" }), t + 0.2);
  };

  // establishing shot: the 16:9 source swings in at the right, the 9:16 output at the left
  const t0 = cfg.tStage;
  tl.fromTo(src, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(t0 + 0.05));
  tl.fromTo(src, { rotationY: -24, x: 30, transformPerspective: 1300 }, A({ rotationY: 0, x: 0, transformPerspective: 1300, duration: 0.9, ease: E.SPRING }), T(t0 + 0.05));
  tl.fromTo(out, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(t0 + 0.15));
  tl.fromTo(out, { rotationY: 24, x: -24, transformPerspective: 1300 }, A({ rotationY: 0, x: 0, transformPerspective: 1300, duration: 0.9, ease: E.SPRING }), T(t0 + 0.15));
  qa(".s23-tag").forEach((tg, i) => E.fadeIn(tl, tg, T(t0 + 0.35 + i * 0.08), 0.45, 8));
  const arr = q(".s23-arr");
  tl.fromTo(arr, { opacity: 0, x: 14 }, A({ opacity: 1, x: 0, duration: 0.5, ease: E.SPRING }), T(t0 + 0.45));

  // B0 "חיתוך קבוע באמצע יעיף לכם חצי ראש ברגע שזזתם": a fixed crop in the middle; the presenter moves
  const b0 = P[0], cfix = q(".s23-cfix"), dims = qa(".s23-dim"), fixl = q(".s23-fixl");
  tl.fromTo(cfix, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b0 + 0.05));
  tl.fromTo(cfix, { clipPath: "inset(0px 0px 100% 0px)" }, A({ clipPath: "inset(0px 0px 0% 0px)", duration: 0.55, ease: "power2.inOut" }), T(b0 + 0.05));
  dims.forEach((dm) => tl.fromTo(dm, { opacity: 0 }, A({ opacity: 1, duration: 0.45, ease: "power2.out" }), T(b0 + 0.3)));
  tl.fromTo(fixl, { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b0 + 0.3));
  move(T(b0 + 0.85), 0, dx1, 0.9);
  // the output loses half the head: X and a jolt
  const xs = q(".s23-x");
  tl.fromTo(xs, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b0 + 1.75));
  E.qa("path", xs).forEach((p, i) => E.draw(tl, p, T(b0 + 1.78 + i * 0.16), 0.22));
  E.glitch(tl, out, T(b0 + 1.75), 9);
  tl.fromTo(fixl, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(P[1] - 0.2));

  // B1 "קלוד מוצא את הפנים בכל פריים": scanner, face box, a filmstrip where every frame gets one
  const b1 = P[1], fbox = q(".s23-fbox");
  tl.fromTo(xs, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1 + 0.02));
  E.sweep(tl, src, T(b1 + 0.08), 0.8, { color: "rgba(201, 194, 255, 0.32)" });
  tl.fromTo(fbox, { opacity: 0, scale: 1.4 }, A({ opacity: 1, scale: 1, duration: 0.55, ease: E.SPRING }), T(b1 + 0.42));
  E.draw(tl, E.q("path", fbox), T(b1 + 0.42), 0.45);
  E.burst(tl, src, fx0 + dx1, fy0, T(b1 + 0.55), { n: 10, seed: 23, r0: 34, r1: 86, color: "#c9c2ff" });
  const frames = qa(".s23-fr"), scan = q(".s23-fscan");
  frames.forEach((f, i) => tl.fromTo(f, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b1 + 0.5 + i * 0.05)));
  const sx0 = scan.offsetLeft, fx = frames.map((f) => f.offsetLeft + f.offsetWidth / 2), xEnd = Math.min(...fx) - 40, tS = T(b1 + 0.72), dS = 0.68;
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), tS);
  tl.fromTo(scan, { x: 0 }, A({ x: xEnd - sx0, duration: dS, ease: "none" }), tS);
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.12 }), tS + dS - 0.08);
  frames.forEach((f, i) => {
    const tf = tS + ((sx0 - fx[i]) / (sx0 - xEnd)) * dS;
    tl.fromTo(E.q(".s23-fbx", f), { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), tf);
    tl.fromTo(f, { boxShadow: "0 0 0 1.5px rgba(201, 194, 255, 0.3)" }, A({ boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.95)", duration: 0.12 }), tf);
    tl.fromTo(f, { boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.95)" }, A({ boxShadow: "0 0 0 1.5px rgba(201, 194, 255, 0.5)", duration: 0.35 }), tf + 0.12);
  });
  frames.forEach((f, i) => tl.fromTo(f, { opacity: 1, y: 0 }, A({ opacity: 0, y: 10, duration: 0.25, ease: "power2.in" }), T(P[2] + 0.1 + i * 0.02)));

  // B2 "מזיז את החיתוך אחריהן בתנועה רכה": the crop turns red and follows with a soft spring; the dead zone
  const b2 = P[2], cred = q(".s23-cred"), zl = q(".s23-zl");
  tl.fromTo(cfix, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b2 + 0.02));
  tl.fromTo(cred, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b2 + 0.05));
  E.draw(tl, E.q("rect", cred), T(b2 + 0.05), 0.45);
  tl.fromTo(zone, { opacity: 0, scaleX: 0.2 }, A({ opacity: 1, scaleX: 1, duration: 0.5, ease: E.SPRING }), T(b2 + 0.25));
  follow(T(b2 + 0.35), crop0, crop1, 1.0);
  // the head is whole again in the output
  const fo = { x: (fx0 + dx1 - crop1) * k, y: fy0 * k };
  E.burst(tl, out, fo.x, fo.y, T(b2 + 1.05), { n: 10, seed: 24, r0: 40, r1: 90, color: "#c9c2ff" });
  tl.fromTo(zlead, { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.3, ease: "power2.out" }), T(b2 + 0.6));
  tl.fromTo(zl, { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b2 + 0.7));
  // a small move inside the zone: the crop holds still
  pulseZone(T(b2 + 1.5));
  move(T(b2 + 1.45), dx1, sway1, 0.32);
  move(T(b2 + 1.77), sway1, dx1, 0.38);

  // B3 "ומשאיר כל טקסט באזור שהטלפון לא חותך": the phone's cut edges, the safe lines, the text inside them
  const b3 = P[3];
  E.dim(tl, zl, T(b3 + 0.02), 0.4, 1, 0.35);
  E.dim(tl, zlead, T(b3 + 0.02), 0.4, 1, 0.35);
  qa(".s23-edge").forEach((e) => {
    tl.fromTo(e, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b3 + 0.08));
    tl.fromTo(e, { clipPath: "inset(0px 0px 100% 0px)" }, A({ clipPath: "inset(0px 0px 0% 0px)", duration: 0.5, ease: "power2.inOut" }), T(b3 + 0.08));
  });
  qa(".s23-sl").forEach((l, i) => tl.fromTo(l, { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out" }), T(b3 + 0.3 + i * 0.1)));
  qa(".s23-stag").forEach((g, i) => tl.fromTo(g, { opacity: 0, y: -8 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b3 + 0.5 + i * 0.1)));
  const pill = q(".s23-pill");
  tl.fromTo(pill, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b3 + 0.85));
  tl.fromTo(pill, { x: -118 }, A({ x: 0, duration: 0.8, ease: E.SPRING }), T(b3 + 0.85));
  qa(".s23-sl").forEach((l) => {
    tl.fromTo(l, { filter: "drop-shadow(0 0 4px rgba(201, 194, 255, 0.9))" }, A({ filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 1))", duration: 0.18 }), T(b3 + 1.1));
    tl.fromTo(l, { filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 1))" }, A({ filter: "drop-shadow(0 0 4px rgba(201, 194, 255, 0.9))", duration: 0.4 }), T(b3 + 1.28));
  });
  E.sweep(tl, pill, T(b3 + 1.25), 0.55, { color: "rgba(120, 100, 255, 0.3)" });
  const br = q(".s23-br");
  tl.fromTo(br, { opacity: 0, y: -8 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b3 + 1.35));

  // payoff: the eye line through both frames at the upper third; one more soft follow; then hold
  E.dim(tl, zl, T(pe + 0.05), 1, 0.4, 0.35);
  E.dim(tl, zlead, T(pe + 0.05), 1, 0.4, 0.35);
  const eye = q(".s23-eye"), el = q(".s23-el");
  tl.fromTo(eye, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.75, ease: "power2.inOut" }), T(pe + 0.1));
  E.draw(tl, q(".s23-elead path"), T(pe + 0.45), 0.5);
  tl.fromTo(el, { opacity: 0, x: -10 }, A({ opacity: 1, x: 0, duration: 0.5, ease: E.SPRING }), T(pe + 0.75));
  move(T(pe + 1.0), dx1, dx2, 1.0);
  pulseZone(T(pe + 1.05));
  follow(T(pe + 1.15), crop1, crop2, 1.25);
  move(T(pe + 2.65), dx2, sway2, 0.32);
  move(T(pe + 2.97), sway2, dx2, 0.38);
  pulseZone(T(pe + 2.7));
};
