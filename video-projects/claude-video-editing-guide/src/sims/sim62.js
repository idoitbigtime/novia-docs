/* 6.2 Screen Studio, no extra zoom: one visual beat per explanation phrase, then the payoff.
   Every tween is a fromTo with explicit values (immediateRender:false via E.A); times are scene-local via T(). */
window.SIMS = window.SIMS || {};
window.SIMS.sim62 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const tw = (el, from, to, t) => tl.fromTo(el, from, A(to), T(t));
  const ts = cfg.tStage, b0 = P[0], b1 = P[1], b2 = P[2], b3 = P[3];

  // the recording's own zoom states (screen 504 x 314, origin top-left): the point (px, py) moves to the
  // centre, clamped so the zoomed picture always covers the screen
  const W = 504, H = 314;
  const cl = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const Z = (px, py, s) => ({ x: +cl(W / 2 - s * px, W - s * W, 0).toFixed(2), y: +cl(H / 2 - s * py, H - s * H, 0).toFixed(2), scale: s });
  const CL = [[80, 291], [230, 210], [204, 118], [452, 128]];  // click points: button, chart, cards, side row 3 (as in sim62.py)
  const Z0 = { x: 0, y: 0, scale: 1 }, ZB = Z(80, 291, 1.6), ZC = Z(230, 210, 1.5), ZK = Z(204, 118, 1.45), ZS = Z(440, 170, 1.4);
  const zoom = (el, a, b, t, d) => tw(el, Object.assign({}, a), Object.assign({}, b, { duration: d, ease: "power2.inOut" }), t);

  const za = q(".s62-za"), zb = q(".s62-zb"), gw = q(".s62-gw"), gz = q(".s62-gz");
  const lid = q(".s62-lid"), trk = q(".s62-tl"), fill = q(".s62-fill"), ph = q(".s62-ph");
  const segs = qa(".s62-seg"), bzs = qa(".s62-bz"), cur = q(".s62-cur"), rips = qa(".s62-rip");
  const hud = q(".s62-hudp"), vf = q(".s62-vf"), lead = q(".s62-lead"), auto = q(".s62-auto");
  const ask = q(".s62-ask"), askl = q(".s62-asklbl"), bub = q(".s62-bub");
  const lgb = q(".s62-lgb"), lga = q(".s62-lga"), viewer = q(".s62-viewer"), spiral = q(".s62-spiral");
  const no = q(".s62-no"), ok = q(".s62-ok");

  // the cursor's tip sits at (332.5, 212.5) in its CSS place; it travels to each click point
  const cp = (i) => ({ x: CL[i][0] - 332.5, y: CL[i][1] - 212.5 });
  const move = (i, j, t, d) => tw(cur, cp(i), Object.assign(cp(j), { duration: d, ease: "power2.inOut" }), t);
  const click = (i, t) => {
    tw(cur, { scale: 1 }, { scale: 0.82, duration: 0.1, ease: "power2.in" }, t - 0.08);
    tw(cur, { scale: 0.82 }, { scale: 1, duration: 0.25, ease: "back.out(2)" }, t + 0.02);
    tw(rips[i], { opacity: 0.95, scale: 0.3 }, { opacity: 0, scale: 1.5, duration: 0.55, ease: "power2.out" }, t);
  };

  // the track: the playhead starts at the right end and moves left (reading direction).
  // B0 records the first part, B1 fast-forwards through the rest; each zoom segment is revealed while the playhead crosses it
  const PH0 = 633, MID = 333, END = 8;
  const r0 = b0 + 0.19, r1 = b0 + 3.04, f0 = b1 + 0.04, f1 = b1 + 1.14;
  const v0 = (PH0 - MID) / (r1 - r0), v1 = (MID - END) / (f1 - f0);
  const at = (pos) => (pos >= MID ? r0 + (PH0 - pos) / v0 : f0 + (MID - pos) / v1);

  // establishing shot: the recorded screen lights up, the track arrives under the laptop
  tw(za, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, ts + 0.15);
  E.fadeIn(tl, trk, T(ts + 0.35), 0.5, 10);

  // B0 "Screen Studio ... records the screen and adds automatic zooms": REC pill, viewfinder, a click, a smooth zoom
  tw(hud, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, b0 + 0.02);
  const dot = q(".s62-hudp i");
  for (let k = 0; k < 4; k++) {
    const t = b0 + 0.5 + k * 0.7;
    tw(dot, { scale: 1 }, { scale: 1.45, duration: 0.3, ease: "sine.out" }, t);
    tw(dot, { scale: 1.45 }, { scale: 1, duration: 0.3, ease: "sine.in" }, t + 0.3);
  }
  qa(".s62-vf path").forEach((p, i) => E.draw(tl, p, T(b0 + 0.1 + i * 0.06), 0.45));
  tw(ph, { opacity: 0 }, { opacity: 1, duration: 0.2 }, b0 + 0.12);
  tw(ph, { x: 0 }, { x: MID - PH0, duration: r1 - r0, ease: "none" }, r0);
  tw(fill, { clipPath: "inset(0px 0px 0px 630px)" }, { clipPath: "inset(0px 0px 0px 330px)", duration: r1 - r0, ease: "none" }, r0);
  tw(cur, { opacity: 0 }, { opacity: 1, duration: 0.25 }, b0 + 0.25);
  tw(cur, { x: 0, y: 0 }, Object.assign(cp(0), { duration: 0.68, ease: "power2.inOut" }), b0 + 0.32);
  const s0 = segs[0], tz0 = at(s0.offsetLeft + s0.offsetWidth);
  click(0, tz0 - 0.1);
  zoom(za, Z0, ZB, tz0, 0.8);
  segs.forEach((s) => {
    const ta = at(s.offsetLeft + s.offsetWidth), tb = at(s.offsetLeft);
    tw(s, { clipPath: "inset(0px 0px 0px 100%)" }, { clipPath: "inset(0px 0px 0px 0%)", duration: tb - ta, ease: "none" }, ta);
    tw(E.q(".s62-mag", s), { scale: 0.4 }, { scale: 1, duration: 0.35, ease: "back.out(2.4)" }, (ta + tb) / 2 - 0.08);
  });
  E.draw(tl, q(".s62-lead path"), T(b0 + 1.5), 0.4);
  E.fadeIn(tl, auto, T(b0 + 1.65), 0.5, 12);

  // B1 "the recording is already full of zooms": fast-forward, a zoom segment wherever the playhead goes
  tw(ph, { x: MID - PH0 }, { x: END - PH0, duration: f1 - f0, ease: "none" }, f0);
  tw(fill, { clipPath: "inset(0px 0px 0px 330px)" }, { clipPath: "inset(0px 0px 0px 5px)", duration: f1 - f0, ease: "none" }, f0);
  zoom(za, ZB, Z0, b1 + 0.08, 0.4);
  move(0, 1, b1 + 0.12, 0.45);
  click(1, b1 + 0.6);
  zoom(za, Z0, ZC, b1 + 0.62, 0.6);
  tw(ph, { opacity: 1 }, { opacity: 0, duration: 0.25 }, b1 + 1.2);

  // B2 "so you tell Claude explicitly not to add a bouncy zoom of its own": the chat bubble is typed
  E.fadeOut(tl, auto, T(b2), 0.3, -8);
  tw(lead, { opacity: 1 }, { opacity: 0, duration: 0.3 }, b2);
  tw(hud, { opacity: 1 }, { opacity: 0, duration: 0.3 }, b2);
  tw(vf, { opacity: 1 }, { opacity: 0, duration: 0.3 }, b2);
  tw(trk, { opacity: 1 }, { opacity: 0.42, duration: 0.35 }, b2 + 0.05);
  E.fadeIn(tl, askl, T(b2 + 0.3), 0.45, 12);         // after the REC pill (its red dot) has gone
  tw(bub, { opacity: 0 }, { opacity: 1, duration: 0.3 }, b2 + 0.3);
  tw(bub, { y: 22, scale: 0.94 }, { y: 0, scale: 1, duration: 0.6, ease: E.SPRING }, b2 + 0.3);
  const tx1 = q(".s62-tx1"), tx2 = q(".s62-tx2"), c1 = q(".s62-c1"), c2 = q(".s62-c2");
  const place = (c, tx) => {        // a caret at the line's right end (static layout, measured once)
    const o = E.off(tx, bub);
    c.style.left = (o.x + tx.offsetWidth + 3).toFixed(1) + "px";
    c.style.top = (o.y + 4).toFixed(1) + "px";
  };
  place(c1, tx1); place(c2, tx2);
  // typing, word by word from the right: the clip stops at each word's left edge (measured once)
  const type = (tx, c, t0, dt) => {
    const W0 = tx.offsetWidth;
    const edges = E.qa(".s62-wd", tx).map((w) => w.offsetLeft - tx.offsetLeft).sort((a, b) => b - a).filter((x) => x > 16);
    edges.push(0);
    let prev = W0, t = t0;
    edges.forEach((x) => {
      tw(tx, { clipPath: "inset(0px 0px 0px " + prev.toFixed(1) + "px)" }, { clipPath: "inset(0px 0px 0px " + x.toFixed(1) + "px)", duration: 0.06, ease: "none" }, t);
      tw(c, { x: prev === W0 ? 0 : prev - W0 - 9 }, { x: x - W0 - 9, duration: 0.06, ease: "none" }, t);
      prev = x;
      t += dt;
    });
    return t;
  };
  const k1 = b2 + 0.52;                     // typed by ~b2 + 1.8, so the whole line holds ~1 s before B3
  tw(c1, { opacity: 0 }, { opacity: 1, duration: 0.05 }, k1 - 0.06);
  const e1 = type(tx1, c1, k1, 0.13);
  tw(c1, { opacity: 1 }, { opacity: 0, duration: 0.05 }, e1);
  const k2 = e1 + 0.02;
  tw(c2, { opacity: 0 }, { opacity: 1, duration: 0.05 }, k2 - 0.02);
  const e2 = type(tx2, c2, k2, 0.12);
  [[0.25, 0], [0.55, 1], [0.85, 0]].forEach(([dt, v]) => tw(c2, { opacity: 1 - v }, { opacity: v, duration: 0.05 }, e2 + dt));
  E.sweep(tl, bub, T(e2 + 0.15), 0.8, { color: "rgba(201, 194, 255, 0.22)" });

  // B3 "two zooms on top of each other make the viewer dizzy": a bouncy zoom lands on every automatic zoom,
  // the picture shakes and doubles, the viewer's head spins, red X (the engine punches in on the screen)
  tw(ask, { opacity: 1, y: 0 }, { opacity: 0, y: 14, duration: 0.3, ease: "power2.in" }, b3);
  tw(trk, { opacity: 0.42 }, { opacity: 1, duration: 0.3 }, b3 + 0.05);
  bzs.forEach((b, i) => {
    const t = b3 + 0.14 + i * 0.06;
    tw(b, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t);
    tw(b, { y: -18 }, { y: 0, duration: 0.45, ease: "back.out(2.2)" }, t);
  });
  E.fadeIn(tl, lgb, T(b3 + 0.32), 0.45, 12);
  E.fadeIn(tl, lga, T(b3 + 0.4), 0.45, 12);
  tw(viewer, { opacity: 0 }, { opacity: 1, duration: 0.35 }, b3 + 0.3);
  tw(viewer, { y: 8, scale: 0.9 }, { y: 0, scale: 1, duration: 0.6, ease: E.SPRING }, b3 + 0.3);   // grows from its base: stays inside the canvas
  move(1, 2, b3 + 0.06, 0.35);
  click(2, b3 + 0.44);
  zoom(za, ZC, ZK, b3 + 0.46, 0.8);
  // the bouncy zoom on top: pulses in and out around the screen centre while it sways
  const ZBS = [1, 1.2, 1.07, 1.18, 1.08, 1.14, 1.05, 1.1, 1];
  let tz = b3 + 0.54;
  for (let i = 1; i < ZBS.length; i++) {
    const d = i === 1 ? 0.4 : i === ZBS.length - 1 ? 0.42 : 0.3;
    tw(zb, { scale: ZBS[i - 1] }, { scale: ZBS[i], duration: d, ease: i === 1 ? "back.out(2.6)" : "sine.inOut" }, tz);
    tz += d;
  }
  const WOB = [[0, 0], [2.4, 10], [-2.0, -8], [1.8, 7], [-1.6, -6], [1.4, 5], [-1.2, -4], [1.0, 3], [-0.6, -2], [0, 0]];
  let tr = b3 + 0.6;
  for (let i = 1; i < WOB.length; i++) {
    const d = i === WOB.length - 1 ? 0.3 : 0.26;
    tw(zb, { rotation: WOB[i - 1][0], x: WOB[i - 1][1] }, { rotation: WOB[i][0], x: WOB[i][1], duration: d, ease: "sine.inOut" }, tr);
    tr += d;
  }
  // double vision: a faint copy of the picture trails the zoom
  tw(gw, { opacity: 0 }, { opacity: 0.36, duration: 0.2 }, b3 + 0.56);
  tw(gw, { x: 0, y: 0, rotation: 0 }, { x: 14, y: -8, rotation: 1.6, duration: 0.4, ease: "power2.out" }, b3 + 0.56);
  zoom(gz, ZC, ZK, b3 + 0.56, 0.8);
  tw(gw, { opacity: 0.36 }, { opacity: 0, duration: 0.4 }, b3 + 2.3);
  tw(gw, { x: 14, y: -8, rotation: 1.6 }, { x: 0, y: 0, rotation: 0, duration: 0.4, ease: "power2.in" }, b3 + 2.3);
  // the viewer sways, a spiral spins over the head
  tw(spiral, { opacity: 0 }, { opacity: 1, duration: 0.2 }, b3 + 0.72);
  E.draw(tl, q(".s62-spiral path"), T(b3 + 0.72), 0.5);
  tw(spiral, { rotation: 0 }, { rotation: -560, duration: 2.6, ease: "none" }, b3 + 0.72);
  const SW = [0, -4, 3.5, -3, 2.5, -2, 0];
  for (let i = 1; i < SW.length; i++) tw(viewer, { rotation: SW[i - 1] }, { rotation: SW[i], duration: 0.32, ease: "sine.inOut" }, b3 + 0.78 + (i - 1) * 0.32);
  // rejected: red X at the screen's corner
  tw(no, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, b3 + 1.38);
  qa(".s62-no path").forEach((p, i) => E.draw(tl, p, T(b3 + 1.44 + i * 0.14), 0.25));
  E.glitch(tl, lid, T(b3 + 1.38), 7);

  // payoff: the bouncy layer is lifted off; the same recording plays with only its own zoom, a check mark;
  // the chat bubble comes back as the instruction to give
  bzs.forEach((b, i) => tw(b, { opacity: 1, y: 0 }, { opacity: 0, y: -16, duration: 0.35, ease: "power2.in" }, pe + 0.02 + i * 0.04));
  E.fadeOut(tl, lgb, T(pe + 0.05), 0.3, -10);
  tw(no, { opacity: 1 }, { opacity: 0, duration: 0.25 }, pe + 0.08);
  // only one zoom is left: the viewer calms down (the spiral cross-fades into a calm face)
  const calm = q(".s62-calm");
  tw(spiral, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.inOut" }, pe + 0.25);
  tw(calm, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.inOut" }, pe + 0.25);
  tw(calm, { scale: 0.85 }, { scale: 1, duration: 0.4, ease: "back.out(1.8)" }, pe + 0.25);
  // the recording's own smooth zoom: out to the whole screen, the cursor clicks, then in again
  zoom(za, ZK, Z0, pe + 0.3, 0.6);
  move(2, 3, pe + 0.45, 0.55);
  click(3, pe + 1.08);
  const rows = qa(".s62-za .s62-row");       // the clicked row becomes the selected one
  tw(rows[1], { backgroundColor: "rgba(201, 194, 255, 0.16)" }, { backgroundColor: "rgba(201, 194, 255, 0)", duration: 0.25 }, pe + 1.1);
  tw(rows[2], { backgroundColor: "rgba(201, 194, 255, 0)" }, { backgroundColor: "rgba(201, 194, 255, 0.16)", duration: 0.25 }, pe + 1.1);
  zoom(za, Z0, ZS, pe + 1.15, 0.9);
  tw(ok, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, pe + 0.95);
  E.draw(tl, q(".s62-ok path"), T(pe + 1.0), 0.35);
  E.burst(tl, lid, 41, 41, T(pe + 1.02), { n: 10, seed: 62, r0: 26, r1: 40, color: "#c9c2ff" });
  E.sweep(tl, trk, T(pe + 1.2), 0.8, { color: "rgba(255, 255, 255, 0.28)" });
  E.fadeOut(tl, viewer, T(pe + 1.9), 0.3, 6);
  E.fadeOut(tl, lga, T(pe + 1.9), 0.3, 10);
  tw(ask, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: E.SPRING }, pe + 2.2);
  E.sweep(tl, bub, T(pe + 2.8), 0.9, { color: "rgba(201, 194, 255, 0.22)" });
};
