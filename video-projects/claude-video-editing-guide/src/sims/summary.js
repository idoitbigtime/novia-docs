window.SIMS = window.SIMS || {};
/* Chapter 8: every topic gets its check (springy zoom on the last one), where to continue, end card.
   The recap is on screen from the first frame; each section comes in under the outgoing one (no empty
   frame) and is pushed in slowly; the closing line holds ~3 s before the video ends. */
window.SIMS.summary = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, T = cfg.T, SP = E.SPRING;
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const t = (x) => S + x;
  E.band(tl, sc, t(0));
  // the header, the kicker and the blocks are there from frame 0 (CSS); they settle with a small rise
  const recap = q(".sm-recap");
  tl.fromTo(q(".sm-recap .sm-kick"), { y: 10 }, A({ y: 0, duration: 0.5, ease: SP }), t(0));
  qa(".sm-blk").forEach((b, i) => tl.fromTo(b, { y: 16 }, A({ y: 0, duration: 0.6, ease: SP }), t(0.04 * i)));
  // the line-art mark before each heading draws itself
  qa(".sm-mo > *").forEach((p, i) => E.draw(tl, p, t(0.15 + i * 0.05), 0.6));
  const chips = qa(".sm-chip");
  chips.forEach((c, i) => {
    const a = T.chk0 + i * T.step;
    E.draw(tl, E.q(".sm-ck path", c), t(a), 0.22);
    // purple checks; only the last one is red (at most two red things on screen)
    const on = i === chips.length - 1 ? "rgba(255, 69, 58, 0.95)" : "rgba(111, 99, 201, 0.95)";
    tl.fromTo(E.q(".sm-ck", c), { backgroundColor: "rgba(201, 194, 255, 0.1)" }, A({ backgroundColor: on, duration: 0.2 }), t(a));
    tl.fromTo(c, { borderColor: "rgba(201, 194, 255, 0.22)" }, A({ borderColor: "rgba(201, 194, 255, 0.75)", duration: 0.2 }), t(a));
  });
  // springy zoom on the last check: only that chip springs up (the list stays in the safe area)
  const last = chips[chips.length - 1], tl0 = T.chk0 + (chips.length - 1) * T.step;
  tl.set(last, { transformOrigin: "90% 50%", zIndex: 2 }, t(tl0));
  tl.fromTo(last, { scale: 1 }, A({ scale: 1.15, duration: 0.6, ease: "back.out(1.7)" }), t(tl0 + 0.1));
  E.burst(tl, last, last.offsetWidth - 30, last.offsetHeight / 2, t(tl0 + 0.15), { n: 12, seed: 4, r0: 30, r1: 90, color: "#ffffff" });
  // a slow push through the section (1.00 -> 1.02 keeps the 780 px column inside x 140..940)
  tl.fromTo(recap, { scale: 1 }, A({ scale: 1.02, duration: T.next, ease: "none" }), t(0));
  E.fadeOut(tl, recap, t(T.next - 0.2), 0.25, -20);

  // where to continue: comes in under the outgoing recap
  const next = q(".sm-next");
  E.fadeIn(tl, q(".sm-next .sm-kick"), t(T.next - 0.1), 0.45, 10);
  E.kin(tl, q(".sm-nl"), S, { dy: 12 });
  tl.fromTo(next, { scale: 1 }, A({ scale: 1.02, duration: T.end - T.next, ease: "none" }), t(T.next));
  qa(".sm-card").forEach((cd, i) => {
    const a = T.next + 1.3 + i * 0.55;
    tl.fromTo(cd, { opacity: 0, x: -40, rotationY: -12, transformPerspective: 1400 }, A({ opacity: 1, x: 0, rotationY: 0, duration: 0.7, ease: SP }), t(a));
    const ico = E.q(".sm-ico", cd);
    E.qa(".sm-ico > *", cd).forEach((p) => E.draw(tl, p, t(a + 0.15), 0.6));
    E.sweep(tl, cd, t(a + 0.45), 0.8, { color: "rgba(201, 194, 255, 0.14)" });
    // then each card lights up in turn while it is read: a spring pop, and its icon gives a little jump
    const r = T.next + 4.6 + i * 2.2;
    tl.fromTo(cd, { borderColor: "rgba(201, 194, 255, 0.25)" }, A({ borderColor: "rgba(201, 194, 255, 0.85)", duration: 0.3 }), t(r));
    tl.fromTo(cd, { scale: 1 }, A({ scale: 1.06, duration: 0.5, ease: "back.out(1.7)" }), t(r));
    tl.fromTo(ico, { scale: 1, rotation: 0 }, A({ scale: 1.28, rotation: -10, duration: 0.25, ease: "power2.out" }), t(r + 0.05));
    tl.fromTo(ico, { scale: 1.28, rotation: -10 }, A({ scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.2)" }), t(r + 0.3));
    tl.fromTo(cd, { scale: 1.06 }, A({ scale: 1, duration: 0.4, ease: "power2.inOut" }), t(r + 1.9));
    tl.fromTo(cd, { borderColor: "rgba(201, 194, 255, 0.85)" }, A({ borderColor: "rgba(201, 194, 255, 0.25)", duration: 0.4 }), t(r + 1.9));
  });
  E.fadeIn(tl, q(".sm-docs"), t(T.next + 4.2), 0.5, 10);
  E.fadeOut(tl, next, t(T.end - 0.2), 0.28, -20);
  E.fadeOut(tl, q(".hdr"), t(T.end - 0.2), 0.28, 0);
  // end card: its rings start under the outgoing cards
  E.band(tl, sc, t(T.end - 0.25));
  E.kin(tl, q(".sm-tt"), S, { dy: 26 });
  E.kin(tl, q(".sm-el"), S, { dy: 12 });
  qa(".sm-ring").forEach((r, i) => tl.fromTo(r, { scale: 0.5, opacity: 0.9 }, A({ scale: 1.8 + i * 0.3, opacity: 0, duration: 1.3 + i * 0.2, ease: "power2.out" }), t(T.end - 0.15 + i * 0.12)));
  E.burst(tl, q(".sm-end"), 400, 220, t(T.end + 0.05), { n: 22, seed: 12, r0: 170, r1: 380, color: "#c9c2ff" });
  // the hook's promise comes back as the bookend
  const badge = q(".sm-badge");
  tl.fromTo(badge, { opacity: 0, scale: 0.8, y: 20 }, A({ opacity: 1, scale: 1, y: 0, duration: 0.6, ease: SP }), t(T.end + 0.8));
  E.sweep(tl, badge, t(T.end + 1.15), 0.7, { color: "rgba(255, 255, 255, 0.35)" });
  const end = q(".sm-end");
  tl.fromTo(end, { scale: 1 }, A({ scale: 1.03, duration: cfg.D - T.end, ease: "none" }), t(T.end));
  // the video ends: the end card fades out over its last 0.4 s
  E.fadeOut(tl, end, t(cfg.D - 0.45), 0.4, 0);
  E.debug.scenes[cfg.id] = { S, D: cfg.D, type: "custom" };
};
