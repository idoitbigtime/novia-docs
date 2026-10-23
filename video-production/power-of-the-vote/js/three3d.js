// 3D sets rendered on demand (deterministic: everything is a function of t).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { W, H, rng, clamp, lerp, E, drawFlag, rrect } from './lib.js';

export let renderer, envTex, cubeEnv;
const queue = [];
export function init3d(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  const pm = new THREE.PMREMGenerator(renderer);
  envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const rt = new THREE.WebGLCubeRenderTarget(128); rt.texture.type = THREE.HalfFloatType;
  const cc = new THREE.CubeCamera(0.1, 100, rt); cc.update(renderer, new RoomEnvironment()); cubeEnv = rt.texture;
}
// Cheap glossy material (Phong + cube reflection) for large on-screen surfaces
export function gloss(color, { spec = 0x8899bb, shin = 70, refl = 0.22, emissive = 0x000000 } = {}) {
  return new THREE.MeshPhongMaterial({ color, specular: spec, shininess: shin, envMap: cubeEnv, reflectivity: refl, combine: THREE.MixOperation, emissive });
}
export function request(scene, camera) { queue.push([scene, camera]); }
export function flush() {
  renderer.setClearColor(0x000000, 0); renderer.clear(true, true, true);
  renderer.autoClear = false;
  for (const [s, c] of queue) { renderer.clearDepth(); renderer.render(s, c); }
  queue.length = 0;
}
export function cam(fov = 35) { return new THREE.PerspectiveCamera(fov, W / H, 0.05, 400); }

// ---------- canvas textures ----------
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const TEX = {};
function textures() {
  if (TEX.flag) return TEX;
  TEX.flag = canvasTex(1100, 800, (g, w, h) => { drawFlag(g, 0, 0, w, h); const r = rng(4); g.globalAlpha = 0.05; for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? '#000' : '#fff'; g.fillRect(r() * w, r() * h, 2, 2); } });
  TEX.label = canvasTex(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.font = "900 230px 'Heebo'"; g.fillText('קלפי', w / 2, h * 0.46);
    g.fillRect(w * 0.22, h * 0.78, w * 0.56, 10);
  });
  TEX.envelope = canvasTex(620, 420, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#a9d0f5'); gr.addColorStop(1, '#7fb2e8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(20,60,120,0.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.55); g.lineTo(w, 0); g.stroke();
    g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.42, h * 0.48); g.moveTo(w, h); g.lineTo(w * 0.58, h * 0.48); g.stroke();
    const r = rng(9); g.globalAlpha = 0.06; for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? '#003' : '#fff'; g.fillRect(r() * w, r() * h, 2, 2); }
  });
  TEX.slip = canvasTex(300, 420, (g, w, h) => {
    g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9ced8'; rrect(g, w * 0.2, h * 0.16, w * 0.6, h * 0.28, 16); g.fill();
    g.fillStyle = '#d9dde5'; for (let i = 0; i < 3; i++) g.fillRect(w * 0.18, h * (0.56 + i * 0.09), w * (0.64 - i * 0.12), 12);
    g.strokeStyle = '#e3e6ec'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  });
  TEX.glow = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  TEX.shadow = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  TEX.cone = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  return TEX;
}

