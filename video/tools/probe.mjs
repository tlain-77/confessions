// 逐帧打印某些元素的实际可见度（自身 opacity × 祖先 opacity，visibility:hidden 记 0）
// 用法：PAGE=self2a.html node tools/probe.mjs 起始秒 结束秒 '选择器1' '选择器2' ...
import { chromium, serve, openPage } from '../lib.mjs';
const [from, to, ...sels] = process.argv.slice(2); const a = +from, b = +to;
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, true);
for (let s = 0; s < a; s += 0.25) await page.evaluate(x => window.seek(x), s);
console.log('time    ' + sels.map(s => s.slice(0, 14).padEnd(15)).join(''));
for (let f = Math.round(a * 30); f <= Math.round(b * 30); f++) {
  const t = f / 30;
  const row = await page.evaluate(([t, sels]) => {
    window.seek(t);
    const eff = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; } return o; };
    return sels.map(s => { const el = document.querySelector(s); return el ? eff(el).toFixed(2) : '--'; });
  }, [t, sels]);
  console.log(t.toFixed(3).padStart(8) + '  ' + row.map(v => v.padEnd(15)).join(''));
}
await browser.close(); server.close();
