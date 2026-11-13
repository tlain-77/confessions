// Stills for checking: node shot.mjs 1.5 8.2 ...   (or "every:5" for one frame every 5 s)
import fs from 'node:fs'; import { chromium, serve, openPage } from './lib.mjs';
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, true);
const dur = await page.evaluate('window.DURATION');
let times = process.argv.slice(2).flatMap(a => a.startsWith('every:') ? Array.from({ length: Math.ceil(dur / +a.slice(6)) }, (_, i) => i * +a.slice(6)) : [+a]);
fs.mkdirSync('out/stills', { recursive: true });
let cur = 0;
for (const t of times.sort((a, b) => a - b)) {
  for (; cur < t; cur += 0.25) await page.evaluate(x => window.seek(x), cur);   // walk forward like the real render
  await page.evaluate(x => window.seek(x), t);
  const f = `out/stills/t_${t.toFixed(2).padStart(7, '0')}.jpg`;
  await page.screenshot({ path: f, type: 'jpeg', quality: 90 }); console.log(f);
}
console.log('duration', dur);
await browser.close(); server.close();
