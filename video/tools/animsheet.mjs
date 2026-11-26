// 一段动画截成总览图：node tools/animsheet.mjs self10 child 0 出图前缀 [格数=12 | 时刻,时刻,…] [bg=画名]
// 用 web/animtest.html（只搭这一段动画，用真的录音时刻）；从这一场开始前一点往后一格一格走（跟真的播放一样），
// 每一格截一张（下面是那一刻的字幕），再用 tools/tile.py 拼成两列的总览图。
import { chromium, serve } from '../lib.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [pg, anim, nth = '0', pre, spec = '12', bgArg = ''] = process.argv.slice(2);
const { server, port } = await serve(); const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage(); page.on('pageerror', e => console.error('PAGE ERROR', e.message));
const bg = bgArg.startsWith('bg=') ? '&bg=' + bgArg.slice(3) : bgArg.startsWith('demo') ? '&demo=1&dur=' + (bgArg.split('=')[1] || 12) : '';
await page.goto(`http://127.0.0.1:${port}/web/animtest.html?page=${pg}&anim=${anim}&n=${nth}${bg}`);
await page.waitForFunction('window.READY === true', null, { timeout: 60000 });
const [t0, t1] = await page.evaluate(() => window.RANGE);
const times = spec.includes(',') || spec.includes('.') ? spec.split(',').map(Number) : Array.from({ length: +spec }, (_, i) => t0 + .3 + (t1 - t0 - .5) * i / (+spec - 1));
let cur = Math.max(0, t0 - 1.5); const files = [];
for (const t of times.sort((a, b) => a - b)) {
  for (; cur < t; cur += .2) await page.evaluate(x => window.seek(x), cur);
  await page.evaluate(x => window.seek(x), t); cur = t;
  const f = `${pre}_${t.toFixed(2)}.jpg`;
  const clip = process.env.ZOOM ? await page.evaluate(z => { const [x, y, w, h] = z.split(',').map(Number); const r = document.querySelector('#a svg').getBoundingClientRect(), k = r.width / 1000; return { x: r.left + x * k, y: r.top + y * k, width: w * k, height: h * k }; }, process.env.ZOOM) : undefined;
  await page.screenshot({ path: f, type: 'jpeg', quality: 82, clip }); files.push(f);
}
console.log(`${anim}: ${t0.toFixed(2)}–${t1.toFixed(2)} s, ${files.length} 格`);
await browser.close(); server.close();
execFileSync('python3', [new URL('./tile.py', import.meta.url).pathname, pre + '_sheet', ...files], { stdio: 'inherit' });
for (const f of files) fs.unlinkSync(f);
