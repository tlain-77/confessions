// 讲稿页的动画插图（金线描、发光），配合 lec.js 的 { anim: '名字', at, ...各步的时刻 } 使用。
// 每个动画：在 el 里画一张 SVG（viewBox 1000×560），各步按录音里说到的那句话出现；全部挂在时间轴上（能逐帧定位）。
(function () {
  const NS = 'http://www.w3.org/2000/svg'; let UID = 0;
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const GOLD = '#e2bd76', PAPER = '#f1e8d6', CORAL = '#eba27c', WATER = '#8fb8d8';
  // 每张图的公用定义：发光、柔光、金色渐变、纸色渐变（渐变用用户坐标，横平竖直的线也能用）
  const base = (el, h = 560) => {
    el.classList.add('la');
    const uid = ++UID;
    const svg = mk('svg', { viewBox: `0 0 1000 ${h}`, width: 1000, height: h }, el); svg._uid = uid;
    const defs = mk('defs', {}, svg);
    const glow = mk('filter', { id: 'g' + uid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    mk('feGaussianBlur', { stdDeviation: 6, result: 'b' }, glow); const m = mk('feMerge', {}, glow); mk('feMergeNode', { in: 'b' }, m); mk('feMergeNode', { in: 'SourceGraphic' }, m);
    const soft = mk('filter', { id: 'f' + uid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); mk('feGaussianBlur', { stdDeviation: 5 }, soft);
    const blur2 = mk('filter', { id: 'b' + uid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); mk('feGaussianBlur', { stdDeviation: 14 }, blur2);
    const gg = mk('linearGradient', { id: 'gg' + uid, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1000, y2: h }, defs);
    [[0, '#fff3cf'], [0.3, '#efcd8a'], [0.65, '#c99b4e'], [1, '#f6dfa6']].forEach(([o, c]) => mk('stop', { offset: o, 'stop-color': c }, gg));
    const pg = mk('linearGradient', { id: 'pg' + uid, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1000, y2: h }, defs);
    [[0, '#ffffff'], [0.5, '#f1e6d0'], [1, '#d8c7a5']].forEach(([o, c]) => mk('stop', { offset: o, 'stop-color': c }, pg));
    return { svg, defs, uid, glowId: glow.id, soft: 'f' + uid, blur: 'b' + uid, GG: `url(#gg${uid})`, PG: `url(#pg${uid})` };
  };
  // 描线：一根清楚的线（金色、纸色用渐变），底下垫一层柔光；返回一个组（整组可以移动、淡出），组上的 _p 是两根线（描线动画用）
  const line = (svg, d, o = {}) => {
    const uid = svg._uid || svg.ownerSVGElement._uid;
    const col = o.c || GOLD, stroke = col === GOLD ? `url(#gg${uid})` : col === PAPER ? `url(#pg${uid})` : col;
    const W = (o.w || 4) * 0.8;                                            // 线比原来细两成，柔光也淡一些（显得精致）
    const at = { d, fill: 'none', stroke, 'stroke-width': W, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1 };
    const g = mk('g', {}, svg), ps = [];
    if (o.glow !== false) ps.push(mk('path', { ...at, stroke: o.gc || col, 'stroke-width': o.gw ?? W * 2.4, opacity: (o.go ?? 0.32) * 0.72, filter: `url(#f${uid})` }, g));
    const p = mk('path', { ...at, ...(o.f ? { filter: `url(#${o.f})` } : {}) }, g); ps.push(p);
    g._p = ps; g._m = p; return g;
  };
  const text = (svg, x, y, t, o = {}) => {
    const uid = svg._uid || (svg.ownerSVGElement && svg.ownerSVGElement._uid);
    const fill = o.c === GOLD && uid ? `url(#gg${uid})` : (o.c || PAPER);
    const e = mk('text', { x, y, 'text-anchor': o.a || 'middle', fill, 'font-size': o.s || 34, 'font-family': o.font || 'Noto Serif SC', 'font-weight': o.wt || 500, 'letter-spacing': o.ls ?? '0.1em' }, svg); e.textContent = t; return e;
  };
  // 描线：用样式里的 stroke-dashoffset（ep1.css 里 svg [pathLength] 有一条样式规则，会盖过同名的属性）
  const DRAW = (tl, e, at, d = 1.2) => { const t = e._p || e; gsap.set(t, { strokeDashoffset: 1.01 }); tl.to(t, { strokeDashoffset: 0, duration: d * 1.1, ease: 'power2.inOut' }, at); };
  const SHOW = (tl, e, at, d = 0.7, o = {}) => { gsap.set(e, { opacity: 0 }); tl.fromTo(e, { opacity: 0, y: o.y ?? 8 }, { opacity: o.o ?? 1, y: 0, duration: Math.max(d, 0.9), ease: 'power2.out', immediateRender: false }, at); };
  const grad = (defs, id, kind, attrs, stops) => { const g = mk(kind, { id, gradientUnits: 'userSpaceOnUse', ...attrs }, defs); stops.forEach(([o, c, a]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, g)); return `url(#${id})`; };
  // 线条图标（Tabler，ill.js 载入）：中心 (x, y)，边长 sz；返回一个组，组上的 _p 是所有线（描线用）
  const icon = (par, name, x, y, sz, o = {}) => {
    const nodes = window.ILL_NODES && window.ILL_NODES(name); if (!nodes) throw new Error('没有这个图标：' + name);
    const svg = par.ownerSVGElement || par, uid = svg._uid, k = sz / 24, sw = (o.w || 3.4) / k;
    if (!svg._fi) { const f = mk('filter', { id: 'fi' + uid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, svg.querySelector('defs')); mk('feGaussianBlur', { stdDeviation: 0.9 }, f); svg._fi = 1; }
    const outer = mk('g', {}, par), g = mk('g', { transform: `translate(${x - sz / 2},${y - sz / 2}) scale(${k})` }, outer), ps = [], col = o.c || GOLD;
    for (const [tag, at] of nodes) {
      if (at.stroke === 'none') continue;
      const a2 = { ...at, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 };
      ps.push(mk(tag, { ...a2, 'stroke-width': sw * 2.3, opacity: 0.45, filter: `url(#fi${uid})` }, g)); ps.push(mk(tag, a2, g));
    }
    outer._p = ps; return outer;
  };
  const circ = (cx, cy, r) => `M${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy} A${r},${r} 0 1 1 ${cx + r},${cy}`;
  const BOTTLE = 'M470,60 L470,150 C470,195 330,215 330,300 L330,498 Q330,520 352,520 L648,520 Q670,520 670,498 L670,300 C670,215 530,195 530,150 L530,60';

  // 公用画法给别的文件用（fig.js：火柴人和各讲例子的动画）
  window.AH = { mk, rng, base, line, text, DRAW, SHOW, grad, icon, circ, GOLD, PAPER, CORAL, WATER };
  // 记录器：动画函数在搭页面时就执行（这样 SVG 里的字能赶上字体预载）；“说到哪句话”的时刻那时已经能算，
  // 只有对时间轴的调用要先记下来，等时间轴建好，再按原顺序重放到真的时间轴上。
  window.ANIM_BUILD = (name, el, s, AT) => {
    const q = [], tl = new Proxy({}, { get: (_, k) => (...a) => { q.push([k, a]); return tl; } });
    window.ANIMS[name]({ tl, el, AT, s });
    return realTl => { for (const [k, a] of q) realTl[k](...a); };
  };
  window.ANIMS = {
    // 天地像一个大瓶子，神像水：一只玻璃瓶（边上亮、中间透），水倒进去（水面有波纹、有气泡），倒满 → 溢出来 → 多出来的去哪了？
    bottle({ tl, el, AT, s }) {
      const { svg, defs, uid, soft } = base(el);
      mk('path', { d: BOTTLE + ' Z' }, mk('clipPath', { id: 'cb' + uid }, defs));
      const glassF = grad(defs, 'gl' + uid, 'linearGradient', { x1: 330, y1: 0, x2: 670, y2: 0 }, [[0, '#eaf6ff', 0.3], [0.1, '#eaf6ff', 0.07], [0.5, '#eaf6ff', 0.02], [0.86, '#eaf6ff', 0.06], [1, '#eaf6ff', 0.22]]);
      const waterF = grad(defs, 'w' + uid, 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 470 }, [[0, '#dff3ff', 0.96], [0.45, '#86b9e2', 0.92], [1, '#2a5a8a', 0.95]]);
      const body = mk('path', { d: BOTTLE + ' Z', fill: glassF, opacity: 0 }, svg);
      const inside = mk('g', { 'clip-path': `url(#cb${uid})` }, svg);
      const lvl = mk('g', {}, inside);                                      // 整个水体（随水位上下）
      let wave = 'M200,0'; for (let x = 200, k = 0; x < 1240; x += 30, k++) wave += ` Q${x + 15},${k % 2 ? 3.5 : -3.5} ${x + 30},0`;
      const flow = mk('g', {}, lvl);
      mk('path', { d: wave + ' L1240,600 L200,600 Z', fill: waterF }, flow);
      mk('path', { d: wave, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.55, 'stroke-width': 1.6 }, flow);
      gsap.set(lvl, { y: 528 });
      const bub = [], r = rng(21);
      for (let i = 0; i < 14; i++) bub.push(mk('circle', { cx: 360 + r() * 280, cy: 505, r: 2 + r() * 4, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.7, 'stroke-width': 1.5, opacity: 0 }, inside));
      const shadow = mk('ellipse', { cx: 500, cy: 534, rx: 210, ry: 15, fill: '#000', opacity: 0, filter: `url(#b${uid})` }, svg);
      svg.insertBefore(shadow, body);
      // 水面：一层亮的面（椭圆，超出瓶壁的部分被裁掉）；水里几道柔和的光纹，跟着水面慢慢流
      const surfG = grad(defs, 'sf' + uid, 'radialGradient', { cx: 500, cy: 0, r: 200 }, [[0, '#ffffff', 0.75], [0.7, '#e8f6ff', 0.4], [1, '#cfe8fb', 0.2]]);
      mk('ellipse', { cx: 500, cy: 3, rx: 210, ry: 10, fill: surfG }, lvl);
      for (let k = 0; k < 3; k++) mk('path', { d: `M200,${60 + k * 62} C260,${44 + k * 62} 320,${76 + k * 62} 380,${60 + k * 62} S500,${44 + k * 62} 560,${60 + k * 62} S680,${76 + k * 62} 740,${60 + k * 62} S860,${44 + k * 62} 920,${60 + k * 62} S1040,${76 + k * 62} 1100,${60 + k * 62}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.1 + 0.04 * (2 - k), filter: `url(#${soft})` }, flow);
      // 倒水：一道细水柱（瓶口上面一段 + 瓶子里一段，水面以下被水盖住），水面有一圈圈涟漪
      const colF = grad(defs, 'sc' + uid, 'linearGradient', { x1: 494, y1: 0, x2: 506, y2: 0 }, [[0, '#cfe8fb', 0.5], [0.5, '#ffffff', 0.95], [1, '#cfe8fb', 0.5]]);
      const col1 = mk('rect', { x: 494, y: 0, width: 12, height: 62, rx: 5, fill: colF, opacity: 0 }, svg);
      const col2 = mk('rect', { x: 494, y: 40, width: 12, height: 520, fill: colF, opacity: 0 }, inside); inside.insertBefore(col2, lvl);
      const rip = [0, 1, 2, 3].map(() => mk('ellipse', { cx: 500, cy: 2, rx: 10, ry: 2, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6, opacity: 0 }, lvl));
      const b = line(svg, BOTTLE, { c: PAPER, w: 4.5, go: 0.4 });
      const wall = mk('path', { d: BOTTLE, transform: 'translate(500 300) scale(0.962 0.984) translate(-500 -300)', fill: 'none', stroke: '#eaf6ff', 'stroke-width': 1.3, opacity: 0 }, svg);   // 玻璃的厚度：里面再一道淡线
      const rim = line(svg, 'M470,60 A30,6.5 0 1 0 530,60 A30,6.5 0 1 0 470,60', { c: PAPER, w: 3, go: 0.3 });   // 瓶口一圈
      const hi = [mk('path', { d: 'M352,318 C345,380 345,440 351,492', fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0, filter: `url(#${soft})` }, svg),
        mk('path', { d: 'M378,248 C402,226 432,212 458,203', fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0, filter: `url(#${soft})` }, svg),
        mk('path', { d: 'M650,336 C655,392 655,442 650,488', fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0, filter: `url(#${soft})` }, svg),
        mk('path', { d: 'M478,72 L478,140', fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0, filter: `url(#${soft})` }, svg)];
      const t1 = text(svg, 215, 305, '天地', { s: 42, c: GOLD, ls: '0.3em' }), t2 = text(svg, 800, 305, '神？', { s: 42, c: '#cfe8fb', ls: '0.2em' });
      const t0 = AT(s.at), tf = AT(s.fill);
      DRAW(tl, b, t0, 1.4); tl.to(body, { opacity: 1, duration: 1.2 }, t0 + 0.4); tl.to(hi, { opacity: 0.45, duration: 1.2 }, t0 + 1.0);
      DRAW(tl, rim, t0 + 1.1, 0.6); tl.to(wall, { opacity: 0.26, duration: 1.2 }, t0 + 1.0); tl.to(shadow, { opacity: 0.55, duration: 1.4 }, t0 + 0.6);
      tl.to([col1, col2], { opacity: 0.9, duration: 0.3 }, tf - 0.2); tl.to([col1, col2], { opacity: 0, duration: 0.6 }, tf + 2.5);   // 倒水的那几秒才有水柱
      rip.forEach((e, i) => { for (let k = 0; k < 2; k++) { const d = tf + 0.1 + i * 0.32 + k * 1.3;
        tl.fromTo(e, { attr: { rx: 10, ry: 2 }, opacity: 0.7 }, { attr: { rx: 70, ry: 9 }, opacity: 0, duration: 1.1, ease: 'sine.out', immediateRender: false }, d); } });
      SHOW(tl, t1, t0 + 0.6); SHOW(tl, t2, tf - 0.2);
      tl.fromTo(flow, { x: 0 }, { x: -400, duration: 26, ease: 'none', immediateRender: false }, t0);   // 水面一直在轻轻流动
      tl.to(lvl, { y: 64, duration: 2.8, ease: 'power1.inOut' }, tf);
      bub.forEach((c, i) => { const d = tf + 1.2 + i * 0.22; tl.set(c, { opacity: 0.8 }, d); tl.fromTo(c, { y: 0 }, { y: -(220 + (i * 47) % 200), duration: 2.4, ease: 'power1.in', immediateRender: false }, d); tl.to(c, { opacity: 0, duration: 0.4 }, d + 2.0); });
      if (s.over !== undefined) {
        const dropF = grad(defs, 'dr' + uid, 'linearGradient', { x1: -8, y1: -9, x2: 8, y2: 9 }, [[0, '#ffffff', 1], [1, '#7fb2dc', 0.9]]);
        const drops = [];
        for (let i = 0; i < 20; i++) { const side = i % 2 ? 1 : -1; drops.push([mk('path', { d: 'M0,-10 C5,-3 8,3 0,10 C-8,3 -5,-3 0,-10 Z', fill: dropF, opacity: 0, transform: `translate(${500 + side * (26 + (i * 7) % 8)},58)` }, svg), side, i]); }
        const t1o = AT(s.over);
        drops.forEach(([d, side, i]) => { const dl = t1o + i * 0.11; tl.set(d, { opacity: 1 }, dl);
          tl.fromTo(d, { x: 0, y: 0 }, { x: side * (60 + (i * 37) % 160), y: 420 + (i * 53) % 90, duration: 1.4, ease: 'power2.in', immediateRender: false }, dl); tl.to(d, { opacity: 0, duration: 0.4 }, dl + 1.1); });
        // 问句放在“神？”底下（瓶口上面要留给溢出来的水珠）
        const q1 = text(svg, 800, 392, '多出来的，', { s: 36, c: CORAL, ls: '0.12em' }), q2 = text(svg, 800, 440, '去哪了？', { s: 36, c: CORAL, ls: '0.12em' });
        SHOW(tl, q1, t1o + 0.5); SHOW(tl, q2, t1o + 0.8);
      }
    },
    // 楼和地基：楼画出来，地基亮起来——是地基托着楼
    building({ tl, el, AT, s }) {
      // 一座古典的殿（三级台阶、六根柱子、横梁、三角楣）立在一块地基上；说到“地基托着楼”，地基亮起来，光从下往上透过柱间
      const { svg, defs, uid, blur } = base(el);
      const fglow = mk('ellipse', { cx: 500, cy: 494, rx: 360, ry: 80, fill: grad(defs, 'fh' + uid, 'radialGradient', { cx: 500, cy: 494, r: 360 }, [[0, '#ffe6a6', 0.55], [1, GOLD, 0]]), opacity: 0, filter: `url(#${blur})` }, svg);
      const lightG = grad(defs, 'lg' + uid, 'linearGradient', { x1: 0, y1: 440, x2: 0, y2: 210 }, [[0, '#ffe6a6', 0.6], [1, '#ffe6a6', 0]]);
      const beams = [376, 438, 500, 562, 624].map(x => mk('rect', { x: x - 16, y: 222, width: 32, height: 218, fill: lightG, opacity: 0, style: 'mix-blend-mode:screen' }, svg));
      const steps = line(svg, 'M296,440 L704,440 M284,453 L716,453 M272,466 L728,466', { c: PAPER, w: 2.4 });
      const cols = [345, 407, 469, 531, 593, 655].map(x => line(svg, `M${x - 13},228 L${x - 13},436 M${x + 13},228 L${x + 13},436 M${x - 20},228 L${x + 20},228 M${x - 20},436 L${x + 20},436`, { c: PAPER, w: 2.4 }));
      const beam = line(svg, 'M306,188 L694,188 L694,224 L306,224 Z M314,206 L686,206', { c: PAPER, w: 2.6 });
      const ped = line(svg, 'M296,188 L500,92 L704,188', { c: PAPER, w: 3 }), ped2 = line(svg, 'M346,178 L500,108 L654,178 Z', { c: PAPER, w: 1.6, go: 0.12 });
      const fg = grad(defs, 'fg' + uid, 'linearGradient', { x1: 0, y1: 472, x2: 0, y2: 522 }, [[0, '#fff2c8'], [0.45, '#e2bd76'], [1, '#8a6428']]);
      const f = mk('rect', { x: 250, y: 472, width: 500, height: 48, rx: 3, fill: fg, opacity: 0 }, svg);
      const tF = text(svg, 500, 506, '地　基', { s: 30, c: '#2a2118', wt: 700 }), tB = text(svg, 500, 60, '楼', { s: 40 });
      const t0 = AT(s.at);
      DRAW(tl, steps, t0, 0.8); cols.forEach((c, i) => DRAW(tl, c, t0 + 0.35 + i * 0.12, 1.0)); DRAW(tl, beam, t0 + 1.1, 0.8); DRAW(tl, ped, t0 + 1.5, 1.0); DRAW(tl, ped2, t0 + 1.9, 0.8);
      SHOW(tl, tB, t0 + 1.4);
      const tf = AT(s.found);
      tl.to(fglow, { opacity: 1, duration: 1.4, ease: 'sine.inOut' }, tf); tl.to(f, { opacity: 1, duration: 1.0, ease: 'power2.out' }, tf); SHOW(tl, tF, tf + 0.3);
      beams.forEach((b, i) => { tl.to(b, { opacity: 0.85, duration: 1.4, ease: 'sine.inOut' }, tf + 0.5 + i * 0.1); tl.to(b, { opacity: 0.45, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: 3 }, tf + 2.0 + i * 0.1); });
    },
    // 瓶即使破碎，你并不散溢：玻璃瓶里满是光 → 瓶身裂开 → 碎玻璃崩落、闪着光往下掉，光还在原地，更亮，光芒慢慢转、光点往上飘
    breaking({ tl, el, AT, s }) {
      const { svg, defs, uid, soft, blur } = base(el);
      const lightF = grad(defs, 'l' + uid, 'radialGradient', { cx: 500, cy: 360, r: 230 }, [[0, '#fffbe9', 1], [0.35, '#ffe8a8', 0.95], [0.7, GOLD, 0.5], [1, GOLD, 0]]);
      const rayF = grad(defs, 'r' + uid, 'radialGradient', { cx: 500, cy: 360, r: 470 }, [[0, '#fff1c8', 0.75], [0.5, GOLD, 0.25], [1, GOLD, 0]]);
      const glassF = grad(defs, 'gl' + uid, 'linearGradient', { x1: 330, y1: 0, x2: 670, y2: 0 }, [[0, '#eaf6ff', 0.28], [0.12, '#eaf6ff', 0.06], [0.5, '#eaf6ff', 0.02], [0.88, '#eaf6ff', 0.06], [1, '#eaf6ff', 0.2]]);
      const rays = mk('g', { opacity: 0 }, svg);
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, w = 0.035 + (i % 3) * 0.015, R = 380 + (i % 4) * 40;
        mk('path', { d: `M500,360 L${500 + Math.cos(a - w) * R},${360 + Math.sin(a - w) * R} L${500 + Math.cos(a + w) * R},${360 + Math.sin(a + w) * R} Z`, fill: rayF, filter: `url(#${soft})` }, rays); }
      const halo = mk('circle', { cx: 500, cy: 360, r: 260, fill: rayF, opacity: 0, filter: `url(#${blur})` }, svg);
      const light = mk('ellipse', { cx: 500, cy: 362, rx: 150, ry: 150, fill: lightF, opacity: 0 }, svg);
      const body = mk('path', { d: BOTTLE + ' Z', fill: glassF, opacity: 0 }, svg);
      const shardsD = ['M470,60 L470,150 C470,175 430,190 395,205', 'M530,60 L530,150 C530,175 570,190 605,205', 'M395,205 C350,225 330,260 330,300 L330,400', 'M605,205 C650,225 670,260 670,300 L670,400', 'M330,400 L330,498 Q330,520 352,520 L500,520', 'M670,400 L670,498 Q670,520 648,520 L500,520'];
      const shards = shardsD.map(d => line(svg, d, { c: PAPER, w: 4.5, go: 0.4 }));
      const cracks = ['M400,240 L428,286 L414,330 L452,380 L440,410', 'M612,262 L584,302 L601,350 L568,412', 'M470,470 L502,428 L541,470', 'M520,150 L508,196 L532,236'].map(d => line(svg, d, { c: '#fff4d6', w: 2.4, go: 0.6 }));
      // 碎玻璃：沿瓶身取点，每点一小片三角，平时看不见，碎的时候闪一下往下掉
      const r = rng(9), frags = [];
      const edge = [[470, 90], [530, 110], [430, 190], [570, 195], [380, 225], [620, 230], [340, 280], [660, 285], [332, 340], [668, 345], [331, 400], [669, 405], [332, 455], [668, 460], [345, 512], [655, 512], [420, 520], [580, 520], [500, 520], [470, 140], [530, 150], [355, 250], [645, 255], [331, 375], [669, 380]];
      edge.forEach(([x, y], i) => { const k = 7 + r() * 11, a = r() * 6.28;
        const pts = [0, 2.1, 4.2].map(o => `${x + Math.cos(a + o) * k * (0.6 + r() * 0.6)},${y + Math.sin(a + o) * k * (0.6 + r() * 0.6)}`).join(' ');
        frags.push([mk('polygon', { points: pts, fill: 'rgba(235,246,255,.35)', stroke: '#ffffff', 'stroke-width': 1.3, 'stroke-opacity': 0.9, opacity: 0 }, svg), x < 500 ? -1 : 1, i]); });
      const t0 = AT(s.at), tc = AT(s.crack), tfall = AT(s.fall);
      shards.forEach((p, i) => DRAW(tl, p, t0 + i * 0.12, 1.0)); tl.to(body, { opacity: 1, duration: 1.0 }, t0 + 0.4);
      tl.to(light, { opacity: 0.9, duration: 1.4 }, t0 + 0.6); tl.to(halo, { opacity: 0.35, duration: 1.6 }, t0 + 0.8);
      cracks.forEach((c, i) => DRAW(tl, c, tc + i * 0.22, 0.5));
      tl.to(light, { attr: { rx: 158, ry: 158 }, duration: 0.25, ease: 'power2.out' }, tc + 0.1); tl.to(light, { attr: { rx: 150, ry: 150 }, duration: 0.5 }, tc + 0.35);
      shards.forEach((p, i) => { const side = i % 2 ? 1 : -1; tl.to(p, { x: side * (80 + i * 25), y: 280 + i * 30, rotation: side * (25 + i * 9), opacity: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'power2.in' }, tfall + i * 0.06); });
      tl.to(body, { opacity: 0, duration: 0.5 }, tfall); cracks.forEach(c => tl.to(c, { opacity: 0, duration: 0.4 }, tfall));
      frags.forEach(([f, side, i]) => { const d = tfall + (i % 6) * 0.05;
        tl.to(f, { opacity: 1, duration: 0.12 }, d);
        tl.to(f, { x: side * (50 + (i * 29) % 170), y: 240 + (i * 41) % 140, rotation: side * (120 + (i * 53) % 300), transformOrigin: '50% 50%', duration: 1.5 + (i % 4) * 0.12, ease: 'power2.in' }, d);
        tl.to(f, { opacity: 0, duration: 0.45 }, d + 1.15 + (i % 4) * 0.12); });
      tl.to(light, { opacity: 1, attr: { rx: 205, ry: 205 }, duration: 1.8, ease: 'sine.inOut' }, tfall + 0.3);
      tl.to(halo, { opacity: 0.7, attr: { r: 300 }, duration: 2.0 }, tfall + 0.3);
      tl.to(rays, { opacity: 0.85, duration: 1.6 }, tfall + 0.6); tl.fromTo(rays, { rotation: 0 }, { rotation: 24, svgOrigin: '500 360', duration: 12, ease: 'none', immediateRender: false }, tfall + 0.6);
      for (let i = 0; i < 26; i++) { const x = 440 + r() * 120, y = 330 + r() * 70, d = tfall + 1.0 + i * 0.12;
        const pt = mk('circle', { cx: x, cy: y, r: 1.6 + r() * 2.6, fill: '#fff4d6', opacity: 0, filter: `url(#g${uid})` }, svg);
        tl.to(pt, { opacity: 0.9, duration: 0.3 }, d); tl.to(pt, { y: -(140 + r() * 180), x: (r() - 0.5) * 120, duration: 2.6, ease: 'power1.out' }, d); tl.to(pt, { opacity: 0, duration: 0.8 }, d + 1.8); }
      const t = text(svg, 500, 376, '神没有洒', { s: 46, c: '#3a2a12', ls: '0.2em' }); SHOW(tl, t, AT(s.stay ?? s.fall) + 1.0);
    },
    // 瓦器：苏巴朗《四个器皿的静物》（约1650）里那只红陶罐——镜头慢慢推近 → 罐身上裂开细纹（暗线，一路分叉）→
    // （第二场）裂纹越来越多，裂纹里透出金光，光芒往外放，光点往上飘：罐子一直在裂，宝贝一直没丢
    jar({ tl, el, AT, s }) {
      const { svg, defs, uid, soft, blur } = base(el);
      const K = 0.8, CX = 1447, CY = 762, OX = 500 - CX * K, OY = 280 - CY * K;   // 原图 2560×1490：罐子 x 1285–1610，y 480–1045
      const dark = grad(defs, 'dk' + uid, 'radialGradient', { cx: 500, cy: 280, r: 560 }, [[0, '#0b0806', 0.9], [0.62, '#0b0806', 0.78], [1, '#0b0806', 0]]);
      mk('ellipse', { cx: 500, cy: 285, rx: 640, ry: 430, fill: dark }, svg);
      const mg = grad(defs, 'jm' + uid, 'radialGradient', { cx: 500, cy: 285, r: 420 }, [[0, '#fff'], [0.5, '#fff'], [1, '#000']]);
      const mask = mk('mask', { id: 'jk' + uid, maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: 1400, height: 960 }, defs);
      mk('rect', { x: -200, y: -200, width: 1400, height: 960, fill: mg }, mask);
      const cam = mk('g', { opacity: 0 }, svg);
      mk('image', { href: 'img/zurbaran.jpg', x: OX, y: OY, width: 2560 * K, height: 1490 * K, preserveAspectRatio: 'none', mask: `url(#jk${uid})` }, cam);
      const art = mk('g', { transform: `translate(${OX},${OY}) scale(${K})` }, cam);   // 以下坐标都是原图像素
      // 罐里透出来的暖光（只在罐肚里）
      mk('ellipse', { cx: CX, cy: 925, rx: 162, ry: 118 }, mk('clipPath', { id: 'jb' + uid }, defs));
      const warm = grad(defs, 'jw' + uid, 'radialGradient', { cx: CX, cy: 915, r: 190 }, [[0, '#ffe7a6', 0.85], [0.6, GOLD, 0.35], [1, GOLD, 0]]);
      const inner = mk('ellipse', { cx: CX, cy: 915, rx: 170, ry: 125, fill: warm, opacity: 0, 'clip-path': `url(#jb${uid})`, style: 'mix-blend-mode:screen' }, art);
      // 裂纹：从几处起头，锯齿状地往前裂（每一小段都拐一下，但大方向不变），偶尔分一个短叉，不出罐身（罐肚 + 细颈）
      const R = rng(s.seed || 5), cr = [];
      const ok = (x, y) => ((x - CX) / 150) ** 2 + ((y - 925) / 104) ** 2 < 1 || (x > 1420 && x < 1466 && y > 560 && y < 800);
      const grow = (x, y, a0, len, depth, t, main) => {
        const pts = [[x, y]], n = 13 + Math.floor(R() * 6), st = len / n, kids = []; let a = a0;
        for (let i = 0; i < n; i++) {
          a = a0 + (a - a0) * 0.45 + (R() - 0.5) * 1.25; const l = st * (0.6 + R() * 0.8), nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l;
          if (!ok(nx, ny)) break;
          x = nx; y = ny; pts.push([x, y]);
          if (depth < 1 && i > 2 && R() < 0.16) kids.push([x, y, a0 + (R() < 0.5 ? 1 : -1) * (0.6 + R() * 0.5), len * 0.38, depth + 1, t + (i + 1) / n * 0.5]);
        }
        if (pts.length > 3) cr.push({ d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L'), depth, t, main, mid: pts[pts.length >> 1] });
        kids.forEach(k => grow(...k, main));
      };
      [[1318, 902, 0.12, 270], [1452, 600, 1.57, 190], [1560, 850, 2.4, 150], [1330, 975, -0.08, 220], [1588, 960, 3.3, 170], [1447, 820, 1.25, 150]]
        .forEach(([x, y, a, len], k) => grow(x, y, a, len, 0, k ? 0.3 + (k - 1) * 0.34 : 0, k));
      const dk = [], au = [];
      cr.forEach(c => {
        const g = line(art, c.d, { c: '#22100a', w: c.depth ? 1.7 : 2.6, glow: false }); dk.push(g);
        const hl = line(art, c.d, { c: 'rgba(255,214,168,.38)', w: 1.1, glow: false }); hl.setAttribute('transform', 'translate(1.4,1.6)'); g._p.push(...hl._p);
        const gl = line(art, c.d, { c: '#fff1c6', w: c.depth ? 1.4 : 2.0, gc: '#ffc860', gw: c.depth ? 9 : 14, go: 0.85 }); gsap.set(gl, { opacity: 0 }); au.push(gl);
      });
      const t0 = AT(s.at), z0 = s.z0 ?? 1;
      tl.to(cam, { opacity: 1, duration: 1.0 }, t0 - 0.2);
      tl.fromTo(cam, { scale: z0 }, { scale: z0 + (s.light ? 0.14 : 0.09), svgOrigin: '500 280', duration: s.light ? 20 : 9, ease: 'none', immediateRender: false }, t0 - 0.2);
      const tc = AT(s.crack);
      if (s.pre) cr.forEach((c, i) => { if (c.main === 0) { gsap.set([...dk[i]._p, ...au[i]._p], { strokeDashoffset: 0 }); } });
      cr.forEach((c, i) => { if (s.pre && c.main === 0) return; if (!s.light && c.main) return;
        const t = tc + c.t * (s.light ? 1 : 0.6), d = c.depth ? 0.35 : 0.55; DRAW(tl, dk[i], t, d); DRAW(tl, au[i], t, d); });
      tl.to(cam, { x: 5, duration: 0.05, ease: 'none' }, tc); tl.to(cam, { x: -4, duration: 0.07, ease: 'none' }, tc + 0.05); tl.to(cam, { x: 0, duration: 0.25, ease: 'power2.out' }, tc + 0.12);
      if (s.light !== undefined) {
        const tlit = AT(s.light);
        au.forEach((g, i) => tl.to(g, { opacity: 1, duration: 0.8, ease: 'power2.out' }, tlit + (i % 9) * 0.07));
        tl.to(inner, { opacity: 0.55, duration: 1.4 }, tlit + 0.2);
        // 光芒：从主裂纹的中段往外放
        const rayF = grad(defs, 'jr' + uid, 'radialGradient', { cx: CX, cy: 900, r: 700 }, [[0, '#fff1c8', 0.85], [0.3, '#f3d58e', 0.4], [1, GOLD, 0]]);
        const rays = mk('g', { opacity: 0, style: 'mix-blend-mode:screen' }, art);
        cr.filter(c => c.depth === 0).forEach((c, k) => { const [x, y] = c.mid, base = Math.atan2(y - 900, x - CX);
          for (let j = -1; j <= 1; j++) { const a = base + j * 0.38, w = 0.045 + (k + j + 3) % 3 * 0.018, L = 420 + ((k * 3 + j + 5) % 5) * 70;
            mk('path', { d: `M${x},${y} L${x + Math.cos(a - w) * L},${y + Math.sin(a - w) * L} L${x + Math.cos(a + w) * L},${y + Math.sin(a + w) * L} Z`, fill: rayF, filter: `url(#${soft})` }, rays); } });
        tl.to(rays, { opacity: 0.9, duration: 1.4, ease: 'power2.out' }, tlit + 0.3);
        tl.to(rays, { opacity: 0.6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: 7 }, tlit + 1.9);
        const halo = mk('ellipse', { cx: CX, cy: 900, rx: 260, ry: 220, fill: rayF, opacity: 0, filter: `url(#${blur})`, style: 'mix-blend-mode:screen' }, art);
        tl.to(halo, { opacity: 0.55, duration: 1.6 }, tlit + 0.4);
        const r2 = rng(17);
        for (let i = 0; i < 70; i++) { const c = cr[(i * 7) % cr.length], [x, y] = c.mid, d = tlit + 0.5 + i * (i < 20 ? 0.09 : 0.2);
          const pt = mk('circle', { cx: x, cy: y, r: 2.5 + r2() * 4, fill: '#fff4d6', opacity: 0, filter: `url(#g${uid})` }, art);
          tl.to(pt, { opacity: 0.95, duration: 0.3 }, d); tl.to(pt, { y: -(160 + r2() * 260), x: (r2() - 0.5) * 160, duration: 2.8, ease: 'power1.out' }, d); tl.to(pt, { opacity: 0, duration: 0.9 }, d + 1.9); }
        // 这一句放在罐子右边（镜头推近以后，罐子上下都顶到边了）
        const ta = text(svg, 848, 246, '罐子一直在裂，', { s: 34, c: PAPER, ls: '0.16em' }), tb = text(svg, 848, 300, '宝贝一直没丢。', { s: 34, c: GOLD, ls: '0.16em' });
        SHOW(tl, ta, tlit - 0.6); SHOW(tl, tb, tlit + 0.3);
      }
      const cap = text(svg, 985, 26, '苏巴朗《四个器皿的静物》 约1650', { s: 15, c: 'rgba(241,232,214,.55)', a: 'end', wt: 400, font: 'Noto Sans SC', ls: '0.1em' }); SHOW(tl, cap, t0 + 0.6, 0.8, { y: 0 });
    },
    // 散了一地 → 收拢：满屏散开的光点，汇到中间
    gather({ tl, el, AT, s }) {
      const { svg, glowId } = base(el);
      const r = rng(11), dots = [];
      for (let i = 0; i < 90; i++) {
        const x = 40 + r() * 920, y = 30 + r() * 500, rad = 4 + r() * 6;
        const d = mk('circle', { cx: x, cy: y, r: rad, fill: i % 5 ? PAPER : GOLD, opacity: 0, filter: `url(#${glowId})` }, svg);
        const a = (i / 90) * Math.PI * 2, R = 54 + (i % 5) * 13; dots.push([d, x, y, 500 + Math.cos(a) * R, 280 + Math.sin(a) * R]);
      }
      dots.forEach(([d], i) => tl.to(d, { opacity: 0.8, duration: 0.6 }, AT(s.at) + (i % 16) * 0.05));
      dots.forEach(([d, x, y, tx, ty], i) => tl.to(d, { attr: { cx: tx, cy: ty }, duration: 1.8, ease: 'power3.inOut' }, AT(s.gather) + (i % 8) * 0.04));
      const core = mk('circle', { cx: 500, cy: 280, r: 30, fill: '#fff1c8', opacity: 0, filter: `url(#${glowId})` }, svg);
      tl.to(core, { opacity: 1, attr: { r: 46 }, duration: 1.0 }, AT(s.gather) + 1.4);
      const t1 = text(svg, 500, 40, '散了一地', { s: 34, c: CORAL }), t2 = text(svg, 500, 540, '神来，是把人重新收拢起来', { s: 36, c: GOLD });
      SHOW(tl, t1, s.scatter !== undefined ? AT(s.scatter) - 0.05 : AT(s.at) + 0.4); tl.to(t1, { opacity: 0, duration: 0.6 }, AT(s.gather) + 0.5); SHOW(tl, t2, AT(s.gather) + 1.2);
    },
    // 神不是一块蛋糕：切开、分走 → 每个人得到的，都是整个的
    cake({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el);
      const cf = grad(defs, 'ck' + uid, 'radialGradient', { cx: 500, cy: 280, r: 170 }, [[0, '#fff0c4', 0.85], [0.7, '#e2bd76', 0.5], [1, '#b8873c', 0.4]]);
      const og = mk('radialGradient', { id: 'co' + uid }, defs); [[0, '#fff3d0', 0.95], [0.6, '#e9c47e', 0.6], [1, '#b8873c', 0.35]].forEach(([o, c, a]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, og));
      const cx = 500, cy = 280, R = 150, n = 8, slices = [];
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2 - Math.PI / 2, a1 = (i + 1) / n * Math.PI * 2 - Math.PI / 2;
        const p = mk('path', { d: `M${cx},${cy} L${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} A${R},${R} 0 0 1 ${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R} Z`, fill: cf, stroke: '#f3d79a', 'stroke-width': 2.5, opacity: 0 }, svg);
        slices.push([p, (a0 + a1) / 2]);
      }
      slices.forEach(([p]) => SHOW(tl, p, AT(s.at), 0.8, { y: 0 }));
      slices.forEach(([p, m], i) => tl.to(p, { x: Math.cos(m) * 140, y: Math.sin(m) * 110, duration: 1.2, ease: 'power2.out' }, AT(s.split) + i * 0.05));
      const q = text(svg, 500, 40, '人多了，每人就分得少？', { s: 36, c: CORAL }); SHOW(tl, q, AT(s.split) + 0.2);
      const t1 = AT(s.whole);
      slices.forEach(([p]) => tl.to(p, { opacity: 0, duration: 0.6 }, t1)); tl.to(q, { opacity: 0, duration: 0.5 }, t1);
      for (let i = 0; i < 7; i++) {
        const x = 150 + i * 116, c = mk('circle', { cx: x, cy: 300, r: 44, fill: `url(#co${uid})`, stroke: '#f6dfa6', 'stroke-width': 2.5, opacity: 0, filter: `url(#${glowId})` }, svg);
        tl.fromTo(c, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out', immediateRender: false }, t1 + 0.4 + i * 0.12);
      }
      const t2 = text(svg, 500, 420, '就像只照顾你一个人', { s: 38, c: GOLD, ls: '0.12em' }); SHOW(tl, t2, s.cap !== undefined ? AT(s.cap) : t1 + 1.4);
    },

    // 不是木头雕的，不是石头雕的，是我们自己想出来的：一尊木像（木纹）、一尊石像（石头的颗粒），画出来、划掉；
    // 第三尊在脑袋里：头像侧影里，一尊发着光的像
    idol({ tl, el, AT, s }) {
      const { svg, defs, uid, soft } = base(el);
      const noise = mk('filter', { id: 'n' + uid, x: 0, y: 0, width: '100%', height: '100%' }, defs);
      mk('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 2, seed: 4, result: 't' }, noise);
      mk('feColorMatrix', { in: 't', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0', result: 'a' }, noise);
      mk('feComposite', { in: 'a', in2: 'SourceGraphic', operator: 'in', result: 'g' }, noise);
      mk('feMerge', {}, noise).append(mk('feMergeNode', { in: 'SourceGraphic' }), mk('feMergeNode', { in: 'g' }));
      const woodF = grad(defs, 'wd' + uid, 'linearGradient', { x1: 110, y1: 0, x2: 230, y2: 0 }, [[0, '#4a2a12'], [0.25, '#8e5a2c'], [0.5, '#c58d55'], [0.75, '#8a552a'], [1, '#43260f']]);
      const stoneF = grad(defs, 'st' + uid, 'linearGradient', { x1: 360, y1: 0, x2: 480, y2: 0 }, [[0, '#76736c'], [0.35, '#d9d5cb'], [0.6, '#bdb9ae'], [1, '#6f6b64']]);
      const shg = mk('radialGradient', { id: 'sh' + uid }, defs); mk('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.6 }, shg); mk('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }, shg);
      const shadowF = `url(#sh${uid})`;
      const fig = (x, k) => [`M${x},${126 * k + 28} m-${34 * k},0 a${34 * k},${40 * k} 0 1,0 ${68 * k},0 a${34 * k},${40 * k} 0 1,0 -${68 * k},0`,
        `M${x - 34 * k},${214 * k} C${x - 44 * k},${240 * k} ${x - 44 * k},${262 * k} ${x - 38 * k},${282 * k} L${x - 50 * k},${380 * k} C${x - 52 * k},${396 * k} ${x - 40 * k},${404 * k} ${x - 24 * k},${404 * k} L${x + 24 * k},${404 * k} C${x + 40 * k},${404 * k} ${x + 52 * k},${396 * k} ${x + 50 * k},${380 * k} L${x + 38 * k},${282 * k} C${x + 44 * k},${262 * k} ${x + 44 * k},${240 * k} ${x + 34 * k},${214 * k} Z`];
      const statue = (x, fill, extra) => { const g = mk('g', { opacity: 0 }, svg);
        mk('ellipse', { cx: x, cy: 428, rx: 96, ry: 15, fill: shadowF }, g);
        const [h, b] = fig(x, 1); mk('path', { d: h + ' ' + b, fill, filter: extra }, g);
        mk('rect', { x: x - 62, y: 404, width: 124, height: 20, rx: 4, fill, filter: extra }, g);
        return g; };
      const wood = statue(160, woodF), stone = statue(410, stoneF, `url(#n${uid})`);
      // 木纹、刻痕；石像的衣褶
      ['M140,230 C150,300 136,350 146,400', 'M160,226 C170,300 156,352 164,402', 'M182,232 C174,300 188,350 178,400', 'M146,262 C156,276 184,276 194,262'].forEach(d => mk('path', { d, fill: 'none', stroke: '#2e1808', 'stroke-width': 2, opacity: 0.45 }, wood));
      [[148, 150], [172, 150]].forEach(([x, y]) => mk('path', { d: `M${x - 7},${y} L${x + 7},${y}`, stroke: '#2e1808', 'stroke-width': 3, 'stroke-linecap': 'round' }, wood));
      mk('path', { d: 'M152,176 L168,176', stroke: '#2e1808', 'stroke-width': 3, 'stroke-linecap': 'round' }, wood);
      ['M392,240 C404,280 398,330 404,398', 'M420,236 C428,290 416,340 424,400', 'M446,244 C436,290 446,340 438,398'].forEach(d => mk('path', { d, fill: 'none', stroke: '#5c5852', 'stroke-width': 2, opacity: 0.5 }, stone));
      const tw = text(svg, 160, 474, '木头雕的', { s: 30, c: '#d9a877', ls: '0.2em' }), ts = text(svg, 410, 474, '石头雕的', { s: 30, c: '#c9cdd3', ls: '0.2em' });
      const X = x => line(svg, `M${x - 74},160 L${x + 74},410 M${x + 74},160 L${x - 74},410`, { c: CORAL, w: 5, go: 0.5 });
      const x1 = X(160), x2 = X(410);
      // 脑袋里的那一尊
      const HEAD = 'M640,476 C626,436 614,386 618,336 C626,242 694,176 772,178 C846,182 892,242 886,312 C884,338 894,354 908,372 C916,384 908,394 894,396 L890,424 C888,440 872,446 854,444 L834,442 L830,476';
      const head = line(svg, HEAD, { c: GOLD, w: 3.5, go: 0.45 });
      const innerF = grad(defs, 'in' + uid, 'radialGradient', { cx: 762, cy: 300, r: 120 }, [[0, '#fff6dc', 1], [0.55, '#f0cd84', 0.95], [1, '#c4923f', 0.85]]);
      const halo = mk('circle', { cx: 762, cy: 300, r: 120, fill: GOLD, opacity: 0, filter: `url(#${soft})` }, svg);
      const ig = mk('g', { opacity: 0, filter: `url(#g${uid})` }, svg); { const [h, b] = fig(762 / 0.58, 1); mk('path', { d: h + ' ' + b, fill: innerF, transform: 'scale(0.58) translate(0,258)' }, ig); }
      const spark = [[690, 230], [842, 250], [700, 380], [836, 368], [762, 196]].map(([x, y]) => mk('path', { d: `M${x},${y - 9} L${x + 2.5},${y - 2.5} L${x + 9},${y} L${x + 2.5},${y + 2.5} L${x},${y + 9} L${x - 2.5},${y + 2.5} L${x - 9},${y} L${x - 2.5},${y - 2.5} Z`, fill: '#fff4d6', opacity: 0 }, svg));
      const tm = text(svg, 762, 530, '我们自己想出来的', { s: 34, c: CORAL, ls: '0.16em' });
      const t1 = AT(s.at), t2 = AT(s.stone), t3 = AT(s.mind);
      SHOW(tl, wood, t1 - 0.2, 0.9, { y: 16 }); SHOW(tl, tw, t1 + 0.3); DRAW(tl, x1, t1 + 1.0, 0.5);
      SHOW(tl, stone, t2 - 0.2, 0.9, { y: 16 }); SHOW(tl, ts, t2 + 0.3); DRAW(tl, x2, t2 + 1.0, 0.5);
      DRAW(tl, head, t3 - 0.2, 1.3); tl.to(ig, { opacity: 1, duration: 1.0 }, t3 + 0.5); tl.to(halo, { opacity: 0.4, duration: 1.2 }, t3 + 0.8); SHOW(tl, tm, t3 + 0.9);
      spark.forEach((p, i) => { const d = t3 + 1.0 + i * 0.25; tl.fromTo(p, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, d); tl.to(p, { opacity: 0.25, scale: 0.6, duration: 0.8 }, d + 0.5); });
      tl.to([wood, stone, tw, ts, x1, x2], { opacity: 0.3, duration: 0.8 }, t3 + 0.3);
    },
    // 陪着你把错误的想法走到底，让你自己撞上墙：一条路画出来，两个点沿着路走，撞到墙上
    wall({ tl, el, AT, s }) {
      // 陪你把错误的想法走到底：一条路，两点光（你的想法，和陪着你的奥古斯丁）一起走到尽头，撞上一堵石墙
      const { svg, glowId } = base(el);
      const P = 'M90,380 C220,380 260,250 390,262 C520,274 560,360 700,330 L756,318';
      const road = line(svg, P, { c: PAPER, w: 2.6, go: 0.25 });
      const wall = mk('g', { opacity: 0 }, svg);
      for (let r = 0; r < 8; r++) for (let c = -1; c < 2; c++) {                      // 石块：错缝砌，深色石面、上沿一道细高光
        const x = 770 + c * 48 + (r % 2 ? 24 : 0), y = 110 + r * 45, x0 = Math.max(770, x), x1 = Math.min(866, x + 46);
        if (x1 - x0 < 8) continue;
        mk('rect', { x: x0, y: y + 1, width: x1 - x0 - 2, height: 42, rx: 3, fill: '#3a2f26', 'fill-opacity': 0.92, stroke: '#8f6c50', 'stroke-width': 1.2 }, wall);
        mk('path', { d: `M${x0 + 3},${y + 3} L${x1 - 5},${y + 3}`, stroke: '#e8c9a0', 'stroke-width': 1.2, opacity: 0.45 }, wall);
      }
      const me = mk('circle', { cx: 90, cy: 380, r: 13, fill: PAPER, opacity: 0, filter: `url(#${glowId})` }, svg);
      const au = mk('circle', { cx: 60, cy: 392, r: 11, fill: GOLD, opacity: 0, filter: `url(#${glowId})` }, svg);
      const t1 = text(svg, 120, 450, '错误的想法', { s: 30, c: PAPER }), t2 = text(svg, 300, 520, '奥古斯丁陪你一起走', { s: 30, c: GOLD });
      const t0 = AT(s.at);
      DRAW(tl, road, t0, 1.6); tl.fromTo(wall, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 1.0, ease: 'power2.out', immediateRender: false }, t0 + 0.6);
      tl.to([me, au], { opacity: 1, duration: 0.6 }, t0 + 0.4); SHOW(tl, t1, t0 + 0.5); SHOW(tl, t2, t0 + 1.2);
      // 两个点的位置全由这两段“进度”算出来（逐帧定位时也对）：从出现起走到撞墙，撞墙后往回弹一点
      const pos = (c, q, dx = 0) => { const L = road._m.getTotalLength(), pt = road._m.getPointAtLength(Math.max(0, Math.min(1, q)) * L); c.setAttribute('cx', pt.x - dx); c.setAttribute('cy', pt.y); };
      const th = AT(s.hit), ts = t0 + 0.4, D = th - ts, walk = Math.max(1.5, Math.min(D, th - t0 - 0.6)), o = { p: 0 }, b = { p: 0 };
      tl.to(o, { p: 1, duration: D, ease: 'none', onUpdate: () => { const q = Math.max(0, (o.p * D - (D - walk)) / walk) ** 1.6; pos(me, 0.1 + 0.9 * q); pos(au, 0.9 * q); } }, ts);
      tl.to(wall, { x: 5, duration: 0.07, ease: 'none' }, th); tl.to(wall, { x: -3, duration: 0.09, ease: 'none' }, th + 0.07); tl.to(wall, { x: 0, duration: 0.25, ease: 'power2.out' }, th + 0.16);
      tl.to(b, { p: 1, duration: 0.5, ease: 'power2.out', onUpdate: () => pos(me, 1, 40 * b.p) }, th + 0.02);
      // 撞上：一圈光环散开，几粒火星往后溅
      const ring = mk('circle', { cx: 756, cy: 318, r: 10, fill: 'none', stroke: '#fff1d6', 'stroke-width': 2, opacity: 0 }, svg);
      tl.fromTo(ring, { attr: { r: 10 }, opacity: 0.9 }, { attr: { r: 64 }, opacity: 0, duration: 0.8, ease: 'power2.out', immediateRender: false }, th);
      const rr = rng(13);
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.62 + rr() * 0.76), d = 40 + rr() * 60, sp = mk('circle', { cx: 750, cy: 318, r: 2 + rr() * 2, fill: '#ffe2b0', opacity: 0, filter: `url(#${glowId})` }, svg);
        tl.fromTo(sp, { x: 0, y: 0, opacity: 1 }, { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 + 10, opacity: 0, duration: 0.7 + rr() * 0.3, ease: 'power2.out', immediateRender: false }, th + 0.02); }
      const tH = text(svg, 818, 80, '撞上墙', { s: 44, c: CORAL }); SHOW(tl, tH, th + 0.2);
      const tE = text(svg, 450, 160, '——自己发现：这条路走不通', { s: 34, c: GOLD }); SHOW(tl, tE, th + 1.0);
    },
    // 神像空气一样，摊在整个宇宙里，每个地方分到薄薄一层？——不是这样
    thin({ tl, el, AT, s }) {
      // 神像空气一样摊在整个宇宙里，每个地方分到薄薄一层？一片星空里，一团金光慢慢摊成薄薄的一层 →“不是这样的”：这层薄光散成光点，消失
      const { svg, defs, uid, glowId } = base(el);
      const r = rng(7), stars = [];
      for (let i = 0; i < 110; i++) stars.push(mk('circle', { cx: 120 + r() * 760, cy: 70 + r() * 410, r: 0.7 + r() * 1.7, fill: '#f6eeda', opacity: 0 }, svg));
      const frame = line(svg, 'M110,58 L890,58 L890,492 L110,492 Z', { c: PAPER, w: 1.6, go: 0.12 });
      const lab = text(svg, 140, 100, '宇宙', { s: 30, a: 'start', c: PAPER, wt: 400 });
      const mist = mk('ellipse', { cx: 500, cy: 280, rx: 110, ry: 110, fill: grad(defs, 'tm' + uid, 'radialGradient', { cx: 500, cy: 280, r: 1, gradientUnits: 'objectBoundingBox' }, []), opacity: 0 }, svg);
      const mg = mk('radialGradient', { id: 'tg' + uid }, defs); mk('stop', { offset: 0, 'stop-color': '#fff3d0', 'stop-opacity': 0.95 }, mg); mk('stop', { offset: 0.55, 'stop-color': GOLD, 'stop-opacity': 0.55 }, mg); mk('stop', { offset: 1, 'stop-color': GOLD, 'stop-opacity': 0 }, mg);
      mist.setAttribute('fill', `url(#tg${uid})`);
      const t0 = AT(s.at), tsp = AT(s.spread), tno = AT(s.no);
      stars.forEach((st, i) => { const o = 0.25 + r() * 0.65; tl.to(st, { opacity: o, duration: 1.2, ease: 'sine.out' }, t0 + (i % 17) * 0.05);
        if (i % 4 === 0) tl.to(st, { opacity: o * 0.35, duration: 1.4 + r(), ease: 'sine.inOut', yoyo: true, repeat: 5 }, t0 + 1.4 + (i % 7) * 0.3); });
      DRAW(tl, frame, t0, 1.4); SHOW(tl, lab, tsp + 0.75);
      tl.to(mist, { opacity: 1, duration: 1.0, ease: 'sine.out' }, t0 + 0.4);
      tl.to(mist, { attr: { rx: 380, ry: 13 }, opacity: 0.6, duration: 2.6, ease: 'power2.inOut' }, tsp);
      const t1 = text(svg, 500, 232, '每个地方，分到薄薄的一层？', { s: 36, c: '#e8f1f8' }); SHOW(tl, t1, tsp + 1.4);
      // 不是这样：薄薄的那一层碎成光点，往上散掉
      tl.to(mist, { opacity: 0, duration: 0.7, ease: 'power1.in' }, tno);
      for (let i = 0; i < 30; i++) { const x = 130 + i * 25 + r() * 10, d = tno + Math.abs(i - 15) * 0.02, m = mk('circle', { cx: x, cy: 280 + (r() - 0.5) * 12, r: 1.6 + r() * 2.2, fill: '#ffe9b5', opacity: 0, filter: `url(#${glowId})` }, svg);
        tl.fromTo(m, { opacity: 0.95, y: 0 }, { opacity: 0, y: -(30 + r() * 70), duration: 1.2 + r() * 0.6, ease: 'power1.out', immediateRender: false }, d); }
      tl.to(t1, { opacity: 0.35, duration: 0.8 }, tno + 0.2);
      const t2 = text(svg, 500, 545, '不是这样的', { s: 44, c: CORAL }); SHOW(tl, t2, tno + 0.3);
    },
    // 好像神切下来一块，放进世界里，全世界共用这一块——那剩下的神呢？（切走的地方留一道虚线）
    slice({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el);
      const cx = 290, cy = 290, R = 160, a0 = -0.42, a1 = 0.42, P = (a, r = R) => `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
      const gf = grad(defs, 'sg' + uid, 'radialGradient', { cx, cy, r: R }, [[0, '#fff2c8', 0.75], [0.55, '#e9c47e', 0.42], [1, '#b8873c', 0.3]]);
      const halo = mk('circle', { cx, cy, r: R + 40, fill: grad(defs, 'sh' + uid, 'radialGradient', { cx, cy, r: R + 60 }, [[0.6, GOLD, 0.25], [1, GOLD, 0]]), opacity: 0 }, svg);
      const rest = mk('path', { d: `M${cx},${cy} L${P(a1)} A${R},${R} 0 1 1 ${P(a0)} Z`, fill: gf, stroke: '#f3d79a', 'stroke-width': 2.5, opacity: 0 }, svg);
      const ghost = mk('path', { d: `M${cx},${cy} L${P(a0)} A${R},${R} 0 0 1 ${P(a1)} Z`, fill: 'none', stroke: '#f3d79a', 'stroke-width': 2, 'stroke-dasharray': '7 7', opacity: 0 }, svg);
      const wedge = mk('path', { d: `M${cx},${cy} L${P(a0)} A${R},${R} 0 0 1 ${P(a1)} Z`, fill: gf, stroke: '#fff0c8', 'stroke-width': 2.5, opacity: 0, filter: `url(#${glowId})` }, svg);
      const box = line(svg, 'M610,140 L930,140 L930,440 L610,440 Z', { c: PAPER, w: 3 });
      const tg = text(svg, cx, 512, '神', { s: 40, c: GOLD, ls: '0.2em' }), tw = text(svg, 770, 115, '世界', { s: 34, ls: '0.3em' });
      SHOW(tl, rest, AT(s.at), 0.8, { y: 0 }); SHOW(tl, wedge, AT(s.at), 0.8, { y: 0 }); tl.to(halo, { opacity: 1, duration: 1.0 }, AT(s.at)); SHOW(tl, tg, AT(s.at) + 0.3);
      const tW = s.world !== undefined ? AT(s.world) : AT(s.cut) + 0.4;
      DRAW(tl, box, tW - 0.5, 0.9); SHOW(tl, tw, tW - 0.05);
      tl.to(wedge, { x: 46, duration: 0.6, ease: 'power2.out' }, AT(s.cut)); tl.to(ghost, { opacity: 0.8, duration: 0.6 }, AT(s.cut) + 0.3);
      tl.to(wedge, { x: 400, y: 0, duration: 1.3, ease: 'power2.inOut' }, tW);
      if (s.share !== undefined) {                                           // 全世界共用这一块：世界里的东西都连到这一块上
        const r = rng(5), w = [cx + 400 + 0.62 * R, cy];
        for (let i = 0; i < 12; i++) {
          let x = 640 + r() * 260, y = 165 + r() * 250; if (Math.hypot(x - w[0], y - w[1]) < 90) y = y < cy ? y - 70 : y + 70;
          y = Math.max(160, Math.min(425, y));
          const d = mk('circle', { cx: x, cy: y, r: 6, fill: PAPER, opacity: 0, filter: `url(#${glowId})` }, svg);
          const l = line(svg, `M${x},${y} L${w[0]},${w[1]}`, { c: GOLD, w: 1.4, go: 0.3 });
          const t = AT(s.share) + i * 0.06; tl.to(d, { opacity: 0.95, duration: 0.4 }, t); DRAW(tl, l, t + 0.2, 0.5);
        }
      }
      const tq = text(svg, cx, 78, '剩下的神呢？', { s: 42, c: CORAL, ls: '0.12em' });
      tl.to(rest, { opacity: 0.45, duration: 0.8 }, AT(s.rest)); tl.to(ghost, { opacity: 1, duration: 0.4 }, AT(s.rest)); SHOW(tl, tq, AT(s.rest) + 0.2);
      tl.fromTo(ghost, { scale: 1, svgOrigin: `${cx} ${cy}` }, { scale: 1.06, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 3, immediateRender: false }, AT(s.rest) + 0.3);
    },
    // 剥洋葱：一圈一圈画出来，再从外往里一层层剥掉
    onion({ tl, el, AT, s }) {
      const { svg, glowId } = base(el);
      const rings = [];
      for (let i = 0; i < 6; i++) rings.push(mk('ellipse', { cx: 500, cy: 280, rx: 250 - i * 36, ry: 220 - i * 32, fill: 'none', stroke: i % 2 ? GOLD : PAPER, 'stroke-width': 3.5, opacity: 0 }, svg));
      const core = mk('circle', { cx: 500, cy: 280, r: 26, fill: GOLD, opacity: 0, filter: `url(#${glowId})` }, svg);
      rings.forEach((c, i) => tl.fromTo(c, { opacity: 0, scale: 0.7, transformOrigin: '50% 50%' }, { opacity: 0.9, scale: 1, duration: 0.8, ease: 'power2.out', immediateRender: false }, AT(s.at) + i * 0.12));
      const tp = AT(s.peel);
      rings.slice(0, 4).forEach((c, i) => tl.to(c, { scale: 1.25, opacity: 0, duration: 1.0, ease: 'power2.in', transformOrigin: '50% 50%' }, tp + i * 0.55));
      tl.to(core, { opacity: 1, attr: { r: 34 }, duration: 0.9 }, tp + 2.0);
      const t = text(svg, 500, 545, '一层一层往下剥', { s: 38, c: GOLD }); SHOW(tl, t, tp + 0.3);
    },
    // 大的分得多、小的分得少？标签一换：大象/麻雀 → 大教会/小团契 → 大教堂/出租屋 → 有名的牧师/最后一排
    scale({ tl, el, AT, s }) {
      // 大的分得多、小的分得少？两只玻璃器皿（一大一小）盛着金色的光：大的盛得多，小的只有一点；标签一换再换
      const { svg, defs, uid, glowId } = base(el);
      const V1 = 'M150,150 L150,430 Q150,462 182,462 L478,462 Q510,462 510,430 L510,150', V2 = 'M690,330 L690,442 Q690,462 710,462 L830,462 Q850,462 850,442 L850,330';
      mk('path', { d: V1 + ' Z' }, mk('clipPath', { id: 'v1' + uid }, defs)); mk('path', { d: V2 + ' Z' }, mk('clipPath', { id: 'v2' + uid }, defs));
      const glass = grad(defs, 'vg' + uid, 'linearGradient', { x1: 0, y1: 0, x2: 1, y2: 0, gradientUnits: 'objectBoundingBox' }, [[0, '#eaf6ff', 0.2], [0.15, '#eaf6ff', 0.05], [0.85, '#eaf6ff', 0.04], [1, '#eaf6ff', 0.16]]);
      const liq = grad(defs, 'vl' + uid, 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1, gradientUnits: 'objectBoundingBox' }, [[0, '#fff2c8', 0.95], [0.4, '#ebc883', 0.92], [1, '#a9792f', 0.95]]);
      const body1 = mk('path', { d: V1 + ' Z', fill: glass, opacity: 0 }, svg), body2 = mk('path', { d: V2 + ' Z', fill: glass, opacity: 0 }, svg);
      const in1 = mk('g', { 'clip-path': `url(#v1${uid})` }, svg), in2 = mk('g', { 'clip-path': `url(#v2${uid})` }, svg);
      const l1 = mk('g', {}, in1), l2 = mk('g', {}, in2);
      mk('rect', { x: 140, y: 0, width: 380, height: 520, fill: liq }, l1); mk('ellipse', { cx: 330, cy: 0, rx: 190, ry: 8, fill: '#fff6dc', opacity: 0.8 }, l1);
      mk('rect', { x: 680, y: 0, width: 180, height: 200, fill: liq }, l2); mk('ellipse', { cx: 770, cy: 0, rx: 90, ry: 5, fill: '#fff6dc', opacity: 0.8 }, l2);
      gsap.set(l1, { y: 470 }); gsap.set(l2, { y: 470 });
      const glow1 = mk('ellipse', { cx: 330, cy: 330, rx: 230, ry: 170, fill: GOLD, opacity: 0, filter: `url(#b${uid})` }, svg), glow2 = mk('ellipse', { cx: 770, cy: 440, rx: 90, ry: 30, fill: GOLD, opacity: 0, filter: `url(#b${uid})` }, svg);
      svg.insertBefore(glow1, body1); svg.insertBefore(glow2, body1);
      const b1 = line(svg, V1, { c: PAPER, w: 3.4, go: 0.3 }), b2 = line(svg, V2, { c: PAPER, w: 3.4, go: 0.3 });
      const r1 = line(svg, 'M150,150 A180,9 0 1 0 510,150 A180,9 0 1 0 150,150', { c: PAPER, w: 2, go: 0.2 }), r2 = line(svg, 'M690,330 A80,5 0 1 0 850,330 A80,5 0 1 0 690,330', { c: PAPER, w: 2, go: 0.2 });
      DRAW(tl, b1, AT(s.at) - 0.3, 1.1); DRAW(tl, r1, AT(s.at) + 0.5, 0.6); DRAW(tl, b2, AT(s.at) - 0.1, 0.9); DRAW(tl, r2, AT(s.at) + 0.6, 0.5);
      tl.to([body1, body2], { opacity: 1, duration: 1.0 }, AT(s.at));
      const tf = AT(s.fill);
      tl.to(l1, { y: 205, duration: 2.0, ease: 'power2.inOut' }, tf); tl.to(l2, { y: 436, duration: 1.4, ease: 'power2.inOut' }, tf + 0.2);
      tl.to(glow1, { opacity: 0.22, duration: 1.6 }, tf + 0.4); tl.to(glow2, { opacity: 0.16, duration: 1.2 }, tf + 0.5);
      const leg = text(svg, 500, 535, '金色 = 分到的神', { s: 28, c: PAPER, wt: 400 }); SHOW(tl, leg, tf + 0.8);
      let prev = null;
      s.pairs.forEach(([at, big, small, at2], i) => {
        const g = mk('g', {}, svg), gb = mk('g', { opacity: 0 }, g), gs = mk('g', { opacity: 0 }, g);
        text(gb, 330, 118, big, { s: big.length > 4 ? 40 : 46, c: PAPER }); text(gs, 770, 300, small, { s: small.length > 4 ? 32 : 40, c: PAPER });
        const t = AT(at), t2 = at2 !== undefined ? AT(at2) : t;
        if (prev) tl.to(prev, { opacity: 0, y: -8, duration: 0.5 }, t - 0.25);
        tl.fromTo(gb, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', immediateRender: false }, t + (i ? 0.1 : -0.3));
        tl.fromTo(gs, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', immediateRender: false }, t2 - 0.05);
        prev = g;
      });
    },
    // 抓住什么，心就被什么扯过去：一颗心（中间写着“中心”，后面一团暖光）→ 中心没了，光暗下去 → 几根线往外扯，每扯一下裂一道
    pull({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el);
      const HEART = 'M500,378 C500,378 378,296 378,214 C378,160 424,130 463,138 C484,142 500,160 500,177 C500,160 516,142 537,138 C576,130 622,160 622,214 C622,296 500,378 500,378 Z';
      const hb = mk('ellipse', { cx: 500, cy: 245, rx: 190, ry: 165, fill: grad(defs, 'hg' + uid, 'radialGradient', { cx: 500, cy: 240, r: 190 }, [[0, '#ffe6a6', 0.6], [0.6, GOLD, 0.18], [1, GOLD, 0]]), opacity: 0 }, svg);
      const h = line(svg, HEART, { c: GOLD, w: 5, go: 0.55 });
      const hc = text(svg, 500, 254, '中心', { s: 36, c: GOLD, ls: '0.35em' });
      const t0 = AT(s.at);
      DRAW(tl, h, t0, 1.3); tl.to(hb, { opacity: 1, duration: 1.2 }, t0 + 0.4); SHOW(tl, hc, s.center !== undefined ? AT(s.center) : t0 + 0.8);
      if (s.lost !== undefined) { tl.to(hb, { opacity: 0.25, duration: 0.9 }, AT(s.lost)); tl.to(hc, { opacity: 0.15, duration: 0.9 }, AT(s.lost)); }
      const pos = [[150, 112], [850, 112], [112, 372], [888, 372], [500, 532]];
      const CR = ['M452,172 L476,214 L458,250', 'M548,168 L524,212 L548,254', 'M414,232 L454,262 L436,304', 'M586,238 L546,266 L568,310', 'M500,268 L486,306 L508,336 L497,362'];
      (s.items || []).forEach(([label, at], i) => {
        const [x, y] = pos[i % pos.length], T = AT(at), dx = (x - 500) / 28, dy = (y - 255) / 28;
        const l = line(svg, `M${500 + dx * 4.2},${255 + dy * 3.4} L${x + (500 - x) * 0.13},${y + (255 - y) * 0.13 - 12}`, { c: CORAL, w: 2.2, go: 0.45 }); DRAW(tl, l, T, 0.5);
        const t = text(svg, x, y + 14, label, { s: 44, c: CORAL, ls: '0.12em' }); SHOW(tl, t, T + 0.15, 0.5);
        tl.to(h, { x: dx, y: dy, duration: 0.25, ease: 'power2.out' }, T + 0.1); tl.to(h, { x: 0, y: 0, duration: 0.5, ease: 'power2.inOut' }, T + 0.35);
        const c = line(svg, CR[i % CR.length], { c: CORAL, w: 3, go: 0.6 }); DRAW(tl, c, T + 0.3, 0.35);
      });
      if (s.end !== undefined) tl.to([h, hb], { opacity: 0.35, duration: 0.8 }, AT(s.end));
    },
    // 你家、医院：神不是分一小块在这儿——在这儿，是整个地在
    home({ tl, el, AT, s }) {
      const { svg, defs, glowId } = base(el);
      const rg = mk('radialGradient', { id: 'h' + glowId }, defs);
      mk('stop', { offset: 0, 'stop-color': '#fff3d0', 'stop-opacity': 0.9 }, rg); mk('stop', { offset: 0.55, 'stop-color': GOLD, 'stop-opacity': 0.45 }, rg); mk('stop', { offset: 1, 'stop-color': GOLD, 'stop-opacity': 0 }, rg);
      const g1 = mk('ellipse', { cx: 270, cy: 320, rx: 210, ry: 200, fill: `url(#h${glowId})`, opacity: 0 }, svg), g2 = mk('ellipse', { cx: 730, cy: 320, rx: 210, ry: 200, fill: `url(#h${glowId})`, opacity: 0 }, svg);
      const house = line(svg, 'M140,300 L270,186 L400,300 M170,276 L170,440 L370,440 L370,276 M244,440 L244,366 L296,366 L296,440', { c: PAPER, w: 4 });
      const hosp = line(svg, 'M610,440 L610,214 L850,214 L850,440 Z M700,440 L700,376 L760,376 L760,440 M640,250 L690,250 M770,250 L820,250 M640,310 L690,310 M770,310 L820,310', { c: PAPER, w: 4 });
      const cross = line(svg, 'M730,236 L730,322 M688,279 L772,279', { c: CORAL, w: 7 });
      const l1 = text(svg, 270, 498, '家里', { s: 36, ls: '0.2em' }), l2 = text(svg, 730, 498, '医院', { s: 36 });
      DRAW(tl, house, AT(s.at), 1.2); SHOW(tl, l1, AT(s.at) + 0.5);
      DRAW(tl, hosp, AT(s.hosp), 1.2); DRAW(tl, cross, AT(s.hosp) + 0.8, 0.5); SHOW(tl, l2, AT(s.hosp) + 0.5);
      const w1 = text(svg, 270, 120, '整个地在', { s: 42, c: GOLD }), w2 = text(svg, 730, 120, '整个地在', { s: 42, c: GOLD });
      tl.to(g1, { opacity: 1, duration: 1.2 }, AT(s.whole1)); SHOW(tl, w1, AT(s.whole1) + 0.3);
      tl.to(g2, { opacity: 1, duration: 1.2 }, AT(s.whole2)); SHOW(tl, w2, AT(s.whole2) + 0.3);
    },
    // 下一讲预告：“你究竟是什么？”——一圈称呼，念到哪个亮哪个
    litany({ tl, el, AT, s }) {
      const { svg, defs, glowId } = base(el);
      const rg = mk('radialGradient', { id: 'y' + glowId }, defs);
      mk('stop', { offset: 0, 'stop-color': '#fff3d0', 'stop-opacity': 0.75 }, rg); mk('stop', { offset: 1, 'stop-color': GOLD, 'stop-opacity': 0 }, rg);
      const sun = mk('circle', { cx: 500, cy: 280, r: 150, fill: `url(#y${glowId})`, opacity: 0 }, svg);
      const q = text(svg, 500, 296, s.center || '你究竟是什么？', { s: 46, c: '#fff3d0' });
      tl.to(sun, { opacity: 1, duration: 1.2 }, AT(s.at)); SHOW(tl, q, s.ask !== undefined ? AT(s.ask) - 0.05 : AT(s.at) + 0.2);   // 参数不能叫 q（lec.js 里 q 是原文卡）
      const n = s.items.length;
      s.items.forEach((w, i) => {
        const a = -Math.PI / 2 + i / n * Math.PI * 2, x = 500 + Math.cos(a) * 395, y = 290 + Math.sin(a) * 215;
        const t = text(svg, x, y + 14, w, { s: w.length > 3 ? 38 : 44, c: GOLD });
        tl.fromTo(t, { opacity: 0, scale: 0.92, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out', immediateRender: false }, AT(w) - 0.05);
      });
      tl.to(sun, { attr: { r: 210 }, duration: 3, ease: 'sine.inOut' }, AT(s.items[n - 1]));
    },

    // 作曲家和曲子：五线谱上一个一个音符出来，每个音符都牵着一根金线连回作曲家（他的心思在每个音符里）→ 框住曲子：
    // 作曲家装不进去 → 曲子奏完了，作曲家还在；他脑子里还有许多曲子 → 没有作曲家，一个音也没有
    composer({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 480);
      const halo = mk('ellipse', { cx: 165, cy: 250, rx: 165, ry: 190, fill: grad(defs, 'ch' + uid, 'radialGradient', { cx: 165, cy: 230, r: 180 }, [[0, '#ffe6a6', 0.6], [0.6, GOLD, 0.18], [1, GOLD, 0]]), opacity: 0 }, svg);
      const man = line(svg, circ(165, 172, 50) + ' M66,340 C72,268 114,244 165,244 C216,244 258,268 264,340', { c: PAPER, w: 5 });
      const pen = line(svg, 'M240,300 L294,214', { c: GOLD, w: 4 });
      const lab = text(svg, 165, 404, '作曲家', { s: 42, c: GOLD, ls: '0.2em' });
      const X0 = 330, X1 = 962, Y0 = 150, G = 32;
      const staff = line(svg, [0, 1, 2, 3, 4].map(i => `M${X0},${Y0 + i * G} L${X1},${Y0 + i * G}`).join(' '), { c: PAPER, w: 2.2, go: 0.18 });
      const title = text(svg, 646, 50, '一首交响乐', { s: 42, c: GOLD, ls: '0.24em' });
      const mel = [2, 4, 3, 5, 4, 6, 5, 3, 4, 2, 3, 1];
      const notes = mel.map((q, i) => {
        const x = X0 + 52 + i * ((X1 - X0 - 104) / (mel.length - 1)), y = Y0 + 4 * G - q * G / 2, up = q < 4;
        const g = mk('g', { opacity: 0 }, svg);
        mk('ellipse', { cx: x, cy: y, rx: 15.5, ry: 10.5, transform: `rotate(-22 ${x} ${y})`, fill: PAPER }, g);
        mk('path', { d: up ? `M${x + 14},${y - 4} L${x + 14},${y - 80}` : `M${x - 14},${y + 4} L${x - 14},${y + 80}`, stroke: PAPER, 'stroke-width': 3 }, g);
        return { g, x, y };
      });
      const threads = notes.map(({ x, y }, i) => line(svg, `M208,150 C${300 + i * 20},${40 - (i % 3) * 10} ${x - 50},${y - 120} ${x},${y - 12}`, { c: GOLD, w: 1.4, go: 0.55 }));
      const sweep = mk('rect', { x: X0 - 90, y: Y0 - 60, width: 90, height: 4 * G + 120, fill: grad(defs, 'cs' + uid, 'linearGradient', { x1: 0, y1: 0, x2: 90, y2: 0 }, [[0, GOLD, 0], [0.5, '#fff1c6', 0.55], [1, GOLD, 0]]), opacity: 0, style: 'mix-blend-mode:screen' }, svg);
      const frame = line(svg, `M${X0 - 24},${Y0 - 72} L${X1 + 18},${Y0 - 72} L${X1 + 18},${Y0 + 4 * G + 92} L${X0 - 24},${Y0 + 4 * G + 92} Z`, { c: PAPER, w: 2.6, go: 0.2 });
      const arrow = line(svg, 'M262,236 L298,236 M286,226 L298,236 L286,246', { c: PAPER, w: 3 });
      const no = line(svg, 'M266,212 L298,260 M298,212 L266,260', { c: CORAL, w: 5.5, go: 0.5 });
      const t0 = AT(s.at), tn = AT(s.notes);
      DRAW(tl, staff, t0, 1.2); SHOW(tl, title, t0 + 0.3);
      DRAW(tl, man, tn - 0.4, 1.1); DRAW(tl, pen, tn + 0.4, 0.5); SHOW(tl, lab, AT(s.name));
      notes.forEach((n, i) => { tl.fromTo(n.g, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }, tn + 0.3 + i * 0.2); DRAW(tl, threads[i], tn + 0.6 + i * 0.2, 0.8); });
      if (s.sweep !== undefined) { const ts = AT(s.sweep); tl.set(sweep, { opacity: 1 }, ts); tl.fromTo(sweep, { x: 0 }, { x: X1 - X0 + 110, duration: 2.6, ease: 'none', immediateRender: false }, ts); tl.set(sweep, { opacity: 0 }, ts + 2.6);
        notes.forEach(n => { const t = ts + (n.x - X0 + 90) / (X1 - X0 + 110) * 2.6; tl.to(n.g, { scale: 1.25, svgOrigin: `${n.x} ${n.y}`, duration: 0.18, ease: 'power2.out' }, t); tl.to(n.g, { scale: 1, svgOrigin: `${n.x} ${n.y}`, duration: 0.35 }, t + 0.18); }); }
      const tni = AT(s.notin); DRAW(tl, frame, tni, 1.0); DRAW(tl, arrow, tni + 0.6, 0.5); DRAW(tl, no, tni + 1.2, 0.45);
      const tst = AT(s.still);
      tl.to(notes.map(n => n.g), { opacity: 0.22, duration: 0.8, stagger: 0.05 }, tst); tl.to(threads, { opacity: 0, duration: 0.8 }, tst); tl.to([frame, arrow, no], { opacity: 0, duration: 0.7 }, tst);
      tl.to(halo, { opacity: 1, duration: 1.2 }, tst + 0.3);
      if (s.more !== undefined) {                                      // 脑子里还有好多曲子：小音符一串一串往上飘
        const tm = AT(s.more), r = rng(9);
        for (let i = 0; i < 20; i++) {
          const g = mk('g', { opacity: 0 }, svg), x = 130 + r() * 70, y = 128;
          mk('ellipse', { cx: x, cy: y, rx: 8.5, ry: 6, transform: `rotate(-22 ${x} ${y})`, fill: GOLD }, g); mk('path', { d: `M${x + 7.5},${y - 2} L${x + 7.5},${y - 36}`, stroke: GOLD, 'stroke-width': 2 }, g);
          const d = tm + i * 0.16, dx = (r() - 0.5) * 300, dy = -(40 + r() * 80);
          tl.fromTo(g, { opacity: 0, x: 0, y: 0 }, { opacity: 0.95, x: dx * 0.4, y: dy * 0.4, duration: 0.6, ease: 'power1.out', immediateRender: false }, d);
          tl.to(g, { x: dx, y: dy, opacity: 0, duration: 1.8, ease: 'power1.in' }, d + 0.6);
        }
      }
      const tno = AT(s.none); tl.to([man, pen, lab, halo], { opacity: 0.12, duration: 1.0 }, tno);
      const te = AT(s.empty); tl.to(notes.map(n => n.g), { opacity: 0, duration: 0.6 }, te); tl.to([staff, title], { opacity: 0.14, duration: 1.0 }, te + 0.2);
    },
    // 托住：一个方框是世界；神不在框外远远看着；祂把手从框外伸进来，掌心托住宇宙、地球、每一个人 → 手一拿开，什么都不剩
    uphold({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 520);
      const box = line(svg, 'M250,24 L750,24 L750,470 L250,470 Z', { c: PAPER, w: 3, go: 0.2 });
      const bl = text(svg, 272, 68, '世界', { s: 32, a: 'start', ls: '0.2em' });
      const far = mk('circle', { cx: 880, cy: 96, r: 16, fill: '#fff1c6', opacity: 0, filter: `url(#${glowId})` }, svg);
      const farX = line(svg, 'M850,66 L910,126 M910,66 L850,126', { c: CORAL, w: 5, go: 0.5 });
      // 手（侧面，掌心向上：左边是大拇指，右边四指微微弯起）；手腕从框外左下角伸进来，越往外越淡
      const fade = mk('mask', { id: 'um' + uid, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1000, height: 520 }, defs);
      mk('rect', { x: 0, y: 0, width: 1000, height: 520, fill: grad(defs, 'uf' + uid, 'linearGradient', { x1: 60, y1: 0, x2: 260, y2: 0 }, [[0, '#000'], [1, '#fff']]) }, fade);
      const hand = mk('g', { opacity: 0, mask: `url(#um${uid})` }, svg);
      const hg = mk('ellipse', { cx: 540, cy: 380, rx: 300, ry: 120, fill: grad(defs, 'uh' + uid, 'radialGradient', { cx: 540, cy: 380, r: 300 }, [[0, '#ffe6a6', 0.45], [1, GOLD, 0]]), opacity: 0 }, hand);
      const hk = mk('g', { transform: 'translate(227,262) scale(1.3)' }, hand);
      const HAND = 'M-170,330 C-100,270 40,180 130,150 C210,138 300,132 372,118 C402,112 418,96 410,78 C404,66 388,64 380,72 C350,92 280,100 210,100 C170,100 145,96 132,86 C122,78 120,58 112,44 C106,34 94,34 92,46 C90,62 92,84 80,98 C40,128 -80,190 -170,250';
      const body = mk('path', { d: HAND, fill: 'rgba(226,189,118,.12)', stroke: 'none', opacity: 0 }, hk);
      const palm = line(hk, HAND, { c: GOLD, w: 3.6, go: 0.6 });
      const crease = line(hk, 'M340,108 C360,104 378,96 392,86 M298,114 C322,112 342,108 357,102', { c: GOLD, w: 1.8, go: 0.3 });
      const T0 = AT(s.at); DRAW(tl, box, T0, 1.0); SHOW(tl, bl, T0 + 0.5);
      if (s.far !== undefined) { const tf = AT(s.far); tl.to(far, { opacity: 1, duration: 0.6 }, tf); DRAW(tl, farX, tf + 0.9, 0.45); }
      const th = AT(s.hand);
      tl.to([far, farX], { opacity: 0, duration: 0.6 }, th);
      tl.fromTo(hand, { opacity: 0, x: -150, y: 90 }, { opacity: 1, x: 0, y: 0, duration: 1.4, ease: 'power2.out', immediateRender: false }, th);
      DRAW(tl, palm, th, 1.3); DRAW(tl, crease, th + 1.0, 0.5); tl.to(body, { opacity: 1, duration: 1.0 }, th + 0.6); tl.to(hg, { opacity: 1, duration: 1.2 }, th + 0.6);
      const pos = [[440, 318], [568, 290], [696, 316]];
      const groups = (s.items || []).map(([ic, lb, at], i) => {
        const g = mk('g', {}, svg), [x, y] = pos[i], t = AT(at);
        const glow = mk('circle', { cx: x, cy: y, r: 66, fill: grad(defs, 'ug' + uid + i, 'radialGradient', { cx: x, cy: y, r: 66 }, [[0, '#ffe6a6', 0.4], [1, GOLD, 0]]), opacity: 0 }, g);
        const ico = icon(g, ic, x, y, 96, { c: i === 1 ? '#cfe8fb' : GOLD });
        const l = text(g, x, y - 68, lb, { s: 30, c: PAPER, ls: '0.12em' });
        DRAW(tl, ico, t - 0.05, 0.8); tl.to(glow, { opacity: 1, duration: 0.8 }, t + 0.2); SHOW(tl, l, t + 0.2);
        return g;
      });
      const ta = AT(s.away);
      tl.to(hand, { x: -170, y: 120, opacity: 0, duration: 1.1, ease: 'power2.in' }, ta);
      groups.forEach((g, i) => tl.to(g, { y: 70 + i * 12, opacity: 0.35, duration: 1.2, ease: 'power2.in' }, ta + 0.35 + i * 0.08));
      const tn = AT(s.none); tl.to(groups, { opacity: 0, duration: 0.8 }, tn); tl.to([box, bl], { opacity: 0.25, duration: 1.0 }, tn + 0.2);
    },
    // 黑屋子、窗帘、太阳：外面大太阳 → 窗帘拉上，屋里黑 → 他跪着求太阳进来 → 太阳从来没走开（窗帘边上透着光）→ 窗帘一拉开，光照进来
    curtain({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId, soft } = base(el, 500);
      mk('rect', { x: 540, y: 40, width: 340, height: 340 }, mk('clipPath', { id: 'cw' + uid }, defs));
      const room = mk('ellipse', { cx: 470, cy: 300, rx: 540, ry: 300, fill: grad(defs, 'rm' + uid, 'radialGradient', { cx: 470, cy: 300, r: 540 }, [[0, '#ffe6a6', 0.38], [0.6, GOLD, 0.12], [1, GOLD, 0]]), opacity: 0 }, svg);
      const sky = mk('g', { 'clip-path': `url(#cw${uid})`, opacity: 0 }, svg);
      mk('rect', { x: 540, y: 40, width: 340, height: 340, fill: grad(defs, 'sk' + uid, 'linearGradient', { x1: 0, y1: 40, x2: 0, y2: 380 }, [[0, '#ffe9b8'], [1, '#e8b862']]) }, sky);
      const sun = mk('circle', { cx: 730, cy: 170, r: 72, fill: '#fffaf0', filter: `url(#${glowId})` }, sky);
      const beam = mk('path', { d: 'M540,42 L170,450 L830,450 L880,380 L880,42 Z', fill: grad(defs, 'bm' + uid, 'linearGradient', { x1: 880, y1: 42, x2: 240, y2: 450 }, [[0, '#fff1c6', 0.8], [1, '#f3d58e', 0.16]]), opacity: 0, style: 'mix-blend-mode:screen', filter: `url(#${soft})` }, svg);
      const floor = line(svg, 'M40,450 L960,450', { c: PAPER, w: 2, go: 0.15 });
      const win = line(svg, 'M540,40 L880,40 L880,380 L540,380 Z M710,40 L710,380 M540,210 L880,210', { c: PAPER, w: 3.5 });
      const rod = line(svg, 'M510,26 L910,26', { c: PAPER, w: 3 });
      const cloth = grad(defs, 'cl' + uid, 'linearGradient', { x1: 0, y1: 0, x2: 44, y2: 0, spreadMethod: 'reflect' }, [[0, '#2c1d16'], [0.5, '#4a332b'], [1, '#2c1d16']]);
      const panel = (x0, x1) => { const g = mk('g', {}, svg); mk('rect', { x: x0, y: 28, width: x1 - x0, height: 366, fill: cloth }, g);
        for (let x = x0 + 18; x < x1 - 6; x += 24) mk('path', { d: `M${x},30 L${x + 3},392`, stroke: '#140c08', 'stroke-width': 3, opacity: 0.55 }, g);
        mk('rect', { x: x0, y: 28, width: x1 - x0, height: 366, fill: 'none', stroke: CORAL, 'stroke-width': 3, opacity: 0, class: 'edge' }, g); return g; };
      const L = panel(530, 712), R = panel(708, 890);
      // 窗帘边上透进来的光（压在窗帘上面：两边、中缝、上沿）
      const leak = line(svg, 'M530,30 L530,392 M890,30 L890,392 M710,32 L710,392 M532,28 L888,28', { c: '#fff1c6', w: 2.6, gc: '#ffc860', gw: 18, go: 0.9 });
      gsap.set(leak, { opacity: 0 }); gsap.set(leak._p, { strokeDashoffset: 0 });   // 这几道光不用描，整道淡入
      // 跪着祷告的人（侧面，面朝窗户，双手合在脸前）
      const person = line(svg, circ(300, 236, 24) + ' M296,262 C292,300 290,340 292,372 C300,402 306,426 312,448 L214,448 M296,290 C318,304 332,314 336,320 C342,304 344,288 340,270', { c: '#efe6d2', w: 4.5 });
      const say1 = text(svg, 300, 110, '“太阳啊，', { s: 34, c: PAPER, font: 'LXGW WenKai', wt: 400, ls: '0.06em' }), say2 = text(svg, 300, 156, '求你到我的房间里来。”', { s: 34, c: PAPER, font: 'LXGW WenKai', wt: 400, ls: '0.06em' });
      const t0 = AT(s.at); DRAW(tl, floor, t0, 1.0); DRAW(tl, win, t0 + 0.2, 1.2); DRAW(tl, rod, t0 + 0.4, 0.8); DRAW(tl, person, t0 + 0.4, 1.0);
      gsap.set(L, { scaleX: 0.15, svgOrigin: '530 28' }); gsap.set(R, { scaleX: 0.15, svgOrigin: '890 28' });
      const ts = AT(s.sun); tl.to(sky, { opacity: 1, duration: 1.2 }, ts); tl.to(room, { opacity: 0.6, duration: 1.2 }, ts);
      const tc = AT(s.close);
      tl.to(L, { scaleX: 1, svgOrigin: '530 28', duration: 1.4, ease: 'power2.inOut' }, tc); tl.to(R, { scaleX: 1, svgOrigin: '890 28', duration: 1.4, ease: 'power2.inOut' }, tc);
      tl.to(room, { opacity: 0, duration: 1.2 }, tc + 0.2); tl.to(leak, { opacity: 0.55, duration: 1.0 }, tc + 1.2);
      const tp = AT(s.pray); SHOW(tl, say1, tp); SHOW(tl, say2, tp + 0.6);
      const tn = AT(s.never); tl.to(leak, { opacity: 1, duration: 1.0 }, tn); tl.fromTo(sun, { scale: 1 }, { scale: 1.3, svgOrigin: '730 170', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: 3, immediateRender: false }, tn);
      const tw = AT(s.why); tl.to([...L.querySelectorAll('.edge'), ...R.querySelectorAll('.edge')], { opacity: 0.9, duration: 0.5, yoyo: true, repeat: 1 }, tw);
      const to = AT(s.open);
      tl.to(L, { scaleX: 0.13, svgOrigin: '530 28', duration: 1.6, ease: 'power2.inOut' }, to); tl.to(R, { scaleX: 0.13, svgOrigin: '890 28', duration: 1.6, ease: 'power2.inOut' }, to);
      tl.to(leak, { opacity: 0, duration: 0.8 }, to + 0.3); tl.to(beam, { opacity: 1, duration: 1.6 }, to + 0.4); tl.to(room, { opacity: 1, duration: 1.6 }, to + 0.5);
      tl.to(person._p, { stroke: '#f3d58e', duration: 1.2 }, to + 0.8); tl.to([say1, say2], { opacity: 0.3, duration: 0.8 }, to + 0.6);
    },
    // 一层一层的套：神在人里面，人在世界里面；神被包在最中间，像一个果核 → 时间一长，神的声音和自己的声音混在一起，分不清
    core({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 540);
      const mix = mk('circle', { cx: 500, cy: 280, r: 150, fill: grad(defs, 'cm' + uid, 'radialGradient', { cx: 500, cy: 280, r: 150 }, [[0, '#ffe6a6', 0.6], [0.7, GOLD, 0.24], [1, GOLD, 0.06]]), opacity: 0 }, svg);
      const outer = line(svg, circ(500, 280, 252), { c: PAPER, w: 3, go: 0.2 });
      const mid = line(svg, circ(500, 280, 150), { c: PAPER, w: 3.6 });
      const seed = mk('ellipse', { cx: 500, cy: 280, rx: 22, ry: 22, fill: '#ffe6a6', opacity: 0, filter: `url(#${glowId})` }, svg);
      const lw = text(svg, 300, 96, '世界', { s: 34, a: 'end', ls: '0.3em' }), lp = text(svg, 382, 166, '人', { s: 36, a: 'end' }), lg = text(svg, 500, 340, '神', { s: 36, c: GOLD });
      const lk = text(svg, 534, 266, '果核', { s: 30, c: GOLD, a: 'start' });
      const t1 = AT(s.at); DRAW(tl, mid, t1, 1.1); SHOW(tl, lp, t1 + 0.4); tl.to(seed, { opacity: 1, duration: 0.8 }, t1 + 0.2); SHOW(tl, lg, t1 + 0.5);
      const t2 = AT(s.world); DRAW(tl, outer, t2, 1.2); SHOW(tl, lw, t2 + 0.4);
      if (s.mid !== undefined) { const t3 = AT(s.mid); tl.fromTo(mid, { scale: 1 }, { scale: 0.93, svgOrigin: '500 280', duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, t3); tl.fromTo(outer, { scale: 1 }, { scale: 0.96, svgOrigin: '500 280', duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, t3 + 0.15); }
      const t4 = AT(s.seed); tl.to(seed, { attr: { rx: 18, ry: 31 }, rotation: -24, svgOrigin: '500 280', duration: 1.1, ease: 'power2.inOut' }, t4); SHOW(tl, lk, t4 + 0.9);
      const bits = (s.self || []).map(([w, at], i) => { const [x, y] = [[300, 290], [700, 290], [500, 482]][i]; const t = text(svg, x, y, w, { s: 30, c: '#e2d6bd', font: 'LXGW WenKai', wt: 400 }); SHOW(tl, t, AT(at)); return t; });
      const t6 = AT(s.blur);
      tl.to(seed, { attr: { rx: 130, ry: 130 }, opacity: 0.35, duration: 2.2, ease: 'power1.inOut' }, t6);
      tl.to(mix, { opacity: 1, duration: 2.0 }, t6 + 0.3); tl.to([lg, lk], { opacity: 0.25, duration: 1.2 }, t6 + 0.5); tl.to(bits, { fill: GOLD, duration: 1.4 }, t6 + 0.6);
    },
    // 反过来：先是“你在我里面”（我这个圈，里面一个金点）→ 金点涨开，成了没有边的光；我缩成光里的一个小圈 →“我在你里面”
    flip({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 560);
      const field = mk('circle', { cx: 500, cy: 262, r: 24, fill: grad(defs, 'fl' + uid, 'radialGradient', { cx: 500, cy: 262, r: 330 }, [[0, '#fff3d0', 0.95], [0.12, '#f6dc9c', 0.8], [0.55, GOLD, 0.32], [1, GOLD, 0]]), opacity: 0 }, svg);
      const ring = mk('circle', { cx: 500, cy: 262, r: 175, fill: 'none', stroke: PAPER, 'stroke-width': 4.5, opacity: 0 }, svg);
      const lw = text(svg, 500, 66, '我', { s: 50 }), ln = text(svg, 500, 332, '你', { s: 44, c: GOLD });
      const c1 = text(svg, 500, 540, '你在我身上？', { s: 44, ls: '0.2em' }), c2 = text(svg, 500, 540, '我在你里面', { s: 50, c: GOLD, ls: '0.24em' });
      const t1 = AT(s.at);
      tl.fromTo(ring, { opacity: 0, scale: 0.85, svgOrigin: '500 262' }, { opacity: 1, scale: 1, svgOrigin: '500 262', duration: 0.9, ease: 'power2.out', immediateRender: false }, t1);
      tl.to(field, { opacity: 1, duration: 0.8 }, t1 + 0.3); SHOW(tl, lw, t1 + 0.3); SHOW(tl, ln, t1 + 0.6); SHOW(tl, c1, t1 + 0.9);
      const tf = AT(s.flip);
      tl.to(field, { attr: { r: 330 }, duration: 2.0, ease: 'power2.inOut' }, tf);
      tl.to(ring, { attr: { r: 58 }, duration: 2.0, ease: 'power2.inOut' }, tf);
      tl.to(lw, { attr: { y: 280 }, duration: 2.0, ease: 'power2.inOut' }, tf);
      tl.to(ln, { attr: { y: 46 }, duration: 2.0, ease: 'power2.inOut' }, tf);
      tl.to(c1, { opacity: 0, duration: 0.6 }, tf);
      SHOW(tl, c2, AT(s.me));
    },
    // 车轮和轴：轮子架在两条腿上，转起来、越转越快；中间那根轴一动不动（发着光）。轴一拿掉，轮子往下一坠，晃两下，停了
    wheel({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 560);
      const cx = 500, cy = 262, R = 206, O = `${cx} ${cy}`;
      const floor = line(svg, 'M170,528 L830,528', { c: PAPER, w: 2, go: 0.15 });
      const stand = line(svg, `M${cx},${cy} L${cx - 96},528 M${cx},${cy} L${cx + 96},528`, { c: PAPER, w: 3, go: 0.2 });
      const spin = mk('g', {}, svg); gsap.set(spin, { svgOrigin: O });
      const rim = line(spin, circ(cx, cy, R) + ' ' + circ(cx, cy, R - 18), { c: GOLD, w: 3.6 });
      let d = ''; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, c = Math.cos(a), si = Math.sin(a); d += `M${(cx + c * 40).toFixed(1)},${(cy + si * 40).toFixed(1)} L${(cx + c * (R - 18)).toFixed(1)},${(cy + si * (R - 18)).toFixed(1)} `; }
      const spokes = line(spin, d, { c: GOLD, w: 2.8 });
      const hub = line(spin, circ(cx, cy, 40), { c: GOLD, w: 3.4 });
      const mark = mk('circle', { cx: cx + R - 9, cy, r: 7, fill: CORAL, opacity: 0 }, spin);          // 轮缘上一个记号：看得出在转
      const arc = (r, a0, a1) => `M${(cx + r * Math.cos(a0)).toFixed(1)},${(cy + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(cx + r * Math.cos(a1)).toFixed(1)},${(cy + r * Math.sin(a1)).toFixed(1)}`;
      const blur = line(svg, [R + 24, R + 38].map(r => arc(r, -1.0, 0.1) + ' ' + arc(r, 2.1, 3.2)).join(' '), { c: GOLD, w: 2, go: 0.25 });   // 转快了，边上几道淡弧
      gsap.set(blur, { opacity: 0 }); gsap.set(blur._p, { strokeDashoffset: 0 });
      const halo = mk('circle', { cx, cy, r: 70, fill: grad(defs, 'wh' + uid, 'radialGradient', { cx, cy, r: 70 }, [[0, '#fff1c6', 0.9], [0.45, GOLD, 0.3], [1, GOLD, 0]]), opacity: 0 }, svg);
      const axle = mk('circle', { cx, cy, r: 13, fill: '#fff4d8', filter: `url(#${glowId})`, opacity: 0 }, svg);
      const lw = text(svg, 120, 120, '轮子在转', { s: 34, a: 'start', ls: '0.14em' });
      const lead = line(svg, `M${cx + 20},${cy - 16} L${cx + 118},${cy - 150} L${cx + 250},${cy - 150}`, { c: '#fff1c6', w: 2, go: 0.3 });
      const la = text(svg, cx + 262, cy - 140, '轴 · 不动', { s: 36, a: 'start', c: GOLD, ls: '0.14em' });
      const t0 = AT(s.at);
      DRAW(tl, floor, t0, 0.8); DRAW(tl, rim, t0 + 0.1, 1.3); DRAW(tl, spokes, t0 + 0.5, 1.0); DRAW(tl, hub, t0 + 0.6, 0.8); DRAW(tl, stand, t0 + 0.4, 0.9);
      tl.to(axle, { opacity: 1, duration: 0.6 }, t0 + 0.9); tl.to(mark, { opacity: 1, duration: 0.5 }, t0 + 1.2);
      const t1 = AT(s.spin), t2 = AT(s.fast), t3 = AT(s.axle), t4 = AT(s.none), t5 = AT(s.stop);
      SHOW(tl, lw, t1);
      // 先慢后快：一段一段接着转（都是绝对角度，逐帧定位也对）
      const r1 = 150, r2 = r1 + 330 * (t4 - t2);
      tl.fromTo(spin, { rotation: 0 }, { rotation: r1, duration: Math.max(0.6, t2 - t1), ease: 'sine.in', immediateRender: false }, t1);
      tl.fromTo(spin, { rotation: r1 }, { rotation: r2, duration: t4 - t2, ease: 'none', immediateRender: false }, t2);
      tl.to(blur, { opacity: 0.8, duration: 0.6 }, t2 + 0.2);
      DRAW(tl, lead, t3, 0.7); SHOW(tl, la, t3 + 0.5); tl.to(halo, { opacity: 1, duration: 0.8 }, t3 + 0.2);
      tl.fromTo(axle, { scale: 1 }, { scale: 1.35, svgOrigin: O, duration: 0.7, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, t3 + 0.4);
      // 轴拿掉：轴和架子淡掉，轮子减速、往下一坠，左右晃两下
      tl.to([axle, halo, stand, lead, la], { opacity: 0, duration: 0.6 }, t4);
      tl.to(blur, { opacity: 0, duration: 0.5 }, t4);
      tl.fromTo(spin, { rotation: r2 }, { rotation: r2 + 150, duration: 1.6, ease: 'power2.out', immediateRender: false }, t4);
      tl.fromTo(spin, { y: 0 }, { y: 54, duration: 0.9, ease: 'power2.in', immediateRender: false }, t4 + 0.2);
      tl.fromTo(spin, { x: 0 }, { x: -14, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 3, immediateRender: false }, t4 + 1.05);
      tl.to([spin, lw], { opacity: 0.38, duration: 0.9 }, Math.max(t4 + 1.3, t5));
    },
    // 人的心忽冷忽热（一根上下乱跳的线），神的应许是一根平平稳稳的金线。要是神也跟着变——金线跟着跳、一路往下掉
    lines({ tl, el, AT, s }) {
      const { svg } = base(el, 500);
      const r = rng(11), X0 = 90, X1 = 720, Y = 330, n = 8;
      const P = []; for (let i = 0; i <= n; i++) P.push([X0 + (X1 - X0) * i / n, Y + (i % 2 ? -1 : 1) * (38 + r() * 64)]);
      const path = pts => { let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1].toFixed(1)}`; } return d; };
      const heart = line(svg, path(P), { c: CORAL, w: 4, go: 0.45 });
      const lh = text(svg, X1 + 26, P[n][1] + 10, '以色列人的心', { s: 30, a: 'start', c: CORAL, ls: '0.06em' });
      const lu = text(svg, X1 + 26, P[n][1] + 10, '我们的心', { s: 32, a: 'start', c: CORAL, ls: '0.1em' });
      const follow = line(svg, path(P.map(([x, y], i) => [x, y - 12 + i * i * 3.2])), { c: GOLD, w: 3, go: 0.3 });
      const steady = line(svg, `M${X0},140 L${X1},140`, { c: GOLD, w: 4.6, go: 0.75 });
      const ls = text(svg, X1 + 26, 150, '神的应许', { s: 36, a: 'start', c: GOLD, ls: '0.1em' });
      const ll = text(svg, X1 + 26, 196, '祂的爱', { s: 32, a: 'start', c: GOLD, ls: '0.1em' });
      let hi = 1, lo = 2; P.forEach((p, i) => { if (i && i < n && p[1] < P[hi][1]) hi = i; if (i && i < n && p[1] > P[lo][1]) lo = i; });
      const lhot = text(svg, P[hi][0], P[hi][1] - 28, '热', { s: 34, c: '#ffcfb0' }), lcold = text(svg, P[lo][0], P[lo][1] + 58, '冷', { s: 34, c: '#bcd9f0' });
      const t0 = AT(s.at); DRAW(tl, heart, t0, 2.4); SHOW(tl, lh, t0 + 1.8);
      const tf = AT(s.follow); DRAW(tl, follow, tf, 1.8);
      const td = AT(s.done); tl.to(follow, { y: 90, opacity: 0, duration: 1.2, ease: 'power2.in' }, td);
      const tsd = AT(s.steady); DRAW(tl, steady, tsd, 1.4); SHOW(tl, ls, tsd + 0.6);
      SHOW(tl, ll, AT(s.love));
      const tu = AT(s.us); tl.to(lh, { opacity: 0, duration: 0.5 }, tu); SHOW(tl, lu, tu + 0.3);
      SHOW(tl, lhot, AT(s.hot)); SHOW(tl, lcold, AT(s.cold));
      const tt = AT(s.temp); tl.fromTo(steady._p[0], { opacity: 0.54 }, { opacity: 1, duration: 0.8, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, tt);
      tl.to([heart, lu, lhot, lcold], { opacity: 0.45, duration: 1.0 }, tt + 0.3);
    },
    // 深海剖面：海面上浪大、小船颠；一个小光点往下沉，几百米下面，水是静的
    deep({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 560);
      const W0 = 80, W1 = 800, TOP = 150, BOT = 540;
      const cl = mk('clipPath', { id: 'dc' + uid }, defs); mk('rect', { x: W0, y: 20, width: W1 - W0, height: BOT - 20 }, cl);
      const g = mk('g', { 'clip-path': `url(#dc${uid})` }, svg);
      const sea = mk('rect', { x: W0, y: TOP, width: W1 - W0, height: BOT - TOP, fill: grad(defs, 'ds' + uid, 'linearGradient', { x1: 0, y1: TOP, x2: 0, y2: BOT }, [[0, '#7aa8cf', 0.42], [0.3, '#2c5079', 0.5], [1, '#07111f', 0.7]]), opacity: 0 }, g);
      const fade = mk('linearGradient', { id: 'dm' + uid, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      [[0, 0], [0.1, 1], [0.9, 1], [1, 0]].forEach(([o, a]) => mk('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, fade));
      const mask = mk('mask', { id: 'dk' + uid, maskUnits: 'userSpaceOnUse', x: W0, y: 0, width: W1 - W0, height: BOT }, defs); mk('rect', { x: W0, y: 0, width: W1 - W0, height: BOT, fill: `url(#dm${uid})` }, mask);
      const L = 220, A = 22, wave = (y, a) => { let d = `M${W0 - L * 2},${y}`; for (let x = W0 - L * 2; x < W1 + L * 2; x += L) d += ` q${L / 4},${-a * 2} ${L / 2},0 t${L / 2},0`; return d; };
      const waves = mk('g', { mask: `url(#dk${uid})` }, g);
      const w1 = line(waves, wave(TOP, A), { c: '#d6ecfb', w: 3.2, go: 0.5 }), w2 = line(waves, wave(TOP + 26, A * 0.6), { c: '#a9cbe6', w: 2, go: 0.3 });
      const boat = mk('g', {}, svg), bx = 400, by = TOP - 8;
      line(boat, `M${bx - 50},${by} L${bx + 50},${by} L${bx + 34},${by + 22} L${bx - 34},${by + 22} Z M${bx},${by} L${bx},${by - 78} M${bx + 3},${by - 74} L${bx + 44},${by - 12} L${bx + 3},${by - 12} Z`, { c: PAPER, w: 3 });
      gsap.set(boat, { svgOrigin: `${bx} ${by + 10}`, opacity: 0 }); gsap.set(boat.querySelectorAll('path'), { strokeDashoffset: 0 });
      // 右边的深度尺
      let rd = `M${W1 + 46},${TOP} L${W1 + 46},${BOT - 20}`; const marks = [0, 100, 200, 300].map((m, i) => { const y = TOP + i * 112; rd += ` M${W1 + 46},${y} L${W1 + 62},${y}`; return text(svg, W1 + 74, y + 10, m ? m + ' 米' : '海面', { s: 24, a: 'start', c: '#a9cbe6', ls: '0.06em', wt: 400 }); });
      const ruler = line(svg, rd, { c: '#a9cbe6', w: 2, go: 0.2 });
      const probe = mk('circle', { cx: 640, cy: TOP + 20, r: 7, fill: '#fff4d8', filter: `url(#${glowId})`, opacity: 0 }, svg);
      const trail = line(svg, `M640,${TOP + 20} L640,${BOT - 50}`, { c: '#fff1c6', w: 1.6, go: 0.3 });
      const still = line(g, [0, 1, 2, 3].map(k => `M${W0 + 60 + k * 30},${BOT - 108 + k * 22} L${W1 - 60 - k * 40},${BOT - 108 + k * 22}`).join(' '), { c: '#9fc3e0', w: 1.6, go: 0.25 });
      const lcalm = text(svg, 250, BOT - 128, '水是静的', { s: 36, c: '#d6ecfb', ls: '0.16em' });
      const lup = s.note !== undefined ? text(svg, W0 + 4, 64, '上面 · 动', { s: 32, a: 'start', c: '#d6ecfb', ls: '0.12em' }) : null;
      const t0 = AT(s.at); tl.to(sea, { opacity: 1, duration: 1.0 }, t0 - 0.3); DRAW(tl, w1, t0 - 0.2, 0.9); DRAW(tl, w2, t0, 0.9);
      tl.fromTo(waves, { x: 0 }, { x: -L, duration: 1.7, ease: 'none', repeat: 14, immediateRender: false }, t0 - 0.2);
      tl.to(boat, { opacity: 1, duration: 0.7 }, t0 + 0.2);
      tl.fromTo(boat, { rotation: -7, y: 0 }, { rotation: 8, y: 6, duration: 0.85, ease: 'sine.inOut', yoyo: true, repeat: 5, immediateRender: false }, t0 + 0.2);
      const tb = AT(s.boat); tl.fromTo(boat, { rotation: -10 }, { rotation: 22, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 5, immediateRender: false }, tb);
      const tdn = AT(s.down); DRAW(tl, ruler, tdn - 0.3, 0.8); marks.forEach((m, i) => SHOW(tl, m, tdn - 0.1 + i * 0.25));
      tl.to(probe, { opacity: 1, duration: 0.4 }, tdn); tl.to(probe, { attr: { cy: BOT - 50 }, duration: 2.0, ease: 'power1.inOut' }, tdn + 0.2); DRAW(tl, trail, tdn + 0.2, 2.0);
      const tc = AT(s.calm); DRAW(tl, still, tc - 0.2, 1.4); SHOW(tl, lcalm, tc);
      if (s.note !== undefined) SHOW(tl, lup, AT(s.note));
    },
    // 从有到好：创造（一点光、一粒种子）→ 负荷（手托着小苗）→ 维护（罩着、挡风）→ 养育（浇水、长高）→ 充裕（开花）→ 改进（结果、发光）
    //   { anim: 'grow', at, items: [['创造', '从无到有', 时刻, 小字时刻], ...], pre: 前面几个一开场就画好 }
    grow({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 520);
      const X = [92, 255, 418, 582, 745, 908], Y = 236, pre = s.pre || 0;
      const stem = h => `M0,70 C-2,${70 - h * 0.4} 3,${70 - h * 0.75} 0,${70 - h}`;
      const leaf = (y, k, z) => `M0,${y} C${k * z * 0.35},${y - z * 0.55} ${k * z * 0.95},${y - z * 0.5} ${k * z * 1.1},${y - z * 0.18} C${k * z * 0.72},${y + z * 0.06} ${k * z * 0.3},${y + z * 0.04} 0,${y}`;
      const drop = (x, y) => `M${x},${y} C${x - 6},${y + 9} ${x - 6},${y + 15} ${x},${y + 15} C${x + 6},${y + 15} ${x + 6},${y + 9} ${x},${y} Z`;
      const petals = (x, y) => [0, 72, 144, 216, 288].map(a => { const c = Math.cos(a * Math.PI / 180), si = Math.sin(a * Math.PI / 180), P = (px, py) => `${(x + px * c - py * si).toFixed(1)},${(y + px * si + py * c).toFixed(1)}`; return `M${P(0, 0)} C${P(-8, -8)} ${P(-7, -20)} ${P(0, -24)} C${P(7, -20)} ${P(8, -8)} ${P(0, 0)} Z`; }).join(' ');
      const PIC = [
        ['M0,-30 C3,-7 7,-3 30,0 C7,3 3,7 0,30 C-3,7 -7,3 -30,0 C-7,-3 -3,-7 0,-30 Z', 'M-10,60 C-10,49 10,49 10,60 C10,69 -10,69 -10,60 Z', [0, 0]],
        [stem(34) + ' ' + leaf(44, -1, 20) + ' ' + leaf(40, 1, 18), 'M-58,50 C-44,84 44,84 58,50 M-58,50 C-63,41 -54,37 -47,44 M58,50 C63,41 54,37 47,44'],
        [stem(58) + ' ' + leaf(40, -1, 24) + ' ' + leaf(28, 1, 22), 'M-46,70 L-46,6 C-46,-52 46,-52 46,6 L46,70 M-86,-18 C-72,-22 -64,-28 -58,-38 M-92,8 C-78,4 -66,-2 -60,-10'],
        [stem(88) + ' ' + leaf(36, -1, 28) + ' ' + leaf(18, 1, 28) + ' ' + leaf(0, -1, 22), drop(-30, -80) + ' ' + drop(6, -98) + ' ' + drop(32, -72)],
        [stem(104) + ' ' + leaf(44, -1, 32) + ' ' + leaf(28, 1, 32) + ' ' + leaf(8, -1, 30) + ' ' + leaf(-10, 1, 28), petals(0, -36)],
        [stem(104) + ' ' + leaf(44, -1, 32) + ' ' + leaf(28, 1, 32) + ' ' + leaf(8, -1, 30) + ' ' + leaf(-10, 1, 28), 'M0,-34 C-24,-34 -28,-66 -13,-76 C-6,-81 6,-81 13,-76 C28,-66 24,-34 0,-34 Z M0,-76 C2,-88 9,-94 16,-96', [0, -56]],
      ];
      const ground = line(svg, `M${X[0] - 64},${Y + 70} L${X[5] + 64},${Y + 70}`, { c: PAPER, w: 1.8, go: 0.12 });
      const spot = mk('ellipse', { cx: X[0], cy: Y - 10, rx: 92, ry: 120, fill: grad(defs, 'gs' + uid, 'radialGradient', { cx: 0.5, cy: 0.5, r: 0.5, gradientUnits: 'objectBoundingBox' }, [[0, '#ffe6a6', 0.3], [1, GOLD, 0]]), opacity: 0 }, svg);
      const t0 = AT(s.at); gsap.set(ground._p, { strokeDashoffset: 1.01 });
      (s.items || []).forEach(([b, sub, at, sat], i) => {
        const t = i < pre ? t0 - 0.3 : AT(at), [pd, ex, gl] = PIC[i];
        const g = mk('g', { transform: `translate(${X[i]},${Y})` }, svg);
        if (gl) { const h = mk('circle', { cx: gl[0], cy: gl[1], r: 46, fill: grad(defs, 'gh' + uid + i, 'radialGradient', { cx: 0.5, cy: 0.5, r: 0.5, gradientUnits: 'objectBoundingBox' }, [[0, '#fff1c6', 0.75], [1, GOLD, 0]]), opacity: 0 }, g); tl.to(h, { opacity: 1, duration: 0.9 }, t + 0.5); }
        const p1 = line(g, pd, { c: GOLD, w: 2.8 }), p2 = line(g, ex, { c: i === 1 || i === 2 ? PAPER : i === 3 ? '#bcdcf4' : GOLD, w: 2.4 });
        const lb = text(svg, X[i], Y + 128, b, { s: 40, c: GOLD, ls: '0.12em', wt: 700 }), ls = text(svg, X[i], Y + 176, sub, { s: 26, c: '#e2d6bd', font: 'LXGW WenKai', wt: 400, ls: '0.04em' });
        DRAW(tl, p1, t, i < pre ? 0.2 : 1.0); DRAW(tl, p2, t + (i < pre ? 0 : 0.5), i < pre ? 0.2 : 0.9); SHOW(tl, lb, t + (i < pre ? 0 : 0.1), i < pre ? 0.3 : 0.8);
        SHOW(tl, ls, i < pre ? t : sat !== undefined ? AT(sat) : t + 0.6);
        tl.to(ground._p, { strokeDashoffset: 1 - (i + 1) / 6, duration: i < pre ? 0.2 : 0.8, ease: 'power2.inOut' }, t);
        if (i >= pre) { tl.to(spot, { attr: { cx: X[i] }, opacity: 1, duration: 0.8, ease: 'power2.inOut' }, t - 0.2); }
      });
    },
    // 钟表匠的说法：一块怀表；造好、上紧发条（钥匙来回拧），钥匙一拔就走了，表自己走——这个说法被一条条划掉；神一刻也没有离开
    watch({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 560);
      const cx = 300, cy = 300, R = 176, O = `${cx} ${cy}`;
      const halo = mk('circle', { cx, cy, r: R + 70, fill: grad(defs, 'wg' + uid, 'radialGradient', { cx, cy, r: R + 70 }, [[0, '#ffe6a6', 0], [0.7, '#ffe6a6', 0.22], [0.86, GOLD, 0.16], [1, GOLD, 0]]), opacity: 0 }, svg);
      const kase = line(svg, circ(cx, cy, R) + ' ' + circ(cx, cy, R - 15), { c: GOLD, w: 3.4 });
      const crown = line(svg, `M${cx - 16},${cy - R - 1} L${cx - 16},${cy - R - 28} L${cx + 16},${cy - R - 28} L${cx + 16},${cy - R - 1} ` + circ(cx, cy - R - 58, 28), { c: GOLD, w: 3 });
      let tk = ''; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, r1 = R - 30, r2 = k % 3 ? R - 42 : R - 56; tk += `M${(cx + Math.sin(a) * r1).toFixed(1)},${(cy - Math.cos(a) * r1).toFixed(1)} L${(cx + Math.sin(a) * r2).toFixed(1)},${(cy - Math.cos(a) * r2).toFixed(1)} `; }
      const ticks = line(svg, tk, { c: PAPER, w: 2.6 });
      const hh = line(svg, `M${cx},${cy} L${cx + 52},${cy - 50}`, { c: PAPER, w: 5 }), mh = line(svg, `M${cx},${cy} L${cx},${cy - 124}`, { c: PAPER, w: 3.2 });
      gsap.set(mh, { svgOrigin: O });
      const pin = mk('circle', { cx, cy, r: 7, fill: '#fff4d8', opacity: 0 }, svg);
      const key = mk('g', { opacity: 0 }, svg), ky = cy - R - 118;
      line(key, `M${cx},${ky + 32} L${cx},${ky + 4} M${cx - 24},${ky - 14} C${cx - 24},${ky - 30} ${cx - 4},${ky - 30} ${cx},${ky - 14} C${cx + 4},${ky - 30} ${cx + 24},${ky - 30} ${cx + 24},${ky - 14} C${cx + 24},${ky} ${cx + 4},${ky} ${cx},${ky - 14} C${cx - 4},${ky} ${cx - 24},${ky} ${cx - 24},${ky - 14} Z`, { c: '#fff1c6', w: 3 });
      gsap.set(key, { svgOrigin: `${cx} ${ky}` }); gsap.set(key.querySelectorAll('path'), { strokeDashoffset: 0 });
      const RX = 590, rows = [['钟表匠', s.at, 46, GOLD], ['把表造好', s.make, 36, PAPER], ['上紧发条', s.wind, 36, PAPER], ['自己走开', s.away, 36, PAPER]];
      const lbs = rows.map(([w, at, sz, c], i) => text(svg, RX, 150 + i * 80 + (i ? 20 : 0), w, { s: sz, a: 'start', c, ls: '0.16em', wt: i ? 500 : 700 }));
      const strike = line(svg, rows.slice(1).map((_, i) => `M${RX - 10},${170 + (i + 1) * 80 - 12} L${RX + 175},${170 + (i + 1) * 80 - 12}`).join(' '), { c: CORAL, w: 4, go: 0.4 });
      const never = text(svg, RX, 500, '一刻也没有离开', { s: 40, a: 'start', c: GOLD, ls: '0.14em', wt: 700 });
      const t0 = AT(s.at); DRAW(tl, kase, t0, 1.2); DRAW(tl, ticks, t0 + 0.4, 1.0); DRAW(tl, crown, t0 + 0.6, 0.8); DRAW(tl, hh, t0 + 0.9, 0.6); DRAW(tl, mh, t0 + 1.0, 0.6); tl.to(pin, { opacity: 1, duration: 0.5 }, t0 + 1.1);
      SHOW(tl, lbs[0], s.lab !== undefined ? AT(s.lab) : t0 + 0.2);
      const tm = AT(s.make); SHOW(tl, lbs[1], tm);
      const tw = AT(s.wind); SHOW(tl, lbs[2], tw); tl.to(key, { opacity: 1, duration: 0.4 }, tw - 0.2);
      tl.fromTo(key, { scaleX: 1 }, { scaleX: -1, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 5, immediateRender: false }, tw + 0.1);
      const ta = AT(s.away); SHOW(tl, lbs[3], ta); tl.to(key, { y: -60, x: 90, opacity: 0, duration: 1.0, ease: 'power2.in' }, ta + 0.1);
      const tal = AT(s.alone); tl.fromTo(mh, { rotation: 0 }, { rotation: 360 * 3, duration: 26, ease: 'none', immediateRender: false }, tal);
      const tn = AT(s.no); DRAW(tl, strike, tn, 0.9); tl.to(lbs.slice(1), { opacity: 0.4, duration: 0.6 }, tn + 0.5);
      const tv = AT(s.never); tl.to(halo, { opacity: 1, duration: 1.2 }, tv); SHOW(tl, never, tv + 0.2);
    },
    // 靠墙：一个人整个靠在一堵墙上（靠着）；可是墙揣不进兜里——小墙往兜里塞，塞不进，弹回来（拿着 ✗）
    lean({ tl, el, AT, s }) {
      const { svg, glowId } = base(el, 540);
      const wx0 = 560, wx1 = 790, wy0 = 76, wy1 = 486;
      let bd = `M${wx0},${wy0} L${wx1},${wy0} L${wx1},${wy1} L${wx0},${wy1} Z`;
      for (let y = wy0 + 41, row = 1; y < wy1 - 5; y += 41, row++) bd += ` M${wx0},${y} L${wx1},${y}`;
      for (let y = wy0, row = 0; y < wy1 - 5; y += 41, row++) for (let x = wx0 + (row % 2 ? 38 : 76); x < wx1 - 10; x += 76) bd += ` M${x},${y} L${x},${Math.min(wy1, y + 41)}`;
      const wallBg = mk('rect', { x: wx0, y: wy0, width: wx1 - wx0, height: wy1 - wy0, fill: 'rgba(226,189,118,.08)', opacity: 0 }, svg);
      const wall = line(svg, bd, { c: PAPER, w: 2.2, go: 0.14 });
      const ground = line(svg, 'M110,486 L880,486', { c: PAPER, w: 2, go: 0.12 });
      const person = line(svg, circ(512, 150, 25) + ' M520,176 C528,220 540,270 552,330 M552,330 C540,380 520,430 498,484 M552,330 C549,384 542,432 538,484 M526,212 C500,228 500,248 522,258 C536,264 548,252 546,238', { c: '#efe6d2', w: 4.2 });
      const glow = mk('rect', { x: wx0 - 30, y: wy0, width: 40, height: wy1 - wy0, fill: '#ffe6a6', opacity: 0, filter: `url(#${glowId})` }, svg);
      const pocket = line(svg, 'M150,262 L330,262 L330,380 C330,432 150,432 150,380 Z M150,282 L330,282', { c: PAPER, w: 3 });
      const mini = mk('g', { opacity: 0 }, svg);
      line(mini, 'M200,96 L280,96 L280,206 L200,206 Z M200,123 L280,123 M200,150 L280,150 M200,178 L280,178 M240,96 L240,123 M220,123 L220,150 M260,123 L260,150 M240,150 L240,178 M220,178 L220,206 M260,178 L260,206', { c: PAPER, w: 2.2 });
      gsap.set(mini, { svgOrigin: '240 206' }); gsap.set(mini.querySelectorAll('path'), { strokeDashoffset: 0 });
      const x = line(svg, 'M196,300 L284,388 M284,300 L196,388', { c: CORAL, w: 6, go: 0.5 });
      const l1 = text(svg, 675, 534, '靠着祂', { s: 44, c: GOLD, ls: '0.24em', wt: 700 }), l2 = text(svg, 240, 534, '拿着祂', { s: 44, c: CORAL, ls: '0.24em', wt: 700 });
      const t0 = AT(s.at); DRAW(tl, ground, t0 - 0.2, 0.8); DRAW(tl, wall, t0, 1.4); tl.to(wallBg, { opacity: 1, duration: 1.0 }, t0 + 0.5); DRAW(tl, person, t0 + 0.7, 1.2);
      tl.to(glow, { opacity: 0.35, duration: 1.0 }, t0 + 1.6);
      const tp = AT(s.pocket); DRAW(tl, pocket, tp, 0.9); tl.to(mini, { opacity: 1, duration: 0.5 }, tp + 0.4);
      tl.to(mini, { y: 70, scale: 0.92, duration: 0.7, ease: 'power2.in' }, tp + 1.0); tl.to(mini, { y: -10, scale: 1, duration: 0.6, ease: 'back.out(2)' }, tp + 1.7); DRAW(tl, x, tp + 2.0, 0.5);
      SHOW(tl, l1, AT(s.lean2)); SHOW(tl, l2, AT(s.grab)); tl.to([pocket, mini, x], { opacity: 0.45, duration: 0.8 }, AT(s.grab) + 0.6);
    },
    // 工地和图纸：左边工地天天在变（搭脚手架 → 拆脚手架 → 挖地基 → 浇楼板），右边那张蓝图从头到尾一直是那一张
    blueprint({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 560);
      const G = 470, bx0 = 140, bx1 = 400, fl = [G, G - 92, G - 184, G - 276, G - 368];      // 地面、各层楼面
      const ground = line(svg, `M60,${G} L520,${G}`, { c: PAPER, w: 2.2, go: 0.15 });
      const frame = line(svg, `M${bx0},${G} L${bx0},${fl[4]} L${bx1},${fl[4]} L${bx1},${G} ` + fl.slice(1, 4).map(y => `M${bx0},${y} L${bx1},${y}`).join(' ') + ` M${(bx0 + bx1) / 2},${G} L${(bx0 + bx1) / 2},${fl[4]}`, { c: GOLD, w: 3 });
      let sc = ''; for (const x of [bx0 - 34, bx1 + 34]) sc += `M${x},${G} L${x},${fl[4] - 30} `; for (const y of [G - 46, ...fl.slice(1).map(y => y - 46), fl[4] - 30]) sc += `M${bx0 - 34},${y} L${bx0},${y} M${bx1},${y} L${bx1 + 34},${y} `;
      for (let k = 0; k < 4; k++) { const y0 = fl[k], y1 = fl[k + 1]; sc += `M${bx0 - 34},${y0} L${bx0},${y1} M${bx1 + 34},${y0} L${bx1},${y1} `; }
      const scaf = line(svg, sc, { c: PAPER, w: 2, go: 0.15 });
      const pit = line(svg, `M${bx0 - 10},${G} L${bx0 + 10},${G + 54} L${bx1 - 10},${G + 54} L${bx1 + 10},${G}`, { c: CORAL, w: 3, go: 0.35 });
      const slab = mk('rect', { x: bx0, y: fl[2] - 10, width: bx1 - bx0, height: 14, fill: GOLD, opacity: 0 }, svg);
      const lw = text(svg, 270, 540, '工地：天天在变', { s: 30, ls: '0.12em' });
      const steps = [['搭脚手架', s.up], ['拆脚手架', s.down], ['挖地基', s.dig], ['浇楼板', s.slab]].map(([w, at], i) => [text(svg, 60, 70 + i * 0, w, { s: 34, a: 'start', c: '#e2d6bd', font: 'LXGW WenKai', wt: 400 }), at]);
      // 蓝图：一张蓝纸，白线网格，画的就是这栋楼
      const px0 = 590, py0 = 96, pw = 340, ph = 380, sk = 0.62, ox = px0 + 40 - bx0 * sk, oy = py0 + 60 - fl[4] * sk;
      const paper = mk('rect', { x: px0, y: py0, width: pw, height: ph, rx: 4, fill: grad(defs, 'bp' + uid, 'linearGradient', { x1: px0, y1: py0, x2: px0 + pw, y2: py0 + ph }, [[0, '#2a5a92'], [1, '#163a66']]), opacity: 0 }, svg);
      let gr = ''; for (let x = px0 + 20; x < px0 + pw; x += 20) gr += `M${x},${py0 + 6} L${x},${py0 + ph - 6} `; for (let y = py0 + 20; y < py0 + ph; y += 20) gr += `M${px0 + 6},${y} L${px0 + pw - 6},${y} `;
      const grid = mk('path', { d: gr, stroke: '#cfe3fb', 'stroke-width': 0.8, opacity: 0, fill: 'none' }, svg);
      const T = (x, y) => `${(ox + x * sk).toFixed(1)},${(oy + y * sk).toFixed(1)}`;
      const plan = line(svg, `M${T(bx0, G)} L${T(bx0, fl[4])} L${T(bx1, fl[4])} L${T(bx1, G)} Z ` + fl.slice(1, 4).map(y => `M${T(bx0, y)} L${T(bx1, y)}`).join(' ') + ` M${T((bx0 + bx1) / 2, G)} L${T((bx0 + bx1) / 2, fl[4])}`, { c: '#f2f8ff', w: 2.2, gc: '#9cc7e8', go: 0.5 });
      const ptitle = text(svg, px0 + pw - 18, py0 + ph - 18, '图纸 · 一张', { s: 22, a: 'end', c: '#dcecfb', ls: '0.2em', wt: 400 });
      const lp = text(svg, px0 + pw / 2, 540, '图纸：从头到尾就是那一张', { s: 30, c: GOLD, ls: '0.08em' });
      const t0 = AT(s.at); DRAW(tl, ground, t0, 0.8); DRAW(tl, frame, t0 + 0.2, 1.4); SHOW(tl, lw, s.site !== undefined ? AT(s.site) : t0 + 0.6);
      steps.forEach(([lab, at], i) => { const t = AT(at); SHOW(tl, lab, t); if (i < 3) tl.to(lab, { opacity: 0, duration: 0.4 }, AT(steps[i + 1][1]) - 0.1); });
      const tu = AT(s.up); DRAW(tl, scaf, tu, 1.0);
      const td = AT(s.down); tl.to(scaf, { opacity: 0, duration: 0.8 }, td);
      const tg = AT(s.dig); DRAW(tl, pit, tg, 0.8);
      const tsl = AT(s.slab); tl.fromTo(slab, { opacity: 0, scaleX: 0 }, { opacity: 0.85, scaleX: 1, svgOrigin: `${bx0} ${fl[2]}`, duration: 0.8, ease: 'power2.out', immediateRender: false }, tsl);
      const tp = AT(s.plan); tl.to(paper, { opacity: 1, duration: 0.8 }, tp - 0.3); tl.to(grid, { opacity: 0.18, duration: 0.8 }, tp - 0.1); DRAW(tl, plan, tp, 1.4); SHOW(tl, ptitle, tp + 0.8); SHOW(tl, lp, tp + 0.6);
      tl.fromTo(plan._p[0], { opacity: 0.36 }, { opacity: 0.9, duration: 0.9, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, tp + 1.6);
    },
    // 欠债的账本：一千万银子，一辈子还不清 → 主人“免了他的债”（一道红线、一个“免”字印）→ 可这笔债是有人还的：十字架，“付清”
    ledger({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 540);
      const book = line(svg, 'M150,90 C300,70 430,80 500,110 C570,80 700,70 850,90 L850,470 C700,450 570,460 500,490 C430,460 300,450 150,470 Z M500,110 L500,490', { c: PAPER, w: 3 });
      const rows = line(svg, [0, 1, 2, 3, 4, 5].map(k => `M190,${160 + k * 50} L460,${155 + k * 50}`).join(' ') + ' ' + [0, 1, 2, 3, 4, 5].map(k => `M540,${155 + k * 50} L810,${160 + k * 50}`).join(' '), { c: '#b9ab90', w: 1.3, go: 0, glow: false });
      gsap.set(rows._p, { strokeDashoffset: 0 }); gsap.set(rows, { opacity: 0 });
      const who = text(svg, 325, 150, '欠 主人', { s: 34, c: '#e2d6bd', font: 'LXGW WenKai', wt: 400 });
      const amt = text(svg, 675, 300, '一千万银子', { s: 54, c: CORAL, wt: 900, ls: '0.06em' });
      const never = text(svg, 675, 360, '一辈子还不清', { s: 28, c: '#e2d6bd', font: 'LXGW WenKai', wt: 400 });
      const cut = line(svg, 'M548,288 L802,282', { c: '#d9452b', w: 6, go: 0.4 });
      const st = (x, y, w, c, t) => { const g = mk('g', { opacity: 0 }, svg); mk('rect', { x: x - w / 2, y: y - 44, width: w, height: 88, rx: 6, fill: 'none', stroke: c, 'stroke-width': 5 }, g); const tx = text(g, x, y + 16, t, { s: 46, c, wt: 900, ls: '0.1em' }); gsap.set(g, { rotation: -10, svgOrigin: `${x} ${y}` }); return g; };
      const free = st(700, 420, 120, '#d9452b', '免'), paid = st(320, 400, 210, GOLD, '付清');
      const cross = line(svg, 'M320,190 L320,330 M276,226 L364,226', { c: GOLD, w: 5, go: 0.7 });
      const cg = mk('ellipse', { cx: 320, cy: 250, rx: 80, ry: 100, fill: grad(defs, 'lc' + uid, 'radialGradient', { cx: 320, cy: 250, r: 100 }, [[0, '#ffe6a6', 0.45], [1, GOLD, 0]]), opacity: 0 }, svg);
      const t0 = AT(s.at); DRAW(tl, book, t0, 1.2); tl.to(rows, { opacity: 0.5, duration: 0.8 }, t0 + 0.6); SHOW(tl, who, t0 + 0.8);
      const td = AT(s.debt); SHOW(tl, amt, td); SHOW(tl, never, AT(s.never ?? s.debt) + 0.4);
      const tf = AT(s.forgive); DRAW(tl, cut, tf, 0.6); tl.fromTo(free, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, svgOrigin: '700 420', duration: 0.5, ease: 'back.out(2)', immediateRender: false }, tf + 0.5); tl.to([amt, never], { opacity: 0.4, duration: 0.6 }, tf + 0.5);
      if (s.cross !== undefined) { const tc = AT(s.cross); tl.to(cg, { opacity: 1, duration: 1.0 }, tc); DRAW(tl, cross, tc, 1.0); tl.to(who, { opacity: 0.3, duration: 0.6 }, tc); }
      if (s.paid !== undefined) { const tpd = AT(s.paid); tl.fromTo(paid, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, svgOrigin: '320 400', duration: 0.5, ease: 'back.out(2)', immediateRender: false }, tpd); }
    },
    // 孩子的画：一张歪歪扭扭的画（房子、太阳、两个小人），“爸爸，送给你”，然后贴在冰箱上（两条胶带），一贴好多年
    fridge({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 540);
      const fx = 560, fy = 40, fw = 300, fh = 470;
      const fr = line(svg, `M${fx + 16},${fy} L${fx + fw - 16},${fy} Q${fx + fw},${fy} ${fx + fw},${fy + 16} L${fx + fw},${fy + fh} L${fx},${fy + fh} L${fx},${fy + 16} Q${fx},${fy} ${fx + 16},${fy} Z M${fx},${fy + 150} L${fx + fw},${fy + 150} M${fx + 30},${fy + 60} L${fx + 30},${fy + 120} M${fx + 30},${fy + 190} L${fx + 30},${fy + 300}`, { c: PAPER, w: 3 });
      const pic = mk('g', { opacity: 0 }, svg), cx = 710, cy = 330;
      mk('rect', { x: cx - 110, y: cy - 80, width: 220, height: 160, fill: '#f6f0e2', stroke: '#d8cbb0', 'stroke-width': 2 }, pic);
      const crayon = (d, c) => { const p = mk('path', { d, fill: 'none', stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, pic); return p; };
      crayon(`M${cx - 70},${cy + 50} L${cx - 70},${cy} L${cx - 30},${cy - 36} L${cx + 8},${cy + 2} L${cx + 6},${cy + 52} Z M${cx - 44},${cy + 50} L${cx - 44},${cy + 22} L${cx - 22},${cy + 22} L${cx - 22},${cy + 50}`, '#d9603c');
      crayon(`M${cx + 70},${cy - 46} m-16,0 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0 M${cx + 70},${cy - 72} L${cx + 70},${cy - 66} M${cx + 96},${cy - 46} L${cx + 90},${cy - 46} M${cx + 44},${cy - 46} L${cx + 50},${cy - 46}`, '#e8b23c');
      crayon(`M${cx + 34},${cy + 50} L${cx + 42},${cy + 26} L${cx + 50},${cy + 50} M${cx + 42},${cy + 26} L${cx + 42},${cy + 8} M${cx + 32},${cy + 16} L${cx + 52},${cy + 16} M${cx + 42},${cy + 2} m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M${cx + 64},${cy + 50} L${cx + 70},${cy + 34} L${cx + 76},${cy + 50} M${cx + 70},${cy + 34} L${cx + 70},${cy + 22} M${cx + 70},${cy + 16} m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0`, '#4f86c6');
      crayon(`M${cx - 100},${cy + 62} C${cx - 40},${cy + 56} ${cx + 40},${cy + 66} ${cx + 100},${cy + 60}`, '#5aa05a');
      gsap.set(pic, { svgOrigin: `${cx} ${cy}` });
      const tape = mk('g', { opacity: 0 }, svg); [[cx - 96, cy - 84, -24], [cx + 96, cy - 84, 24]].forEach(([x, y, r]) => mk('rect', { x: x - 28, y: y - 9, width: 56, height: 18, fill: 'rgba(250,240,200,.55)', stroke: 'rgba(250,240,200,.8)', 'stroke-width': 1, transform: `rotate(${r} ${x} ${y})` }, tape));
      const say = text(svg, 250, 210, '“爸爸，送给你！”', { s: 40, c: PAPER, font: 'LXGW WenKai', wt: 400 });
      const yrs = text(svg, 250, 300, '一贴，就贴了好多年', { s: 34, c: GOLD, font: 'LXGW WenKai', wt: 400 });
      const t0 = AT(s.at); DRAW(tl, fr, t0, 1.2);
      tl.fromTo(pic, { opacity: 0, x: -440, y: 90, rotation: -14, scale: 0.8 }, { opacity: 1, x: -440, y: 60, rotation: -8, scale: 0.9, duration: 0.8, ease: 'power2.out', immediateRender: false }, t0 + 0.4);
      const tg = AT(s.give); SHOW(tl, say, tg);
      const ts = AT(s.stick); tl.to(pic, { x: 0, y: 0, rotation: -3, scale: 1, duration: 1.2, ease: 'power2.inOut' }, ts); tl.to(tape, { opacity: 1, duration: 0.4 }, ts + 1.1); tl.to(say, { opacity: 0.35, duration: 0.6 }, ts); SHOW(tl, yrs, ts + 1.2);
    },
    // 领带：零花钱从爸爸那里来 → 孩子拿它买了一条领带 → 爸爸照样系上，逢人就说“这是我儿子送的”
    tie({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 520);
      const dad = text(svg, 200, 120, '爸爸', { s: 40, c: PAPER, ls: '0.2em' }), kid = text(svg, 800, 120, '孩子', { s: 40, c: PAPER, ls: '0.2em' });
      const collar = line(svg, 'M140,200 L200,240 L260,200 M168,196 L200,226 L232,196', { c: PAPER, w: 3 });
      const TIE = (x, y) => `M${x - 12},${y} L${x + 12},${y} L${x + 18},${y + 22} L${x + 8},${y + 30} L${x + 26},${y + 150} L${x},${y + 176} L${x - 26},${y + 150} L${x - 8},${y + 30} L${x - 18},${y + 22} Z`;
      const tie = mk('g', { opacity: 0 }, svg); mk('path', { d: TIE(800, 220), fill: grad(defs, 'ti' + uid, 'linearGradient', { x1: 780, y1: 220, x2: 820, y2: 400 }, [[0, '#d9603c'], [1, '#9c3a22']]), stroke: '#f0b48e', 'stroke-width': 2 }, tie);
      for (let k = 0; k < 4; k++) mk('path', { d: `M${786},${262 + k * 30} L${814},${248 + k * 30}`, stroke: '#f6c9a8', 'stroke-width': 3, opacity: 0.7 }, tie);
      gsap.set(tie, { svgOrigin: '800 220' });
      const coins = [0, 1, 2].map(k => { const c = mk('g', { opacity: 0 }, svg); mk('ellipse', { cx: 200, cy: 330, rx: 26, ry: 26, fill: grad(defs, 'co' + uid + k, 'radialGradient', { cx: 194, cy: 322, r: 30 }, [[0, '#fff3cf'], [0.6, '#e2bd76'], [1, '#a77b35']]), stroke: '#fff1c6', 'stroke-width': 2 }, c); text(c, 200, 341, '¥', { s: 28, c: '#6b4b1c', wt: 700, ls: '0' }); return c; });
      const arc = line(svg, 'M240,300 C400,220 600,220 760,300', { c: GOLD, w: 2.4, go: 0.3 }), lm = text(svg, 500, 220, '零花钱', { s: 30, c: GOLD, font: 'LXGW WenKai', wt: 400 });
      const back = line(svg, 'M760,420 C600,480 400,480 240,420', { c: CORAL, w: 2.4, go: 0.3 }), lt = text(svg, 500, 500, '领带', { s: 30, c: CORAL, font: 'LXGW WenKai', wt: 400 });
      const say = text(svg, 500, 60, '“这是我儿子送的！”', { s: 40, c: GOLD, font: 'LXGW WenKai', wt: 400 });
      const t0 = AT(s.at); SHOW(tl, kid, t0); tl.fromTo(tie, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }, t0 + 0.3);
      const tm = AT(s.money); SHOW(tl, dad, tm - 0.4); DRAW(tl, collar, tm - 0.3, 0.8); DRAW(tl, arc, tm, 1.0); SHOW(tl, lm, tm + 0.3);
      coins.forEach((c, k) => { tl.to(c, { opacity: 1, duration: 0.3 }, tm + 0.2 + k * 0.25); tl.to(c, { x: 600, y: -60 * Math.sin(Math.PI * 0.5), duration: 1.2, ease: 'power1.inOut' }, tm + 0.4 + k * 0.25); tl.to(c, { opacity: 0, duration: 0.4 }, tm + 1.5 + k * 0.25); });
      DRAW(tl, back, tm + 1.8, 1.0); SHOW(tl, lt, tm + 2.1);
      if (s.wear !== undefined) { const tw = AT(s.wear); tl.to(tie, { x: -600, y: -0, scale: 0.6, duration: 1.4, ease: 'power2.inOut' }, tw); SHOW(tl, say, s.sayAt !== undefined ? AT(s.sayAt) : tw + 1.2); } else gsap.set(say, { opacity: 0 });
    },
    // 滔滔不绝：一个人周围冒出一个又一个话泡（工作、房子、新闻、八卦……），可一句都不是对神说的；最后只亮起一个：“我的天主”
    chatter({ tl, el, AT, s }) {
      const { svg, defs, uid, glowId } = base(el, 540);
      const person = line(svg, 'M500,330 m-34,0 a34,34 0 1,0 68,0 a34,34 0 1,0 -68,0 M430,470 C440,400 560,400 570,470', { c: PAPER, w: 3.4 });
      const words = s.words || ['工作', '房子', '新闻', '八卦', '上班', '吃饭', '朋友圈', '天气'];
      const P = [[260, 230], [740, 240], [330, 120], [670, 110], [180, 360], [820, 370], [500, 60], [880, 160]];
      const bub = (x, y, t, c, sz) => { const g = mk('g', { opacity: 0 }, svg); const w = t.length * sz + 40; mk('path', { d: `M${x - w / 2 + 14},${y - 30} L${x + w / 2 - 14},${y - 30} Q${x + w / 2},${y - 30} ${x + w / 2},${y - 16} L${x + w / 2},${y + 16} Q${x + w / 2},${y + 30} ${x + w / 2 - 14},${y + 30} L${x + 12},${y + 30} L${x},${y + 46} L${x - 6},${y + 30} L${x - w / 2 + 14},${y + 30} Q${x - w / 2},${y + 30} ${x - w / 2},${y + 16} L${x - w / 2},${y - 16} Q${x - w / 2},${y - 30} ${x - w / 2 + 14},${y - 30} Z`, fill: 'rgba(241,232,214,.06)', stroke: c, 'stroke-width': 2 }, g); text(g, x, y + sz * 0.36, t, { s: sz, c, font: 'LXGW WenKai', wt: 400, ls: '0.04em' }); gsap.set(g, { svgOrigin: `${x} ${y + 40}` }); return g; };
      const bs = words.map((w, i) => bub(P[i % P.length][0], P[i % P.length][1], w, '#cdbfa3', 28));
      const one = bub(500, 200, '我的天主', GOLD, 40);
      const halo = mk('ellipse', { cx: 500, cy: 200, rx: 170, ry: 80, fill: grad(defs, 'ch' + uid, 'radialGradient', { cx: 500, cy: 200, r: 170 }, [[0, '#ffe6a6', 0.4], [1, GOLD, 0]]), opacity: 0 }, svg);
      const t0 = AT(s.at); DRAW(tl, person, t0, 1.0);
      const tb = AT(s.talk), tw = (s.tws || []).map(AT), last = tw.length ? tw[tw.length - 1] : tb;   // tws：前几个话泡各自说到时出来，后面的接着冒
      bs.forEach((b, i) => tl.fromTo(b, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, i < tw.length ? tw[i] : (tw.length ? last + 0.5 + (i - tw.length) * 0.32 : tb + i * 0.32)));
      const tn = AT(s.none); tl.to(bs, { opacity: 0.18, duration: 0.8 }, tn);
      if (s.one !== undefined) { const to = AT(s.one); tl.to(bs, { opacity: 0, duration: 0.6 }, to - 0.2); tl.to(halo, { opacity: 1, duration: 1.0 }, to); tl.fromTo(one, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)', immediateRender: false }, to); }
    },
    // 神是“之一”还是中心：一张清单（工作、家庭、身体、爱好、神），神只是其中一行 → 神挪到正中，别的绕着祂转
    orbit({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 560);
      const items = s.items || ['工作', '家庭', '身体', '爱好', '神'], n = items.length;
      const cx = 500, cy = 268, rx = 250, ry = 168, ang = k => -Math.PI / 2 + k * 2 * Math.PI / (n - 1);
      const ell = `M${cx + rx},${cy} A${rx},${ry} 0 1 1 ${cx - rx},${cy} A${rx},${ry} 0 1 1 ${cx + rx},${cy}`;
      const ring = line(svg, ell, { c: GOLD, w: 1.6, go: 0.12 });
      const halo = mk('ellipse', { cx, cy, rx: 150, ry: 110, fill: grad(defs, 'oh' + uid, 'radialGradient', { cx, cy, r: 150 }, [[0, '#ffe6a6', 0.45], [1, GOLD, 0]]), opacity: 0 }, svg);
      const boxes = items.map((w, i) => {
        const god = i === n - 1, g = mk('g', { opacity: 0 }, svg);
        mk('rect', { x: -110, y: -30, width: 220, height: 60, rx: 10, fill: 'rgba(241,232,214,.06)', stroke: god ? GOLD : '#cdbfa3', 'stroke-width': 2 }, g);
        mk('rect', { x: -94, y: -12, width: 24, height: 24, rx: 4, fill: 'none', stroke: '#9d927b', 'stroke-width': 2 }, g);
        text(g, 12, 12, w, { s: 34, c: god ? GOLD : PAPER, font: 'LXGW WenKai', wt: 400 });
        gsap.set(g, { x: 300, y: 104 + i * 82 }); return g; });
      const lab1 = text(svg, 470, 278, '排在名单上的“之一”', { s: 36, c: '#e2d6bd', font: 'LXGW WenKai', wt: 400, a: 'start' });
      const lab2 = text(svg, cx, 530, '不在名单上，在中心', { s: 32, c: GOLD });
      const t0 = AT(s.at), tli = s.list !== undefined ? AT(s.list) : t0;
      const tw = s.tws ? s.tws.map(AT) : null;                  // tws：每一行说到时再出来（不给就从 list 起每 0.4 秒一行）
      boxes.forEach((g, i) => tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, tw ? tw[i] : tli + i * 0.4));
      SHOW(tl, lab1, s.one !== undefined ? AT(s.one) : tli + n * 0.4);
      if (s.center !== undefined) {
        const tc = AT(s.center); tl.to(lab1, { opacity: 0, duration: 0.5 }, tc);
        boxes.forEach((g, i) => { if (i === n - 1) tl.to(g, { x: cx, y: cy, scale: 1.25, duration: 1.4, ease: 'power2.inOut' }, tc);
          else { const a = ang(i); tl.to(g, { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), scale: 0.8, opacity: 0.75, duration: 1.4, ease: 'power2.inOut' }, tc); } });
        DRAW(tl, ring, tc + 0.9, 1.3); tl.to(halo, { opacity: 1, duration: 1.2 }, tc + 1.0); SHOW(tl, lab2, tc + 1.6);
      } else { gsap.set(ring._p, { strokeDashoffset: 1.01 }); gsap.set(lab2, { opacity: 0 }); }
    },
    // 鱼离开水：左边是水，鱼在水里游 → 跳到右边岸上，翻腾、喘不上气 → “不是水在惩罚它” → “是它离开了唯一能活的地方”
    fish({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 560);
      const WL = 300;
      const water = mk('path', { d: `M40,${WL} L520,${WL} L520,520 L40,520 Z`, fill: grad(defs, 'fw' + uid, 'linearGradient', { x1: 0, y1: WL, x2: 0, y2: 520 }, [[0, WATER, 0.26], [1, '#22415c', 0.5]]), opacity: 0 }, svg);
      let wd = ''; for (const y of [WL, WL + 70, WL + 140]) { wd += `M60,${y}`; for (let x = 60; x < 500; x += 40) wd += ` q10,-9 20,0 q10,9 20,0`; wd += ' '; }
      const waves = line(svg, wd, { c: WATER, w: 2.2, go: 0.3 });
      const shore = line(svg, `M520,${WL} C580,${WL - 6} 640,${WL + 26} 960,${WL + 34}`, { c: '#cdb38a', w: 3, go: 0.2 });
      const fishG = mk('g', { opacity: 0 }, svg);
      mk('path', { d: 'M60,0 C30,-34 -34,-34 -60,0 C-34,34 30,34 60,0 Z M-60,0 L-92,-24 L-84,0 L-92,24 Z', fill: 'rgba(226,189,118,.16)', stroke: GOLD, 'stroke-width': 3, 'stroke-linejoin': 'round' }, fishG);
      mk('circle', { cx: 34, cy: -7, r: 4.5, fill: PAPER }, fishG);
      mk('path', { d: 'M8,-22 C14,-8 14,8 8,22', fill: 'none', stroke: GOLD, 'stroke-width': 2, opacity: 0.7 }, fishG);
      gsap.set(fishG, { x: 250, y: 410, svgOrigin: '0 0' });
      const gasp = mk('g', { opacity: 0 }, svg); [[800, 220, 7], [826, 196, 9], [858, 178, 11]].forEach(([x, y, r]) => mk('circle', { cx: x, cy: y, r, fill: 'none', stroke: PAPER, 'stroke-width': 2 }, gasp));
      const splash = line(svg, 'M505,292 q-14,-34 -34,-40 M520,288 q0,-40 -6,-56 M535,292 q14,-30 30,-36', { c: WATER, w: 2.4, go: 0.3 });
      const l1 = text(svg, 500, 96, '不是水在惩罚它', { s: 38, c: PAPER, font: 'LXGW WenKai', wt: 400 });
      const l2 = text(svg, 500, 152, '是它离开了唯一能活的地方', { s: 38, c: GOLD });
      const t0 = AT(s.at), tld = AT(s.land);
      tl.to(water, { opacity: 1, duration: 0.8 }, t0); DRAW(tl, waves, t0, 1.2); DRAW(tl, shore, t0 + 0.3, 1.0);
      tl.to(fishG, { opacity: 1, duration: 0.6 }, t0 + 0.6);
      const sw = Math.max(0, tld - t0 - 0.8), k = Math.max(1, Math.floor(sw / 1.0));
      tl.to(fishG, { x: 330, duration: sw, ease: 'none' }, t0 + 0.6);
      tl.to(fishG, { y: 396, rotation: -4, duration: sw / (k + 1), yoyo: true, repeat: k, ease: 'sine.inOut' }, t0 + 0.6);
      gsap.set(splash._p, { strokeDashoffset: 1.01 });
      tl.to(fishG, { x: 520, y: 180, rotation: -32, duration: 0.6, ease: 'power2.out' }, tld);
      tl.to(fishG, { x: 720, y: 292, rotation: 14, duration: 0.6, ease: 'power2.in' }, tld + 0.6);
      DRAW(tl, splash, tld + 0.15, 0.5); tl.to(splash, { opacity: 0, duration: 0.8 }, tld + 1.0);
      if (s.gasp !== undefined) { const tg = AT(s.gasp);
        tl.to(fishG, { rotation: -22, duration: 0.32, yoyo: true, repeat: 5, ease: 'sine.inOut' }, tg);
        tl.to(gasp, { opacity: 1, duration: 0.5 }, tg + 0.3); tl.to(gasp, { opacity: 0.25, duration: 1.2 }, tg + 2.2); }
      if (s.not !== undefined) SHOW(tl, l1, AT(s.not)); else gsap.set(l1, { opacity: 0 });
      if (s.left !== undefined) { const tlf = AT(s.left); SHOW(tl, l2, tlf); tl.to(water, { opacity: 0.6, duration: 0.6, yoyo: true, repeat: 1 }, tlf); } else gsap.set(l2, { opacity: 0 });
    },
    // 收音机：电台一直在播（塔上一圈一圈的信号）→ 收音机没调准，只有杂音 → 指针转到那个频道，杂音退去，变成清楚的声音
    radio({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 560);
      const tower = line(svg, 'M150,360 L190,130 L230,360 M162,290 L218,290 M171,236 L209,236 M180,184 L200,184 M190,130 L190,108', { c: PAPER, w: 3 });
      const rings = [1, 2, 3, 4].map(k => { const r = 30 + k * 52; return line(svg, `M${(190 + r * Math.cos(-0.85)).toFixed(1)},${(108 + r * Math.sin(-0.85)).toFixed(1)} A${r},${r} 0 0 1 ${(190 + r * Math.cos(0.85)).toFixed(1)},${(108 + r * Math.sin(0.85)).toFixed(1)}`, { c: WATER, w: 2.2, go: 0.35 }); });
      const bx = 560, by = 230, bw = 340, bh = 230;
      const box = line(svg, `M${bx + 18},${by} L${bx + bw - 18},${by} Q${bx + bw},${by} ${bx + bw},${by + 18} L${bx + bw},${by + bh - 18} Q${bx + bw},${by + bh} ${bx + bw - 18},${by + bh} L${bx + 18},${by + bh} Q${bx},${by + bh} ${bx},${by + bh - 18} L${bx},${by + 18} Q${bx},${by} ${bx + 18},${by} Z M${bx + bw - 60},${by} L${bx + bw - 10},${by - 120}`, { c: PAPER, w: 3 });
      let gr = ''; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const x = bx + 50 + i * 26, y = by + 90 + j * 26; gr += `M${x + 6},${y} A6,6 0 1 1 ${x - 6},${y} A6,6 0 1 1 ${x + 6},${y} `; }
      const grille = line(svg, gr, { c: '#b9ab90', w: 1.6, go: 0, glow: false });
      let tk = `M${bx + 190},${by + 60} L${bx + 310},${by + 60} `; for (let i = 0; i <= 12; i++) { const x = bx + 190 + i * 10; tk += `M${x},${by + 60} L${x},${by + (i % 3 ? 52 : 46)} `; }
      const scale = line(svg, tk, { c: '#cdbfa3', w: 1.6, go: 0, glow: false });
      const mark = mk('circle', { cx: bx + 290, cy: by + 74, r: 4, fill: GOLD, opacity: 0 }, svg);
      const ptr = mk('path', { d: `M0,${by + 40} L0,${by + 80}`, stroke: CORAL, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, svg); gsap.set(ptr, { x: bx + 205 });
      let sr = 7; const r = () => (sr = (sr * 9301 + 49297) % 233280) / 233280;
      let nz = `M${bx + 190},${by + 150}`; for (let x = bx + 194; x <= bx + 316; x += 4) nz += ` L${x},${(by + 150 + (r() - 0.5) * 46).toFixed(1)}`;
      const noise = line(svg, nz, { c: '#9d927b', w: 2, go: 0.15 });
      let sn = `M${bx + 190},${by + 150}`; for (let x = bx + 192; x <= bx + 316; x += 2) sn += ` L${x},${(by + 150 - 22 * Math.sin((x - bx - 190) / 124 * Math.PI * 4)).toFixed(1)}`;
      const sine = line(svg, sn, { c: GOLD, w: 2.6, go: 0.5 });
      const glowC = mk('ellipse', { cx: bx + 102, cy: by + 128, rx: 110, ry: 90, fill: grad(defs, 'rg' + uid, 'radialGradient', { cx: bx + 102, cy: by + 128, r: 110 }, [[0, '#ffe6a6', 0.35], [1, GOLD, 0]]), opacity: 0 }, svg);
      const lsig = text(svg, 250, 430, '电台一直在播', { s: 32, c: '#e2d6bd', font: 'LXGW WenKai', wt: 400 });
      const lsta = text(svg, bx + bw / 2, by + bh + 60, '没调准：只能听到沙沙的杂音', { s: 30, c: '#cdbfa3', font: 'LXGW WenKai', wt: 400 });
      const ltun = text(svg, bx + bw / 2, by + bh + 60, '调准了：听见了', { s: 32, c: GOLD });
      const t0 = AT(s.at); DRAW(tl, tower, t0, 1.0); DRAW(tl, box, t0 + 0.3, 1.2); DRAW(tl, grille, t0 + 0.8, 1.0); DRAW(tl, scale, t0 + 0.9, 0.8);
      tl.to([ptr, mark], { opacity: 1, duration: 0.5 }, t0 + 1.4);
      const tsg = s.signal !== undefined ? AT(s.signal) : t0 + 1.2;
      rings.forEach((g, k) => DRAW(tl, g, tsg + k * 0.35, 0.8)); SHOW(tl, lsig, tsg + 0.6);
      const tst = s.static !== undefined ? AT(s.static) : tsg + 2;
      DRAW(tl, noise, tst, 1.0); SHOW(tl, lsta, tst + 0.3);
      tl.to(ptr, { x: bx + 222, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 }, tst + 0.4);
      if (s.tune !== undefined) { const ttu = AT(s.tune);
        tl.to(ptr, { x: bx + 290, duration: 1.2, ease: 'power2.inOut' }, ttu);
        tl.to([noise, lsta], { opacity: 0, duration: 0.8 }, ttu + 0.9); DRAW(tl, sine, ttu + 1.0, 1.2);
        tl.to(glowC, { opacity: 1, duration: 1.0 }, ttu + 1.1); SHOW(tl, ltun, ttu + 1.4);
      } else { gsap.set(sine._p, { strokeDashoffset: 1.01 }); gsap.set(ltun, { opacity: 0 }); }
    },

    // 小学生在台上，眼睛往台下找爸妈的脸：台口、台上的孩子、一排座位 → 目光一排扫过去 → 中间座位亮起一张笑脸（不怕了） → 笑脸淡去，座位空了
    seats({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 520);
      const stage = line(svg, 'M70,170 Q500,140 930,170', { c: PAPER, w: 3, go: 0.2 });
      const kid = line(svg, 'M518,46 A18,18 0 1 1 482,46 A18,18 0 1 1 518,46 M500,64 L500,116 M500,80 L474,102 M500,80 L526,102 M500,116 L484,152 M500,116 L516,152', { c: GOLD, w: 3.4 });
      const xs = [180, 340, 500, 660, 820], sy = 440;
      const seatD = x => `M${x - 50},${sy} L${x - 50},${sy - 66} Q${x - 50},${sy - 92} ${x - 24},${sy - 92} L${x + 24},${sy - 92} Q${x + 50},${sy - 92} ${x + 50},${sy - 66} L${x + 50},${sy} M${x - 64},${sy} L${x + 64},${sy} M${x - 64},${sy - 34} L${x - 64},${sy + 34} M${x + 64},${sy - 34} L${x + 64},${sy + 34}`;
      const seatsG = xs.map(x => line(svg, seatD(x), { c: '#9d927b', w: 2.6, go: 0.12 }));
      const beam = mk('path', { d: 'M500,52 L452,330 L548,330 Z', fill: grad(defs, 'bm' + uid, 'linearGradient', { x1: 0, y1: 52, x2: 0, y2: 330 }, [[0, '#fff1c8', 0.42], [1, '#fff1c8', 0]]), opacity: 0 }, svg);
      gsap.set(beam, { svgOrigin: '500 52' });
      const fx = 500, fy = sy - 140;
      const halo = mk('circle', { cx: fx, cy: fy, r: 80, fill: grad(defs, 'fh' + uid, 'radialGradient', { cx: fx, cy: fy, r: 80 }, [[0, '#ffe6a6', 0.55], [1, GOLD, 0]]), opacity: 0 }, svg);
      const face = line(svg, `M${fx + 34},${fy} A34,34 0 1 1 ${fx - 34},${fy} A34,34 0 1 1 ${fx + 34},${fy} M${fx - 12},${fy - 9} L${fx - 12},${fy - 4} M${fx + 12},${fy - 9} L${fx + 12},${fy - 4} M${fx - 16},${fy + 10} Q${fx},${fy + 25} ${fx + 16},${fy + 10}`, { c: GOLD, w: 3 });
      const l1 = text(svg, 500, 512, '看见那张脸在笑，就不怕了', { s: 34, c: GOLD });
      const l2 = text(svg, 500, 512, '座位空着，心里也是空的', { s: 34, c: '#cdbfa3', font: 'LXGW WenKai', wt: 400 });
      const t0 = AT(s.at);
      DRAW(tl, stage, t0, 1.0); DRAW(tl, kid, t0 + 0.3, 1.0); seatsG.forEach((g, i) => DRAW(tl, g, t0 + 0.5 + i * 0.15, 0.9));
      gsap.set(face._p, { strokeDashoffset: 1.01 }); gsap.set([l1, l2], { opacity: 0 });
      if (s.look !== undefined) { const tk = AT(s.look);
        tl.fromTo(beam, { opacity: 0, rotation: 38 }, { opacity: 1, rotation: 38, duration: 0.4, immediateRender: false }, tk);
        tl.to(beam, { rotation: -38, duration: 2.2, ease: 'sine.inOut' }, tk + 0.3); tl.to(beam, { rotation: 0, duration: 1.0, ease: 'sine.inOut' }, tk + 2.5); }
      if (s.face !== undefined) { const tf = AT(s.face);
        DRAW(tl, face, tf, 0.9); tl.to(halo, { opacity: 1, duration: 1.0 }, tf + 0.3); SHOW(tl, l1, tf + 0.5); }
      if (s.empty !== undefined) { const te = AT(s.empty);
        tl.to([face, halo], { opacity: 0, duration: 0.9 }, te); tl.to(l1, { opacity: 0, duration: 0.5 }, te); tl.to(beam, { opacity: 0.4, duration: 0.9 }, te); SHOW(tl, l2, te + 0.4); }
    },
    // 一粒麦子：在上面是一粒 → 落进土里、暗下去（死了） → 扎根、发芽、长高 → 结出一穗许多子粒
    seed({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 540);
      const GY = 340, X = 600;
      const soil = mk('path', { d: `M120,${GY} L940,${GY} L940,540 L120,540 Z`, fill: grad(defs, 'sl' + uid, 'linearGradient', { x1: 0, y1: GY, x2: 0, y2: 540 }, [[0, '#7a5a3a', 0.45], [1, '#2a1d12', 0.05]]), opacity: 0 }, svg);
      const ground = line(svg, `M120,${GY} C380,${GY - 6} 700,${GY + 6} 940,${GY}`, { c: '#cdb38a', w: 3, go: 0.2 });
      const grain = mk('g', { opacity: 0 }, svg);
      const gBody = mk('ellipse', { cx: 0, cy: 0, rx: 15, ry: 25, fill: 'rgba(226,189,118,.38)', stroke: GOLD, 'stroke-width': 3 }, grain);
      mk('path', { d: 'M0,-19 L0,19', stroke: GOLD, 'stroke-width': 2, opacity: 0.7 }, grain);
      gsap.set(grain, { x: X, y: 110 });
      const roots = line(svg, `M${X},${GY + 40} C${X - 10},${GY + 76} ${X - 30},${GY + 96} ${X - 46},${GY + 128} M${X},${GY + 40} C${X + 10},${GY + 80} ${X + 32},${GY + 100} ${X + 50},${GY + 130} M${X},${GY + 42} L${X},${GY + 120}`, { c: '#cdb38a', w: 2.4, go: 0.2 });
      const stem = line(svg, `M${X},${GY + 34} C${X - 2},270 ${X + 4},200 ${X},130`, { c: '#a9d394', w: 4, go: 0.3 });
      const leaves = line(svg, `M${X},262 C${X - 30},244 ${X - 52},250 ${X - 74},232 M${X},222 C${X + 30},204 ${X + 52},210 ${X + 74},192`, { c: '#a9d394', w: 3.2, go: 0.3 });
      const kernels = [];
      for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1, y = 122 - Math.floor(i / 2) * 14, kx = X + side * 11;
        kernels.push(mk('ellipse', { cx: kx, cy: y, rx: 7, ry: 12, transform: `rotate(${side * 22} ${kx} ${y})`, fill: 'rgba(226,189,118,.45)', stroke: GOLD, 'stroke-width': 2.2, opacity: 0 }, svg)); }
      const l1 = text(svg, 300, 120, '仍旧是一粒', { s: 34, c: '#cdbfa3', font: 'LXGW WenKai', wt: 400 });
      const l2 = text(svg, 300, 300, '落在地里死了', { s: 34, c: PAPER, font: 'LXGW WenKai', wt: 400 });
      const l3 = text(svg, 300, 190, '结出许多子粒来', { s: 38, c: GOLD });
      const t0 = AT(s.at);
      tl.to(soil, { opacity: 1, duration: 0.8 }, t0); DRAW(tl, ground, t0, 1.0); tl.to(grain, { opacity: 1, duration: 0.6 }, t0 + 0.4);
      gsap.set([l1, l2, l3], { opacity: 0 }); [roots, stem, leaves].forEach(g => gsap.set(g._p, { strokeDashoffset: 1.01 }));
      if (s.one !== undefined) SHOW(tl, l1, AT(s.one));
      if (s.die !== undefined) { const td = AT(s.die);
        tl.to(l1, { opacity: 0.25, duration: 0.6 }, td);
        tl.to(grain, { y: GY + 34, rotation: 70, duration: 1.0, ease: 'power2.in' }, td);
        tl.to(gBody, { attr: { fill: 'rgba(120,96,60,.35)' }, duration: 0.8 }, td + 1.0); tl.to(grain, { opacity: 0.55, duration: 0.8 }, td + 1.0);
        SHOW(tl, l2, td + 0.9); }
      if (s.grow !== undefined) { const tg = AT(s.grow);
        DRAW(tl, roots, tg, 1.0); DRAW(tl, stem, tg + 0.5, 1.4); DRAW(tl, leaves, tg + 1.4, 1.0); tl.to(l2, { opacity: 0.35, duration: 0.6 }, tg + 0.5); }
      if (s.many !== undefined) { const tm = AT(s.many);
        kernels.forEach((k, i) => tl.fromTo(k, { opacity: 0, scale: 0.4, svgOrigin: `${X} 100` }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, tm + i * 0.09));
        SHOW(tl, l3, tm + 0.6); }
    },
    // 死，是门，不是墙：一堵砖墙 → 中间的砖淡去，现出一扇门 → 门打开，门那边是光
    doorwall({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 540);
      const X0 = 170, X1 = 830, Y0 = 70, Y1 = 470, BH = 40, BW = 110, DX0 = 430, DX1 = 570, DY0 = 190;
      const inDoor = (x, y) => x > DX0 - 2 && x < DX1 + 2 && y > DY0 - 2;
      let outer = `M${X0},${Y0} L${X1},${Y0} L${X1},${Y1} L${X0},${Y1} Z`, inner = '';
      for (let y = Y0 + BH, r = 0; y < Y1; y += BH, r++) {               // 横缝：门洞里的那一截归 inner
        if (y > DY0) { outer += ` M${X0},${y} L${DX0},${y} M${DX1},${y} L${X1},${y}`; inner += ` M${DX0},${y} L${DX1},${y}`; } else outer += ` M${X0},${y} L${X1},${y}`;
      }
      for (let y = Y0, r = 0; y < Y1; y += BH, r++) for (let x = X0 + (r % 2 ? BW / 2 : BW); x < X1; x += BW) {
        const seg = ` M${x},${y} L${x},${Math.min(Y1, y + BH)}`; if (inDoor(x, y + BH / 2)) inner += seg; else outer += seg; }
      const light = mk('rect', { x: DX0, y: DY0, width: DX1 - DX0, height: Y1 - DY0, fill: grad(defs, 'dl' + uid, 'radialGradient', { cx: 500, cy: 330, r: 220 }, [[0, '#fff6d8', 0.95], [0.6, '#ffe2a0', 0.55], [1, '#e2bd76', 0.15]]), opacity: 0 }, svg);
      const rays = mk('path', { d: `M${DX0},${Y1} L${DX0 - 160},540 L${DX1 + 160},540 L${DX1},${Y1} Z`, fill: grad(defs, 'dr' + uid, 'linearGradient', { x1: 0, y1: Y1, x2: 0, y2: 540 }, [[0, '#fff1c8', 0.4], [1, '#fff1c8', 0]]), opacity: 0 }, svg);
      const wallO = line(svg, outer, { c: '#b9ab90', w: 2.4, go: 0.12 });
      const wallI = line(svg, inner, { c: '#b9ab90', w: 2.4, go: 0.12 });
      const frame = line(svg, `M${DX0},${Y1} L${DX0},${DY0} L${DX1},${DY0} L${DX1},${Y1}`, { c: GOLD, w: 3.6 });
      const leaf = mk('rect', { x: DX0 + 3, y: DY0 + 3, width: DX1 - DX0 - 6, height: Y1 - DY0 - 3, fill: 'rgba(40,30,20,.85)', stroke: GOLD, 'stroke-width': 2, opacity: 0 }, svg);
      gsap.set(leaf, { svgOrigin: `${DX0} ${(DY0 + Y1) / 2}` });
      const lW = text(svg, 500, 44, '墙', { s: 38, c: '#cdbfa3', font: 'LXGW WenKai', wt: 400 });
      const lD = text(svg, 500, 44, '门', { s: 40, c: GOLD });
      const lO = text(svg, 500, 525, '门那边，是你的脸', { s: 36, c: GOLD });
      const t0 = AT(s.at); DRAW(tl, wallO, t0, 1.4); DRAW(tl, wallI, t0, 1.4); SHOW(tl, lW, t0 + 0.8);
      gsap.set(frame._p, { strokeDashoffset: 1.01 }); gsap.set([lD, lO], { opacity: 0 });
      if (s.door !== undefined) { const td = AT(s.door);
        tl.to(wallI, { opacity: 0, duration: 0.9 }, td); DRAW(tl, frame, td + 0.3, 1.0); tl.to(leaf, { opacity: 1, duration: 0.6 }, td + 0.6);
        tl.to(lW, { opacity: 0, duration: 0.5 }, td); SHOW(tl, lD, td + 0.6); }
      if (s.open !== undefined) { const to = AT(s.open);
        tl.to(leaf, { scaleX: 0.12, duration: 1.3, ease: 'power2.inOut' }, to); tl.to(light, { opacity: 1, duration: 1.2 }, to + 0.2); tl.to(rays, { opacity: 1, duration: 1.4 }, to + 0.5);
        SHOW(tl, lO, to + 1.0); }
    },
    // 灵魂的屋子：小屋（狭隘）→ 撑大（扩充）；墙上屋顶裂缝（毁败）→ 一道道补好（修葺）；屋里一只柜子塞满、锁着 → 打开，亮了（我承认，我知道）
    // s.big / s.fixed：这一场开始时屋子已经撑大了 / 已经补好了（接着上一场讲）
    house({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 540);
      const cx = 500, by = 470, W = 230, H = 160, K = 1.42;
      const g = mk('g', {}, svg); gsap.set(g, { svgOrigin: `${cx} ${by}` });
      const body = line(g, `M${cx - W / 2},${by} L${cx - W / 2},${by - H} L${cx + W / 2},${by - H} L${cx + W / 2},${by} Z`, { c: PAPER, w: 3 });
      const roof = line(g, `M${cx - W / 2 - 24},${by - H} L${cx},${by - H - 100} L${cx + W / 2 + 24},${by - H}`, { c: PAPER, w: 3 });
      const door = line(g, `M${cx + 40},${by} L${cx + 40},${by - 74} L${cx + 84},${by - 74} L${cx + 84},${by}`, { c: '#cdbfa3', w: 2.4, go: 0.15 });
      const cracks = line(g, `M${cx - 80},${by - H} L${cx - 70},${by - H + 30} L${cx - 84},${by - H + 52} L${cx - 72},${by - H + 84} M${cx + 20},${by - H - 72} L${cx + 34},${by - H - 46} L${cx + 22},${by - H - 26} M${cx + W / 2},${by - 120} L${cx + W / 2 - 16},${by - 104} L${cx + W / 2 - 8},${by - 86}`, { c: CORAL, w: 2.6, go: 0.25 });
      const patches = line(g, `M${cx - 92},${by - H + 22} L${cx - 62},${by - H + 22} M${cx - 92},${by - H + 64} L${cx - 62},${by - H + 64} M${cx + 10},${by - H - 52} L${cx + 42},${by - H - 52} M${cx + W / 2 - 30},${by - 104} L${cx + W / 2},${by - 104}`, { c: GOLD, w: 3 });
      const cab = mk('g', {}, g), cbx = cx - 86, cby = by - 96, cw = 74, ch = 96;
      const cabBox = line(cab, `M${cbx},${cby} L${cbx + cw},${cby} L${cbx + cw},${cby + ch} L${cbx},${cby + ch} Z`, { c: '#cdbfa3', w: 2.4, go: 0.15 });
      const cabLight = mk('rect', { x: cbx + 2, y: cby + 2, width: cw - 4, height: ch - 4, fill: grad(defs, 'cl' + uid, 'radialGradient', { cx: cbx + cw / 2, cy: cby + ch / 2, r: 70 }, [[0, '#fff6d8', 0.95], [1, '#e2bd76', 0.25]]), opacity: 0 }, cab);
      const stuff = line(cab, `M${cbx + cw},${cby + 30} l14,-8 l6,10 M${cbx + cw},${cby + 58} l18,4 l-4,10 M${cbx + 10},${cby} l-6,-14 l12,-4`, { c: CORAL, w: 2.2, go: 0.2 });
      const leafC = mk('rect', { x: cbx, y: cby, width: cw, height: ch, fill: 'rgba(52,40,28,.9)', stroke: '#cdbfa3', 'stroke-width': 2 }, cab);
      const lock = mk('circle', { cx: cbx + cw - 12, cy: cby + ch / 2, r: 5, fill: 'none', stroke: GOLD, 'stroke-width': 2 }, cab);
      gsap.set(leafC, { svgOrigin: `${cbx} ${cby + ch / 2}` });
      const lab = (t, c, y) => text(svg, 500, y, t, { s: 36, c, font: c === GOLD ? 'Noto Serif SC' : 'LXGW WenKai', wt: c === GOLD ? 500 : 400 });
      const lNarrow = lab('狭隘：装不下你', '#cdbfa3', 40), lGrow = lab('请你加以扩充', GOLD, 40);
      const lRuin = lab('毁败：墙裂了，屋顶漏水', '#cdbfa3', 40), lFix = lab('请你加以修葺', GOLD, 40);
      const lHide = lab('塞进柜子，把门一关', '#cdbfa3', 40), lOpen = lab('我承认，我知道', GOLD, 40);
      const labs = [lNarrow, lGrow, lRuin, lFix, lHide, lOpen]; gsap.set(labs, { opacity: 0 });
      gsap.set(cracks._p, { strokeDashoffset: 1.01 }); gsap.set(patches._p, { strokeDashoffset: 1.01 }); gsap.set(cab, { opacity: 0 });
      if (s.big) gsap.set(g, { scale: K });
      const t0 = AT(s.at); DRAW(tl, body, t0, 1.1); DRAW(tl, roof, t0 + 0.3, 1.0); DRAW(tl, door, t0 + 0.6, 0.8);
      if (s.fixed) { gsap.set(cracks, { opacity: 0 }); DRAW(tl, patches, t0 + 0.6, 0.8); }
      const swap = (from, to, t) => { if (from) tl.to(from, { opacity: 0, duration: 0.5 }, t); SHOW(tl, to, t + 0.3); };
      let cur = null;
      if (s.narrow !== undefined) { swap(cur, lNarrow, AT(s.narrow)); cur = lNarrow; }
      if (s.grow !== undefined) { const tg = AT(s.grow); tl.to(g, { scale: K, duration: 1.6, ease: 'power2.inOut' }, tg); swap(cur, lGrow, tg); cur = lGrow; }
      if (s.crack !== undefined) { const tc = AT(s.crack); DRAW(tl, cracks, tc, 0.9); swap(cur, lRuin, tc); cur = lRuin; }
      if (s.fix !== undefined) { const tf = AT(s.fix); tl.to(cracks, { opacity: 0, duration: 0.9 }, tf); DRAW(tl, patches, tf + 0.3, 1.0); swap(cur, lFix, tf); cur = lFix; }
      if (s.hide !== undefined) { const th = AT(s.hide); tl.to(cab, { opacity: 1, duration: 0.6 }, th); DRAW(tl, cabBox, th, 0.7); DRAW(tl, stuff, th + 0.4, 0.7); swap(cur, lHide, th); cur = lHide; }
      if (s.open !== undefined) { const to = AT(s.open); tl.to(leafC, { scaleX: 0.1, duration: 1.1, ease: 'power2.inOut' }, to); tl.to(lock, { opacity: 0, duration: 0.4 }, to);
        tl.to(cabLight, { opacity: 1, duration: 1.0 }, to + 0.3); tl.to(stuff, { opacity: 0.4, duration: 0.8 }, to + 0.3); swap(cur, lOpen, s.say !== undefined ? AT(s.say) - 0.3 : to); cur = lOpen; }   // say：“我承认，我知道”说到时才出字
    },
    // 法庭与慈爱、看不见的观众、快递员、来自与通过、圣经这副眼镜：第八讲起改用火柴人重画，在 fig.js 里
    // 一层一层加滤镜：一张自拍（简笔头像）→ 美颜、滤镜、磨皮一层层盖上去，线条越来越虚 → 一层层揭掉，露出本来的样子
    filters({ tl, el, AT, s }) {
      const { svg, defs, uid } = base(el, 540);
      const fx = 330, fy = 280, FW = 300, FH = 400;
      const frame = line(svg, `M${fx - FW / 2 + 18},${fy - FH / 2} L${fx + FW / 2 - 18},${fy - FH / 2} Q${fx + FW / 2},${fy - FH / 2} ${fx + FW / 2},${fy - FH / 2 + 18} L${fx + FW / 2},${fy + FH / 2 - 18} Q${fx + FW / 2},${fy + FH / 2} ${fx + FW / 2 - 18},${fy + FH / 2} L${fx - FW / 2 + 18},${fy + FH / 2} Q${fx - FW / 2},${fy + FH / 2} ${fx - FW / 2},${fy + FH / 2 - 18} L${fx - FW / 2},${fy - FH / 2 + 18} Q${fx - FW / 2},${fy - FH / 2} ${fx - FW / 2 + 18},${fy - FH / 2} Z`, { c: PAPER, w: 3 });
      const bf = mk('filter', { id: 'pb' + uid, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs); const blurE = mk('feGaussianBlur', { stdDeviation: 0 }, bf);
      const pg = mk('g', { filter: `url(#pb${uid})` }, svg);
      const hy = fy - 50;
      const person = line(pg, `M${fx + 62},${hy} A62,62 0 1 1 ${fx - 62},${hy} A62,62 0 1 1 ${fx + 62},${hy} M${fx - 22},${hy - 10} L${fx - 22},${hy - 4} M${fx + 22},${hy - 10} L${fx + 22},${hy - 4} M${fx - 20},${hy + 26} Q${fx},${hy + 38} ${fx + 20},${hy + 26} M${fx - 120},${fy + 190} C${fx - 116},${fy + 90} ${fx - 70},${fy + 40} ${fx},${fy + 40} C${fx + 70},${fy + 40} ${fx + 116},${fy + 90} ${fx + 120},${fy + 190}`, { c: GOLD, w: 3.2 });
      const cols = ['rgba(255,170,195,.30)', 'rgba(255,214,140,.30)', 'rgba(255,255,255,.26)'];
      const layers = cols.map(c => mk('rect', { x: fx - FW / 2 + 3, y: fy - FH / 2 + 3, width: FW - 6, height: FH - 6, rx: 16, fill: c, opacity: 0 }, svg));
      const names = ['美颜', '滤镜', '磨皮'].map((t, i) => text(svg, 760, 170 + i * 70, t, { s: 36, c: '#e8c6c0', font: 'LXGW WenKai', wt: 400 }));
      const strike = names.map((n, i) => line(svg, `M705,${158 + i * 70} L815,${158 + i * 70}`, { c: '#cdbfa3', w: 2.4, go: 0.1 }));
      const lMir = text(svg, 760, 410, '镜子里那个人才是假的？', { s: 30, c: '#cdbfa3', font: 'LXGW WenKai', wt: 400 });
      const lReal = text(svg, 760, 470, '不再给自己修图', { s: 38, c: GOLD });
      const t0 = AT(s.at); DRAW(tl, frame, t0, 1.0); DRAW(tl, person, t0 + 0.4, 1.2);
      gsap.set([...names, lMir, lReal], { opacity: 0 }); strike.forEach(g => gsap.set(g._p, { strokeDashoffset: 1.01 }));
      const tL = s.layers !== undefined ? AT(s.layers) : t0 + 1.5;
      layers.forEach((L, i) => { const t = tL + i * 0.9; tl.to(L, { opacity: 1, duration: 0.7 }, t); SHOW(tl, names[i], t + 0.1); tl.to(blurE, { attr: { stdDeviation: 1.6 * (i + 1) }, duration: 0.7 }, t); });
      if (s.mirror !== undefined) SHOW(tl, lMir, AT(s.mirror));
      if (s.real !== undefined) { const tr = AT(s.real);
        layers.slice().reverse().forEach((L, i) => { const t = tr + i * 0.45; tl.to(L, { opacity: 0, duration: 0.5 }, t); DRAW(tl, strike[2 - i], t, 0.4); tl.to(names[2 - i], { opacity: 0.35, duration: 0.5 }, t); });
        tl.to(blurE, { attr: { stdDeviation: 0 }, duration: 1.2 }, tr); tl.to(lMir, { opacity: 0.25, duration: 0.6 }, tr); SHOW(tl, lReal, tr + 1.0); }
    },
  };
})();
