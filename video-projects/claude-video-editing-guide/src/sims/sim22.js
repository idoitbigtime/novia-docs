window.SIMS = window.SIMS || {};
window.SIMS.sim22 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim22, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);

  // B0: the audio track arrives with the stage
  E.fadeIn(tl, q(".s22-wavebox"), T(cfg.tStage + 0.25), 0.5, 10);

  // B1 "התמלול נעשה עם המודל הגדול (large-v3)": the audio plays into large-v3, words come out with time marks
  const b1 = P[0], head = q(".s22-head");
  tl.fromTo(head, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(b1 + 0.05));
  tl.fromTo(head, { x: 0 }, A({ x: -410, duration: 1.5, ease: "none" }), T(b1 + 0.05));
  tl.fromTo(head, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(b1 + 1.45));
  tl.fromTo(q(".s22-wclip"), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 1.5, ease: "none" }), T(b1 + 0.05));
  const dots = qa(".s22-flow i");
  for (let k = 0; k < 7; k++) {
    const d = dots[k % 3], t = T(b1 + 0.3 + k * 0.2);
    tl.fromTo(d, { y: 0 }, A({ y: 72, duration: 0.55, ease: "power1.in" }), t);
    tl.fromTo(d, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), t);
    tl.fromTo(d, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), t + 0.42);
  }
  const big = q(".s22-big");
  tl.fromTo(big, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 0.35));
  tl.fromTo(big, { scale: 0.9 }, A({ scale: 1, duration: 0.6, ease: E.SPRING }), T(b1 + 0.35));
  E.draw(tl, q(".s22-chipo rect"), T(b1 + 0.35), 0.8);
  const ok = q(".s22-ok");
  tl.fromTo(ok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b1 + 1.25));
  E.draw(tl, q(".s22-ok path"), T(b1 + 1.3), 0.35);
  qa(".s22-blk").forEach((b, i) => {
    const t = T(b1 + 1.0 + i * 0.13);
    tl.fromTo(b, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t);
    tl.fromTo(b, { scaleX: 0.2 }, A({ scaleX: 1, duration: 0.45, ease: "back.out(1.8)" }), t);
  });

  // B2 "כי ברירת המחדל של HyperFrames מבינה רק אנגלית": a Hebrew letter bounces off the default model
  const b2 = P[1], def = q(".s22-def"), tok = q(".s22-tok");
  // the big model steps left; the default model stands 16 px to its right (sim22.css: x 24..204 and 220..418)
  tl.fromTo(big, { x: 0 }, A({ x: -96, duration: 0.6, ease: E.SPRING }), T(b2 + 0.05));
  tl.fromTo(def, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b2 + 0.25));
  tl.fromTo(def, { x: 30, scale: 0.92 }, A({ x: 0, scale: 1, duration: 0.6, ease: E.SPRING }), T(b2 + 0.25));
  tl.fromTo(tok, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b2 + 0.7));
  tl.fromTo(tok, { y: 0, x: 0, rotation: 0 }, A({ y: 136, x: 0, rotation: 0, duration: 0.45, ease: "power2.in" }), T(b2 + 0.7));
  tl.fromTo(tok, { y: 136, x: 0, rotation: 0 }, A({ y: 50, x: 64, rotation: 40, duration: 0.5, ease: "power2.out" }), T(b2 + 1.15));
  tl.fromTo(tok, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b2 + 1.4));
  E.glitch(tl, def, T(b2 + 1.15), 9);
  // rejected: a red badge in its corner, its border turns red and it steps back
  const no = q(".s22-no");
  tl.fromTo(no, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(b2 + 1.25));
  qa(".s22-no path").forEach((p, i) => E.draw(tl, p, T(b2 + 1.3 + i * 0.14), 0.25));
  tl.fromTo(def, { borderColor: "rgba(201, 194, 255, 0.28)" }, A({ borderColor: "rgba(255, 69, 58, 0.75)", duration: 0.3 }), T(b2 + 1.25));
  tl.fromTo(def, { opacity: 1 }, A({ opacity: 0.72, duration: 0.4 }), T(b2 + 1.9));

  // B3 "אחר כך קלוד קורא כל כתובית כמשפט שלם": captions are read one by one, each as a whole sentence;
  // in the third one the sentence gives the wrong word away (the camera punches in on it)
  const b3 = P[2], rd = q(".s22-rd"), rows = qa(".s22-row"), cap = q(".s22-cap3"), cxbad = q(".s22-cxbad");
  // the rejected red card is gone before the key phrase turns red (one red at a time beside the badge)
  tl.fromTo(q(".s22-p1"), { opacity: 1, y: 0 }, A({ opacity: 0, y: -30, duration: 0.36, ease: "power2.in" }), T(b3 - 0.1));
  rows.forEach((r, i) => {
    tl.fromTo(r, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 0.38 + i * 0.07));
    tl.fromTo(r, { x: 14 }, A({ x: 0, duration: 0.5, ease: E.SPRING }), T(b3 + 0.38 + i * 0.07));
  });
  tl.fromTo(rd, { opacity: 0, scale: 1.02 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: E.SPRING }), T(b3 + 0.6));
  tl.fromTo(rd, { y: 0 }, A({ y: 96, duration: 0.4, ease: E.SPRING }), T(b3 + 1.0));
  tl.fromTo(rd, { y: 96 }, A({ y: 192, duration: 0.4, ease: E.SPRING }), T(b3 + 1.4));
  // flagged in amber: this beat plays while the explanation's key phrase is red
  const w3 = q(".s22-r3w");
  tl.fromTo(w3, { color: "#ffffff" }, A({ color: "#f5b544", duration: 0.25 }), T(b3 + 1.8));
  E.draw(tl, q(".s22-r3w .s22-wavy path"), T(b3 + 1.8), 0.4);
  tl.fromTo(rd, { borderColor: "#c9c2ff" }, A({ borderColor: "#f5b544", duration: 0.25 }), T(b3 + 1.8));
  // the same caption on the video (white), flagged by the squiggle only
  tl.fromTo(cap, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.45, ease: E.SPRING }), T(b3 + 1.85));
  E.draw(tl, q(".s22-cap3 .s22-wavy path"), T(b3 + 2.0), 0.4);

  // B4 "ומתקן מילים שנשמעות אותו דבר ונכתבות אחרת": fixes with their letter pairs; the caption corrects
  const b4 = P[3];
  tl.fromTo(q(".s22-p3"), { opacity: 1, y: 0 }, A({ opacity: 0, y: -30, duration: 0.3, ease: "power2.in" }), T(b4 - 0.05));
  // one row at a time: the wrong word is struck in red only while it is being fixed (t+0.2 .. t+0.65), the right
  // word lands, and the struck word steps back to grey; the first red waits for the key phrase to step back
  const RED = "#ff6b61", GREY = "#8c86a8";
  qa(".s22-fix").forEach((row, i) => {
    const t = T(b4 + c.fix0 + i * c.fixStep);
    const bad = E.q(".s22-bad", row), st = E.q(".s22-strike", row), ar = E.q(".s22-farw", row);
    const good = E.q(".s22-good", row), pair = E.q(".s22-pair", row);
    tl.fromTo(bad, { opacity: 0, y: 14 }, A({ opacity: 1, y: 0, duration: 0.35, ease: E.SPRING }), t);
    tl.fromTo(bad, { color: "#ece9f7" }, A({ color: RED, duration: 0.12 }), t + 0.2);
    tl.fromTo(st, { opacity: 1, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.25, ease: "power2.inOut" }), t + 0.2);
    tl.fromTo(ar, { opacity: 0, x: 12 }, A({ opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }), t + 0.22);
    tl.fromTo(pair, { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }), t + 0.28);
    tl.fromTo(good, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), t + 0.45);
    tl.fromTo(good, { scale: 0.8 }, A({ scale: 1, duration: 0.5, ease: "back.out(2)" }), t + 0.45);
    tl.fromTo(good, { filter: "blur(8px)" }, A({ filter: "blur(0px)", duration: 0.28, ease: "power2.out" }), t + 0.45);
    tl.set(good, { filter: "none" }, t + 0.74);
    tl.fromTo(bad, { color: RED }, A({ color: GREY, duration: 0.15 }), t + 0.5);
    tl.fromTo(st, { backgroundColor: RED }, A({ backgroundColor: GREY, duration: 0.15 }), t + 0.5);
    E.burst(tl, row, good.offsetLeft + good.offsetWidth / 2, row.offsetHeight / 2, t + 0.5, { n: 8, seed: 40 + i, r0: 26, r1: 70, color: "#c9c2ff" });
  });
  // the last fix is the caption's own word: it swaps on the phone at the same moment
  const tSwap = T(b4 + c.fix0 + (c.fixes.length - 1) * c.fixStep + 0.45), cxgood = q(".s22-cxgood");
  tl.fromTo(cxbad, { opacity: 1 }, A({ opacity: 0, duration: 0.12, ease: "power1.in" }), tSwap);
  tl.fromTo(cxbad, { filter: "blur(0px)" }, A({ filter: "blur(6px)", duration: 0.12 }), tSwap);
  tl.fromTo(cxgood, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), tSwap + 0.13);
  tl.fromTo(cxgood, { scale: 0.9 }, A({ scale: 1, duration: 0.35, ease: E.SPRING }), tSwap + 0.13);
  tl.fromTo(q(".s22-cap3 .s22-wavy"), { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), tSwap);
  E.burst(tl, cap, cap.offsetWidth / 2, 24, tSwap + 0.15, { n: 12, seed: 22, r0: 40, r1: 130, color: "#c9c2ff" });

  // payoff, style 1: white pill switching in one frame (no gap, no overlap); style 2: kinetic words
  tl.fromTo(cap, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(pe + 0.6));
  E.dim(tl, q(".s22-fixes"), T(pe + 0.6), 0.32, 1, 0.35);
  E.fadeIn(tl, q(".s22-l1"), T(pe + 0.65), 0.5, 16);
  let tp = pe + c.pills0;
  c.pills.forEach((p, i) => { E.pill(tl, q("#t22-p" + (i + 1)), T(tp), T(tp + c.pillStep)); tp += c.pillStep; });
  E.dim(tl, q(".s22-l1"), T(pe + c.kin0 - 0.3), 0.35);
  E.fadeIn(tl, q(".s22-l2"), T(pe + c.kin0 - 0.25), 0.5, 16);
  E.kin(tl, q(".s22-kinrow"), S, { dy: 14 });
};
