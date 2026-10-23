// Procedural flat-illustration characters. All anonymous: no real person is depicted.
import { rng, clamp, lerp, rrect, E } from './lib.js';

export const SKIN = ['#f3d2b8', '#e8b994', '#d9a07a', '#c98b62', '#a86d48', '#8a5636', '#6b3f26', '#f6dcc8'];
export const HAIRC = ['#1b1410', '#2e1f16', '#4a2f1c', '#6b4425', '#9a6a3a', '#c9a06a', '#d8d2c8', '#8d8d8d', '#3a2a22'];
const TOPS = ['#2f6bd8', '#e9eef7', '#1d3f8f', '#f2c14e', '#5aa0e8', '#ffffff', '#3b4a63', '#8fb8ff', '#d7a43a', '#6c7a92', '#b9d3ff', '#274aa3'];
const BOTS = ['#1f2a44', '#2b3550', '#3f4a5f', '#1a1f2e', '#506080', '#26324d', '#c8b28a'];

// Build a varied, respectful cast of citizens
export function makeCast(n, seed = 1) {
  const r = rng(seed), cast = [];
  const kinds = ['adult', 'adult', 'adult', 'elder', 'child', 'adult', 'teen', 'adult', 'elder', 'adult'];
  const acc = [null, null, 'kippah', 'scarf', null, 'glasses', 'cap', 'beard', null, 'kippah', 'scarf', 'glasses', null, 'beard', 'hat'];
  for (let i = 0; i < n; i++) {
    const kind = kinds[(r() * kinds.length) | 0];
    let hair = ['short', 'long', 'curly', 'bun', 'short', 'bald', 'pony', 'long'][(r() * 8) | 0];
    let a = acc[(r() * acc.length) | 0];
    if (kind === 'child' && (a === 'beard' || a === 'hat')) a = null;
    if (a === 'beard' && (hair === 'long' || hair === 'pony' || hair === 'bun')) hair = 'short';
    let hc = HAIRC[(r() * 6) | 0];
    if (kind === 'elder') hc = HAIRC[6 + ((r() * 2) | 0)];
    cast.push({
      kind, hair, acc: a, hc,
      skin: SKIN[(r() * SKIN.length) | 0], top: TOPS[(r() * TOPS.length) | 0], bot: BOTS[(r() * BOTS.length) | 0],
      dress: (hair === 'long' || hair === 'bun' || hair === 'pony') && r() < 0.45,
      wheel: kind === 'adult' && r() < 0.06, cane: kind === 'elder' && r() < 0.5, bag: kind === 'teen' || r() < 0.12,
      ph: r() * 10, sp: 0.8 + r() * 0.5,
    });
  }
  return cast;
}

function headHair(ctx, p, hr, front) {
  ctx.fillStyle = p.hc;
  const h = p.hair;
  if (!front) {
    if (h === 'long') { rrect(ctx, -hr * 1.08, -hr * 0.6, hr * 2.16, hr * 2.0, hr * 0.7); ctx.fill(); }
    if (h === 'pony') { ctx.beginPath(); ctx.ellipse(hr * 0.95, hr * 0.1, hr * 0.32, hr * 0.75, 0.4, 0, 7); ctx.fill(); }
    if (h === 'bun') { ctx.beginPath(); ctx.arc(0, -hr * 1.05, hr * 0.42, 0, 7); ctx.fill(); }
    return;
  }
  if (h === 'bald') { ctx.beginPath(); ctx.ellipse(-hr * 0.92, 0, hr * 0.18, hr * 0.38, 0, 0, 7); ctx.ellipse(hr * 0.92, 0, hr * 0.18, hr * 0.38, 0, 0, 7); ctx.fill(); return; }
  if (h === 'curly') { for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.arc(Math.cos(a) * hr * 0.92, Math.sin(a) * hr * 0.88 - hr * 0.08, hr * 0.36, 0, 7); ctx.fill(); } return; }
  ctx.beginPath(); ctx.arc(0, -hr * 0.08, hr * 1.04, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(hr * 0.5, -hr * 0.55, -hr * 0.2, -hr * 0.5); ctx.quadraticCurveTo(-hr * 0.8, -hr * 0.35, -hr * 1.02, -hr * 0.0); ctx.fill();
}