// ---------- reusable objects ----------
export function floorTex() {
  if (TEX.floor) return TEX.floor;
  TEX.floor = canvasTex(1024, 1024, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(70,100,170,1)'); gr.addColorStop(0.035, 'rgba(40,64,128,1)'); gr.addColorStop(0.12, 'rgba(16,30,70,0.95)'); gr.addColorStop(0.45, 'rgba(8,16,42,0.6)'); gr.addColorStop(1, 'rgba(4,8,24,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,170,255,0.06)'; g.lineWidth = 2; for (let i = 1; i < 24; i++) { g.beginPath(); g.arc(w / 2, h / 2, i * 22, 0, 7); g.stroke(); }
  });
  return TEX.floor;
}
export function ballotBox() {
  const T = textures();
  const g = new THREE.Group();
  const blue = gloss(0x1d4fb8, { spec: 0x5577bb, shin: 60, refl: 0.18 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.1, 1.0, 4, 0.035), blue); body.position.y = 0.55; g.add(body);
  const lidM = gloss(0x163f96, { spec: 0x5577bb, shin: 70, refl: 0.2 });
  const lid = new THREE.Mesh(new RoundedBoxGeometry(1.36, 0.07, 1.06, 3, 0.025), lidM); lid.position.y = 1.12; g.add(lid);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.02, 0.07), new THREE.MeshBasicMaterial({ color: 0x02040a })); slot.position.y = 1.152; g.add(slot);
  const rimM = gloss(0xdfe6f2, { spec: 0xffffff, shin: 90, refl: 0.6 });
  for (const [x, z, w, d] of [[0, 0.055, 0.74, 0.025], [0, -0.055, 0.74, 0.025], [0.36, 0, 0.025, 0.13], [-0.36, 0, 0.025, 0.13]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), rimM); m.position.set(x, 1.165, z); g.add(m); }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: T.label, transparent: true, toneMapped: false })); label.position.set(0, 0.62, 0.502); g.add(label);
  const seal = new THREE.Mesh(new THREE.BoxGeometry(1.31, 0.05, 1.01), gloss(0xffffff, { spec: 0x444444, shin: 20, refl: 0.05 })); seal.position.y = 0.2; g.add(seal);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), new THREE.MeshBasicMaterial({ map: T.shadow, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.002; g.add(sh);
  g.userData = { slotY: 1.16 };
  return g;
}
export function envelope() {
  const T = textures();
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.012), [
    new THREE.MeshStandardMaterial({ color: 0x8fbdf0 }), new THREE.MeshStandardMaterial({ color: 0x8fbdf0 }),
    new THREE.MeshStandardMaterial({ color: 0x8fbdf0 }), new THREE.MeshStandardMaterial({ color: 0x8fbdf0 }),
    new THREE.MeshPhongMaterial({ map: T.envelope, specular: 0x222222, shininess: 10 }),
    new THREE.MeshPhongMaterial({ map: T.envelope, specular: 0x222222, shininess: 10 })]);
  return m;
}
export function slips(n) {
  const T = textures();
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.42), new THREE.MeshPhongMaterial({ map: T.slip, side: THREE.DoubleSide, specular: 0x333333, shininess: 15 }), n);
  m.frustumCulled = false; return m;
}
export function glowSprite(color = 0xffffff, scale = 1, opacity = 1) {
  const T = textures();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  s.scale.setScalar(scale); return s;
}
export function lightCone(color = 0xcfe4ff, h = 6, r = 1.6, opacity = 0.35) {
  const T = textures();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, r, h, 48, 1, true), new THREE.MeshBasicMaterial({ map: T.cone, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  m.geometry.translate(0, -h / 2, 0); return m;
}

// Cloth-like waving flag on a pole. update(t, strength)
export function flag(w = 2.2, h = 1.6) {
  const T = textures();
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(w, h, 72, 52); geo.translate(w / 2, 0, 0);
  const base = geo.attributes.position.array.slice();
  const mat = new THREE.MeshPhongMaterial({ map: T.flag, side: THREE.DoubleSide, specular: 0x222222, shininess: 12 });
  const cloth = new THREE.Mesh(geo, mat); g.add(cloth);
  const poleM = new THREE.MeshPhongMaterial({ color: 0xcfd6e2, specular: 0xffffff, shininess: 100, envMap: cubeEnv, reflectivity: 0.6, combine: THREE.MultiplyOperation });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, h * 3.2, 16), poleM); pole.position.set(-0.03, -h * 1.0, 0); g.add(pole);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 16), new THREE.MeshPhongMaterial({ color: 0xc89a2a, specular: 0xffe08a, shininess: 90, envMap: cubeEnv, reflectivity: 0.5, combine: THREE.MultiplyOperation })); fin.position.set(-0.03, h * 0.6, 0); g.add(fin);
  g.userData.update = (t, k = 1) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i], y = base[i + 1], u = x / w;
      const amp = (0.05 + 0.22 * u) * k;
      const z = amp * (Math.sin(x * 3.1 - t * 5.2 + y * 0.9) + 0.45 * Math.sin(x * 6.3 - t * 8.1 + y * 2.3) + 0.25 * Math.sin(y * 4.0 + t * 3.3 + x * 2.0));
      p[i] = x - Math.abs(z) * 0.18 * u; p[i + 1] = y - u * u * 0.08 * k + 0.03 * k * u * Math.sin(t * 3.7 + x * 2.2); p[i + 2] = z;
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  };
  g.userData.cloth = cloth;
  return g;
}

