window.SIMS = window.SIMS || {};
window.SIMS.sim51 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim51, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim51");
  // a digit-strip counter: every strip rolls to its last cell (transforms only)
  const roll = (num, t, d) => E.qa(".s51-strip", num).forEach((st) => {
    const n = st.children.length, h = st.firstElementChild.offsetHeight;
    tl.fromTo(st, { y: 0 }, A({ y: -(n - 1) * h, duration: d, ease: "power3.out" }), t);
  });
  const tileXY = (rc) => ({ x: (7 - rc[1]) * 96, y: rc[0] * 96 });

  // B0 establishing shot: the Higgsfield window draws on, its empty model slots wait
  const t0 = cfg.tStage;
  tl.fromTo(q(".s51-hub"), { opacity: 0 }, A({ opacity: 1, duration: 0.45 }), T(t0 + 0.05));
  E.draw(tl, q(".s51-hubo path"), T(t0 + 0.05), 0.85);
  E.fadeIn(tl, q(".s51-htitle"), T(t0 + 0.25), 0.5, 10);
  tl.fromTo(q(".s51-slots"), { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(t0 + 0.3));

  // B1 "יש בו יותר מ-30 מודלים ליצירת תמונות וסרטונים": the wall of models flips in, the counter rolls to 30
  const b1 = P[0];
  qa(".s51-tile").forEach((tile) => {
    const t = T(b1 + 0.05 + (+tile.dataset.r + +tile.dataset.c) * 0.045);
    tl.fromTo(tile, { opacity: 0 }, A({ opacity: 1, duration: 0.2, ease: "power1.out" }), t);
    tl.fromTo(tile, { rotationY: -90, transformPerspective: 500 }, A({ rotationY: 0, transformPerspective: 500, duration: 0.65, ease: E.SPRING }), t);
  });
  const cnt = q(".s51-count");
  E.fadeIn(tl, cnt, T(b1 + 0.3), 0.5, 18);
  roll(q(".s51-cnum"), T(b1 + 0.35), 1.1);
  qa(".s51-cat").forEach((el, i) => {
    tl.fromTo(el, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }), T(b1 + 1.15 + i * 0.18));
  });
  E.sweep(tl, q(".s51-grid"), T(b1 + 1.4), 0.9, { color: "rgba(201, 194, 255, 0.2)" });

  // B2 "קלוד בוחר את המודל שמתאים לבקשה": a clip is requested; image models step back,
  // a ring hops over the clip models and locks on the one that fits
  const b2 = P[1];
  E.fadeOut(tl, cnt, T(b2), 0.25, -16);
  E.fadeOut(tl, q(".s51-legend"), T(b2), 0.25, -16);
  const req = q(".s51-req");
  tl.fromTo(req, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.22));
  tl.fromTo(req, { x: 24, scale: 0.94 }, A({ x: 0, scale: 1, duration: 0.6, ease: E.SPRING }), T(b2 + 0.22));
  qa(".s51-tile.i").forEach((tile) => {
    tl.fromTo(tile, { opacity: 1 }, A({ opacity: 0.2, duration: 0.4, ease: "power2.out" }), T(b2 + 0.3 + (+tile.dataset.c) * 0.03));
  });
  const ring = q(".s51-ring"), p0 = tileXY(c.scan[0]);
  tl.fromTo(ring, { opacity: 0, scale: 1.25 }, A({ opacity: 1, scale: 1, duration: 0.3, ease: E.SPRING }), T(b2 + 0.3));
  let th = b2 + 0.45;
  for (let k = 1; k < c.scan.length; k++) {
    const a0 = tileXY(c.scan[k - 1]), a1 = tileXY(c.scan[k]);
    tl.fromTo(ring, { x: a0.x - p0.x, y: a0.y - p0.y }, A({ x: a1.x - p0.x, y: a1.y - p0.y, duration: 0.14, ease: "power2.inOut" }), T(th));
    th += 0.15;
  }
  const hero = q(".s51-hero"), hok = q(".s51-hok"), tL = th;
  const hc = { x: hero.offsetLeft + hero.offsetWidth / 2, y: hero.offsetTop + hero.offsetHeight / 2 };
  tl.fromTo(hero, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(tL));
  tl.fromTo(hero, { scale: 1 }, A({ scale: 1.14, duration: 0.55, ease: E.SPRING }), T(tL));
  tl.fromTo(q(".s51-hglow"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(tL));
  tl.fromTo(ring, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(tL + 0.05));
  tl.fromTo(hok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(tL + 0.1));
  E.draw(tl, q(".s51-hok path"), T(tL + 0.14), 0.3);
  E.burst(tl, root, hc.x, hc.y, T(tL + 0.05), { n: 10, seed: 51, r0: 52, r1: 110, color: "#c9c2ff" });
  tl.fromTo(q(".s51-lead"), { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.25, ease: "power2.out" }), T(tL + 0.08));
  tl.fromTo(q(".s51-fitl"), { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(tL + 0.15));

  // B3 "ובודק כמה קרדיטים הוא יעלה": the chosen model steps forward, Claude asks get_cost,
  // the price tag rolls to the credits (the camera punches in on the tag)
  const b3 = P[2];
  tl.fromTo(q(".s51-hubwrap"), { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power1.inOut" }), T(b3));
  E.fadeOut(tl, req, T(b3), 0.3, -16);
  E.fadeOut(tl, q(".s51-fit"), T(b3), 0.3, -16);
  tl.fromTo(hok, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b3));
  tl.fromTo(hero, { x: 0, y: 0, scale: 1.14 }, A({ x: 400 - hc.x, y: 170 - hc.y, scale: 1.9, duration: 0.6, ease: E.SPRING }), T(b3 + 0.15));
  E.fadeIn(tl, q(".s51-name"), T(b3 + 0.4), 0.45, 12);
  E.draw(tl, q(".s51-conn line"), T(b3 + 0.45), 0.3);
  const gc = q(".s51-gc"), tag = q(".s51-tag");
  tl.fromTo(gc, { opacity: 0, y: -12 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b3 + 0.5));
  tl.fromTo(tag, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(b3 + 0.6));
  tl.fromTo(tag, { scale: 0.92, y: 14 }, A({ scale: 1, y: 0, duration: 0.6, ease: E.SPRING }), T(b3 + 0.6));
  E.draw(tl, q(".s51-tago path"), T(b3 + 0.6), 0.55);
  roll(q(".s51-pnum"), T(b3 + 0.65), 0.7);
  E.sweep(tl, q(".s51-price"), T(b3 + 1.2), 0.7, { color: "rgba(255, 255, 255, 0.2)" });
  E.burst(tl, root, tag.offsetLeft + 221, tag.offsetTop + 75, T(b3 + 1.2), { n: 12, seed: 52, r0: 120, r1: 175, color: "#c9c2ff" });

  // payoff: the five connection steps, built one by one (the cursor clicks, the fields fill)
  const tX = pe + 0.15;
  tl.fromTo(hero, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(tX));
  E.fadeOut(tl, q(".s51-name"), T(tX), 0.3, -20);
  E.fadeOut(tl, gc, T(tX), 0.3, -20);
  E.fadeOut(tl, tag, T(tX), 0.3, -20);
  tl.fromTo(q(".s51-conn"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(tX));

  const rows = qa(".s51-row"), sT = (k) => pe + c.steps0 + k * c.stepGap;
  rows.forEach((row, k) => {
    const t = T(sT(k)), bd = E.q(".s51-bd", row), ok = E.q(".s51-ok", row);
    tl.fromTo(row, { opacity: 0 }, A({ opacity: 1, duration: 0.25, ease: "power1.out" }), t);
    tl.fromTo(row, { rotationX: -55, y: -18, transformPerspective: 900 }, A({ rotationX: 0, y: 0, transformPerspective: 900, duration: 0.6, ease: E.SPRING }), t);
    tl.fromTo(bd, { scale: 0.5 }, A({ scale: 1, duration: 0.5, ease: "back.out(2)" }), t + 0.1);
    // the step's number gives way to the check inside the same ring
    tl.fromTo(E.q("b", bd), { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 0.6, duration: 0.18, ease: "power2.in" }), t + 0.7);
    tl.fromTo(ok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), t + 0.78);
    E.draw(tl, E.q(".s51-ok path", row), t + 0.82, 0.28);
    tl.fromTo(bd, { borderColor: "rgba(201, 194, 255, 0.6)" }, A({ borderColor: "rgba(255, 255, 255, 0.95)", duration: 0.3 }), t + 0.78);
  });
  // the cursor visits the buttons (positions measured once, before any tween moves things)
  const cur = q(".s51-cur");
  const at = (sel, fx, fy) => {
    const el = q(sel), o = E.off(el, root);
    return { x: o.x + el.offsetWidth * fx, y: o.y + el.offsetHeight * fy };
  };
  const pts = {
    a: at(".s51-c1a", 0.55, 0.62), b: at(".s51-c1b", 0.5, 0.62), c: at(".s51-c2a", 0.55, 0.62), d: at(".s51-c2b", 0.5, 0.62),
    e: at(".s51-fname", 0.8, 0.62), f: at(".s51-c4a", 0.5, 0.62), g: at(".s51-c4b", 0.5, 0.62),
  };
  cur.style.left = pts.a.x - 3 + "px";
  cur.style.top = pts.a.y - 2 + "px";
  let last = pts.a;
  const move = (p, t, d) => {
    tl.fromTo(cur, { x: last.x - pts.a.x, y: last.y - pts.a.y }, A({ x: p.x - pts.a.x, y: p.y - pts.a.y, duration: d || 0.24, ease: "power2.inOut" }), T(t));
    last = p;
  };
  const ripple = (p, t) => {
    const r = document.createElement("i");
    r.className = "s51-rip";
    r.style.left = p.x + "px";
    r.style.top = p.y + "px";
    root.appendChild(r);
    tl.fromTo(r, { opacity: 1, scale: 0.3 }, A({ opacity: 0, scale: 1.7, duration: 0.5, ease: "power2.out" }), T(t));
  };
  const press = (sel, t) => {
    const el = q(sel);
    tl.fromTo(el, { backgroundColor: "rgba(44, 38, 90, 0.92)", color: "#ece9f7" }, A({ backgroundColor: "rgba(214, 208, 255, 0.96)", color: "#15122e", duration: 0.12 }), T(t));
    tl.fromTo(el, { backgroundColor: "rgba(214, 208, 255, 0.96)", color: "#15122e" }, A({ backgroundColor: "rgba(201, 194, 255, 0.24)", color: "#ffffff", duration: 0.4 }), T(t + 0.22));
    tl.fromTo(el, { scale: 1 }, A({ scale: 0.93, duration: 0.08, ease: "power1.out" }), T(t));
    tl.fromTo(el, { scale: 0.93 }, A({ scale: 1, duration: 0.35, ease: "back.out(2)" }), T(t + 0.08));
  };
  const click = (sel, p, t) => { ripple(p, t); press(sel, t); };

  // 1. claude.ai or the app: Customize, then Connectors
  const s1 = sT(0);
  tl.fromTo(cur, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(s1 + 0.24));
  tl.fromTo(q(".s51-gear"), { rotation: 0 }, A({ rotation: 90, duration: 0.9, ease: E.SPRING }), T(s1 + 0.3));
  click(".s51-c1a", pts.a, s1 + 0.36);
  move(pts.b, s1 + 0.44, 0.2);
  click(".s51-c1b", pts.b, s1 + 0.66);
  // 2. the plus, then Add custom connector
  const s2 = sT(1);
  move(pts.c, s2 + 0.05);
  click(".s51-c2a", pts.c, s2 + 0.31);
  const acc = q(".s51-c2b");
  tl.fromTo(acc, { opacity: 0, y: -10 }, A({ opacity: 1, y: 0, duration: 0.3, ease: E.SPRING }), T(s2 + 0.36));
  move(pts.d, s2 + 0.42, 0.2);
  click(".s51-c2b", pts.d, s2 + 0.64);
  // 3. the name is typed, the address is pasted
  const s3 = sT(2);
  move(pts.e, s3 + 0.05, 0.22);
  ripple(pts.e, s3 + 0.28);
  const fn = q(".s51-fname"), fnT = E.q(".s51-typed", fn), fnC = E.q(".s51-caret", fn);
  const n1 = fnT.textContent.length, w1 = fnT.offsetWidth;
  tl.fromTo(fnC, { opacity: 0 }, A({ opacity: 1, duration: 0.08 }), T(s3 + 0.28));
  tl.fromTo(fnT, { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.3, ease: "steps(" + n1 + ")" }), T(s3 + 0.3));
  tl.fromTo(fnC, { x: 0 }, A({ x: w1, duration: 0.3, ease: "steps(" + n1 + ")" }), T(s3 + 0.3));
  tl.fromTo(fnC, { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), T(s3 + 0.6));
  const fu = q(".s51-furl"), fuT = E.q(".s51-typed", fu), sel = E.q(".s51-sel", fu);
  tl.fromTo(fuT, { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.14, ease: "power1.out" }), T(s3 + 0.6));
  tl.fromTo(sel, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(s3 + 0.6));
  tl.fromTo(sel, { opacity: 1 }, A({ opacity: 0, duration: 0.5, ease: "power2.out" }), T(s3 + 0.9));
  E.sweep(tl, fu, T(s3 + 0.62), 0.5, { color: "rgba(255, 255, 255, 0.25)" });
  // 4. Add, then Connect: the account connects
  const s4 = sT(3);
  move(pts.f, s4 + 0.05);
  click(".s51-c4a", pts.f, s4 + 0.31);
  move(pts.g, s4 + 0.38, 0.2);
  click(".s51-c4b", pts.g, s4 + 0.6);
  const acct = q(".s51-acct"), aok = q(".s51-aok");
  tl.fromTo(aok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(s4 + 0.66));
  E.draw(tl, q(".s51-aok path"), T(s4 + 0.7), 0.28);
  const ao = E.off(acct, root);
  E.burst(tl, root, ao.x + 32, ao.y + 32, T(s4 + 0.66), { n: 10, seed: 54, r0: 38, r1: 66, color: "#c9c2ff" });
  // 5. no API key; it shows up in Claude Code by itself, checked with /mcp
  const s5 = sT(4);
  tl.fromTo(cur, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(s5 + 0.05));
  E.draw(tl, q(".s51-kx"), T(s5 + 0.22), 0.3);
  const cmd = q(".s51-tcmd");
  tl.fromTo(cmd, { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.24, ease: "steps(" + cmd.textContent.length + ")" }), T(s5 + 0.3));
  const tl2 = q(".s51-tl2"), dot = q(".s51-tdot");
  tl.fromTo(tl2, { opacity: 0, x: -10 }, A({ opacity: 1, x: 0, duration: 0.35, ease: E.SPRING }), T(s5 + 0.6));
  tl.fromTo(dot, { scale: 1 }, A({ scale: 1.7, duration: 0.2, ease: "power2.out" }), T(s5 + 0.7));
  tl.fromTo(dot, { scale: 1.7 }, A({ scale: 1, duration: 0.35, ease: "power2.inOut" }), T(s5 + 0.9));
  // all five done: one calm light pass over the steps
  rows.forEach((row, k) => E.sweep(tl, row, T(s5 + 1.0 + k * 0.08), 0.7, { color: "rgba(201, 194, 255, 0.16)" }));
};
