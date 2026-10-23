// Scenes 1–8
import { W, H, clamp, lerp, prog, E, slam, rng, noise1, cover, rrect, radial, fill, vgrad, flare, speedLines, flyParticles, dust, burst, ring, halftone, drawFlag } from './lib.js';
import { photo, grade, studioBg, rays, ballotBox2D, bubble, shatter, icon } from './common.js';
import { makeCast, person, politician, POLS } from './chars.js';
import { K } from './times.js';

const ease = E.inOutCubic;

export function makeStudio(G) {
  const { THREE } = G;
  const scene = new THREE.Scene();
  const camera = G.cam(32);
  const box = G.ballotBox(); scene.add(box);
  const env1 = G.envelope(); env1.visible = false; scene.add(env1);
  const fl = G.flag(2.2, 1.6); fl.visible = false; scene.add(fl);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshBasicMaterial({ map: G.floorTex(), color: 0xffffff, transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const amb = new THREE.AmbientLight(0x3a4c80, 0.7); scene.add(amb);
  const key = new THREE.SpotLight(0xfff1dc, 120, 0, 0.42, 0.65, 1.6); key.position.set(0.5, 6, 2.4); key.target = box; scene.add(key);
  const rimL = new THREE.DirectionalLight(0x4aa0ff, 2.6); rimL.position.set(-4, 3, -3); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0x9fd0ff, 1.8); rimR.position.set(4, 2.5, -2); scene.add(rimR);
  const fillL = new THREE.DirectionalLight(0xffffff, 0.6); fillL.position.set(2, 2, 6); scene.add(fillL);
  const sun = new THREE.DirectionalLight(0xffd8a0, 0); sun.position.set(3, 5, 4); scene.add(sun);
  const cone = G.lightCone(0xdfeaff, 6, 1.7, 0.2); cone.position.set(0, 6.2, 0); scene.add(cone);
  const slotGlow = G.glowSprite(0x9fd0ff, 1.2, 0); slotGlow.position.set(0, 1.2, 0); scene.add(slotGlow);
  const crowd = new THREE.Group(); scene.add(crowd);
  return { scene, camera, box, env1, fl, floor, amb, key, rimL, rimR, fillL, sun, cone, slotGlow, crowd, THREE };
}
export function setCam(c, p, look, fov) { c.position.set(p[0], p[1], p[2]); c.lookAt(look[0], look[1], look[2]); if (fov && c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } }
export function whipCut(S, t, tc) { const d = Math.abs(t - tc); if (d < 0.1) { S.flash = Math.max(S.flash, (1 - d / 0.1) * 0.4); } }
export function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
export function resetStudio(st) {
  st.box.visible = true; st.box.position.set(0, 0, 0); st.box.rotation.set(0, 0, 0); st.box.scale.setScalar(1);
  st.env1.visible = false; st.fl.visible = false; st.crowd.visible = false; st.floor.visible = true; st.cone.visible = true;
  st.slotGlow.material.opacity = 0; st.sun.intensity = 0; st.fillL.intensity = 0.6; st.key.intensity = 120; st.amb.intensity = 0.7; st.rimL.intensity = 2.6; st.rimR.intensity = 1.8;
  st.floor.material.color.set(0xffffff);
}

export function scenesA(ctx) {
  const { img, G, credits } = ctx;
  const st = ctx.studio;
  const cast = makeCast(40, 21);
  const out = [];

  // ---------------------------------------------------------------- S1 THE HOOK
  out.push({ t0: 0, t1: K.s2, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < 2.36) {
      fill(bg, '#000');
      const p = E.outCubic(prog(t, 0.05, 0.9));
      const iris = E.inOutCubic(prog(t, 0.6, 1.4));
      if (iris > 0) {
        bg.save(); bg.beginPath(); bg.arc(540, 1010, iris * 1500, 0, 7); bg.clip();
        const z = lerp(1.0, 1.5, E.inOutQuad(prog(t, 0.6, 2.4)));
        photo(bg, img, 'knesset_night', { fx: 0.39, fy: 0.62, zoom: z, bloom: 0.55, grade: 'blue', gradeAmt: 0.9 });
        bg.restore();
        if (iris < 1) { bg.save(); bg.globalCompositeOperation = 'lighter'; bg.strokeStyle = `rgba(150,200,255,${0.8 * (1 - iris)})`; bg.lineWidth = 30 * (1 - iris) + 4; bg.beginPath(); bg.arc(540, 1010, iris * 1500, 0, 7); bg.stroke(); bg.restore(); }
        S.credit = credits('knesset_night');
      }
      radial(fx, 540, 1010, 40 + p * 160, [[0, 'rgba(220,240,255,1)'], [0.3, 'rgba(90,160,255,0.6)'], [1, 'rgba(40,90,255,0)']], (1 - iris * 0.8) * p, 'lighter');
      flare(fx, 540, 1010, 0.5 + p * 0.7, p * (1 - iris * 0.75));
      flyParticles(fx, 540, 1010, 260, t, 0.55, iris * 0.95, 7);
      S.vignette = 0.7;
    } else {
      studioBg(bg, { cy: 700, c0: '#12307a', c1: '#02061a' });
      resetStudio(st);
      // camera: slow push, then dive into the slot during the pause
      const a = ease(prog(t, 2.36, 4.05)), d = E.inExpo(prog(t, 4.0, 4.62));
      let pos = lerp3([2.7, 2.5, 6.2], [2.0, 2.15, 4.9], a), look = [0, 1.2, 0];
      pos = lerp3(pos, [0.0, 1.32, 0.12], d); look = lerp3(look, [0, 1.15, 0], d);
      setCam(st.camera, pos, look, lerp(36, 28, d));
      st.fillL.intensity = 0.25; st.amb.intensity = 0.45;
      const flick = t > 4.12 && t < 4.42 ? (Math.sin(t * 90) > 0.2 ? 1 : 0.25) : 1;
      st.key.intensity = 120 * flick; st.cone.material.opacity = 0.2 * flick;
      G.request(st.scene, st.camera);
      dust(fx, 90, t, 0.6 * flick * (1 - d), 3, [250, 0, 600, 1300]);
      // title
      const ex = prog(t, 4.0, 4.4);
      const a1 = prog(t, 2.40, 2.62), a2 = prog(t, 2.80, 3.0);
      titles.show('s1a', 'מה קורה', { style: 'chrome', size: 160, y: 360, scale: slam(a1, 2.4) * (1 + ex * 1.2), op: clamp(a1 * 4) * (1 - ex), blur: (1 - a1) * 10 + ex * 14, glow: 18 });
      titles.show('s1b', 'כשאתם לא מצביעים?', { style: 'blue', size: 100, y: 515, scale: slam(a2, 2.0) * (1 + ex * 1.2), op: clamp(a2 * 4) * (1 - ex), blur: (1 - a2) * 10 + ex * 14 });
      if (t < 2.47) S.flash = 1 - prog(t, 2.36, 2.47);
      S.black = d * d;
      S.vignette = 0.65;
    }
  } });

  // ---------------------------------------------------------------- S2 THE IMPACT
  const pols5 = [POLS[0], POLS[2], POLS[1], POLS[5], POLS[3]];
  function tableScene(c, t, z) {
    // room
    const g = c.createLinearGradient(0, 900, 0, 1920); g.addColorStop(0, '#0b1636'); g.addColorStop(1, '#01030c'); c.fillStyle = g; c.fillRect(-200, 700, 1480, 1400);
    c.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 9; i++) c.fillRect(-100 + i * 150, 760, 70, 600);
    radial(c, 540, 1080, 700, [[0, 'rgba(255,214,140,0.55)'], [1, 'rgba(255,214,140,0)']], 1, 'lighter');
    c.fillStyle = '#c9a227'; c.fillRect(538, 760, 4, 230); c.fillStyle = '#ffe7a6'; c.beginPath(); c.ellipse(540, 1000, 90, 26, 0, 0, 7); c.fill();
    // politicians behind the table
    pols5.forEach((p, i) => {
      const x = 150 + i * 195, sc = i === 2 ? 0.42 : 0.37, y = (i === 2 ? 1268 : 1288);
      const nod = t > K.lehachlit ? Math.sin((t - K.lehachlit) * 9 + i) * 0.04 * Math.exp(-(t - K.lehachlit) * 2) : 0;
      politician(c, p, x, y, sc, { t: t + i, talk: i === 2 ? 0.2 : 0.8, mood: i === 2 ? 'talk' : ['talk', 'angry', 'talk', 'sweat', 'talk'][i], rot: nod + Math.sin(t * 1.5 + i) * 0.03, point: i === 1 ? 1 : 0 });
    });
    // table
    c.fillStyle = '#1b0f08'; c.beginPath(); c.moveTo(20, 1410); c.lineTo(1060, 1410); c.lineTo(1180, 1720); c.lineTo(-100, 1720); c.closePath(); c.fill();
    const tg = c.createLinearGradient(0, 1410, 0, 1720); tg.addColorStop(0, '#5a3618'); tg.addColorStop(1, '#2a170a'); c.fillStyle = tg; c.fill();
    c.strokeStyle = '#e0b84a'; c.lineWidth = 6; c.beginPath(); c.moveTo(20, 1410); c.lineTo(1060, 1410); c.stroke();
    c.fillStyle = '#140a05'; c.fillRect(-100, 1720, 1280, 140); c.fillStyle = '#e0b84a'; c.fillRect(-100, 1720, 1280, 6);
    // document
    c.save(); c.translate(540, 1560); c.rotate(-0.04); c.fillStyle = '#f7f4ea'; c.fillRect(-170, -100, 340, 200);
    c.fillStyle = '#0b0b12'; c.font = "900 54px 'Heebo'"; c.textAlign = 'center'; c.direction = 'rtl'; c.fillText('החלטה', 0, -40);
    c.fillStyle = '#b9b5a8'; for (let i = 0; i < 4; i++) c.fillRect(-130, -2 + i * 24, 260 - i * 40, 9);
    const sp = prog(t, K.lehachlit - 0.1, K.lehachlit);
    if (t > K.lehachlit) { c.save(); c.rotate(-0.18); c.strokeStyle = 'rgba(214,30,40,0.9)'; c.lineWidth = 9; c.beginPath(); c.arc(70, 30, 62, 0, 7); c.stroke(); c.fillStyle = 'rgba(214,30,40,0.95)'; c.font = "900 38px 'Heebo'"; c.fillText('הוחלט', 70, 44); c.restore(); }
    c.restore();
    // stamp
    const down = t < K.lehachlit ? E.inCubic(prog(t, K.lehachlit - 0.32, K.lehachlit)) : 1 - E.outCubic(prog(t, K.lehachlit + 0.12, K.lehachlit + 0.5));
    if (t > K.lehachlit - 0.35 && t < K.lehachlit + 0.55) {
      const sy = lerp(1180, 1505, down);
      c.save(); c.translate(610, sy); c.fillStyle = '#3a2416'; rrect(c, -22, -170, 44, 140, 20); c.fill(); c.fillStyle = '#23140b'; c.beginPath(); c.arc(0, -180, 46, 0, 7); c.fill();
      c.fillStyle = '#1a1a1a'; rrect(c, -80, -40, 160, 50, 10); c.fill(); c.fillStyle = '#b3141c'; c.fillRect(-76, 6, 152, 10); c.restore();
    }
  }
  function citizenScene(c, t) {
    const g = c.createLinearGradient(0, 0, 0, 1050); g.addColorStop(0, '#2a3f6e'); g.addColorStop(1, '#0d1631'); c.fillStyle = g; c.fillRect(0, 0, W, 1100);
    radial(c, 380, 380, 700, [[0, 'rgba(180,200,255,0.35)'], [1, 'rgba(180,200,255,0)']]);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 860, W, 300);
    ballotBox2D(c, 330, 880, 0.95);
    // citizen walking away from the ballot box, not voting
    const p = cast[3];
    person(c, p, 760 + (t - K.s2) * 40, 900, 480, { t, walk: 0.7, dir: 1, mood: 'calm' });
    // "no" hint: empty slot spotlight
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(160,200,255,0.05)'; c.beginPath(); c.moveTo(300, 0); c.lineTo(220, 900); c.lineTo(520, 900); c.lineTo(380, 0); c.fill(); c.restore();
  }
  out.push({ t0: K.s2, t1: 7.95, draw(t, S) {
    const { bg, fx, titles } = S;
    const zm = E.inOutExpo(prog(t, 5.28, 5.78));
    const out2 = E.inExpo(prog(t, 7.42, 7.95));
    fill(bg, '#02040c');
    // bottom: decision table (zooms to full frame)
    bg.save();
    const poly = [[0, lerp(1050, -50, zm)], [W, lerp(870, -50, zm)], [W, H], [0, H]];
    bg.beginPath(); poly.forEach(([x, y], i) => bg[i ? 'lineTo' : 'moveTo'](x, y)); bg.closePath(); bg.clip();
    const sc = lerp(0.92, 1.6, zm) * (1 + out2 * 2.2), cy = lerp(1380, 960, zm);
    bg.translate(540, cy + out2 * 300); bg.scale(sc, sc); bg.translate(-540, -1380);
    tableScene(bg, t, zm);
    bg.restore();
    // top: the citizen who did not vote
    if (zm < 1) {
      bg.save(); bg.translate(0, -1100 * zm);
      bg.beginPath(); bg.moveTo(0, 0); bg.lineTo(W, 0); bg.lineTo(W, 870); bg.lineTo(0, 1050); bg.closePath(); bg.clip();
      citizenScene(bg, t); bg.restore();
      bg.save(); bg.translate(0, -1100 * zm); bg.globalCompositeOperation = 'lighter'; bg.strokeStyle = 'rgba(200,230,255,0.95)'; bg.lineWidth = 8; bg.shadowColor = 'rgba(120,190,255,1)'; bg.shadowBlur = 30;
      bg.beginPath(); bg.moveTo(0, 1050); bg.lineTo(W, 870); bg.stroke(); bg.restore();
    }
    // zoom blur streaks
    if (zm > 0 && zm < 1) speedLines(fx, 540, 1300, 90, t * 3, 0.8 * Math.sin(zm * Math.PI), '220,235,255', 4);
    shatter(fx, t, K.s2, { ox: 540, oy: 1000 });
    if (t < K.s2 + 0.07) S.flash = 0.9;
    S.shake = Math.max(S.shake, Math.exp(-(t - K.s2) * 5) * 1.4) + (t > K.lehachlit ? Math.exp(-(t - K.lehachlit) * 9) * 0.9 : 0);
    // typography
    const a1 = prog(t, K.acher - 0.06, K.acher + 0.16), a2 = prog(t, K.lehachlit - 0.04, K.lehachlit + 0.16);
    const o = 1 - prog(t, 7.4, 7.7);
    titles.show('s2a', 'מישהו אחר', { style: 'chrome', size: 150, y: 300, scale: slam(a1, 2.6), op: clamp(a1 * 5) * o, blur: (1 - a1) * 12, glow: 14 });
    titles.show('s2b', 'מחליט!', { style: 'red', size: 230, y: 500, scale: slam(a2, 3.0), op: clamp(a2 * 5) * o, blur: (1 - a2) * 12, glow: 22, glowColor: 'rgba(255,60,60,0.7)' });
    if (t > K.lehachlit) ring(fx, 540, 500, t, K.lehachlit, 0.5, 700, '255,120,120', 26);
    S.black = out2;
    S.vignette = 0.6;
  } });

  // ---------------------------------------------------------------- "עכשיו, תקשיבו לי טוב"
  out.push({ t0: 7.95, t1: 9.22, draw(t, S) {
    const { bg, fx, titles } = S;
    studioBg(bg, { cy: 960, c0: '#0c2463', c1: '#01030c', r: 1100 });
    const e = S.env;
    fx.save(); fx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const ph = ((t * 0.9 + i / 9) % 1);
      fx.strokeStyle = `rgba(${i % 3 === 0 ? '255,214,120' : '120,190,255'},${(1 - ph) * (0.25 + e * 0.75)})`;
      fx.lineWidth = 3 + (1 - ph) * 10 * e;
      fx.beginPath(); fx.arc(540, 900, 60 + ph * 900, 0, 7); fx.stroke();
    }
    fx.restore();
    radial(fx, 540, 900, 160 + e * 120, [[0, 'rgba(200,230,255,0.9)'], [1, 'rgba(80,140,255,0)']], 0.8, 'lighter');
    const a = prog(t, K.takshivu - 0.05, K.takshivu + 0.35);
    titles.show('lis', 'תקשיבו.', { style: 'thin', size: 130, y: 900, tracking: lerp(40, 8, E.outCubic(a)), op: clamp(a * 2) * (1 - prog(t, 9.0, 9.2)), font: "'Heebo'", weight: 300 });
    S.black = 1 - prog(t, 7.95, 8.1);
  } });

  // ---------------------------------------------------------------- S3 EVERYONE ON THE MAP
  const trio = [cast[5], cast[8], cast[11], cast[14], cast[17], cast[20], cast[23]];
  function world(c, kind, t, mx) {
    c.save(); c.translate(mx, 0);
    if (kind === 'yamin') {
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0a2d8f'); g.addColorStop(1, '#03113d'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = -10; i < 20; i++) { c.beginPath(); c.moveTo(i * 120 + t * 200 % 120, 0); c.lineTo(i * 120 + 60 + t * 200 % 120, 0); c.lineTo(i * 120 - 600 + t * 200 % 120, H); c.lineTo(i * 120 - 660 + t * 200 % 120, H); c.fill(); }
      rays(c, 1200, 700, 14, t, 0.25, '120,180,255');
    } else if (kind === 'smol') {
      const g = c.createLinearGradient(W, 0, 0, H); g.addColorStop(0, '#1d78d6'); g.addColorStop(1, '#062a5c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 18; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(-120, 700, 120 + i * 110 + (t * 160) % 110, 0, 7); c.stroke(); }
      rays(c, -120, 700, 14, -t, 0.22, '160,220,255');
    } else {
      const g = c.createRadialGradient(540, 760, 0, 540, 760, 1300); g.addColorStop(0, '#f4f7fd'); g.addColorStop(0.5, '#b9c8e6'); g.addColorStop(1, '#3a4f7e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      rays(c, 540, 760, 24, t * 0.5, 0.35, '255,255,255', 0.08);
      c.strokeStyle = 'rgba(20,50,120,0.12)'; c.lineWidth = 6; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(540, 760, 150 + i * 120, 0, 7); c.stroke(); }
    }
    c.restore();
  }
  function arrow(c, x, y, dir, s, color) { c.save(); c.translate(x, y); c.scale(dir * s, s); c.fillStyle = color; c.beginPath(); c.moveTo(-90, -26); c.lineTo(30, -26); c.lineTo(30, -70); c.lineTo(110, 0); c.lineTo(30, 70); c.lineTo(30, 26); c.lineTo(-90, 26); c.closePath(); c.fill(); c.restore(); }
  out.push({ t0: 9.22, t1: 14.0, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < K.yamin) {
      // the people line-up
      const g = bg.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#173a8a'); g.addColorStop(0.62, '#7fa6e8'); g.addColorStop(0.63, '#0c1a3d'); g.addColorStop(1, '#050b1c'); bg.fillStyle = g; bg.fillRect(0, 0, W, H);
      radial(bg, 540, 1180, 900, [[0, 'rgba(255,230,180,0.55)'], [1, 'rgba(255,230,180,0)']], 1, 'lighter');
      const pan = (t - 9.22) * 60;
      trio.forEach((p, i) => person(bg, p, 80 + i * 155 - pan, 1210, 400, { t, wave: i === 3 ? 1 : 0 }));
      const a = prog(t, K.s3, K.s3 + 0.3);
      titles.show('s3q', 'לא משנה אם אתם...', { style: 'white', size: 92, y: 420, op: clamp(a * 3) * (1 - prog(t, 10.0, 10.14)), scale: lerp(0.9, 1, E.outCubic(a)) });
    } else if (t < K.merkaz) {
      const isY = t < K.smol;
      const t0 = isY ? K.yamin : K.smol, dir = isY ? 1 : -1;
      const e = E.outExpo(prog(t, t0, t0 + 0.32));
      const mx = -dir * W * (1 - e);
      if (!isY) world(bg, 'yamin', t, dir * W * e * 0.6);
      world(bg, isY ? 'yamin' : 'smol', t, mx);
      // characters walking with the motion
      const cs = isY ? [cast[1], cast[6], cast[9]] : [cast[2], cast[7], cast[12]];
      cs.forEach((p, i) => person(bg, p, mx + 220 + i * 300 + dir * (t - t0) * 120, 1330 + (i % 2) * 40, 430, { t: t + i, walk: 1, dir }));
      arrow(fx, mx + 540 + dir * (t - t0) * 80, 420, dir, 1.1, 'rgba(255,212,0,0.95)');
      const a = prog(t, t0, t0 + 0.2);
      titles.show(isY ? 's3y' : 's3s', isY ? 'ימין' : 'שמאל', { style: isY ? 'chrome' : 'blue', size: 300, x: 540 + mx, y: 720, scale: slam(a, 2.2), op: clamp(a * 5), sx: 1 + (1 - e) * 0.6, blur: (1 - e) * 16 });
      if (e < 1) for (let i = 0; i < 40; i++) { const yy = (i * 53) % H; fx.fillStyle = `rgba(255,255,255,${0.25 * (1 - e)})`; fx.fillRect(dir > 0 ? 0 : W * 0.4, yy, W * 0.6, 3); }
    } else if (t < K.o) {
      // symmetric fold-in from both sides
      const e = E.outExpo(prog(t, K.merkaz, K.merkaz + 0.35));
      world(bg, 'merkaz', t, 0);
      bg.save(); bg.globalAlpha = 1 - e;
      bg.save(); bg.beginPath(); bg.rect(0, 0, W / 2, H); bg.clip(); bg.translate(-W / 2 * e, 0); world(bg, 'smol', t, 0); bg.restore();
      bg.save(); bg.beginPath(); bg.rect(W / 2, 0, W / 2, H); bg.clip(); bg.translate(W / 2 * e, 0); world(bg, 'yamin', t, 0); bg.restore();
      bg.restore();
      [cast[4], cast[15]].forEach((p, i) => person(bg, p, i ? 820 : 260, 1340, 440, { t, dir: i ? -1 : 1, wave: 1 }));
      arrow(fx, lerp(80, 330, e), 420, 1, 0.8, 'rgba(20,60,160,0.9)'); arrow(fx, lerp(1000, 750, e), 420, -1, 0.8, 'rgba(20,60,160,0.9)');
      const a = prog(t, K.merkaz, K.merkaz + 0.2);
      titles.show('s3m', 'מרכז', { style: 'chrome', size: 290, y: 720, scale: slam(a, 2.4), op: clamp(a * 5), ry: (1 - e) * 70 });
    } else {
      // comic collage of anonymous politician caricatures → vortex → gone
      const sw = E.inCubic(prog(t, 12.95, 13.42));
      const g = bg.createRadialGradient(540, 900, 0, 540, 900, 1300); g.addColorStop(0, '#ffd84a'); g.addColorStop(0.45, '#f5a623'); g.addColorStop(1, '#0b1c4a'); bg.fillStyle = g; bg.fillRect(0, 0, W, H);
      rays(bg, 540, 900, 22, t * 3, 0.5, '255,255,255', 0.1);
      halftone(bg, 0, 0, W, H, 'rgba(12,18,48,0.22)', 26, 8, 0.5, (x, y) => clamp(Math.hypot(x - 540, y - 900) / 1100));
      const pos = [[250, 520], [820, 470], [150, 980], [930, 940], [540, 700], [300, 1330], [790, 1300]];
      const moods = ['talk', 'dizzy', 'sweat', 'angry', 'shock', 'talk', 'dizzy'];
      const blah = ['בלה בלה', '#@!%', 'בלה בלה בלה', '?!@#', 'בלה...', '%#@!', 'בלה בלה'];
      POLS.forEach((p, i) => {
        const tp = K.o + i * 0.09, a = prog(t, tp, tp + 0.25);
        if (a <= 0) return;
        let [x, y] = pos[i];
        const ang = Math.atan2(y - 900, x - 540) + sw * 7, rr = Math.hypot(x - 540, y - 900) * (1 - sw);
        x = 540 + Math.cos(ang) * rr; y = 900 + Math.sin(ang) * rr;
        const sc = 0.5 * E.outElastic(a) * (1 - sw * 0.9);
        politician(bg, p, x, y, sc, { t: t * 1.3 + i, talk: 1, mood: moods[i], rot: Math.sin(t * 6 + i) * 0.12 + sw * 6, alpha: 1 - sw * 0.6 });
        if (sw < 0.3) bubble(bg, x + (i % 2 ? -150 : 150), y - 150, blah[i], { size: 46, pop: prog(t, tp + 0.15, tp + 0.35), rot: (i % 2 ? 0.1 : -0.1), tail: [i % 2 ? 1 : -1, 1] });
      });
      if (t > 13.3) burst(fx, 540, 900, t, 13.4, { n: 300, speed: 1400, life: 0.7, seed: 31, colors: ['255,255,255', '255,214,90', '120,190,255'] });
      const a = prog(t, K.nimas - 0.05, K.nimas + 0.18);
      titles.show('s3n', 'נמאס מכולם?!', { style: 'comic', size: 150, font: "'Suez One'", weight: 400, y: 1700 - 0, rot: -4, scale: slam(a, 2.2) * (1 - sw * 0.5), op: clamp(a * 5) * (1 - sw) });
      // the citizen in the middle rolls their eyes
      if (sw < 0.95) person(fx, cast[10], 540, 1250, 360, { t, mood: 'facepalm', alpha: clamp(prog(t, K.o + 0.4, K.o + 0.6)) * (1 - sw) });
      S.subsY = 1520; S.shake = Math.max(S.shake, sw * 0.5);
      if (t > 13.42) S.black = prog(t, 13.42, 13.98) * 0.85;
    }
  } });

  // ---------------------------------------------------------------- S4 THE COMMAND
  out.push({ t0: 14.0, t1: 17.85, draw(t, S) {
    const { bg, fx, titles } = S;
    const T = Math.min(t, K.s4end + 0.05); // freeze for the dramatic stop
    if (t < K.lehatzbia) {
      const hit = t < K.chayavim ? K.atem : t < K.latset ? K.chayavim : K.latset;
      const pulse = Math.exp(-(t - hit) * 6);
      studioBg(bg, { cy: 900, c0: t < K.chayavim ? '#123a9a' : t < K.latset ? '#1a2c6e' : '#0c3a8a', c1: '#010414', r: 1200 + pulse * 300 });
      rays(bg, 540, 900, 18, t, 0.18 + pulse * 0.35, '120,180,255');
      S.shake = pulse * 1.2;
      if (t < K.chayavim) {
        const a = prog(t, K.atem - 0.02, K.atem + 0.16), o = 1 - prog(t, K.chayavim - 0.06, K.chayavim + 0.04);
        titles.show('s4a', 'אתם', { style: 'chrome', size: 330, y: 900, scale: slam(a, 3.0) * (1 + (1 - o) * 1.5), op: clamp(a * 6) * o, blur: (1 - a) * 14 + (1 - o) * 20, glow: 26 });
        ring(fx, 540, 900, t, K.atem, 0.6, 900);
      } else if (t < K.latset) {
        const a = prog(t, K.chayavim - 0.02, K.chayavim + 0.16), o = 1 - prog(t, K.latset - 0.06, K.latset + 0.04);
        burst(fx, 540, 900, t, K.chayavim, { n: 700, speed: 2200, life: 1.2, seed: 41 });
        ring(fx, 540, 900, t, K.chayavim, 0.7, 1100, '255,220,140', 50);
        titles.show('s4b', 'חייבים', { style: 'gold', size: 270, y: 900, scale: slam(a, 2.6) * (1 + (1 - o) * 1.5), op: clamp(a * 6) * o, blur: (1 - a) * 14 + (1 - o) * 20, glow: 30, glowColor: 'rgba(255,200,90,0.8)' });
      } else {
        const a = prog(t, K.latset - 0.02, K.latset + 0.14), thru = E.inExpo(prog(t, K.latset + 0.25, K.lehatzbia + 0.02));
        speedLines(fx, 540, 900, 140, t * 2.5, 0.4 + thru * 0.6, '200,225,255', 9);
        flyParticles(fx, 540, 900, 200, t, 1.4, 0.4 + thru * 0.6, 8);
        titles.show('s4c', 'לצאת', { style: 'blue', size: 300, y: 900, scale: slam(a, 2.4) * (1 + thru * 16), op: clamp(a * 6) * (1 - prog(thru, 0.55, 1)), blur: thru * 26 });
        if (thru > 0.7) S.flash = (thru - 0.7) / 0.3 * 0.9;
      }
    } else {
      // the envelope enters the ballot box; a giant flag waves behind
      studioBg(bg, { cy: 520, c0: '#2a5ad0', c1: '#030a26', r: 1500 });
      rays(bg, 540, 380, 16, T, 0.3, '255,236,190', 0.1);
      resetStudio(st); st.fl.visible = true; st.env1.visible = true; st.cone.visible = false;
      st.sun.intensity = 2.2; st.key.intensity = 140;
      st.fl.scale.setScalar(1.55); st.fl.position.set(-1.55, 3.0, -3.6); st.fl.rotation.set(0, 0.18, 0); st.fl.userData.update(T * 1.25, 1.5);
      const fall = prog(T, K.lehatzbia, K.lehatzbia + 0.42);
      st.env1.position.set(0, lerp(3.2, 0.95, E.inQuad(fall)), 0); st.env1.rotation.set(0, Math.PI / 2 * 0 + (1 - fall) * 0.6, (1 - fall) * 0.5); st.env1.rotation.y = 0; st.env1.rotation.x = 0;
      st.env1.visible = fall < 1;
      const glow = Math.exp(-Math.max(0, T - (K.lehatzbia + 0.42)) * 5) * (T > K.lehatzbia + 0.42 ? 1 : 0);
      st.slotGlow.material.opacity = glow; st.slotGlow.scale.setScalar(1.2 + glow * 2);
      const push = ease(prog(t, K.lehatzbia, 17.85));
      setCam(st.camera, lerp3([0.0, 0.9, 6.6], [0.2, 1.0, 5.8], push), [0, 1.42, 0], 38);
      G.request(st.scene, st.camera);
      if (t < K.lehatzbia + 0.08) S.flash = 0.85 * (1 - prog(t, K.lehatzbia, K.lehatzbia + 0.08));
      burst(fx, 540, 860, t, K.lehatzbia + 0.42, { n: 260, speed: 900, life: 0.9, seed: 44, colors: ['255,255,255', '255,214,120'] });
      const a = prog(t, K.lehatzbia - 0.02, K.lehatzbia + 0.16);
      titles.show('s4d', 'להצביע!', { style: 'gold', size: 240, y: 330, scale: slam(a, 2.6), op: clamp(a * 6), blur: (1 - a) * 14, glow: 30, glowColor: 'rgba(255,200,90,0.8)' });
      S.shake = Math.exp(-(t - K.lehatzbia) * 6) * 1.1;
      if (t > K.s4end) { S.vignette = 0.75; }
      S.black = prog(t, 17.6, 17.85);
    }
  } });

  // ---------------------------------------------------------------- S5 THE DISAPPEARING VOICE
  const hall = (() => {
    const { THREE } = G; const scene = new THREE.Scene(); const camera = G.cam(40);
    const r = rng(55), seats = [];
    for (let row = 0; row < 30; row++) {
      const R = 3.4 + row * 0.5, y = 0.1 + row * 0.3, n = Math.floor((Math.PI * 1.25 * R) / 0.2);
      for (let i = 0; i < n; i++) { const a = Math.PI * 1.0 - 0.32 + (i / n) * (Math.PI * 1.0 + 0.64); seats.push([Math.cos(a) * R + (r() - 0.5) * 0.06, y + (r() - 0.5) * 0.05, Math.sin(a) * R * 0.95 + (r() - 0.5) * 0.06]); }
    }
    for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, R = 0.8 + Math.sqrt(r()) * 3.0; seats.push([Math.cos(a) * R, 0.0, Math.sin(a) * R, 1]); }
    const fig = G.sampleDrawing(360, 760, (g, w, h) => person(g, cast[0], w / 2, h - 10, h - 30, { face: 0 }), 4, 0.7, 3);
    const N = seats.length + fig.length;
    const cl = new G.Cloud(N); scene.add(cl.points);
    const base = new Float32Array(N * 3), ph = new Float32Array(N), kind = new Uint8Array(N);
    seats.forEach((s, i) => { base.set(s.slice(0, 3), i * 3); ph[i] = r() * 100; kind[i] = s[3] ? 2 : 0; });
    fig.forEach((f, j) => { const i = seats.length + j; base.set([f[0] * 1.85, (f[1] + 0.5) * 1.85, (r() - 0.5) * 0.12], i * 3); ph[i] = r(); kind[i] = 1; });
    const orb = G.glowSprite(0xffe7b0, 0.5, 0); scene.add(orb);
    const halo = G.glowSprite(0x6ec8ff, 2.5, 0); scene.add(halo);
    return { scene, camera, cl, base, ph, kind, N, orb, halo, nSeats: seats.length };
  })();
  out.push({ t0: 17.85, t1: 26.95, draw(t, S) {
    const { bg, fx, titles } = S;
    studioBg(bg, { cy: 700, c0: '#0a1a44', c1: '#000208', r: 1500 });
    const h = hall, c = h.cl;
    const dim = 1 - 0.55 * ease(prog(t, K.kshe, 20.5));
    const dis0 = 24.1;
    for (let i = 0; i < h.N; i++) {
      const k = h.kind[i], b = i * 3;
      let x = h.base[b], y = h.base[b + 1], z = h.base[b + 2];
      if (k === 0) {
        const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + (h.ph[i] % 1) * 2) + h.ph[i]);
        const warm = (h.ph[i] % 1) < 0.6;
        c.col[b] = warm ? 1.0 : 0.55; c.col[b + 1] = warm ? 0.86 : 0.78; c.col[b + 2] = warm ? 0.62 : 1.0;
        c.alp[i] = 0.95 * tw; c.siz[i] = 0.17;
      } else if (k === 2) { c.col[b] = 0.3; c.col[b + 1] = 0.5; c.col[b + 2] = 1; c.alp[i] = 0.35; c.siz[i] = 0.08; }
      else {
        const rr = h.ph[i], d = clamp((t - dis0 - (y / 1.85) * 0.7 - rr * 0.6) / 1.1);
        const e = E.inQuad(d);
        x += noise1(rr * 40 + t) * e * 1.6; y += e * (1.4 + rr * 2.4); z += noise1(rr * 70 + t * 0.7) * e * 1.2;
        c.col[b] = lerp(0.6, 1.0, dim); c.col[b + 1] = lerp(0.75, 0.92, dim); c.col[b + 2] = 1.0;
        c.alp[i] = (0.95 * dim + 0.1) * (1 - d) * (0.7 + 0.3 * Math.sin(t * 6 + rr * 50)); c.siz[i] = 0.06 + e * 0.05;
      }
      c.pos[b] = x; c.pos[b + 1] = y; c.pos[b + 2] = z;
    }
    c.commit();
    // the voice orb: rises, does NOT travel anywhere, then fades away
    const oa = prog(t, K.hakol, K.hakol + 0.8), of = 1 - prog(t, K.neelam, K.neelam + 0.45);
    h.orb.position.set(0, lerp(1.25, 2.1, E.outCubic(oa)) + Math.sin(t * 2) * 0.03, 0.05);
    h.orb.material.opacity = clamp(oa * 2) * of * (t > K.aval ? 0.7 + 0.3 * Math.sin(t * 14) : 1); h.orb.scale.setScalar(0.55 * (0.6 + 0.4 * of));
    h.halo.position.set(0, 1.0, -0.2); h.halo.material.opacity = 0.35 * dim * (1 - prog(t, dis0, 26.0));
    // camera: slow drift, then rapid crane up revealing the gap
    const up = E.inOutCubic(prog(t, 24.9, 26.6));
    const drift = prog(t, 17.85, 24.9);
    let p = lerp3([-0.5, 1.9, 5.6], [0.7, 2.1, 4.8], ease(drift)), lk = [0, 1.5, -1.0];
    p = lerp3(p, [0.3, 12.5, 5.0], up); lk = lerp3(lk, [0, 0, -2.5], up);
    setCam(h.camera, p, lk, 40);
    G.request(h.scene, h.camera);
    // "doesn't pass to anyone else": dashed path that stops with an X
    const xa = prog(t, K.lemisheu - 0.3, K.lemisheu + 0.2) * (1 - prog(t, K.aval - 0.1, K.aval + 0.3));
    if (xa > 0) {
      const v = h.orb.position.clone().project(h.camera); const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      fx.save(); fx.globalAlpha = xa; fx.strokeStyle = 'rgba(200,225,255,0.85)'; fx.lineWidth = 5; fx.setLineDash([14, 14]);
      fx.beginPath(); fx.moveTo(sx + 40, sy); fx.quadraticCurveTo(sx + 200, sy - 120, sx + 330 * xa, sy - 40); fx.stroke(); fx.setLineDash([]);
      const xx = sx + 330, yy = sy - 40; fx.strokeStyle = 'rgba(255,120,120,0.95)'; fx.lineWidth = 10; fx.beginPath(); fx.moveTo(xx - 26, yy - 26); fx.lineTo(xx + 26, yy + 26); fx.moveTo(xx + 26, yy - 26); fx.lineTo(xx - 26, yy + 26); fx.stroke();
      fx.restore();
    }
    const ta = prog(t, K.neelam, K.neelam + 0.5), tf = prog(t, 26.35, 26.9);
    titles.show('s5', 'ההשפעה שלכם נעלמת.', { style: 'thin', size: 84, y: 400, op: clamp(ta * 2), tracking: lerp(20, 4, E.outCubic(ta)),
      words: (i, n) => { const d = clamp(tf * 1.6 - (n - 1 - i) * 0.25); return { op: 1 - d, blur: d * 12, dy: -d * 40 }; } });
    S.vignette = 0.7;
    if (t < 18.0) S.black = 1 - prog(t, 17.85, 18.0);
  } });

  // ---------------------------------------------------------------- S6 THE WEIGHT OF A VOTE
  const sc6 = (() => {
    const { THREE } = G; const scene = new THREE.Scene(); const camera = G.cam(34);
    const s = G.scales(); scene.add(s);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.25, 64), G.gloss(0x0c1838, { spec: 0x6688cc, shin: 50, refl: 0.3 })); plinth.position.y = -0.125; scene.add(plinth);
    scene.add(new THREE.AmbientLight(0x405080, 0.6));
    const k = new THREE.SpotLight(0xfff0d0, 160, 0, 0.5, 0.6, 1.5); k.position.set(1.5, 7, 4); k.target = s; scene.add(k);
    const r1 = new THREE.DirectionalLight(0x5aa8ff, 2.5); r1.position.set(-4, 3, -3); scene.add(r1);
    const r2 = new THREE.DirectionalLight(0xffd27a, 1.4); r2.position.set(4, 2, -2); scene.add(r2);
    const sl = G.slips(3); scene.add(sl);
    return { scene, camera, s, sl, THREE };
  })();
  out.push({ t0: 26.95, t1: 31.85, draw(t, S) {
    const { bg, fx, titles } = S;
    studioBg(bg, { cy: 900, c0: '#163574', c1: '#02050f', r: 1400 });
    rays(bg, 540, 300, 10, t * 0.3, 0.12, '255,220,150', 0.1);
    const { THREE } = sc6;
    const tip = t < K.mishkal - 0.05 ? 0 : 1 - Math.exp(-(t - K.mishkal + 0.05) * 3.2) * Math.cos((t - K.mishkal + 0.05) * 11);
    const ang = 0.24 * tip;
    sc6.s.userData.update(ang);
    // slips land on the left pan, carried by it
    const pan = sc6.s.userData.pans[0]; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 3; i++) {
      const t0 = K.mekabel + 0.05 + i * 0.12, f = prog(t, t0, t0 + 0.45), land = E.inQuad(f);
      const px = pan.position.x, py = pan.position.y - 1.0 + 0.03 + i * 0.02;
      const pos = new THREE.Vector3(lerp(px + (i - 1) * 0.6, px + (i - 1) * 0.12, land), lerp(py + 3.2, py, land), lerp(0.4, (i - 1) * 0.08, land));
      e.set(lerp(-0.3, -Math.PI / 2, land), (1 - land) * 2 + i, (1 - land) * 0.8); q.setFromEuler(e);
      m.compose(pos, q, new THREE.Vector3(1, 1, 1).multiplyScalar(f > 0 ? 1.2 : 0.0001)); sc6.sl.setMatrixAt(i, m);
    }
    sc6.sl.instanceMatrix.needsUpdate = true;
    const orbit = lerp(-0.45, 0.3, ease(prog(t, 26.95, 31.85)));
    setCam(sc6.camera, [Math.sin(orbit) * 10.2, 2.9, Math.cos(orbit) * 10.2], [0, 1.55, 0], 34);
    G.request(sc6.scene, sc6.camera);
    // participation row: those who don't vote fade, those who do grow in relative weight
    const order = [2, 7, 0, 9, 4, 5, 8], keep = [1, 3, 6];
    for (let i = 0; i < 10; i++) {
      const x = 540 + (i - 4.5) * 92, y = 300;
      const oi = order.indexOf(i), fade = oi >= 0 ? prog(t, K.s6 + 0.2 + oi * 0.14, K.s6 + 0.45 + oi * 0.14) : 0;
      const ki = keep.indexOf(i), grow = ki >= 0 ? E.outBack(prog(t, K.hakolShelo + ki * 0.08, K.hakolShelo + 0.4 + ki * 0.08)) : 0;
      const col = ki >= 0 ? `rgba(255,${Math.round(lerp(255, 205, grow))},${Math.round(lerp(255, 90, grow))},1)` : `rgba(255,255,255,${1 - fade * 0.82})`;
      if (ki >= 0 && grow > 0) radial(fx, x, y - 10, 70 * grow, [[0, 'rgba(255,210,100,0.6)'], [1, 'rgba(255,210,100,0)']], 1, 'lighter');
      icon(fx, x, y, 1.05 + grow * 0.55, col);
      if (ki >= 0) { const d = prog(t, K.mekabel - 0.1 + ki * 0.12, K.mekabel + 0.3 + ki * 0.12); if (d > 0 && d < 1) { fx.save(); fx.globalCompositeOperation = 'lighter'; fx.fillStyle = `rgba(255,214,120,${1 - d})`; fx.beginPath(); fx.arc(lerp(x, 330, d), lerp(y + 50, 980, E.inQuad(d)), 12, 0, 7); fx.fill(); fx.restore(); } }
    }
    const la = prog(t, K.s6, K.s6 + 0.3);
    fx.save(); fx.globalAlpha = la; fx.fillStyle = 'rgba(255,255,255,0.75)'; fx.font = "300 38px 'Heebo'"; fx.textAlign = 'center'; fx.direction = 'rtl'; fx.fillText('קולות שהשתתפו בהצבעה', 540, 200); fx.restore();
    const ca = prog(t, K.mekabel, K.mekabel + 0.4);
    titles.show('s6', 'המשקל היחסי\nשל כל קול גדל.', { style: 'thingold', size: 82, y: 1225, lh: 1.15, op: clamp(ca * 2), tracking: lerp(16, 2, E.outCubic(ca)) });
    S.shake = t > K.mishkal - 0.05 ? Math.exp(-(t - K.mishkal) * 7) * 0.7 : 0;
    S.tag = 'המחשה';
  } });

  // ---------------------------------------------------------------- S7 THE MORNING AFTER
  function livingRoom(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f1d9b5'); g.addColorStop(1, '#c79c6c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    radial(c, 900, 300, 900, [[0, 'rgba(255,240,200,0.8)'], [1, 'rgba(255,240,200,0)']]);
    c.fillStyle = '#8a5a34'; c.fillRect(0, 1450, W, 470);
    // TV with a generic results screen (no data)
    c.save(); c.translate(540, 760);
    c.fillStyle = '#111'; rrect(c, -420, -260, 840, 500, 18); c.fill();
    const sg = c.createLinearGradient(0, -240, 0, 230); sg.addColorStop(0, '#0d2f86'); sg.addColorStop(1, '#04102e'); c.fillStyle = sg; c.fillRect(-400, -240, 800, 460);
    c.fillStyle = '#ffd400'; c.fillRect(-400, -240, 800, 70); c.fillStyle = '#0b0b12'; c.font = "900 46px 'Heebo'"; c.textAlign = 'center'; c.direction = 'rtl'; c.fillText('תוצאות הבחירות', 0, -192);
    for (let i = 0; i < 6; i++) { const hgt = 60 + ((i * 37) % 5) * 28 + Math.sin(t * 4 + i) * 10; c.fillStyle = i % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(140,200,255,0.75)'; c.fillRect(-320 + i * 110, 170 - hgt, 70, hgt); }
    c.filter = 'none'; c.fillStyle = 'rgba(4,16,46,0.55)'; c.fillRect(-400, -150, 800, 340);
    c.fillStyle = '#fff'; c.font = "900 120px 'Heebo'"; c.fillText('?', 0, 60);
    c.fillStyle = '#222'; c.fillRect(-60, 240, 120, 60); c.restore();
    // sofa + family from behind
    c.fillStyle = '#2b4a8a'; rrect(c, 80, 1330, 920, 260, 60); c.fill(); c.fillStyle = '#23407a'; rrect(c, 40, 1440, 1000, 220, 50); c.fill();
    [cast[13], cast[16], cast[19]].forEach((p, i) => person(c, p, 300 + i * 240, 1720, 520, { t, face: 0, shade: 0.55 }));
  }
  function comicPanel(c, x, y, w, h, rot, inner, slide) {
    c.save(); c.translate(x + w / 2 + slide, y + h / 2); c.rotate(rot);
    c.fillStyle = '#0b0b12'; c.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
    c.beginPath(); c.rect(-w / 2, -h / 2, w, h); c.clip(); c.translate(-w / 2, -h / 2); inner(c, w, h); c.restore();
  }
  out.push({ t0: 31.85, t1: K.avalRega, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < K.mistaklim) {
      if (t < 32.62) {
        // election night in Tel Aviv
        photo(bg, img, 'telaviv_skyline', { fx: 0.46, fy: 0.62, zoom: lerp(1.06, 1.14, prog(t, 31.85, 32.62)), bloom: 0.35, grade: 'blue', gradeAmt: 0.5 });
        S.credit = credits('telaviv_skyline');
        if (t < 31.95) S.flash = 0.5 * (1 - prog(t, 31.85, 31.95));
      } else if (t < K.kamim) {
        const dawn = ease(prog(t, 32.62, 33.35));
        photo(bg, img, 'jerusalem_sunrise', { fx: 0.42, fy: 0.55, zoom: lerp(1.22, 1.12, prog(t, 32.62, 33.4)), bloom: 0.3 + dawn * 0.3 }); whipCut(S, t, 32.62);
        fill(bg, '#061235', 0.8 * (1 - dawn), 'multiply'); grade(bg, 'gold', dawn);
        flare(fx, 160, lerp(900, 520, dawn), 1.2, dawn * 0.9, 'gold');
        S.credit = credits('jerusalem_sunrise');
      } else if (t < K.habchirot) {
        photo(bg, img, 'haifa_view', { fx: 0.5, fy: lerp(0.35, 0.5, prog(t, K.kamim, K.habchirot)), zoom: 1.15, bloom: 0.35, grade: 'morning' });
        S.credit = credits('haifa_view');
      } else {
        photo(bg, img, 'galilee', { fx: lerp(0.3, 0.45, prog(t, K.habchirot, K.mistaklim)), fy: 0.5, zoom: 1.1, bloom: 0.3, grade: 'morning' });
        S.credit = credits('galilee');
      }
      const ta = prog(t, K.kamim, K.kamim + 0.4);
      titles.show('s7', 'הבוקר שאחרי...', { style: 'thingold', size: 96, y: 360, op: clamp(ta * 2) * (1 - prog(t, 35.5, 35.78)), tracking: lerp(24, 6, E.outCubic(ta)) });
      if (t > 33.35 && t < 33.43) S.flash = 0.35;
      if (t > 34.6 && t < 34.68) S.flash = 0.35;
    } else if (t < K.vechulam) {
      const z = lerp(1, 1.35, ease(prog(t, K.mistaklim, K.vechulam)));
      bg.save(); bg.translate(540, 760); bg.scale(z, z); bg.translate(-540, -760); livingRoom(bg, t); bg.restore();
      S.tag = 'המחשה';
    } else {
      const g = bg.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe066'); g.addColorStop(1, '#f5a623'); bg.fillStyle = g; bg.fillRect(0, 0, W, H);
      halftone(bg, 0, 0, W, H, 'rgba(11,11,18,0.12)', 24, 7, 0.6);
      const sh = (k) => Math.sin(t * 40 + k) * 4;
      const sl = (k) => (1 - E.outCubic(prog(t, K.vechulam + k * 0.14, K.vechulam + k * 0.14 + 0.3))) * (k % 2 ? -1200 : 1200);
      comicPanel(bg, 50, 150, 980, 520, -0.02, (c, w, h) => {
        const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#9ec5ff'); gg.addColorStop(1, '#3a6fd0'); c.fillStyle = gg; c.fillRect(0, 0, w, h);
        halftone(c, 0, 0, w, h, 'rgba(255,255,255,0.18)', 20, 6);
        c.fillStyle = '#7a3e1c'; rrect(c, 120, 300, 740, 180, 40); c.fill();
        person(c, cast[22], 330 + sh(1), 520, 360, { t, mood: 'upset' }); person(c, cast[25], 640 + sh(2), 520, 360, { t, mood: 'upset' });
      }, sl(0));
      comicPanel(bg, 50, 720, 470, 560, 0.025, (c, w, h) => {
        c.fillStyle = '#ffd1a6'; c.fillRect(0, 0, w, h); halftone(c, 0, 0, w, h, 'rgba(160,60,20,0.15)', 18, 5);
        c.fillStyle = '#5a3a20'; c.fillRect(40, 400, 390, 26); c.fillStyle = '#fff'; rrect(c, 300, 350, 60, 52, 10); c.fill();
        person(c, cast[27], 200 + sh(3), 560, 380, { t, mood: 'facepalm' });
      }, sl(1));
      comicPanel(bg, 560, 720, 470, 560, -0.03, (c, w, h) => {
        c.fillStyle = '#d5e6ff'; c.fillRect(0, 0, w, h); halftone(c, 0, 0, w, h, 'rgba(20,60,160,0.15)', 18, 5);
        c.fillStyle = '#26324d'; c.fillRect(30, 380, 410, 30); c.fillStyle = '#111'; rrect(c, 250, 210, 170, 120, 10); c.fill(); c.fillStyle = '#ffd400'; c.fillRect(262, 222, 146, 30);
        person(c, cast[29], 150 + sh(4), 560, 380, { t, mood: 'upset' });
      }, sl(2));
      bubble(fx, 760, 230, 'מה?!', { size: 92, pop: prog(t, 37.92, 38.1), rot: 0.08, tail: [-1, 1] });
      bubble(fx, 300, 800, 'שוב?!', { size: 84, pop: prog(t, K.mitchilim, K.mitchilim + 0.2), rot: -0.08, tail: [1, 1] });
      bubble(fx, 790, 820, 'לא יכול להיות!', { size: 58, pop: prog(t, K.lehitlonen, K.lehitlonen + 0.2), rot: 0.05, tail: [-1, 1], spiky: true, fillC: '#fff6c2' });
      S.subsY = 1460; S.tag = null;
    }
  } });

  // ---------------------------------------------------------------- S8 WHAT IF
  const s7 = out[out.length - 1];
  const crowdBuilt = { done: false, sprites: [] };
  function buildCrowd() {
    if (crowdBuilt.done) return; crowdBuilt.done = true;
    const r = rng(91), cc = makeCast(18, 77);
    const tex = cc.map((p) => (g, w, h) => person(g, p, w / 2, h - 6, h - 16, { t: r() * 3, wave: r() < 0.15 ? 1 : 0 }));
    // camera z as it pulls back (must match the S8 camera path)
    const camZ = (t) => lerp(4.6, 13.5, E.inOutCubic(prog(t, 41.4, 46.6)));
    for (let i = 0; i < 190; i++) {
      let x, z;
      if (i < 48) { const lane = i % 3, k = Math.floor(i / 3); const a = [Math.PI * 0.82, Math.PI * 0.5, Math.PI * 0.18][lane]; const d = 1.25 + k * 0.5; x = Math.cos(a) * d; z = Math.sin(a) * d * 0.9; }
      else { do { x = (r() - 0.5) * 12; z = -3.5 + r() * 12.5; } while (Math.hypot(x, z) < 1.4); }
      let t0 = 42.4 + r() * 0.8 + Math.hypot(x, z) * 0.12;
      for (let tt = 41.4; tt < 47; tt += 0.05) { if (camZ(tt) > z + 3.2) { t0 = Math.max(t0, tt + 0.1); break; } }
      const sp = G.billboard(tex[(r() * tex.length) | 0], 200, 420, 1.65 + r() * 0.15); sp.position.set(x, 0, z); sp.userData.t0 = t0;
      st.crowd.add(sp); crowdBuilt.sprites.push(sp);
    }
  }
  out.push({ t0: K.avalRega, t1: 47.65, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < 41.25) {
      // freeze + rewind of the comic, then peel away
      const tf = 39.9, des = prog(t, K.avalRega, K.avalRega + 0.15), peel = E.inCubic(prog(t, 40.75, 41.25));
      bg.save(); bg.translate(0, peel * -1900); bg.filter = `grayscale(${des}) contrast(${1 + des * 0.2})`;
      s7.draw(tf, { ...S, fx: bg, titles: { show() {} }, tag: null });
      bg.filter = 'none'; bg.restore();
      fill(bg, '#000', peel);
      if (t < 40.75) {
        const r = rng(Math.floor(t * 30));
        for (let i = 0; i < 7; i++) { const y = r() * H, hh = 6 + r() * 40; bg.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.25})`; bg.fillRect(0, y, W, hh); }
        radial(fx, 540, 960, 420, [[0, 'rgba(0,0,0,0.7)'], [1, 'rgba(0,0,0,0)']]); fx.fillStyle = 'rgba(255,255,255,0.97)'; fx.shadowColor = 'rgba(0,0,0,0.8)'; fx.shadowBlur = 30; rrect(fx, 400, 840, 90, 240, 16); fx.fill(); rrect(fx, 590, 840, 90, 240, 16); fx.fill(); fx.shadowBlur = 0;
      }
      S.subsY = 1460;
      return;
    }
    buildCrowd();
    studioBg(bg, { cy: 700, c0: '#1b3f8f', c1: '#02050f', r: 1600 });
    resetStudio(st); st.crowd.visible = true;
    const warm = ease(prog(t, 43.5, 46.5));
    st.amb.intensity = 0.7 + warm * 0.8; st.sun.intensity = warm * 2.0; st.floor.material.color.setScalar(1 + warm * 0.8);
    for (const sp of crowdBuilt.sprites) { const a = prog(t, sp.userData.t0, sp.userData.t0 + 0.4); sp.material.opacity = a; sp.visible = a > 0; sp.material.color.setScalar(0.75 + warm * 0.25); }
    const back = E.inOutCubic(prog(t, 41.4, 46.6));
    setCam(st.camera, lerp3([0.5, 1.7, 4.6], [0.0, 6.6, 13.5], back), lerp3([0, 0.95, 0], [0, 0.4, 0.6], back), lerp(34, 40, back));
    G.request(st.scene, st.camera);
    dust(fx, 60, t, 0.4, 13);
    const a = prog(t, K.im - 0.05, K.im + 0.3);
    titles.show('s8', 'ומה אם כולם\nהיו מצביעים?', { style: 'chrome', size: 112, y: 330, lh: 1.08, scale: lerp(0.85, 1, E.outCubic(a)), op: clamp(a * 3), glow: 16 });
    if (t > 46.9) S.flash = prog(t, 46.9, 47.65) * 0.95;
    S.vignette = 0.6;
  } });

  return out;
}
