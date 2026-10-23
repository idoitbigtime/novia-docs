// Core helpers: math, easing, deterministic randomness, 2D drawing, titles, subtitles.
export const W = 1080, H = 1920, FPS = 30;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const between = (t, a, b) => t >= a && t < b;
export const E = {
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
// "slam": overshoot scale-in used for impact typography
export const slam = (t, from = 2.6) => (t <= 0 ? from : lerp(from, 1, E.outBack(clamp(t), 2.2)));

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise1(x) { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1; }
export function fbm1(x, o = 3) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * noise1(x * f + i * 17.3); a *= 0.5; f *= 2; } return v; }

// ---------------- 2D drawing ----------------
// Draw an image covering the frame, focused on (fx, fy) in [0..1] image coords, extra zoom & pan in px.
export function cover(ctx, img, { fx = 0.5, fy = 0.5, zoom = 1, rot = 0, dx = 0, dy = 0, alpha = 1, w = W, h = H, x = 0, y = 0 } = {}) {
  if (!img) return;
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const iw = img.width * s, ih = img.height * s;
  let ox = w / 2 - fx * iw, oy = h / 2 - fy * ih;
  ox = Math.min(0, Math.max(w - iw, ox)) + dx; oy = Math.min(0, Math.max(h - ih, oy)) + dy;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-x - w / 2, -y - h / 2); }
  ctx.drawImage(img, x + ox, y + oy, iw, ih);
  ctx.restore();
}
export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function radial(ctx, x, y, r, stops, alpha = 1, op = 'source-over') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = op; ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
export function vgrad(ctx, y0, y1, stops, alpha = 1, op = 'source-over') {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = op; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
export function fill(ctx, color, alpha = 1, op = 'source-over') {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = op; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// Anamorphic lens flare streak + glow
export function flare(ctx, x, y, s = 1, alpha = 1, hue = 'blue') {
  const core = hue === 'gold' ? '255,225,150' : '170,215,255';
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
  radial(ctx, x, y, 260 * s, [[0, `rgba(${core},0.9)`], [0.15, `rgba(${core},0.35)`], [1, `rgba(${core},0)`]]);
  const g = ctx.createLinearGradient(x - 900 * s, 0, x + 900 * s, 0);
  g.addColorStop(0, `rgba(${core},0)`); g.addColorStop(0.5, `rgba(${core},0.85)`); g.addColorStop(1, `rgba(${core},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - 900 * s, y - 3 * s, 1800 * s, 6 * s);
  ctx.globalAlpha = alpha * 0.4; ctx.fillRect(x - 600 * s, y - 14 * s, 1200 * s, 28 * s);
  // ghosts
  for (let i = 1; i <= 3; i++) {
    const gx = lerp(x, W - x, 0.3 * i), gy = lerp(y, H - y, 0.3 * i);
    radial(ctx, gx, gy, (30 + 25 * i) * s, [[0, `rgba(${core},0.14)`], [0.7, `rgba(${core},0.06)`], [1, `rgba(${core},0)`]]);
  }
  ctx.restore();
}

// Israeli flag proportions (220 x 160): stripes 25 wide, 15 from the edges; hexagram of 5.5-wide lines.
export function drawFlag(ctx, x, y, w, h) {
  const u = h / 160;
  ctx.save();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#0038b8';
  ctx.fillRect(x, y + 15 * u, w, 25 * u); ctx.fillRect(x, y + h - 40 * u, w, 25 * u);
  starOfDavid(ctx, x + w / 2, y + h / 2, 30 * u, 5.5 * u, '#0038b8');
  ctx.restore();
}
// Hexagram from two interlaced equilateral triangle outlines; R = circumradius of the outer edge.
export function starOfDavid(ctx, cx, cy, R, lw, color) {
  ctx.save(); ctx.fillStyle = color;
  for (const rot of [-Math.PI / 2, Math.PI / 2]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { const a = rot + (i * 2 * Math.PI) / 3; ctx[i ? 'lineTo' : 'moveTo'](cx + R * Math.cos(a), cy + R * Math.sin(a)); }
    ctx.closePath();
    const r = R - lw * 2; // inner triangle (line width measured perpendicular: inradius shrinks by lw)
    for (let i = 0; i < 3; i++) { const a = rot + (i * 2 * Math.PI) / 3; ctx[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    ctx.closePath();
    ctx.fill('evenodd');
  }
  ctx.restore();
}

// Speed lines radiating from a center
export function speedLines(ctx, cx, cy, n, t, alpha, color = '255,255,255', seed = 1) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, sp = 0.6 + r() * 1.4, ph = r();
    const d = ((t * sp + ph) % 1);
    const r0 = 80 + d * 1400, r1 = r0 + 120 + 500 * d;
    ctx.strokeStyle = `rgba(${color},${alpha * (0.25 + 0.75 * d) * (0.4 + r() * 0.6)})`;
    ctx.lineWidth = 1 + d * 5 * r();
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
  }
  ctx.restore();
}

// Starfield/dust streaming outward = "flying forward" feeling
export function flyParticles(ctx, cx, cy, n, t, speed, alpha, seed = 7, colors = ['180,215,255', '255,255,255']) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, ph = r(), sz = 0.6 + r() * 2.4, c = colors[i % colors.length];
    const z = ((ph + t * speed) % 1); // 0 far .. 1 near
    const d = Math.pow(z, 2.2) * 1500;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 1.1;
    const tail = 6 + z * 60 * speed;
    ctx.strokeStyle = `rgba(${c},${alpha * z})`; ctx.lineWidth = sz * (0.5 + z * 2.5);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * tail, y - Math.sin(a) * tail * 1.1); ctx.stroke();
  }
  ctx.restore();
}

// Floating dust motes in a light beam
export function dust(ctx, n, t, alpha, seed = 3, area = [0, 0, W, H], color = '255,240,210') {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2] + Math.sin(t * (0.2 + r() * 0.5) + i) * 30;
    const y = area[1] + ((r() * area[3] - t * (8 + r() * 20)) % area[3] + area[3]) % area[3];
    const s = 0.8 + r() * 2.6, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = `rgba(${color},${alpha * tw * (0.3 + r() * 0.7)})`;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Burst of particles from a point at time t0 (deterministic ballistic)
export function burst(ctx, x, y, t, t0, { n = 400, speed = 1600, life = 1.4, seed = 11, colors = ['255,255,255', '140,200,255', '255,215,120'], size = 3.2, grav = 300, drag = 1.8 } = {}) {
  const dt = t - t0; if (dt < 0 || dt > life * 1.6) return;
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, v = speed * (0.15 + Math.pow(r(), 0.6)), l = life * (0.4 + r() * 0.8), c = colors[(r() * colors.length) | 0], s = size * (0.4 + r());
    if (dt > l) continue;
    const k = (1 - Math.exp(-drag * dt)) / drag;
    const px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 0.5 * grav * dt * dt;
    const f = 1 - dt / l;
    ctx.fillStyle = `rgba(${c},${f})`;
    const vx = Math.cos(a) * v * Math.exp(-drag * dt) * 0.02, vy = Math.sin(a) * v * Math.exp(-drag * dt) * 0.02;
    ctx.strokeStyle = `rgba(${c},${f * 0.8})`; ctx.lineWidth = s;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - vx, py - vy); ctx.stroke();
  }
  ctx.restore();
}

// Shockwave ring
export function ring(ctx, x, y, t, t0, dur = 0.7, maxR = 1200, color = '170,215,255', width = 40) {
  const p = (t - t0) / dur; if (p < 0 || p > 1) return;
  const e = E.outCubic(p);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${color},${(1 - p) * 0.9})`; ctx.lineWidth = width * (1 - p) + 2;
  ctx.beginPath(); ctx.arc(x, y, 40 + e * maxR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Halftone dot pattern (comic)
export function halftone(ctx, x, y, w, h, color, step = 22, maxR = 7, angle = 0.4, falloff = null) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = color;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2;
  for (let i = -R; i < R; i += step) for (let j = -R; j < R; j += step) {
    const px = cx + i * ca - j * sa, py = cy + i * sa + j * ca;
    if (px < x - step || px > x + w + step || py < y - step || py > y + h + step) continue;
    const k = falloff ? falloff(px, py) : 1; if (k <= 0.02) continue;
    ctx.beginPath(); ctx.arc(px, py, maxR * k, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Film grain + vignette (post)
let grainTiles = null;
export function post(ctx, t, { vignette = 0.55, grain = 0.06, letter = 0 } = {}) {
  ctx.clearRect(0, 0, W, H);
  if (vignette > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vignette})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (grain > 0) {
    if (!grainTiles) {
      grainTiles = [];
      for (let k = 0; k < 6; k++) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 256;
        const g = c.getContext('2d'), id = g.createImageData(256, 256), r = rng(900 + k);
        for (let i = 0; i < id.data.length; i += 4) { const v = (r() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
        g.putImageData(id, 0, 0); grainTiles.push(c);
      }
    }
    const tile = grainTiles[Math.floor(t * FPS) % grainTiles.length];
    ctx.save(); ctx.globalAlpha = grain; ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(tile, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (letter > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, letter); ctx.fillRect(0, H - letter, W, letter); }
}

// ---------------- Titles (immediate mode DOM) ----------------
export class Titles {
  constructor(root) { this.root = root; this.pool = new Map(); this.used = new Set(); }
  begin() { this.used.clear(); }
  // opts: x,y (center px), size, font, weight, style, scale, sx, sy, rot(deg), rx, ry, op, blur, tracking, glow, words:[fn(i)->{op,dy,scale,blur}]
  show(key, text, o = {}) {
    this.used.add(key);
    let el = this.pool.get(key);
    const style = o.style || 'chrome';
    if (!el) {
      el = document.createElement('div'); el.className = 't';
      el.innerHTML = '<span class="ext"></span><span class="face"></span>';
      this.root.appendChild(el); this.pool.set(key, el); el._text = null; el._style = null;
    }
    const lines = String(text).split('\n');
    const html = lines.map((ln) => ln.split(' ').map((w, i) => `<span class="w">${w}</span>`).join(' ')).join('<br>');
    if (el._text !== text) { el.children[0].innerHTML = html; el.children[1].innerHTML = html; el._text = text; }
    if (el._style !== style) { el.className = 't s-' + style; el._style = style; }
    const font = o.font || "'Heebo'", weight = o.weight || 900, size = o.size || 140;
    el.style.fontFamily = font + ', sans-serif'; el.style.fontWeight = weight; el.style.fontSize = size + 'px';
    el.style.letterSpacing = (o.tracking || 0) + 'px';
    el.style.lineHeight = o.lh || 1.0;
    el.style.opacity = o.op ?? 1;
    const sx = (o.scale ?? 1) * (o.sx ?? 1), sy = (o.scale ?? 1) * (o.sy ?? 1);
    el.style.transform = `translate(${o.x ?? W / 2}px, ${o.y ?? H / 2}px) translate(-50%, -50%) perspective(1400px) rotateX(${o.rx || 0}deg) rotateY(${o.ry || 0}deg) rotate(${o.rot || 0}deg) scale(${sx}, ${sy})`;
    const f = [];
    if (o.blur) f.push(`blur(${o.blur}px)`);
    if (o.glow) f.push(`drop-shadow(0 0 ${o.glow}px ${o.glowColor || 'rgba(90,170,255,0.85)'})`);
    el.style.filter = f.join(' ');
    el.style.display = 'block';
    if (o.words) {
      const ws = el.children[1].querySelectorAll('.w'), we = el.children[0].querySelectorAll('.w');
      ws.forEach((w, i) => {
        const s = o.words(i, ws.length) || {};
        const tr = `translateY(${s.dy || 0}px) scale(${s.scale ?? 1})`;
        w.style.opacity = s.op ?? 1; w.style.transform = tr; w.style.filter = s.blur ? `blur(${s.blur}px)` : '';
        if (we[i]) { we[i].style.opacity = s.op ?? 1; we[i].style.transform = tr; }
      });
    }
    return el;
  }
  end() { for (const [k, el] of this.pool) if (!this.used.has(k)) el.style.display = 'none'; }
}

// ---------------- Subtitles (karaoke highlight) ----------------
export class Subs {
  constructor(root, cues) { this.root = root; this.cues = cues; this.el = document.createElement('div'); this.el.className = 'cue'; root.appendChild(this.el); this.cur = null; }
  update(t, { y = 1450, op = 1 } = {}) {
    const c = this.cues.find((c) => t >= c.t0 && t < c.t1);
    if (!c) { this.el.style.display = 'none'; return; }
    this.el.style.display = 'block';
    if (this.cur !== c) {
      this.el.innerHTML = c.words.map((w) => `<span class="sw">${w.w}</span>`).join(' ');
      this.cur = c;
    }
    const spans = this.el.children;
    c.words.forEach((w, i) => {
      const on = t >= w.s - 0.04 && t < Math.max(w.e, w.s + 0.18);
      const p = clamp((t - (w.s - 0.06)) / 0.12);
      spans[i].className = 'sw' + (on ? ' on' : '');
      spans[i].style.transform = on ? `scale(${1 + 0.08 * Math.sin(Math.PI * clamp((t - w.s) / Math.max(0.2, w.e - w.s)))})` : 'scale(1)';
      spans[i].style.opacity = t < w.s - 0.06 ? 0.9 : 1;
    });
    const fin = clamp((t - c.t0) / 0.12) * clamp((c.t1 - t) / 0.12);
    this.el.style.opacity = op * fin;
    this.el.style.top = (y - this.el.offsetHeight / 2) + 'px';
  }
}
