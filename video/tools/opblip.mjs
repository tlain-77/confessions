// 元素级的“闪”检查：逐帧播放页面，算出每个做过透明度动画的元素实际有多看得见
// （自己的 opacity × 所有上层的 opacity，visibility:hidden 记 0），找两类问题：
//   blip：看得见的程度突然变了一大截，几帧之内又变回去（一闪）
//   pop ：一帧之内从几乎看不见跳到看得见（或反过来），而且是块头不小的东西（硬切）
// 用法：PAGE=self2a.html node tools/opblip.mjs [起始秒 结束秒]
import { chromium, serve, openPage } from '../lib.mjs';
const a = +(process.argv[2] ?? 0), b = process.argv[3] !== undefined ? +process.argv[3] : null;
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, false);
const res = await page.evaluate(([a, b]) => {
  const tl = window.TL;
  const end = b ?? window.DURATION ?? tl.duration();
  const touches = tw => { const v = tw.vars || {}, s = v.startAt || {}; return 'opacity' in v || 'autoAlpha' in v || 'opacity' in s || 'autoAlpha' in s || 'visibility' in v; };
  const T = new Set();
  for (const tw of tl.getChildren(true, true, false)) if (touches(tw)) for (const el of tw.targets()) if (el instanceof Element) T.add(el);
  // 场景容器本身不算（它亮起来时里面的东西通常还是藏着的，真正看得见的变化会落在里面的元素上）
  const targets = [...T].filter(el => !el.closest('#sub') && !el.classList.contains('scene') && !['asides', 'main', 'backdrops', 'scenes'].includes(el.id));
  const nodes = [], idx = new Map();
  const id = n => { if (!idx.has(n)) { idx.set(n, nodes.length); nodes.push(n); } return idx.get(n); };
  const chains = targets.map(el => { const c = []; for (let e = el; e && e !== document.body; e = e.parentElement) c.push(id(e)); return c; });
  const baseOp = nodes.map(n => { const cs = getComputedStyle(n); return n.style.opacity === '' ? +cs.opacity : 1; });
  const own = new Float32Array(nodes.length);
  const nm = el => { const cls = (el.getAttribute('class') || '').trim().split(/\s+/).slice(0, 3).join('.'); return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : ''); };
  const desc = el => { const sc = el.parentElement && el.parentElement.closest('section, [id]'); return (sc ? nm(sc) + ' > ' : '') + nm(el) + ' «' + (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 18) + '»'; };
  // 这个元素此刻有没有真正画得出来的东西：自己或某个没被藏起来的后代有字、是图形/图片、或者有底色边框；
  // 只是个空容器（里面的字都还藏着）、画线动画还没开始画、或者缩放为 0 的，都算没有
  const SHAPES = new Set(['IMG', 'CANVAS', 'circle', 'ellipse', 'rect', 'line', 'polygon', 'polyline', 'text']);
  const paints = (el, top = false) => {
    const cs = getComputedStyle(el);
    if (!top && (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.01)) return false;
    if (cs.transform && /^matrix\(0, 0, 0, 0/.test(cs.transform)) return false;
    if (el.tagName === 'path') { const o = parseFloat(cs.strokeDashoffset); return !(cs.strokeDasharray !== 'none' && o > 0.98) || (cs.fill !== 'none' && cs.fill !== 'transparent'); }
    if (SHAPES.has(el.tagName)) return true;
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.data.trim())) return true;
    if (cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderBottomWidth) > 0) return true;
    return [...el.children].some(paints);
  };
  const K = 8, H = targets.map(() => []), out = [];
  for (let s = 0; s < a; s += 0.25) window.seek(s);
  const f0 = Math.round(a * 30), f1 = Math.floor(end * 30);
  for (let f = f0; f <= f1; f++) {
    const t = f / 30; window.seek(t);
    for (let i = 0; i < nodes.length; i++) { const st = nodes[i].style; own[i] = (st.visibility === 'hidden' || st.display === 'none') ? 0 : (st.opacity === '' ? baseOp[i] : +st.opacity); }
    for (let j = 0; j < targets.length; j++) {
      const c = chains[j]; let v = 1; for (let q = 0; q < c.length && v > 0; q++) v *= own[c[q]];
      const h = H[j]; h.push(v); if (h.length > K + 2) h.shift();
      const n = h.length; if (n < 3) continue;
      // blip：h[n-1] 回到了 h[p] 附近，中间那几帧偏开了一大截
      for (let k = 1; k <= Math.min(K, n - 2); k++) {
        const p = n - 2 - k, base = h[p], back = h[n - 1];
        if (Math.abs(back - base) > 0.25) continue;
        let dev = 0; for (let q = p + 1; q < n - 1; q++) dev = Math.max(dev, Math.abs(h[q] - (base + (back - base) * (q - p) / (n - 1 - p))));
        if (dev > 0.3 && paints(targets[j], true)) { const r = targets[j].getBoundingClientRect(); out.push({ kind: 'blip', t: +((f - k) / 30).toFixed(3), k, base: +base.toFixed(2), peak: +h.slice(p + 1, n - 1).reduce((m, x) => Math.abs(x - base) > Math.abs(m - base) ? x : m, base).toFixed(2), area: Math.round(r.width * r.height), el: desc(targets[j]) }); h.length = 0; h.push(v); break; }
      }
      // pop：一帧之内跳了 0.6 以上
      if (n >= 2 && Math.abs(h[n - 1] - h[n - 2]) > 0.6 && (h[n - 1] < h[n - 2] || paints(targets[j]))) { const r = targets[j].getBoundingClientRect(); out.push({ kind: 'pop', t: +t.toFixed(3), from: +h[n - 2].toFixed(2), to: +h[n - 1].toFixed(2), area: Math.round(r.width * r.height), el: desc(targets[j]) }); }
    }
  }
  return { n: targets.length, out };
}, [a, b]);
const blips = res.out.filter(o => o.kind === 'blip'), pops = res.out.filter(o => o.kind === 'pop' && o.area > +(process.env.MINAREA ?? 600));
console.log(`${process.env.PAGE}: ${res.n} animated elements; ${blips.length} blips; ${pops.length} hard pops (area > ${process.env.MINAREA ?? 600}px²)`);
for (const o of blips) console.log(`  blip ${o.t.toFixed(3).padStart(8)}s  ${o.k}f  ${o.base} → ${o.peak} → back   area ${o.area}  ${o.el}`);
for (const o of pops) console.log(`  pop  ${o.t.toFixed(3).padStart(8)}s  ${o.from} → ${o.to}   area ${o.area}  ${o.el}`);
await browser.close(); server.close();