function accessory(ctx, p, hr, phase) {
  const a = p.acc;
  if (a === 'kippah') { ctx.fillStyle = ['#1d3f8f', '#ffffff', '#2b2b2b', '#c9a227'][Math.floor(p.ph) % 4]; ctx.beginPath(); ctx.ellipse(hr * 0.15, -hr * 0.98, hr * 0.5, hr * 0.2, 0.12, Math.PI, 0); ctx.fill(); }
  if (a === 'cap') { ctx.fillStyle = '#26324d'; ctx.beginPath(); ctx.arc(0, -hr * 0.2, hr * 1.02, Math.PI, 0); ctx.fill(); ctx.fillRect(-hr * 1.5, -hr * 0.28, hr * 1.2, hr * 0.16); }
  if (a === 'hat') { ctx.fillStyle = '#16161c'; ctx.fillRect(-hr * 1.3, -hr * 0.8, hr * 2.6, hr * 0.16); rrect(ctx, -hr * 0.82, -hr * 1.6, hr * 1.64, hr * 0.9, hr * 0.15); ctx.fill(); }
  if (a === 'glasses') { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = hr * 0.09; ctx.beginPath(); ctx.arc(-hr * 0.36, hr * 0.05, hr * 0.24, 0, 7); ctx.moveTo(hr * 0.6, hr * 0.05); ctx.arc(hr * 0.36, hr * 0.05, hr * 0.24, 0, 7); ctx.moveTo(-hr * 0.12, hr * 0.02); ctx.lineTo(hr * 0.12, hr * 0.02); ctx.stroke(); }
  if (a === 'beard') { ctx.fillStyle = p.hc; ctx.beginPath(); ctx.moveTo(-hr * 0.92, hr * 0.05); ctx.quadraticCurveTo(-hr * 0.8, hr * 1.25, 0, hr * 1.3); ctx.quadraticCurveTo(hr * 0.8, hr * 1.25, hr * 0.92, hr * 0.05); ctx.quadraticCurveTo(hr * 0.5, hr * 0.55, 0, hr * 0.5); ctx.quadraticCurveTo(-hr * 0.5, hr * 0.55, -hr * 0.92, hr * 0.05); ctx.fill(); }
}

