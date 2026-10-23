// Shared scene helpers
import { W, H, rng, clamp, lerp, E, cover, rrect, radial, fill, vgrad, drawFlag, starOfDavid } from './lib.js';

// Photo with Ken Burns + grade + cheap bloom (blurred copy added on top)
export function photo(ctx, img, key, o = {}) {
  const im = img[key], bl = img[key + '_blur'];
  cover(ctx, im, o);
  if (o.bloom && bl) { ctx.save(); ctx.globalCompositeOperation = 'screen'; cover(ctx, bl, { ...o, alpha: (o.alpha ?? 1) * o.bloom }); ctx.restore(); }
  if (o.grade) grade(ctx, o.grade, o.gradeAmt ?? 1);
}
export function grade(ctx, kind, a = 1) {
  if (a <= 0) return;
  if (kind === 'night') { fill(ctx, '#0b1e5c', 0.55 * a, 'multiply'); fill(ctx, '#2a5bd8', 0.18 * a, 'screen'); }
  if (kind === 'blue') { fill(ctx, '#1b4fd0', 0.22 * a, 'soft-light'); fill(ctx, '#061235', 0.25 * a, 'multiply'); }
  if (kind === 'gold') { fill(ctx, '#ffb648', 0.28 * a, 'soft-light'); fill(ctx, '#ff9a2a', 0.08 * a, 'screen'); }
  if (kind === 'morning') { fill(ctx, '#ffd28a', 0.22 * a, 'soft-light'); fill(ctx, '#bfe0ff', 0.06 * a, 'screen'); }
  if (kind === 'dusk') { fill(ctx, '#2a3550', 0.45 * a, 'multiply'); }
  if (kind === 'cine') { vgrad(ctx, 0, H, [[0, 'rgba(10,30,90,0.35)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(255,170,80,0.18)']], a, 'soft-light'); }
}
// Deep navy studio backdrop
export function studioBg(ctx, { cx = 540, cy = 760, c0 = '#163a8f', c1 = '#040b22', r = 1500, a = 1 } = {}) {
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c0); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// Rotating god-rays from a point
export function rays(ctx, cx, cy, n, t, alpha, color = '120,180,255', spread = 0.12, len = 2200, seed = 5) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.15 + r() * 0.2, w = spread * (0.4 + r());
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, len);
    g.addColorStop(0, `rgba(${color},${alpha * (0.35 + r() * 0.4)})`); g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, len, a - w / 2, a + w / 2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// Flat 2D ballot box (front 3/4 view)
