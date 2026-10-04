/* 7.3 an independent critic, iterated until the score passes 90: one visual beat per explanation phrase, then the rounds.
   Every tween is a fromTo with explicit values (immediateRender:false via E.A); times are scene-local via T(). */
window.SIMS = window.SIMS || {};
window.SIMS.sim73 = function (tl, ctx, cfg, S) {
  const E = window.ENG, A = E.A, sc = ctx.scene, c = cfg.sim73, P = cfg.phr, pe = cfg.phrEnd;
  const T = (x) => S + x;                    // scene-local -> master time
  const q = (s) => E.q(s, sc), qa = (s) => E.qa(s, sc);
  const tw = (el, from, to, t) => tl.fromTo(el, from, A(to), T(t));
  const pop = (el, t, s0) => tw(el, { opacity: 0, scale: s0 || 0.7 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2)" }, t);
  const ts = cfg.tStage, b0 = P[0], b1 = P[1], b2 = P[2], b3 = P[3], b4 = P[4];
  const wrap = q(".sim73");
  const sweep = (el, t, d, color) => {       // light sweep, right to left (no skew, so nothing shows at rest)
    const fx = document.createElement("i"), b = document.createElement("b");
    fx.className = "s73-swp";
    if (color) fx.style.setProperty("--sw", color);
    fx.appendChild(b);
    el.appendChild(fx);
    tw(b, { x: 0 }, { x: -(el.clientWidth * 1.8 + 10), duration: d, ease: "power2.inOut" }, t);
  };

  const vid = q(".s73-vid"), person = q(".s73-person"), bub = q(".s73-bub"), list = q(".s73-list"), flaw = q(".s73-flaw");
  const me = q(".s73-me"), mename = q(".s73-mename"), cr = q(".s73-cr"), crname = q(".s73-crname");

  // establishing shot: the video that was built, and its builder
  tw(vid, { scale: 0.94 }, { scale: 1, duration: 0.7, ease: E.SPRING }, ts + 0.1);

  // B0 "whoever built the video is the least suited to critique it": the builder's explanations,
  // its own checklist ticked one by one, while the caption is cut at the frame's edge
  tw(bub, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, b0 + 0.05);
  qa(".s73-bub > i").forEach((l, i) => tw(l, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out" }, b0 + 0.3 + i * 0.12));
  E.fadeIn(tl, list, T(b0 + 0.7), 0.45, 14);
  qa(".s73-li path").forEach((p, i) => E.draw(tl, p, T(b0 + 0.95 + i * 0.25), 0.25));
  E.draw(tl, q(".s73-flaw rect"), T(b0 + 1.85), 0.45);
  tw(flaw, { scale: 1 }, { scale: 1.08, duration: 0.25, ease: "power2.out" }, b0 + 2.3);
  tw(flaw, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: "power2.inOut" }, b0 + 2.55);
  tw(person, { y: 0 }, { y: 5, duration: 0.18, ease: "power2.out" }, b0 + 2.1);
  tw(person, { y: 5 }, { y: 0, duration: 0.3, ease: "back.out(2)" }, b0 + 2.28);

  // B1 "and this is true for Claude too": the builder glitches into Claude (an agent card), same ticked checklist
  E.glitch(tl, person, T(b1 + 0.02), 8);
  tw(person, { opacity: 1 }, { opacity: 0, duration: 0.2 }, b1 + 0.22);
  pop(me, b1 + 0.25, 0.75);
  E.fadeIn(tl, mename, T(b1 + 0.4), 0.45, 10);
  sweep(me, b1 + 0.65, 0.7, "rgba(255, 255, 255, 0.22)");
  tw(list, { borderColor: "rgba(201, 194, 255, 0.28)" }, { borderColor: "rgba(255, 255, 255, 0.85)", duration: 0.15 }, b1 + 0.7);
  tw(list, { borderColor: "rgba(255, 255, 255, 0.85)" }, { borderColor: "rgba(201, 194, 255, 0.28)", duration: 0.4 }, b1 + 0.85);
  tw(flaw, { scale: 1 }, { scale: 1.08, duration: 0.25, ease: "power2.out" }, b1 + 0.95);
  tw(flaw, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: "power2.inOut" }, b1 + 1.2);

  // B2 "an independent critic is a separate copy of Claude that built nothing": a copy slides out (with a depth trail),
  // a divider goes up between them, the critic's tray is empty
  E.fadeOut(tl, list, T(b2), 0.3, 10);
  tw(flaw, { opacity: 1 }, { opacity: 0, duration: 0.3 }, b2);
  const DX = me.offsetLeft - cr.offsetLeft;
  const slide = (el, t, peak) => {
    tw(el, { x: DX, rotationY: -38, scale: 0.92, transformPerspective: 900, opacity: 0 }, { x: 0, rotationY: 0, scale: 1, transformPerspective: 900, opacity: peak, duration: 0.95, ease: E.SPRING }, t);
  };
  slide(q(".s73-gh2"), b2 + 0.27, 0.18);
  slide(q(".s73-gh1"), b2 + 0.21, 0.36);
  slide(cr, b2 + 0.15, 1);
  qa(".s73-ghost").forEach((g, i) => tw(g, { opacity: i ? 0.36 : 0.18 }, { opacity: 0, duration: 0.3 }, b2 + 1.25 + i * 0.05));
  E.draw(tl, q(".s73-div path"), T(b2 + 1.05), 0.5);
  E.fadeIn(tl, crname, T(b2 + 1.2), 0.45, 10);
  E.fadeIn(tl, q(".s73-tray"), T(b2 + 1.5), 0.45, 10);
  sweep(cr, b2 + 1.7, 0.7, "rgba(255, 255, 255, 0.22)");

  // B3 "it gets the request and frames from every scene, without the explanations": into the tray they go;
  // the explanations hit the divider and are refused
  const doc = q(".s73-doc");
  tw(doc, { x: 530, y: -5, scale: 0.8, rotation: -8, opacity: 0 }, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.85, ease: E.SPRING }, b3 + 0.1);
  const vc = E.center(vid, wrap);
  qa(".s73-in").forEach((th, i) => {
    const o = E.center(th, wrap);
    tw(th, { x: vc.x - o.x, y: vc.y - o.y, scale: 2.4, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.8, ease: E.SPRING }, b3 + 0.45 + i * 0.15);
  });
  const expl = q(".s73-expl"), no = q(".s73-no"), dv = q(".s73-div path");
  pop(expl, b3 + 1.1, 0.8);
  tw(bub, { x: 0 }, { x: -88, duration: 0.3, ease: "power2.in" }, b3 + 1.35);
  E.glitch(tl, q(".s73-div"), T(b3 + 1.65), 6);
  tw(dv, { stroke: "#c9c2ff" }, { stroke: "#ff6b61", duration: 0.1 }, b3 + 1.65);
  tw(dv, { stroke: "#ff6b61" }, { stroke: "#c9c2ff", duration: 0.5 }, b3 + 1.9);
  pop(no, b3 + 1.68, 0.5);
  qa(".s73-no path").forEach((p, i) => E.draw(tl, p, T(b3 + 1.72 + i * 0.12), 0.22));
  tw(bub, { x: -88 }, { x: -36, duration: 0.4, ease: "power2.out" }, b3 + 1.65);
  tw(bub, { opacity: 1 }, { opacity: 0, duration: 0.35 }, b3 + 2.15);

  // B4 "and gives a score out of 100 with a numeric fix for every defect": the gauge lands on 68 (the first round);
  // two defects, each with its fix dialled in (the punch-in lands on the gauge)
  E.fadeOut(tl, q(".s73-builder"), T(b4), 0.3, 0);
  tw(q(".s73-div"), { opacity: 1 }, { opacity: 0, duration: 0.3 }, b4);
  [q(".s73-tray"), doc].concat(qa(".s73-in")).forEach((el) => tw(el, { opacity: 1 }, { opacity: 0, duration: 0.3 }, b4 + 0.02));
  const fill = q(".s73-fill"), L = Math.ceil(fill.getTotalLength()) + 2;
  fill.style.strokeDasharray = L + " " + L;
  fill.style.strokeDashoffset = L;
  E.draw(tl, q(".s73-track"), T(b4 + 0.1), 0.5);
  tw(fill, { strokeDashoffset: L }, { strokeDashoffset: +(L * (1 - c.scoreFrom / 100)).toFixed(1), duration: 0.8, ease: "power2.out" }, b4 + 0.35);
  qa(".s73-tk").forEach((k) => tw(k, { opacity: 0 }, { opacity: 1, duration: 0.3 }, b4 + 0.45));
  qa(".s73-tl").forEach((k) => tw(k, { opacity: 0 }, { opacity: 1, duration: 0.3 }, b4 + 0.5));
  const n1 = q(".s73-n1"), n2 = q(".s73-n2");
  pop(n1, b4 + 0.55, 0.6);
  tw(q(".s73-of"), { opacity: 0 }, { opacity: 1, duration: 0.35 }, b4 + 0.7);
  qa(".s73-row").forEach((row, i) => {
    const t = b4 + 1.0 + i * 0.3;
    tw(row, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: E.SPRING }, t);
    tw(E.q(".s73-dm", row), { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, t + 0.25);
    tw(E.q(".s73-arr", row), { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, t + 0.35);
    const kn = E.q(".s73-knob", row), to = i ? -31.2 * 1.5 : 31.2 * 4;
    tw(kn, { x: 0 }, { x: to, duration: 0.55, ease: "power3.inOut" }, t + 0.5);
    tw(kn, { scale: 1 }, { scale: 1.25, duration: 0.15, ease: "power2.out" }, t + 1.05);
    tw(kn, { scale: 1.25 }, { scale: 1, duration: 0.25, ease: "power2.in" }, t + 1.2);
  });

  // payoff: the same critic, round after round; the middle rounds are dots (no numbers in the guide);
  // the gauge passes 90 and lands on 96; then the stopping rule
  qa(".s73-row").forEach((row) => E.fadeOut(tl, row, T(pe), 0.3, 10));
  const line = q(".s73-line"), linef = q(".s73-linef"), nds = qa(".s73-nd");
  tw(line, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, pe + 0.1);
  nds.forEach((n, k) => pop(n, pe + 0.15 + k * 0.05, 0.4));
  E.fadeIn(tl, q(".s73-slbl"), T(pe + 0.3), 0.4, 6);
  const lit = (n, t) => tw(n, { boxShadow: "0 0 0 2px rgba(201, 194, 255, 0.7), 0 0 0px rgba(201, 194, 255, 0)", backgroundColor: "#2a2450" },
    { boxShadow: "0 0 0 2px rgba(255, 255, 255, 1), 0 0 14px rgba(201, 194, 255, 0.9)", backgroundColor: "#c9c2ff", duration: 0.25 }, t);
  lit(nds[0], pe + 0.45);
  E.fadeIn(tl, q(".s73-sv1"), T(pe + 0.5), 0.4, 8);
  E.fadeIn(tl, q(".s73-rublbl"), T(pe + 0.65), 0.4, 10);
  qa(".s73-tag").forEach((g, i) => pop(g, pe + 0.75 + i * 0.08, 0.7));
  // rounds 2..7
  const r0 = pe + 1.55, step = 0.33, rEnd = r0 + 5 * step + 0.2;
  for (let k = 1; k <= 6; k++) {
    const t = r0 + (k - 1) * step;
    tw(linef, { scaleX: (k - 1) / 6 }, { scaleX: k / 6, duration: 0.22, ease: "power2.out" }, t);
    if (k < 6) {
      tw(nds[k], { scale: 1 }, { scale: 1.7, duration: 0.15, ease: "power2.out" }, t + 0.12);
      tw(nds[k], { scale: 1.7 }, { scale: 1, duration: 0.2, ease: "power2.in" }, t + 0.27);
    } else {
      lit(nds[6], t + 0.12);
    }
    tw(cr, { scale: 1 }, { scale: 1.06, duration: 0.12, ease: "power2.out" }, t + 0.05);
    tw(cr, { scale: 1.06 }, { scale: 1, duration: 0.18, ease: "power2.in" }, t + 0.17);
  }
  tw(n1, { opacity: 1 }, { opacity: 0, duration: 0.25 }, r0);
  const f68 = +(L * (1 - c.scoreFrom / 100)).toFixed(1), f96 = +(L * (1 - c.scoreTo / 100)).toFixed(1);
  tw(fill, { strokeDashoffset: f68 }, { strokeDashoffset: f96, duration: rEnd - r0, ease: "power1.inOut" }, r0);
  // the gauge passes the target: its tick and label light up, a check mark
  const tPass = r0 + (rEnd - r0) * 0.72;
  tw(q(".s73-tk" + c.target), { stroke: "rgba(236, 233, 255, 0.85)" }, { stroke: "#ffffff", duration: 0.2 }, tPass);
  tw(q(".s73-tl" + c.target), { color: "#b8b4cc", scale: 1 }, { color: "#ffffff", scale: 1.2, duration: 0.3, ease: "back.out(2)" }, tPass);
  const pass = q(".s73-pass");
  pop(pass, tPass + 0.05, 0.5);
  E.draw(tl, q(".s73-pass path"), T(tPass + 0.1), 0.25);
  pop(n2, rEnd - 0.05, 0.6);
  E.fadeIn(tl, q(".s73-sv7"), T(rEnd), 0.4, 8);
  E.burst(tl, q(".s73-gauge"), 21, 151, T(rEnd), { n: 14, seed: 73, r0: 26, r1: 70, color: "#c9c2ff" });
  // the stopping rule
  const rule = q(".s73-rulecard");
  tw(rule, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55, ease: E.SPRING }, pe + 4.1);
  qa(".s73-stop path").forEach((p, i) => E.draw(tl, p, T(pe + 4.25 + i * 0.2), 0.35));
  sweep(rule, pe + 4.6, 0.9, "rgba(201, 194, 255, 0.2)");
};
