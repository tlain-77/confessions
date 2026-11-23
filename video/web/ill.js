// 图解：用线条图标（Tabler Icons，MIT 许可，node_modules/@tabler/icons）拼出一张会动的小图，配合 lec.js 的 { ill: ... } 使用。
// 图标用金色渐变描出来（一笔一笔画出来），底下垫一层柔光；每个图标在“说到它”的时候出来，下面一行小字。
// 写法：
//   { ill: 'pair', items: [A, B], rel: '→' | '≠' | '=' | '+' | '×' | 'vs' | '⇄', relAt }     两样东西和它们的关系
//   { ill: 'row',  items: [A, B, C, ...] }                                                     一排（2—5 个）
//   { ill: 'flow', items: [A, B, C, ...] }                                                     一排，中间有箭头（一步一步）
//   { ill: 'vs',   items: [A, B] }                                                             一小一大（各自给 s）
//   { ill: 'hero', items: [A] }                                                                一个大图标，后面有光
//   每一项 A = ['图标名', '标签', 时刻, { c: 'g'|'c'|'b'|'p', s: 大小, sub: '小字', sat: 小字时刻, x: 划掉的时刻, dim: 变淡的时刻, glow: 发光的时刻, bare: 1 不要圆框 }]
//   pair 还可以给 flow: 1（一串柔和的光点从左边沿弧线飘到右边；原来写图标名的也照样能用）
//   还可以给 h（图的高度，默认 400）、w（显示宽度，默认 1100 像素）
(function () {
  const NS = 'http://www.w3.org/2000/svg'; let UID = 0, ICONS = null;
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const COL = { g: [['0', '#fff3cf'], ['0.45', '#ecc77f'], ['1', '#b8873c']], c: [['0', '#ffd2bd'], ['1', '#e0805a']], b: [['0', '#e6f4ff'], ['1', '#7fb2dc']], p: [['0', '#ffffff'], ['1', '#d8c7a5']] };
  const SOLID = { g: '#e2bd76', c: '#eba27c', b: '#9cc7e8', p: '#efe6d2' };
  window.ILL_LOAD = async () => { if (!ICONS) ICONS = await (await fetch('/node_modules/@tabler/icons/tabler-nodes-outline.json')).json(); };
  window.ILL_HAS = name => !!(ICONS && ICONS[name]);
  window.ILL_NODES = name => ICONS && ICONS[name];                                   // anim.js 里的动画也用这些图标

  // 一串称呼连成星座：说到哪个词，哪颗星亮起来，跟上一颗连一根细金线，名字在星旁边浮出来（{ stars: [['至高', 时刻], ...], h, w, pos }）
  window.STARS_BUILD = (spec, el, AT) => {
    const q = [], tl = new Proxy({}, { get: (_, k) => (...a) => { q.push([k, a]); return tl; } });
    const uid = ++UID, H = spec.h || 460, n = spec.stars.length;
    el.classList.add('la', 'il', 'st'); if (spec.w) el.style.setProperty('--aw', spec.w + 'px');
    const svg = mk('svg', { viewBox: `0 0 1000 ${H}`, width: 1000, height: H }, el), defs = mk('defs', {}, svg);
    const f = mk('filter', { id: 'sz' + uid, x: '-300%', y: '-300%', width: '700%', height: '700%' }, defs);
    mk('feGaussianBlur', { stdDeviation: 3.2, result: 'b' }, f); const fm = mk('feMerge', {}, f); mk('feMergeNode', { in: 'b' }, fm); mk('feMergeNode', { in: 'b' }, fm); mk('feMergeNode', { in: 'SourceGraphic' }, fm);
    const hg = mk('radialGradient', { id: 'sh' + uid }, defs); mk('stop', { offset: 0, 'stop-color': '#fff1c6', 'stop-opacity': 0.75 }, hg); mk('stop', { offset: 0.35, 'stop-color': '#f3d58e', 'stop-opacity': 0.25 }, hg); mk('stop', { offset: 1, 'stop-color': '#f3d58e', 'stop-opacity': 0 }, hg);
    let sd = uid * 7919; const r = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const pos = spec.pos || spec.stars.map((_, i) => [80 + i * (840 / Math.max(1, n - 1)), H * 0.46 + (i % 2 ? -1 : 1) * H * 0.17 + (r() - 0.5) * H * 0.08]);
    const lines = mk('g', {}, svg), dots = mk('g', {}, svg);
    // 远处还有些暗星，衬着
    for (let k = 0; k < 40; k++) { const c = mk('circle', { cx: r() * 1000, cy: r() * H, r: 0.6 + r() * 1.2, fill: '#f6eeda', opacity: 0 }, lines); tl.to(c, { opacity: 0.15 + r() * 0.35, duration: 1.6 }, AT(spec.stars[0][1]) - 0.4 + r() * 1.5); }
    spec.stars.forEach(([w, at], i) => {
      const [x, y] = pos[i], t = AT(at), up = y < H * 0.46;
      if (i) { const [x0, y0] = pos[i - 1]; const L = mk('path', { d: `M${x0},${y0} L${x},${y}`, fill: 'none', stroke: '#e2bd76', 'stroke-width': 1.4, 'stroke-opacity': 0.65, 'stroke-linecap': 'round', pathLength: 1 }, lines);
        gsap.set(L, { strokeDashoffset: 1.01 }); tl.to(L, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, t - 0.15); }
      const halo = mk('circle', { cx: x, cy: y, r: 30, fill: `url(#sh${uid})`, opacity: 0 }, dots);
      const core = mk('circle', { cx: x, cy: y, r: 4.6, fill: '#fff6dc', filter: `url(#sz${uid})`, opacity: 0 }, dots);
      const lab = mk('text', { x, y: up ? y - 40 : y + 62, 'text-anchor': 'middle', fill: '#f0d79c', 'font-size': spec.fs || (w.length > 3 ? 36 : 42), 'font-family': 'Noto Serif SC', 'font-weight': 500, 'letter-spacing': '0.14em', stroke: 'rgba(8,6,4,.6)', 'stroke-width': 4, 'paint-order': 'stroke' }, dots); lab.textContent = w;
      tl.fromTo(halo, { opacity: 0, scale: 0.4, svgOrigin: `${x} ${y}` }, { opacity: 1, scale: 1, svgOrigin: `${x} ${y}`, duration: 0.9, ease: 'power2.out', immediateRender: false }, t);
      tl.to(core, { opacity: 1, duration: 0.3 }, t);
      tl.fromTo(lab, { opacity: 0, y: up ? -6 : 6 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }, t + 0.1);
      tl.fromTo(halo, { opacity: 1 }, { opacity: 0.55, duration: 1.6 + r(), ease: 'sine.inOut', yoyo: true, repeat: 5, immediateRender: false }, t + 1.0);
    });
    return realTl => { for (const [k, a] of q) realTl[k](...a); };
  };

  window.ILL_BUILD = (spec, el, AT) => {
    const q = [], tl = new Proxy({}, { get: (_, k) => (...a) => { q.push([k, a]); return tl; } });
    const uid = ++UID, H = spec.h || 400;
    el.classList.add('la', 'il'); if (spec.w) el.style.setProperty('--aw', spec.w + 'px');
    const svg = mk('svg', { viewBox: `0 0 1000 ${H}`, width: 1000, height: H }, el);
    const defs = mk('defs', {}, svg);
    const soft = mk('filter', { id: 'is' + uid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); mk('feGaussianBlur', { stdDeviation: 1.1 }, soft);
    const sparkF = mk('filter', { id: 'iz' + uid, x: '-300%', y: '-300%', width: '700%', height: '700%' }, defs);   // 光点：亮核 + 柔光
    mk('feGaussianBlur', { stdDeviation: 3, result: 'b' }, sparkF); const sm = mk('feMerge', {}, sparkF); mk('feMergeNode', { in: 'b' }, sm); mk('feMergeNode', { in: 'b' }, sm); mk('feMergeNode', { in: 'SourceGraphic' }, sm);
    const halo = mk('radialGradient', { id: 'ih' + uid }, defs); mk('stop', { offset: 0, 'stop-color': '#f3d48e', 'stop-opacity': 0.5 }, halo); mk('stop', { offset: 0.5, 'stop-color': '#f3d48e', 'stop-opacity': 0.16 }, halo); mk('stop', { offset: 1, 'stop-color': '#f3d48e', 'stop-opacity': 0 }, halo);
    const disc = mk('radialGradient', { id: 'id' + uid, cx: '42%', cy: '36%', r: '70%' }, defs);   // 圆框底：深色玻璃，左上略亮
    mk('stop', { offset: 0, 'stop-color': '#2a2216', 'stop-opacity': 0.72 }, disc); mk('stop', { offset: 0.7, 'stop-color': '#100d09', 'stop-opacity': 0.72 }, disc); mk('stop', { offset: 1, 'stop-color': '#0b0907', 'stop-opacity': 0.5 }, disc);
    for (const k in COL) { const g = mk('linearGradient', { id: `ig${k}${uid}`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 24, y2: 24 }, defs); COL[k].forEach(([o, c]) => mk('stop', { offset: o, 'stop-color': c }, g)); }
    let seed = uid * 9301 + 49297; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    // 描线：一笔一笔画出来；没画到的部分完全看不见（虚线“1 2”、偏移 1.01，见 ep1.css）
    const DRAW = (els, at, d = 0.9, ease = 'power2.inOut') => { gsap.set(els, { strokeDashoffset: 1.01 }); tl.to(els, { strokeDashoffset: 0, duration: d, ease, stagger: Math.min(0.07, 0.35 / Math.max(1, els.length)) }, at); };
    const SHOW = (e, at, d = 0.9, y = 7) => { gsap.set(e, { opacity: 0 }); tl.fromTo(e, { opacity: 0, y }, { opacity: 1, y: 0, duration: d, ease: 'power2.out', immediateRender: false }, at); };
    const em = t => [...String(t)].reduce((w, ch) => w + (/[\x00-\x7f]/.test(ch) ? 0.56 : 1), 0);   // 多少个字宽
    const fit = (t, fs, room, ls) => Math.max(22, Math.min(fs, room / (em(t) * (1 + ls))));
    const text = (x, y, t, o = {}) => { const e = mk('text', { x, y, 'text-anchor': 'middle', fill: o.c || '#efe6d2', 'font-size': o.s || 34, 'font-family': o.font || 'Noto Serif SC', 'font-weight': o.wt || 500, 'letter-spacing': o.ls || '0.18em', stroke: 'rgba(8,6,4,.62)', 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, svg); e.textContent = t; return e; };   // 描一圈暗边：压在亮的画上也看得清
    // 一粒光点沿着一条路线跑（画圈、画箭头时，笔尖上有一点光）
    const spark = (at, d, pos, r = 4.2) => {
      const sp = mk('circle', { cx: 0, cy: 0, r, fill: '#fff6dc', filter: `url(#iz${uid})`, opacity: 0 }, svg), o = { p: 0 };
      const put = () => { const [px, py] = pos(o.p); sp.setAttribute('cx', px.toFixed(2)); sp.setAttribute('cy', py.toFixed(2)); }; put();
      tl.fromTo(o, { p: 0 }, { p: 1, duration: d, ease: 'power2.inOut', immediateRender: false, onUpdate: put }, at);
      tl.to(sp, { opacity: 1, duration: 0.15 }, at); tl.to(sp, { opacity: 0, duration: 0.35 }, at + d - 0.15);
    };
    // 一个图标：放在 (x, y)（中心），边长 s；细金线 + 很淡的柔光
    const icon = (name, x, y, s, c = 'g', parent = svg) => {
      const nodes = ICONS && ICONS[name]; if (!nodes) throw new Error('没有这个图标：' + name);
      const k = s / 24, sw = Math.max(0.4, 2.5 / k);
      const g = mk('g', { transform: `translate(${x - s / 2},${y - s / 2}) scale(${k})` }, parent);
      const glowG = mk('g', { filter: `url(#is${uid})`, opacity: 0.3 }, g), lineG = mk('g', {}, g), shapes = [];
      for (const [tag, at] of nodes) {
        if (at.stroke === 'none') continue;
        const base = { ...at, fill: at.fill && at.fill !== 'none' ? SOLID[c] : 'none', stroke: SOLID[c], 'stroke-width': sw * 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1 };
        shapes.push(mk(tag, base, glowG));
        shapes.push(mk(tag, { ...base, stroke: `url(#ig${c}${uid})`, 'stroke-width': sw }, lineG));
      }
      return { g, shapes, glowG };
    };
    const items = (spec.items || []).map(it => Array.isArray(it) ? { i: it[0], lab: it[1], at: it[2], ...(it[3] || {}) } : it);
    const n = items.length, kind = spec.ill;
    const cy = spec.cy ?? (H / 2 - 36);
    // 一排的间距：标签长就拉开一点（但两头的圆框不能出画），再放不下就缩字
    const s0 = it => it.s || (kind === 'hero' ? 190 : n >= 5 ? 100 : n === 4 ? 130 : kind === 'pair' || kind === 'vs' ? 165 : 145);
    let sp = n > 1 ? Math.min(260, 820 / (n - 1)) : 0;
    if (n > 1 && kind !== 'pair' && kind !== 'vs') {
      const need = Math.max(...items.map(it => Math.max(it.lab ? em(it.lab) * 1.18 * 34 : 0, it.sub ? em(it.sub) * 1.06 * 25 : 0))) + 26;
      const cap = (984 - 2 * Math.max(...items.map(it => s0(it) * 0.74 + 12))) / (n - 1);
      sp = Math.max(sp, Math.min(need, cap));
    }
    const room = kind === 'pair' || kind === 'vs' ? 456 : kind === 'hero' ? 900 : sp - 40;   // 一排的标签之间至少留 40 的空
    const xs = kind === 'pair' || kind === 'vs' ? [260, 740] : kind === 'hero' ? [500] : items.map((_, i) => 500 + (i - (n - 1) / 2) * sp);
    const placed = items.map((it, i) => {
      const s = s0(it), x = it.cx ?? xs[i], y = it.cy ?? cy, c = it.c || 'g', t = AT(it.at), R = s * 0.74;
      let hl = null;
      if (kind === 'hero' || it.glow !== undefined) { hl = mk('circle', { cx: x, cy: y, r: s * 1.2, fill: `url(#ih${uid})`, opacity: 0 }, svg); svg.insertBefore(hl, svg.firstChild.nextSibling); }
      if (kind === 'hero') {                                           // 大图标：后面一团柔光，慢慢呼吸；几粒微尘往上飘（不要转动的光芒）
        for (let k = 0; k < 9; k++) {
          const a = rnd() * Math.PI * 2, rr = R * (0.8 + rnd() * 0.6), mx = x + Math.cos(a) * rr, my = y + Math.sin(a) * rr * 0.8;
          const m = mk('circle', { cx: mx, cy: my, r: 1.6 + rnd() * 1.8, fill: '#ffe9b5', filter: `url(#iz${uid})`, opacity: 0 }, svg);
          const d0 = t + 0.6 + k * 0.45, du = 3.2 + rnd() * 1.6;
          tl.fromTo(m, { y: 0, opacity: 0 }, { y: -(36 + rnd() * 50), opacity: 0.85, duration: du * 0.45, ease: 'sine.out', immediateRender: false }, d0);
          tl.to(m, { y: -(80 + rnd() * 50), opacity: 0, duration: du * 0.55, ease: 'sine.in' }, d0 + du * 0.45);
        }
      }
      let ring = null;
      if (!it.bare) {
        const back = mk('circle', { cx: x, cy: y, r: R, fill: `url(#id${uid})`, opacity: 0 }, svg);
        const sheen = mk('path', { d: `M${x + Math.cos(3.5) * (R - 5)},${y + Math.sin(3.5) * (R - 5)} A${R - 5},${R - 5} 0 0 1 ${x + Math.cos(4.9) * (R - 5)},${y + Math.sin(4.9) * (R - 5)}`, fill: 'none', stroke: '#fff4dc', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, svg);   // 左上一道高光：像打磨过的边
        const rim = mk('circle', { cx: x, cy: y, r: R + 9, fill: 'none', stroke: SOLID[c], 'stroke-width': 1, 'stroke-opacity': 0.34, opacity: 0 }, svg);   // 外圈一根细线（不转）
        ring = mk('circle', { cx: x, cy: y, r: R, fill: 'none', stroke: SOLID[c], 'stroke-width': 2, 'stroke-opacity': 0.95, pathLength: 1, transform: `rotate(-90 ${x} ${y})` }, svg);
        const tr = t - 0.4, dr = 1.0;
        tl.to(back, { opacity: 1, duration: 0.9, ease: 'sine.out' }, tr);
        DRAW([ring], tr, dr); spark(tr, dr, p => { const a = -Math.PI / 2 + p * Math.PI * 2; return [x + Math.cos(a) * R, y + Math.sin(a) * R]; });
        tl.to(rim, { opacity: 1, duration: 1.2, ease: 'sine.out' }, tr + 0.4); tl.to(sheen, { opacity: 0.16, duration: 1.2 }, tr + 0.6);
      }
      const ic = icon(it.i, x, y, it.bare ? s : s * 0.62, c);
      DRAW(ic.shapes, t - 0.05, 1.15);
      tl.fromTo(ic.glowG, { opacity: 0.3 }, { opacity: 0.75, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 1, immediateRender: false }, t + 0.85);   // 画完，光稍微亮一下又落回去
      if (hl) { const tg = it.glow !== undefined ? AT(it.glow) : t + 0.4; tl.to(hl, { opacity: 1, duration: 1.6, ease: 'sine.inOut' }, tg);
        if (kind === 'hero') tl.fromTo(hl, { scale: 1 }, { scale: 1.08, svgOrigin: `${x} ${y}`, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: 7, immediateRender: false }, tg + 1.6); }
      let lab = null, sub = null;
      const below = it.bare ? s / 2 : R + 9;
      if (it.lab) { lab = text(x, y + below + 50, it.lab, { c: c === 'g' ? '#f0d79c' : SOLID[c], s: it.ls || fit(it.lab, em(it.lab) > 6 ? 34 : 40, room, 0.18) }); SHOW(lab, t + 0.3); }
      if (it.sub) { sub = text(x, y + below + 92, it.sub, { c: '#e2d6bd', s: fit(it.sub, 28, room, 0.06), wt: 400, font: 'LXGW WenKai', ls: '0.06em' }); SHOW(sub, it.sat !== undefined ? AT(it.sat) : t + 0.55); }
      if (it.x !== undefined) {                                        // 划掉：两笔细珊瑚色线，被划掉的那一样暗下去
        const tx = AT(it.x), h = s * 0.5, L2 = d => mk('path', { d, fill: 'none', stroke: '#eba27c', 'stroke-width': 4.5, 'stroke-linecap': 'round', pathLength: 1 }, svg);
        DRAW([L2(`M${x - h},${y - h} L${x + h},${y + h}`)], tx, 0.35, 'power2.out'); DRAW([L2(`M${x + h},${y - h} L${x - h},${y + h}`)], tx + 0.18, 0.35, 'power2.out');
        tl.to([ic.g, ring].filter(Boolean), { opacity: 0.45, duration: 0.7 }, tx + 0.2);
      }
      if (it.dim !== undefined) tl.to([ic.g, lab, sub].filter(Boolean), { opacity: 0.3, duration: 0.8 }, AT(it.dim));
      return { x, y, s, t, it };
    });
    // 关系：细线画出来（箭头、等号、不等号、加号……），“vs”和问号用意大利体
    const relAt = i => (spec.relAt !== undefined ? AT(spec.relAt) : placed[i + 1] ? placed[i + 1].t - 0.15 : placed[i].t + 0.6);
    const L1 = (d, col = SOLID.g, w = 2.4) => mk('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1 }, svg);
    const arrow = (x1, x2, y, at) => {
      const k = x2 >= x1 ? 1 : -1;                                       // 箭头朝哪边：往左画的箭头，尖也要朝左
      DRAW([L1(`M${x1},${y} L${x2},${y}`)], at, 0.75); DRAW([L1(`M${x2 - 12 * k},${y - 9} L${x2},${y} L${x2 - 12 * k},${y + 9}`)], at + 0.6, 0.3, 'power1.out');
      spark(at, 0.75, p => [x1 + (x2 - x1) * p, y], 3.6);
    };
    const glyph = (r, m, y, t) => {
      const col = r === '≠' || r === '×' ? SOLID.c : SOLID.g;
      if (r === '=' || r === '≠') { DRAW([L1(`M${m - 24},${y - 9} L${m + 24},${y - 9}`, col)], t, 0.5); DRAW([L1(`M${m - 24},${y + 9} L${m + 24},${y + 9}`, col)], t + 0.15, 0.5); if (r === '≠') DRAW([L1(`M${m + 13},${y - 26} L${m - 13},${y + 26}`, col)], t + 0.45, 0.4); }
      else if (r === '+') { DRAW([L1(`M${m - 22},${y} L${m + 22},${y}`, col)], t, 0.45); DRAW([L1(`M${m},${y - 22} L${m},${y + 22}`, col)], t + 0.15, 0.45); }
      else if (r === '×') { DRAW([L1(`M${m - 17},${y - 17} L${m + 17},${y + 17}`, col)], t, 0.4); DRAW([L1(`M${m + 17},${y - 17} L${m - 17},${y + 17}`, col)], t + 0.15, 0.4); }
      else { const e = text(m, y + (r === 'vs' ? 14 : 24), r, { s: r === 'vs' ? 48 : 76, c: r === 'vs' ? '#e8dcc2' : '#f0d79c', font: 'Cormorant Garamond', wt: 500, ls: r === 'vs' ? '0.1em' : '0' }); e.setAttribute('font-style', 'italic'); SHOW(e, t, 1.0, 0); }
    };
    if ((kind === 'pair' || kind === 'vs') && n === 2) {
      const [a, b] = placed, m = (a.x + b.x) / 2, y = (a.y + b.y) / 2, r = spec.rel || (kind === 'vs' ? 'vs' : '→'), t = relAt(0);
      const ea = a.it.bare ? a.s / 2 : a.s * 0.74 + 9, eb = b.it.bare ? b.s / 2 : b.s * 0.74 + 9;
      if (r === '→' || r === '←') { const L = a.x + ea + 26, R = b.x - eb - 26; r === '→' ? arrow(L, R, y, t) : arrow(R, L, y, t); }
      else if (r === '⇄') { arrow(a.x + ea + 26, b.x - eb - 26, y - 13, t); arrow(b.x - eb - 26, a.x + ea + 26, y + 13, t + 0.3); }
      else glyph(r, m, y, t);
    }
    if ((kind === 'pair' || kind === 'vs') && n === 2 && spec.flow) {   // 流过去：一串柔和的光点沿着弧线从左飘到右（不再用小图标）
      const [a, b] = placed, L = a.x + a.s * 0.74 + 24, R = b.x - b.s * 0.74 - 24, y0 = (a.y + b.y) / 2, t0 = relAt(0) + 0.5;
      for (let k = 0; k < 12; k++) {
        const arc = 16 + rnd() * 28, du = 1.7 + rnd() * 0.6, d0 = t0 + k * 0.3 + rnd() * 0.12;
        spark(d0, du, p => [L + (R - L) * p, y0 - Math.sin(p * Math.PI) * arc], 2 + rnd() * 2.2);
      }
    }
    if (kind === 'flow') for (let i = 0; i + 1 < n; i++) { const a = placed[i], b = placed[i + 1], ea = a.it.bare ? a.s / 2 : a.s * 0.74 + 9, eb = b.it.bare ? b.s / 2 : b.s * 0.74 + 9; if (b.x - eb - (a.x + ea) > 30) arrow(a.x + ea + 8, b.x - eb - 8, a.y, b.t - 0.35); }
    if (spec.cap) { const e = text(500, H - 18, spec.cap, { c: '#f0d79c', s: 34 }); SHOW(e, spec.capAt !== undefined ? AT(spec.capAt) : placed[n - 1].t + 0.8); }
    return realTl => { for (const [k, a] of q) realTl[k](...a); };
  };
})();
