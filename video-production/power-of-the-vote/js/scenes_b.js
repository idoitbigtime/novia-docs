// Scenes 9–15
import { W, H, clamp, lerp, prog, E, slam, rng, noise1, fbm1, cover, rrect, radial, fill, vgrad, flare, speedLines, flyParticles, dust, burst, ring, halftone, drawFlag } from './lib.js';
import { photo, grade, studioBg, rays, ballotBox2D, bubble, phone, thumb, icon, knessetSilhouette } from './common.js';
import { makeCast, person, portrait, PORTRAITS } from './chars.js';
import { setCam, lerp3, resetStudio } from './scenes_a.js';
import { K } from './times.js';

const ease = E.inOutCubic;

// Brush-edged wipe: draws `drawB` over the frame inside a diagonal, wavy reveal (p: 0..1)
function wipe(ctx, p, drawB, { dir = 1, seed = 1, glow = true } = {}) {
  if (p <= 0) return; if (p >= 1) { drawB(); return; }
  const span = W + H * 0.5, edge = -H * 0.25 + p * (span + H * 0.25);
  const path = new Path2D(); const r = rng(seed);
  path.moveTo(dir > 0 ? -50 : W + 50, -50);
  for (let y = -50; y <= H + 50; y += 40) { const off = (y / H) * H * 0.35 + noise1(y * 0.01 + seed * 3) * 50; const x = dir > 0 ? edge - off : W - edge + off; path.lineTo(x, y); }
  path.lineTo(dir > 0 ? -50 : W + 50, H + 50); path.closePath();
  ctx.save(); ctx.clip(path); drawB(); ctx.restore();
  if (glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,230,170,0.85)'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(255,200,120,1)'; ctx.shadowBlur = 40; ctx.stroke(path); ctx.restore(); }
}
function bokeh(ctx, t, n, seed, color = '255,220,160', alpha = 0.5) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W + Math.sin(t * 0.3 + i) * 30, y = r() * H + Math.cos(t * 0.25 + i) * 30, s = 20 + r() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(${color},${alpha * (0.3 + r() * 0.5)})`); g.addColorStop(0.7, `rgba(${color},${alpha * 0.15})`); g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function whip(S, t, tc, dir = 1) { // whip-pan flash/streak around a cut at tc
  const d = Math.abs(t - tc); if (d > 0.12) return;
  const k = 1 - d / 0.12;
  S.flash = Math.max(S.flash, k * 0.45);
  const fx = S.fx; fx.save(); fx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const y = (i * 67 + tc * 1000) % H; fx.fillStyle = `rgba(220,235,255,${0.25 * k})`; fx.fillRect(0, y, W, 4 + (i % 4) * 6); }
  fx.restore();
}

export function scenesB(ctx) {
  const { img, G, credits } = ctx;
  const st = ctx.studio; const { THREE } = G;
  const cast = makeCast(60, 333);
  const out = [];

  // ---------------------------------------------------------------- S9 ALTERNATE REALITY
  const chain = G.sampleDrawing(1000, 520, (g, w, h) => { const cc = makeCast(7, 9); cc.forEach((p, i) => person(g, p, 80 + i * 140, h - 8, 440, { face: 0, mood: 'cheer' })); }, 7, 0.6, 12);
  const shots9 = [
    [47.65, 'galilee_gamla', { fx: 0.5, fy: 0.55 }], [49.12, 'galilee_gamla_illus', { fx: 0.5, fy: 0.55 }], [49.9, 'jerusalem_sunrise', { fx: 0.42, fy: 0.5 }],
    [51.1, 'jerusalem_sunrise_illus', { fx: 0.42, fy: 0.5 }], [51.42, 'haifa_view', { fx: 0.5, fy: 0.45 }], [51.75, 'haifa_view_illus', { fx: 0.5, fy: 0.45 }],
    [52.08, 'ramon_aerial', { fx: 0.3, fy: 0.5, pan: 1 }], [52.4, 'ramon_aerial_illus', { fx: 0.3, fy: 0.5, pan: 1 }], [52.7, 'knesset_aerial', { fx: 0.55, fy: 0.45 }],
  ];
  out.push({ t0: 47.65, t1: 54.15, draw(t, S) {
    const { bg, fx, titles } = S;
    const drawShot = (i) => {
      const [t0, key, o] = shots9[i]; const lt = t - t0;
      const fxp = o.pan ? o.fx + lt * 0.12 : o.fx;
      photo(bg, img, key, { fx: fxp, fy: o.fy, zoom: 1.12 + lt * 0.04, bloom: key.endsWith('_illus') ? 0 : 0.3 });
      grade(bg, 'morning', 0.6);
      return key;
    };
    let cur = 0; for (let i = 0; i < shots9.length; i++) if (t >= shots9[i][0]) cur = i;
    if (cur > 0) drawShot(cur - 1);
    const p = E.inOutCubic(prog(t, shots9[cur][0], shots9[cur][0] + 0.32));
    if (cur === 0) drawShot(0); else wipe(bg, p, () => drawShot(cur), { dir: cur % 2 ? 1 : -1, seed: cur });
    const key = shots9[cur][1].replace('_illus', '');
    S.credit = credits(key);
    // light points converge into a human chain
    const mz = prog(t, 52.7, 53.95);
    if (t > 52.5) {
      fill(fx, '#020a24', 0.55 * clamp(prog(t, 52.6, 53.2)));
      const r = rng(5);
      fx.save(); fx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < chain.length; i++) {
        const c = chain[i], sx = r() * W, sy = r() * H, d = r() * 0.35;
        const e = E.inOutCubic(clamp((mz - d) / (1 - d + 1e-6)));
        const tx = 540 + c[0] * 520 * 1.0, ty = 1000 - c[1] * 520;
        const x = lerp(sx, tx, e), y = lerp(sy, ty, e);
        const tw = 0.6 + 0.4 * Math.sin(t * 8 + i);
        fx.fillStyle = i % 5 ? `rgba(255,236,190,${0.85 * tw})` : `rgba(140,200,255,${0.9 * tw})`;
        fx.beginPath(); fx.arc(x, y, 3.2 + (1 - e) * 2, 0, 7); fx.fill();
      }
      fx.restore();
      if (mz > 0.85) radial(fx, 540, 900, 700, [[0, 'rgba(255,230,180,0.35)'], [1, 'rgba(255,230,180,0)']], (mz - 0.85) / 0.15, 'lighter');
    }
    const ta = prog(t, K.acheret - 0.1, K.acheret + 0.4);
    titles.show('s9', 'מציאות אחרת לגמרי', { style: 'thingold', size: 92, y: 360, op: clamp(ta * 2), tracking: lerp(26, 4, E.outCubic(ta)) });
    if (t < 47.95) S.flash = 0.95 * (1 - prog(t, 47.65, 47.95));
    S.vignette = 0.45;
  } });

  // ---------------------------------------------------------------- S10 THE BUILD-UP
  const corr = (() => {
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x020617, 4, 42); const camera = G.cam(50);
    const c = G.corridor(30, 1.6); scene.add(c);
    const end = G.glowSprite(0xfff1d0, 26, 1); end.position.set(0, 0, -50); scene.add(end);
    const end2 = G.glowSprite(0x9fd0ff, 60, 0.6); end2.position.set(0, 0, -52); scene.add(end2);
    return { scene, camera, c, end };
  })();
  const vign = [
    { t0: 55.6, key: 'galilee_gamla', ppl: [0, 1, 2, 3], mood: 'calm', walk: 1 },
    { t0: 56.12, key: 'haifa_view', ppl: [4, 5, 6], mood: 'cheer', walk: 0 },
    { t0: 56.65, key: 'jerusalem_sunrise', ppl: [7, 8], mood: 'calm', walk: 0, wave: 1 },
    { t0: 57.2, key: 'ramon_view', ppl: [9, 10, 11, 12, 13], mood: 'cheer', walk: 0 },
  ];
  // citizen mosaic (offscreen) → points → Knesset
  let mosaic = null, mosaicPts = null;
  const MC = 9, MR = 16, TS = 120;
  const mtiles = [];
  function drawTile(g, k, t) {
    const m = mtiles[k], x = m.i * TS, y = m.j * TS;
    g.save(); g.beginPath(); g.rect(x + 3, y + 3, TS - 6, TS - 6); g.clip();
    g.fillStyle = m.bg; g.fillRect(x, y, TS, TS);
    const kk = m.p.kind === 'child' ? 0.62 : m.p.kind === 'teen' ? 0.88 : m.p.kind === 'elder' ? 0.95 : 1, hh = TS * 2.4 / kk; // head centred in the tile
    person(g, m.p, x + TS / 2, y + TS * 0.5 + hh * kk * (m.p.kind === 'child' ? 0.98 : 0.9), hh, { t: t + m.ph });
    g.restore();
  }
  function buildMosaic() {
    if (mosaic) return;
    const pal = ['#1d3f8f', '#2f6bd8', '#e9eef7', '#f2c14e', '#5aa0e8', '#c9a227', '#3b4a63', '#8fb8ff'], r = rng(17), mc = makeCast(MC * MR, 404);
    for (let j = 0; j < MR; j++) for (let i = 0; i < MC; i++) mtiles.push({ i, j, bg: pal[(r() * pal.length) | 0], p: mc[j * MC + i], ph: r() * 5 });
    mosaic = document.createElement('canvas'); mosaic.width = W; mosaic.height = H; const g = mosaic.getContext('2d');
    mtiles.forEach((_, k) => drawTile(g, k, 0));
    const d = g.getImageData(0, 0, W, H).data; mosaicPts = [];
    for (let y = 6; y < H; y += 22) for (let x = 6; x < W; x += 22) { const k = (y * W + x) * 4; mosaicPts.push([x, y, d[k] / 255, d[k + 1] / 255, d[k + 2] / 255]); }
  }
  const kn = (() => {
    const scene = new THREE.Scene(); const camera = G.cam(40);
    const model = G.knesset(); scene.add(model);
    const n = 5200; const tgt = G.samplePoints(model, n, 8);
    const mats = []; model.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; mats.push(o.material); } });
    scene.add(new THREE.AmbientLight(0x5a6aa0, 0.8));
    const d1 = new THREE.DirectionalLight(0xffe2b0, 1.6); d1.position.set(4, 6, 6); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x5aa0ff, 2.2); d2.position.set(-5, 2, -4); scene.add(d2);
    const up = new THREE.PointLight(0x6ec8ff, 30, 12); up.position.set(0, 0.2, 3.2); scene.add(up);
    const cl = new G.Cloud(n); scene.add(cl.points);
    const halo = G.glowSprite(0x6ec8ff, 14, 0); halo.position.set(0, 1.2, -1); scene.add(halo);
    return { scene, camera, model, mats, cl, tgt, n, halo };
  })();
  out.push({ t0: 54.15, t1: 63.7, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < 55.6) {
      studioBg(bg, { cy: 820, c0: '#0b2a6b', c1: '#00030c' });
      const f = E.inQuad(prog(t, 54.15, 55.6));
      corr.c.userData.frames.forEach((fr, i) => { const z = -i * 1.6 + (t - 54.15) * 9.5; fr.position.z = ((z % 48) + 48) % 48 - 46; fr.userData.m.opacity = 0.9; fr.rotation.z = Math.sin(t * 0.8 + i * 0.3) * 0.05; });
      setCam(corr.camera, [0, 0, 2.5], [0, 0, -10], 50);
      corr.end.scale.setScalar(26 + f * 30);
      G.request(corr.scene, corr.camera);
      flyParticles(fx, 540, 960, 160, t, 1.2, 0.6, 21);
      const a = prog(t, K.shinui - 0.04, K.shinui + 0.16);
      titles.show('s10a', 'שינוי?', { style: 'chrome', size: 250, y: 960, scale: slam(a, 2.6), op: clamp(a * 5) * (1 - prog(t, 55.45, 55.6)), glow: 24 });
      if (t > 55.5) S.flash = prog(t, 55.5, 55.6) * 0.8;
    } else if (t < 57.75) {
      let vi = 0; vign.forEach((v, i) => { if (t >= v.t0) vi = i; });
      const v = vign[vi], lt = t - v.t0;
      photo(bg, img, v.key, { fx: 0.5, fy: 0.5, zoom: 1.15 + lt * 0.08, bloom: 0.35, grade: 'gold', gradeAmt: 0.7 });
      vgrad(bg, 1000, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(4,10,30,0.75)']]);
      v.ppl.forEach((k, j) => {
        const n = v.ppl.length, x = 540 + (j - (n - 1) / 2) * (n > 4 ? 190 : 230) + (v.walk ? lt * 120 : 0);
        person(bg, cast[k + vi * 3], x, 1560, 560, { t, walk: v.walk, mood: v.mood, wave: v.wave && j === 0 ? 1 : 0 });
      });
      whip(S, t, v.t0);
      S.credit = credits(v.key);
      const a = prog(t, K.atid - 0.05, K.atid + 0.18);
      titles.show('s10b', 'עתיד טוב יותר?', { style: 'gold', size: 150, y: 360, scale: slam(a, 2.2), op: clamp(a * 5), glow: 20, glowColor: 'rgba(255,200,90,0.7)' });
    } else {
      buildMosaic();
      studioBg(bg, { cy: 900, c0: '#122d6e', c1: '#01040f' });
      const zo = E.inOutCubic(prog(t, 57.75, 59.6));
      const morph = prog(t, 59.55, 61.4), solid = ease(prog(t, 60.9, 62.2));
      if (t < 59.75) {
        const z = lerp(8.5, 1, zo), cx = 4 * TS + TS / 2, cy = 7 * TS + TS / 2;
        const ox = lerp(cx, 540, zo), oy = lerp(cy, 960, zo);
        bg.save(); bg.translate(540, 960); bg.scale(z, z); bg.translate(-ox, -oy); bg.globalAlpha = 1 - prog(t, 59.55, 59.75);
        // vector-draw only the tiles in view, so the zoom stays crisp
        const hw = 540 / z, hh2 = 960 / z;
        mtiles.forEach((m, k) => { const x = m.i * TS, y = m.j * TS; if (x + TS > ox - hw && x < ox + hw && y + TS > oy - hh2 && y < oy + hh2) drawTile(bg, k, t); });
        bg.restore();
      }
      if (t >= 59.55) {
        const c = kn.cl, cam = kn.camera;
        const orbit = lerp(0.42, 0.78, ease(prog(t, 59.55, 63.7))), push = E.inExpo(prog(t, 62.9, 63.7));
        const dist = lerp(lerp(15.5, 13.5, prog(t, 59.55, 62.9)), 6.5, push);
        setCam(cam, [Math.sin(orbit) * dist, lerp(4.2, 1.8, push), Math.cos(orbit) * dist], [0, 0.6, 0], 40);
        cam.updateMatrixWorld();
        // start positions: mosaic samples spread on a plane facing the camera filling the frame
        const fwd = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
        cam.getWorldDirection(fwd); right.crossVectors(fwd, cam.up).normalize(); upv.crossVectors(right, fwd).normalize();
        const d0 = 6.0, hh = 2 * d0 * Math.tan((40 * Math.PI) / 360), ww = hh * (W / H);
        const center = cam.position.clone().addScaledVector(fwd, d0);
        const r = rng(3);
        for (let i = 0; i < kn.n; i++) {
          const m = mosaicPts[i % mosaicPts.length], b = i * 3, dl = r() * 0.4;
          const e = E.inOutCubic(clamp((morph - dl) / 0.6));
          const sx = center.x + right.x * (m[0] / W - 0.5) * ww + upv.x * (0.5 - m[1] / H) * hh;
          const sy = center.y + right.y * (m[0] / W - 0.5) * ww + upv.y * (0.5 - m[1] / H) * hh;
          const sz = center.z + right.z * (m[0] / W - 0.5) * ww + upv.z * (0.5 - m[1] / H) * hh;
          const arc = Math.sin(e * Math.PI) * (1.5 + r() * 1.5);
          c.pos[b] = lerp(sx, kn.tgt[b], e); c.pos[b + 1] = lerp(sy, kn.tgt[b + 1], e) + arc; c.pos[b + 2] = lerp(sz, kn.tgt[b + 2], e);
          const tc = i % 7 === 0 ? [1, 0.84, 0.45] : [0.6, 0.82, 1];
          c.col[b] = lerp(m[2], tc[0], e); c.col[b + 1] = lerp(m[3], tc[1], e); c.col[b + 2] = lerp(m[4], tc[2], e);
          c.alp[i] = (0.9 - solid * 0.55) * (0.7 + 0.3 * Math.sin(t * 7 + i)); c.siz[i] = lerp(0.09, 0.05, e);
        }
        c.commit();
        kn.mats.forEach((m) => { m.opacity = solid; m.depthWrite = solid > 0.6; });
        kn.model.visible = solid > 0.01;
        kn.halo.material.opacity = 0.35 * solid;
        G.request(kn.scene, kn.camera);
        if (solid > 0) { rays(fx, 540, 1250, 12, t, 0.12 * solid, '120,190,255', 0.1); }
      }
      const a = prog(t, K.mitzagim - 0.05, K.mitzagim + 0.2);
      titles.show('s10c', 'ייצוג אמיתי?', { style: 'chrome', size: 160, y: 360, scale: slam(a, 2.4), op: clamp(a * 5) * (1 - prog(t, 63.3, 63.6)), glow: 22 });
      S.flash = Math.max(S.flash, E.inExpo(prog(t, 63.2, 63.7)) * 0.95);
      if (t > 62.9) speedLines(fx, 540, 1000, 120, t * 3, prog(t, 62.9, 63.7), '220,235,255', 12);
    }
    S.vignette = 0.55;
  } });

  // ---------------------------------------------------------------- S11 THE FIRST CLIMAX
  const sl11 = (() => {
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x061a52, 10, 60); const camera = G.cam(55);
    const n = 700, m = G.slips(n); scene.add(m);
    const box = G.ballotBox(); box.scale.setScalar(2.2); box.position.set(0, -2.6, -46); scene.add(box);
    scene.add(new THREE.AmbientLight(0x8090c0, 1.2));
    const d = new THREE.DirectionalLight(0xffffff, 2.0); d.position.set(2, 4, 5); scene.add(d);
    const d2 = new THREE.DirectionalLight(0x6ec8ff, 1.5); d2.position.set(-3, -2, -4); scene.add(d2);
    const r = rng(6), seeds = [];
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, rr = 0.9 + Math.pow(r(), 0.7) * 7; seeds.push([Math.cos(a) * rr, Math.sin(a) * rr * 1.4, -r() * 60, r() * 10, r() * 10, r() * 10]); }
    return { scene, camera, m, box, seeds, n };
  })();
  out.push({ t0: 63.7, t1: 67.55, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < 65.22) {
      studioBg(bg, { cy: 960, c0: '#2a6cff', c1: '#020a2a', r: 1300 });
      rays(bg, 540, 960, 26, t * 2, 0.3, '220,235,255', 0.07);
      const fly = E.inCubic(prog(t, 63.8, 65.2));
      const cz = lerp(4, -40.8, fly);
      setCam(sl11.camera, [0, lerp(0, -0.05, fly), cz], [0, lerp(0, -0.05, fly), cz - 10], 55);
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
      sl11.seeds.forEach((s, i) => {
        pv.set(s[0], s[1], s[2]); e.set(s[3] + t * 1.3, s[4] + t * 0.9, s[5] + t * 0.7); q.setFromEuler(e);
        mtx.compose(pv, q, one); sl11.m.setMatrixAt(i, mtx);
      });
      sl11.m.instanceMatrix.needsUpdate = true;
      G.request(sl11.scene, sl11.camera);
      burst(fx, 540, 960, t, K.az, { n: 600, speed: 2600, life: 1.0, seed: 61, colors: ['255,255,255', '140,200,255', '60,120,255'] });
      ring(fx, 540, 960, t, K.az, 0.7, 1300, '220,235,255', 60); ring(fx, 540, 960, t, K.az + 0.12, 0.7, 1300, '120,180,255', 30);
      if (t < 63.92) S.flash = 0.9 * (1 - prog(t, 63.7, 63.92));
      S.shake = Math.exp(-(t - K.az) * 4) * 1.3;
      S.black = E.inExpo(prog(t, 65.0, 65.22));
    } else {
      const g = bg.createRadialGradient(540, 900, 0, 540, 900, 1400); g.addColorStop(0, '#fff3d0'); g.addColorStop(0.25, '#f2b640'); g.addColorStop(0.6, '#1b3f9a'); g.addColorStop(1, '#030a24'); bg.fillStyle = g; bg.fillRect(0, 0, W, H);
      rays(bg, 540, 900, 30, t * 0.6, 0.35, '255,240,200', 0.07);
      const r = rng(8);
      for (let i = 0; i < 60; i++) { // floating slips
        const x = r() * W, y = ((r() * H + (t - 65) * (30 + r() * 60)) % H), s = 0.4 + r() * 0.8, a = r() * 6 + t * (r() - 0.5);
        bg.save(); bg.translate(x, H - y); bg.rotate(a); bg.globalAlpha = 0.35 + r() * 0.4; bg.fillStyle = '#fbfbf7'; bg.fillRect(-30 * s, -42 * s, 60 * s, 84 * s); bg.fillStyle = '#c9ced8'; bg.fillRect(-18 * s, -28 * s, 36 * s, 22 * s); bg.restore();
      }
      const a1 = prog(t, K.lehachlit2 - 0.05, K.lehachlit2 + 0.16), a2 = prog(t, K.lehachlit2 + 0.12, K.lehachlit2 + 0.3);
      const drift = 1 + prog(t, 65.4, 67.55) * 0.06;
      titles.show('s11a', 'ההחלטה', { style: 'gold', size: 230, y: 840, scale: slam(a1, 2.6) * drift, op: clamp(a1 * 5), glow: 30, glowColor: 'rgba(255,190,80,0.8)' });
      titles.show('s11b', 'גם שלכם!', { style: 'chrome', size: 190, y: 1060, scale: slam(a2, 2.6) * drift, op: clamp(a2 * 5), glow: 24 });
      // light sweep across the title
      const sw = prog(t, 66.0, 66.7);
      if (sw > 0 && sw < 1) { fx.save(); fx.globalCompositeOperation = 'lighter'; const x = lerp(-300, 1380, sw); const gg = fx.createLinearGradient(x - 160, 0, x + 160, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); fx.fillStyle = gg; fx.translate(0, 0); fx.fillRect(0, 700, W, 520); fx.restore(); }
      if (t < 65.4) S.flash = 0.8 * (1 - prog(t, 65.22, 65.4));
      burst(fx, 540, 900, t, K.lehachlit2, { n: 300, speed: 1500, life: 1.2, seed: 62, colors: ['255,255,255', '255,214,120'] });
      S.shake = t > K.lehachlit2 ? Math.exp(-(t - K.lehachlit2) * 6) * 0.9 : 0;
      S.black = prog(t, 67.35, 67.55) * 0.9;
    }
    S.vignette = 0.5;
  } });

  // ---------------------------------------------------------------- S12 THE HUMAN MOMENT
  const flagHero = (() => {
    const scene = new THREE.Scene(); const camera = G.cam(38);
    const f = G.flag(2.2, 1.6); scene.add(f);
    scene.add(new THREE.AmbientLight(0xbfd4ff, 0.9));
    const sun = new THREE.DirectionalLight(0xffe2b0, 2.6); sun.position.set(3, 4, 5); scene.add(sun);
    const back = new THREE.DirectionalLight(0x9fd0ff, 1.2); back.position.set(-3, 1, -4); scene.add(back);
    return { scene, camera, f };
  })();
  function sky(ctx, t, { warm = 1, sunX = 880, sunY = 330 } = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d4fc4'); g.addColorStop(0.55, '#6fa8ec'); g.addColorStop(1, warm ? '#ffd9a0' : '#bcdcff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    radial(ctx, sunX, sunY, 900, [[0, 'rgba(255,245,215,0.95)'], [0.2, 'rgba(255,220,150,0.45)'], [1, 'rgba(255,220,150,0)']], 1, 'lighter');
    rays(ctx, sunX, sunY, 18, t * 0.4, 0.16, '255,236,190', 0.09);
  }
  const ports = [[67.55, 0, 'jerusalem_sunrise_blur'], [68.9, 1, 'galilee_blur'], [69.85, 2, 'haifa_view_blur'], [70.72, 3, 'galilee_gamla_blur'], [71.45, 4, 'jerusalem_sunrise_blur']];
  out.push({ t0: 67.55, t1: 74.1, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < K.ichpat) {
      let pi = 0; ports.forEach((p, i) => { if (t >= p[0]) pi = i; });
      const [t0, k, key] = ports[pi], lt = t - t0;
      cover(bg, img[key], { zoom: 1.2 + lt * 0.03 }); grade(bg, 'gold', 0.8); fill(bg, '#1a0e04', 0.25, 'multiply');
      bokeh(bg, t, 18, 30 + pi, '255,214,150', 0.45);
      const s = lerp(1.2, 1.3, prog(t, t0, t0 + 1.4));
      portrait(bg, PORTRAITS[k], 540, 880, s, { t: lt + k, smile: 0.35, look: 0 });
      vgrad(bg, 1150, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,6,2,0.55)']]);
      const cut = Math.max(0, 0.12 - lt) / 0.12; S.black = Math.max(S.black, cut * 0.6 * (pi ? 1 : 0));
      if (t < 67.75) S.black = 1 - prog(t, 67.55, 67.75);
      S.vignette = 0.7;
    } else {
      sky(bg, t);
      const lt = t - K.ichpat;
      flagHero.f.userData.update(t * 1.1, 1.3);
      flagHero.f.position.set(-1.05, 0.15, 0); flagHero.f.rotation.set(0, 0.2, 0.02);
      setCam(flagHero.camera, [0.25 + lt * 0.05, -0.05, 4.9 - lt * 0.12], [0.1, 0.0, 0], 38);
      G.request(flagHero.scene, flagHero.camera);
      flare(fx, 880, 330, 1.4, 0.9, 'gold');
      const a1 = prog(t, K.ichpat - 0.02, K.ichpat + 0.3), a2 = prog(t, K.shetatzbiu - 0.05, K.shetatzbiu + 0.16);
      titles.show('s12a', 'לא משנה למי.', { style: 'white', size: 96, y: 300, op: clamp(a1 * 3), scale: lerp(0.9, 1, E.outCubic(a1)) });
      titles.show('s12b', 'העיקר שתצביעו!', { style: 'chrome', size: 118, y: 440, scale: slam(a2, 2.4), op: clamp(a2 * 5), glow: 18 });
      if (t < K.ichpat + 0.1) S.flash = 0.8 * (1 - prog(t, K.ichpat, K.ichpat + 0.1));
      S.vignette = 0.35;
      S.black = prog(t, 73.95, 74.1) * 0.6;
    }
  } });

  // ---------------------------------------------------------------- S13 THE POWER OF REPRESENTATION
  const PAL = ['#2f6bd8', '#ffd76a', '#ffffff', '#6ec8ff', '#c9d3e6', '#e6a92a', '#1d4fa8', '#9fd0ff'];
  const GC = 20, GR = 10, SP = 46;
  const dots = (() => {
    const r = rng(99), a = [];
    for (let j = 0; j < GR; j++) for (let i = 0; i < GC; i++) {
      const v = fbm1(i * 0.23 + j * 0.61 + 3.1) + fbm1(j * 0.31 - i * 0.17 + 9.7);
      const ci = Math.floor(clamp((v + 1.2) / 2.4, 0, 0.999) * PAL.length);
      a.push({ i, j, c: PAL[(ci + (r() < 0.12 ? 3 : 0)) % PAL.length], rank: r() });
    }
    return a;
  })();
  const kpts = (() => {
    const s = G.sampleDrawing(1000, 640, (g, w, h) => knessetSilhouette(g, w, h), 4, 0.3, 4);
    const N = dots.length * 2, outp = []; for (let k = 0; k < N; k++) outp.push(s[Math.floor((k * s.length) / N)]); const r = rng(2); for (let k = N - 1; k > 0; k--) { const j = (r() * (k + 1)) | 0; [outp[k], outp[j]] = [outp[j], outp[k]]; } return outp;
  })();
  let kglow = null;
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  out.push({ t0: 74.1, t1: 82.55, draw(t, S) {
    const { bg, fx, titles } = S;
    studioBg(bg, { cy: 900, c0: '#10275e', c1: '#01040e', r: 1400 });
    const part = lerp(0.1, 0.96, E.inOutCubic(prog(t, K.ki + 0.2, K.lakalpiyot + 0.5)));
    const match = ease(prog(t, K.kacha, K.hatzibur));
    const morph = E.inOutCubic(prog(t, K.hatzibur, 81.3));
    const ox = 540 - ((GC - 1) * SP) / 2, ayy = 330, byy = 1020;
    const parts = dots.filter((d) => d.rank < part);
    const appear = clamp(prog(t, 74.1, 74.5));
    const lab = (txt, y) => { fx.save(); fx.globalAlpha = appear * (1 - morph); fx.fillStyle = 'rgba(255,255,255,0.85)'; fx.font = "500 44px 'Heebo'"; fx.textAlign = 'center'; fx.direction = 'rtl'; fx.fillText(txt, 540, y); fx.restore(); };
    lab('הציבור', ayy - 52); lab('התוצאות', byy - 52);
    // participation meter (no numbers)
    fx.save(); fx.globalAlpha = appear * (1 - morph);
    fx.fillStyle = 'rgba(255,255,255,0.12)'; rrect(fx, 140, 795, 800, 22, 11); fx.fill();
    const mg = fx.createLinearGradient(140, 0, 940, 0); mg.addColorStop(0, '#2f8cff'); mg.addColorStop(1, '#ffd76a'); fx.fillStyle = mg; rrect(fx, 940 - 800 * part, 795, 800 * part, 22, 11); fx.fill();
    fx.fillStyle = 'rgba(255,255,255,0.75)'; fx.font = "300 34px 'Heebo'"; fx.textAlign = 'center'; fx.direction = 'rtl'; fx.fillText('השתתפות בבחירות', 540, 862); fx.restore();
    const kx = (p) => 540 + p[0] * 600, ky = (p) => 760 - p[1] * 600;
    dots.forEach((d, n) => {
      const x = ox + d.i * SP, yA = ayy + d.j * SP, yB = byy + d.j * SP;
      const on = d.rank < part;
      // reflection: colour of the nearest participating member of the public
      let best = null, bd = 1e9; for (const q of parts) { const dd = (q.i - d.i) ** 2 + (q.j - d.j) ** 2; if (dd < bd) { bd = dd; best = q; } }
      const cB = best ? best.c : '#334';
      const kA = kpts[n * 2], kB = kpts[n * 2 + 1];
      const pA = [lerp(x, kx(kA), morph), lerp(yA, ky(kA), morph)], pB = [lerp(x, kx(kB), morph), lerp(yB, ky(kB), morph)];
      const rad = lerp(15, 8, morph) * appear;
      bg.fillStyle = hexA(d.c, on ? 1 : lerp(0.22, 1, morph)); bg.beginPath(); bg.arc(pA[0], pA[1], rad, 0, 7); bg.fill();
      if (on && morph < 1) radial(fx, pA[0], pA[1], 34, [[0, hexA(d.c, 0.35)], [1, hexA(d.c, 0)]], 1 - morph, 'lighter');
      bg.fillStyle = hexA(cB, lerp(0.9, 1, match)); bg.beginPath(); bg.arc(pB[0], pB[1], rad, 0, 7); bg.fill();
    });
    if (match > 0 && morph < 1) { // "match" glow between the two pictures
      radial(fx, 540, 810, 300, [[0, 'rgba(255,214,120,0.35)'], [1, 'rgba(255,214,120,0)']], match * (1 - morph), 'lighter');
    }
    if (morph > 0.3) { // the facade the dots assemble into
      const k = (morph - 0.3) / 0.7; if (!kglow) { kglow = document.createElement('canvas'); kglow.width = 1000; kglow.height = 640; knessetSilhouette(kglow.getContext('2d'), 1000, 640, '#9fd0ff'); }
      bg.save(); bg.globalAlpha = 0.32 * k; bg.globalCompositeOperation = 'lighter'; bg.shadowColor = 'rgba(110,200,255,1)'; bg.shadowBlur = 40;
      bg.drawImage(kglow, 540 - 500 * (600 / 640), 760 - 320 * (600 / 640), 1000 * (600 / 640), 640 * (600 / 640)); bg.restore();
    }
    if (morph > 0.6) { rays(fx, 540, 760, 14, t, 0.15 * (morph - 0.6) / 0.4, '120,190,255', 0.1); radial(fx, 540, 760, 700, [[0, 'rgba(120,190,255,0.25)'], [1, 'rgba(120,190,255,0)']], (morph - 0.6) / 0.4, 'lighter'); }
    const sweep = prog(t, 81.3, 82.2);
    if (sweep > 0 && sweep < 1) { fx.save(); fx.globalCompositeOperation = 'lighter'; const x = lerp(-200, 1280, sweep); const gg = fx.createLinearGradient(x - 120, 0, x + 120, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); fx.fillStyle = gg; fx.fillRect(0, 440, W, 640); fx.restore(); }
    S.tag = morph < 0.5 ? 'המחשה' : null;
    S.subsY = 1640;
  } });

  // ---------------------------------------------------------------- S14 SHARE THE MESSAGE
  const shareIcons = (g, x, y, k) => {
    g.save(); g.translate(x, y); g.fillStyle = ['#2f8cff', '#f2c14e', '#7a8aa8', '#c9d3e6'][k]; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 5;
    if (k === 0) { rrect(g, -18, -14, 36, 24, 8); g.fill(); g.beginPath(); g.moveTo(-6, 10); g.lineTo(-12, 20); g.lineTo(4, 10); g.fill(); }
    if (k === 1) { g.strokeRect(-18, -12, 36, 24); g.beginPath(); g.moveTo(-18, -12); g.lineTo(0, 2); g.lineTo(18, -12); g.stroke(); }
    if (k === 2) { g.beginPath(); g.arc(-7, 0, 9, 0.5, 5.8); g.stroke(); g.beginPath(); g.arc(7, 0, 9, 3.6, 2.6 + 6.28); g.stroke(); }
    if (k === 3) { for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 12, 0, 4, 0, 7); g.fill(); } }
    g.restore();
  };
  const tiles = [['haifa_view_blur', 3], ['jerusalem_sunrise_blur', 9], ['galilee_blur', 15]];
  let greyCanvas = null;
  function benchScene(c, t, color) {
    cover(c, img.haifa_view_blur, { zoom: 1.1 }); grade(c, 'dusk', 1);
    vgrad(c, 0, H, [[0, 'rgba(10,20,50,0.3)'], [1, 'rgba(0,0,0,0.6)']]);
    c.fillStyle = '#2a2f3a'; c.fillRect(0, 1380, W, 540);
    // street lamp
    c.fillStyle = '#1a1d24'; c.fillRect(840, 420, 16, 980); c.fillRect(780, 420, 90, 14);
    radial(c, 800, 450, 420, [[0, 'rgba(255,214,140,0.55)'], [1, 'rgba(255,214,140,0)']], 1, 'lighter');
    // bench
    c.fillStyle = '#5a3a22'; c.fillRect(250, 1240, 580, 26); c.fillRect(250, 1160, 580, 22); c.fillStyle = '#20232b'; c.fillRect(280, 1266, 14, 120); c.fillRect(786, 1266, 14, 120);
    const up = prog(t, 96.3, 96.9);
    const p = cast[33];
    if (up < 1) person(c, p, 540, 1385, 520, { t, sit: 1 - up, mood: t > 95.9 ? 'calm' : 'sad', phoneGlow: t > K.veomrim ? 0.5 + 0.5 * Math.sin(t * 18) * (t < 95.3 ? 1 : 0.2) : 0 });
    else person(c, p, 540, 1385, 520, { t, wave: 1, mood: 'cheer' });
    if (t > K.veomrim && t < 95.6) { c.save(); c.strokeStyle = 'rgba(160,210,255,0.8)'; c.lineWidth = 5; for (let k = 0; k < 3; k++) { const rr = 30 + k * 18 + ((t * 60) % 18); c.beginPath(); c.arc(612, 1190, rr, -0.8, 0.8); c.stroke(); } c.restore(); }
    // rain
    if (!color) { c.save(); c.strokeStyle = 'rgba(200,210,230,0.35)'; c.lineWidth = 2; const r = rng(Math.floor(t * 24)); for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 50); c.stroke(); } c.restore(); }
    else { radial(c, 612, 1190, 900, [[0, 'rgba(255,220,150,0.45)'], [1, 'rgba(255,220,150,0)']], 1, 'lighter'); grade(c, 'gold', 0.7); }
  }
  out.push({ t0: 82.55, t1: 97.75, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < K.tishlechu) {
      cover(bg, img.galilee_blur, { zoom: 1.2 }); grade(bg, 'gold', 0.6); bokeh(bg, t, 16, 71, '255,220,170', 0.4);
      const rise = E.outCubic(prog(t, 82.6, 83.5));
      const share = prog(t, 86.62, 86.9);
      phone(bg, 540, lerp(2400, 920, rise), 1.45, lerp(-0.12, -0.03, rise) + Math.sin(t * 0.8) * 0.01, (g, w, h) => {
        g.fillStyle = '#0a0f1e'; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = "500 26px 'Heebo'"; g.textAlign = 'center'; g.fillText('9:41', w / 2, 40);
        thumb(g, 20, 90, w - 40, (w - 40) * 1.25, t, share < 0.5);
        g.fillStyle = '#fff'; g.font = "700 30px 'Heebo'"; g.direction = 'rtl'; g.textAlign = 'right'; g.fillText('כוחו של הקול', w - 30, 90 + (w - 40) * 1.25 + 50);
        // share button
        g.fillStyle = '#2f8cff'; rrect(g, 30, h - 120, w - 60, 80, 40); g.fill(); g.fillStyle = '#fff'; g.font = "800 34px 'Heebo'"; g.textAlign = 'center'; g.fillText('שיתוף', w / 2, h - 68);
        if (t > K.tashtfu + 0.15 && t < K.tashtfu + 0.6) { const rp = prog(t, K.tashtfu + 0.15, K.tashtfu + 0.6); g.strokeStyle = `rgba(255,255,255,${1 - rp})`; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h - 80, 20 + rp * 120, 0, 7); g.stroke(); }
        if (share > 0) {
          const sy = lerp(h, h - 330, E.outCubic(share));
          g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f6fb'; rrect(g, 0, sy, w, 360, 34); g.fill();
          g.fillStyle = '#0b0b12'; g.font = "800 32px 'Heebo'"; g.textAlign = 'center'; g.fillText('שיתוף הסרטון', w / 2, sy + 60);
          for (let k = 0; k < 4; k++) shareIcons(g, w / 2 + (k - 1.5) * 90, sy + 150, k);
        }
      }, { hand: '#d9a07a', glow: 0.3 });
    } else if (t < K.uvemyuchad) {
      studioBg(bg, { cy: 900, c0: '#16367f', c1: '#020617' });
      if (t < K.lamishpacha) {
        // send to friends: card flies from the phone to three friends in different places
        phone(bg, 270, 1300, 0.75, -0.05, (g, w, h) => { g.fillStyle = '#0a0f1e'; g.fillRect(0, 0, w, h); thumb(g, 20, 90, w - 40, (w - 40) * 1.25, t); }, { hand: '#d9a07a', glow: 0.5 });
        tiles.forEach(([k, ci], i) => {
          const x = 640, y = 260 + i * 330, ta = prog(t, K.tishlechu + i * 0.1, K.tishlechu + 0.3 + i * 0.1);
          bg.save(); bg.globalAlpha = ta; bg.translate((1 - E.outCubic(ta)) * 200, 0);
          bg.save(); rrect(bg, x - 30, y - 30, 440, 300, 30); bg.clip(); cover(bg, img[k], { x: x - 30, y: y - 30, w: 440, h: 300, zoom: 1.1 }); grade(bg, 'morning', 0.6);
          person(bg, cast[ci], x + 190, y + 520, 560, { t, phoneGlow: t > 88.6 + i * 0.3 ? 1 : 0, mood: 'calm' }); bg.restore();
          bg.strokeStyle = 'rgba(255,255,255,0.8)'; bg.lineWidth = 4; rrect(bg, x - 30, y - 30, 440, 300, 30); bg.stroke();
          const arrive = 88.62 + i * 0.3;
          if (t > arrive) { const pp = prog(t, arrive, arrive + 0.2); bubble(bg, x + 330, y + 10, 'סרטון חדש', { size: 30, pop: pp, font: "'Heebo'", tail: null, fillC: '#2f8cff', ink: '#fff' }); }
          bg.restore();
          // flying card
          const f = prog(t, arrive - 0.35, arrive);
          if (f > 0 && f < 1) {
            const e = E.inOutCubic(f), sx = 290, sy = 1150, ex = x + 190, ey = y + 120;
            const cx = lerp(sx, ex, e), cy = lerp(sy, ey, e) - Math.sin(e * Math.PI) * 220;
            radial(fx, cx, cy, 90, [[0, 'rgba(160,210,255,0.7)'], [1, 'rgba(160,210,255,0)']], 1, 'lighter');
            thumb(fx, cx - 60, cy - 75, 120, 150, t, false);
          }
        });
        // network spreads out
        const nw = prog(t, 89.2, 90.1);
        if (nw > 0) {
          const r = rng(44); fx.save(); fx.globalCompositeOperation = 'lighter';
          const nodes = []; for (let i = 0; i < 46; i++) nodes.push([r() * W, r() * 1300, r()]);
          nodes.forEach((n, i) => { if (n[2] > nw) return; fx.fillStyle = 'rgba(140,200,255,0.9)'; fx.beginPath(); fx.arc(n[0], n[1], 7, 0, 7); fx.fill(); const m = nodes[(i * 7 + 3) % nodes.length]; if (m[2] <= nw) { fx.strokeStyle = 'rgba(120,180,255,0.45)'; fx.lineWidth = 2; fx.beginPath(); fx.moveTo(n[0], n[1]); fx.lineTo(m[0], m[1]); fx.stroke(); } });
          fx.restore();
        }
      } else {
        // family group chat
        const ap = E.outBack(prog(t, K.lamishpacha, K.lamishpacha + 0.35));
        phone(bg, 540, 940, 1.35 * ap, 0.02, (g, w, h) => {
          g.fillStyle = '#eef2f8'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#1d3f8f'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = "800 36px 'Heebo'"; g.textAlign = 'center'; g.direction = 'rtl'; g.fillText('משפחה', w / 2, 82);
          g.fillStyle = '#ff6b8a'; g.beginPath(); const hx = w / 2 - 95, hy = 70; g.moveTo(hx, hy + 12); g.bezierCurveTo(hx - 22, hy - 6, hx - 12, hy - 24, hx, hy - 10); g.bezierCurveTo(hx + 12, hy - 24, hx + 22, hy - 6, hx, hy + 12); g.fill();
          g.fillStyle = '#fff'; rrect(g, w - 330, 150, 300, 380, 24); g.fill(); thumb(g, w - 318, 162, 276, 330, t, true);
          const msg = (txt, y, t0, mine) => { const a = prog(t, t0, t0 + 0.2); if (a <= 0) return; g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 30); g.font = "600 30px 'Heebo'"; const tw = g.measureText(txt).width + 50; g.fillStyle = mine ? '#2f8cff' : '#fff'; rrect(g, mine ? w - 30 - tw : 30, y, tw, 64, 24); g.fill(); g.fillStyle = mine ? '#fff' : '#0b0b12'; g.textAlign = 'center'; g.fillText(txt, mine ? w - 30 - tw / 2 : 30 + tw / 2, y + 43); g.restore(); };
          msg('אני בפנים!', 560, 90.55, false); msg('יוצאים להצביע ביחד', 640, 90.85, false); msg('סגרנו', 720, 91.15, true);
        }, { hand: '#c98b62', glow: 0.4 });
      }
    } else if (t < 92.4) {
      // "and especially…": the world slows and dims
      const d = prog(t, K.uvemyuchad, 92.4);
      studioBg(bg, { cy: 900, c0: '#0c1d48', c1: '#01030a' });
      bg.save(); bg.globalAlpha = 1 - d; phone(bg, 540, 940 + d * 300, 1.35 * (1 - d * 0.3), 0.02, (g, w, h) => { g.fillStyle = '#0a0f1e'; g.fillRect(0, 0, w, h); thumb(g, 20, 120, w - 40, (w - 40) * 1.25, t); }, { hand: '#c98b62' }); bg.restore();
      S.black = d * 0.7;
    } else {
      // those who gave up: grey world, a message arrives, colour floods back
      if (!greyCanvas) { greyCanvas = document.createElement('canvas'); greyCanvas.width = W; greyCanvas.height = H; }
      const gc = greyCanvas.getContext('2d'); gc.clearRect(0, 0, W, H); benchScene(gc, t, false);
      bg.filter = 'grayscale(1) brightness(0.8)'; bg.drawImage(greyCanvas, 0, 0); bg.filter = 'none';
      const flood = E.inOutCubic(prog(t, K.sheein, 96.9));
      if (flood > 0) { gc.clearRect(0, 0, W, H); benchScene(gc, t, true); bg.save(); bg.beginPath(); bg.arc(612, 1190, flood * 2300, 0, 7); bg.clip(); bg.drawImage(greyCanvas, 0, 0); bg.restore(); }
      if (t < 92.7) S.black = 1 - prog(t, 92.4, 92.7);
      // rising network of light lines — the message spreads
      const nr = prog(t, 96.9, 97.75);
      if (nr > 0) {
        const r = rng(12); fx.save(); fx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 40; i++) { const x = r() * W, y0 = H + r() * 400, y = y0 - nr * (1400 + r() * 900); fx.strokeStyle = `rgba(120,190,255,${0.6 * (1 - nr * 0.5)})`; fx.lineWidth = 3; fx.beginPath(); fx.moveTo(x, y); fx.lineTo(x + (r() - 0.5) * 300, y + 260); fx.stroke(); fx.fillStyle = 'rgba(200,230,255,0.9)'; fx.beginPath(); fx.arc(x, y, 6, 0, 7); fx.fill(); }
        fx.restore(); S.flash = Math.max(S.flash, prog(t, 97.5, 97.75) * 0.6);
      }
      S.vignette = 0.65;
    }
  } });

  // ---------------------------------------------------------------- S15 THE GRAND FINALE
  const finalCrowd = makeCast(44, 515);
  function crowdRows(c, t, lift, warm = 1) {
    const rows = [[1560, 280, 11], [1660, 330, 10], [1790, 400, 9], [1950, 480, 8]];
    let k = 0;
    rows.forEach(([y, h, n], ri) => {
      for (let i = 0; i < n; i++) {
        const p = finalCrowd[k++ % finalCrowd.length];
        const x = (i + 0.5) * (W / n) + (ri % 2 ? 30 : -30) + Math.sin(i * 3.7) * 20;
        const mood = (i + ri) % 3 === 0 ? 'cheer' : 'calm';
        person(c, p, x, y + lift + (ri === 3 ? 40 : 0), h, { t: t + i * 0.3, wave: (i + ri) % 3 === 1 ? 1 : 0, mood, shade: (3 - ri) * 0.12 });
      }
    });
  }
  function streetWalk(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fb2f0'); g.addColorStop(1, '#ffe2b0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // a school building used as polling station
    c.fillStyle = '#e8dcc4'; c.fillRect(-40, 520, 720, 900); c.fillStyle = '#c9b89a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) c.fillRect(30 + i * 160, 600 + j * 200, 100, 120);
    c.fillStyle = '#3a2a1c'; c.fillRect(250, 1180, 200, 240);
    c.fillStyle = '#1d4fb8'; rrect(c, 180, 1050, 340, 110, 16); c.fill(); c.fillStyle = '#fff'; c.font = "900 70px 'Heebo'"; c.textAlign = 'center'; c.direction = 'rtl'; c.fillText('קלפי', 350, 1130);
    c.fillStyle = '#9a9a9a'; c.fillRect(0, 1420, W, 500);
    const r = rng(3);
    for (let i = 0; i < 14; i++) { const p = cast[(i * 3) % cast.length]; const x = ((W + 300) - ((t * 140 + i * 160) % (W + 400))); person(c, p, x, 1560 + (i % 3) * 90, 380 + (i % 3) * 60, { t: t + i, walk: 1, dir: -1 }); }
  }
  out.push({ t0: 97.75, t1: K.total, draw(t, S) {
    const { bg, fx, titles } = S;
    if (t < K.atemChayavim) {
      const z = lerp(1.08, 1.32, E.inOutQuad(prog(t, 97.75, 104.08)));
      photo(bg, img, 'jerusalem_sunrise', { fx: 0.45, fy: 0.5, zoom: z, bloom: 0.22, grade: 'gold', gradeAmt: 0.8 }); grade(bg, 'cine', 1); vgrad(bg, 0, 700, [[0, 'rgba(20,30,70,0.55)'], [1, 'rgba(20,30,70,0)']]);
      const pz = prog(t, K.s15aEnd, K.atemChayavim);
      flare(fx, 170, 470, 1.2 + pz * 1.6, 0.8 + pz * 0.2, 'gold');
      rays(fx, 170, 470, 14, t * 0.4, 0.14 + pz * 0.25, '255,226,170', 0.1);
      S.credit = credits('jerusalem_sunrise');
      S.flash = E.inExpo(pz) * 0.95;
      if (t < 98.0) S.flash = Math.max(S.flash, 0.6 * (1 - prog(t, 97.75, 98.0)));
      S.vignette = 0.55;
      return;
    }
    if (t < K.yalla) {
      const cuts = [K.atemChayavim, 104.6, 105.1, K.chelek, K.mehahachlata, 106.3, K.hayom];
      let ci = 0; cuts.forEach((c, i) => { if (t >= c) ci = i; });
      const lt = t - cuts[ci];
      whip(S, t, cuts[ci]);
      if (ci === 0 || ci === 6) {
        sky(bg, t, { sunX: 880, sunY: 300 });
        flagHero.f.userData.update(t * 1.5, 1.7);
        flagHero.f.position.set(-1.05, 0.15, 0); flagHero.f.rotation.set(0, ci ? 0.1 : 0.35, 0);
        setCam(flagHero.camera, ci ? [0.2, -0.3, 5.6 - lt * 0.15] : [1.0 - lt * 0.5, 0.0, 2.6], ci ? [0.1, 0.25, 0] : [0.6, 0.1, 0], 38);
        G.request(flagHero.scene, flagHero.camera);
        flare(fx, 880, 300, 1.3, 0.8, 'gold');
      } else if (ci === 1) {
        studioBg(bg, { cy: 700, c0: '#2a5ad0', c1: '#030a26' });
        resetStudio(st); st.env1.visible = true; st.cone.visible = true; st.key.intensity = 160;
        const f = prog(t, 104.6, 105.0);
        st.env1.position.set(0, lerp(2.6, 0.95, E.inQuad(f)), 0); st.env1.rotation.set(0, 0, (1 - f) * 0.4); st.env1.visible = f < 1;
        setCam(st.camera, [-1.8 + lt, 0.9, 5.6], [0, 1.45, 0], 38);
        G.request(st.scene, st.camera);
      } else if (ci === 2) {
        photo(bg, img, 'knesset_aerial', { fx: 0.55, fy: 0.45, zoom: 1.3 + lt * 0.9, bloom: 0.3, grade: 'morning' }); S.credit = credits('knesset_aerial');
      } else if (ci === 3) {
        streetWalk(bg, t);
      } else if (ci === 4) {
        photo(bg, img, 'ramon_aerial', { fx: 0.2 + lt * 0.5, fy: 0.5, zoom: 1.1, bloom: 0.3, grade: 'gold', gradeAmt: 0.6 }); S.credit = credits('ramon_aerial');
      } else if (ci === 5) {
        photo(bg, img, 'haifa_view', { fx: 0.5, fy: 0.5 - lt * 0.2, zoom: 1.2 + lt * 0.3, bloom: 0.3, grade: 'morning' }); S.credit = credits('haifa_view');
      }
      const tt = (k, txt, t0, o) => { const a = prog(t, t0 - 0.03, t0 + 0.15); titles.show(k, txt, { size: 150, y: 330, scale: slam(a, 2.4), op: clamp(a * 5), glow: 18, ...o }); };
      if (t < K.chelek) tt('f1', 'אתם חייבים', K.atemChayavim, { style: 'chrome' });
      else if (t < K.hayom) tt('f2', t < K.mehahachlata ? 'להיות חלק' : 'מההחלטה', t < K.mehahachlata ? K.chelek : K.mehahachlata, { style: 'chrome' });
      else {
        tt('f3', 'היום!', K.hayom, { style: 'gold', size: 330, y: 960, glowColor: 'rgba(255,200,90,0.8)' });
        burst(fx, 540, 900, t, K.hayom, { n: 700, speed: 2300, life: 1.6, seed: 71 });
        burst(fx, 260, 600, t, K.hayom + 0.35, { n: 260, speed: 900, life: 1.3, seed: 72, colors: ['255,215,120', '255,255,255'] });
        burst(fx, 820, 700, t, K.hayom + 0.6, { n: 260, speed: 900, life: 1.3, seed: 73, colors: ['140,200,255', '255,255,255'] });
        ring(fx, 540, 960, t, K.hayom, 0.8, 1300, '255,220,140', 50);
        S.shake = Math.exp(-(t - K.hayom) * 5) * 1.3;
        if (t > 108.6) S.flash = prog(t, 108.6, K.yalla) * 0.7;
      }
      if (ci === 1 || ci === 3) S.credit = null;
      S.vignette = 0.45;
      return;
    }
    // ---- final frame: flag above a mosaic of citizens
    sky(bg, t, { warm: 1, sunX: 540, sunY: 260 });
    const lift = lerp(520, 0, E.outCubic(prog(t, K.yalla, 110.9)));
    flagHero.f.userData.update(t * 1.1, 1.3);
    flagHero.f.position.set(-1.1, 0.0, 0); flagHero.f.rotation.set(0, 0.12, 0);
    const cr = E.inOutCubic(prog(t, K.yalla, 112.5));
    setCam(flagHero.camera, [0.0, lerp(-1.6, -2.15, cr), lerp(6.6, 7.4, cr)], [0.0, lerp(-0.8, -1.6, cr), 0], 38);
    G.request(flagHero.scene, flagHero.camera);
    crowdRows(fx, t, lift);
    const subBand = 0;
    const yl = prog(t, K.yalla - 0.03, K.yalla + 0.18);
    titles.show('y1', 'יאללה חברים!', { style: 'comicw', font: "'Suez One'", weight: 400, size: 140, y: 820, rot: -3, scale: slam(yl, 2.2) * (1 - prog(t, 109.5, 109.75) * 0.5), op: clamp(yl * 5) * (1 - prog(t, 109.5, 109.75)) });
    burst(fx, 540, 820, t, K.yalla, { n: 420, speed: 1600, life: 1.4, seed: 81, colors: ['255,255,255', '255,214,90', '47,107,216'], grav: 900 });
    const w1 = prog(t, K.kulanu - 0.04, K.kulanu + 0.16), w2 = prog(t, K.yotzim - 0.04, K.yotzim + 0.16), w3 = prog(t, K.lehatzbia3 - 0.04, K.lehatzbia3 + 0.16);
    titles.show('fa', 'כולנו יוצאים', { style: 'chrome', size: 150, y: 860, op: 1, glow: 20,
      words: (i) => { const a = i === 0 ? w1 : w2; return { op: clamp(a * 5), scale: slam(a, 2.4), blur: (1 - a) * 10 }; } });
    titles.show('fb', 'להצביע!', { style: 'gold', size: 210, y: 1040, scale: slam(w3, 2.6), op: clamp(w3 * 5), glow: 30, glowColor: 'rgba(255,200,90,0.8)' });
    const sub = prog(t, 112.95, 113.6);
    titles.show('fc', 'הקול שלכם. ההחלטה שלכם. העתיד של כולנו.', { style: 'white', size: 46, y: 1222, op: sub, tracking: lerp(14, 2, E.outCubic(sub)), weight: 800 });
    if (sub > 0) { fx.save(); fx.globalAlpha = sub; const bgr = fx.createLinearGradient(0, 1150, 0, 1300); bgr.addColorStop(0, 'rgba(4,14,46,0)'); bgr.addColorStop(0.5, 'rgba(4,14,46,0.7)'); bgr.addColorStop(1, 'rgba(4,14,46,0)'); fx.fillStyle = bgr; fx.fillRect(0, 1150, W, 150); fx.restore(); }
    // final hit
    burst(fx, 540, 1000, t, 112.82, { n: 800, speed: 2600, life: 1.8, seed: 91, colors: ['255,255,255', '255,214,120', '140,200,255'] });
    ring(fx, 540, 1000, t, 112.82, 0.9, 1400, '255,236,190', 60);
    if (t > 112.82 && t < 112.95) S.flash = 0.75 * (1 - prog(t, 112.82, 112.95));
    S.shake = t > 112.82 ? Math.exp(-(t - 112.82) * 5) * 1.0 : 0;
    S.black = prog(t, 115.75, 116.3);
    S.vignette = 0.4;
  } });

  return out;
}
