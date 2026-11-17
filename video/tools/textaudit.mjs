// 字和声音对不对得上：逐 0.2 秒播放页面，记下每段画面上的字第一次看得见的时刻，
// 再到录音的逐字时间里找这段话真正说出来的时刻，列出“字比声音早”的地方。
// 用法：PAGE=self2a.html DATA=EP2 node tools/textaudit.mjs [输出.json]
import fs from 'node:fs'; import { chromium, serve, openPage } from '../lib.mjs';
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, false);
const res = await page.evaluate(async (DATA) => {
  const D = window[DATA], total = window.DURATION;
  const han = s => [...s].filter(c => /[一-鿿0-9]/.test(c)).join('');
  const S = D.chars.map(c => c[0]).join(''), TT = D.chars.map(c => c[1]);
  const stage = document.getElementById('stage'), skip = [document.getElementById('chrome'), document.getElementById('sub')].filter(Boolean);
  const units = [];
  for (const el of stage.querySelectorAll('*')) {
    if (skip.some(s => s.contains(el)) || el.classList.contains('ch')) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    const chs = [...el.children].filter(c => c.classList.contains('ch'));
    const text = chs.length ? el.textContent : own;
    if (han(text).length < 2) continue;
    units.push({ el, text: text.trim().replace(/\s+/g, ' '), ch: chs[0] || null, tvis: null });
  }
  const eff = el => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; if (o < 0.02) return 0; } return o; };
  for (let t = 0; t <= total; t += 0.2) {
    window.seek(t);
    for (const u of units) {
      if (u.tvis !== null) continue;
      let o = eff(u.el); if (o > 0 && u.ch) o *= +getComputedStyle(u.ch).opacity;
      if (o > 0.35) { const r = u.el.getBoundingClientRect(); if (r.width > 0 && r.right > 0 && r.left < 1920 && r.bottom > 0 && r.top < 1080) u.tvis = +t.toFixed(2); }
    }
  }
  // 这段字在录音里什么时候开始说：用字里前几段 3~4 字的小片段去录音里找，取离出现时刻最近的那次
  const say = (U, tv) => {
    let best = null;
    for (const k of [4, 3]) {
      if (U.length < k) continue;
      for (let i = 0; i <= Math.min(U.length - k, 8); i++) {
        const sub = U.slice(i, i + k); let p = -1;
        while ((p = S.indexOf(sub, p + 1)) >= 0) {
          const est = TT[p] - i * 0.22;
          if (est < tv - 25 || est > tv + 45) continue;
          const sc = Math.abs(est - tv) + i * 0.3;
          if (!best || sc < best.sc) best = { sc, t: +est.toFixed(2), sub };
        }
      }
      if (best) break;
    }
    if (!best && U.length <= 3 && U.length >= 2) { let p = -1; while ((p = S.indexOf(U, p + 1)) >= 0) { const est = TT[p]; if (est >= tv - 25 && est <= tv + 45 && (!best || Math.abs(est - tv) < Math.abs(best.t - tv))) best = { t: est, sub: U }; } }
    return best;
  };
  return units.filter(u => u.tvis !== null).map(u => { const U = han(u.text), b = say(U, u.tvis);
    return { text: u.text.slice(0, 40), cls: (u.el.className && u.el.className.baseVal === undefined ? u.el.className : '') .toString().slice(0, 30), tvis: u.tvis, tsay: b ? b.t : null, early: b ? +(b.t - u.tvis).toFixed(2) : null, by: b ? b.sub : '' }; })
    .sort((a, b) => a.tvis - b.tvis);
}, process.env.DATA);
const out = process.argv[2]; if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
const early = res.filter(r => r.early !== null && r.early > 0.8);
console.log(`${process.env.PAGE}: ${res.length} text pieces seen; ${res.filter(r => r.early === null).length} not spoken verbatim; ${early.length} appear >0.8s before being said`);
for (const r of early) console.log(`  appears ${String(r.tvis).padStart(7)}  said ${String(r.tsay).padStart(7)}  early ${String(r.early).padStart(5)}s  [${r.cls}] ${r.text}`);
await browser.close(); server.close();
