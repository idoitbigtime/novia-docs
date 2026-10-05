window.SIMS = window.SIMS || {};
window.SIMS.sim43 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim43"), table = q(".s43-table"), rows = qa(".s43-row"), hole = q(".s43-hole");
  const badge = (el, t) => tl.fromTo(el, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), t);
  // light sweep, right to left; it starts and ends fully outside its element
  const sweep = (el, t, d, color) => {
    const fx = document.createElement("i"), b = document.createElement("b");
    fx.className = "s43-swp";
    b.style.background = "linear-gradient(105deg, rgba(255, 255, 255, 0) 25%, " + color + " 50%, rgba(255, 255, 255, 0) 75%)";
    fx.appendChild(b);
    el.appendChild(fx);
    const w = el.offsetWidth, bw = Math.round(Math.max(140, w * 0.6));
    b.style.width = bw + "px";
    tl.fromTo(b, { x: 0 }, A({ x: -(w + bw + 4), duration: d, ease: "power2.inOut" }), t);
  };
  const MATCHED = [0, 1, 2, 4];               // rows whose b-roll fits its sentence; row 4 (index 3) has none

  // B0 "על בסיס התמלול קלוד מחזיר טבלה": a scanner transcribes the speech (word chips pop over the track),
  // the table draws in and the words fly up into its sentence column
  const b0 = P[0], scan = q(".s43-scan"), RUN = 0.95, X0 = 640, SPAN = 580, chipY = 477;
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(b0 + 0.05));
  tl.fromTo(scan, { x: 0 }, A({ x: -SPAN, duration: RUN, ease: "none" }), T(b0 + 0.05));
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.12 }), T(b0 + 0.05 + RUN));
  tl.fromTo(q(".s43-tbg"), { opacity: 0 }, A({ opacity: 1, duration: 0.45 }), T(b0 + 0.55));
  E.draw(tl, q(".s43-tframe path"), T(b0 + 0.55), 0.8);
  qa(".s43-line").forEach((l, k) => tl.fromTo(l, { scaleX: 0 }, A({ scaleX: 1, duration: 0.45, ease: "power2.out" }), T(b0 + 0.7 + k * 0.06)));
  rows.forEach((row, k) => E.qa(".s43-wb", row).forEach((bar, j) => {
    const c = E.center(bar, root), cx = parseFloat(bar.dataset.x), dx = cx - c.x, dy = chipY - c.y;
    const tp = b0 + 0.05 + (RUN * (X0 - cx)) / SPAN, tf = b0 + 0.95 + k * 0.08 + j * 0.025;
    tl.fromTo(bar, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(tp));
    tl.fromTo(bar, { x: dx, y: dy, scale: 0.35 }, A({ x: dx, y: dy, scale: 0.55, duration: 0.25, ease: "back.out(2)" }), T(tp));
    tl.fromTo(bar, { x: dx, y: dy, scale: 0.55 }, A({ x: 0, y: 0, scale: 1, duration: 0.6, ease: E.SPRING }), T(tf));
  }));

  // B1 "הזמן, המשפט, מה רואים בבירול ומאיפה הוא מגיע": the columns fill one by one, right to left
  const b1 = P[1];
  qa(".s43-h").forEach((h, i) => E.fadeIn(tl, h, T(b1 + 0.05 + i * 0.45), 0.45, 10));
  qa(".s43-mt").forEach((m, k) => tl.fromTo(m, { opacity: 0, scaleX: 0.3 }, A({ opacity: 1, scaleX: 1, duration: 0.45, ease: E.SPRING }), T(b1 + 0.12 + k * 0.06)));
  const colhl = q(".s43-colhl");
  tl.fromTo(colhl, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b1 + 0.55));
  tl.fromTo(colhl, { y: 0 }, A({ y: 242, duration: 0.6, ease: "power1.inOut" }), T(b1 + 0.55));
  tl.fromTo(colhl, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(b1 + 1.05));
  MATCHED.forEach((k, n) => {
    badge(E.q(".s43-cw .s43-ico", rows[k]), T(b1 + 1.0 + n * 0.07));
    E.fadeIn(tl, E.q(".s43-src", rows[k]), T(b1 + 1.45 + n * 0.1), 0.45, 10);
  });
  tl.fromTo(q(".s43-what0"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 1.2));
  tl.fromTo(q(".s43-src0"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 1.75));

  // B2 "הכלל: אף פעם לא יותר מ-3 שניות של דיבור בלי בירול": the b-rolls drop onto the track; a 3-second caliper
  // measures each stretch of speech between them: two fit, the third is longer (a red hole; the punch-in is here)
  const b2 = P[2], blocks = qa(".s43-blk"), cal = q(".s43-cal"), g1 = q(".s43-g1"), g2 = q(".s43-g2");
  tl.fromTo(table, { opacity: 1 }, A({ opacity: 0.32, duration: 0.4 }), T(b2));
  blocks.forEach((bk, i) => tl.fromTo(bk, { opacity: 0, y: -26 }, A({ opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }), T(b2 + 0.1 + i * 0.12)));
  const calR = cal.offsetLeft + cal.offsetWidth, dx1 = g1.offsetLeft + g1.offsetWidth - calR, dx2 = g2.offsetLeft + g2.offsetWidth - calR;
  tl.fromTo(cal, { opacity: 0, x: dx1, y: 10 }, A({ opacity: 1, x: dx1, y: 0, duration: 0.35, ease: E.SPRING }), T(b2 + 0.6));
  badge(g1, T(b2 + 0.9));
  E.draw(tl, E.q(".s43-gok path", g1), T(b2 + 0.95), 0.25);
  tl.fromTo(cal, { x: dx1 }, A({ x: dx2, duration: 0.5, ease: "power2.inOut" }), T(b2 + 1.25));
  badge(g2, T(b2 + 1.6));
  E.draw(tl, E.q(".s43-gok path", g2), T(b2 + 1.65), 0.25);
  tl.fromTo(cal, { x: dx2 }, A({ x: 0, duration: 0.55, ease: "power2.inOut" }), T(b2 + 1.95));
  tl.fromTo(hole, { opacity: 0, scale: 0.92 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: E.SPRING }), T(b2 + 2.35));
  E.glitch(tl, hole, T(b2 + 2.4), 7);

  // B3 "וכל קליפ מראה בדיוק את מה שנאמר באותו משפט": each clip is checked against its own sentence (row, speech
  // span and block light up together); a merely similar clip is rejected, and the row says "חסר"
  const b3 = P[3], spans = qa(".s43-span"), bands = qa(".s43-band");
  tl.fromTo(table, { opacity: 0.32 }, A({ opacity: 1, duration: 0.35 }), T(b3));
  [g1, g2, cal].forEach((el) => tl.fromTo(el, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b3)));
  const lit = (k, t, hold) => {
    tl.fromTo(bands[k], { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(t));
    tl.fromTo(spans[k], { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(t));
    tl.fromTo(bands[k], { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(t + hold));
    tl.fromTo(spans[k], { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(t + hold));
  };
  MATCHED.forEach((k, n) => {
    const t = b3 + 0.2 + n * 0.25, bk = blocks[n];
    lit(k, t, 0.45);
    badge(E.q(".s43-bok", bk), T(t + 0.08));
    E.draw(tl, E.q(".s43-ok path", bk), T(t + 0.12), 0.22);
  });
  const t4 = b3 + 1.05, sim = q(".s43-sim");
  lit(3, t4, 0.9);
  tl.fromTo(sim, { opacity: 0, y: -26 }, A({ opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }), T(t4 + 0.05));
  E.glitch(tl, sim, T(t4 + 0.4), 8);
  badge(q(".s43-bno"), T(t4 + 0.45));
  qa(".s43-no path").forEach((p, i) => E.draw(tl, p, T(t4 + 0.5 + i * 0.1), 0.2));
  tl.fromTo(sim, { opacity: 1, y: 0 }, A({ opacity: 0, y: 22, duration: 0.3, ease: "power2.in" }), T(t4 + 0.75));
  E.fadeIn(tl, q(".s43-hlbl"), T(t4 + 1.02), 0.45, 10);
  // the hole turns red as it is marked "חסר" (after the accent and after the rejected clip's red cross has gone)
  tl.fromTo(hole, { borderColor: "#F5B544", backgroundColor: "rgba(245, 181, 68, 0.12)", boxShadow: "0 0 14px rgba(245, 181, 68, 0.35)" },
    A({ borderColor: "#ff6b61", backgroundColor: "rgba(255, 69, 58, 0.1)", boxShadow: "0 0 14px rgba(255, 69, 58, 0.35)", duration: 0.3 }), T(t4 + 1.06));
  tl.fromTo(q(".s43-src0"), { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(t4 + 0.9));
  E.fadeIn(tl, q(".s43-miss"), T(t4 + 1.05), 0.45, 10);

  // payoff: the rules, each acted out on the track; the hole stays marked
  E.fadeOut(tl, table, T(pe), 0.35, -16);
  qa(".s43-bok").forEach((b) => tl.fromTo(b, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe)));
  const rule = (el, t) => {
    tl.fromTo(el, { opacity: 0, x: 30 }, A({ opacity: 1, x: 0, duration: 0.55, ease: E.SPRING }), T(t));
    sweep(el, T(t + 0.45), 0.8, "rgba(201, 194, 255, 0.2)");
  };
  // 1. a zoom on the face does not count as a b-roll: it is tried in the hole and struck out
  const az = q(".s43-az"), ad = q(".s43-ad");
  rule(q(".s43-u1"), pe + 0.35);
  // while a candidate is tried in the hole, the hole's "חסר" steps aside (it returns once the second has gone)
  const hlbl = q(".s43-hlbl");
  tl.fromTo(hlbl, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(pe + 0.42));
  tl.fromTo(hlbl, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(pe + 2.5));
  tl.fromTo(az, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(pe + 0.55));
  tl.fromTo(az, { y: -26 }, A({ y: 0, duration: 0.35, ease: "back.out(1.6)" }), T(pe + 0.55));
  tl.fromTo(E.q(".s43-strike", az), { scaleX: 0.001 }, A({ scaleX: 1, duration: 0.3, ease: "power2.out" }), T(pe + 0.95));
  tl.fromTo(az, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 1.45));
  // 2. the same clip never appears twice: a copy of the first b-roll is tried in the hole and struck out
  rule(q(".s43-u2"), pe + 1.15);
  const dxd = blocks[0].offsetLeft - ad.offsetLeft;
  tl.fromTo(ad, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(pe + 1.3));
  tl.fromTo(ad, { x: dxd }, A({ x: 0, duration: 0.6, ease: "power2.inOut" }), T(pe + 1.3));
  tl.fromTo(ad, { y: 0 }, A({ y: -48, duration: 0.3, ease: "power2.out" }), T(pe + 1.3));
  tl.fromTo(ad, { y: -48 }, A({ y: 0, duration: 0.3, ease: "power2.in" }), T(pe + 1.6));
  tl.fromTo(E.q(".s43-strike", ad), { scaleX: 0.001 }, A({ scaleX: 1, duration: 0.3, ease: "power2.out" }), T(pe + 1.95));
  tl.fromTo(ad, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 2.4));
  // 3. a b-roll enters at most a second and a half before its word: the word's pin and the lead before it
  rule(q(".s43-u3"), pe + 1.95);
  const pin = q(".s43-pin");
  tl.fromTo(pin, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(pe + 2.15));
  tl.fromTo(pin, { scaleY: 0.05 }, A({ scaleY: 1, duration: 0.45, ease: E.SPRING }), T(pe + 2.15));
  E.draw(tl, q(".s43-entry path"), T(pe + 2.3), 0.4);
  tl.fromTo(blocks[1], { boxShadow: "0 0 0px rgba(201, 194, 255, 0)" }, A({ boxShadow: "0 0 22px rgba(201, 194, 255, 0.8)", duration: 0.35 }), T(pe + 2.3));
  // as the stage dims for the fact, the track and the rule tags leave entirely (no faint labels around the fact's backing)
  [q(".s43-tl"), ...qa(".s43-rule")].forEach((el) => tl.fromTo(el, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power1.in" }), T(cfg.tSimEnd - 0.45)));
};
