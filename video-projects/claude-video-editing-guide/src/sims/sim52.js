window.SIMS = window.SIMS || {};
window.SIMS.sim52 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim52, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim52");
  const wal = q(".s52-wal"), cells = qa(".s52-cell"), fills = qa(".s52-cell b");
  // where coins go in and out of the wallet (its top edge, measured once)
  const mouth = { x: wal.offsetLeft + wal.offsetWidth / 2, y: wal.offsetTop + 44 };
  const coin = (x, y) => {
    const el = document.createElement("i");
    el.className = "s52-coin";
    el.style.left = x + "px";
    el.style.top = y + "px";
    root.appendChild(el);
    return el;
  };
  // an arc: x eases across, y rises to `lift` then falls to dy
  const fly = (el, dx, dy, lift, t, d) => {
    tl.fromTo(el, { x: 0 }, A({ x: dx, duration: d, ease: "power1.inOut" }), t);
    tl.fromTo(el, { y: 0 }, A({ y: lift, duration: d / 2, ease: "power2.out" }), t);
    tl.fromTo(el, { y: lift }, A({ y: dy, duration: d / 2, ease: "power2.in" }), t + d / 2);
  };
  const center = (el) => { const o = E.off(el, root); return { x: o.x + el.offsetWidth / 2, y: o.y + el.offsetHeight / 2 }; };

  // B0 establishing shot: the wallet draws on, its balance cells wait empty
  const t0 = cfg.tStage;
  E.draw(tl, q(".s52-wbody"), T(t0 + 0.05), 0.8);
  tl.fromTo(q(".s52-wfill"), { opacity: 0 }, A({ opacity: 1, duration: 0.5 }), T(t0 + 0.3));
  E.draw(tl, q(".s52-wtabl"), T(t0 + 0.4), 0.4);
  tl.fromTo(q(".s52-wname"), { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(t0 + 0.45));
  cells.forEach((cl, i) => tl.fromTo(cl, { opacity: 0, y: 8 }, A({ opacity: 1, y: 0, duration: 0.35, ease: E.SPRING }), T(t0 + 0.3 + i * 0.03)));
  E.fadeIn(tl, q(".s52-bal"), T(t0 + 0.45), 0.4, 8);

  // B1 "ב-fal אין מנוי חובה": a monthly subscription is struck out
  const b1 = P[0], sub = q(".s52-sub");
  tl.fromTo(sub, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 0.05));
  tl.fromTo(sub, { x: -24, rotationY: 16, transformPerspective: 900 }, A({ x: 0, rotationY: 0, transformPerspective: 900, duration: 0.6, ease: E.SPRING }), T(b1 + 0.05));
  qa(".s52-subr").forEach((r, i) => tl.fromTo(r, { opacity: 0, x: 16 }, A({ opacity: 1, x: 0, duration: 0.35, ease: E.SPRING }), T(b1 + 0.22 + i * 0.1)));
  E.draw(tl, q(".s52-strike path"), T(b1 + 0.72), 0.3, "power2.in");
  E.glitch(tl, sub, T(b1 + 0.95), 10);
  const xb = q(".s52-x");
  tl.fromTo(xb, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b1 + 0.95));
  qa(".s52-x path").forEach((p, i) => E.draw(tl, p, T(b1 + 1.0 + i * 0.12), 0.22));
  E.dim(tl, q(".s52-subh"), T(b1 + 1.15), 0.45);
  qa(".s52-subr").forEach((r) => E.dim(tl, r, T(b1 + 1.15), 0.45));

  // B2 "קונים קרדיטים מראש בדשבורד החיובים": the billing dashboard's button sends coins into the wallet
  const b2 = P[1], dash = q(".s52-dash"), buy = q(".s52-buy");
  E.fadeOut(tl, sub, T(b2), 0.25, -20);
  tl.fromTo(dash, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.2));
  tl.fromTo(dash, { y: 22, scale: 0.96 }, A({ y: 0, scale: 1, duration: 0.6, ease: E.SPRING }), T(b2 + 0.2));
  qa(".s52-chart i").forEach((b, i) => tl.fromTo(b, { scaleY: 0.1 }, A({ scaleY: 1, duration: 0.5, ease: E.SPRING }), T(b2 + 0.28 + i * 0.04)));
  tl.fromTo(buy, { scale: 1 }, A({ scale: 0.92, duration: 0.1, ease: "power1.out" }), T(b2 + 0.5));
  tl.fromTo(buy, { scale: 0.92 }, A({ scale: 1, duration: 0.4, ease: "back.out(2.2)" }), T(b2 + 0.6));
  E.sweep(tl, buy, T(b2 + 0.52), 0.55, { color: "rgba(255, 255, 255, 0.75)" });
  const bc = center(buy);
  for (let k = 0; k < 5; k++) {
    const el = coin(bc.x, bc.y), t = T(b2 + 0.55 + k * 0.09), d = 0.5;
    tl.fromTo(el, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.15 }), t);
    fly(el, mouth.x - bc.x, mouth.y - bc.y, Math.min(0, mouth.y - bc.y) - 70, t, d);
    tl.fromTo(el, { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 0.55, duration: 0.12, ease: "power1.in" }), t + d - 0.04);
    [2 * k, 2 * k + 1].forEach((j, m) => {
      tl.fromTo(fills[j], { opacity: 0, scaleY: 0.2 }, A({ opacity: 1, scaleY: 1, duration: 0.3, ease: "back.out(2)" }), t + d + m * 0.05);
    });
  }
  const tFull = b2 + 0.55 + 4 * 0.09 + 0.5;
  tl.fromTo(wal, { scale: 1 }, A({ scale: 1.05, duration: 0.12, ease: "power1.out" }), T(tFull));
  tl.fromTo(wal, { scale: 1.05 }, A({ scale: 1, duration: 0.45, ease: E.SPRING }), T(tFull + 0.12));

  // B3 "וכל תוצאה שיצאה בהצלחה יורדת מהיתרה": a result renders and comes out; one coin of the balance pays for it
  const b3 = P[2], res = q(".s52-res");
  E.fadeOut(tl, dash, T(b3), 0.25, -20);
  tl.fromTo(res, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 0.2));
  tl.fromTo(res, { y: 22, scale: 0.96 }, A({ y: 0, scale: 1, duration: 0.6, ease: E.SPRING }), T(b3 + 0.2));
  E.draw(tl, q(".s52-rp"), T(b3 + 0.32), 0.62, "power1.inOut");
  tl.fromTo(q(".s52-ring"), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b3 + 0.98));
  tl.fromTo(q(".s52-gen"), { opacity: 1 }, A({ opacity: 0, duration: 0.35, ease: "power2.out" }), T(b3 + 0.96));
  E.sweep(tl, q(".s52-thumb"), T(b3 + 1.0), 0.6, { color: "rgba(255, 255, 255, 0.35)" });
  const rok = q(".s52-rok"), thc = center(q(".s52-thumb"));
  tl.fromTo(rok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b3 + 1.0));
  E.draw(tl, q(".s52-rok path"), T(b3 + 1.05), 0.3);
  E.burst(tl, root, thc.x, thc.y, T(b3 + 1.0), { n: 12, seed: 61, r0: 95, r1: 150, color: "#c9c2ff" });
  E.fadeIn(tl, q(".s52-resl"), T(b3 + 1.05), 0.45, 12);
  const resl = q(".s52-resl span"), ro = E.off(resl, root);
  const pay = { x: ro.x - 34, y: ro.y + resl.offsetHeight / 2 };
  const pc = coin(mouth.x, mouth.y), tp = T(b3 + 1.25);
  tl.fromTo(pc, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 0.85, duration: 0.15 }), tp);
  fly(pc, pay.x - mouth.x, pay.y - mouth.y, -60, tp, 0.5);
  tl.fromTo(fills[9], { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), tp);
  tl.fromTo(cells[9], { borderColor: "rgba(201, 194, 255, 0.34)" }, A({ borderColor: "rgba(255, 255, 255, 0.95)", duration: 0.12 }), tp);
  tl.fromTo(cells[9], { borderColor: "rgba(255, 255, 255, 0.95)" }, A({ borderColor: "rgba(201, 194, 255, 0.34)", duration: 0.5 }), tp + 0.15);

  // B4 "על שגיאה של השרת או על המתנה בתור לא משלמים": the server fails, the queue waits;
  // their coins come back to the wallet, and the stamp says it (the camera punches in on it)
  const b4 = P[3], ca = q(".s52-ca"), cb = q(".s52-cb"), st = q(".s52-stamp");
  E.fadeOut(tl, res, T(b4), 0.25, -20);
  tl.fromTo(pc, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b4));
  tl.fromTo(ca, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b4 + 0.18));
  tl.fromTo(ca, { x: -26 }, A({ x: 0, duration: 0.55, ease: E.SPRING }), T(b4 + 0.18));
  tl.fromTo(cb, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b4 + 0.3));
  tl.fromTo(cb, { x: -26 }, A({ x: 0, duration: 0.55, ease: E.SPRING }), T(b4 + 0.3));
  const warn = q(".s52-warn");
  tl.fromTo(warn, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b4 + 0.5));
  E.draw(tl, q(".s52-warn path"), T(b4 + 0.55), 0.25);
  E.glitch(tl, q(".s52-ca .s52-ico"), T(b4 + 0.5), 8);
  const hg = q(".s52-hg");
  tl.fromTo(hg, { rotation: 0 }, A({ rotation: 180, duration: 0.6, ease: "power2.inOut" }), T(b4 + 0.62));
  tl.fromTo(hg, { rotation: 180 }, A({ rotation: 360, duration: 0.6, ease: "power2.inOut" }), T(b4 + 1.9));
  qa(".s52-q i").forEach((b, i) => {
    tl.fromTo(b, { x: 0 }, A({ x: -28, duration: 0.45, ease: E.SPRING }), T(b4 + 0.95 + i * 0.04));
    tl.fromTo(b, { x: -28 }, A({ x: -56, duration: 0.45, ease: E.SPRING }), T(b4 + 1.95 + i * 0.04));
  });
  // the stamp lands with the accent
  tl.fromTo(st, { opacity: 0 }, A({ opacity: 1, duration: 0.14 }), T(b4 + 0.58));
  tl.fromTo(st, { scale: 1.4, rotation: -14 }, A({ scale: 1, rotation: -6, duration: 0.5, ease: "back.out(1.6)" }), T(b4 + 0.58));
  const stc = center(st);
  E.burst(tl, root, stc.x, stc.y, T(b4 + 0.86), { n: 14, seed: 63, r0: 130, r1: 150, color: "#c9c2ff" });
  // each failed call: a coin heads out of the wallet to the card, bumps, and goes back in
  [ca, cb].forEach((card, i) => {
    const co = E.off(card, root), tx = co.x + card.offsetWidth + 6, ty = co.y + card.offsetHeight / 2;
    const el = coin(mouth.x, mouth.y), t = T(b4 + 1.0 + i * 0.42);
    const dx = Math.round(tx - mouth.x), dy = Math.round(ty - mouth.y), lift = Math.min(0, dy) - 40;
    tl.fromTo(el, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 0.85, duration: 0.15 }), t);
    fly(el, dx, dy, lift, t, 0.44);
    const sh = [dx, dx + 14, dx - 4, dx + 6];
    for (let k = 1; k < sh.length; k++) tl.fromTo(el, { x: sh[k - 1] }, A({ x: sh[k], duration: 0.07, ease: "power1.out" }), t + 0.44 + (k - 1) * 0.07);
    tl.fromTo(el, { x: dx + 6, y: dy }, A({ x: 0, y: 0, duration: 0.5, ease: "power2.inOut" }), t + 0.68);
    tl.fromTo(el, { opacity: 1, scale: 0.85 }, A({ opacity: 0, scale: 0.5, duration: 0.15 }), t + 1.08);
  });
  // the balance did not move
  E.sweep(tl, q(".s52-meter"), T(b4 + 2.3), 0.7, { color: "rgba(255, 255, 255, 0.35)" });

  // B5 "והקרדיטים תקפים לשנה": a year calendar fills month by month
  const b5 = P[4], cal = q(".s52-cal");
  E.fadeOut(tl, ca, T(b5), 0.25, -20);
  E.fadeOut(tl, cb, T(b5), 0.25, -20);
  tl.fromTo(st, { opacity: 1 }, A({ opacity: 0, duration: 0.25, ease: "power2.in" }), T(b5));
  tl.fromTo(cal, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b5 + 0.2));
  tl.fromTo(cal, { rotationX: -50, y: -16, transformPerspective: 1000 }, A({ rotationX: 0, y: 0, transformPerspective: 1000, duration: 0.65, ease: E.SPRING }), T(b5 + 0.2));
  qa(".s52-mo b").forEach((m, i) => tl.fromTo(m, { opacity: 0 }, A({ opacity: 1, duration: 0.18 }), T(b5 + 0.42 + i * 0.045)));
  const calok = q(".s52-calok");
  tl.fromTo(calok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b5 + 0.98));
  E.draw(tl, q(".s52-calok path"), T(b5 + 1.02), 0.3);
  E.sweep(tl, q(".s52-meter"), T(b5 + 1.0), 0.6, { color: "rgba(255, 255, 255, 0.3)" });

  // payoff: the connection steps. Claude Code adds the server, /mcp connects with no API key,
  // the reopen hint, and claude.ai adds it as a connector like Higgsfield
  E.fadeOut(tl, cal, T(pe + 0.02), 0.3, -20);
  tl.fromTo(q(".s52-walu"), { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(pe + 0.02));
  const tT = pe + c.tTerm, term = q(".s52-term");
  tl.fromTo(term, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(tT));
  tl.fromTo(term, { rotationX: -40, y: -8, transformPerspective: 1100 }, A({ rotationX: 0, y: 0, transformPerspective: 1100, duration: 0.65, ease: E.SPRING }), T(tT));
  const stepIn = (el, t) => {
    tl.fromTo(el, { opacity: 0, x: 18 }, A({ opacity: 1, x: 0, duration: 0.45, ease: E.SPRING }), T(t));
    const n = E.q(".s52-n", el);
    if (n) tl.fromTo(n, { scale: 0.5 }, A({ scale: 1, duration: 0.45, ease: "back.out(2)" }), T(t + 0.05));
  };
  const okIn = (el, t) => {
    tl.fromTo(el, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(t));
    E.draw(tl, E.q("path", el), T(t + 0.04), 0.28);
  };
  // 1. ask Claude to add the server: the address is pasted
  stepIn(q(".s52-st1"), tT + 0.25);
  const ty = q(".s52-typed"), sel = q(".s52-sel");
  tl.fromTo(ty, { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.15, ease: "power1.out" }), T(tT + 0.62));
  tl.fromTo(sel, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(tT + 0.62));
  tl.fromTo(sel, { opacity: 1 }, A({ opacity: 0, duration: 0.5, ease: "power2.out" }), T(tT + 0.92));
  E.sweep(tl, q(".s52-in"), T(tT + 0.65), 0.55, { color: "rgba(255, 255, 255, 0.22)" });
  okIn(q(".s52-uok"), tT + 0.95);
  // 2. /mcp, connect, no API key
  stepIn(q(".s52-st2"), tT + 1.2);
  E.draw(tl, q(".s52-kx"), T(tT + 1.5), 0.3);
  tl.fromTo(q(".s52-out"), { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(tT + 1.4));
  const cmd = q(".s52-cmd");
  tl.fromTo(cmd, { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.26, ease: "steps(" + cmd.textContent.length + ")" }), T(tT + 1.5));
  const srv = q(".s52-srv");
  tl.fromTo(srv, { opacity: 0, x: -12 }, A({ opacity: 1, x: 0, duration: 0.4, ease: E.SPRING }), T(tT + 1.85));
  okIn(q(".s52-sok"), tT + 2.05);
  const sdot = q(".s52-sdot");
  tl.fromTo(sdot, { scale: 1 }, A({ scale: 1.7, duration: 0.2, ease: "power2.out" }), T(tT + 2.05));
  tl.fromTo(sdot, { scale: 1.7 }, A({ scale: 1, duration: 0.35, ease: "power2.inOut" }), T(tT + 2.25));
  // 3. if fal is missing: close and reopen in the same folder
  const tH = pe + c.tHint, hint = q(".s52-hint");
  tl.fromTo(hint, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(tH));
  tl.fromTo(hint, { x: 16 }, A({ x: 0, duration: 0.55, ease: E.SPRING }), T(tH));
  tl.fromTo(E.q(".s52-n", hint), { scale: 0.5 }, A({ scale: 1, duration: 0.45, ease: "back.out(2)" }), T(tH + 0.05));
  tl.fromTo(q(".s52-rarr"), { rotation: 0, svgOrigin: "40 40" }, A({ rotation: 360, svgOrigin: "40 40", duration: 1.0, ease: "power2.inOut" }), T(tH + 0.3));
  const fold = q(".s52-fold");
  tl.fromTo(fold, { scale: 1, svgOrigin: "40 43" }, A({ scale: 0.75, svgOrigin: "40 43", duration: 0.25, ease: "power2.in" }), T(tH + 0.45));
  tl.fromTo(fold, { scale: 0.75, svgOrigin: "40 43" }, A({ scale: 1, svgOrigin: "40 43", duration: 0.45, ease: "back.out(2.2)" }), T(tH + 0.75));
  // 4. claude.ai: added as a connector, like Higgsfield
  const tW = pe + c.tWeb, web = q(".s52-web");
  tl.fromTo(web, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(tW));
  tl.fromTo(web, { rotationX: -40, y: -14, transformPerspective: 1100 }, A({ rotationX: 0, y: 0, transformPerspective: 1100, duration: 0.6, ease: E.SPRING }), T(tW));
  stepIn(q(".s52-st4"), tW + 0.2);
  const ch2 = q(".s52-ch2");
  tl.fromTo(ch2, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }), T(tW + 0.55));
  const c2 = center(ch2);
  E.burst(tl, root, c2.x, c2.y - 6, T(tW + 0.6), { n: 10, seed: 65, r0: 34, r1: 44, color: "#c9c2ff" });
  okIn(E.q(".s52-cok", ch2), tW + 0.8);
  // all set: one calm light pass
  [term, hint, web].forEach((el, k) => E.sweep(tl, el, T(tW + 1.2 + k * 0.1), 0.75, { color: "rgba(201, 194, 255, 0.14)" }));
};
