window.SIMS = window.SIMS || {};
window.SIMS.sim26 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(".sim26 " + s, sc), qa = (s) => E.qa(".sim26 " + s, sc);
  const root = q(".s26-nar").parentNode;
  const DELTA = 80;                           // the new sentence is longer by this many px (see sim26.py)
  const BAR = "#b9b0f5", RED = "#ff6b61";

  // establishing: the narration track; its waveform is revealed in the reading direction
  tl.fromTo(q(".s26-wall"), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.75, ease: "power2.out" }), T(cfg.tStage + 0.12));

  // B0 "קלוד חותך את המשפט השגוי בתוך שקט": the wrong sentence turns red; the loudness graph with a line at every
  // word start; the cut points land on whisper's times, snap to the nearest dip, and the sentence is cut out
  const b0 = P[0], cold = q(".s26-cold"), gr = q(".s26-gr");
  tl.fromTo(q(".s26-red path"), { stroke: BAR }, A({ stroke: RED, duration: 0.35, ease: "power1.out" }), T(b0 + 0.08));
  tl.fromTo(q(".s26-oldbox"), { opacity: 0, scale: 1.05 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: E.SPRING }), T(b0 + 0.08));
  tl.fromTo(cold, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b0 + 0.14));
  tl.fromTo(gr, { opacity: 0, y: 16 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b0 + 0.3));
  E.draw(tl, q(".s26-gline"), T(b0 + 0.42), 0.75, "power1.inOut");
  tl.fromTo(q(".s26-gfill"), { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(b0 + 0.8));
  qa(".s26-gwl path").forEach((p, i) => tl.fromTo(p, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b0 + 0.5 + i * 0.04)));
  const cr = q(".s26-cutr"), cl = q(".s26-cutl"), cuts = [cr, cl];
  cuts.forEach((m, i) => tl.fromTo(m, { opacity: 0, y: -12 }, A({ opacity: 1, y: 0, duration: 0.35, ease: E.SPRING }), T(b0 + 0.95 + i * 0.08)));
  tl.fromTo(cr, { x: 0 }, A({ x: -26, duration: 0.4, ease: "back.out(2)" }), T(b0 + 1.35));
  tl.fromTo(cl, { x: 0 }, A({ x: 26, duration: 0.4, ease: "back.out(2)" }), T(b0 + 1.35));
  qa(".s26-cut .d").forEach((d) => tl.fromTo(d, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(b0 + 1.38)));
  qa(".s26-cut .s").forEach((d) => tl.fromTo(d, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b0 + 1.38)));
  E.burst(tl, root, 466, 432, T(b0 + 1.45), { n: 8, seed: 3, r0: 14, r1: 48, color: "#c9c2ff" });
  E.burst(tl, root, 266, 432, T(b0 + 1.45), { n: 8, seed: 4, r0: 14, r1: 48, color: "#c9c2ff" });
  const sils = qa(".s26-sil");
  sils.forEach((s, i) => tl.fromTo(s, { opacity: 0, y: -8 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), T(b0 + 1.45 + i * 0.06)));
  // the cut: the red sentence lifts out of the track; an empty slot stays between the two cuts
  tl.fromTo(q(".s26-sen"), { opacity: 1, y: 0 }, A({ opacity: 0, y: -34, duration: 0.42, ease: "power2.in" }), T(b0 + 1.78));
  tl.fromTo(cold, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(b0 + 1.78));
  const slot = q(".s26-slot");
  tl.fromTo(slot, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(b0 + 1.98));

  // B1 "מכניס במקומו הקלטה חדשה": the new recording flies up into the slot; what comes after it moves by the difference
  const b1 = P[1], nwd = q(".s26-nwd");
  tl.fromTo(gr, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(b1));
  sils.forEach((s) => tl.fromTo(s, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1)));
  tl.fromTo(cuts, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1));
  tl.fromTo(nwd, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(b1 + 0.1));
  tl.fromTo(nwd, { y: 360 }, A({ y: 330, duration: 0.25, ease: "power2.out" }), T(b1 + 0.1));
  tl.fromTo(nwd, { y: 330 }, A({ y: 0, duration: 0.75, ease: E.SPRING }), T(b1 + 0.35));
  tl.fromTo(q(".s26-aftw"), { x: 0 }, A({ x: -DELTA, duration: 0.75, ease: E.SPRING }), T(b1 + 0.35));
  tl.fromTo(slot, { scaleX: 1 }, A({ scaleX: (DELTA + 200) / 200, duration: 0.75, ease: E.SPRING }), T(b1 + 0.35));
  tl.fromTo(slot, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b1 + 0.8));
  tl.fromTo(q(".s26-mic"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b1 + 0.95));
  tl.fromTo(q(".s26-cnew"), { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b1 + 0.8));
  E.sweep(tl, q(".s26-nw"), T(b1 + 1.0), 0.6, { color: "rgba(255, 255, 255, 0.32)" });

  // B2 "ומתאים לה את הצליל והעוצמה של הקריינות שמסביב": background noise, EQ and loudness, matched one by one
  const b2 = P[2], lvl = q(".s26-lvl"), nbp = q(".s26-nbars path");
  [q(".s26-bef path"), q(".s26-aftw path")].forEach((p) => {
    tl.fromTo(p, { stroke: BAR }, A({ stroke: "#ffffff", duration: 0.25 }), T(b2));
    tl.fromTo(p, { stroke: "#ffffff" }, A({ stroke: BAR, duration: 0.45 }), T(b2 + 0.3));
  });
  tl.fromTo(lvl, { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.6, ease: "power2.inOut" }), T(b2 + 0.05));
  const cards = qa(".s26-mc");
  cards.forEach((cd, i) => {
    const t = T(b2 + 0.15 + i * 0.55);
    tl.fromTo(cd, { opacity: 0, y: 20, scale: 0.94 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.45, ease: E.SPRING }), t);
    E.draw(tl, E.q(".s26-ck path", cd), t + 0.3, 0.3);
  });
  // 1 background noise: the noise floor drops on the card and on the track
  tl.fromTo(q(".s26-nzv"), { scaleY: 1, opacity: 1, transformOrigin: "50% 50%" }, A({ scaleY: 0.14, opacity: 0.55, duration: 0.45, ease: "power2.inOut" }), T(b2 + 0.42));
  tl.fromTo(q(".s26-noise"), { opacity: 1 }, A({ opacity: 0, duration: 0.45, ease: "power1.out" }), T(b2 + 0.42));
  // 2 EQ: the new curve becomes the replaced sentence's curve; the bars take the narration's colour
  tl.fromTo(q(".s26-eqa"), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2 + 0.97));
  tl.fromTo(q(".s26-eqb"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 1.02));
  tl.fromTo(nbp, { stroke: "#ffffff" }, A({ stroke: BAR, duration: 0.5, ease: "power1.inOut" }), T(b2 + 0.97));
  // 3 loudness: the new level drops to the narration's level
  tl.fromTo(q(".s26-m2g"), { scaleY: 1, transformOrigin: "50% 100%" }, A({ scaleY: 58 / 86, duration: 0.6, ease: E.SPRING }), T(b2 + 1.52));
  tl.fromTo(q(".s26-m2"), { fill: "#ffffff" }, A({ fill: "#cfc8fb", duration: 0.4 }), T(b2 + 1.52));
  tl.fromTo(q(".s26-nwsc"), { scaleY: 1.3 }, A({ scaleY: 1, duration: 0.65, ease: E.SPRING }), T(b2 + 1.52));

  // B3 "כך שלא שומעים את החיבור": a close-up of the join: a click, a 40 ms fade on each side, the click is gone
  const b3 = P[3], det = q(".s26-det"), wedge = q(".s26-wedge");
  tl.fromTo(cards, { opacity: 1, y: 0 }, A({ opacity: 0, y: -12, duration: 0.3, ease: "power2.in" }), T(b3));
  tl.fromTo(lvl, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b3));
  tl.fromTo(det, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 0.15));
  tl.fromTo(det, { scale: 0.9, y: -16 }, A({ scale: 1, y: 0, duration: 0.55, ease: E.SPRING }), T(b3 + 0.15));
  qa(".s26-wedge path").forEach((p) => E.draw(tl, p, T(b3 + 0.12), 0.35));
  const dclk = q(".s26-dclk");
  tl.fromTo(dclk, { opacity: 0, scaleY: 0.3, transformOrigin: "50% 50%" }, A({ opacity: 1, scaleY: 1, duration: 0.2, ease: "power2.out" }), T(b3 + 0.3));
  qa(".s26-seam").forEach((sm, i) => {
    const fp = E.qa(".s26-fdg path", sm), o = i * 0.06;
    E.draw(tl, fp[0], T(b3 + 0.62 + o), 0.38);
    E.draw(tl, fp[1], T(b3 + 0.7 + o), 0.38);
  });
  E.draw(tl, q(".s26-dfo"), T(b3 + 0.55), 0.42);
  E.draw(tl, q(".s26-dfi"), T(b3 + 0.62), 0.42);
  qa(".s26-dn").forEach((b, i) => tl.fromTo(b, { scaleY: 1, transformOrigin: "50% 50%" }, A({ scaleY: [0.35, 0.75, 0.35, 0.75][i], duration: 0.45, ease: "power2.inOut" }), T(b3 + 0.6)));
  tl.fromTo(dclk, { scaleY: 1, transformOrigin: "50% 50%" }, A({ scaleY: 0, duration: 0.35, ease: "power2.in" }), T(b3 + 0.72));
  tl.fromTo(dclk, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b3 + 0.8));
  E.draw(tl, q(".s26-dbr"), T(b3 + 0.85), 0.35);
  tl.fromTo(q(".s26-dlabel"), { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), T(b3 + 0.88));
  const dh = q(".s26-dhead");
  tl.fromTo(dh, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(b3 + 1.05));
  tl.fromTo(dh, { x: 0 }, A({ x: -290, duration: 0.6, ease: "none" }), T(b3 + 1.05));
  tl.fromTo(dh, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(b3 + 1.52));
  E.burst(tl, det, 180, 100, T(b3 + 1.35), { n: 10, seed: 26, r0: 22, r1: 74, color: "#c9c2ff" });
  // seamless: the new recording's frame melts into the narration
  tl.fromTo(q(".s26-nw"), { borderColor: "#c9c2ff" }, A({ borderColor: "rgba(201, 194, 255, 0.28)", duration: 0.45 }), T(b3 + 1.2));
  tl.fromTo(q(".s26-nwg"), { opacity: 1 }, A({ opacity: 0, duration: 0.45 }), T(b3 + 1.2));

  // B4 "רואים את הפה? הוא יציע בירול או זווית אחרת שתכסה אותו": the mouth on the video; two offers; the B-roll covers it
  const b4 = P[4], ph = q(".s26-phone"), ring = q(".s26-ring"), c1 = q(".s26-c1"), c2 = q(".s26-c2");
  tl.fromTo(det, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(b4));
  tl.fromTo(wedge, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b4));
  qa(".s26-fdg").forEach((g) => tl.fromTo(g, { opacity: 1 }, A({ opacity: 0.45, duration: 0.35 }), T(b4)));
  tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b4 + 0.15));
  tl.fromTo(ph, { scale: 0.72, y: -24 }, A({ scale: 1, y: 0, duration: 0.7, ease: E.SPRING }), T(b4 + 0.15));
  const mo = q(".s26-mouth");
  let tm = b4 + 0.25, s0 = 1;
  [0.35, 1, 0.5, 1.1, 0.3, 0.9, 0.45, 1, 0.35, 1].forEach((sv) => {
    tl.fromTo(mo, { scaleY: s0 }, A({ scaleY: sv, duration: 0.15, ease: "sine.inOut" }), T(tm));
    s0 = sv;
    tm += 0.16;
  });
  tl.fromTo(ring, { opacity: 0, scale: 1.45 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: E.SPRING }), T(b4 + 0.55));
  E.draw(tl, q(".s26-ring circle"), T(b4 + 0.55), 0.5);
  tl.fromTo(c1, { opacity: 0, x: -44, scale: 0.9 }, A({ opacity: 1, x: 0, scale: 1, duration: 0.55, ease: E.SPRING }), T(b4 + 0.95));
  tl.fromTo(c2, { opacity: 0, x: 44, scale: 0.9 }, A({ opacity: 1, x: 0, scale: 1, duration: 0.55, ease: E.SPRING }), T(b4 + 1.1));
  // the B-roll is chosen and flies into the video, covering the mouth
  const ok = q(".s26-ok"), fly = q(".s26-fly");
  tl.fromTo(ok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b4 + 1.6));
  E.draw(tl, q(".s26-ok path"), T(b4 + 1.65), 0.3);
  tl.fromTo(c1, { borderColor: "rgba(201, 194, 255, 0.3)" }, A({ borderColor: "#c9c2ff", duration: 0.3 }), T(b4 + 1.6));
  tl.fromTo(c2, { opacity: 1 }, A({ opacity: 0.45, duration: 0.35 }), T(b4 + 1.8));
  tl.fromTo(fly, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(b4 + 1.8));
  tl.fromTo(fly, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, A({ x: -243, y: -45, scaleX: 182 / 196, scaleY: 338 / 130, duration: 0.5, ease: "power3.inOut" }), T(b4 + 1.8));
  tl.fromTo(q(".s26-broll"), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.35, ease: "power2.out" }), T(b4 + 2.2));
  tl.fromTo(fly, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b4 + 2.27));
  tl.fromTo(ring, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b4 + 2.2));

  // payoff: the tracks after the join (captions, effects, B-roll) move by the same difference; a playhead runs through
  tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(pe));
  tl.fromTo(c1, { opacity: 1 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(pe));
  tl.fromTo(c2, { opacity: 0.45 }, A({ opacity: 0, duration: 0.3, ease: "power2.in" }), T(pe));
  qa(".s26-row").forEach((r, i) => tl.fromTo(r, { opacity: 0, y: 18 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(pe + 0.3 + i * 0.08)));
  tl.fromTo(q(".s26-dband"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(pe + 0.85));
  qa(".s26-aft").forEach((g, i) => tl.fromTo(g, { x: 0 }, A({ x: -DELTA, duration: 0.7, ease: E.SPRING }), T(pe + 0.9 + i * 0.05)));
  tl.fromTo(q(".s26-cbs"), { scaleX: 1 }, A({ scaleX: 268 / 188, duration: 0.7, ease: E.SPRING }), T(pe + 0.9));
  const bbn = q(".s26-bbn");
  tl.fromTo(bbn, { opacity: 0, y: -14 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(pe + 1.0));
  tl.fromTo(q(".s26-dlab"), { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(pe + 0.95));
  const h2 = q(".s26-head2");
  tl.fromTo(h2, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(pe + 1.6));
  tl.fromTo(h2, { x: 0 }, A({ x: -616, duration: 1.3, ease: "none" }), T(pe + 1.6));
  tl.fromTo(h2, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(pe + 2.75));
  E.sweep(tl, bbn, T(pe + 2.0), 0.55, { color: "rgba(255, 255, 255, 0.3)" });
};
