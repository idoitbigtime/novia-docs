window.SIMS = window.SIMS || {};
window.SIMS.sim36 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim36, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const wrap = q(".simwrap.sim36"), n = c.cards, R = +wrap.dataset.r, ARCY = +wrap.dataset.arcy, ARCZ = +wrap.dataset.arcz;
  const ROW_DX = 92, TILT = -20, SPIN = 540;
  const arcA = (i) => 80 + i * 200 / (n - 1), orbA = (i) => 22.5 + i * 360 / n;
  const tilt = q(".s36-tilt"), arms = qa(".s36-arm"), bbs = qa(".s36-bb"), offs = qa(".s36-off"), cards = qa(".s36-card");
  const off = offs.map((o) => ({ x: +o.dataset.ox, y: +o.dataset.oy, z: +o.dataset.oz, slot: +o.dataset.slot }));

  // establishing: the room and you
  tl.fromTo(q(".s36-person"), { y: 18, opacity: 0 }, A({ y: 0, opacity: 1, duration: 0.7, ease: E.SPRING }), T(cfg.tStage + 0.1));

  // B1 "סרטונים שכבר הצליחו הם ההוכחה הכי טובה שאפשר לשים על המסך": eight cards fly in from the screen's edges into a row,
  // each shows its views (an eye and a bar, no numbers), they sort themselves (most viewed on the right) and #1 shines
  const b1 = P[0];
  offs.forEach((o, i) => {
    // the inner cards of each half start first, so the row fills from the middle of each edge's side
    const f = off[i], side = f.slot < n / 2 ? 1 : -1, k = side > 0 ? n / 2 - 1 - f.slot : f.slot - n / 2, t = T(b1 + 0.02 + k * 0.08);
    tl.fromTo(o, { x: f.x + side * 430, y: f.y, z: f.z }, A({ x: f.x, y: f.y, z: f.z, duration: 0.85, ease: E.SPRING }), t);
    tl.fromTo(cards[i], { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), t);
    // the views bar rises above the card, the eye riding its top
    const vb = E.q(".s36-vb", o), fill = E.q(".s36-vfill", o), eye = E.q(".s36-veye", o), h = vb.offsetHeight, tv = T(b1 + 0.95 + f.slot * 0.05);
    tl.fromTo(fill, { scaleY: 0 }, A({ scaleY: 1, duration: 0.6, ease: E.SPRING }), tv);
    tl.fromTo(eye, { y: h }, A({ y: 0, duration: 0.6, ease: E.SPRING }), tv);
    tl.fromTo(eye, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), tv);
  });
  const tSort = b1 + 1.75;
  offs.forEach((o, i) => {
    const f = off[i], d = f.slot - i;                      // slots counted from the right: d > 0 moves right
    if (!d) return;
    tl.fromTo(o, { x: f.x }, A({ x: f.x + d * ROW_DX, duration: 0.8, ease: E.SPRING }), T(tSort));
    // every moving card lifts (none dips below the screen): those moving right come forward, the others step back
    const up = d > 0 ? [-36, 80] : [-14, -28];
    tl.fromTo(o, { y: f.y, z: f.z }, A({ y: f.y + up[0], z: f.z + up[1], duration: 0.32, ease: "power2.out" }), T(tSort));
    tl.fromTo(o, { y: f.y + up[0], z: f.z + up[1] }, A({ y: f.y, z: f.z, duration: 0.5, ease: E.SPRING }), T(tSort + 0.32));
  });
  // the most viewed shines
  tl.fromTo(E.q(".s36-sw b", cards[0]), { x: 0 }, A({ x: -230, duration: 0.6, ease: "power2.inOut" }), T(b1 + 2.6));
  E.burst(tl, wrap, 400 + (n / 2 - 0.5) * ROW_DX * 1.03, 268, T(b1 + 2.65), { n: 12, seed: 36, r0: 40, r1: 100, color: "#c9c2ff" });

  // B2 "הם הופכים לכרטיסים קטנים שמתנגנים": the views step back, the cards get smaller and play
  const b2 = P[1], tEnd = cfg.tSimEnd;
  cards.forEach((cd, i) => {
    tl.fromTo(E.q(".s36-vfill", offs[i]), { scaleY: 1 }, A({ scaleY: 0, duration: 0.35, ease: "power2.in" }), T(b2));
    tl.fromTo(E.q(".s36-veye", offs[i]), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b2));
    tl.fromTo(cd, { scale: 0.8 }, A({ scale: 0.72, duration: 0.5, ease: E.SPRING }), T(b2 + 0.05));
    const pl = E.q(".s36-play", cd), tp = T(b2 + 0.15 + i * 0.03);
    tl.fromTo(pl, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), tp);
    tl.fromTo(pl, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2 + 0.95));
    tl.fromTo(E.q(".s36-prog b", cd), { scaleX: 0 }, A({ scaleX: 1, duration: tEnd - b2 - 0.3, ease: "none" }), T(b2 + 0.3));
    tl.fromTo(E.q(".s36-pic", cd), { scale: 1 }, A({ scale: 1.14, duration: tEnd - b2 - 0.3, ease: "none" }), T(b2 + 0.3));
  });

  // B3 "עולים לקשת מעל הראש": they rise into an arc above the head and to the sides, all behind you
  const b3 = P[2];
  offs.forEach((o, i) => {
    const f = off[i], x0 = f.x + (f.slot - i) * ROW_DX, t = T(b3 + 0.05 + i * 0.06);
    tl.fromTo(o, { x: x0, y: f.y, z: f.z }, A({ x: 0, y: 0, z: 0, duration: 0.95, ease: E.SPRING }), t);
    tl.fromTo(cards[i], { scale: 0.72 }, A({ scale: 0.9, duration: 0.95, ease: E.SPRING }), t);
  });

  // B4 "ואז מסתובבים במסלול סביבכם, חצי מאחוריכם וחצי מלפניכם": the arc lies down into a tilted orbit, a faint
  // light line draws it, and the orbit starts turning faster and faster: the near cards pass in front of you
  const b4 = P[3], tD = b4 + 0.05, dD = 1.2;
  // (every rotation component is given explicitly: GSAP would otherwise keep the Euler angles it decomposed from the CSS)
  const R0 = { rotation: 0, skewX: 0, skewY: 0 };
  tl.fromTo(tilt, { ...R0, x: 0, y: ARCY, z: ARCZ, rotationY: 0, rotationX: -90 }, A({ ...R0, x: 0, y: 0, z: 0, rotationY: 0, rotationX: TILT, duration: dD, ease: E.SPRING }), T(tD));
  arms.forEach((a, i) => tl.fromTo(a, { ...R0, rotationX: 0, rotationY: arcA(i) }, A({ ...R0, rotationX: 0, rotationY: orbA(i), duration: dD, ease: E.SPRING }), T(tD)));
  bbs.forEach((b, i) => tl.fromTo(b, { ...R0, rotationY: -arcA(i), rotationX: 90 }, A({ ...R0, rotationY: -orbA(i), rotationX: -TILT, duration: dD, ease: E.SPRING }), T(tD)));
  cards.forEach((cd) => tl.fromTo(cd, { scale: 0.9 }, A({ scale: 1, duration: dD, ease: E.SPRING }), T(tD)));
  tl.fromTo(q(".s36-orbit"), { opacity: 0 }, A({ opacity: 0.6, duration: 0.3 }), T(b4 + 0.75));
  E.draw(tl, q(".s36-orbit circle"), T(b4 + 0.75), 1.1, "power1.inOut");
  tl.fromTo(q(".s36-spot"), { opacity: 0 }, A({ opacity: 1, duration: 0.6 }), T(b4 + 0.6));
  const tS = tD + dD + 0.05, dS = 5.0, spin = q(".s36-spin");
  tl.fromTo(spin, { ...R0, rotationX: 0, rotationY: 0 }, A({ ...R0, rotationX: 0, rotationY: SPIN, duration: dS, ease: "power1.in" }), T(tS));
  bbs.forEach((b, i) => tl.fromTo(b, { ...R0, rotationX: -TILT, rotationY: -orbA(i) }, A({ ...R0, rotationX: -TILT, rotationY: -orbA(i) - SPIN, duration: dS, ease: "power1.in" }), T(tS)));

  // payoff: the orbit keeps speeding up; the three most viewed get the eye label (the real number goes there);
  // then the cards fly out of the screen
  qa(".s36-badge").forEach((bd, i) => {
    tl.fromTo(bd, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(pe + 0.25 + i * 0.15));
  });
  const legend = q(".s36-legend");
  E.fadeIn(tl, legend, T(pe + 0.6), 0.5, 14);
  const tO = pe + 2.85;
  offs.forEach((o, i) => {
    const p = Math.min(1, Math.max(0, (tO + i * 0.04 - tS) / dS)), a = (orbA(i) + SPIN * p * p) * Math.PI / 180;
    const side = Math.sin(a) >= 0 ? 1 : -1, t = T(tO + i * 0.04);
    tl.fromTo(o, { x: 0, y: 0, z: 0 }, A({ x: side * 520, y: -90, z: 160, duration: 0.6, ease: "power2.in" }), t);
    tl.fromTo(cards[i], { opacity: 1 }, A({ opacity: 0, duration: 0.5, ease: "power2.in" }), t + 0.1);
  });
  tl.fromTo(q(".s36-orbit"), { opacity: 0.6 }, A({ opacity: 0, duration: 0.45 }), T(tO + 0.4));
  tl.fromTo(q(".s36-spot"), { opacity: 1 }, A({ opacity: 0, duration: 0.45 }), T(tO + 0.4));
  tl.fromTo(legend, { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), T(tO + 0.4));
};
