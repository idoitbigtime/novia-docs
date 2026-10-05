window.SIMS = window.SIMS || {};
window.SIMS.sim24 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim24"), st = JSON.parse(root.dataset.st);
  const frame = q(".s24-frame"), wheel = q(".s24-wheel");
  // colour step of one item, in the frame and on its wheel dot (state i -> j)
  const fills = (scope, n) => E.qa(".c-" + n, scope);
  const recolor = (n, i, j, t, d) => {
    fills(frame, n).forEach((el) => tl.fromTo(el, { fill: st[n].c[i] }, A({ fill: st[n].c[j], duration: d, ease: "power2.inOut" }), t));
    const dot = q(".s24-dot-" + n);
    if (dot) tl.fromTo(dot, { backgroundColor: st[n].c[i] }, A({ backgroundColor: st[n].c[j], duration: d, ease: "power2.inOut" }), t);
  };
  const dotOut = (n, i, j, t, d) => tl.fromTo(q(".s24-dot-" + n), { y: -st[n].r[i] }, A({ y: -st[n].r[j], duration: d || 0.9, ease: E.SPRING }), t);
  const dotTurn = (n, i, j, t, d) => tl.fromTo(q(".s24-dw-" + n), { rotation: st[n].a[i] }, A({ rotation: st[n].a[j], duration: d || 1.0, ease: E.SPRING }), t);
  const popIn = (el, t, dy) => {
    tl.fromTo(el, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), t);
    tl.fromTo(el, { y: dy == null ? 10 : dy, scale: 0.9 }, A({ y: 0, scale: 1, duration: 0.55, ease: E.SPRING }), t);
  };
  const out = (el, t, d) => tl.fromTo(el, { opacity: 1 }, A({ opacity: 0, duration: d || 0.25, ease: "power2.in" }), t);

  // establishing shot: the frame at the right, the muted hue wheel at the left with the frame's colours as dots
  const t0 = cfg.tStage;
  tl.fromTo(frame, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(t0 + 0.05));
  tl.fromTo(frame, { scale: 0.94, rotationY: -16, transformPerspective: 1300 }, A({ scale: 1, rotationY: 0, transformPerspective: 1300, duration: 0.9, ease: E.SPRING }), T(t0 + 0.05));
  tl.fromTo(wheel, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(t0 + 0.15));
  tl.fromTo(wheel, { scale: 0.86, rotation: -40 }, A({ scale: 1, rotation: 0, duration: 1.0, ease: E.SPRING }), T(t0 + 0.15));
  ["wall", "tee", "plant", "skin", "black"].forEach((n, i) => {
    tl.fromTo(q(".s24-dot-" + n), { opacity: 0, scale: 0.3 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }), T(t0 + 0.45 + i * 0.06));
  });

  // B0 "קלוד מגביר את הצבעים ומושך לכיוון צבע המותג": the brand point; the colours get stronger
  const b0 = P[0], bdot = q(".s24-bdot"), bring = q(".s24-bring");
  tl.fromTo(bdot, { opacity: 0, scale: 0.3, svgOrigin: "0 -140" }, A({ opacity: 1, scale: 1, svgOrigin: "0 -140", duration: 0.5, ease: "back.out(2.2)" }), T(b0 + 0.05));
  [0.15, 0.75, 1.35].forEach((d) => tl.fromTo(bring, { opacity: 0.9, scale: 1, svgOrigin: "0 -140" }, A({ opacity: 0, scale: 2.1, svgOrigin: "0 -140", duration: 0.6, ease: "power2.out" }), T(b0 + d)));
  tl.fromTo(q(".s24-blead"), { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.3, ease: "power2.out" }), T(b0 + 0.2));
  popIn(q(".s24-bl"), T(b0 + 0.25));
  tl.fromTo(q(".s24-wh1"), { opacity: 0 }, A({ opacity: 1, duration: 0.9, ease: "power2.inOut" }), T(b0 + 0.55));
  ["wall", "tee", "plant"].forEach((n, i) => {
    recolor(n, 0, 1, T(b0 + 0.6 + i * 0.05), 0.9);
    dotOut(n, 0, 1, T(b0 + 0.6 + i * 0.05));
  });
  E.sweep(tl, frame, T(b0 + 0.65), 0.9, { color: "rgba(255, 255, 255, 0.18)" });

  // B1 "רק את מה שכבר קרוב אליו, כמו קיר או חולצה": arrows pull the nearby hues; the plant (far) stays
  const b1 = P[1], pa = qa(".s24-pa"), pah = qa(".s24-pah");
  pa.forEach((p, i) => E.draw(tl, p, T(b1 + 0.1 + i * 0.05), 0.65));
  pah.forEach((h) => tl.fromTo(h, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b1 + 0.7)));
  ["wall", "tee"].forEach((n, i) => {
    dotTurn(n, 1, 2, T(b1 + 0.75 + i * 0.08), 1.1);
    recolor(n, 1, 2, T(b1 + 0.75 + i * 0.08), 1.0);
  });
  const flWall = q(".s24-fl-wall"), flTee = q(".s24-fl-tee");
  popIn(flWall, T(b1 + 1.0));
  popIn(flTee, T(b1 + 1.15));
  out(flWall, T(P[2] - 0.3));
  out(flTee, T(P[2] - 0.3));
  pa.forEach((p) => E.dim(tl, p, T(P[2] - 0.25), 0.35, 1, 0.35));
  pah.forEach((h) => E.dim(tl, h, T(P[2] - 0.25), 0.35, 1, 0.35));

  // B2 "העור מקבל רק רבע מההגברה, עם תקרה": the protected wedge, the face, the quarter boost and its cap
  const b2 = P[2], wedge = q(".s24-wedge");
  tl.fromTo(wedge, { opacity: 0 }, A({ opacity: 1, duration: 0.45, ease: "power2.out" }), T(b2 + 0.05));
  popIn(q(".s24-t12"), T(b2 + 0.35), 0);
  popIn(q(".s24-t30"), T(b2 + 0.45), 0);
  const fring = q(".s24-fring");
  tl.fromTo(fring, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b2 + 0.15));
  E.draw(tl, E.q("ellipse", fring), T(b2 + 0.15), 0.6);
  const flSkin = q(".s24-fl-skin");
  popIn(flSkin, T(b2 + 0.35));
  // the meter: the colours grow to the full boost, the skin to a quarter, then the cap
  const mbase = q(".s24-mbase"), mb1 = q(".s24-mb1"), mb2 = q(".s24-mb2"), mg = q(".s24-mg"), mcap = q(".s24-mcap"), mct = q(".s24-mct");
  const mls = qa(".s24-ml");
  tl.fromTo(mbase, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.4, ease: "power2.out" }), T(b2 + 0.45));
  mls.forEach((l, i) => popIn(l, T(b2 + 0.5 + i * 0.08), 6));
  tl.fromTo(mb1, { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.6, ease: E.SPRING }), T(b2 + 0.6));
  tl.fromTo(mg, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.85));
  tl.fromTo(mb2, { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.45, ease: "back.out(1.6)" }), T(b2 + 1.0));
  tl.fromTo(mcap, { opacity: 0, scaleX: 0.3 }, A({ opacity: 1, scaleX: 1, duration: 0.35, ease: "back.out(2)" }), T(b2 + 1.2));
  popIn(mct, T(b2 + 1.3), 6);
  // on the wheel the skin dot moves a little and stops at its cap; the face warms only slightly
  const cap = q(".s24-cap");
  dotOut("skin", 2, 3, T(b2 + 1.0), 0.6);
  tl.fromTo(cap, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b2 + 1.2));
  E.draw(tl, cap, T(b2 + 1.2), 0.35);
  ["skin", "neck", "ear"].forEach((n) => recolor(n, 2, 3, T(b2 + 1.0), 0.6));
  // the beat's marks leave before the grey centre takes over
  [flSkin, mbase, mb1, mb2, mg, mcap, mct, ...mls].forEach((el) => out(el, T(P[3] - 0.25)));
  E.dim(tl, fring, T(P[3] - 0.25), 0, 1, 0.25);
  E.dim(tl, cap, T(P[3] - 0.25), 0.5, 1, 0.3);

  // B3 "וצבעים שכמעט אפורים לא זזים, כדי שחולצה שחורה לא תכחיל": the grey centre holds the black shirt
  const b3 = P[3], gring = q(".s24-gring"), glead = q(".s24-glead"), gl = q(".s24-gl"), flBlack = q(".s24-fl-black");
  tl.fromTo(gring, { opacity: 0, scale: 1.6, svgOrigin: "0 0" }, A({ opacity: 1, scale: 1, svgOrigin: "0 0", duration: 0.6, ease: E.SPRING }), T(b3 + 0.1));
  tl.fromTo(gring, { rotation: 0, svgOrigin: "0 0" }, A({ rotation: 90, svgOrigin: "0 0", duration: 2.6, ease: "none" }), T(b3 + 0.1));
  tl.fromTo(glead, { opacity: 1, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.4, ease: "power2.out" }), T(b3 + 0.35));
  popIn(gl, T(b3 + 0.5));
  const bdotB = q(".s24-dot-black");
  [0.75, 1.45].forEach((d) => {
    tl.fromTo(bdotB, { scale: 1 }, A({ scale: 1.4, duration: 0.2, ease: "power2.out" }), T(b3 + d));
    tl.fromTo(bdotB, { scale: 1.4 }, A({ scale: 1, duration: 0.35, ease: "power2.inOut" }), T(b3 + d + 0.2));
  });
  popIn(flBlack, T(b3 + 0.85));
  E.sweep(tl, frame, T(b3 + 1.0), 0.8, { color: "rgba(255, 255, 255, 0.12)" });

  // payoff: three strengths side by side; in the medium and the strong one the skin is the same
  const main = q(".s24-main");
  tl.fromTo(main, { opacity: 1, scale: 1 }, A({ opacity: 0, scale: 0.96, duration: 0.4, ease: "power2.in" }), T(pe + 0.05));
  const minis = qa(".s24-mini"), pls = qa(".s24-pl"), sws = qa(".s24-sw");
  minis.forEach((m, i) => {
    const t = T(pe + 0.5 + i * 0.12);
    tl.fromTo(m, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), t);
    tl.fromTo(m, { y: 34, rotationX: 14, transformPerspective: 1200 }, A({ y: 0, rotationX: 0, transformPerspective: 1200, duration: 0.8, ease: E.SPRING }), t);
    popIn(pls[i], T(pe + 0.8 + i * 0.1), 8);
    // each one gets its own push
    const tp = T(pe + 1.25 + i * 0.12);
    ["wall", "tee", "plant", "skin", "neck", "ear"].forEach((n) => {
      fills(m, n).forEach((el) => tl.fromTo(el, { fill: st[n].c[0] }, A({ fill: st[n].k[i], duration: 0.9, ease: "power2.inOut" }), tp));
    });
    E.sweep(tl, E.q(".s24-mframe", m), tp + 0.1, 0.8, { color: "rgba(255, 255, 255, 0.2)" });
    const sw = sws[i], swi = E.q("i", sw);
    tl.fromTo(sw, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }), T(pe + 1.9 + i * 0.1));
    tl.fromTo(swi, { backgroundColor: st.skin.c[0] }, A({ backgroundColor: st.skin.k[i], duration: 0.5 }), T(pe + 1.9 + i * 0.1));
  });
  E.draw(tl, q(".s24-eq path"), T(pe + 2.35), 0.5);
  const eqs = q(".s24-eqs");
  popIn(eqs, T(pe + 2.55), 0);
  // found: the skin is the same in the medium and the strong one
  E.burst(tl, q(".s24-pay"), eqs.offsetLeft + eqs.offsetWidth / 2, eqs.offsetTop + 20, T(pe + 2.6), { n: 10, seed: 24, r0: 24, r1: 56, color: "#c9c2ff" });
  E.kin(tl, q(".s24-pc"), S, { dy: 12 });
};
