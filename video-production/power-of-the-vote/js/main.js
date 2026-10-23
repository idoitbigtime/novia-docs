import { W, H, FPS, Titles, Subs, post, noise1, clamp } from './lib.js';
import * as G from './three3d.js';
import { buildScenes } from './scenes.js';

// Subtitle text: what is actually spoken in the master audio, with the script's punctuation.
const CUES = [
  'אתם יודעים מה קורה', 'כשאתם לא יוצאים להצביע בבחירות?',
  'אתם נותנים למישהו אחר', 'להחליט בשבילכם!',
  'עכשיו, תקשיבו לי טוב.',
  'לא משנה אם אתם ימין...', 'שמאל... מרכז...', 'או שכבר נמאס לכם מכולם!',
  'אתם. חייבים. לצאת. להצביע!',
  'כי אתם מבינים,', 'כשאתם לא מצביעים,', 'הקול שלכם לא עובר למישהו אחר.', 'אבל הכוח שלכם להשפיע...', 'פשוט נעלם.',
  'ומי שכן יוצא להצביע?', 'הקול שלו מקבל יותר משקל!',
  'ואז מה קורה?', 'אנחנו קמים בבוקר שאחרי הבחירות...', 'מסתכלים על התוצאות...', 'וכולם מתחילים להתלונן!',
  'אבל רגע,', 'חשבתם פעם מה היה קורה', 'אם כולם היו יוצאים להצביע?',
  'אולי...', 'רק אולי...', 'היינו מתעוררים', 'למציאות אחרת לגמרי.',
  'אתם רוצים שינוי?', 'אתם רוצים עתיד טוב יותר?', 'אתם רוצים שאנשים', 'שבאמת מייצגים אתכם', 'יקבלו את ההחלטות', 'על החיים שלכם?',
  'אז תפסיקו לתת לאחרים', 'להחליט בשבילכם!',
  'ותקשיבו,', 'לא אכפת לי למי תצביעו.', 'באמת שלא.', 'אכפת לי שתצביעו!',
  'כי ככל שיותר ישראלים', 'יוצאים לקלפיות...', 'ככה התוצאות משקפות טוב יותר', 'את מה שהציבור באמת רוצה.',
  'ועכשיו,', 'אני רוצה לבקש מכם משהו קטן.',
  'תשתפו את הסרטון הזה.', 'תשלחו אותו לחברים שלכם.', 'למשפחה שלכם.', 'ובמיוחד...', 'לאלה שכבר התייאשו', 'ואומרים שאין בשביל מה להצביע.',
  'כי בסוף...', 'אם אתם רוצים להשפיע', 'על מה שיהיה פה מחר...',
  'אתם חייבים להיות חלק', 'מההחלטה היום!',
  'יאללה חברים!', 'בבחירות הקרובות...', 'כולנו יוצאים להצביע!',
];

function buildCues(words) {
  const cues = []; let k = 0;
  for (const text of CUES) {
    const toks = text.split(' ');
    const ws = toks.map((tok) => { const w = words[k++]; if (!w) throw new Error('cue/word mismatch at ' + text); return { w: tok, s: w.s, e: w.e }; });
    cues.push({ text, words: ws, t0: ws[0].s - 0.1, t1: ws[ws.length - 1].e + 0.55 });
  }
  if (k !== words.length) throw new Error(`word count mismatch ${k} vs ${words.length}`);
  for (let i = 0; i < cues.length - 1; i++) cues[i].t1 = Math.min(cues[i].t1, cues[i + 1].t0);
  return cues;
}

function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src; }); }

async function main() {
  const fams = ["900 100px 'Heebo'", "800 100px 'Heebo'", "500 100px 'Heebo'", "300 100px 'Heebo'", "900 100px 'Rubik'", "700 100px 'Rubik'", "400 100px 'Secular One'", "900 100px 'Frank Ruhl Libre'", "700 100px 'Frank Ruhl Libre'", "400 100px 'Suez One'"];
  await Promise.all(fams.map((f) => document.fonts.load(f, 'אבגדהוזחטיכלמנסעפצקרשת ?!.')));
  const timing = await (await fetch('assets/timing.json')).json();
  const manifest = await (await fetch('assets/manifest.json')).json();
  const img = {};
  await Promise.all(Object.entries(manifest.images).map(async ([k, src]) => { img[k] = await loadImg(src); }));
  for (const k in img) if (img[k].decode) await img[k].decode();

  G.init3d(document.getElementById('gl'));
  const bg = document.getElementById('bg').getContext('2d');
  const fx = document.getElementById('fx').getContext('2d');
  const pc = document.getElementById('post').getContext('2d');
  const stage = document.getElementById('stage');
  const ui = document.getElementById('ui');
  const titles = new Titles(document.getElementById('titles'));
  const subs = new Subs(document.getElementById('subs'), buildCues(timing.words));
  const env = timing.env;
  const tag = document.createElement('div'); tag.className = 'tag'; ui.appendChild(tag);
  const credit = document.createElement('div'); credit.className = 'credits'; ui.appendChild(credit);

  const scenes = buildScenes({ img, manifest, env, G });

  window.__duration = manifest.total;
  window.renderFrame = (t) => {
    bg.setTransform(1, 0, 0, 1, 0, 0); fx.setTransform(1, 0, 0, 1, 0, 0);
    bg.globalAlpha = 1; fx.globalAlpha = 1; bg.filter = 'none'; fx.filter = 'none';
    bg.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H);
    titles.begin();
    const S = { t, bg, fx, titles, env: env[Math.min(env.length - 1, Math.round(t * FPS))] || 0, shake: 0, flash: 0, flashColor: '255,255,255', black: 0,
      subsY: 1470, subsOp: 1, vignette: 0.5, grain: 0.05, tag: null, tagPos: [60, 120], credit: null, creditY: 1840, zoom: 1 };
    for (const sc of scenes) if (t >= sc.t0 && t < sc.t1) sc.draw(t, S);
    G.flush();
    titles.end();
    subs.update(t, { y: S.subsY, op: S.subsOp });
    post(pc, t, { vignette: S.vignette, grain: S.grain });
    if (S.flash > 0) { pc.fillStyle = `rgba(${S.flashColor},${clamp(S.flash)})`; pc.fillRect(0, 0, W, H); }
    if (S.black > 0) { pc.fillStyle = `rgba(0,0,0,${clamp(S.black)})`; pc.fillRect(0, 0, W, H); }
    const k = S.shake;
    const sx = k * noise1(t * 37) * 16, sy = k * noise1(t * 41 + 9) * 16, sr = k * noise1(t * 29 + 3) * 0.7;
    stage.style.transform = `translate(${sx}px, ${sy}px) rotate(${sr}deg) scale(${(1 + k * 0.025) * S.zoom})`;
    if (S.tag) { tag.style.display = 'block'; tag.textContent = S.tag; tag.style.left = 'auto'; tag.style.right = S.tagPos[0] + 'px'; tag.style.top = S.tagPos[1] + 'px'; } else tag.style.display = 'none';
    if (S.credit) { credit.style.display = 'block'; credit.textContent = S.credit; credit.style.top = S.creditY + 'px'; } else credit.style.display = 'none';
  };
  window.__ready = true;
}
main().catch((e) => { console.error('INIT FAIL', e.message, e.stack); window.__error = e.message; });
