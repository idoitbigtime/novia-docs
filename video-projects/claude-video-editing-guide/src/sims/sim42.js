window.SIMS = window.SIMS || {};
window.SIMS.sim42 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const root = q(".sim42");
  const faces = qa(".s42-face"), frA = q(".s42-frA"), frB = q(".s42-frB");
  // light sweep, right to left; unlike a skewed band it starts and ends fully outside its element, so a tall
  // element never shows a sliver of it before or after
  const sweep = (el, t, d, color) => {
    const fx = document.createElement("i"), b = document.createElement("b");
    fx.className = "s42-swp";
    b.style.background = "linear-gradient(105deg, rgba(255, 255, 255, 0) 25%, " + color + " 50%, rgba(255, 255, 255, 0) 75%)";
    fx.appendChild(b);
    el.appendChild(fx);
    const w = el.offsetWidth, bw = Math.round(Math.max(140, w * 0.6));
    b.style.width = bw + "px";
    tl.fromTo(b, { x: 0 }, A({ x: -(w + bw + 4), duration: d, ease: "power2.inOut" }), t);
  };
  const badge = (el, t) => tl.fromTo(el, { opacity: 0, scale: 0.6 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }), t);

  // establishing: the video plays at the right; the platform window waits with four empty upload slots
  tl.fromTo(q(".s42-sprog i"), { scaleX: 0.08 }, A({ scaleX: 0.62, duration: 2.2, ease: "none" }), T(cfg.tStage));

  // B0 "קלוד לוקח ארבעה פריימים חדים מהסרטון ושולח אותם ל-fal.ai": four captures (front, two angles, a smile),
  // focus brackets snap on each (sharp); the video gives way to the frames, which are uploaded into the window
  const b0 = P[0], flash = q(".s42-flash");
  faces.forEach((f, i) => {
    const t = b0 + 0.16 + i * 0.35;
    tl.fromTo(flash, { opacity: 0 }, A({ opacity: 0.3, duration: 0.04 }), T(t));
    tl.fromTo(flash, { opacity: 0.3 }, A({ opacity: 0, duration: 0.18, ease: "power2.out" }), T(t + 0.04));
    tl.fromTo(f, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(t + 0.04));
    tl.fromTo(f, { scale: 1.14 }, A({ scale: 1, duration: 0.45, ease: E.SPRING }), T(t + 0.04));
    E.qa(".s42-brk path", f).forEach((p) => E.draw(tl, p, T(t + 0.14), 0.26));
  });
  tl.fromTo(q(".s42-src"), { opacity: 1 }, A({ opacity: 0, duration: 0.4 }), T(b0 + 1.55));
  qa(".s42-upc").forEach((u, i) => {
    const a = E.center(faces[i], root), b = E.center(u, root), t = T(b0 + 1.72 + i * 0.1);
    tl.fromTo(u, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), t);
    tl.fromTo(u, { x: a.x - b.x, y: a.y - b.y, scale: faces[i].offsetWidth / u.offsetWidth },
      A({ x: 0, y: 0, scale: 1, duration: 0.62, ease: E.SPRING }), t);
  });
  E.fadeIn(tl, q(".s42-uptag"), T(b0 + 1.76), 0.45, 10);
  tl.fromTo(q(".s42-upbar i"), { scaleX: 0 }, A({ scaleX: 1, duration: 0.8, ease: "power1.inOut" }), T(b0 + 1.76));

  // B1 "פלטפורמה עם המון מודלים ליצירת תמונות וסרטונים": the window fills with image and video models
  const b1 = P[1];
  tl.fromTo(qa(".s42-brk"), { opacity: 1 }, A({ opacity: 0.35, duration: 0.4 }), T(b1));
  [[".s42-gl1", ".s42-t1 .s42-tile", 0.06], [".s42-gl2", ".s42-t2 .s42-tile", 0.62]].forEach(([lbl, tiles, d]) => {
    E.fadeIn(tl, q(lbl), T(b1 + d), 0.45, 12);
    qa(tiles).forEach((tile, i) => {
      const t = T(b1 + d + 0.06 + i * 0.04);
      tl.fromTo(tile, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t);
      tl.fromTo(tile, { scale: 0.55 }, A({ scale: 1, duration: 0.5, ease: "back.out(1.8)" }), t);
    });
  });
  sweep(q(".s42-grid"), T(b1 + 1.32), 0.8, "rgba(201, 194, 255, 0.2)");

  // B2 "שם הוא יוצר פריים פתיחה בסצנה חדשה": two versions of the opening frame develop; one is chosen
  const b2 = P[2];
  E.fadeOut(tl, q(".s42-grid"), T(b2), 0.3, -14);
  E.fadeIn(tl, q(".s42-olbl"), T(b2 + 0.26), 0.45, 12);
  [frA, frB].forEach((fr, i) => {
    const t = T(b2 + 0.3 + i * 0.15), fin = E.q(".s42-fin", fr);
    tl.fromTo(fr, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), t);
    E.draw(tl, E.q(".s42-fo path", fr), t, 0.6);
    tl.fromTo(fin, { clipPath: "inset(0px 0px 0px 100%)" }, A({ clipPath: "inset(0px 0px 0px 0%)", duration: 0.7, ease: "power2.inOut" }), t + 0.12);
    sweep(fin, t + 0.78, 0.6, "rgba(255, 255, 255, 0.2)");
  });
  const pick = q(".s42-pick"), tp = b2 + 1.3;
  badge(pick, T(tp));
  E.draw(tl, q(".s42-pick path"), T(tp + 0.05), 0.3);
  tl.fromTo(frA, { boxShadow: "0 0 0px rgba(201, 194, 255, 0)" }, A({ boxShadow: "0 0 34px rgba(201, 194, 255, 0.6)", duration: 0.4 }), T(tp));
  tl.fromTo(frB, { opacity: 1, scale: 1 }, A({ opacity: 0.38, scale: 0.94, duration: 0.45, ease: "power2.out" }), T(tp));
  E.burst(tl, root, frA.offsetLeft + frA.offsetWidth - 4, frA.offsetTop + 4, T(tp + 0.02), { n: 10, seed: 42, r0: 30, r1: 90, color: "#c9c2ff" });

  // B3 "ומנפיש אותו במודל שמקבל פנים אמיתיות כרפרנס": the video model takes the chosen frame, the four real
  // faces flow in as the reference (the punch-in lands on them), the frame comes alive as a clip
  const b3 = P[3], chip = q(".s42-chip");
  E.fadeOut(tl, frB, T(b3), 0.3, 0, 0.38);
  E.fadeOut(tl, q(".s42-olbl"), T(b3), 0.3, -10);
  tl.fromTo(pick, { opacity: 1 }, A({ opacity: 0, duration: 0.25 }), T(b3));
  tl.fromTo(frA, { boxShadow: "0 0 34px rgba(201, 194, 255, 0.6)" }, A({ boxShadow: "0 0 0px rgba(201, 194, 255, 0)", duration: 0.3 }), T(b3));
  tl.fromTo(chip, { opacity: 0, y: -14, scale: 0.96 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: E.SPRING }), T(b3 + 0.22));
  const win = q(".s42-win"), AX = win.offsetLeft + win.offsetWidth / 2 - (frA.offsetLeft + frA.offsetWidth / 2);   // A centred under the model
  tl.fromTo(frA, { x: 0, y: 0, scale: 1 }, A({ x: AX, y: 34, scale: 0.9, duration: 0.7, ease: E.SPRING }), T(b3 + 0.18));
  qa(".s42-fglow").forEach((g, i) => tl.fromTo(g, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 0.3 + i * 0.05)));
  E.fadeIn(tl, q(".s42-rlbl"), T(b3 + 0.32), 0.45, 12);
  const port = E.center(q(".s42-port"), root);
  const gx = q(".s42-col").offsetLeft + q(".s42-faces").offsetLeft - 6, gy = q(".s42-col").offsetTop + q(".s42-faces").offsetTop;
  const rl = qa(".s42-rl"), rf = qa(".s42-rf");
  [52, 88, 206, 242].forEach((dy, i) => {
    const y = gy + dy, d = `M${gx} ${y} C${gx - 40} ${y} ${port.x + 40} ${port.y} ${port.x + 6} ${port.y}`;
    rl[i].setAttribute("d", d);
    rf[i].setAttribute("d", d);
    E.draw(tl, rl[i], T(b3 + 0.36 + i * 0.06), 0.4);
    const L = Math.ceil(rf[i].getTotalLength());
    rf[i].style.strokeDasharray = "16 " + (L + 40);
    tl.fromTo(rf[i], { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(b3 + 0.72 + i * 0.05));
    // two passes; the dash pattern repeats every L + 56, so the second pass simply continues from the first
    tl.fromTo(rf[i], { strokeDashoffset: 16 }, A({ strokeDashoffset: -(L + 40), duration: 0.5, ease: "power1.in" }), T(b3 + 0.72 + i * 0.05));
    tl.fromTo(rf[i], { strokeDashoffset: -(L + 40) }, A({ strokeDashoffset: -(2 * L + 96), duration: 0.5, ease: "power1.in" }), T(b3 + 1.24 + i * 0.05));
    tl.fromTo(rf[i], { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), T(b3 + 1.62 + i * 0.05));
  });
  // the model works through the frame (a scan line), then the frame plays
  const gen = q(".s42-gen");
  tl.fromTo(gen, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), T(b3 + 0.86));
  tl.fromTo(gen, { y: -60 }, A({ y: 302, duration: 0.6, ease: "power1.inOut" }), T(b3 + 0.86));
  tl.fromTo(gen, { opacity: 1 }, A({ opacity: 0, duration: 0.1 }), T(b3 + 1.38));
  const bp = q(".s42-bigplay"), pbar = q(".s42-frA .s42-pbar");
  badge(bp, T(b3 + 1.45));
  tl.fromTo(bp, { opacity: 1 }, A({ opacity: 0, duration: 0.3 }), T(b3 + 1.95));
  tl.fromTo(pbar, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), T(b3 + 1.45));
  tl.fromTo(q(".s42-frA .s42-pbar i"), { scaleX: 0 }, A({ scaleX: 0.85, duration: pe - (b3 + 1.45), ease: "none" }), T(b3 + 1.45));
  const hd = q(".s42-frA .s42-hd"), glo = q(".s42-frA .s42-glo");
  tl.fromTo(hd, { x: 0, y: 0 }, A({ x: -2, y: -3, duration: 0.4, ease: "sine.inOut" }), T(b3 + 1.5));
  tl.fromTo(hd, { x: -2, y: -3 }, A({ x: 1, y: 0, duration: 0.4, ease: "sine.inOut" }), T(b3 + 1.9));
  tl.fromTo(glo, { opacity: 1 }, A({ opacity: 0.55, duration: 0.22 }), T(b3 + 1.55));
  tl.fromTo(glo, { opacity: 0.55 }, A({ opacity: 1, duration: 0.3 }), T(b3 + 1.8));

  // payoff: the clip unrolls into a strip of 6 frames; a scanner compares each face with the reference; the last
  // face drifts and the clip is cut before it; the output carries no text, no music, no voice
  E.fadeOut(tl, q(".s42-win"), T(pe), 0.35, 0);
  E.fadeOut(tl, q(".s42-faces"), T(pe), 0.35, 0);
  E.fadeOut(tl, q(".s42-rlbl"), T(pe), 0.3, 0);
  E.fadeOut(tl, q(".s42-refs"), T(pe), 0.3, 0);
  tl.fromTo(pbar, { opacity: 1 }, A({ opacity: 0, duration: 0.2 }), T(pe + 0.1));
  const sf = qa(".s42-sf"), f1 = q(".s42-sf2");
  const X1 = f1.offsetLeft + 116 + 52 - (frA.offsetLeft + frA.offsetWidth / 2), Y1 = f1.offsetTop - frA.offsetTop;
  tl.fromTo(frA, { x: AX, y: 34, scale: 0.9 }, A({ x: X1, y: Y1, scale: f1.offsetWidth / frA.offsetWidth, duration: 0.75, ease: E.SPRING }), T(pe + 0.3));
  tl.fromTo(q(".s42-band"), { opacity: 0, scaleX: 0.92 }, A({ opacity: 1, scaleX: 1, duration: 0.5, ease: E.SPRING }), T(pe + 0.45));
  sf.forEach((f, i) => tl.fromTo(f, { opacity: 0, x: 26 }, A({ opacity: 1, x: 0, duration: 0.45, ease: E.SPRING }), T(pe + 0.7 + i * 0.08)));
  const scan = q(".s42-scan"), t0s = pe + 1.25, RUN = 1.35, x0 = scan.offsetLeft + scan.offsetWidth / 2, span = x0 - (q(".s42-sf6").offsetLeft);
  tl.fromTo(scan, { opacity: 0 }, A({ opacity: 1, duration: 0.12 }), T(t0s));
  tl.fromTo(scan, { x: 0 }, A({ x: -span, duration: RUN, ease: "none" }), T(t0s));
  tl.fromTo(scan, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), T(t0s + RUN));
  const bds = qa(".s42-bd"), f6 = q(".s42-sf6"), ring = q(".s42-ring");
  let t6 = 0;
  bds.forEach((bd, k) => {
    const cx = bd.offsetLeft + bd.offsetWidth / 2, tk = t0s + (RUN * (x0 - cx)) / span;
    badge(bd, T(tk));
    if (k < 5) E.draw(tl, E.q(".s42-ok path", bd), T(tk + 0.05), 0.25);
    else {
      t6 = tk;
      qa(".s42-no path").forEach((p, j) => E.draw(tl, p, T(tk + 0.06 + j * 0.1), 0.2));
    }
  });
  E.glitch(tl, f6, T(t6 - 0.02), 8);
  tl.fromTo(ring, { opacity: 0, scale: 1.4 }, A({ opacity: 1, scale: 1, duration: 0.35, ease: E.SPRING }), T(t6 + 0.04));
  const tc = pe + 2.82, sci = q(".s42-sci");
  E.draw(tl, q(".s42-cut path"), T(tc), 0.4, "power2.out");
  tl.fromTo(sci, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), T(tc));
  tl.fromTo(sci, { y: 0 }, A({ y: 150, duration: 0.55, ease: "power2.inOut" }), T(tc));
  [f6, ring, bds[5]].forEach((el) => tl.fromTo(el, { opacity: 1, x: 0 }, A({ opacity: el === f6 ? 0.3 : 0.55, x: -14, duration: 0.4, ease: "power2.out" }), T(tc + 0.32)));
  E.fadeIn(tl, q(".s42-plbl"), T(tc + 0.42), 0.5, 16);
  qa(".s42-tag").forEach((tg, i) => {
    const t = T(tc + 0.95 + i * 0.12);
    tl.fromTo(tg, { opacity: 0, y: 16, scale: 0.9 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: E.SPRING }), t);
    E.draw(tl, E.q(".s42-slash", tg), t + 0.25, 0.3);
  });
  sweep(q(".s42-band"), T(tc + 1.5), 0.9, "rgba(201, 194, 255, 0.16)");
};
