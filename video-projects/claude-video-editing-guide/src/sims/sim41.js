window.SIMS = window.SIMS || {};
window.SIMS.sim41 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim41"), persp = q(".s41-persp"), stack = q(".s41-stack"), ovl = q(".s41-ovl");
  const chk = q(".s41-chk"), room = q(".s41-room"), ovlo = q(".s41-ovlo");
  const cards = qa(".s41-ovl .s41-card");
  // the reel's two layers come apart (CSS 3D: the clip layer moves toward the viewer) and land back
  const LIFT = { rotationY: -20, rotationX: 6, scale: 0.9 }, FLAT = { rotationY: 0, rotationX: 0, scale: 1 };
  const split = (t) => {
    tl.fromTo(stack, Object.assign({}, FLAT), A(Object.assign({ duration: 0.9, ease: E.SPRING }, LIFT)), t);
    tl.fromTo(ovl, { z: 1 }, A({ z: 120, duration: 0.9, ease: E.SPRING }), t);
    tl.fromTo(chk, { opacity: 0 }, A({ opacity: 0.92, duration: 0.45, ease: "power2.out" }), t + 0.06);
  };
  const land = (t) => {
    tl.fromTo(stack, Object.assign({}, LIFT), A(Object.assign({ duration: 0.8, ease: E.SPRING }, FLAT)), t);
    tl.fromTo(ovl, { z: 120 }, A({ z: 1, duration: 0.8, ease: E.SPRING }), t);
    tl.fromTo(chk, { opacity: 0.92 }, A({ opacity: 0, duration: 0.4, ease: "power2.inOut" }), t + 0.25);
    tl.fromTo(ovlo, { opacity: 1 }, A({ opacity: 0, duration: 0.35 }), t + 0.5);
  };

  // the reel plays all along (its progress bar fills right to left)
  tl.fromTo(q(".s41-prog i"), { scaleX: 0.06 }, A({ scaleX: 0.94, duration: cfg.tSimEnd - cfg.tStage, ease: "none" }), T(cfg.tStage));
  // establishing: the sentence's waveform and its two marked moments
  E.fadeIn(tl, q(".s41-lbl"), T(cfg.tStage + 0.2), 0.5, 10);
  E.fadeIn(tl, q(".s41-wavebox"), T(cfg.tStage + 0.3), 0.5, 10);
  const marks = qa(".s41-mk");
  marks.forEach((m, i) => tl.fromTo(m, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), T(cfg.tStage + 0.45 + i * 0.1)));

  // B0 "כל מה שהמשפט צריך זה מילה או אייקון שקופצים ליד הראש": the sentence plays; at each marked moment
  // a spark flies to the head and a card pops next to it ("פרומפט", then "סקילים", the guide's example)
  const b0 = P[0], head = q(".s41-head"), RUN = 2.6, t0 = b0 + 0.1;
  tl.fromTo(head, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(t0));
  tl.fromTo(head, { x: 0 }, A({ x: -400, duration: RUN, ease: "none" }), T(t0));
  tl.fromTo(head, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(t0 + RUN - 0.12));
  tl.fromTo(q(".s41-wclip"), { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: RUN, ease: "none" }), T(t0));
  const sparks = qa(".s41-spark");
  marks.forEach((m, i) => {
    const cx = m.offsetLeft + m.offsetWidth / 2, tHit = t0 + (RUN * (400 - cx)) / 400;
    tl.fromTo(m, { scale: 1 }, A({ scale: 1.4, duration: 0.16, ease: "power2.out" }), T(tHit));
    tl.fromTo(m, { scale: 1.4 }, A({ scale: 1, duration: 0.3, ease: "power2.inOut" }), T(tHit + 0.16));
    tl.fromTo(m, { backgroundColor: "#2a2450" }, A({ backgroundColor: "#ffffff", duration: 0.15 }), T(tHit));
    tl.fromTo(E.q("b", m), { opacity: 0.9, scale: 1 }, A({ opacity: 0, scale: 2.8, duration: 0.6, ease: "power2.out" }), T(tHit));
    const sp = sparks[i], card = cards[i], a = E.center(sp, root), b = E.center(card, root);
    tl.fromTo(sp, { opacity: 0 }, A({ opacity: 1, duration: 0.08 }), T(tHit));
    tl.fromTo(sp, { x: 0 }, A({ x: b.x - a.x, duration: 0.32, ease: "power1.in" }), T(tHit));
    tl.fromTo(sp, { y: 0 }, A({ y: b.y - a.y, duration: 0.32, ease: "power2.out" }), T(tHit));
    tl.fromTo(sp, { opacity: 1 }, A({ opacity: 0, duration: 0.08 }), T(tHit + 0.28));
    const tc = tHit + 0.3;
    tl.fromTo(card, { opacity: 0 }, A({ opacity: 1, duration: 0.16 }), T(tc));
    tl.fromTo(card, { scale: 0.5, y: 14 }, A({ scale: 1, y: 0, duration: 0.55, ease: "back.out(1.9)" }), T(tc));
    E.qa(".s41-ico path", card).forEach((p, k) => E.draw(tl, p, T(tc + 0.12 + k * 0.1), 0.42));
    E.burst(tl, ovl, card.offsetLeft + card.offsetWidth / 2, card.offsetTop + card.offsetHeight / 2, T(tc + 0.02),
      { n: 10, seed: 41 + i, r0: 56, r1: 104, color: "#c9c2ff" });
  });

  // B1 "קלוד מוציא אותם כקובץ MOV שקוף שמניחים מעל הסרטון": the reel splits into layers; the cards sit on a
  // transparent layer (checkerboard) = clip.mov · ProRes 4444; then it lands back over the video
  const b1 = P[1];
  E.fadeOut(tl, q(".s41-p0"), T(b1), 0.3, -20);
  split(T(b1 + 0.04));
  tl.fromTo(room, { opacity: 1 }, A({ opacity: 0.6, duration: 0.45 }), T(b1 + 0.1));
  E.draw(tl, q(".s41-ovlo rect"), T(b1 + 0.15), 0.9);
  tl.fromTo(q(".s41-file"), { opacity: 0, scale: 0.7 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }), T(b1 + 0.5));
  tl.fromTo(q(".s41-filechk"), { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b1 + 0.75));
  E.draw(tl, q(".s41-lead path"), T(b1 + 0.7), 0.45);
  tl.fromTo(q(".s41-lead circle"), { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b1 + 1.1));
  E.fadeIn(tl, q(".s41-fname"), T(b1 + 0.72), 0.5, 14);
  E.fadeIn(tl, q(".s41-ffmt"), T(b1 + 0.88), 0.5, 14);
  const tl1 = b1 + 1.7;
  land(T(tl1));
  tl.fromTo(room, { opacity: 0.6 }, A({ opacity: 1, duration: 0.4 }), T(tl1 + 0.25));
  E.sweep(tl, ovl, T(tl1 + 0.55), 0.8, { color: "rgba(201, 194, 255, 0.22)" });

  // B2 "וגם כ-MP4 על צבע המותג": the same cards fly into a second file on the brand colour
  const b2 = P[2], mbg = q(".s41-mbg");
  E.fadeOut(tl, q(".s41-p1"), T(b2), 0.3, -20);
  tl.fromTo(mbg, { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.55, ease: "power2.inOut" }), T(b2 + 0.2));
  qa(".s41-mini .s41-card").forEach((card, i) => {
    const a = E.center(cards[i], root), b = E.center(card, root), t = T(b2 + 0.32 + i * 0.12);
    tl.fromTo(card, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), t);
    tl.fromTo(card, { x: a.x - b.x, y: a.y - b.y }, A({ x: 0, y: 0, duration: 0.75, ease: E.SPRING }), t);
  });
  E.fadeIn(tl, q(".s41-tmp4"), T(b2 + 0.7), 0.5, 14);
  E.fadeIn(tl, q(".s41-tmov"), T(b2 + 0.82), 0.5, 14);
  E.sweep(tl, mbg, T(b2 + 0.95), 0.7, { color: "rgba(255, 255, 255, 0.2)" });

  // B3 "למקרה שהתוכנה לא קוראת קובץ שקוף": a generic editor; the MOV is not read (glitch, red cross) and
  // bounces out, the MP4 goes into the track (check)
  const b3 = P[3], p3 = q(".s41-p3"), bmov = q(".s41-bmov"), bmp4 = q(".s41-bmp4");
  E.fadeOut(tl, q(".s41-p2"), T(b3), 0.3, -20);
  tl.fromTo(persp, { opacity: 1 }, A({ opacity: 0.5, duration: 0.4 }), T(b3));
  tl.fromTo(p3, { opacity: 0, y: 30 }, A({ opacity: 1, y: 0, duration: 0.55, ease: E.SPRING }), T(b3 + 0.08));
  tl.fromTo(q(".s41-vblk"), { scaleX: 0.15 }, A({ scaleX: 1, duration: 0.5, ease: "power2.out" }), T(b3 + 0.2));
  const ph = q(".s41-ph");
  tl.fromTo(ph, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b3 + 0.25));
  tl.fromTo(ph, { x: 0 }, A({ x: -44, duration: pe + 0.5 - (b3 + 0.25), ease: "none" }), T(b3 + 0.25));
  tl.fromTo(bmov, { opacity: 0, y: -46 }, A({ opacity: 1, y: 0, duration: 0.38, ease: "back.out(1.6)" }), T(b3 + 0.2));
  E.glitch(tl, bmov, T(b3 + 0.6), 9);
  tl.fromTo(bmov, { borderColor: "rgba(201, 194, 255, 0.55)" }, A({ borderColor: "rgba(255, 69, 58, 0.9)", duration: 0.2 }), T(b3 + 0.6));
  const no = q(".s41-no");
  tl.fromTo(no, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), T(b3 + 0.66));
  qa(".s41-no path").forEach((p, i) => E.draw(tl, p, T(b3 + 0.7 + i * 0.12), 0.22));
  tl.fromTo(bmov, { y: 0 }, A({ y: -182, duration: 0.5, ease: E.SPRING }), T(b3 + 0.95));
  tl.fromTo(bmp4, { opacity: 0, y: -46 }, A({ opacity: 1, y: 0, duration: 0.38, ease: "back.out(1.6)" }), T(b3 + 1.12));
  const ok = q(".s41-ok");
  tl.fromTo(ok, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), T(b3 + 1.5));
  E.draw(tl, q(".s41-ok path"), T(b3 + 1.55), 0.3);
  E.burst(tl, p3, bmp4.offsetLeft + bmp4.offsetWidth / 2, bmp4.offsetTop + bmp4.offsetHeight / 2, T(b3 + 1.5),
    { n: 10, seed: 43, r0: 60, r1: 150, color: "#c9c2ff" });

  // payoff, the green test: the layers split again, the video gives way to a full green, the clip lands on it
  tl.fromTo(persp, { opacity: 0.5 }, A({ opacity: 1, duration: 0.35 }), T(pe));
  E.fadeOut(tl, p3, T(pe + 0.5), 0.3, -20);
  const tx = pe + 0.2, green = q(".s41-green"), gscan = q(".s41-gscan");
  split(T(tx));
  tl.fromTo(ovlo, { opacity: 0 }, A({ opacity: 1, duration: 0.35 }), T(tx + 0.1));
  tl.fromTo(room, { opacity: 1 }, A({ opacity: 0, duration: 0.45 }), T(tx + 0.3));
  tl.fromTo(green, { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.7, ease: "power2.inOut" }), T(tx + 0.55));
  tl.fromTo(gscan, { x: 322 }, A({ x: -4, duration: 0.7, ease: "power2.inOut" }), T(tx + 0.55));
  tl.fromTo(gscan, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(tx + 0.55));
  tl.fromTo(gscan, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(tx + 1.12));
  const tland = pe + 1.35;
  land(T(tland));
  const hc = E.center(persp, root);
  E.burst(tl, root, hc.x, hc.y - 40, T(tland + 0.55), { n: 14, seed: 47, r0: 120, r1: 230, color: "#9df0c0" });
  tl.fromTo(q(".s41-hex"), { opacity: 0 }, A({ opacity: 1, duration: 0.4 }), T(tland + 0.6));
  const tlab = pe + 1.85, gb = q(".s41-gbadge");
  tl.fromTo(gb, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }), T(tlab));
  E.draw(tl, q(".s41-gchk path"), T(tlab + 0.15), 0.4);
  E.fadeIn(tl, q(".s41-gl1"), T(tlab + 0.2), 0.5, 16);
  E.fadeIn(tl, q(".s41-gl2"), T(tlab + 0.38), 0.5, 16);
  E.burst(tl, q(".s41-p4"), gb.offsetLeft + gb.offsetWidth / 2, gb.offsetTop + gb.offsetHeight / 2, T(tlab + 0.12),
    { n: 12, seed: 14, r0: 50, r1: 120, color: "#9df0c0" });
  E.sweep(tl, q(".s41-base"), T(tlab + 0.7), 0.9, { color: "rgba(255, 255, 255, 0.18)" });
};