// Balance scale. update(angle)
export function scales() {
  const g = new THREE.Group();
  const gold = new THREE.MeshPhongMaterial({ color: 0x8a6418, specular: 0xffd77a, shininess: 90, envMap: cubeEnv, reflectivity: 0.55, combine: THREE.MultiplyOperation, emissive: 0x2a1a00 });
  const silver = new THREE.MeshPhongMaterial({ color: 0x9aa4b4, specular: 0xffffff, shininess: 110, envMap: cubeEnv, reflectivity: 0.7, combine: THREE.MultiplyOperation });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.16, 48), silver); base.position.y = 0.08; g.add(base);
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.18, 48), gold); base2.position.y = 0.25; g.add(base2);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.3, 24), gold); col.position.y = 1.45; g.add(col);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), silver); top.position.y = 2.66; g.add(top);
  const beam = new THREE.Group(); beam.position.y = 2.55; g.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.07, 0.07), gold); beam.add(bar);
  const pans = [];
  for (const s of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), silver); knob.position.x = s * 1.5; beam.add(knob);
    const hang = new THREE.Group(); g.add(hang);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 6), silver);
      const ex = Math.cos(a) * 0.42, ez = Math.sin(a) * 0.42;
      // orient chain from (0,0,0) to (ex,-1,ez)
      const dir = new THREE.Vector3(ex, -1.0, ez); const len = dir.length(); dir.normalize();
      ch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); ch.scale.y = len; ch.position.copy(dir.clone().multiplyScalar(len / 2));
      hang.add(ch);
    }
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(0.02 + Math.sin(u * Math.PI / 2) * 0.48, -Math.cos(u * Math.PI / 2) * 0.13)); }
    const pan = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), silver); pan.position.y = -1.0; hang.add(pan);
    hang.userData.s = s; pans.push(hang);
  }
  g.userData.update = (ang) => {
    beam.rotation.z = ang;
    for (const h of pans) { const s = h.userData.s; h.position.set(Math.cos(ang) * 1.5 * s, 2.55 + Math.sin(ang) * 1.5 * s, 0); }
  };
  g.userData.pans = pans;
  g.userData.update(0);
  return g;
}