// Full-body citizen. Origin = feet center. h = total height in px.
export function person(ctx, p, x, y, h, { t = 0, walk = 0, wave = 0, face = 1, dir = 1, mood = 'calm', alpha = 1, shade = 0, sit = 0, phoneGlow = 0 } = {}) {
  if (shade) p = shaded(p, shade);
  const k = p.kind === 'child' ? 0.62 : p.kind === 'teen' ? 0.88 : p.kind === 'elder' ? 0.95 : 1;
  const s = (h * k) / 420;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s * dir, s);
  const ph = t * 6 * p.sp + p.ph, sw = Math.sin(ph) * walk, bob = Math.abs(Math.cos(ph)) * walk * 6;
  const stoop = p.kind === 'elder' ? 0.07 : 0;
  ctx.translate(0, -bob + sit * 95); ctx.rotate(stoop + (mood === 'sad' ? 0.04 : 0));
  const hr = p.kind === 'child' ? 52 : 40, hipY = -190, shY = -330, tw = p.kind === 'child' ? 84 : 100;
  if (p.wheel) {
    ctx.save(); ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(-10, -75, 75, 0, 7); ctx.stroke();
    ctx.fillStyle = '#3a4152'; ctx.fillRect(-60, -175, 120, 18); ctx.fillRect(40, -280, 14, 120); ctx.restore();
  }
  // legs
  ctx.lineCap = 'round';
  if (sit) {
    for (const sgn of [-1, 1]) { ctx.strokeStyle = p.bot; ctx.lineWidth = 36; ctx.beginPath(); ctx.moveTo(sgn * 24, hipY + 10); ctx.lineTo(sgn * 34, hipY + 40); ctx.lineTo(sgn * 34, hipY + 100); ctx.stroke(); ctx.fillStyle = '#15161c'; ctx.beginPath(); ctx.ellipse(sgn * 34 + 8, hipY + 108, 26, 13, 0, 0, 7); ctx.fill(); }
  } else if (!p.wheel) {
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.translate(sgn * 22, hipY); ctx.rotate(sgn * sw * 0.42);
      ctx.strokeStyle = p.bot; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 170); ctx.stroke();
      ctx.fillStyle = '#15161c'; ctx.beginPath(); ctx.ellipse(10, 182, 26, 13, 0, 0, 7); ctx.fill(); ctx.restore();
    }
  } else {
    ctx.strokeStyle = p.bot; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(-20, hipY + 20); ctx.lineTo(60, hipY + 30); ctx.lineTo(62, -40); ctx.stroke();
  }
  // back hair
  ctx.save(); ctx.translate(0, shY - hr - 6); headHair(ctx, p, hr, false); ctx.restore();
  // arms (behind torso)
  const armSw = -sw * 0.5;
  for (const sgn of [-1, 1]) {
    ctx.save(); ctx.translate(sgn * (tw / 2 - 8), shY + 14);
    let ang = sgn * 0.12 + armSw * sgn;
    if (wave && sgn === 1) ang = -2.4 + Math.sin(t * 10) * 0.35 * wave;
    if (mood === 'upset') ang = sgn === 1 ? -2.6 : 2.6;
    if (mood === 'cheer') ang = sgn * -2.5 + Math.sin(t * 9 + sgn) * 0.2;
    if (mood === 'facepalm' && sgn === 1) ang = -2.9;
    if (mood === 'sad') ang = sgn * 0.5;
    if (phoneGlow && sgn === 1) ang = 0.9;
    ctx.rotate(ang);
    ctx.strokeStyle = p.top; ctx.lineWidth = 28; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 140); ctx.stroke();
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, 150, 15, 0, 7); ctx.fill();
    if (phoneGlow && sgn === 1) { ctx.fillStyle = '#111'; rrect(ctx, -22, 132, 44, 70, 8); ctx.fill(); ctx.fillStyle = `rgba(150,210,255,${0.6 + 0.4 * phoneGlow})`; rrect(ctx, -18, 136, 36, 62, 6); ctx.fill(); }
    if (p.cane && sgn === -1 && !wave) { ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(-6, 330); ctx.stroke(); }
    ctx.restore();
  }
  // torso / dress
  ctx.fillStyle = p.top;
  if (p.dress && !p.wheel) { ctx.beginPath(); ctx.moveTo(-tw / 2 + 4, shY); ctx.lineTo(tw / 2 - 4, shY); ctx.lineTo(tw / 2 + 26, hipY + 95); ctx.lineTo(-tw / 2 - 26, hipY + 95); ctx.closePath(); ctx.fill(); }
  else { rrect(ctx, -tw / 2, shY, tw, hipY - shY + 18, 30); ctx.fill(); }
  if (p.bag) { ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-tw / 2 + 12, shY + 6); ctx.lineTo(tw / 2 - 10, hipY + 6); ctx.stroke(); }
  // neck + head
  ctx.fillStyle = p.skin; ctx.fillRect(-12, shY - 18, 24, 22);
  ctx.save(); ctx.translate(0, shY - hr - 6 + (mood === 'sad' ? 10 : 0)); if (mood === 'sad') ctx.rotate(0.12);
  if (p.acc === 'scarf') {
    ctx.fillStyle = ['#2f6bd8', '#e9e2d0', '#3b4a63', '#c9a227', '#7a2e3b'][Math.floor(p.ph * 3) % 5];
    ctx.beginPath(); ctx.ellipse(0, hr * 0.1, hr * 1.22, hr * 1.32, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-hr * 1.1, hr * 0.5); ctx.quadraticCurveTo(0, hr * 2.2, hr * 1.1, hr * 0.5); ctx.fill();
  }
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(0, 0, hr, hr * 1.08, 0, 0, 7); ctx.fill();
  if (p.acc !== 'scarf') headHair(ctx, p, hr, true);
  // face
  if (face) {
    ctx.fillStyle = '#1b1410';
    const blink = (Math.sin(t * 1.3 + p.ph * 3) > 0.985) ? 0.15 : 1;
    ctx.beginPath(); ctx.ellipse(-hr * 0.36, hr * 0.05, hr * 0.09, hr * 0.12 * blink, 0, 0, 7); ctx.ellipse(hr * 0.36, hr * 0.05, hr * 0.09, hr * 0.12 * blink, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5a2e22'; ctx.lineWidth = hr * 0.08; ctx.beginPath();
    if (mood === 'upset' || mood === 'facepalm' || mood === 'sad') { ctx.arc(0, hr * 0.68, hr * 0.26, Math.PI * 1.15, Math.PI * 1.85); }
    else if (mood === 'shout') { ctx.fillStyle = '#5a1e1e'; ctx.ellipse(0, hr * 0.5, hr * 0.2, hr * 0.26, 0, 0, 7); ctx.fill(); }
    else { ctx.arc(0, hr * 0.3, hr * 0.3, Math.PI * 0.2, Math.PI * 0.8); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,110,110,0.25)'; ctx.beginPath(); ctx.arc(-hr * 0.55, hr * 0.38, hr * 0.16, 0, 7); ctx.arc(hr * 0.55, hr * 0.38, hr * 0.16, 0, 7); ctx.fill();
  }
  accessory(ctx, p, hr, ph);
  ctx.restore();
  ctx.restore();
}
// darken a character's palette toward deep navy (for depth / backlit silhouettes)
function mixHex(h, k) {
  const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = (a, t) => Math.round(a + (t - a) * k);
  return '#' + ((1 << 24) + (m(r, 6) << 16) + (m(g, 14) << 8) + m(b, 40)).toString(16).slice(1);
}
function shaded(p, k) { return { ...p, skin: mixHex(p.skin, k), top: mixHex(p.top, k), bot: mixHex(p.bot, k), hc: mixHex(p.hc, k) }; }

