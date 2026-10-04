window.SIMS = window.SIMS || {};
window.SIMS.sim33 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(".sim33 " + s, sc), qa = (s) => E.qa(".sim33 " + s, sc);
  const persp = q(".s33-persp"), root = persp.parentNode, stack = q(".s33-stack"), lys = qa(".s33-ly");
  const R = { x: -96, y: 58, rz: -20, rx: 48, s: 0.66 }, Z0 = [0, 0.6, 1.2], Z = [-150, 0, 150];

  // static layout: measure where each layer's right edge lands in the payoff's side view, then place the names
  stack.style.transform = "translate(" + R.x + "px, " + R.y + "px) rotate(" + R.rz + "deg) rotateX(" + R.rx + "deg) scale(" + R.s + ")";
  lys.forEach((l, i) => { l.style.transform = "translateZ(" + Z[i] + "px)"; });
  const rr = root.getBoundingClientRect(), k = rr.width / root.offsetWidth || 1;
  const pts = lys.map((l) => {
    const r = E.q(".s33-mk", l).getBoundingClientRect();
    return { x: (r.left + r.width / 2 - rr.left) / k, y: (r.top + r.height / 2 - rr.top) / k };
  });
  stack.style.transform = "";
  lys.forEach((l) => { l.style.transform = ""; });
  const labs = qa(".s33-lab"), leads = qa(".s33-leads path");
  pts.forEach((p, i) => {
    const lx = Math.round(p.x + 44), ly = Math.round(p.y);
    labs[i].style.left = lx + "px";
    labs[i].style.top = ly - 16 + "px";
    leads[i].setAttribute("d", "M" + (p.x + 2).toFixed(1) + " " + p.y.toFixed(1) + " H" + (lx + 2));
  });

  // establishing: the frame's viewfinder corners draw on
  qa(".s33-frame path").forEach((p, i) => E.draw(tl, p, T(cfg.tStage + 0.1 + i * 0.06), 0.45));

  // B0 "כותרת שקופצת מעל הפנים מסתירה אתכם": a title pops over the face and hides it
  const b0 = P[0], title = q(".s33-title"), tring = q(".s33-tring");
  tl.fromTo(title, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }), T(b0 + 0.15));
  tl.fromTo(tring, { opacity: 0, scale: 1.1 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: E.SPRING }), T(b0 + 0.9));
  E.glitch(tl, title, T(b0 + 0.95), 9);

  // B1 "על צילום רגיל, בלי מסך ירוק": regular footage; a green screen, struck out (punch-in here)
  const b1 = P[1], tag = q(".s33-tag"), gs = q(".s33-gs");
  tl.fromTo(title, { opacity: 1, y: 0 }, A({ opacity: 0, y: -30, duration: 0.35, ease: "power2.in" }), T(b1));
  tl.fromTo(tag, { opacity: 0, x: -12 }, A({ opacity: 1, x: 0, duration: 0.45, ease: E.SPRING }), T(b1 + 0.1));
  tl.fromTo(gs, { opacity: 0, y: 20 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b1 + 0.15));
  qa(".s33-gsv .x").forEach((p, i) => E.draw(tl, p, T(b1 + 0.55 + i * 0.12), 0.25, "power2.in"));
  E.glitch(tl, q(".s33-gsv"), T(b1 + 0.75), 7);

  // B2 "קלוד מפריד אתכם מהרקע בכל פריים": a scanner passes; the room gives way to a checkerboard (the presenter is
  // cut out); the outline glows; a strip of frames, each one cut out
  const b2 = P[2], scan = q(".s33-scan"), chk = q(".s33-chk"), cut = q(".s33-cut"), strip = q(".s33-strip");
  tl.fromTo(gs, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2));
  tl.fromTo(tag, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2));
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(b2 + 0.1));
  tl.fromTo(scan, { x: 0 }, A({ x: -880, duration: 0.95, ease: "power1.inOut" }), T(b2 + 0.1));
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(b2 + 0.95));
  tl.fromTo(chk, { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.95, ease: "power1.inOut" }), T(b2 + 0.12));
  E.draw(tl, cut, T(b2 + 0.3), 0.85, "power1.inOut");
  const mfs = qa(".s33-mf"), msel = q(".s33-msel");
  mfs.forEach((m, i) => tl.fromTo(m, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), T(b2 + 0.2 + i * 0.06)));
  mfs.forEach((m, i) => E.qa(".ol path, .ol ellipse", m).forEach((p) => E.draw(tl, p, T(b2 + 0.55 + i * 0.22), 0.3)));
  tl.fromTo(msel, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b2 + 0.5));
  for (let i = 1; i < 5; i++) tl.fromTo(msel, { x: -(i - 1) * 146 }, A({ x: -i * 146, duration: 0.18, ease: "power2.inOut" }), T(b2 + 0.55 + i * 0.22));

  // B3 "ומכניס את הטקסט בין הקיר לבינכם": the room returns; the text enters on the wall, behind the presenter;
  // every word whole: it rises ~30 px on the spring and unblurs from 8 px in 0.3 s
  const b3 = P[3];
  tl.fromTo(chk, { opacity: 1 }, A({ opacity: 0, duration: 0.35 }), T(b3));
  tl.fromTo(strip, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b3));
  tl.fromTo(cut, { opacity: 1 }, A({ opacity: 0, duration: 0.35 }), T(b3));
  qa(".s33-w").forEach((w, i) => {
    const t = T(b3 + 0.4 + i * 0.32);
    tl.fromTo(w, { opacity: 0 }, A({ opacity: 1, duration: 0.26, ease: "power2.out" }), t);
    tl.fromTo(w, { y: 30 }, A({ y: 0, duration: 0.7, ease: E.SPRING }), t);
    tl.fromTo(w, { filter: "blur(8px)" }, A({ filter: "blur(0px)", duration: 0.3, ease: "power2.out" }), t);
    tl.set(w, { filter: "none" }, t + 0.31);
  });
  E.sweep(tl, q(".s33-text"), T(b3 + 1.4), 0.5, { color: "rgba(255, 255, 255, 0.35)" });
  // the time strip: a playhead reaches each word as it enters on the wall
  const wt = q(".s33-wt"), wph = q(".s33-wph"), wcs = qa(".s33-wc");
  tl.fromTo(wt, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), T(b3 + 0.22));
  tl.fromTo(wph, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(b3 + 0.33));
  tl.fromTo(wph, { x: 0 }, A({ x: -570, duration: 0.95, ease: "none" }), T(b3 + 0.37));
  tl.fromTo(wph, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b3 + 1.3));
  wcs.forEach((wc, i) => {
    const t = T(b3 + 0.4 + i * 0.32);
    tl.fromTo(wc, { backgroundColor: "rgba(26, 23, 52, 0.92)", borderColor: "rgba(201, 194, 255, 0.3)", color: "#dcd9e6" },
      A({ backgroundColor: "rgba(255, 255, 255, 0.95)", borderColor: "#ffffff", color: "#0b0b0b", duration: 0.12 }), t);
    tl.fromTo(wc, { backgroundColor: "rgba(255, 255, 255, 0.95)", borderColor: "#ffffff", color: "#0b0b0b" },
      A({ backgroundColor: "rgba(201, 194, 255, 0.22)", borderColor: "rgba(201, 194, 255, 0.7)", color: "#ffffff", duration: 0.4 }), t + 0.3);
  });

  // B4 "וכל תנועה של היד מסתירה את החלק של הטקסט שמאחוריה": the hand rises and passes over "לכבד";
  // it hides only what is behind it (the same arm in the original layer and in the cut-out layer)
  const b4 = P[4], arms = qa(".s33-arm");
  tl.fromTo(q(".s33-wt"), { opacity: 1 }, A({ opacity: 0.4, duration: 0.35 }), T(b4));
  arms.forEach((a) => {
    tl.fromTo(a, { y: 230, rotation: 12, svgOrigin: "338 420" }, A({ y: 0, rotation: 0, duration: 0.85, ease: E.SPRING }), T(b4 + 0.1));
    tl.fromTo(a, { x: 0 }, A({ x: -34, duration: 0.6, ease: "sine.inOut" }), T(b4 + 1.1));
    tl.fromTo(a, { x: -34 }, A({ x: 16, duration: 0.7, ease: "sine.inOut" }), T(b4 + 1.85));
  });

  // payoff: a side view of the three layers, bottom to top: the original clip · the text · you without the background
  tl.fromTo(q(".s33-frame"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe));
  tl.fromTo(q(".s33-wt"), { opacity: 0.4 }, A({ opacity: 0, duration: 0.3 }), T(pe));
  tl.fromTo(stack, { x: 0, y: 0, rotation: 0, rotationX: 0, scale: 1 }, A({ x: R.x, y: R.y, rotation: R.rz, rotationX: R.rx, scale: R.s, duration: 1.2, ease: E.SPRING }), T(pe + 0.2));
  lys.forEach((l, i) => tl.fromTo(l, { z: Z0[i] }, A({ z: Z[i], duration: 1.2, ease: E.SPRING }), T(pe + 0.25 + i * 0.05)));
  qa(".s33-edge").forEach((e, i) => tl.fromTo(e, { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(pe + 0.55 + i * 0.08)));
  leads.forEach((p, i) => E.draw(tl, p, T(pe + 1.3 + i * 0.16), 0.3));
  labs.forEach((l, i) => tl.fromTo(l, { opacity: 0, x: -10 }, A({ opacity: 1, x: 0, duration: 0.4, ease: E.SPRING }), T(pe + 1.4 + i * 0.16)));
};
