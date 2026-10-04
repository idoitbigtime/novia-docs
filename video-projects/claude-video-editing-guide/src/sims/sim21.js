window.SIMS = window.SIMS || {};
window.SIMS.sim21 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim21");
  const seg = (id) => q("#t21-" + id);
  const inSeg = (id, s) => E.q(s, seg(id));

  // establishing shot: two transcript lines, waveforms only (nothing transcribed yet)
  qa(".s21-lane").forEach((l, i) => {
    tl.fromTo(l, { opacity: 0, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.7, ease: E.SPRING }), T(cfg.tStage + 0.1 + i * 0.1));
  });
  qa(".s21-seg").forEach((s, i) => E.fadeIn(tl, E.q(".s21-wave", s), T(cfg.tStage + 0.15 + i * 0.035), 0.5, 10));

  // B0 "קלוד מתמלל את הצילום ומחליט מה לחתוך לפי המשמעות"
  // a playhead runs over each line (right to left): the wave lights up and the words come out of it
  const sweep = (line, t0, dur) => {
    const head = q(".s21-h" + (line + 1));
    const R = +head.dataset.r, L = +head.dataset.l, v = (R - L) / dur;
    tl.fromTo(head, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), t0);
    tl.fromTo(head, { x: 0 }, A({ x: -(R - L), duration: dur, ease: "none" }), t0);
    tl.fromTo(head, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), t0 + dur - 0.02);
    qa('.s21-seg[data-line="' + line + '"]').forEach((s) => {
      const o = E.off(s, root), r = o.x + s.offsetWidth;
      const ta = t0 + (R - r) / v, tb = t0 + (R - o.x) / v;
      tl.fromTo(E.q(".s21-wl", s), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: Math.max(0.05, tb - ta), ease: "none" }), ta);
      E.qa(".s21-w", s).forEach((w) => {
        const cx = E.off(w, root).x + w.offsetWidth / 2, tw = t0 + (R - cx) / v;
        tl.fromTo(w, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), tw);
        tl.fromTo(w, { scaleX: 0.3 }, A({ scaleX: 1, duration: 0.42, ease: "back.out(1.8)" }), tw);
      });
    });
  };
  sweep(0, T(P[0] + 0.05), 0.8);
  sweep(1, T(P[0] + 0.9), 0.65);

  // reading bracket: sentence by sentence
  const rdIn = (n, t) => {
    const el = q(".s21-rd" + n);
    tl.fromTo(el, { opacity: 0 }, A({ opacity: 1, duration: 0.22 }), t);
    tl.fromTo(el, { scale: 1.04 }, A({ scale: 1, duration: 0.5, ease: E.SPRING }), t);
  };
  const rdOut = (n, t) => tl.fromTo(q(".s21-rd" + n), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), t);
  // a cut: dashed box, the segment steps back
  const cutMark = (id, t, words) => {
    tl.fromTo(inSeg(id, ".s21-cut"), { opacity: 0, scale: 1.08 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: E.SPRING }), t);
    E.dim(tl, inSeg(id, ".s21-wave"), t + 0.1, 0.36, 1, 0.4);
    if (words) E.dim(tl, inSeg(id, ".s21-words"), t + 0.1, 0.42, 1, 0.4);
  };
  const strike = (id, t, d) => tl.fromTo(inSeg(id, ".s21-st"), { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: d || 0.35, ease: "power2.inOut" }), t);
  const strikeMute = (id, t) => tl.fromTo(inSeg(id, ".s21-st"), { backgroundColor: "#ff6b61" }, A({ backgroundColor: "#77718f", duration: 0.35 }), t);
  // a spark flies from the mark to its new row in the table
  const fly = (i, t) => {
    const f = q(".s21-fly" + i), dx = +f.dataset.dx, dy = +f.dataset.dy;
    tl.fromTo(f, { opacity: 0 }, A({ opacity: 1, duration: 0.08 }), t);
    tl.fromTo(f, { x: 0, y: 0, scale: 1 }, A({ x: dx, y: dy, scale: 0.7, duration: 0.42, ease: "power2.inOut" }), t);
    tl.fromTo(f, { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), t + 0.36);
  };
  const rowIn = (i, t) => {
    const r = q("#t21-r" + i);
    tl.fromTo(r, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), t);
    tl.fromTo(r, { x: 26 }, A({ x: 0, duration: 0.55, ease: E.SPRING }), t);
    tl.fromTo(E.q(".s21-rsc", r), { scale: 0.4, rotation: -30 }, A({ scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" }), t + 0.05);
    E.sweep(tl, r, t + 0.12, 0.6, { color: "rgba(201, 194, 255, 0.2)" });
  };

  const b0 = P[0];
  rdIn(1, T(b0 + 1.0));
  rdOut(1, T(b0 + 1.38));
  // the cuts table opens when the first decision is made
  const table = q(".s21-table");
  tl.fromTo(table, { opacity: 0 }, A({ opacity: 1, duration: 0.35, ease: "power1.out" }), T(b0 + 1.15));
  tl.fromTo(table, { y: 40, rotationX: 18, transformPerspective: 1300 }, A({ y: 0, rotationX: 0, transformPerspective: 1300, duration: 0.8, ease: E.SPRING }), T(b0 + 1.15));
  tl.fromTo(q(".s21-tdiv"), { scaleX: 0 }, A({ scaleX: 1, duration: 0.6, ease: "power2.out" }), T(b0 + 1.35));
  // the silence between the sentences
  rdIn(2, T(b0 + 1.4));
  const silc = inSeg("x1", ".s21-silc");
  tl.fromTo(silc, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }), T(b0 + 1.55));
  cutMark("x1", T(b0 + 1.6), false);
  fly(1, T(b0 + 1.7));
  rowIn(1, T(b0 + 2.05));
  rdOut(2, T(b0 + 1.92));
  // the second sentence, with its "אמ"
  rdIn(3, T(b0 + 1.94));
  strike("x2", T(b0 + 2.15));
  cutMark("x2", T(b0 + 2.3), true);
  fly(2, T(b0 + 2.35));
  rowIn(2, T(b0 + 2.7));
  strikeMute("x2", T(b0 + 2.6));

  // B1 "משפט שהתחלתם ועזבתם באמצע נמחק כולו": the sentence that trails off is struck out whole
  const b1 = P[1];
  rdOut(3, T(b1));
  rdIn(4, T(b1 + 0.05));
  strike("x3", T(b1 + 0.35), 0.5);
  const lab3 = q(".s21-lab3");
  tl.fromTo(lab3, { opacity: 0, y: 12, scale: 0.9 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: E.SPRING }), T(b1 + 0.6));
  cutMark("x3", T(b1 + 0.8), true);
  fly(3, T(b1 + 0.9));
  rowIn(3, T(b1 + 1.25));
  tl.fromTo(lab3, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1 + 1.68));
  strikeMute("x3", T(b1 + 1.6));

  // B2 "וכשאמרתם משהו פעמיים נשאר רק הניסיון האחרון והשלם": the same sentence twice; the first take goes
  const b2 = P[2];
  rdOut(4, T(b2));
  rdIn(5, T(b2 + 0.05));
  const arc = q(".s21-arc"), lab4 = q(".s21-lab4"), lab5 = q(".s21-lab5");
  E.draw(tl, E.q("path", arc), T(b2 + 0.25), 0.5);
  E.qa("circle", arc).forEach((ci, i) => tl.fromTo(ci, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b2 + 0.25 + i * 0.45)));
  tl.fromTo(lab4, { opacity: 0, y: 12, scale: 0.9 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: E.SPRING }), T(b2 + 0.4));
  strike("x4", T(b2 + 0.9));
  cutMark("x4", T(b2 + 1.05), true);
  fly(4, T(b2 + 1.1));
  rowIn(4, T(b2 + 1.45));
  tl.fromTo(lab4, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b2 + 1.25));
  tl.fromTo(arc, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b2 + 1.25));
  // the last complete take stays: outline, check and label
  const keep = inSeg("k4", ".s21-keep");
  tl.fromTo(keep, { opacity: 0, scale: 1.06 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: E.SPRING }), T(b2 + 1.4));
  tl.fromTo(lab5, { opacity: 0, y: 12, scale: 0.9 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: E.SPRING }), T(b2 + 1.45));
  E.draw(tl, E.q(".s21-lck path", lab5), T(b2 + 1.6), 0.35);
  E.sweep(tl, inSeg("k4", ".s21-words"), T(b2 + 1.55), 0.7, { color: "rgba(255, 255, 255, 0.35)" });
  strikeMute("x4", T(b2 + 2.1));

  // payoff: waiting for approval -> approved; the cuts close; every join keeps 0.1 s of silence
  rdOut(5, T(pe + 0.02));
  tl.fromTo(lab5, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(pe + 0.1));
  const btn = q(".s21-btn"), ring = q(".s21-bring");
  E.fadeIn(tl, btn, T(pe + 0.1), 0.5, 14);
  [0.35, 0.7].forEach((d) => tl.fromTo(ring, { opacity: 0.8, scale: 1 }, A({ opacity: 0, scale: 1.22, duration: 0.38, ease: "power2.out" }), T(pe + d)));
  tl.fromTo(q(".s21-hand"), { rotation: 0, svgOrigin: "15 15" }, A({ rotation: 360, svgOrigin: "15 15", duration: 0.9, ease: "none" }), T(pe + 0.1));
  const cur = q(".s21-cur"), tap = q(".s21-tap");
  tl.fromTo(cur, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(pe + 0.42));
  tl.fromTo(cur, { x: 180, y: -50 }, A({ x: 0, y: 0, duration: 0.48, ease: "power2.out" }), T(pe + 0.42));
  tl.fromTo(cur, { scale: 1 }, A({ scale: 0.86, duration: 0.08, ease: "power1.in" }), T(pe + 0.92));
  tl.fromTo(cur, { scale: 0.86 }, A({ scale: 1, duration: 0.22, ease: "power2.out" }), T(pe + 1.0));
  tl.fromTo(tap, { opacity: 0.9, scale: 0.3 }, A({ opacity: 0, scale: 1.5, duration: 0.45, ease: "power2.out" }), T(pe + 0.96));
  const tFlip = T(pe + 1.0);
  tl.fromTo(q(".s21-bw"), { opacity: 1 }, A({ opacity: 0, duration: 0.14 }), tFlip);
  tl.fromTo(btn, { backgroundColor: "rgba(31, 26, 63, 0.96)", borderColor: "rgba(201, 194, 255, 0.55)" },
    A({ backgroundColor: "rgba(236, 233, 255, 1)", borderColor: "rgba(255, 255, 255, 1)", duration: 0.25 }), tFlip);
  tl.fromTo(q(".s21-bo"), { opacity: 0, scale: 0.85 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), tFlip + 0.08);
  E.draw(tl, q(".s21-bok path"), tFlip + 0.12, 0.3);
  E.burst(tl, btn, btn.offsetWidth / 2, btn.offsetHeight / 2, tFlip + 0.05, { n: 12, seed: 21, r0: 22, r1: 42, color: "#c9c2ff" });
  E.sweep(tl, btn, tFlip + 0.2, 0.6, { color: "rgba(120, 100, 255, 0.35)" });
  tl.fromTo(cur, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(pe + 1.4));
  // the table leaves; the cuts close and the two lines become one tight strip
  tl.fromTo(table, { opacity: 1, y: 0 }, A({ opacity: 0, y: 34, duration: 0.4, ease: "power2.in" }), T(pe + 1.6));
  tl.fromTo(keep, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(pe + 1.75));
  tl.fromTo(qa(".s21-lane")[1], { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(pe + 1.75));
  const tC = T(pe + 1.95);
  qa(".s21-x").forEach((s) => {
    tl.fromTo(s, { scaleX: 1, opacity: 1 }, A({ scaleX: 0.04, opacity: 0, duration: 0.45, ease: "power2.in" }), tC);
  });
  // line 1 closes up; the kept take slides along line 2 first, then rises to the end of line 1
  qa(".s21-k").forEach((s) => {
    const dx = +s.dataset.dx, dy = +s.dataset.dy;
    if (!dy) tl.fromTo(s, { x: 0 }, A({ x: dx, duration: 0.95, ease: E.SPRING }), tC + 0.1);
    else {
      tl.fromTo(s, { x: 0 }, A({ x: dx, duration: 0.5, ease: "power2.inOut" }), tC + 0.1);
      tl.fromTo(s, { y: 0 }, A({ y: dy, duration: 0.7, ease: E.SPRING }), tC + 0.5);
    }
  });
  const lane0 = qa(".s21-lane")[0];
  tl.fromTo(lane0, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), tC);
  tl.fromTo(q(".s21-doc"), { y: 0 }, A({ y: 220, duration: 0.95, ease: E.SPRING }), tC + 0.1);
  tl.fromTo(q(".s21-pbg"), { height: 316 }, A({ height: 144, duration: 0.6, ease: "power2.inOut" }), tC + 0.6);
  // the joins light up, a playhead runs through the result, then the label
  const joins = qa(".s21-join");
  joins.forEach((j, i) => {
    tl.fromTo(j, { opacity: 0, scaleY: 0.2 }, A({ opacity: 1, scaleY: 1, duration: 0.45, ease: "back.out(2)" }), tC + 1.2 + i * 0.1);
    E.burst(tl, q(".s21-doc"), j.offsetLeft + 8, 72, tC + 1.22 + i * 0.1, { n: 8, seed: 70 + i, r0: 18, r1: 52, color: "#c9c2ff" });
  });
  const ph = q(".s21-ph"), span = +ph.dataset.span + 8, tP = tC + 1.45, dP = 0.8;
  tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), tP);
  tl.fromTo(ph, { x: 0 }, A({ x: -span, duration: dP, ease: "none" }), tP);
  tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), tP + dP - 0.05);
  const phx0 = E.off(ph, root).x;
  joins.forEach((j) => {
    const jx = E.off(j, root).x + 8, tj = tP + ((phx0 - jx) / span) * dP;
    tl.fromTo(E.q("em", j), { opacity: 0.95, scale: 0.4 }, A({ opacity: 0, scale: 1.5, duration: 0.5, ease: "power2.out" }), tj);
  });
  E.qa(".s21-lead path", root).forEach((p, i) => E.draw(tl, p, tP + dP - 0.1 + i * 0.06, 0.45));
  const jl = q(".s21-jl");
  tl.fromTo(jl, { opacity: 0, scale: 0.9, y: 10 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.55, ease: E.SPRING }), tP + dP + 0.1);
  E.sweep(tl, jl, tP + dP + 0.4, 0.7, { color: "rgba(201, 194, 255, 0.25)" });
  // the result, approved and tight: the panel glows once
  tl.fromTo(q(".s21-pbg"), { boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35), 0 0 0px rgba(201, 194, 255, 0)" },
    A({ boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35), 0 0 28px rgba(201, 194, 255, 0.35)", duration: 0.6, ease: "power2.out" }), tP + dP + 0.1);
};
