// Load the full composition in Chromium and export runtime-computed cue times
// (prompt-card highlight holds) to audio/cues-runtime.json.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => { window.__timelines = {}; });
await p.goto('file://' + root + '/index.html');
await p.waitForFunction(() => !!(window.__ENG_DEBUG && window.__ENG_DEBUG.ready), null, { timeout: 30000 });
const dbg = await p.evaluate(() => window.__ENG_DEBUG);
const cues = [];
for (const [id, sc] of Object.entries(dbg.scenes)) {
  for (const h of (sc.prompt && sc.prompt.holds) || []) cues.push({ sfx: 'shimmer', t: h, scene: id });
}
fs.writeFileSync(root + '/audio/cues-runtime.json', JSON.stringify({ cues, errors: errs, debug: dbg }, null, 1));
console.log('runtime cues', cues.length, 'errors', errs.length);
await b.close();