// ---------------- Anonymous politician caricature (bust) ----------------
export const POLS = [
  { skin: '#e8b994', hair: 'comb', hc: '#d8d2c8', suit: '#2b3550', tie: '#c9a227', nose: 1.3, glasses: true, brow: 1 },
  { skin: '#d9a07a', hair: 'slick', hc: '#1b1410', suit: '#1a1f2e', tie: '#8fb8ff', nose: 1.1, glasses: false, brow: 1.4 },
  { skin: '#f3d2b8', hair: 'bob', hc: '#6b4425', suit: '#3f4a5f', tie: null, nose: 0.9, glasses: true, brow: 0.9, pearls: true },
  { skin: '#c98b62', hair: 'bald', hc: '#8d8d8d', suit: '#506080', tie: '#7a2e3b', nose: 1.4, glasses: false, brow: 1.6 },
  { skin: '#e8b994', hair: 'curly', hc: '#2e1f16', suit: '#26324d', tie: '#e9eef7', nose: 1.2, glasses: false, brow: 1.1, beard: true },
  { skin: '#f6dcc8', hair: 'wave', hc: '#c9a06a', suit: '#2b2b38', tie: null, nose: 0.85, glasses: false, brow: 0.8, pearls: false },
  { skin: '#a86d48', hair: 'short', hc: '#1b1410', suit: '#3b4a63', tie: '#2f6bd8', nose: 1.25, glasses: true, brow: 1.2 },
];

