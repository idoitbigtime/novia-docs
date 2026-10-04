window.SIMS = window.SIMS || {};
/* Chapter 0: the hook. Every flash is a one-frame cut with its own bouncy zoom (the guide's spring). */
window.SIMS.hook = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, T = cfg.T;
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const t = (x) => S + x;
  E.band(tl, sc, t(0));
  // 1. the question, and a clock racing through an evening
  const clock = q(".hk-clock");
  tl.fromTo(clock, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.6, ease: E.SPRING }), t(0.05));
  tl.fromTo(q(".hk-mh"), { rotation: 0, svgOrigin: "120 120" }, A({ rotation: 360 * 3, svgOrigin: "120 120", duration: 1.5, ease: "power1.inOut" }), t(0.15));
  tl.fromTo(q(".hk-trail"), { opacity: 0, rotation: 0, svgOrigin: "120 120" }, A({ opacity: 1, rotation: 360 * 3, svgOrigin: "120 120", duration: 1.5, ease: "power1.inOut" }), t(0.15));
  tl.fromTo(q(".hk-trail"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), t(1.6));
  tl.fromTo(q(".hk-hh"), { rotation: 0, svgOrigin: "120 120" }, A({ rotation: 120, svgOrigin: "120 120", duration: 1.5, ease: "power1.inOut" }), t(0.15));
  E.kin(tl, q(".hk-q"), S, { dy: 22 });
  // the evening of manual work: the timeline fills with cuts and crooked captions, the playhead scrubs back and forth
  const tln = q(".hk-tline");
  tl.fromTo(tln, { opacity: 0, y: 30 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), t(0.45));
  qa(".hk-tc").forEach((c, i) => tl.fromTo(c, { scaleX: 0 }, A({ scaleX: 1, duration: 0.3, ease: "power2.out" }), t(0.55 + i * 0.05)));
  qa(".hk-cb").forEach((c, i) => tl.fromTo(c, { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.25 }), t(0.9 + i * 0.08)));
  qa(".hk-cm").forEach((c, i) => tl.fromTo(c, { scaleY: 0 }, A({ scaleY: 1, duration: 0.2 }), t(1.1 + i * 0.07)));
  const ph = q(".hk-ph");
  tl.fromTo(ph, { x: 0 }, A({ x: 700, duration: 0.7, ease: "power1.inOut" }), t(0.6));
  tl.fromTo(ph, { x: 700 }, A({ x: 180, duration: 0.5, ease: "power1.inOut" }), t(1.3));
  tl.fromTo(ph, { x: 180 }, A({ x: 520, duration: 0.5, ease: "power1.inOut" }), t(1.8));
  const qw = q(".hk-qwrap");
  tl.fromTo(qw, { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 1.06, duration: 0.25, ease: "power2.in" }), t(T.f0 - 0.27));
  // 2. the promise and six flashes
  E.kin(tl, q(".hk-prom"), S, { dy: 14 });
  const fl = qa(".hk-f");
  fl.forEach((f, i) => {
    const a = T.f0 + i * T.fstep, b = a + T.fstep;
    tl.set(f, { opacity: 1 }, t(a));
    if (i < fl.length - 1) tl.set(f, { opacity: 0 }, t(b));
    tl.fromTo(E.q(".hk-fin", f), { scale: 1 }, A({ scale: 1.09, duration: T.fstep, ease: E.SPRING }), t(a));
    E.pill(tl, q("#hk-p" + i), t(a), i < fl.length - 1 ? t(b) : null);
  });
  const f = (i) => T.f0 + i * T.fstep;
  // F1: the silences are cut and the speech closes up
  qa(".hk-gap").forEach((g) => tl.fromTo(g, { opacity: 1, scaleX: 1 }, A({ opacity: 0, scaleX: 0, duration: 0.22, ease: "power2.in" }), t(f(0) + 0.18)));
  tl.fromTo(q(".hk-seg1"), { x: 0 }, A({ x: -70, duration: 0.3, ease: E.SPRING }), t(f(0) + 0.2));
  tl.fromTo(q(".hk-seg2"), { x: 0 }, A({ x: -140, duration: 0.3, ease: E.SPRING }), t(f(0) + 0.2));
  qa(".hk-cut").forEach((c) => tl.fromTo(c, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), t(f(0) + 0.42)));
  // F3: the cube turns over the palm
  tl.fromTo(q(".hk-cubewrap"), { rotationY: 0, y: 14 }, A({ rotationY: 80, y: -6, duration: T.fstep, ease: "power1.out" }), t(f(2)));
  // F4: the b-roll slides over the speaker and plays
  tl.fromTo(q(".hk-clip"), { x: 380, opacity: 0 }, A({ x: 0, opacity: 1, duration: 0.32, ease: E.SPRING }), t(f(3) + 0.05));
  tl.fromTo(q(".hk-bar b"), { scaleX: 0.05 }, A({ scaleX: 0.6, duration: 0.45, ease: "none" }), t(f(3) + 0.15));
  // F5: the email is found and blurred
  tl.fromTo(q(".hk-mbox"), { opacity: 0, scale: 1.12 }, A({ opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" }), t(f(4) + 0.05));
  tl.fromTo(q(".hk-mail"), { filter: "blur(0px)" }, A({ filter: "blur(9px)", duration: 0.25, ease: "power2.out" }), t(f(4) + 0.28));
  // F6: the small draft is approved
  E.draw(tl, q(".hk-small .hk-ck path"), t(f(5) + 0.15), 0.3);
  // flashes and pills end with the promise
  const tEnd = T.f0 + 6 * T.fstep;
  tl.set(fl[fl.length - 1], { opacity: 0 }, t(tEnd));
  tl.set(q("#hk-p" + (fl.length - 1)), { opacity: 0 }, t(tEnd));
  E.fadeOut(tl, q(".hk-prom"), t(tEnd - 0.2), 0.2, -10);
  // 3. ask in Hebrew, approve every step
  E.kin(tl, q(".hk-sent"), S, { dy: 18 });
  const bub = q(".hk-bubble");
  tl.fromTo(bub, { opacity: 0, y: 30, scale: 0.9 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: E.SPRING }), t(T.sent + 0.02));
  qa(".hk-bubble i").forEach((l, i) => tl.fromTo(l, { scaleX: 0 }, A({ scaleX: 1, duration: 0.35, ease: "power2.out" }), t(T.sent + 0.45 + i * 0.12)));
  qa(".hk-step").forEach((st, i) => {
    const a = T.sent + 0.95 + i * 0.3;
    tl.fromTo(st, { opacity: 0, y: 24 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), t(a));
    E.draw(tl, E.q(".hk-ck path", st), t(a + 0.25), 0.3);
    tl.fromTo(st, { borderColor: "rgba(201, 194, 255, 0.3)" }, A({ borderColor: "rgba(201, 194, 255, 0.9)", duration: 0.3 }), t(a + 0.25));
  });
  E.fadeOut(tl, q(".hk-sentwrap"), t(T.title - 0.12), 0.28, -16);
  // 4. title
  E.band(tl, sc, t(T.title - 0.05));
  E.kin(tl, q(".hk-tt"), S, { dy: 26 });
  qa(".hk-ring").forEach((r, i) => tl.fromTo(r, { scale: 0.5, opacity: 0.9 }, A({ scale: 1.7 + i * 0.3, opacity: 0, duration: 1.2 + i * 0.2, ease: "power2.out" }), t(T.title + 0.05 + i * 0.12)));
  E.burst(tl, q(".hk-title"), 400, 150, t(T.title + 0.1), { n: 20, seed: 9, r0: 160, r1: 360, color: "#c9c2ff" });
  const badge = q(".hk-badge");
  tl.fromTo(badge, { opacity: 0, scale: 0.8, y: 20 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.6, ease: E.SPRING }), t(T.title + 0.9));
  E.sweep(tl, badge, t(T.title + 1.25), 0.7, { color: "rgba(255, 255, 255, 0.35)" });
  E.fadeOut(tl, q(".hk-title"), t(cfg.D - 0.32), 0.3, -10);
  E.debug.scenes[cfg.id] = { S, D: cfg.D, type: "custom" };
};