export function ballotBox2D(ctx, x, y, s, { glow = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(10, 6, 190, 26, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#163f96'; ctx.beginPath(); ctx.moveTo(-150, -300); ctx.lineTo(-100, -340); ctx.lineTo(200, -340); ctx.lineTo(150, -300); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0f2f73'; ctx.beginPath(); ctx.moveTo(150, -300); ctx.lineTo(200, -340); ctx.lineTo(200, -40); ctx.lineTo(150, 0); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(-150, 0, 150, 0); g.addColorStop(0, '#2a62d6'); g.addColorStop(1, '#1d4fb8');
  ctx.fillStyle = g; ctx.fillRect(-150, -300, 300, 300);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-150, -60, 300, 14);
  ctx.fillStyle = '#05070f'; ctx.beginPath(); ctx.moveTo(-40, -322); ctx.lineTo(80, -322); ctx.lineTo(90, -316); ctx.lineTo(-30, -316); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = "900 92px 'Heebo'"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('קלפי', 0, -175);
  ctx.fillRect(-80, -115, 160, 7);
  if (glow > 0) radial(ctx, 25, -320, 260, [[0, 'rgba(160,210,255,0.9)'], [1, 'rgba(160,210,255,0)']], glow, 'lighter');
  ctx.restore();
}
// Phone (portrait). drawScreen(ctx, w, h) draws in screen-local coords.
export function phone(ctx, x, y, s, rot, drawScreen, { glow = 0, hand = null } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const w = 420, h = 860;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -w / 2 + 18, -h / 2 + 26, w, h, 64); ctx.fill();
  if (glow > 0) radial(ctx, 0, 0, 700, [[0, 'rgba(120,190,255,0.55)'], [1, 'rgba(120,190,255,0)']], glow, 'lighter');
  ctx.fillStyle = '#10131c'; rrect(ctx, -w / 2, -h / 2, w, h, 64); ctx.fill();
  ctx.strokeStyle = '#4b5470'; ctx.lineWidth = 6; ctx.stroke();
  ctx.save(); rrect(ctx, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 50); ctx.clip();
  ctx.translate(-w / 2 + 16, -h / 2 + 16); drawScreen(ctx, w - 32, h - 32); ctx.restore();
  ctx.fillStyle = '#05060a'; rrect(ctx, -60, -h / 2 + 30, 120, 30, 15); ctx.fill();
  if (hand) { // simple hand holding the phone from below
    ctx.fillStyle = hand; rrect(ctx, -w / 2 - 40, h / 2 - 260, 120, 300, 60); ctx.fill(); rrect(ctx, w / 2 - 70, h / 2 - 330, 110, 380, 55); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; rrect(ctx, w / 2 - 70, h / 2 - 330, 40, 380, 20); ctx.fill();
  }
  ctx.restore();
}
// Video thumbnail used inside phone screens (our own film's key art)
export function thumb(ctx, x, y, w, h, t = 0, play = true) {
  ctx.save(); rrect(ctx, x, y, w, h, 18); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0d2f86'); g.addColorStop(1, '#03091f'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.translate(x + w / 2, y + h * 0.36); ctx.rotate(Math.sin(t * 2) * 0.03); drawFlag(ctx, -w * 0.32, -h * 0.17, w * 0.64, h * 0.34 * 1.0); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(w * 0.1)}px 'Heebo'`; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('כולנו יוצאים להצביע!', x + w / 2, y + h * 0.78);
  if (play) { ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.36, w * 0.09, 0, 7); ctx.fill(); ctx.fillStyle = '#0d2f86'; ctx.beginPath(); ctx.moveTo(x + w / 2 - w * 0.03, y + h * 0.36 - w * 0.045); ctx.lineTo(x + w / 2 + w * 0.05, y + h * 0.36); ctx.lineTo(x + w / 2 - w * 0.03, y + h * 0.36 + w * 0.045); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// Comic speech bubble (RTL text)
export function bubble(ctx, x, y, text, { size = 80, pop = 1, rot = 0, tail = [-1, 1], fillC = '#fff', ink = '#0b0b12', font = "'Suez One'", spiky = false } = {}) {
  if (pop <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const sc = E.outBack(clamp(pop), 2.6); ctx.scale(sc, sc);
  ctx.font = `400 ${size}px ${font}`; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width, bw = tw + size * 0.9, bh = size * 1.55;
  ctx.fillStyle = fillC; ctx.strokeStyle = ink; ctx.lineWidth = 9; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (spiky) { const n = 18; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? 1 : 1.22; ctx.lineTo(Math.cos(a) * bw * 0.62 * rr, Math.sin(a) * bh * 0.72 * rr); } ctx.closePath(); }
  else { ctx.ellipse(0, 0, bw * 0.6, bh * 0.62, 0, 0, 7); }
  ctx.fill(); ctx.stroke();
  if (!spiky && tail) { ctx.beginPath(); ctx.moveTo(tail[0] * bw * 0.18, bh * 0.45); ctx.lineTo(tail[0] * bw * 0.42, bh * 0.95 * tail[1]); ctx.lineTo(tail[0] * bw * 0.02, bh * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = fillC; ctx.beginPath(); ctx.ellipse(0, 0, bw * 0.6 - 5, bh * 0.62 - 5, 0, 0.6, 2.6); ctx.fill(); }
  ctx.fillStyle = ink; ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
}
// Glass shatter overlay
let SHARDS = null;
function makeShards() {
  const r = rng(77), cols = 7, rows = 12, pts = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const edge = i === 0 || j === 0 || i === cols || j === rows;
    pts.push([(i / cols) * W + (edge ? 0 : (r() - 0.5) * 120), (j / rows) * H + (edge ? 0 : (r() - 0.5) * 120)]);
  }
  const P = (i, j) => pts[j * (cols + 1) + i], out = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    for (const tri of r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
      out.push({ tri, cx, cy, rs: (r() - 0.5) * 6, sp: 0.6 + r() * 0.9, tilt: r() });
    }
  }
  return out;
}
export function shatter(ctx, t, t0, { ox = 540, oy = 900, dur = 0.75, color = '20,40,90' } = {}) {
  const dt = t - t0; if (dt < 0 || dt > dur) return;
  if (!SHARDS) SHARDS = makeShards();
  const p = dt / dur;
  ctx.save();
  for (const s of SHARDS) {
    const dx = s.cx - ox, dy = s.cy - oy, d = Math.hypot(dx, dy) + 1;
    const delay = (d / 1400) * 0.12; const q = Math.max(0, dt - delay);
    const v = 2400 * s.sp, k = (1 - Math.exp(-2.2 * q)) / 2.2;
    const tx = (dx / d) * v * k, ty = (dy / d) * v * k + 900 * q * q, a = s.rs * q;
    const sc = 1 + q * 0.6 * s.tilt;
    ctx.save(); ctx.translate(s.cx + tx, s.cy + ty); ctx.rotate(a); ctx.scale(sc, sc * (1 - 0.5 * s.tilt * clamp(q * 2)));
    ctx.beginPath(); ctx.moveTo(s.tri[0][0] - s.cx, s.tri[0][1] - s.cy); ctx.lineTo(s.tri[1][0] - s.cx, s.tri[1][1] - s.cy); ctx.lineTo(s.tri[2][0] - s.cx, s.tri[2][1] - s.cy); ctx.closePath();
    const al = (1 - p) * (q > 0 ? 1 : 1);
    ctx.fillStyle = `rgba(${color},${0.85 * al})`; ctx.fill();
    ctx.strokeStyle = `rgba(220,240,255,${0.9 * al})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(160,210,255,${0.15 * al * s.tilt})`; ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// Simple person icon (for infographics)
export function icon(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -34, 16, 0, 7); ctx.fill(); rrect(ctx, -22, -14, 44, 50, 18); ctx.fill(); ctx.restore();
}
// Draw the Knesset facade silhouette (for point sampling / 2D symbols)
export function knessetSilhouette(g, w, h, color = '#fff') {
  g.fillStyle = color; const cx = w / 2, by = h * 0.8, bw = w * 0.86, bh = h * 0.34;
  g.fillRect(cx - bw / 2 - w * 0.03, by - bh - h * 0.06, bw + w * 0.06, h * 0.06); // roof slab
  const n = 15; for (let i = 0; i < n; i++) { const x = cx - bw / 2 + (i / (n - 1)) * bw; g.fillRect(x - w * 0.012, by - bh, w * 0.024, bh); }
  g.globalAlpha = 0.45; g.fillRect(cx - bw / 2, by - bh, bw, bh); g.globalAlpha = 1;
  g.fillRect(cx - bw / 2 - w * 0.06, by, bw + w * 0.12, h * 0.04); // plinth
  g.fillRect(cx - w * 0.47, by + h * 0.06, w * 0.94, h * 0.015);
}
export { starOfDavid };