export function politician(ctx, p, x, y, s, { t = 0, talk = 0, mood = 'talk', alpha = 1, rot = 0, point = 0 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const hr = 120;
  // body / suit
  ctx.fillStyle = p.suit; ctx.beginPath(); ctx.moveTo(-170, 330); ctx.quadraticCurveTo(-175, 150, -70, 130); ctx.lineTo(70, 130); ctx.quadraticCurveTo(175, 150, 170, 330); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f6fb'; ctx.beginPath(); ctx.moveTo(-48, 130); ctx.lineTo(0, 240); ctx.lineTo(48, 130); ctx.closePath(); ctx.fill();
  if (p.tie) { ctx.fillStyle = p.tie; ctx.beginPath(); ctx.moveTo(-14, 140); ctx.lineTo(14, 140); ctx.lineTo(22, 240); ctx.lineTo(0, 268); ctx.lineTo(-22, 240); ctx.closePath(); ctx.fill(); }
  if (p.pearls) { ctx.fillStyle = '#f7f1e3'; for (let i = 0; i < 9; i++) { const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7; ctx.beginPath(); ctx.arc(Math.cos(a) * 55, 128 + Math.sin(a) * 40, 7, 0, 7); ctx.fill(); } }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-48, 130); ctx.lineTo(-20, 330); ctx.moveTo(48, 130); ctx.lineTo(20, 330); ctx.stroke();
  // pointing hand
  if (point) { ctx.save(); ctx.translate(120, 210); ctx.rotate(-0.6 - point * 0.4); ctx.fillStyle = p.suit; rrect(ctx, -26, -26, 150, 52, 26); ctx.fill(); ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(150, 0, 30, 0, 7); ctx.fill(); rrect(ctx, 160, -10, 60, 20, 10); ctx.fill(); ctx.restore(); }
  // neck
  ctx.fillStyle = p.skin; ctx.fillRect(-36, 70, 72, 70);
  // head (big caricature)
  const bob = Math.sin(t * 7) * 4 * talk;
  ctx.translate(0, bob);
  ctx.fillStyle = p.skin;
  ctx.beginPath(); ctx.ellipse(-hr * 0.98, 10, 22, 34, 0, 0, 7); ctx.ellipse(hr * 0.98, 10, 22, 34, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, hr * 0.98, hr * 1.12, 0, 0, 7); ctx.fill();
  // shading
  const g = ctx.createRadialGradient(-40, -50, 20, 0, 0, hr * 1.2); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(60,20,10,0.18)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, hr * 0.98, hr * 1.12, 0, 0, 7); ctx.fill();
  // hair
  ctx.fillStyle = p.hc;
  if (p.hair === 'comb') { ctx.beginPath(); ctx.ellipse(-20, -hr * 0.92, hr * 0.85, hr * 0.32, -0.15, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(-hr * 0.9, -10, 26, 60, 0, 0, 7); ctx.ellipse(hr * 0.9, -10, 26, 60, 0, 0, 7); ctx.fill(); }
  if (p.hair === 'slick') { ctx.beginPath(); ctx.arc(0, -10, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(0, -hr * 0.6, -hr * 0.98, -20); ctx.fill(); }
  if (p.hair === 'bob') { ctx.beginPath(); ctx.arc(0, -6, hr * 1.12, Math.PI * 0.9, Math.PI * 2.1); ctx.lineTo(hr * 1.1, 60); ctx.quadraticCurveTo(hr * 0.5, -hr * 0.6, -hr * 0.3, -hr * 0.7); ctx.quadraticCurveTo(-hr * 1.0, -hr * 0.2, -hr * 1.1, 60); ctx.fill(); }
  if (p.hair === 'bald') { ctx.beginPath(); ctx.ellipse(-hr * 0.93, 0, 22, 48, 0, 0, 7); ctx.ellipse(hr * 0.93, 0, 22, 48, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-30, -hr * 0.8, 34, 14, -0.3, 0, 7); ctx.fill(); }
  if (p.hair === 'curly') { for (let i = 0; i < 11; i++) { const a = Math.PI + (i / 10) * Math.PI; ctx.beginPath(); ctx.arc(Math.cos(a) * hr * 0.9, Math.sin(a) * hr * 0.98 - 6, 38, 0, 7); ctx.fill(); } }
  if (p.hair === 'wave') { ctx.beginPath(); ctx.arc(0, -8, hr * 1.1, Math.PI * 0.85, Math.PI * 2.15); ctx.quadraticCurveTo(hr * 0.2, -hr * 0.9, -hr * 0.95, 80); ctx.fill(); ctx.beginPath(); ctx.ellipse(hr * 0.95, 80, 40, 110, 0.1, 0, 7); ctx.fill(); }
  if (p.hair === 'short') { ctx.beginPath(); ctx.arc(0, -14, hr * 1.0, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(0, -hr * 0.75, -hr * 0.92, -40); ctx.fill(); }
  if (p.beard) { ctx.fillStyle = p.hc; ctx.beginPath(); ctx.moveTo(-hr * 0.9, 20); ctx.quadraticCurveTo(-hr * 0.8, hr * 1.25, 0, hr * 1.28); ctx.quadraticCurveTo(hr * 0.8, hr * 1.25, hr * 0.9, 20); ctx.quadraticCurveTo(0, hr * 0.62, -hr * 0.9, 20); ctx.fill(); }
  // eyes
  const dizzy = mood === 'dizzy';
  for (const sgn of [-1, 1]) {
    const ex = sgn * 42, ey = -8;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, 28, mood === 'shock' ? 34 : 24, 0, 0, 7); ctx.fill();
    if (dizzy) { ctx.strokeStyle = '#1b1410'; ctx.lineWidth = 4; ctx.beginPath(); for (let a = 0; a < 14; a += 0.3) { const rr = a * 1.7; ctx.lineTo(ex + Math.cos(a + t * 12) * rr, ey + Math.sin(a + t * 12) * rr); } ctx.stroke(); }
    else { ctx.fillStyle = '#1b1410'; ctx.beginPath(); ctx.arc(ex + Math.sin(t * 2 + sgn) * 5, ey + 3, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 4, ey - 2, 4, 0, 7); ctx.fill(); }
    // brows
    ctx.strokeStyle = p.hair === 'bald' ? '#5a4a3a' : p.hc; ctx.lineWidth = 10 * p.brow; ctx.lineCap = 'round';
    const bt = mood === 'angry' ? sgn * 0.35 : mood === 'shock' ? -sgn * 0.15 : sgn * 0.05;
    ctx.beginPath(); ctx.moveTo(ex - 26, ey - 40 + bt * -30); ctx.lineTo(ex + 26, ey - 40 + bt * 30); ctx.stroke();
  }
  if (p.glasses) { ctx.strokeStyle = '#141418'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(-42, -8, 36, 0, 7); ctx.moveTo(78, -8); ctx.arc(42, -8, 36, 0, 7); ctx.moveTo(-6, -10); ctx.lineTo(6, -10); ctx.stroke(); }
  // nose (exaggerated)
  ctx.fillStyle = 'rgba(160,80,50,0.35)'; ctx.beginPath(); ctx.ellipse(6, 38, 26 * p.nose, 34 * p.nose, 0.15, 0, 7); ctx.fill();
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(0, 34, 24 * p.nose, 32 * p.nose, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-6, 22, 7 * p.nose, 0, 7); ctx.fill();
  // mouth
  const open = mood === 'shock' ? 0.9 : clamp(talk * (0.5 + 0.5 * Math.sin(t * 22 + p.nose * 9)));
  ctx.fillStyle = '#5a1e1e'; ctx.beginPath(); ctx.ellipse(0, 86, 40, 6 + open * 30, 0, 0, 7); ctx.fill();
  if (open > 0.2) { ctx.fillStyle = '#fff'; ctx.fillRect(-26, 82 - open * 26, 52, 10); }
  if (mood === 'sweat') { ctx.fillStyle = 'rgba(160,210,255,0.95)'; const d = (t * 1.5) % 1; ctx.beginPath(); ctx.ellipse(hr * 0.85, -40 + d * 90, 12, 18, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------------- Close-up editorial portrait ----------------
export const PORTRAITS = [
  { skin: '#e8b994', shade: '#b97f5a', hair: 'long', hc: '#2e1f16', eye: '#5a3a1e', lip: '#b8605a', top: '#2f6bd8', age: 0.2, female: true },
  { skin: '#c98b62', shade: '#8f5a3a', hair: 'short', hc: '#1b1410', eye: '#3a2614', lip: '#9a5048', top: '#e9eef7', age: 0.3, beard: true, kippah: true },
  { skin: '#f3d2b8', shade: '#c99a80', hair: 'grey', hc: '#d8d2c8', eye: '#4a6a8a', lip: '#b07070', top: '#3b4a63', age: 0.9, glasses: true },
  { skin: '#a86d48', shade: '#73452b', hair: 'scarf', hc: '#1b1410', eye: '#2e1d10', lip: '#8a4440', top: '#d7a43a', age: 0.4, female: true, scarf: '#1d3f8f' },
  { skin: '#d9a07a', shade: '#a26c4c', hair: 'curly', hc: '#3a2a22', eye: '#4a3018', lip: '#a85a50', top: '#274aa3', age: 0.15, female: false },
  { skin: '#f6dcc8', shade: '#d0a68c', hair: 'bun', hc: '#9a6a3a', eye: '#3c6a4a', lip: '#c07070', top: '#ffffff', age: 0.6, female: true },
];

export function portrait(ctx, p, cx, cy, s, { t = 0, look = 0, smile = 0.3, light = 1 } = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const hw = 230, hh = 300;
  // shoulders / clothing
  ctx.fillStyle = p.top; ctx.beginPath(); ctx.moveTo(-520, 900); ctx.quadraticCurveTo(-500, 470, -150, 420); ctx.lineTo(150, 420); ctx.quadraticCurveTo(500, 470, 520, 900); ctx.closePath(); ctx.fill();
  const cg = ctx.createLinearGradient(-500, 0, 500, 0); cg.addColorStop(0, 'rgba(255,255,255,0.18)'); cg.addColorStop(1, 'rgba(0,0,20,0.35)'); ctx.fillStyle = cg; ctx.fill();
  // back hair
  ctx.fillStyle = p.hc;
  if (p.hair === 'long') { ctx.beginPath(); ctx.moveTo(-hw - 40, -60); ctx.quadraticCurveTo(-hw - 90, 380, -hw + 10, 560); ctx.lineTo(hw - 10, 560); ctx.quadraticCurveTo(hw + 90, 380, hw + 40, -60); ctx.closePath(); ctx.fill(); }
  if (p.hair === 'bun') { ctx.beginPath(); ctx.arc(0, -hh - 30, 110, 0, 7); ctx.fill(); }
  if (p.scarf) { ctx.fillStyle = p.scarf; ctx.beginPath(); ctx.ellipse(0, 10, hw + 70, hh + 80, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-hw - 60, 120); ctx.quadraticCurveTo(0, 700, hw + 60, 120); ctx.lineTo(hw + 160, 520); ctx.lineTo(-hw - 160, 520); ctx.fill(); }
  // neck
  ctx.fillStyle = p.skin; rrect(ctx, -85, 150, 170, 300, 60); ctx.fill();
  ctx.fillStyle = 'rgba(80,30,10,0.25)'; rrect(ctx, -85, 150, 170, 110, 60); ctx.fill();
  // ears
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(-hw + 6, 20, 40, 70, 0.1, 0, 7); ctx.ellipse(hw - 6, 20, 40, 70, -0.1, 0, 7); ctx.fill();
  // face shape
  const face = new Path2D();
  face.moveTo(0, -hh); face.bezierCurveTo(hw * 0.75, -hh, hw, -hh * 0.55, hw, -20); face.bezierCurveTo(hw, 150, hw * 0.62, 280, 0, hh);
  face.bezierCurveTo(-hw * 0.62, 280, -hw, 150, -hw, -20); face.bezierCurveTo(-hw, -hh * 0.55, -hw * 0.75, -hh, 0, -hh); face.closePath();
  ctx.fillStyle = p.skin; ctx.fill(face);
  ctx.save(); ctx.clip(face);
  // light from upper-left, shadow on right side
  const sg = ctx.createLinearGradient(-hw, 0, hw, 0); sg.addColorStop(0, 'rgba(255,240,220,0.20)'); sg.addColorStop(0.55, 'rgba(0,0,0,0)'); sg.addColorStop(1, p.shade + 'aa');
  ctx.fillStyle = sg; ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
  const jg = ctx.createLinearGradient(0, 120, 0, hh); jg.addColorStop(0, 'rgba(0,0,0,0)'); jg.addColorStop(1, p.shade + '66'); ctx.fillStyle = jg; ctx.fillRect(-hw, 120, hw * 2, hh);
  // cheeks
  ctx.fillStyle = 'rgba(220,110,100,0.16)'; ctx.beginPath(); ctx.ellipse(-120, 110, 70, 46, 0, 0, 7); ctx.ellipse(120, 110, 70, 46, 0, 0, 7); ctx.fill();
  if (p.age > 0.75) { ctx.strokeStyle = p.shade + '88'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-70, -150); ctx.quadraticCurveTo(0, -165, 70, -150); ctx.moveTo(-60, -125); ctx.quadraticCurveTo(0, -138, 60, -125); ctx.moveTo(-150, 60); ctx.quadraticCurveTo(-165, 25, -150, 0); ctx.stroke(); }
  if (p.beard) { ctx.fillStyle = p.hc; ctx.beginPath(); ctx.moveTo(-hw, 20); ctx.bezierCurveTo(-hw, 260, -90, hh + 30, 0, hh + 30); ctx.bezierCurveTo(90, hh + 30, hw, 260, hw, 20); ctx.bezierCurveTo(hw - 40, 170, 120, 150, 70, 160); ctx.quadraticCurveTo(0, 140, -70, 160); ctx.bezierCurveTo(-120, 150, -hw + 40, 170, -hw, 20); ctx.fill(); }
  ctx.restore();
  // eyes
  const blink = (() => { const b = (t * 0.45 + p.age * 3) % 1; return b > 0.96 ? Math.abs(Math.sin((b - 0.96) / 0.04 * Math.PI)) : 0; })();
  for (const sgn of [-1, 1]) {
    const ex = sgn * 92, ey = -10;
    ctx.save(); ctx.translate(ex, ey);
    const lid = new Path2D(); lid.moveTo(-58, 0); lid.bezierCurveTo(-30, -36, 30, -38, 58, -4); lid.bezierCurveTo(30, 26, -30, 28, -58, 0); lid.closePath();
    ctx.fillStyle = '#f6f2ee'; ctx.fill(lid);
    ctx.save(); ctx.clip(lid);
    const ix = look * 10, ir = 27;
    const ig = ctx.createRadialGradient(ix, 0, 4, ix, 0, ir); ig.addColorStop(0, p.eye); ig.addColorStop(0.75, p.eye); ig.addColorStop(1, '#120c08');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ix, 0, ir, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0706'; ctx.beginPath(); ctx.arc(ix, 0, 11, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(ix - 9, -9, 6.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ix + 8, 7, 2.5, 0, 7); ctx.fill();
    // upper lid shadow + blink
    ctx.fillStyle = p.shade; ctx.fillRect(-70, -60, 140, 26 + blink * 60);
    ctx.restore();
    ctx.strokeStyle = '#1a100c'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-60, 1); ctx.bezierCurveTo(-30, -36 + blink * 30, 30, -38 + blink * 30, 60, -4); ctx.stroke();
    if (p.female) { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sgn * 52, -8); ctx.lineTo(sgn * 66, -20); ctx.stroke(); }
    ctx.strokeStyle = p.shade; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-44, 16); ctx.quadraticCurveTo(0, 30, 44, 14); ctx.stroke();
    // brow
    ctx.fillStyle = p.hair === 'grey' ? '#a8a29a' : p.hc;
    ctx.beginPath(); ctx.moveTo(-60, -52); ctx.quadraticCurveTo(-10, -82, 58 * 1, -62); ctx.quadraticCurveTo(0, -68, -60, -44); ctx.closePath();
    if (sgn === 1) { ctx.save(); ctx.scale(-1, 1); ctx.fill(); ctx.restore(); } else ctx.fill();
    ctx.restore();
  }
  if (p.glasses) { ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 8; rrect(ctx, -170, -60, 150, 105, 34); ctx.stroke(); rrect(ctx, 20, -60, 150, 105, 34); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, -20); ctx.quadraticCurveTo(0, -30, 20, -20); ctx.stroke(); }
  // nose
  ctx.strokeStyle = p.shade + '88'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(30, 40); ctx.bezierCurveTo(40, 80, 52, 100, 36, 116); ctx.stroke();
  ctx.fillStyle = p.shade + '55'; ctx.beginPath(); ctx.ellipse(0, 128, 46, 12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = p.shade + 'cc'; ctx.beginPath(); ctx.ellipse(-24, 118, 13, 7, 0.3, 0, 7); ctx.ellipse(24, 118, 13, 7, -0.3, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-4, 92, 14, 18, 0, 0, 7); ctx.fill();
  // mouth
  const my = 188 - (p.beard ? 0 : 0), sm = smile * 14;
  ctx.fillStyle = p.lip;
  ctx.beginPath(); ctx.moveTo(-62, my); ctx.bezierCurveTo(-30, my - 22, -8, my - 14, 0, my - 10); ctx.bezierCurveTo(8, my - 14, 30, my - 22, 62, my - sm * 0.2); ctx.bezierCurveTo(30, my + 6, -30, my + 6, -62, my); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-58, my + 2); ctx.bezierCurveTo(-30, my + 42, 30, my + 42, 58, my + 2 - sm * 0.2); ctx.bezierCurveTo(30, my + 10, -30, my + 10, -58, my + 2); ctx.fill();
  ctx.strokeStyle = 'rgba(70,20,20,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-62, my - sm * 0.3); ctx.bezierCurveTo(-30, my + 8, 30, my + 8, 62, my - sm * 0.6); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(0, my + 22, 22, 6, 0, 0, 7); ctx.fill();
  // front hair
  ctx.fillStyle = p.hc;
  if (p.hair === 'long' || p.hair === 'bun') { ctx.beginPath(); ctx.moveTo(-hw - 30, 40); ctx.bezierCurveTo(-hw - 70, -hh - 190, hw + 70, -hh - 210, hw + 30, 60); ctx.bezierCurveTo(hw - 10, -140, 60, -230, -30, -210); ctx.bezierCurveTo(-140, -190, -hw + 20, -120, -hw - 30, 40); ctx.fill(); }
  if (p.hair === 'short' || p.hair === 'grey') { ctx.beginPath(); ctx.moveTo(-hw - 10, -20); ctx.bezierCurveTo(-hw - 40, -hh - 150, hw + 40, -hh - 150, hw + 10, -20); ctx.bezierCurveTo(hw - 20, -160, 80, -230, 0, -220); ctx.bezierCurveTo(-90, -230, -hw + 10, -170, -hw - 10, -20); ctx.fill(); }
  if (p.hair === 'curly') { for (let i = 0; i < 16; i++) { const a = Math.PI * 0.95 + (i / 15) * Math.PI * 1.1; ctx.beginPath(); ctx.arc(Math.cos(a) * hw * 0.98, Math.sin(a) * hh * 0.95 - 40, 62, 0, 7); ctx.fill(); } }
  if (p.kippah) { ctx.fillStyle = '#1d3f8f'; ctx.beginPath(); ctx.ellipse(40, -hh + 2, 125, 46, 0.08, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(40, -hh + 2, 116, 38, 0.08, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
  if (p.scarf) { ctx.fillStyle = p.scarf; ctx.beginPath(); ctx.moveTo(-hw - 60, 100); ctx.bezierCurveTo(-hw - 70, -hh - 90, hw + 70, -hh - 90, hw + 60, 100); ctx.bezierCurveTo(hw, -120, 120, -hh + 30, 0, -hh + 30); ctx.bezierCurveTo(-120, -hh + 30, -hw, -120, -hw - 60, 100); ctx.fill(); }
  // hair highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(-40, -40, hh * 0.95, Math.PI * 1.2, Math.PI * 1.45); ctx.stroke();
  // warm rim light on the shadow side
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * light;
  ctx.strokeStyle = 'rgba(255,200,130,0.9)'; ctx.lineWidth = 16; ctx.filter = 'blur(10px)';
  ctx.beginPath(); ctx.moveTo(hw, -40); ctx.bezierCurveTo(hw, 150, hw * 0.62, 280, 0, hh); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
