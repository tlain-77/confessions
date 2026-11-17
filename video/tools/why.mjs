// 查“为什么闪”：给出时刻和元素，列出这个元素和它所有上层在这前后 ±1.5 秒里所有改透明度的动画，
// 再逐帧打印它自己的 opacity 和实际看得见的程度。一次加载页面，可以查好几处。
// 用法：PAGE=self2a.html node tools/why.mjs 22.37 '.fam-h' 126.2 '.wq-r.q3' ...
import { chromium, serve, openPage } from '../lib.mjs';
const args = process.argv.slice(2), Q = []; for (let i = 0; i + 1 < args.length; i += 2) Q.push([+args[i], args[i + 1]]);
Q.sort((p, q) => p[0] - q[0]);
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, false);
let pos = 0;
for (const [t, sel] of Q) {
  const out = await page.evaluate(([t, sel, pos]) => {
    const tl = window.TL, el = document.querySelector(sel); if (!el) return 'not found: ' + sel;
    const abs = tw => { let s = tw.startTime(), p = tw.parent; while (p && p !== tl) { s = p.startTime() + s; p = p.parent; } return s; };
    const chain = []; for (let e = el; e && e !== document.body; e = e.parentElement) chain.push(e);
    const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ((e.getAttribute('class') || '') ? '.' + e.getAttribute('class').trim().split(/\s+/).join('.') : '');
    const lines = [];
    for (const tw of tl.getChildren(true, true, false)) {
      const v = tw.vars || {}, s = v.startAt || {};
      if (!('opacity' in v || 'autoAlpha' in v || 'opacity' in s || 'autoAlpha' in s)) continue;
      const tg = tw.targets(), hit = chain.filter(e => tg.includes(e)); if (!hit.length) continue;
      const a = abs(tw), d = tw.duration(); if (a > t + 1.5 || a + d < t - 1.5) continue;
      const fv = k => (k in s ? s[k] + '→' : '') + (k in v ? v[k] : '');
      lines.push(`  ${a.toFixed(3).padStart(8)} +${d.toFixed(2)}  ${hit.map(name).join(',').slice(0, 40).padEnd(40)} ${'opacity' in v || 'opacity' in s ? 'op ' + fv('opacity') : ''}${'autoAlpha' in v || 'autoAlpha' in s ? ' aA ' + fv('autoAlpha') : ''}${v.stagger ? ' stagger ' + v.stagger : ''}${tg.length > 1 ? ' (' + tg.length + ' targets)' : ''}`);
    }
    lines.sort();
    for (let s = pos; s < t - 0.6; s += 0.25) window.seek(s);
    const fr = [];
    for (let f = Math.round((t - 0.4) * 30); f <= Math.round((t + 0.5) * 30); f++) {
      window.seek(f / 30);
      let eff = 1; for (const e of chain) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') { eff = 0; break; } eff *= +cs.opacity; }
      fr.push(`${(f / 30).toFixed(3)}:${(+getComputedStyle(el).opacity).toFixed(2)}/${eff.toFixed(2)}`);
    }
    return `== ${sel} @ ${t}\n` + lines.join('\n') + '\n  own/effective: ' + fr.join(' ');
  }, [t, sel, pos]);
  console.log(out); pos = t + 0.6;
}
await browser.close(); server.close();
