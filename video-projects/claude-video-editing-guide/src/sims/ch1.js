window.SIMS = window.SIMS || {};
/* Chapter 1: how it works. The pictures follow the text phrase by phrase. */
window.SIMS.ch1 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, SP = E.SPRING;
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const t = (x) => S + x;
  const secs = cfg.secs;
  E.band(tl, sc, t(0));
  // the header and the terminal are on screen from the first frame (CSS); no fade at the end either

  // section texts: kicker, kinetic text phrase by phrase (the phrase being read stays bright), exit
  qa(".c1-sec").forEach((sec, i) => {
    const s = secs[i];
    tl.fromTo(E.q(".c1-kick > i", sec), { opacity: 0, scale: 0.4 }, A({ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }), t(s.t0 + 0.1));
    E.kin(tl, E.q(".c1-kick", sec), S, { dy: 10 });
    E.kin(tl, E.q(".c1-txt", sec), S, { dy: 14 });
    const phs = E.qa(".ph", sec);
    phs.forEach((ph, k) => {
      const te = k + 1 < phs.length ? s.phr[k + 1] : s.end + 0.8;
      tl.fromTo(ph, { opacity: 1 }, A({ opacity: 0.5, duration: 0.45, ease: "power2.out" }), t(te));
    });
    const tOut = i + 1 < secs.length ? secs[i + 1].t0 - 0.1 : 39.8;
    tl.fromTo(sec, { opacity: 1 }, A({ opacity: 0, duration: 0.2, ease: "power2.in" }), t(tOut));
  });

  // ---- S1 Claude Code
  const P1 = secs[0].phr, term = q(".c1-term");
  tl.fromTo(term, { rotationX: 18, y: 60, transformPerspective: 1400 }, A({ rotationX: 0, y: 0, duration: 0.9, ease: SP }), t(0));
  E.sweep(tl, term, t(0.6), 0.9, { color: "rgba(201, 194, 255, 0.16)" });
  const l1 = q(".c1-l1"), ty1 = q(".c1-ty1");
  tl.fromTo(l1, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t(0.9));
  tl.fromTo(ty1, { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.5, ease: "steps(6)" }), t(1.0));
  const files = qa(".c1-file");
  files.forEach((f, i) => {
    const r = files.length - 1 - i;     // right to left
    tl.fromTo(f, { opacity: 0, y: 26 }, A({ opacity: 1, y: 0, duration: 0.5, ease: SP }), t(1.5 + r * 0.12));
    // Claude works on each file
    tl.fromTo(f, { borderColor: "rgba(201, 194, 255, 0.3)" }, A({ borderColor: "rgba(201, 194, 255, 1)", duration: 0.2 }), t(2.2 + r * 0.3));
    tl.fromTo(f, { boxShadow: "0 0 0px rgba(201, 194, 255, 0)" }, A({ boxShadow: "0 0 22px rgba(201, 194, 255, 0.7)", duration: 0.2 }), t(2.2 + r * 0.3));
  });
  // a blinking cursor while the terminal waits
  const cur = q(".c1-cur1");
  for (let k = 0; k < 16; k++) tl.set(cur, { opacity: k % 2 ? 0 : 1 }, t(1.55 + k * 0.5));
  tl.set(cur, { opacity: 0 }, t(9.6));
  // ...and runs programs
  const run = q(".c1-run");
  tl.fromTo(run, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), t(P1[1]));
  tl.fromTo(E.q("i", run), { x: -160 }, A({ x: 572, duration: 0.85, ease: "power1.inOut" }), t(P1[1] + 0.1));
  tl.fromTo(E.q("i", run), { x: -160 }, A({ x: 572, duration: 0.85, ease: "power1.inOut" }), t(P1[1] + 1.0));
  E.dim(tl, q(".c1-files"), t(4.6), 0, 1, 0.3);
  // the model and how to pick it
  const badge = q(".c1-badge");
  tl.fromTo(badge, { opacity: 0, scale: 0.8, y: 16 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.55, ease: SP }), t(5.0));
  E.sweep(tl, badge, t(5.35), 0.7, { color: "rgba(255, 255, 255, 0.35)" });
  E.fadeIn(tl, q(".c1-note"), t(5.4), 0.55, 24);
  const l2 = q(".c1-l2");
  tl.fromTo(l2, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t(6.4));
  tl.fromTo(q(".c1-ty2"), { clipPath: "inset(0px 100% 0px 0px)" }, A({ clipPath: "inset(0px 0% 0px 0px)", duration: 0.45, ease: "steps(6)" }), t(6.5));
  const menu = q(".c1-menu");
  tl.fromTo(menu, { opacity: 0, x: -14 }, A({ opacity: 1, x: 0, duration: 0.4, ease: SP }), t(7.3));
  E.draw(tl, q(".c1-menu .c1-ck path"), t(7.5), 0.3);
  E.dim(tl, q(".c1-note"), t(10.0), 0, 1, 0.3);
  E.dim(tl, badge, t(10.0), 0, 1, 0.3);
  E.dim(tl, l1, t(10.1), 0, 1, 0.25);
  E.dim(tl, l2, t(10.1), 0, 1, 0.25);
  E.dim(tl, run, t(10.1), 0, 1, 0.25);

  // ---- S2 the HyperFrames skills
  const P2 = secs[1].phr;
  tl.fromTo(term, { scale: 1, y: 0 }, A({ scale: 0.76, y: 120, duration: 0.8, ease: SP }), t(10.3));
  const glow = q(".c1-glow");
  qa(".c1-skill").forEach((k, i) => {
    const a = 10.9 + i * 0.25;
    tl.fromTo(k, { opacity: 0, y: 24 }, A({ opacity: 1, y: 0, duration: 0.45, ease: SP }), t(a));
    // into the terminal (its centre is at 400, 400 of the picture)
    const fy = 400 - (6 + i * 76 + 30), fx = 400 - (566 + 105);
    tl.fromTo(k, { x: 0, y: 0, scale: 1 }, A({ x: fx, y: fy, scale: 0.3, duration: 0.5, ease: "power2.in" }), t(a + 0.75));
    tl.fromTo(k, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), t(a + 1.1));
  });
  tl.fromTo(glow, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t(11.95));
  tl.fromTo(glow, { opacity: 1 }, A({ opacity: 0, duration: 0.5 }), t(12.15));
  // ...they teach it to build a video
  qa(".c1-tl i").forEach((b, i) => {
    tl.fromTo(b, { opacity: 0, scaleX: 0 }, A({ opacity: 1, scaleX: 1, duration: 0.45, ease: SP }), t(P2[1] + 0.15 + i * 0.2));
  });
  // ...and export it as a video file
  const mp4 = q(".c1-mp4");
  tl.fromTo(mp4, { opacity: 0 }, A({ opacity: 1, duration: 0.25 }), t(P2[2] + 0.1));
  tl.fromTo(mp4, { x: 290, y: -270, scale: 0.5 }, A({ x: 0, y: 0, scale: 1, duration: 0.7, ease: SP }), t(P2[2] + 0.1));
  tl.fromTo(q(".c1-prog b"), { scaleX: 0 }, A({ scaleX: 1, duration: 0.8, ease: "power1.inOut" }), t(P2[2] + 0.55));
  E.burst(tl, mp4, 100, 40, t(P2[2] + 1.35), { n: 10, seed: 31, r0: 40, r1: 110, color: "#ff8a80" });
  const free = q(".c1-free .pill");
  E.pill(tl, free, t(secs[1].end + 0.15), t(20.5));
  E.dim(tl, q(".c1-tl"), t(20.6), 0, 1, 0.3);

  // ---- S3 one folder per video
  const P3 = secs[2].phr, fw = q(".c1-foldwrap"), lid = q(".c1-lidw");
  tl.fromTo(fw, { opacity: 0, y: 30 }, A({ opacity: 1, y: 0, duration: 0.55, ease: SP }), t(20.9));
  tl.fromTo(lid, { rotationX: 0 }, A({ rotationX: 64, duration: 0.45, ease: "power2.out" }), t(21.2));
  qa(".c1-clip").forEach((c, i) => {
    tl.fromTo(c, { opacity: 0, y: -170 }, A({ opacity: 1, y: 0, duration: 0.55, ease: SP }), t(21.45 + i * 0.22));
  });
  tl.fromTo(q(".c1-logo"), { opacity: 0, y: -190, rotation: -40 }, A({ opacity: 1, y: 0, rotation: 0, duration: 0.6, ease: SP }), t(22.1));
  tl.fromTo(lid, { rotationX: 64 }, A({ rotationX: 0, duration: 0.35, ease: "power2.in" }), t(22.55));
  // open Claude Code in it: folder -> Claude Code
  const arc1 = q(".c1-arc1"), arc2 = q(".c1-arc2"), d1 = q(".c1-dot1"), d2 = q(".c1-dot2");
  E.draw(tl, arc1, t(P3[1] + 0.1), 0.6);
  const travel = (dot, a, x0, x1, ymid, y0, y1) => {
    tl.fromTo(dot, { opacity: 0 }, A({ opacity: 1, duration: 0.1 }), t(a));
    tl.fromTo(dot, { x: x0 }, A({ x: x1, duration: 0.9, ease: "none" }), t(a));
    tl.fromTo(dot, { y: y0 }, A({ y: ymid, duration: 0.45, ease: "sine.out" }), t(a));
    tl.fromTo(dot, { y: ymid }, A({ y: y1, duration: 0.45, ease: "sine.in" }), t(a + 0.45));
    tl.fromTo(dot, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), t(a + 0.85));
  };
  travel(d1, P3[1] + 0.6, 600, 462, 120, 95, 241);
  travel(d1, P3[1] + 1.55, 600, 462, 120, 95, 241);
  tl.fromTo(glow, { opacity: 0 }, A({ opacity: 1, duration: 0.15 }), t(P3[1] + 1.45));
  tl.fromTo(glow, { opacity: 1 }, A({ opacity: 0, duration: 0.5 }), t(P3[1] + 1.65));
  // talk to it in Hebrew; the whole picture: folder -> Claude Code -> MP4
  const say = q(".c1-say");
  tl.fromTo(say, { opacity: 0, scale: 0.8, y: 16 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.5, ease: SP }), t(P3[2] + 0.15));
  E.draw(tl, arc2, t(P3[2] + 0.6), 0.6);
  travel(d2, P3[2] + 1.1, 149, 162, 520, 470, 594);
  travel(d2, P3[2] + 2.05, 149, 162, 520, 470, 594);
  // typed, not spoken: the caret blinks in the Hebrew bubble
  const caret = q(".c1-caret");
  for (let k = 0, a = P3[2] + 0.7; a < 29.9; k++, a += 0.45) tl.set(caret, { opacity: k % 2 ? 1 : 0 }, t(a));
  // the full picture: Claude Code runs Opus 5.5 with the HyperFrames skills
  qa(".c1-tools > span").forEach((el, i) => {
    tl.fromTo(el, { opacity: 0, y: 26, scale: 0.85 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: SP }), t(26.5 + i * 0.25));
    E.sweep(tl, el, t(26.95 + i * 0.25), 0.7, { color: "rgba(255, 255, 255, 0.3)" });
  });
  E.draw(tl, q(".c1-opus .c1-ck path"), t(26.85), 0.35);
  E.sweep(tl, term, t(P3[2] + 2.6), 0.9, { color: "rgba(201, 194, 255, 0.14)" });
  tl.fromTo(mp4, { boxShadow: "0 0 22px rgba(255, 69, 58, 0.4)" }, A({ boxShadow: "0 0 44px rgba(255, 69, 58, 0.9)", duration: 0.25 }), t(P3[2] + 2.0));
  [term, mp4, fw, say, q(".c1-arcs")].forEach((el) => E.dim(tl, el, t(30.0), 0, 1, 0.3));

  // ---- S4 how to use the prompts
  const P4 = secs[3].phr, card = q(".c1-pcard");
  // the card comes in while the diagram is still going out (no empty frame between the beats)
  tl.fromTo(card, { opacity: 0 }, A({ opacity: 1, duration: 0.3 }), t(30.15));
  tl.fromTo(card, { rotationX: 16, y: 70, scale: 0.94, transformPerspective: 1500 }, A({ rotationX: 0, y: 0, scale: 1, duration: 0.8, ease: SP }), t(30.15));
  E.sweep(tl, card, t(30.9), 0.9, { color: "rgba(201, 194, 255, 0.16)" });
  const tabs = qa(".c1-tab"), tul = q(".c1-tul");
  const pos = (k) => ({ left: tabs[k].offsetLeft, width: tabs[k].offsetWidth });
  tul.style.left = pos(0).left + "px";
  tul.style.width = pos(0).width + "px";
  tabs.forEach((tb, k) => {
    const a = 30.95 + k * 0.36;
    tl.fromTo(tb, { color: "#6f6b86" }, A({ color: "#ffffff", duration: 0.2 }), t(a));
    if (k === 0) tl.fromTo(tul, { opacity: 0 }, A({ opacity: 1, duration: 0.2 }), t(a));
    else tl.fromTo(tul, { left: pos(k - 1).left, width: pos(k - 1).width }, A({ left: pos(k).left, width: pos(k).width, duration: 0.3, ease: "power3.inOut" }), t(a - 0.1));
  });
  E.fadeIn(tl, q(".c1-most"), t(31.4), 0.5, 10);
  // copy it into Claude Code
  // "ככה בנויים..." stays readable until 33.2, then the card flies into Claude Code
  const tFly = 33.3;
  E.dim(tl, q(".c1-most"), t(tFly - 0.1), 0, 1, 0.2);
  tl.fromTo(q(".c1-copy"), { scale: 1 }, A({ scale: 1.35, duration: 0.15, ease: "power2.out" }), t(tFly - 0.4));
  tl.fromTo(q(".c1-copy"), { scale: 1.35 }, A({ scale: 1, duration: 0.25, ease: "power2.in" }), t(tFly - 0.25));
  const mini = q(".c1-mini");
  tl.fromTo(mini, { opacity: 0, y: 30 }, A({ opacity: 1, y: 0, duration: 0.5, ease: SP }), t(tFly - 0.35));
  tl.fromTo(card, { scale: 1, y: 0 }, A({ scale: 0.22, y: 435, duration: 0.55, ease: "power2.in" }), t(tFly));
  tl.fromTo(card, { opacity: 1 }, A({ opacity: 0, duration: 0.12 }), t(tFly + 0.45));
  E.burst(tl, mini, 180, 110, t(tFly + 0.5), { n: 10, seed: 17, r0: 30, r1: 90, color: "#c9c2ff" });
  // it asks a few questions before touching anything
  qa(".c1-q").forEach((b, i) => {
    tl.fromTo(b, { opacity: 0, y: 40, scale: 0.85 }, A({ opacity: 1, y: 0, scale: 1, duration: 0.5, ease: SP }), t(P4[2] + 0.2 + i * 0.4));
    E.dim(tl, b, t(P4[3] - 0.15), 0, 1, 0.25);
  });
  // the commands inside are for Claude
  const cmd = q(".c1-cmd");
  tl.fromTo(cmd, { opacity: 0, y: 24 }, A({ opacity: 1, y: 0, duration: 0.5, ease: SP }), t(P4[3] + 0.15));
  const fc = q(".c1-fc");
  tl.fromTo(fc, { scale: 0.7 }, A({ scale: 1, duration: 0.45, ease: "back.out(2)" }), t(P4[3] + 0.75));
  E.dim(tl, q(".c1-vis"), t(39.85), 0, 1, 0.3);
  // every prompt was checked by a separate copy of Claude (the box comes in under the outgoing beat)
  const box = q(".c1-cbox");
  tl.fromTo(box, { opacity: 0, scale: 0.94, y: 30 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.6, ease: SP }), t(39.8));
  qa(".c1-shield path").forEach((p, i) => E.draw(tl, p, t(39.95 + i * 0.35), 0.5));
  E.kin(tl, q(".c1-ct"), S, { dy: 14 });
  // the picture: the prompt goes to a separate copy of Claude, and a check comes back
  const cm = q(".c1-cmini"), ct = q(".c1-cterm"), ok = q(".c1-cok");
  tl.fromTo(cm, { opacity: 0, y: 30 }, A({ opacity: 1, y: 0, duration: 0.5, ease: SP }), t(40.1));
  tl.fromTo(ct, { opacity: 0, y: 30 }, A({ opacity: 1, y: 0, duration: 0.5, ease: SP }), t(40.25));
  E.draw(tl, q(".c1-carrow path"), t(40.75), 0.5);
  tl.fromTo(cm, { x: 0, scale: 1 }, A({ x: -475, scale: 0.4, duration: 0.55, ease: "power2.in" }), t(41.3));
  tl.fromTo(cm, { opacity: 1 }, A({ opacity: 0, duration: 0.15 }), t(41.7));
  tl.fromTo(ok, { opacity: 0, scale: 0.5 }, A({ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }), t(41.95));
  E.draw(tl, q(".c1-cok path"), t(42.1), 0.35);
  E.burst(tl, ct, 170, 180, t(42.05), { n: 14, seed: 23, r0: 60, r1: 160, color: "#c9c2ff" });
  E.sweep(tl, box, t(42.35), 0.9, { color: "rgba(201, 194, 255, 0.14)" });
  // camera: a spring punch-in (1.12, back.out) on each key moment, reset at the next beat; the illustration
  // sits in a clip box at the safe area and each focus is clamped so the texts in view stay whole
  const ZS = 1.12;
  const punch = (el, a, b, fx, fy, L, R) => {
    const lo = (ZS * R - 800) / (ZS - 1), hi = (ZS * L) / (ZS - 1);
    const cx = lo <= hi ? Math.min(hi, Math.max(lo, fx)) : (L + R) / 2;
    tl.set(el, { transformOrigin: cx.toFixed(1) + "px " + fy + "px" }, t(a));
    tl.fromTo(el, { scale: 1 }, A({ scale: ZS, duration: 0.5, ease: "back.out(1.6)" }), t(a));
    if (b != null) tl.fromTo(el, { scale: ZS }, A({ scale: 1, duration: 0.45, ease: "power2.inOut" }), t(b));
  };
  const zc = q(".c1-cam");
  punch(zc, 5.3, 6.3, 400, 80, 50, 750);        // the model: Claude Opus 5.5
  punch(zc, 16.9, 20.3, 510, 760, 60, 651);     // "כלי חינמי"
  punch(zc, 25.0, 26.35, 600, 700, 60, 740);    // talking to it like an editor next to you
  punch(q(".c1-cpz"), 41.35, null, 190, 300, 20, 530);   // "עותק נפרד"
  // and a slow 1.00 -> 1.02 drift within each beat
  const vis = q(".c1-vis");
  [[0.3, 5.0], [5.1, 10.2], [10.4, 16.8], [17.0, 20.4], [20.8, 24.9], [25.1, 29.95], [30.3, 33.1], [33.4, 39.6]].forEach(([a, b]) => {
    tl.fromTo(vis, { scale: 1 }, A({ scale: 1.02, duration: b - a - 0.35, ease: "none" }), t(a));
    tl.fromTo(vis, { scale: 1.02 }, A({ scale: 1, duration: 0.35, ease: "power2.inOut" }), t(b - 0.35));
  });
  E.debug.scenes[cfg.id] = { S, D: cfg.D, type: "custom" };
};
