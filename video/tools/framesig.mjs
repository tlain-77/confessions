// 每一帧“看得见的画面状态”的指纹：逐帧播放页面，只走看得见的元素（opacity>0、没被 visibility/display 藏起来），
// 把它们的 style、SVG 属性、class 和文字揉成一个 32 位哈希。两版页面逐帧比指纹，就知道改动影响了哪些帧——
// 只重渲这些帧，其余直接用旧视频。背景画布由 window.BG 的几个数决定，也一起算进指纹；颗粒和字幕是时间的固定函数，代码没改就不用比。
// 用法：PAGE=self2a.html node tools/framesig.mjs 输出.bin [起始秒 结束秒]
import fs from 'node:fs'; import { chromium, serve, openPage } from '../lib.mjs';
const out = process.argv[2], a = +(process.argv[3] ?? 0), b = process.argv[4] !== undefined ? +process.argv[4] : null;
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, false);
const sig = await page.evaluate(([a, b]) => {
  const end = b ?? window.DURATION ?? window.TL.duration();
  const stage = document.getElementById('stage');
  const cssOp = new Map(); for (const el of stage.querySelectorAll('*')) if (!el.style || el.style.opacity === '') cssOp.set(el, +getComputedStyle(el).opacity);
  let h;
  const mix = s => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } };
  const walk = el => {
    const st = el.style;
    if (st.visibility === 'hidden' || st.display === 'none') return;
    const op = st.opacity !== '' ? +st.opacity : (cssOp.get(el) ?? 1);
    if (!(op > 0.002)) return;
    mix(el.tagName); mix(el.getAttribute('class') || ''); mix(el.getAttribute('style') || '');
    if (el instanceof SVGElement) for (const at of el.attributes) if (at.name !== 'style' && at.name !== 'class') { mix(at.name); mix(at.value); }
    for (const n of el.childNodes) { if (n.nodeType === 3) mix(n.data); else if (n.nodeType === 1) walk(n); }
  };
  for (let s = 0; s < a; s += 0.25) window.seek(s);
  const f0 = Math.round(a * 30), f1 = Math.floor(end * 30), res = [];
  for (let f = f0; f <= f1; f++) { window.seek(f / 30); h = 2166136261; walk(stage); if (window.BG) for (const k of Object.keys(window.BG)) if (typeof window.BG[k] === 'number') mix(k + window.BG[k].toFixed(5)); res.push(h >>> 0); }
  return { f0, res };
}, [a, b]);
fs.writeFileSync(out, JSON.stringify(sig));
console.log(`${process.env.PAGE}: ${sig.res.length} frame signatures from frame ${sig.f0} → ${out}`);
await browser.close(); server.close();