// Stylized Knesset: long low block, deep roof slab, rhythmic square pillars.
export function knesset() {
  const g = new THREE.Group();
  const stone = new THREE.MeshLambertMaterial({ color: 0xe2d6bf });
  const glass = gloss(0x0b1a33, { spec: 0x88aaff, shin: 80, refl: 0.35, emissive: 0x05153a });
  const Wd = 6.4, D = 3.4, Hh = 1.25;
  const core = new THREE.Mesh(new THREE.BoxGeometry(Wd - 0.6, Hh, D - 0.6), glass); core.position.y = Hh / 2 + 0.3; g.add(core);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(Wd + 0.3, 0.2, D + 0.3), stone); roof.position.y = 0.3 + Hh + 0.1; g.add(roof);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(Wd + 0.8, 0.3, D + 0.8), stone); plinth.position.y = 0.15; g.add(plinth);
  const pg = new THREE.BoxGeometry(0.16, Hh, 0.16);
  const nx = 17, nz = 9;
  for (let i = 0; i < nx; i++) for (const z of [-D / 2, D / 2]) { const m = new THREE.Mesh(pg, stone); m.position.set(-Wd / 2 + (i / (nx - 1)) * Wd, 0.3 + Hh / 2, z); g.add(m); }
  for (let i = 1; i < nz - 1; i++) for (const x of [-Wd / 2, Wd / 2]) { const m = new THREE.Mesh(pg, stone); m.position.set(x, 0.3 + Hh / 2, -D / 2 + (i / (nz - 1)) * D); g.add(m); }
  // steps / plaza
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(Wd + 4, 0.06, 3), stone); plaza.position.set(0, 0.03, D / 2 + 1.9); g.add(plaza);
  return g;
}
export function samplePoints(object, n, seed = 1) {
  const pts = new Float32Array(n * 3); const meshes = []; object.updateMatrixWorld(true);
  object.traverse((o) => { if (o.isMesh && !o.material.transparent) meshes.push(o); });
  // area-weighted pick of meshes
  const areas = meshes.map((m) => { const b = new THREE.Box3().setFromObject(m), s = new THREE.Vector3(); b.getSize(s); return 2 * (s.x * s.y + s.y * s.z + s.x * s.z) + 1e-4; });
  const tot = areas.reduce((a, b) => a + b, 0); const r = rng(seed);
  const samplers = meshes.map((m) => new MeshSurfaceSampler(m).setRandomGenerator(r).build());
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    let x = r() * tot, k = 0; while (k < areas.length - 1 && x > areas[k]) { x -= areas[k]; k++; }
    samplers[k].sample(v); v.applyMatrix4(meshes[k].matrixWorld); pts[i * 3] = v.x; pts[i * 3 + 1] = v.y; pts[i * 3 + 2] = v.z;
  }
  return pts;
}

// Soft additive point cloud with per-point color/alpha/size
export class Cloud {
  constructor(n) {
    this.n = n;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3).fill(1); this.alp = new Float32Array(n).fill(1); this.siz = new Float32Array(n).fill(1);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alp, 1)); geo.setAttribute('size', new THREE.BufferAttribute(this.siz, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { scale: { value: H * 0.5 }, gain: { value: 1.35 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `attribute float alpha; attribute float size; varying vec3 vC; varying float vA; uniform float scale;
        void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = max(1.0, size * scale / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; uniform float gain;
        void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); float a = smoothstep(0.5, 0.0, r); a = a*a*(0.6+0.4*smoothstep(0.25,0.0,r)); gl_FragColor = vec4(vC * gain, a * vA); }`,
    });
    this.points = new THREE.Points(geo, this.mat); this.points.frustumCulled = false; this.geo = geo;
  }
  commit() { for (const k of ['position', 'color', 'alpha', 'size']) this.geo.attributes[k].needsUpdate = true; }
}

// Sample opaque pixels of a 2D drawing → normalized points (x right, y up), centered.
export function sampleDrawing(w, h, draw, step = 4, jitter = 0.5, seed = 2) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const d = g.getImageData(0, 0, w, h).data, out = [], r = rng(seed);
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
    const i = (y * w + x) * 4; if (d[i + 3] > 128) out.push([(x + (r() - 0.5) * step * jitter - w / 2) / h, -(y + (r() - 0.5) * step * jitter - h / 2) / h, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]);
  }
  return out;
}

// Neon frame corridor
export function corridor(n = 26, spacing = 1.6) {
  const g = new THREE.Group(); const frames = [];
  for (let i = 0; i < n; i++) {
    const f = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0xffd76a : 0x6ec8ff, transparent: true, toneMapped: false });
    const w = 2.0, h = 3.2, th = 0.035;
    for (const [x, y, sw, sh] of [[0, h / 2, w, th], [0, -h / 2, w, th], [w / 2, 0, th, h], [-w / 2, 0, th, h]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, th), m); b.position.set(x, y, 0); f.add(b); }
    f.position.z = -i * spacing; f.userData.m = m; g.add(f); frames.push(f);
  }
  g.userData.frames = frames; return g;
}

// Billboard of a 2D-drawn character
export function billboard(draw, w = 256, h = 512, scale = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(scale * (w / h), scale, 1); s.center.set(0.5, 0.0);
  return s;
}
export { THREE };
