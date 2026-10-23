// usage: node preview.mjs out.jpg t1 t2 ...   → contact sheet of frames (each 270x480)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { serve } from './serve.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [, , out, ...ts] = process.argv;
const srv = await serve(process.cwd());
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', (m) => console.log('[page]', m.text())); p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
await p.waitForFunction(() => window.__ready === true || window.__error, null, { timeout: 120000 });
const err = await p.evaluate(() => window.__error); if (err) { console.log('INIT ERROR', err); process.exit(1); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pv-'));
const files = [];
for (const [i, t] of ts.entries()) {
  const t0 = Date.now();
  await p.evaluate((t) => window.renderFrame(+t), t);
  const f = `${dir}/${String(i).padStart(3, '0')}.jpg`; await p.screenshot({ path: f, type: 'jpeg', quality: 85 }); files.push(f);
  console.log(`t=${t} ${Date.now() - t0}ms`);
}
await b.close(); srv.close();
const cols = Math.min(6, files.length);
const label = (i) => `[${i}:v]scale=360:640,drawtext=text='${ts[i]}':x=8:y=8:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6`;
const graph = files.length === 1 ? label(0)
  : files.map((_, i) => `${label(i)}[v${i}]`).join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') +
    `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', graph, out]);
