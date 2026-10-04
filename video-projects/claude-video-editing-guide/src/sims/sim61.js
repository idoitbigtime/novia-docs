window.SIMS = window.SIMS || {};
window.SIMS.sim61 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim61, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim61"), win = q(".s61-win");
  const PX = 29;                             // timeline: pixels per second of the recording
  const rows = qa(".s61-row"), olds = rows.filter((r) => !r.classList.contains("s61-new")), nw = q(".s61-new");
  const pop = q(".s61-pop"), ticks = qa(".s61-tk"), head = q(".s61-head");
  const LIL = "#c9c2ff";

  // the playhead: chained moves, in seconds of the recording
  let hs = 0;
  const headTo = (s, t, d, ease) => {
    tl.fromTo(head, { x: hs * PX }, A({ x: s * PX, duration: d, ease: ease || "power2.out" }), T(t));
    hs = s;
  };
  // one scan pass over the screen (each pass is its own line element, so no tween is ever reused)
  const scan0 = q(".s61-scan");
  const scanAt = (t, d) => {
    const ln = scan0.cloneNode(true);
    win.appendChild(ln);
    d = d || 0.26;
    tl.fromTo(ln, { opacity: 0 }, A({ opacity: 1, duration: 0.05 }), T(t));
    tl.fromTo(ln, { y: 0 }, A({ y: 354, duration: d, ease: "power1.inOut" }), T(t));
    tl.fromTo(ln, { opacity: 1 }, A({ opacity: 0, duration: 0.07 }), T(t + d - 0.07));
  };
  const tickOn = (s, t) => tl.fromTo(ticks[s], { backgroundColor: "rgba(201, 194, 255, " + (s % 5 ? "0.4" : "0.65") + ")" }, A({ backgroundColor: "rgba(255, 255, 255, 1)", duration: 0.15 }), T(t));
  // the mail list: a new mail arrives at the top at 0:10, and goes again when the recording is rewound
  let arrived = false;
  const arrive = (t) => {
    olds.forEach((r) => tl.fromTo(r, { y: 0 }, A({ y: 66, duration: 0.32, ease: E.SPRING }), T(t)));
    tl.fromTo(nw, { opacity: 0, y: -24 }, A({ opacity: 1, y: 0, duration: 0.32, ease: E.SPRING }), T(t + 0.04));
    arrived = true;
  };
  const rewindList = (t) => {
    if (!arrived) return;
    olds.forEach((r) => tl.fromTo(r, { y: 66 }, A({ y: 0, duration: 0.32, ease: "power2.inOut" }), T(t)));
    tl.fromTo(nw, { opacity: 1, y: 0 }, A({ opacity: 0, y: -24, duration: 0.22, ease: "power2.in" }), T(t));
    arrived = false;
  };
  // the popup: in from the top, out to the top
  const popIn = (t, d) => tl.fromTo(pop, { opacity: 0, y: -24 }, A({ opacity: 1, y: 0, duration: d || 0.25, ease: "power2.out" }), T(t));
  const popOut = (t, d) => tl.fromTo(pop, { opacity: 1, y: 0 }, A({ opacity: 0, y: -24, duration: d || 0.22, ease: "power2.in" }), T(t));
  // a finding: a frame with its time tag. Addresses are caught with a white flash that settles lilac; only the
  // popup's catch is red (red rule). The tags stay until the replay (beat 3).
  const flag = (sens, t, red) => {
    const fr = E.q(".s61-fr", sens), tg = E.q(".s61-tag", sens);
    const c0 = "#ffffff", g0 = "0 0 14px rgba(255, 255, 255, 0.6)";   // (the CSS frame is red)
    tl.fromTo(fr, { opacity: 0, scale: 1.18 }, A({ opacity: 1, scale: 1, duration: 0.3, ease: E.SPRING }), T(t));
    tl.fromTo(tg, { opacity: 0, y: 6 }, A({ opacity: 1, y: 0, duration: 0.25, ease: E.SPRING }), T(t + 0.03));
    if (!red) tl.fromTo(fr, { borderColor: c0, boxShadow: g0 }, A({ borderColor: LIL, boxShadow: "0 0 10px rgba(201, 194, 255, 0.45)", duration: 0.45, ease: "power1.out" }), T(t));
  };
  // redact: the sharp text gives way to its blurred twin
  const blurOn = (sens, t, d) => {
    tl.fromTo(E.q(".s61-sh", sens), { opacity: 1 }, A({ opacity: 0, duration: d || 0.12 }), T(t));
    tl.fromTo(E.q(".s61-blur", sens), { opacity: 0 }, A({ opacity: 1, duration: d || 0.12 }), T(t));
  };
  const mk = qa(".s61-mk");
  const mark = (k, t) => tl.fromTo(mk[k], { opacity: 0, scale: 0.2, rotation: 45 }, A({ opacity: 1, scale: 1, rotation: 45, duration: 0.45, ease: "back.out(2.2)" }), T(t));
  const emails = olds.map((r) => E.q(".s61-sens", r)), sNew = E.q(".s61-sens", nw), sPop = E.q(".s61-sens", pop);

  // B0 establishing shot: the recording and its 20-second timeline
  const t0 = cfg.tStage;
  tl.fromTo(win, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(t0 + 0.05));
  tl.fromTo(win, { y: 14 }, A({ y: 0, duration: 0.6, ease: E.SPRING }), T(t0 + 0.05));
  olds.forEach((r, k) => tl.fromTo(r, { opacity: 0, x: -14 }, A({ opacity: 1, x: 0, duration: 0.35, ease: E.SPRING }), T(t0 + 0.2 + k * 0.06)));
  const tlp = q(".s61-tlp");
  tl.fromTo(tlp, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(t0 + 0.15));
  tl.fromTo(q(".s61-rl"), { scaleX: 0 }, A({ scaleX: 1, duration: 0.55, ease: "power2.inOut" }), T(t0 + 0.2));
  ticks.forEach((tk, s) => tl.fromTo(tk, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(t0 + 0.25 + s * 0.018)));
  qa(".s61-tl").forEach((lb, i) => tl.fromTo(lb, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(t0 + 0.3 + i * 0.1)));
  tl.fromTo(head, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(t0 + 0.45));

  // B1 "קלוד קורא את הטקסט שעל המסך בכל שנייה של ההקלטה": one frame per second; the scan line reads each one
  const b1 = P[0], st0 = q(".s61-st0");
  tl.fromTo(st0, { opacity: 0, scale: 0.85 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: E.SPRING }), T(b1 + 0.05));
  scanAt(b1 + 0.12);
  tickOn(0, b1 + 0.12);
  emails.forEach((s, k) => tl.fromTo(E.q(".s61-ocr", s), { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b1 + 0.16 + k * 0.05)));
  olds.forEach((r, k) => tl.fromTo(E.q(".s61-subj .s61-ocr", r), { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b1 + 0.18 + k * 0.05)));
  for (let s = 1; s <= 8; s++) {
    const t = b1 + 0.2 + s * 0.31;
    headTo(s, t, 0.14);
    tickOn(s, t);
    scanAt(t);
  }
  tl.fromTo(st0, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(P[1] - 0.15));

  // B2 "מוצא מיילים, טלפונים וכל פרט שביקשתם להסתיר": the addresses get red frames with their time;
  // a new mail at 0:10; a popup with a phone number shows for a moment at 0:12 and is caught
  const b2 = P[1];
  olds.forEach((r) => tl.fromTo(E.q(".s61-subj .s61-ocr", r), { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b2 + 0.02)));
  emails.forEach((s, k) => {
    tl.fromTo(E.q(".s61-ocr", s), { opacity: 1 }, A({ opacity: 0, duration: 0.12 }), T(b2 + 0.06 + k * 0.1));
    flag(s, b2 + 0.06 + k * 0.1, false);
  });
  mark(0, b2 + 0.1);
  headTo(9, b2 + 0.42, 0.14);
  tickOn(9, b2 + 0.42);
  scanAt(b2 + 0.42);
  headTo(10, b2 + 0.6, 0.14);
  tickOn(10, b2 + 0.6);
  arrive(b2 + 0.6);
  scanAt(b2 + 0.68);
  flag(sNew, b2 + 0.75, false);
  mark(1, b2 + 0.78);
  headTo(11, b2 + 0.82, 0.14);
  tickOn(11, b2 + 0.82);
  // 0:12: the popup is caught (the one red mark, held ~0.7 s; the playhead waits on it)
  headTo(12, b2 + 1.0, 0.14);
  tickOn(12, b2 + 1.0);
  popIn(b2 + 1.0);
  scanAt(b2 + 1.05);
  flag(sPop, b2 + 1.15, true);
  mark(2, b2 + 1.18);
  popOut(b2 + 1.92);
  headTo(13, b2 + 1.92, 0.14);
  tickOn(13, b2 + 1.92);

  // B3 "ומטשטש אותו בדיוק בזמן שהוא על המסך": the recording is replayed with the blur lanes; each blur is on
  // exactly while its item is on screen (the popup's 0.6 s; the camera punches in on the popup)
  const b3 = P[2];
  [...emails, sNew].forEach((s) => tl.fromTo(E.q(".s61-fr", s), { opacity: 1 }, A({ opacity: 0, duration: 0.22 }), T(b3)));
  [...emails, sNew, sPop].forEach((s) => tl.fromTo(E.q(".s61-tag", s), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b3)));
  tl.fromTo(E.q(".s61-fr", sPop), { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), T(b3));
  headTo(8, b3 + 0.05, 0.35, "power2.inOut");
  rewindList(b3 + 0.05);
  qa(".s61-seg").forEach((sg, k) => {
    tl.fromTo(sg, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b3 + 0.1 + k * 0.08));
    tl.fromTo(sg, { scaleX: 0 }, A({ scaleX: 1, duration: 0.45, ease: E.SPRING }), T(b3 + 0.1 + k * 0.08));
  });
  emails.forEach((s, k) => blurOn(s, b3 + 0.15 + k * 0.04));
  blurOn(sNew, b3 + 0.3, 0.05);
  blurOn(sPop, b3 + 0.3, 0.05);
  headTo(10, b3 + 0.45, 0.2, "none");
  arrive(b3 + 0.65);
  headTo(12, b3 + 0.65, 0.2, "none");
  popIn(b3 + 0.85, 0.16);
  headTo(12.6, b3 + 0.85, 0.6, "none");
  const seg2 = q(".s61-seg2");
  tl.fromTo(seg2, { scaleY: 1 }, A({ scaleY: 1.6, duration: 0.2, ease: "power2.out" }), T(b3 + 0.85));
  tl.fromTo(seg2, { scaleY: 1.6 }, A({ scaleY: 1, duration: 0.3, ease: "power2.inOut" }), T(b3 + 1.3));
  const link = q(".s61-link line");
  E.draw(tl, link, T(b3 + 0.88), 0.2, "power2.out");
  tl.fromTo(q(".s61-link"), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b3 + 1.42));
  // the playhead steps back while the link shows, so the two never read as twin lines
  tl.fromTo(head, { opacity: 1 }, A({ opacity: 0.3, duration: 0.15 }), T(b3 + 0.8));
  tl.fromTo(head, { opacity: 0.3 }, A({ opacity: 1, duration: 0.2 }), T(b3 + 1.45));
  popOut(b3 + 1.45, 0.16);
  headTo(16, b3 + 1.45, 0.35, "power1.out");

  // B4 "בסוף הוא סורק שוב, כדי לוודא שלא נשאר אף אחד": the re-scan sweeps the whole redacted recording
  const b4 = P[3], st1 = q(".s61-st1");
  tl.fromTo(st1, { opacity: 0, scale: 0.85 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: E.SPRING }), T(b4 + 0.02));
  headTo(0, b4 + 0.05, 0.4, "power2.inOut");
  rewindList(b4 + 0.05);
  headTo(20, b4 + 0.5, 2.0, "none");
  for (let k = 0; k < 5; k++) scanAt(b4 + 0.5 + k * 0.4, 0.34);
  emails.forEach((s, k) => {
    const ck = E.q(".s61-ck", s);
    tl.fromTo(ck, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), T(b4 + 0.58 + k * 0.05));
    E.draw(tl, E.q("path", ck), T(b4 + 0.62 + k * 0.05), 0.25);
  });
  arrive(b4 + 1.5);
  const ckN = E.q(".s61-ck", sNew);
  tl.fromTo(ckN, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), T(b4 + 1.68));
  E.draw(tl, E.q("path", ckN), T(b4 + 1.72), 0.25);

  // payoff: the re-scan ends with no findings
  const res = q(".s61-res");
  tl.fromTo(st1, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(pe + 0.02));
  tl.fromTo(head, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 0.02));
  E.dim(tl, q(".s61-list"), T(pe + 0.05), 0.42, 1, 0.4);
  E.dim(tl, q(".s61-side"), T(pe + 0.05), 0.42, 1, 0.4);
  tl.fromTo(res, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), T(pe + 0.1));
  tl.fromTo(res, { scale: 0.86, y: 16 }, A({ scale: 1, y: 0, duration: 0.65, ease: E.SPRING }), T(pe + 0.1));
  E.draw(tl, q(".s61-rok circle"), T(pe + 0.3), 0.45);
  E.draw(tl, q(".s61-rok path"), T(pe + 0.6), 0.3);
  const rc = E.off(res, root);
  E.burst(tl, root, rc.x + res.offsetWidth / 2, rc.y + res.offsetHeight / 2, T(pe + 0.62), { n: 16, seed: 61, r0: 150, r1: 230, color: "#c9c2ff" });
  E.sweep(tl, res, T(pe + 0.85), 0.8, { color: "rgba(201, 194, 255, 0.22)" });
  E.sweep(tl, tlp, T(pe + 1.0), 0.9, { color: "rgba(201, 194, 255, 0.12)" });
  // "0 ממצאים": the findings lane agrees: its marks dim and the lane ends with a check
  mk.forEach((m) => tl.fromTo(m, { opacity: 1 }, A({ opacity: 0.25, duration: 0.35 }), T(pe + 0.3)));
  const lok = q(".s61-lok");
  tl.fromTo(lok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(pe + 0.55));
  E.draw(tl, E.q("path", lok), T(pe + 0.6), 0.28);
};
