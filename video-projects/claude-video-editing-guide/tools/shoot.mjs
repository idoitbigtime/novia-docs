// Quick frame check without a full render: load a composition, seek the GSAP timeline,
// screenshot. usage: node tools/shoot.mjs <file.html> <outdir> <t1> [t2 ...]
// Prints page errors and the engine debug info. Times are composition times (scene variants start at 0).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
const [, , file, outdir, ...times] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
const html = fs.readFileSync(file, 'utf8');
const W = +(/data-width="(\d+)"/.exec(html) || [0, 1080])[1], H = +(/data-height="(\d+)"/.exec(html) || [0, 1920])[1];
console.log('launching', W, H);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.addInitScript(() => { window.__timelines = {}; });
console.log('goto');
await p.goto('file://' + path.resolve(file), { waitUntil: 'domcontentloaded' });
console.log('loaded');
try {
  await p.waitForFunction(() => !!(window.__ENG_DEBUG && window.__ENG_DEBUG.ready && window.__timelines.main), null, { timeout: 20000 });
} catch (e) {
  console.log('TIMELINE NOT READY', JSON.stringify(errs));
  await b.close();
  process.exit(1);
}
for (const t of times) {
  await p.evaluate((t) => { window.__timelines.main.seek(+t, false); }, t);
  await p.waitForTimeout(60);
  await p.screenshot({ path: path.join(outdir, `t_${(+t).toFixed(2)}.png`) });
}
console.log('DEBUG', JSON.stringify(await p.evaluate(() => window.__ENG_DEBUG)).slice(0, 1500));
console.log('ERRORS', errs.length ? JSON.stringify(errs, null, 1) : 'none');
await b.close();
