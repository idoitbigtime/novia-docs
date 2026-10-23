// Deterministic frame renderer: node render.mjs <framesDir> [workers=3] [fps=30] [from=0] [to=end]
// Each frame is rendered by window.renderFrame(t) and captured as a high-quality JPEG; resumable.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { serve } from './serve.mjs';
import fs from 'node:fs';

const [, , dir, workersArg = '3', fpsArg = '30', fromArg, toArg] = process.argv;
const FPS = +fpsArg, WORKERS = +workersArg, CHUNK = 60;
fs.mkdirSync(dir, { recursive: true });
const srv = await serve(process.cwd());
const url = `http://127.0.0.1:${srv.address().port}/index.html`;
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas'];

const probe = await chromium.launch({ args });
const pp = await probe.newPage({ viewport: { width: 1080, height: 1920 } });
await pp.goto(url); await pp.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const total = Math.round((await pp.evaluate(() => window.__duration)) * FPS);
await probe.close();
const from = fromArg ? +fromArg : 0, to = toArg ? +toArg : total;
const chunks = []; for (let s = from; s < to; s += CHUNK) chunks.push([s, Math.min(to, s + CHUNK)]);
let done = 0, next = 0; const t0 = Date.now();
const name = (f) => `${dir}/f_${String(f).padStart(5, '0')}.jpg`;

async function worker(id) {
  const b = await chromium.launch({ args });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log(`[w${id} err]`, e.message));
  await p.goto(url); await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  while (next < chunks.length) {
    const [a, z] = chunks[next++];
    for (let f = a; f < z; f++) {
      if (fs.existsSync(name(f))) { done++; continue; }
      await p.evaluate((t) => window.renderFrame(t), f / FPS);
      await p.screenshot({ path: name(f) + '.tmp', type: 'jpeg', quality: 95 });
      fs.renameSync(name(f) + '.tmp', name(f));
      done++;
    }
    const el = (Date.now() - t0) / 1000;
    console.log(`[w${id}] chunk ${a}-${z} done | ${done}/${to - from} frames | ${el.toFixed(0)}s elapsed | eta ${((el / done) * (to - from - done)).toFixed(0)}s`);
  }
  await b.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
srv.close();
console.log('RENDER COMPLETE', done, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
