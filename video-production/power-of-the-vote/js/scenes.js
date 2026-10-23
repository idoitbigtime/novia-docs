import { scenesA, makeStudio } from './scenes_a.js';
let scenesB = null;
try { ({ scenesB } = await import('./scenes_b.js')); } catch (e) { console.log('scenes_b not loaded: ' + e.message); }

export function buildScenes(ctx) {
  const credits = (k) => { const c = ctx.manifest.credits[k]; return c ? `צילום: ${c.author} · ${c.license} · Wikimedia Commons` : null; };
  const c = { ...ctx, credits, studio: makeStudio(ctx.G) };
  return [...scenesA(c), ...(scenesB ? scenesB(c) : [])];
}
