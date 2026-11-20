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
    const at = { d, fill: 'none', stroke, 'stroke-width': o.w || 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 };
    const g = mk('g', {}, svg), ps = [];
    if (o.glow !== false) ps.push(mk('path', { ...at, stroke: o.gc || col, 'stroke-width': o.gw ?? (o.w || 4) * 2.4, opacity: o.go ?? 0.32, filter: `url(#f${uid})` }, g));
    const p = mk('path', { ...at, ...(o.f ? { filter: `url(#${o.f})` } : {}) }, g); ps.push(p);
    g._p = ps; g._m = p; return g;
  };
  const text = (svg, x, y, t, o = {}) => {
    const uid = svg._uid || (svg.ownerSVGElement && svg.ownerSVGElement._uid);
    const fill = o.c === GOLD && uid ? `url(#gg${uid})` : (o.c || PAPER);
    const e = mk('text', { x, y, 'text-anchor': o.a || 'middle', fill, 'font-size': o.s || 34, 'font-family': o.font || 'Noto Serif SC', 'font-weight': o.wt || 700, 'letter-spacing': o.ls ?? '0.06em' }, svg); e.textContent = t; return e;
  };
  // 描线：用样式里的 stroke-dashoffset（ep1.css 里 svg [pathLength] 有一条样式规则，会盖过同名的属性）
  const DRAW = (tl, e, at, d = 1.2) => { const t = e._p || e; gsap.set(t, { strokeDashoffset: 1 }); tl.to(t, { strokeDashoffset: 0, duration: d, ease: 'power2.inOut' }, at); };
  const SHOW = (tl, e, at, d = 0.7, o = {}) => { gsap.set(e, { opacity: 0 }); tl.fromTo(e, { opacity: 0, y: o.y ?? 12 }, { opacity: o.o ?? 1, y: 0, duration: d, ease: 'power2.out', immediateRender: false }, at); };
  const grad = (defs, id, kind, attrs, stops) => { const g = mk(kind, { id, gradientUnits: 'userSpaceOnUse', ...attrs }, defs); stops.forEach(([o, c, a]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, g)); return `url(#${id})`; };
  const BOTTLE = 'M470,60 L470,150 C470,195 330,215 330,300 L330,498 Q330,520 352,520 L648,520 Q670,520 670,498 L670,300 C670,215 530,195 530,150 L530,60';

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
      let wave = 'M200,0'; for (let x = 200, k = 0; x < 1240; x += 20, k++) wave += ` Q${x + 10},${k % 2 ? 6 : -6} ${x + 20},0`;
      const flow = mk('g', {}, lvl);
      mk('path', { d: wave + ' L1240,600 L200,600 Z', fill: waterF }, flow);
      mk('path', { d: wave, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.75, 'stroke-width': 2.4 }, flow);
      gsap.set(lvl, { y: 528 });
      const bub = [], r = rng(21);
      for (let i = 0; i < 14; i++) bub.push(mk('circle', { cx: 360 + r() * 280, cy: 505, r: 2 + r() * 4, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.7, 'stroke-width': 1.5, opacity: 0 }, inside));
      const b = line(svg, BOTTLE, { c: PAPER, w: 4.5, go: 0.4 });
      const hi = [mk('path', { d: 'M352,318 C345,380 345,440 351,492', fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0, filter: `url(#${soft})` }, svg),
        mk('path', { d: 'M378,248 C402,226 432,212 458,203', fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0, filter: `url(#${soft})` }, svg)];
      const t1 = text(svg, 215, 305, '天地', { s: 42, c: GOLD, ls: '0.3em' }), t2 = text(svg, 800, 305, '神？', { s: 42, c: '#cfe8fb', ls: '0.2em' });
      const t0 = AT(s.at), tf = AT(s.fill);
      DRAW(tl, b, t0, 1.4); tl.to(body, { opacity: 1, duration: 1.2 }, t0 + 0.4); tl.to(hi, { opacity: 0.5, duration: 1.0 }, t0 + 1.0);
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
        const q = text(svg, 500, 36, '多出来的，去哪了？', { s: 38, c: CORAL, ls: '0.12em' }); SHOW(tl, q, t1o + 0.8);
      }
    },
    // 楼和地基：楼画出来，地基亮起来——是地基托着楼
    building({ tl, el, AT, s }) {
      const { svg, glowId } = base(el);
      const parts = ['M380,470 L380,110 L620,110 L620,470', 'M380,170 L620,170 M380,230 L620,230 M380,290 L620,290 M380,350 L620,350 M380,410 L620,410', 'M470,470 L470,420 L530,420 L530,470'];
      const ls = parts.map((d, i) => line(svg, d, { c: PAPER, w: i ? 2.5 : 4 }));
      const f = mk('rect', { x: 300, y: 470, width: 400, height: 50, rx: 4, fill: GOLD, opacity: 0, filter: `url(#${glowId})` }, svg);
      const tF = text(svg, 500, 506, '地　基', { s: 30, c: '#2a2118' }), tB = text(svg, 500, 80, '楼', { s: 40 });
      ls.forEach((l, i) => DRAW(tl, l, AT(s.at) + i * 0.4, 1.3)); SHOW(tl, tB, AT(s.at) + 0.8);
      tl.to(f, { opacity: 1, duration: 1.0, ease: 'power2.out' }, AT(s.found)); SHOW(tl, tF, AT(s.found) + 0.3);
      const arrows = [430, 500, 570].map(x => line(svg, `M${x},560 L${x},480 M${x - 12},494 L${x},480 L${x + 12},494`, { c: GOLD, w: 3 }));
      arrows.forEach((a, i) => DRAW(tl, a, AT(s.found) + 0.4 + i * 0.15, 0.7));
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
        const t = text(svg, 500, 548, '罐子一直在裂，宝贝一直没丢', { s: 32, c: GOLD, ls: '0.16em' }); SHOW(tl, t, tlit + 0.8);
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
      dots.forEach(([d, x, y, tx, ty], i) => tl.to(d, { attr: { cx: tx, cy: ty }, duration: 2.2, ease: 'power3.inOut' }, AT(s.gather) + (i % 8) * 0.04));
      const core = mk('circle', { cx: 500, cy: 280, r: 30, fill: '#fff1c8', opacity: 0, filter: `url(#${glowId})` }, svg);
      tl.to(core, { opacity: 1, attr: { r: 46 }, duration: 1.0 }, AT(s.gather) + 1.4);
      const t1 = text(svg, 500, 40, '散了一地', { s: 34, c: CORAL }), t2 = text(svg, 500, 540, '神来，是把人重新收拢起来', { s: 36, c: GOLD });
      SHOW(tl, t1, AT(s.at) + 0.4); tl.to(t1, { opacity: 0, duration: 0.6 }, AT(s.gather)); SHOW(tl, t2, AT(s.gather) + 1.2);
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
        tl.fromTo(c, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)', immediateRender: false }, t1 + 0.4 + i * 0.12);
      }
      const t2 = text(svg, 500, 420, '每一个人，面对的都是整个的神', { s: 38, c: GOLD }); SHOW(tl, t2, t1 + 1.4);
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
      const { svg, glowId } = base(el);
      const P = 'M90,380 C220,380 260,250 390,262 C520,274 560,360 700,330 L758,318';
      const road = line(svg, P, { c: PAPER, w: 3 });
      const wall = mk('g', { opacity: 0 }, svg);
      mk('rect', { x: 770, y: 110, width: 96, height: 360, fill: 'rgba(235,162,124,.16)', stroke: CORAL, 'stroke-width': 4 }, wall);
      for (let i = 1; i < 6; i++) { const y = 110 + i * 60; mk('path', { d: `M770,${y} L866,${y} M${i % 2 ? 818 : 794},${y - 60} L${i % 2 ? 818 : 794},${y}`, stroke: CORAL, 'stroke-width': 2, opacity: 0.7 }, wall); }
      const me = mk('circle', { cx: 90, cy: 380, r: 15, fill: PAPER, opacity: 0, filter: `url(#${glowId})` }, svg);
      const au = mk('circle', { cx: 60, cy: 392, r: 13, fill: GOLD, opacity: 0, filter: `url(#${glowId})` }, svg);
      const t1 = text(svg, 120, 450, '错误的想法', { s: 30, c: PAPER }), t2 = text(svg, 300, 520, '奥古斯丁陪你一起走', { s: 30, c: GOLD });
      const t0 = AT(s.at);
      DRAW(tl, road, t0, 1.6); tl.to(wall, { opacity: 1, duration: 0.8 }, t0 + 0.6);
      tl.to([me, au], { opacity: 1, duration: 0.5 }, t0 + 0.4); SHOW(tl, t1, t0 + 0.5); SHOW(tl, t2, t0 + 1.2);
      // 两个点的位置全由这两段“进度”算出来（逐帧定位时也对）：从出现起走到撞墙，撞墙后往回弹一点
      const pos = (c, q, dx = 0) => { const L = road._m.getTotalLength(), pt = road._m.getPointAtLength(Math.max(0, Math.min(1, q)) * L); c.setAttribute('cx', pt.x - dx); c.setAttribute('cy', pt.y); };
      const th = AT(s.hit), ts = t0 + 0.4, D = th - ts, walk = Math.max(1.5, Math.min(D, th - t0 - 0.6)), o = { p: 0 }, b = { p: 0 };
      tl.to(o, { p: 1, duration: D, ease: 'none', onUpdate: () => { const q = Math.max(0, (o.p * D - (D - walk)) / walk) ** 1.6; pos(me, 0.1 + 0.9 * q); pos(au, 0.9 * q); } }, ts);
      tl.to(wall, { x: 7, duration: 0.07, ease: 'none' }, th); tl.to(wall, { x: -5, duration: 0.09, ease: 'none' }, th + 0.07); tl.to(wall, { x: 0, duration: 0.2, ease: 'power2.out' }, th + 0.16);
      tl.to(b, { p: 1, duration: 0.45, ease: 'power2.out', onUpdate: () => pos(me, 1, 40 * b.p) }, th + 0.02);
      const burst = [0, 1, 2, 3, 4, 5].map(i => { const a = (-150 + i * 60) * Math.PI / 180; return line(svg, `M${758 + Math.cos(a) * 26},${318 + Math.sin(a) * 26} L${758 + Math.cos(a) * 58},${318 + Math.sin(a) * 58}`, { c: CORAL, w: 4 }); });
      burst.forEach((b, i) => { DRAW(tl, b, th + i * 0.02, 0.25); tl.to(b, { opacity: 0, duration: 0.5 }, th + 0.6); });
      const tH = text(svg, 818, 80, '撞上墙', { s: 44, c: CORAL }); SHOW(tl, tH, th + 0.2);
      const tE = text(svg, 450, 160, '——自己发现：这条路走不通', { s: 34, c: GOLD }); SHOW(tl, tE, th + 1.0);
    },
    // 神像空气一样，摊在整个宇宙里，每个地方分到薄薄一层？——不是这样
    thin({ tl, el, AT, s }) {
      const { svg, defs, glowId } = base(el);
      const rg = mk('radialGradient', { id: 't' + glowId }, defs);
      mk('stop', { offset: 0, 'stop-color': '#fff3d0', 'stop-opacity': 1 }, rg); mk('stop', { offset: 0.6, 'stop-color': GOLD, 'stop-opacity': 0.8 }, rg); mk('stop', { offset: 1, 'stop-color': GOLD, 'stop-opacity': 0 }, rg);
      const box = line(svg, 'M110,90 L890,90 L890,470 L110,470 Z', { c: PAPER, w: 3 });
      const lab = text(svg, 150, 135, '宇宙', { s: 30, a: 'start', c: PAPER, wt: 400 });
      const blob = mk('ellipse', { cx: 500, cy: 280, rx: 100, ry: 100, fill: `url(#t${glowId})`, opacity: 0 }, svg);
      DRAW(tl, box, AT(s.at), 1.2); SHOW(tl, lab, AT(s.at) + 0.5); tl.to(blob, { opacity: 1, duration: 0.8 }, AT(s.at) + 0.4);
      tl.to(blob, { attr: { rx: 375, ry: 12 }, opacity: 0.55, duration: 2.2, ease: 'power2.inOut' }, AT(s.spread));
      const t1 = text(svg, 500, 230, '每个地方，分到薄薄的一层？', { s: 36, c: '#d8ecfa' }); SHOW(tl, t1, AT(s.spread) + 1.4);
      const x = line(svg, 'M170,130 L830,430', { c: CORAL, w: 7 }); DRAW(tl, x, AT(s.no), 0.5);
      const t2 = text(svg, 500, 535, '不是这样的', { s: 44, c: CORAL }); SHOW(tl, t2, AT(s.no) + 0.3);
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
      DRAW(tl, box, AT(s.at) + 0.4, 1.0); SHOW(tl, tw, AT(s.at) + 0.9);
      tl.to(wedge, { x: 400, y: 0, duration: 1.5, ease: 'power2.inOut' }, AT(s.cut)); tl.to(ghost, { opacity: 0.8, duration: 0.6 }, AT(s.cut) + 0.6);
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
      const { svg, defs, uid, glowId } = base(el);
      const b1 = line(svg, 'M110,150 L520,150 L520,460 L110,460 Z', { c: PAPER, w: 4 }), b2 = line(svg, 'M680,330 L860,330 L860,460 L680,460 Z', { c: PAPER, w: 4 });
      const sf = grad(defs, 'sf' + uid, 'linearGradient', { x1: 0, y1: 190, x2: 0, y2: 450 }, [[0, '#fff2c8'], [0.35, '#ebc883'], [1, '#a9792f']]);
      const f1 = mk('rect', { x: 124, y: 446, width: 382, height: 0, rx: 10, fill: sf, opacity: 0.92 }, svg);
      const f2 = mk('rect', { x: 694, y: 446, width: 152, height: 0, rx: 6, fill: sf, opacity: 0.92 }, svg);
      DRAW(tl, b1, AT(s.at) - 0.3, 1.0); DRAW(tl, b2, AT(s.at) - 0.1, 0.8);
      tl.to(f1, { attr: { y: 196, height: 250 }, duration: 1.6, ease: 'power2.out' }, AT(s.fill)); tl.to(f2, { attr: { y: 420, height: 26 }, duration: 1.0, ease: 'power2.out' }, AT(s.fill) + 0.2);
      const leg = text(svg, 500, 535, '金色 = 分到的神', { s: 28, c: PAPER, wt: 400 }); SHOW(tl, leg, AT(s.fill) + 0.8);
      let prev = null;
      s.pairs.forEach(([at, big, small], i) => {
        const g = mk('g', { opacity: 0 }, svg); text(g, 315, 120, big, { s: big.length > 4 ? 40 : 46, c: PAPER }); text(g, 770, 300, small, { s: small.length > 4 ? 32 : 40, c: PAPER });
        const t = AT(at);
        if (prev) tl.to(prev, { opacity: 0, y: -12, duration: 0.5 }, t - 0.25);
        tl.fromTo(g, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, t + (i ? 0.1 : -0.3));
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
      DRAW(tl, h, t0, 1.3); tl.to(hb, { opacity: 1, duration: 1.2 }, t0 + 0.4); SHOW(tl, hc, t0 + 0.8);
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
      const l1 = text(svg, 270, 498, '你家', { s: 36 }), l2 = text(svg, 730, 498, '医院', { s: 36 });
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
      const q = text(svg, 500, 296, '你究竟是什么？', { s: 46, c: '#fff3d0' });
      tl.to(sun, { opacity: 1, duration: 1.2 }, AT(s.at)); SHOW(tl, q, AT(s.at) + 0.2);
      const n = s.items.length;
      s.items.forEach((w, i) => {
        const a = -Math.PI / 2 + i / n * Math.PI * 2, x = 500 + Math.cos(a) * 395, y = 290 + Math.sin(a) * 215;
        const t = text(svg, x, y + 14, w, { s: w.length > 3 ? 38 : 44, c: GOLD });
        tl.fromTo(t, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, AT(w) - 0.05);
      });
      tl.to(sun, { attr: { r: 210 }, duration: 3, ease: 'sine.inOut' }, AT(s.items[n - 1]));
    },
  };
})();
