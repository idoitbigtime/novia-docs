window.SIMS = window.SIMS || {};
window.SIMS.sim31 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(".sim31 " + s, sc), qa = (s) => E.qa(".sim31 " + s, sc);
  const root = q(".s31-cam").parentNode, strip = q(".s31-strip");

  // establishing: the camera frame; its viewfinder corners draw on
  qa(".s31-vf path").forEach((p, i) => E.draw(tl, p, T(cfg.tStage + 0.15 + i * 0.06), 0.45));

  // B0 "הדרך הכי מהירה להסביר לקלוד מה אתם רוצים": what you want, as a thought (a 3D logo, text on the wall, layers)
  const b0 = P[0], think = q(".s31-think"), tdots = qa(".s31-tdots i"), ibs = qa(".s31-ib");
  tdots.forEach((d, i) => tl.fromTo(d, { opacity: 0, scale: 0.4 }, A({ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }), T(b0 + 0.1 + i * 0.12)));
  tl.fromTo(think, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.55, ease: E.SPRING }), T(b0 + 0.42));
  ibs.forEach((ib, i) => {
    tl.fromTo(ib, { opacity: 0, y: 12, scale: 0.6 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }), T(b0 + 0.72 + i * 0.22));
    tl.fromTo(ib, { y: 0 }, A({ y: -5, duration: 0.5, ease: "sine.inOut" }), T(b0 + 1.3 + i * 0.22));
    tl.fromTo(ib, { y: -5 }, A({ y: 0, duration: 0.5, ease: "sine.inOut" }), T(b0 + 1.8 + i * 0.22));
  });
  E.sweep(tl, think, T(b0 + 1.6), 0.7, { color: "rgba(255, 255, 255, 0.2)" });
  // the slower way: typing it to Claude in a prompt box (it fills slowly, the cursor blinks)
  const term = q(".s31-term"), tl1 = q(".s31-tl1"), tl2 = q(".s31-tl2"), cur = q(".s31-cur");
  tl.fromTo(term, { opacity: 0, y: 16 }, A({ opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }), T(b0 + 0.25));
  tl.fromTo(tl1, { scaleX: 0 }, A({ scaleX: 1, duration: 1.3, ease: "none" }), T(b0 + 0.75));
  tl.fromTo(cur, { x: 0 }, A({ x: 400, duration: 1.3, ease: "none" }), T(b0 + 0.75));
  tl.fromTo(cur, { x: 400, y: 0 }, A({ x: -34, y: 36, duration: 0.05, ease: "none" }), T(b0 + 2.06));
  tl.fromTo(tl2, { scaleX: 0 }, A({ scaleX: 0.3, duration: 0.6, ease: "none" }), T(b0 + 2.1));
  tl.fromTo(cur, { x: -34 }, A({ x: 56, duration: 0.6, ease: "none" }), T(b0 + 2.12));
  [0.55, 0.95, 1.35, 1.75, 2.15].forEach((o, i) => tl.set(cur, { opacity: i % 2 ? 0.25 : 1 }, T(b0 + o)));

  // B1 "היא להגיד את זה בזמן הצילום": REC; the thought is said out loud, word by word; the waveform records
  const b1 = P[1], rec = q(".s31-rec"), rr = q(".s31-rec i"), say = q(".s31-say");
  tl.fromTo(rec, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }), T(b1 + 0.02));
  [0, 0.6, 1.2].forEach((o) => tl.fromTo(rr, { scale: 0.6, opacity: 1 }, A({ scale: 1.5, opacity: 0, duration: 0.55, ease: "power2.out" }), T(b1 + 0.1 + o)));
  tl.fromTo(think, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1));
  tl.fromTo(term, { opacity: 1, y: 0 }, A({ opacity: 0, y: 16, duration: 0.3, ease: "power2.in" }), T(b1));
  tdots.forEach((d) => tl.fromTo(d, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b1)));
  tl.fromTo(say, { opacity: 0, scale: 0.85 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: E.SPRING }), T(b1 + 0.08));
  E.kin(tl, q(".s31-say p"), S, { dy: 10 });
  const arcs = qa(".s31-arcs path");
  for (let k = 0; k < 3; k++) arcs.forEach((a, i) => {
    const t = T(b1 + 0.2 + k * 0.55 + i * 0.1);
    tl.fromTo(a, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), t);
    tl.fromTo(a, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), t + 0.2);
  });
  const rh = q(".s31-rhead");
  tl.fromTo(q(".s31-wvc"), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 1.65, ease: "none" }), T(b1 + 0.15));
  tl.fromTo(rh, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b1 + 0.1));
  tl.fromTo(rh, { x: 0 }, A({ x: -784, duration: 1.65, ease: "none" }), T(b1 + 0.15));
  tl.fromTo(rh, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b1 + 1.8));

  // B2 "קלוד מתמלל עם זמן לכל מילה": a scanner passes; every word lands under its sound with a tick on the time ruler
  const b2 = P[2], scan = q(".s31-scan");
  tl.fromTo(rec, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b2));
  tl.fromTo(say, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2 + 0.05));
  E.draw(tl, q(".s31-rl"), T(b2), 0.5, "power2.out");
  tl.fromTo(q(".s31-rt"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.3));
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(b2 + 0.1));
  tl.fromTo(scan, { x: 0 }, A({ x: -890, duration: 1.0, ease: "power1.inOut" }), T(b2 + 0.1));
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(b2 + 1.0));
  qa(".s31-aw, .s31-iw").forEach((ch) => {
    const cx = E.center(ch, root).x;
    const t = T(b2 + 0.14 + ((800 - cx) / 890) * 0.95);
    tl.fromTo(ch, { opacity: 0, y: -16 }, A({ opacity: 1, y: 0, duration: 0.4, ease: E.SPRING }), t);
    tl.fromTo(E.q(".tk", ch), { opacity: 0, scaleY: 0 }, A({ opacity: 1, scaleY: 1, duration: 0.3, ease: "power2.out" }), t + 0.18);
  });

  // B3 "מוצא את ההוראות ובונה כל אפקט בדיוק על המילים שלו": the instruction lights up; a bracket marks its words;
  // when the playhead reaches them the effect enters over the hand, and it leaves when they end (punch-in here)
  const b3 = P[3], ins = qa(".s31-iw"), insEl = q(".s31-ins");
  ins.forEach((ch, i) => tl.fromTo(E.q(".hl", ch), { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(b3 + 0.12 + i * 0.05)));
  qa(".s31-aw").forEach((a) => tl.fromTo(a, { opacity: 1 }, A({ opacity: 0.4, duration: 0.3 }), T(b3 + 0.1)));
  const io = E.off(insEl, strip), iw = insEl.offsetWidth;
  const brk = q(".s31-brk"), bp = q(".s31-brk path");
  brk.style.left = io.x + "px";
  brk.style.width = iw + "px";
  brk.setAttribute("viewBox", "0 0 " + iw + " 16");
  bp.setAttribute("d", "M" + (iw - 1) + " 0 V10 H1 V0");
  E.draw(tl, bp, T(b3 + 0.45), 0.45);
  const ph = q(".s31-ph"), X0 = 780, X1 = 20, PD = 1.8, tp = b3 + 0.8;
  tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(tp));
  tl.fromTo(ph, { x: 0 }, A({ x: X1 - X0, duration: PD, ease: "none" }), T(tp));
  tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(tp + PD - 0.1));
  const tin = tp + ((X0 - (io.x + iw)) / (X0 - X1)) * PD;   // the playhead reaches the instruction's first word
  const tout = tp + ((X0 - io.x) / (X0 - X1)) * PD;         // and leaves its last word
  const lgw = q(".s31-lgw"), lp = q(".s31-lp"), lg3 = q(".s31-lg3"), pg = q(".s31-pg"), link = q(".s31-link");
  tl.fromTo(lgw, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(tin));
  tl.fromTo(lp, { opacity: 0, scale: 0.3 }, A({ opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }), T(tin));
  tl.fromTo(lg3, { scale: 0.05, rotationY: -360 }, A({ scale: 1, rotationY: 0, duration: 0.8, ease: E.SPRING }), T(tin + 0.1));
  tl.fromTo(lp, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(tin + 0.45));
  tl.fromTo(pg, { opacity: 0 }, A({ opacity: 1, duration: 0.5 }), T(tin + 0.3));
  E.draw(tl, q(".s31-link path"), T(tin), 0.45);
  tl.fromTo(lg3, { rotationY: 0 }, A({ rotationY: 30, duration: Math.max(0.3, tout - tin - 0.9), ease: "sine.inOut" }), T(tin + 0.9));
  tl.fromTo(lgw, { y: 0 }, A({ y: -7, duration: 0.55, ease: "sine.inOut" }), T(tin + 0.9));
  tl.fromTo(lgw, { y: -7 }, A({ y: 0, duration: 0.5, ease: "sine.inOut" }), T(tin + 1.45));
  // its words end: it shrinks back into a point of light
  tl.fromTo(lg3, { scale: 1 }, A({ scale: 0.05, duration: 0.35, ease: "power2.in" }), T(tout));
  tl.fromTo(lp, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(tout + 0.22));
  tl.fromTo(lp, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(tout + 0.42));
  tl.fromTo(pg, { opacity: 1 }, A({ opacity: 0, duration: 0.35 }), T(tout));
  tl.fromTo(link, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(tout));
  tl.fromTo(lgw, { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), T(tout + 0.6));

  // B4 "לפני שהוא בונה, הוא מראה טבלה של כל ההוראות לאישור": the words fly into a table row; waiting for approval
  const b4 = P[4], cam = q(".s31-cam"), tbl = q(".s31-tbl");
  [q(".s31-wvc"), q(".s31-rul"), brk].forEach((el) => tl.fromTo(el, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b4)));
  qa(".s31-aw").forEach((a) => tl.fromTo(a, { opacity: 0.4 }, A({ opacity: 0, duration: 0.3 }), T(b4)));
  qa(".s31-iw .tk").forEach((tk) => tl.fromTo(tk, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b4)));
  tl.fromTo(cam, { scale: 1, opacity: 1 }, A({ scale: 0.7, opacity: 0.5, duration: 0.6, ease: E.SPRING }), T(b4));
  // the table rises once the waveform and the ruler have faded (never through them)
  tl.fromTo(tbl, { opacity: 0, y: 40 }, A({ opacity: 1, y: 0, duration: 0.55, ease: E.SPRING }), T(b4 + 0.32));
  const tws = qa(".s31-tins .tw");
  ins.forEach((ch, i) => {
    const a = E.center(ch, root), b = E.center(tws[i], root), t = T(b4 + 0.25 + i * 0.035);
    tl.fromTo(E.q(".hl", ch), { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), t);
    tl.fromTo(ch, { backgroundColor: "rgba(26, 23, 52, 0.92)", borderColor: "rgba(201, 194, 255, 0.32)" },
      A({ backgroundColor: "rgba(26, 23, 52, 0)", borderColor: "rgba(201, 194, 255, 0)", duration: 0.3 }), t);
    tl.fromTo(ch, { x: 0, y: 0 }, A({ x: b.x - a.x, y: b.y - a.y, duration: 0.62, ease: "power3.inOut" }), t);
    tl.fromTo(ch, { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), t + 0.62);
    tl.fromTo(tws[i], { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), t + 0.6);
  });
  qa(".s31-r1 .s31-pic").forEach((pic, i) => tl.fromTo(pic, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }), T(b4 + 1.0 + i * 0.12)));
  qa(".s31-r2, .s31-r3").forEach((cell, i) => tl.fromTo(cell, { opacity: 0 }, A({ opacity: 0.55, duration: 0.35 }), T(b4 + 1.3 + (i % 4) * 0.04 + (i >= 4 ? 0.12 : 0))));
  const ok = q(".s31-ok"), okr = q(".s31-okr");
  tl.fromTo(ok, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b4 + 1.6));
  [0, 0.55].forEach((o) => {
    tl.fromTo(okr, { scale: 1 }, A({ scale: 1.18, duration: 0.25, ease: "sine.out" }), T(b4 + 2.0 + o));
    tl.fromTo(okr, { scale: 1.18 }, A({ scale: 1, duration: 0.25, ease: "sine.in" }), T(b4 + 2.25 + o));
  });

  // payoff: approved -> BRIEF.md -> a scene file and an agent for every instruction -> the independent critic
  tl.fromTo(q(".s31-okr .okf"), { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }), T(pe + 0.1));
  E.draw(tl, q(".s31-okr path"), T(pe + 0.16), 0.3);
  tl.fromTo(ok, { borderColor: "rgba(201, 194, 255, 0.45)" }, A({ borderColor: "#c9c2ff", duration: 0.3 }), T(pe + 0.1));
  E.sweep(tl, tbl, T(pe + 0.22), 0.6, { color: "rgba(255, 255, 255, 0.16)" });
  tl.fromTo(cam, { opacity: 0.5 }, A({ opacity: 0, duration: 0.35 }), T(pe + 0.75));
  tl.fromTo(ok, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 0.75));
  tl.fromTo(tbl, { scale: 1, y: 0, opacity: 1 }, A({ scale: 0.36, y: -250, opacity: 0, duration: 0.55, ease: "power2.in" }), T(pe + 0.75));
  const brief = q(".s31-brief");
  tl.fromTo(brief, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.55, ease: E.SPRING }), T(pe + 1.05));
  E.sweep(tl, brief, T(pe + 1.4), 0.6);
  qa(".s31-links path").forEach((p, i) => E.draw(tl, p, T(pe + 1.5 + i * 0.06), 0.45));
  const scns = qa(".s31-scn");
  scns.forEach((s, i) => tl.fromTo(s, { opacity: 0, y: 20, scale: 0.9 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: E.SPRING }), T(pe + 1.75 + i * 0.12)));
  qa(".s31-ag").forEach((a, i) => tl.fromTo(a, { opacity: 0, scale: 0.4 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }), T(pe + 2.2 + i * 0.1)));
  tl.fromTo(q(".s31-aglab"), { opacity: 0, y: 10 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(pe + 2.45));
  tl.fromTo(q(".s31-crit"), { opacity: 0, y: 18, scale: 0.92 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: E.SPRING }), T(pe + 3.0));
  scns.forEach((s, i) => {
    const t = T(pe + 3.25 + i * 0.14), sr = E.q(".s31-sr", s), fg = E.q(".s31-sr .fg", s), L = 2 * Math.PI * 18;
    fg.style.strokeDasharray = L.toFixed(2) + " " + L.toFixed(2);
    fg.style.strokeDashoffset = L.toFixed(2);
    tl.fromTo(sr, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), t);
    tl.fromTo(fg, { strokeDashoffset: L }, A({ strokeDashoffset: L * 0.07, duration: 0.6, ease: "power2.out" }), t);
  });
  const csc = q(".s31-cscan");
  tl.fromTo(csc, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(pe + 3.12));
  tl.fromTo(csc, { x: 0 }, A({ x: -920, duration: 0.9, ease: "power1.inOut" }), T(pe + 3.12));
  tl.fromTo(csc, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(pe + 3.9));
  E.burst(tl, root, 400, 562, T(pe + 3.45), { n: 14, seed: 31, r0: 60, r1: 120, color: "#c9c2ff" });
};
