// 图解：用线条图标（Tabler Icons，MIT 许可，node_modules/@tabler/icons）拼出一张会动的小图，配合 lec.js 的 { ill: ... } 使用。
// 图标用金色渐变描出来（一笔一笔画出来），底下垫一层柔光；每个图标在“说到它”的时候出来，下面一行小字。
// 写法：
//   { ill: 'pair', items: [A, B], rel: '→' | '≠' | '=' | '+' | '×' | 'vs' | '⇄', relAt }     两样东西和它们的关系
//   { ill: 'row',  items: [A, B, C, ...] }                                                     一排（2—5 个）
//   { ill: 'flow', items: [A, B, C, ...] }                                                     一排，中间有箭头（一步一步）
//   { ill: 'vs',   items: [A, B] }                                                             一小一大（各自给 s）
//   { ill: 'hero', items: [A] }                                                                一个大图标，后面有光
//   每一项 A = ['图标名', '标签', 时刻, { c: 'g'|'c'|'b'|'p', s: 大小, sub: '小字', sat: 小字时刻, x: 划掉的时刻, dim: 变淡的时刻, glow: 发光的时刻, bare: 1 不要圆框 }]
//   pair 还可以给 flow: '图标名'（比如 'music'：一串小音符从左边流到右边）
//   还可以给 h（图的高度，默认 400）、w（显示宽度，默认 1100 像素）
(function () {
  const NS = 'http://www.w3.org/2000/svg'; let UID = 0, ICONS = null;
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const COL = { g: [['0', '#fff3cf'], ['0.45', '#ecc77f'], ['1', '#b8873c']], c: [['0', '#ffd2bd'], ['1', '#e0805a']], b: [['0', '#e6f4ff'], ['1', '#7fb2dc']], p: [['0', '#ffffff'], ['1', '#d8c7a5']] };
  const SOLID = { g: '#e2bd76', c: '#eba27c', b: '#9cc7e8', p: '#efe6d2' };
  window.ILL_LOAD = async () => { if (!ICONS) ICONS = await (await fetch('/node_modules/@tabler/icons/tabler-nodes-outline.json')).json(); };
  window.ILL_HAS = name => !!(ICONS && ICONS[name]);
  window.ILL_NODES = name => ICONS && ICONS[name];                                   // anim.js 里的动画也用这些图标

  window.ILL_BUILD = (spec, el, AT) => {
    const q = [], tl = new Proxy({}, { get: (_, k) => (...a) => { q.push([k, a]); return tl; } });
    const uid = ++UID, H = spec.h || 400;
    el.classList.add('la', 'il'); if (spec.w) el.style.setProperty('--aw', spec.w + 'px');
    const svg = mk('svg', { viewBox: `0 0 1000 ${H}`, width: 1000, height: H }, el);
    const defs = mk('defs', {}, svg);
    const soft = mk('filter', { id: 'is' + uid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); mk('feGaussianBlur', { stdDeviation: 0.9 }, soft);
    const halo = mk('radialGradient', { id: 'ih' + uid }, defs); mk('stop', { offset: 0, 'stop-color': '#f3d48e', 'stop-opacity': 0.55 }, halo); mk('stop', { offset: 1, 'stop-color': '#f3d48e', 'stop-opacity': 0 }, halo);
    const disc = mk('radialGradient', { id: 'id' + uid }, defs); mk('stop', { offset: 0, 'stop-color': '#1c1710', 'stop-opacity': 0.82 }, disc); mk('stop', { offset: 0.8, 'stop-color': '#0d0b08', 'stop-opacity': 0.78 }, disc); mk('stop', { offset: 1, 'stop-color': '#0d0b08', 'stop-opacity': 0.2 }, disc);
    const ray = mk('radialGradient', { id: 'ir' + uid, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: 1 }, defs); mk('stop', { offset: 0, 'stop-color': '#f6dc9c', 'stop-opacity': 0.5 }, ray); mk('stop', { offset: 1, 'stop-color': '#f6dc9c', 'stop-opacity': 0 }, ray);
    for (const k in COL) { const g = mk('linearGradient', { id: `ig${k}${uid}`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 24, y2: 24 }, defs); COL[k].forEach(([o, c]) => mk('stop', { offset: o, 'stop-color': c }, g)); }
    const DRAW = (els, at, d = 0.75) => { gsap.set(els, { strokeDashoffset: 1 }); tl.to(els, { strokeDashoffset: 0, duration: d, ease: 'power2.inOut', stagger: Math.min(0.08, 0.3 / Math.max(1, els.length)) }, at); };
    const SHOW = (e, at, d = 0.6, y = 10) => { gsap.set(e, { opacity: 0 }); tl.fromTo(e, { opacity: 0, y }, { opacity: 1, y: 0, duration: d, ease: 'power2.out', immediateRender: false }, at); };
    const em = t => [...String(t)].reduce((w, ch) => w + (/[\x00-\x7f]/.test(ch) ? 0.56 : 1), 0);   // 多少个字宽
    const fit = (t, fs, room, ls) => Math.max(22, Math.min(fs, room / (em(t) * (1 + ls))));
    const text = (x, y, t, o = {}) => { const e = mk('text', { x, y, 'text-anchor': 'middle', fill: o.c || '#efe6d2', 'font-size': o.s || 34, 'font-family': o.font || 'Noto Serif SC', 'font-weight': o.wt || 700, 'letter-spacing': o.ls || '0.16em', stroke: 'rgba(10,8,6,.6)', 'stroke-width': 5, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, svg); e.textContent = t; return e; };   // 描一圈暗边：压在亮的画上也看得清
    // 一个图标：放在 (x, y)（中心），边长 s
    const icon = (name, x, y, s, c = 'g', parent = svg) => {
      const nodes = ICONS && ICONS[name]; if (!nodes) throw new Error('没有这个图标：' + name);
      const k = s / 24, sw = Math.max(0.45, 3.4 / k);
      const g = mk('g', { transform: `translate(${x - s / 2},${y - s / 2}) scale(${k})` }, parent);
      const glowG = mk('g', { filter: `url(#is${uid})`, opacity: 0.55 }, g), lineG = mk('g', {}, g), shapes = [];
      for (const [tag, at] of nodes) {
        if (at.stroke === 'none') continue;
        const base = { ...at, fill: at.fill && at.fill !== 'none' ? SOLID[c] : 'none', stroke: SOLID[c], 'stroke-width': sw * 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 };
        shapes.push(mk(tag, base, glowG));
        shapes.push(mk(tag, { ...base, stroke: `url(#ig${c}${uid})`, 'stroke-width': sw }, lineG));
      }
      return { g, shapes };
    };
    const items = (spec.items || []).map(it => Array.isArray(it) ? { i: it[0], lab: it[1], at: it[2], ...(it[3] || {}) } : it);
    const n = items.length, kind = spec.ill;
    const cy = spec.cy ?? (H / 2 - 36);
    // 一排的间距：标签长就拉开一点（但两头的圆框不能出画），再放不下就缩字
    const s0 = it => it.s || (kind === 'hero' ? 190 : n >= 5 ? 100 : n === 4 ? 130 : kind === 'pair' || kind === 'vs' ? 165 : 145);
    let sp = n > 1 ? Math.min(260, 820 / (n - 1)) : 0;
    if (n > 1 && kind !== 'pair' && kind !== 'vs') {
      const need = Math.max(...items.map(it => Math.max(it.lab ? em(it.lab) * 1.16 * 34 : 0, it.sub ? em(it.sub) * 1.06 * 25 : 0))) + 26;
      const cap = (984 - 2 * Math.max(...items.map(it => s0(it) * 0.74 + 12))) / (n - 1);
      sp = Math.max(sp, Math.min(need, cap));
    }
    const room = kind === 'pair' || kind === 'vs' ? 456 : kind === 'hero' ? 900 : sp - 40;   // 一排的标签之间至少留 40 的空
    const xs = kind === 'pair' || kind === 'vs' ? [260, 740] : kind === 'hero' ? [500] : items.map((_, i) => 500 + (i - (n - 1) / 2) * sp);
    const placed = items.map((it, i) => {
      const s = s0(it), x = it.cx ?? xs[i], y = it.cy ?? cy, c = it.c || 'g', t = AT(it.at);
      let hl = null;
      if (kind === 'hero' || it.glow !== undefined) { hl = mk('circle', { cx: x, cy: y, r: s * 1.15, fill: `url(#ih${uid})`, opacity: 0 }, svg); svg.insertBefore(hl, svg.firstChild.nextSibling); }
      if (kind === 'hero') {
        const rays = mk('g', { opacity: 0, transform: `translate(${x},${y})` }, svg); svg.insertBefore(rays, svg.firstChild.nextSibling);
        const L = s * 1.25, inner = mk('g', { filter: `url(#is${uid})` }, rays);
        for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, w = k % 2 ? 0.012 : 0.022; mk('path', { d: `M0,0 L${Math.cos(a - w) * L},${Math.sin(a - w) * L} L${Math.cos(a + w) * L},${Math.sin(a + w) * L} Z`, fill: `url(#ir${uid})`, transform: `scale(${L})`.replace(/scale\([^)]*\)/, '') }, inner); }
        inner.querySelectorAll('path').forEach(p => p.setAttribute('fill', '#f6dc9c'));
        tl.to(rays, { opacity: 0.22, duration: 1.4 }, t + 0.2); tl.fromTo(inner, { rotation: 0 }, { rotation: 40, svgOrigin: '0 0', duration: 24, ease: 'none', immediateRender: false }, t);
      }
      let ring = null;
      if (!it.bare) {
        const R = s * 0.74, back = mk('circle', { cx: x, cy: y, r: R, fill: `url(#id${uid})`, opacity: 0 }, svg);
        ring = mk('circle', { cx: x, cy: y, r: R, fill: 'none', stroke: SOLID[c], 'stroke-width': 2.6, 'stroke-opacity': 0.9, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, transform: `rotate(-90 ${x} ${y})` }, svg);
        const ring2 = mk('circle', { cx: x, cy: y, r: R + 9, fill: 'none', stroke: SOLID[c], 'stroke-width': 1, 'stroke-opacity': 0.45, 'stroke-dasharray': '2 7' }, svg);
        tl.to(back, { opacity: 1, duration: 0.5 }, t - 0.35); DRAW([ring], t - 0.3, 0.7); SHOW(ring2, t - 0.1, 0.7, 0);
        tl.fromTo(ring2, { rotation: 0 }, { rotation: 90, svgOrigin: `${x} ${y}`, duration: 30, ease: 'none', immediateRender: false }, t - 0.1);
      }
      const ic = icon(it.i, x, y, it.bare ? s : s * 0.62, c);
      DRAW(ic.shapes, t - 0.05, 1.0);
      if (hl) tl.to(hl, { opacity: 1, duration: 1.2 }, it.glow !== undefined ? AT(it.glow) : t + 0.4);
      let lab = null, sub = null;
      const below = it.bare ? s / 2 : s * 0.74 + 9;
      if (it.lab) { lab = text(x, y + below + 50, it.lab, { c: c === 'g' ? '#f0d79c' : SOLID[c], s: it.ls || fit(it.lab, em(it.lab) > 6 ? 34 : 40, room, 0.16) }); SHOW(lab, t + 0.15); }
      if (it.sub) { sub = text(x, y + below + 92, it.sub, { c: '#e2d6bd', s: fit(it.sub, 28, room, 0.06), wt: 400, font: 'LXGW WenKai', ls: '0.06em' }); SHOW(sub, it.sat !== undefined ? AT(it.sat) : t + 0.45); }
      if (it.x !== undefined) { const X = mk('path', { d: `M${x - s * 0.55},${y - s * 0.55} L${x + s * 0.55},${y + s * 0.55} M${x + s * 0.55},${y - s * 0.55} L${x - s * 0.55},${y + s * 0.55}`, fill: 'none', stroke: '#eba27c', 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, svg); DRAW([X], AT(it.x), 0.45); }
      if (it.dim !== undefined) tl.to([ic.g, lab, sub].filter(Boolean), { opacity: 0.3, duration: 0.7 }, AT(it.dim));
      return { x, y, s, t, it };
    });
    // 关系：箭头、等号、不等号……
    const relAt = i => (spec.relAt !== undefined ? AT(spec.relAt) : placed[i + 1] ? placed[i + 1].t - 0.15 : placed[i].t + 0.6);
    const arrow = (x1, x2, y, at, c = 'g') => {
      const k = x2 >= x1 ? 1 : -1;                                       // 箭头朝哪边：往左画的箭头，尖也要朝左
      const p = mk('path', { d: `M${x1},${y} L${x2},${y} M${x2 - 16 * k},${y - 13} L${x2},${y} L${x2 - 16 * k},${y + 13}`, fill: 'none', stroke: SOLID[c], 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, svg);
      DRAW([p], at, 0.6);
    };
    if ((kind === 'pair' || kind === 'vs') && n === 2) {
      const [a, b] = placed, m = (a.x + b.x) / 2, y = (a.y + b.y) / 2, r = spec.rel || (kind === 'vs' ? 'vs' : '→'), t = relAt(0);
      const ea = a.it.bare ? a.s / 2 : a.s * 0.74 + 9, eb = b.it.bare ? b.s / 2 : b.s * 0.74 + 9;
      if (r === '→' || r === '←') { const L = a.x + ea + 26, R = b.x - eb - 26; r === '→' ? arrow(L, R, y, t) : arrow(R, L, y, t); }
      else if (r === '⇄') { arrow(a.x + ea + 26, b.x - eb - 26, y - 14, t); arrow(b.x - eb - 26, a.x + ea + 26, y + 14, t + 0.3); }
      else { const e = text(m, y + 26, r, { s: r === 'vs' ? 64 : 92, c: r === '≠' || r === '×' ? '#eba27c' : '#f0d79c', font: r === 'vs' ? 'Cormorant Garamond' : 'Noto Serif SC', ls: '0' }); SHOW(e, t, 0.6, 0); }
    }
    if ((kind === 'pair' || kind === 'vs') && n === 2 && spec.flow) {
      const [a, b] = placed, L = a.x + a.s * 0.74 + 30, R = b.x - b.s * 0.74 - 30, y0 = (a.y + b.y) / 2, t0 = relAt(0) + 0.4;
      for (let k = 0; k < 7; k++) {
        const wrap = mk('g', {}, svg), p = icon(spec.flow, L, y0, 46, 'g', wrap); gsap.set(p.shapes, { strokeDashoffset: 0 }); gsap.set(wrap, { opacity: 0 });
        const d = t0 + k * 0.55, dy = (k % 3 - 1) * 22;
        tl.fromTo(wrap, { x: 0, y: 0, opacity: 0 }, { x: R - L, y: dy, opacity: 1, duration: 2.2, ease: 'sine.inOut', immediateRender: false }, d);
        tl.to(wrap, { opacity: 0, duration: 0.5 }, d + 1.8);
      }
    }
    if (kind === 'flow') for (let i = 0; i + 1 < n; i++) { const a = placed[i], b = placed[i + 1], ea = a.it.bare ? a.s / 2 : a.s * 0.74 + 9, eb = b.it.bare ? b.s / 2 : b.s * 0.74 + 9; if (b.x - eb - (a.x + ea) > 30) arrow(a.x + ea + 8, b.x - eb - 8, a.y, b.t - 0.35); }
    if (spec.cap) { const e = text(500, H - 18, spec.cap, { c: '#f0d79c', s: 34 }); SHOW(e, spec.capAt !== undefined ? AT(spec.capAt) : placed[n - 1].t + 0.8); }
    return realTl => { for (const [k, a] of q) realTl[k](...a); };
  };
})();
