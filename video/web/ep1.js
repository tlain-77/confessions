// 第一讲 · 分镜时间轴。画面跟着录音走：每个动作的时间都取自录音里某个词出现的时刻（at('…')）。
// window.seek(t) 可以渲染任意时刻，逐帧截图时每一帧都能独立、确定地画出来。
(async function () {
  const EP = window.EP, MAP = window.MAP, BG = window.BG;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');

  // ---------- 录音里的词 → 时间 ----------
  const CH = EP.chars, STR = CH.map(c => c[0]).join('');
  function idx(phrase, nth = 0) { let i = -1, p = 0; for (let k = 0; k <= nth; k++) { i = STR.indexOf(phrase, p); if (i < 0) throw new Error('录音里找不到：' + phrase); p = i + 1; } return i; }
  const at = (phrase, nth = 0) => CH[idx(phrase, nth)][1];                                   // 这个词开始的时刻
  const en = (phrase, nth = 0) => CH[idx(phrase, nth) + phrase.length - 1][1] + 0.24;          // 这个词说完的时刻
  const at2 = (ctx, sub) => CH[idx(ctx) + ctx.indexOf(sub)][1];                               // 某句话里的某个词

  // ---------- 预览时适配窗口（渲染时固定 1920×1080） ----------
  let SCALE = 1;
  function fit() { SCALE = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${SCALE})`; stage.style.left = (innerWidth - 1920 * SCALE) / 2 + 'px'; stage.style.top = (innerHeight - 1080 * SCALE) / 2 + 'px'; }
  fit(); addEventListener('resize', fit);
  const box = el => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: (r.left - s.left) / SCALE, y: (r.top - s.top) / SCALE, w: r.width / SCALE, h: r.height / SCALE }; };
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- 动态生成的元素 ----------
  // 书架：80 本书
  const grid = $('.i-grid'); for (let i = 0; i < 80; i++) { const b = document.createElement('div'); b.className = 'bk'; grid.appendChild(b); }
  // 十三卷
  const tower = $('.j-tower'), CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三'], RO = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
  const jr = rng(13), slabJit = [];
  for (let i = 0; i < 13; i++) { const s = document.createElement('div'); s.className = 'slab'; s.style.top = (826 - i * 46) + 'px'; s.style.left = Math.round((jr() - 0.5) * 22) + 'px'; s.innerHTML = `<span>卷${CN[i]}</span><em>${RO[i]}</em>`; tower.appendChild(s); slabJit.push((jr() - 0.5) * 2.4); }
  // 两千年时间线：刻度和"绕不开"的弧线
  const LX = y => 180 + y * 0.77, ticks = $('.l-ticks'), arcs = $('.l-arcs');
  [1, 500, 1000, 1500, 2000].forEach(y => { svgEl('line', { x1: LX(y), y1: 630, x2: LX(y), y2: 650 }, ticks); svgEl('text', { x: LX(y), y: 700 }, ticks).textContent = y; });
  [700, 1100, 1517, 1850, 2026].forEach(y => { const a = LX(392), b = LX(y), d = (b - a) * 0.34; svgEl('path', { d: `M${a} 640 Q ${(a + b) / 2} ${640 + d * 2} ${b} 640`, pathLength: 1 }, arcs); });
  // 地图：海岸线、路线、城市
  $('#land').setAttribute('d', MAP.land);
  const P = MAP.pts, route = $('#route'), cities = $('#cities');
  const SEG = [['thagaste', 'carthage', -16, ''], ['carthage', 'rome', -34, ''], ['rome', 'milan', 26, ''], ['milan', 'hippo', -118, 'back']];
  const segEls = SEG.map(([a, b, bend, cls]) => { const [x1, y1] = P[a], [x2, y2] = P[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    return svgEl('path', { d: `M${x1} ${y1} Q ${mx + nx * bend} ${my + ny * bend} ${x2} ${y2}`, pathLength: 1, class: 'rt ' + cls }, route); });
  const pulse = svgEl('circle', { r: 9, class: 'pulse' }, route);
  const CITY = { thagaste: ['塔加斯特', '出生', 'end', -26, 46], carthage: ['迦太基', '求学', 'start', 26, 16], rome: ['罗马', '教书', 'start', 28, 14], milan: ['米兰', '信主受洗', 'start', 28, 12], hippo: ['希波', '作主教', 'end', -26, -16] };
  const cityEls = {};
  for (const k in CITY) { const [name, note, anchor, dx, dy] = CITY[k], [x, y] = P[k], g = svgEl('g', { class: 'city' }, cities);
    svgEl('circle', { cx: x, cy: y, r: 34, class: 'cg' }, g); svgEl('circle', { cx: x, cy: y, r: 6.5, class: 'cd' }, g);
    const t = svgEl('text', { x: x + dx, y: y + dy, 'text-anchor': anchor, class: 'cn' }, g); t.textContent = name;
    const n = svgEl('text', { x: x + dx, y: y + dy + 34, 'text-anchor': anchor, class: 'cs' }, g); n.textContent = note; cityEls[k] = g; }

  // ---------- 字体：所有字形载入后再量尺寸、再画 ----------
  const allText = stage.textContent + '0123456789';
  const faces = ['300 40px "Noto Serif SC"', '400 40px "Noto Serif SC"', '500 40px "Noto Serif SC"', '700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"',
    '300 40px "Noto Sans SC"', '400 40px "Noto Sans SC"', '400 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '400 40px "LXGW WenKai"'];
  await Promise.all(faces.map(f => document.fonts.load(f, allText)));
  await document.fonts.ready;

  // ---------- 拆字 ----------
  function split(el) { (function walk(node) { [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) { const f = document.createDocumentFragment(); for (const ch of n.textContent) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; f.appendChild(s); } n.replaceWith(f); }
    else if (n.nodeType === 1 && !n.classList.contains('ch')) walk(n); }); })(el); }
  $$('.split').forEach(split);
  const els = sel => typeof sel === 'string' ? $$(sel) : [].concat(sel);
  const chars = sel => els(sel).flatMap(e => $$('.ch', e));

  // ---------- 需要量位置的东西（此时所有场景都处在最终版式） ----------
  $$('.scene').forEach(s => s.style.visibility = 'visible');
  const books = $$('.bk'), meBook = books[4 * 16 + 10], mb = box(meBook), ime = $('.i-me');
  ime.style.left = (mb.x + mb.w - 2) + 'px'; ime.style.top = (mb.y + mb.h - 6) + 'px';
  const nb = s => box($(s)), brPath = (a, b, bow) => { const x1 = a.x + a.w + 14, y1 = a.y + a.h / 2, x2 = b.x - 14, y2 = b.y + b.h / 2; return `M${x1} ${y1} C ${x1 + 90} ${y1 + bow}, ${x2 - 90} ${y2 + bow}, ${x2} ${y2}`; };
  $('.br1').setAttribute('d', brPath(nb('.chip.old.c1'), nb('.chip.new.c1'), -26));
  $('.br2').setAttribute('d', brPath(nb('.chip.old.c2'), nb('.chip.new.c2'), 26));
  { const a = nb('.n-col.l .n-when'), b = nb('.n-col.r .n-when'); $('.br0').setAttribute('d', `M${a.x + a.w / 2 + 190} ${a.y + a.h / 2 + 6} L${b.x + b.w / 2 - 170} ${b.y + b.h / 2 + 6}`); }
  $$('.scene').forEach(s => s.style.visibility = '');

  // ---------- 初始状态 ----------
  gsap.set($$('.ch'), { opacity: 0 });
  gsap.set(['.a-mark', '.a-l3', '.pill', '.pill i', '.b-latin', '.b-years', '.b-years .dash', '.b-years .yr2',
    '.c-base', '.c-tick', '.c-gold', '.c-dot', '.c-glow', '.c-end', '.c-what', '.c-run', '.s2 .role',
    '#pg1', '.pg-b', '.pg-foot', '.pg-why', '.ul path', '.pg-arrow path', '.e-kick', '.wo .ring',
    '.hh', '.h-line', '.row .who', '.row .but', '.t-latin', '.t-sweep', '.t-rule i', '.t-rule b', '.t-meta', '.t-ep', '.t-ep .zj i',
    '.bk', '.lg', '.i-me', '.i-me path', '.i-me span', '.j-cover', '.slab', '.j-count', '.j-q .qm',
    '#pg2', '.k-note path', '.k-prog', '.k-talk', '.k-talk path', '.kq', '.k-shut .j-cover',
    '.l-kick', '.l-base', '.l-gold', '.l-ticks line', '.l-ticks text', '.l-arcs path', '.l-run', '.l-run-glow', '.l-span', '.l-halo', '.l-lab', '.l-year', '.l-name .sheng', '.l-sub .la2', '.l-sub .yy',
    '.card', '.lz-blur', '.lz-sharp', '.lz-ring', '.n-kick', '.n-when', '.n-tag', '.chip', '.n-bridge path',
    '#map', '.rt', '.pulse', '.city', '.o-k', '.o-tag', '.q-gray', '.q-gold', '.z-k', '.z-s', '.ch-l', '.ch-r span'], { opacity: 0 });
  gsap.set('.t-title .ch', { opacity: 0 });
  gsap.set(chars('.k-big'), { opacity: 0.3 });
  gsap.set($$('.k-p'), { opacity: 1 });
  gsap.set(['#pg1', '#pg2', '.j-cover', '.card'], { transformPerspective: 2000 });
  gsap.set('#map', { transformOrigin: '1040px 560px', autoAlpha: 0 });
  gsap.set(['.l-halo', '.l-span', '.wo .ring'], { transformOrigin: '50% 50%' });
  gsap.set('.lg.a i', { backgroundColor: '#d9b36c', borderColor: 'rgba(217,179,108,0)', boxShadow: '0 0 14px rgba(236,190,110,.5)' });

  const ST = window.ST = { retrace: 0, retraceA: 0 };
  const tl = gsap.timeline({ paused: true });

  // ---------- 小工具 ----------
  const IN = (t, at_, o = {}) => tl.fromTo(t, { opacity: 0, y: o.y ?? 26, x: o.x ?? 0, scale: o.s ?? 1, filter: `blur(${o.blur ?? 12}px)` },
    { opacity: o.o ?? 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 1.0, ease: o.ease ?? 'power3.out', stagger: o.st ?? 0, immediateRender: false }, at_);
  const OUT = (t, at_, o = {}) => tl.to(t, { opacity: 0, y: o.y ?? -22, filter: `blur(${o.blur ?? 10}px)`, duration: o.d ?? 0.6, ease: o.ease ?? 'power2.in', stagger: o.st ?? 0 }, at_);
  const DRAW = (t, at_, d = 1, o = {}) => { tl.set(t, { opacity: o.o ?? 1 }, at_); return tl.fromTo(t, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: o.ease ?? 'power2.inOut', stagger: o.st ?? 0, immediateRender: false }, at_); };
  const type = (sel, at_, dur, o = {}) => { const cs = chars(sel); return IN(cs, at_, { st: Math.max(0.02, dur) / Math.max(1, cs.length), d: o.d ?? 0.8, y: o.y ?? 20, blur: o.blur ?? 12, s: o.s }); };
  const ink = (sel, at_, dur) => type(sel, at_, dur, { d: 0.55, y: 7, blur: 5 });                     // 纸上的字：像墨迹显出来
  const big = (sel, at_, o = {}) => tl.fromTo(chars(sel), { opacity: 0, y: o.y ?? 60, scale: o.s ?? 1.14, filter: `blur(${o.blur ?? 26}px)` },
    { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 1.2, ease: 'expo.out', stagger: o.st ?? 0.1, immediateRender: false }, at_);
  const show = (sel, at_) => tl.set(sel, { autoAlpha: 1 }, at_);
  const sceneOut = (sel, at_, d = 0.7) => tl.to(sel, { autoAlpha: 0, filter: 'blur(14px)', scale: 1.03, duration: d, ease: 'power2.in' }, at_);
  const light = (at_, v, d = 1.6, ease = 'sine.inOut') => tl.to(BG, { ...v, duration: d, ease }, at_);
  const flash = (at_, x, y, peak = 0.7, rest = 0.1, d = 1.8) => { tl.set(BG, { bx: x, by: y }, at_ - 0.01); tl.to(BG, { bloom: peak, duration: 0.35, ease: 'power2.out' }, at_); tl.to(BG, { bloom: rest, duration: d, ease: 'sine.inOut' }, at_ + 0.35); };

  // =====================================================================================
  // A · 冷开场：那句祷告
  // =====================================================================================
  const tA1 = at('主啊求你让我变得更好'), tA2 = at('但是先别急'), tA3 = at('不要现在');
  show('#sA', 0);
  tl.to('#black', { opacity: 0, duration: 2.0, ease: 'power1.out' }, 0.1);
  light(0.1, { light: 0.3, rays: 0.16 }, 3.2);
  tl.fromTo('.a-mark', { opacity: 0, y: 30, scale: 1.1 }, { opacity: 1, y: 0, scale: 1, duration: 1.8, ease: 'power3.out', immediateRender: false }, tA1 - 0.7);
  type('.a-l1', tA1, en('主啊求你让我变得更好') - tA1 - 0.25, { d: 0.9 });
  tl.fromTo(chars('.a-l2'), { opacity: 0, x: -30, filter: 'blur(8px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', stagger: 0.075, immediateRender: false }, tA2);
  tl.fromTo('.a-l3', { opacity: 0, scale: 1.5, filter: 'blur(30px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.95, ease: 'expo.out', immediateRender: false }, tA3 - 0.06);
  flash(tA3, 960, 690, 0.6, 0.1, 1.6); light(tA3, { light: 0.62, rays: 0.5 }, 1.2, 'power2.out');
  const tB1 = at('这句祷告不是我编的');
  tl.fromTo('.a-block', { scale: 1 }, { scale: 1.035, duration: tB1 - tA1, ease: 'none', immediateRender: false }, tA1);

  // =====================================================================================
  // B · 谁写的
  // =====================================================================================
  const tB3 = at('写它的人叫奥古斯丁'), tName = at('奥古斯丁'), tAgo = at('一千六百年前的人');
  show('#sB', tB1 - 0.4);
  tl.to('.a-block', { scale: 0.45, y: -236, opacity: 0.62, duration: 1.0, ease: 'power3.inOut' }, tB1 - 0.4);
  tl.to('.a-mark', { opacity: 0, duration: 0.5 }, tB1 - 0.4);
  light(tB1 - 0.4, { light: 0.45, rays: 0.35, bloom: 0 }, 1.2);
  IN('.ch-l', tB1, { d: 1.2, y: -10, blur: 6 }); IN('.ch-r .r-a', tB1 + 0.2, { d: 1.2, y: -10, blur: 6 });
  [['.pill.p1', at('我编的'), en('我编的')], ['.pill.p2', at('段子手'), en('段子手写的')]].forEach(([p, a, e]) => {
    IN(p, a - 0.35, { d: 0.6, y: 22 });
    tl.set(p + ' i', { opacity: 1 }, e - 0.05); tl.fromTo(p + ' i', { scaleX: 0 }, { scaleX: 1, duration: 0.32, ease: 'power3.out', immediateRender: false }, e - 0.05);
    tl.to(p + ' span', { opacity: 0.45, duration: 0.4 }, e);
  });
  const tBo = tB3 - 0.1;
  OUT('.pill', tBo, { d: 0.45, st: 0.06 });
  tl.to('.a-block', { opacity: 0, filter: 'blur(10px)', duration: 0.5, ease: 'power2.in' }, tBo); tl.set('#sA', { autoAlpha: 0 }, tBo + 0.55);
  tl.fromTo('.b-latin', { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '0.5em', duration: 1.8, ease: 'power3.out', immediateRender: false }, tName - 0.4);
  big('.b-name', tName - 0.25, { st: 0.12, d: 1.3, y: 70, blur: 28 });
  light(tName - 0.4, { light: 0.82, rays: 0.78 }, 1.6);
  IN('.b-years', tAgo - 0.15, { d: 0.7, y: 24 });
  tl.fromTo('.b-years .yr', { textContent: 2026 }, { textContent: 354, snap: { textContent: 1 }, duration: 1.45, ease: 'power3.inOut', immediateRender: false }, tAgo - 0.05);
  tl.to(['.b-years .dash', '.b-years .yr2'], { opacity: 1, duration: 0.6, stagger: 0.12 }, tAgo + 1.35);
  type('.b-ago', tAgo + 0.15, 1.0, { d: 0.7, y: 10 });

  // =====================================================================================
  // C · 祷告的时候十几岁，写进书里的时候四十三岁，是主教
  // =====================================================================================
  const tC = at('他这么祷告的时候'), tTeen = at('十几岁'), tC2 = at('他把这句话原样写进了他的书里'), tPub = at('公开发表的时候'), t43 = at('四十三岁'), tBish = at('是主教');
  show('#sC', tC - 0.5);
  tl.to('.b-who', { scale: 0.4, y: -300, duration: 1.1, ease: 'power3.inOut' }, tC - 0.5);
  tl.to(['.b-ago', '.b-latin'], { opacity: 0, duration: 0.4 }, tC - 0.5);
  light(tC - 0.5, { light: 0.5, rays: 0.4 }, 1.4);
  tl.set('.c-base', { opacity: 1 }, tC - 0.15);
  tl.fromTo('.c-base', { attr: { x2: 260 } }, { attr: { x2: 1660 }, duration: 1.2, ease: 'power3.inOut', immediateRender: false }, tC - 0.15);
  tl.set($$('.c-tick')[0], { opacity: 1 }, tC - 0.1); tl.set($$('.c-tick')[1], { opacity: 1 }, tC + 1.0);
  IN('.c-end.e0', tC, { d: 0.7, y: 12 }); IN('.c-end.e1', tC + 0.9, { d: 0.7, y: 12 });
  tl.to(['.c-dot.d1', '.c-glow.g1'], { opacity: 1, duration: 0.3 }, tTeen - 0.2);
  tl.fromTo('.c-glow.g1', { attr: { r: 30 } }, { attr: { r: 72 }, opacity: 0, duration: 1.1, ease: 'power2.out', immediateRender: false }, tTeen);
  big('.s1 .c-age', tTeen - 0.1, { st: 0.09, d: 0.9, y: 34, blur: 16 });
  IN('.s1 .c-what', tTeen + 0.55, { d: 0.8, y: 14 });
  const dRun = t43 - tC2 - 0.15;
  tl.to(['.c-dot.d2', '.c-glow.g2', '.c-gold'], { opacity: 1, duration: 0.3 }, tC2);
  tl.fromTo(['.c-dot.d2', '.c-glow.g2'], { attr: { cx: 555 } }, { attr: { cx: 1052 }, duration: dRun, ease: 'power1.inOut', immediateRender: false }, tC2);
  tl.fromTo('.c-gold', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dRun, ease: 'power1.inOut', immediateRender: false }, tC2);
  tl.fromTo('.c-run', { x: 555 }, { x: 1052, duration: dRun, ease: 'power1.inOut', immediateRender: false }, tC2);
  tl.fromTo('.c-run', { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, tC2);
  tl.fromTo('.c-run .age', { textContent: 16 }, { textContent: 43, snap: { textContent: 1 }, duration: dRun, ease: 'power1.inOut', immediateRender: false }, tC2);
  tl.to('.c-stop.s1', { opacity: 0.5, duration: 0.8 }, tC2 + 0.4);
  tl.set('.s2 .c-what', { opacity: 1 }, tPub - 0.2);
  type('.s2 .pub', tPub - 0.1, t43 - tPub - 0.1, { d: 0.7, y: 10 });
  tl.to('.c-run', { opacity: 0, y: -18, duration: 0.3 }, t43 - 0.15);
  big('.s2 .c-age', t43 - 0.1, { st: 0.08, d: 0.9, y: 34, blur: 16 });
  tl.fromTo('.c-glow.g2', { attr: { r: 30 } }, { attr: { r: 80 }, opacity: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, t43);
  tl.fromTo('.s2 .role', { opacity: 0, scale: 1.5, filter: 'blur(12px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out', immediateRender: false }, tBish - 0.05);

  // =====================================================================================
  // D · 译本原文（书页）
  // =====================================================================================
  const tD = at('在周士良先生的译本里'), tQ1 = at('请你赏赐我纯洁和节制'), tQ2 = at('但不要立即赏给'), eQ2 = en('但不要立即赏给');
  sceneOut(['#sC', '#sB'], tD - 0.65, 0.55);
  show('#sD', tD - 0.3);
  light(tD - 0.4, { light: 0.6, rays: 0.5, fx: 960 }, 1.4);
  tl.fromTo('#pg1', { opacity: 0, y: 150, rotationX: 24, rotationY: -18, scale: 0.93 }, { opacity: 1, y: 0, rotationX: 3, rotationY: -5, scale: 1, duration: 1.4, ease: 'power3.out', immediateRender: false }, tD - 0.2);
  ink('.pg-a .q1', tQ1, en('请你赏赐我纯洁和节制') - tQ1 - 0.2);
  ink('.pg-a .q2 .split', tQ2, eQ2 - tQ2 - 0.2);
  DRAW('.pg-a .ul path', eQ2 - 0.3, 0.6);
  IN('.pg-foot', eQ2 + 0.1, { d: 0.6, y: 6, blur: 4 });

  // =====================================================================================
  // E · 这是什么概念
  // =====================================================================================
  const tE = at('你想想这是什么概念'), tE1 = at('一个主教'), tE2 = at('上任没两年'), tE3 = at('出了一本书'), tE4 = at('书里写着');
  tl.to('#pg1', { x: 446, scale: 0.6, rotationY: -17, rotationX: 4, duration: 1.1, ease: 'power3.inOut' }, tE - 0.35);
  IN('.e-kick', tE, { d: 0.7, y: 12 });
  [['.e-l.e1', tE1], ['.e-l.e2', tE2], ['.e-l.e3', tE3]].forEach(([s, t]) => big(s, t - 0.08, { st: 0.05, d: 0.75, y: 50, blur: 18 }));
  type('.e-s', tE4, 0.5, { d: 0.6 });

  // =====================================================================================
  // F · 书里写着（大意）
  // =====================================================================================
  const tF = at('我年轻的时候是这么祷告的'), tF2 = at('主啊请让我圣洁'), tF3 = at('但别太快'), tW = at('他还解释了是为什么');
  OUT('.e-left', tF - 0.6, { d: 0.45, y: -14 });
  tl.to('#pg1', { x: 0, scale: 1.08, rotationY: -2, rotationX: 2, duration: 1.0, ease: 'power3.inOut' }, tF - 0.65);
  tl.to('.pg-a', { opacity: 0, duration: 0.35 }, tF - 0.65);
  tl.set('.pg-b', { opacity: 1 }, tF - 0.25);
  ink('.pg-lead', tF, en('我年轻的时候是这么祷告的') - tF - 0.15);
  ink('.pg-b .q3', tF2, tF3 - tF2 - 0.3);
  ink('.pg-b .q4 .split', tF3, 0.7);
  DRAW('.pg-b .q4 .ul path', tF3 + 0.7, 0.5);
  tl.fromTo('.pg-why', { opacity: 0, scale: 1.6, rotation: -14 }, { opacity: 1, scale: 1, rotation: -5, duration: 0.6, ease: 'back.out(2)', immediateRender: false }, at('是为什么') - 0.1);
  DRAW('.pg-arrow path', tW + 1.0, 0.6);
  ink('.pg-notes .n1', at('我怕你答应得太快'), 1.1);
  ink('.pg-notes .n2', at('一下子把我这个毛病都治好了'), 1.5);
  ink('.pg-notes .n3 .split', at('但是这个毛病'), en('我还想再留一阵') - at('但是这个毛病') - 0.25);
  DRAW('.pg-notes .n3 .ul path', en('我还想再留一阵') - 0.35, 0.6);

  // =====================================================================================
  // G · 这不就是我吗
  // =====================================================================================
  const tG1 = at('有点不对'), tG2 = at('这不就是我吗');
  tl.to('#pg1', { opacity: 0.2, scale: 1.0, y: 26, filter: 'blur(6px)', duration: 0.9, ease: 'power2.inOut' }, tG1 - 0.55);
  type('.g-1', tG1 - 0.05, 0.6, { d: 0.7 });
  big('.g-2', tG2 - 0.12, { st: 0.07, d: 0.95, y: 60, blur: 22 });
  tl.fromTo('.wo .ring', { opacity: 0.9, scale: 0.55 }, { opacity: 0, scale: 2.4, duration: 1.5, ease: 'power2.out', immediateRender: false }, at2('这不就是我吗', '我吗') + 0.1);
  light(tG2 - 0.2, { light: 0.85, rays: 0.8 }, 1.2); flash(tG2 + 0.25, 960, 520, 0.45, 0.08, 1.6);

  // =====================================================================================
  // H · 同一个句式
  // =====================================================================================
  const tH = at('想想我们在生活里'), tH1 = at('我想减肥'), tH1b = at('下周开始'), tH2 = at('让我别再刷手机了'), tH2b = at('但等我把这个视频看完'), tH3 = at('把这个东西做好'), tH3b = at('我就什么什么样'), tH4 = at('这个句式');
  OUT('.g-me', tH - 0.55, { d: 0.5 }); tl.to('#pg1', { opacity: 0, duration: 0.5 }, tH - 0.55); tl.set('#sD', { autoAlpha: 0 }, tH + 0.05);
  show('#sH', tH - 0.3);
  light(tH - 0.5, { light: 0.5, rays: 0.4 }, 1.4);
  const row = (i, tl_, tr_) => {
    IN(`.r${i} .who`, Math.min(tl_, tr_) - 0.15, { d: 0.6, y: 10 });
    type(`.r${i} .lt`, tl_, 0.55, { d: 0.7 });
    tl.fromTo(`.r${i} .but`, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)', immediateRender: false }, Math.max(tl_, tr_) - 0.3);
    type(`.r${i} .rt`, tr_, 0.6, { d: 0.7 });
  };
  row(0, tH + 0.35, tH + 1.35);
  tl.to('.row.r0', { opacity: 0.5, duration: 0.8 }, tH1 - 0.5);
  row(1, tH1, tH1b); row(2, tH2, tH2b + 0.2); row(3, tH3b, tH3);
  tl.to('.row.r0', { opacity: 1, duration: 0.6 }, tH4 - 0.1);
  IN('.hh', tH4 - 0.1, { d: 0.8, y: 14, st: 0.25 });
  tl.set('.h-line', { opacity: 1 }, tH4 + 0.1);
  tl.fromTo('.h-line', { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, tH4 + 0.1);
  tl.fromTo('.row .but', { scale: 1 }, { scale: 1.28, duration: 0.28, ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.22, immediateRender: false }, tH4 + 0.25);
  tl.to('.row .but', { backgroundColor: '#e2bd76', color: '#1a1408', duration: 0.4, stagger: 0.22 }, tH4 + 0.25);
  type('.h-cap', tH4 + 1.0, 0.7, { d: 0.7, y: 10 });

  // =====================================================================================
  // T · 片名
  // =====================================================================================
  const tT = at('这本书叫忏悔录'), tTw = at2('这本书叫忏悔录', '忏悔录'), tT2 = at('一句一句'), eT = en('把它读下来');
  sceneOut('#sH', tT - 0.75, 0.6);
  tl.to(['.ch-l', '.ch-r .r-a'], { opacity: 0, duration: 0.5 }, tT - 0.75);
  show('#sT', tT - 0.2);
  light(tT - 0.3, { light: 1, rays: 1 }, 2.0); flash(tTw - 0.1, 960, 470, 0.55, 0.1, 2.4);
  tl.fromTo('.t-title .ch', { opacity: 0, y: 70, scale: 1.14, filter: 'blur(28px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out', stagger: 0.17, immediateRender: false }, tTw - 0.25);
  tl.fromTo('.t-latin', { opacity: 0, letterSpacing: '1.2em' }, { opacity: 1, letterSpacing: '0.62em', duration: 2.4, ease: 'power3.out', immediateRender: false }, tT - 0.05);
  tl.fromTo('.t-rule i', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, tTw + 0.5);
  tl.fromTo('.t-rule b', { opacity: 0, scale: 0, rotation: -135 }, { opacity: 1, scale: 1, rotation: 45, duration: 1.1, ease: 'back.out(2)', immediateRender: false }, tTw + 0.5);
  IN('.t-meta', tTw + 0.95, { d: 1.1, y: 18 });
  IN('.t-ep', at('从今天开始') - 0.1, { d: 1.1, y: 18 });
  tl.set('.t-ep .zj i', { opacity: 1 }, tT2); tl.fromTo('.t-ep .zj i', { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut', immediateRender: false }, tT2);
  tl.fromTo('.t-sweep', { opacity: 0.85, maskPosition: '100% 0', webkitMaskPosition: '100% 0' }, { maskPosition: '0% 0', webkitMaskPosition: '0% 0', duration: 2.2, ease: 'power2.inOut', immediateRender: false }, eT + 0.4);
  tl.set('.t-sweep', { opacity: 0 }, eT + 2.65);
  const tI = at('这本书买的人比较多');
  tl.fromTo('#sT', { scale: 1 }, { scale: 1.035, duration: tI - tT, ease: 'none', immediateRender: false }, tT - 0.2);
  sceneOut('#sT', tI - 1.25, 0.8);

  // =====================================================================================
  // I · 买的人多，读完的人少
  // =====================================================================================
  const tI2 = at('但真正读完的比较少'), tI3 = at('我也没有读完'), tI4 = at('我可以给大家说一下'), tI5 = at('我是怎么买到这本书的');
  show('#sI', tI - 0.6);
  light(tI - 1.0, { light: 0.5, rays: 0.4, bloom: 0 }, 1.6);
  IN('.ch-l', tI - 0.4, { d: 1.0, y: -10, blur: 6 }); IN('.ch-r .r-b', tI - 0.2, { d: 1.0, y: -10, blur: 6 });
  const br = rng(80), order = books.map((_, i) => i).sort(() => br() - 0.5), READ = new Set([9, 22, 37, 51, 70]);
  order.forEach((bi, k) => tl.fromTo(books[bi], { opacity: 0, scale: 0.3, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, tI - 0.35 + k * 0.02));
  IN('.lg.a', tI + 0.3, { d: 0.7, y: 12 });
  const br2 = rng(81), order2 = books.map((_, i) => i).filter(i => !READ.has(i)).sort(() => br2() - 0.5);
  order2.forEach((bi, k) => tl.to(books[bi], { opacity: 0.15, boxShadow: '0 0 0px rgba(236,190,110,0)', duration: 0.5, ease: 'power2.out' }, tI2 + 0.1 + k * 0.018));
  [...READ].forEach((bi, k) => tl.to(books[bi], { scale: 1.22, boxShadow: '0 0 30px rgba(246,206,130,.85)', duration: 0.6, ease: 'back.out(2)' }, tI2 + 1.0 + k * 0.08));
  tl.to('.lg.a i', { backgroundColor: 'rgba(217,179,108,0)', borderColor: 'rgba(217,179,108,.5)', boxShadow: '0 0 0px rgba(236,190,110,0)', duration: 0.6 }, tI2 + 0.3);
  tl.to('.lg.a', { opacity: 0.5, duration: 0.6 }, tI2 + 0.3);
  IN('.lg.b', at('读完的') - 0.1, { d: 0.7, y: 12 });
  tl.to(meBook, { opacity: 0.9, backgroundImage: 'linear-gradient(90deg,#b5593a 0 7px,#f3b99a 7px 9px,#eba27c 9px)', boxShadow: '0 0 22px rgba(235,162,124,.7)', duration: 0.4 }, tI3 - 0.2);
  tl.fromTo(meBook, { rotation: 0 }, { rotation: 9, duration: 0.14, yoyo: true, repeat: 5, ease: 'sine.inOut', immediateRender: false }, tI3 - 0.1);
  tl.set('.i-me', { opacity: 1 }, tI3 - 0.1); DRAW('.i-me path', tI3 - 0.1, 0.45);
  tl.fromTo('.i-me span', { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, tI3 + 0.15);
  tl.to(['.i-grid', '.i-legend', '.i-me'], { opacity: 0.1, filter: 'blur(7px)', duration: 0.8, ease: 'power2.inOut' }, tI5 - 0.75);
  type('.i-q', tI5 - 0.25, en('我是怎么买到这本书的') - tI5 - 0.2, { d: 0.8 });

  // =====================================================================================
  // J · 十三卷
  // =====================================================================================
  const tJ = at('当时我想看一下这个人写的忏悔录'), tJw = at2('当时我想看一下这个人写的忏悔录', '这个人写的'), tJ2 = at('竟然这么多'), tJ3 = at('他竟然有这么多的东西需要忏悔'), tJ5 = at('他究竟想忏悔些什么东西'), tJ6 = at('那当然我是成为基督徒之后');
  sceneOut('#sI', tJ - 0.7, 0.6);
  show('#sJ', tJ - 0.3);
  tl.fromTo('#sJ .j-cover', { opacity: 0, y: 70, rotationY: -38, scale: 0.9 }, { opacity: 1, y: 0, rotationY: -8, scale: 1, duration: 1.2, ease: 'power3.out', immediateRender: false }, tJw - 0.3);
  const tTow = tJ2 - 0.55;
  tl.to('#sJ .j-cover', { opacity: 0, scale: 0.92, duration: 0.4, ease: 'power2.in' }, tTow - 0.1);
  $$('.slab').forEach((s, i) => tl.fromTo(s, { opacity: 0, y: -70, rotation: i % 2 ? 5 : -5 }, { opacity: 1, y: 0, rotation: slabJit[i], duration: 0.42, ease: 'back.out(1.7)', immediateRender: false }, tTow + i * 0.115));
  IN('.j-count', tTow, { d: 0.6, y: 20 });
  tl.fromTo('.j-count .num', { textContent: 1 }, { textContent: 13, snap: { textContent: 1 }, duration: 12 * 0.115, ease: 'none', immediateRender: false }, tTow + 0.1);
  tl.fromTo('.j-count', { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '0% 60%', immediateRender: false }, tTow + 13 * 0.115);
  type('.j-so', tJ3 + 0.5, 1.2, { d: 0.6, y: 10 });
  tl.fromTo('.j-tower', { rotation: 0 }, { rotation: 1.6, duration: 0.2, yoyo: true, repeat: 5, ease: 'sine.inOut', transformOrigin: '50% 78%', immediateRender: false }, tJ3 + 0.3);
  type($$('.j-q > div')[0], tJ5, 0.5, { d: 0.8, y: 30, blur: 16 });
  type($$('.j-q > div')[1], at2('他究竟想忏悔些什么东西', '忏悔些什么'), 0.9, { d: 0.8, y: 30, blur: 16 });
  tl.fromTo('.j-q .qm', { opacity: 0, scale: 2.2, rotation: 20 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.2)', immediateRender: false }, en('他究竟想忏悔些什么东西') - 0.35);
  type('.j-aside', tJ6 + 0.4, 2.6, { d: 0.6, y: 8 });

  // =====================================================================================
  // K · 翻开第一页
  // =====================================================================================
  const tK = at('然后我翻开它的第一页'), tK1 = at('主啊你是伟大的'), eK2 = en('你理应受一切的赞美'), tK4 = at('这个和忏悔有什么关系'), tK5 = at('然后我硬着头皮读了后面'),
    tK7 = at('一个人在那里跟神对话'), tK9 = at('我是先该呼求你'), tK9b = at('还是先认识你'), tK10 = at('你充满天地'), tK10b = at('那天地装得下你吗'), tK11 = at('然后我就觉得这有点晦涩'), tK12 = at('就慢慢地就没有读下去了');
  sceneOut('#sJ', tK - 0.7, 0.6);
  show('#sK', tK - 0.2);
  light(tK - 0.5, { light: 0.58, rays: 0.45 }, 1.4);
  tl.fromTo('#pg2', { opacity: 0, rotationY: -80, x: -40 }, { opacity: 1, rotationY: -3, x: 0, duration: 1.6, ease: 'power3.out', immediateRender: false }, at2('然后我翻开它的第一页', '翻开') - 0.1);
  const b1 = chars('.k-big.b1'), b2 = chars('.k-big.b2');
  tl.to(b1, { opacity: 1, duration: 0.4, stagger: (eK2 - tK1 - 0.3) / b1.length }, tK1);
  tl.to(b2, { opacity: 1, duration: 0.4, stagger: 0.05 }, eK2 + 0.1);
  const notes = $$('.k-note span');
  DRAW('.k-note path', tK4 + 0.1, 0.5);
  type(notes[0], tK4, 0.7, { d: 0.5, y: 8, blur: 5 });
  type(notes[1], at2('这个和忏悔有什么关系', '有什么关系'), 0.8, { d: 0.5, y: 8, blur: 5 });
  // 硬着头皮往下读
  tl.to('.k-note', { opacity: 0, duration: 0.4 }, tK5 - 0.1);
  tl.to('.k-scroll', { y: -272, duration: tK7 - tK5 - 0.2, ease: 'sine.inOut' }, tK5 + 0.2);
  tl.to('.k-prog', { opacity: 1, duration: 0.5 }, tK5 + 0.2);
  tl.fromTo('.k-prog i', { height: '3%' }, { height: '12%', duration: tK7 - tK5 - 0.2, ease: 'sine.inOut', immediateRender: false }, tK5 + 0.2);
  // 一个人在那里跟神对话：全书都在对"你"说话
  tl.to($$('.k-scroll u'), { backgroundColor: 'rgba(162,58,34,.92)', color: '#fff3e0', duration: 0.3, stagger: 0.045 }, tK7 + 0.25);
  IN('.k-talk', tK7 + 0.3, { d: 0.8, y: 14 }); DRAW('.k-talk path', tK7 + 0.7, 0.6);
  // 这些问题，有点读不懂
  const tQ = tK9 - 1.0;
  tl.to('.k-talk', { opacity: 0, duration: 0.4 }, tQ - 0.3);
  tl.to('#pg2', { x: -252, scale: 0.82, rotationY: 5, duration: 1.1, ease: 'power3.inOut' }, tQ - 0.3);
  const kq = (q, a, b) => { const tx = $$(q + ' .tx'); IN(q, a - 0.35, { d: 0.7, y: 34 }); type(tx[0], a, 0.8, { d: 0.7 }); type(tx[1], b, 0.9, { d: 0.7 }); };
  kq('.kq.q1', tK9, tK9b); kq('.kq.q2', tK10, tK10b);
  tl.to('.k-scroll .m1', { backgroundSize: '100% 100%', duration: 1.0, ease: 'power2.inOut' }, tK9 - 0.1);
  tl.to('.k-scroll .m2', { backgroundSize: '100% 100%', duration: 0.9, ease: 'power2.inOut' }, tK10 - 0.1);
  // 有点晦涩，慢慢地就没有读下去了
  tl.to('.k-qs', { opacity: 0, x: 40, filter: 'blur(8px)', duration: 0.55, ease: 'power2.in' }, tK11 - 0.35);
  tl.to('#pg2', { rotationY: -84, opacity: 0, duration: 0.85, ease: 'power2.in' }, tK11 - 0.25);
  tl.fromTo('.k-shut .j-cover', { opacity: 0, rotationY: 70, x: -90, rotation: 0 }, { opacity: 1, rotationY: 0, x: 0, rotation: -7, duration: 1.0, ease: 'power3.out', immediateRender: false }, tK11 + 0.45);
  type($$('.k-shut-t div')[0], at('这有点晦涩') - 0.1, 0.7, { d: 0.8, y: 30, blur: 16 });
  type($$('.k-shut-t div')[1], tK12 + 0.15, 1.6, { d: 0.6, y: 10 });

  // =====================================================================================
  // L · 两千年教会历史，绕不开这个人
  // =====================================================================================
  const tL = at('但是我在了解教会历史的时候'), tL2 = at('就比如从耶稣诞生'), tL4 = at('两千年的历史'), tL5 = at('我又绕不开这个人'), tLn = at2('我又绕不开这个人奥古斯丁', '奥古斯丁'),
    tL6 = at('他被封圣了'), tLs = at2('我们一般叫他圣奥古斯丁', '圣奥古斯丁'), tL8 = at('而且是很出名的一个人');
  sceneOut('#sK', tL - 0.85, 0.65);
  show('#sL', tL - 0.3);
  tl.to('.ch-r .r-b', { opacity: 0, y: -8, duration: 0.5 }, tL - 0.6); IN('.ch-r .r-c', tL - 0.1, { d: 1.0, y: 8, blur: 6 });
  light(tL - 0.6, { light: 0.52, rays: 0.42, fx: 960 }, 1.5);
  IN('.l-kick', at('教会历史') - 0.2, { d: 0.8, y: 12 });
  tl.set('.l-base', { opacity: 1 }, tL + 0.2);
  tl.fromTo('.l-base', { attr: { x2: 180 } }, { attr: { x2: 1740 }, duration: 1.6, ease: 'power3.inOut', immediateRender: false }, tL + 0.2);
  tl.to(['.l-ticks line', '.l-ticks text'], { opacity: 1, duration: 0.5, stagger: 0.07 }, tL + 0.5);
  IN('.l-lab.a', at('耶稣诞生') - 0.15, { d: 0.7, y: 12 });
  const tRun = at('耶稣诞生') + 0.25, dR = tL4 + 0.75 - tRun;
  tl.to(['.l-run', '.l-run-glow', '.l-gold', '.l-year'], { opacity: 1, duration: 0.3 }, tRun);
  tl.fromTo(['.l-run', '.l-run-glow'], { attr: { cx: 180 } }, { attr: { cx: 1740 }, duration: dR, ease: 'power2.inOut', immediateRender: false }, tRun);
  tl.fromTo('.l-gold', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dR, ease: 'power2.inOut', immediateRender: false }, tRun);
  tl.fromTo('.l-year', { x: 180 }, { x: 1740, duration: dR, ease: 'power2.inOut', immediateRender: false }, tRun);
  tl.fromTo('.l-year .ly', { textContent: 1 }, { textContent: 2026, snap: { textContent: 1 }, duration: dR, ease: 'power2.inOut', immediateRender: false }, tRun);
  IN('.l-lab.b', tRun + dR - 0.5, { d: 0.7, y: 12 });
  tl.to(['.l-year', '.l-run-glow'], { opacity: 0, duration: 0.45 }, tL5 - 0.2);
  // 绕不开
  tl.fromTo('.l-span', { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2.4)', immediateRender: false }, tL5);
  DRAW('.l-arcs path', tL5 + 0.25, 1.0, { st: 0.14, ease: 'power2.out' });
  type('.l-cant', at('绕不开') - 0.1, 0.9, { d: 0.7, y: 10 });
  big($('.l-name > span'), tLn - 0.2, { st: 0.1, d: 1.2, y: 60, blur: 24 });
  IN('.l-sub .yy', tLn + 0.5, { d: 0.8, y: 10 });
  light(tLn - 0.4, { light: 0.86, rays: 0.8, fx: 600 }, 1.6);
  // 圣奥古斯丁
  tl.fromTo('.l-halo', { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 3.2, duration: 1.8, ease: 'power2.out', immediateRender: false }, tL6);
  tl.fromTo('.l-name .sheng', { opacity: 0, scale: 1.7, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.0, ease: 'expo.out', immediateRender: false }, tLs - 0.15);
  flash(tLs, 290, 350, 0.5, 0.1, 1.6);
  IN('.l-sub .la2', tLs + 0.35, { d: 0.9, y: 10 });
  tl.fromTo('.l-arcs path', { strokeWidth: 1.8 }, { strokeWidth: 3.4, duration: 0.35, yoyo: true, repeat: 1, stagger: 0.1, ease: 'sine.inOut', immediateRender: false }, tL8 + 0.2);

  // =====================================================================================
  // M · 先了解这个人；代入他的视角
  // =====================================================================================
  const tM = at('所以我想先花点时间'), tM1 = at('他是谁'), tM2 = at('以及经历了什么'), tM3 = at('以及他是在什么情况下'), tM3b = at('写了这本书'), tM4 = at('那了解他的经历之后'), tM5 = at('我才可以代入他的视角'), tM6 = at('然后去看他的一些文字'), eM6 = en('然后去看他的一些文字');
  sceneOut('#sL', tM - 0.3, 0.7);
  show('#sM', tM + 0.3);
  light(tM, { light: 0.55, rays: 0.45, fx: 960, bloom: 0 }, 1.6);
  type('.m-kick', tM + 0.5, 2.0, { d: 0.6, y: 8 });
  const card = (c, t) => tl.fromTo(c, { opacity: 0, y: 60, rotationX: -30 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }, t);
  card('.card.c1', tM1 - 0.45); type('.card.c1 div', tM1 - 0.05, 0.4, { d: 0.7 });
  card('.card.c2', tM2 - 0.4); type('.card.c2 div', at2('以及经历了什么', '经历了什么') - 0.1, 0.6, { d: 0.7 });
  card('.card.c3', tM3 - 0.3); type($$('.card.c3 span')[0], at2('以及他是在什么情况下', '在什么情况下') - 0.1, 0.7, { d: 0.7 }); type($$('.card.c3 span')[1], tM3b - 0.05, 0.6, { d: 0.7 });
  // 代入他的视角
  tl.to('.m-cards', { scale: 0.46, y: -166, opacity: 0.5, duration: 1.1, ease: 'power3.inOut' }, tM4 - 0.3);
  tl.to('.m-kick', { opacity: 0, duration: 0.4 }, tM4 - 0.3);
  tl.fromTo('.lz-blur', { opacity: 0 }, { opacity: 0.5, duration: 1.2, ease: 'power2.out', immediateRender: false }, tM4 + 0.4);
  tl.set(['.lz-ring', '.lz-sharp'], { opacity: 1 }, tM5 - 0.3);
  tl.fromTo('.m-lens', { '--lx': '-260px' }, { '--lx': '360px', duration: 1.4, ease: 'power3.out', immediateRender: false }, tM5 - 0.3);
  tl.to('.m-lens', { '--lx': '1560px', duration: eM6 - tM6 + 0.5, ease: 'sine.inOut' }, tM6 - 0.1);

  // =====================================================================================
  // N · 很真实；放到今天也依旧适用
  // =====================================================================================
  const tN = at('那么其次的话就是'), tN1 = at('他这本书很真实'), tNz = at2('他这本书很真实', '很真实'), tN2 = at('别看是一千六百年前的人'), tN3 = at('但是和我们现在的生活也息息相关'), tN3a = at('我们现在的生活'), tN3b = at('息息相关'),
    tN4 = at('他的一些认识'), tN5 = at('放到今天'), tN6 = at('依旧适用');
  sceneOut('#sM', tN - 0.75, 0.65);
  show('#sN', tN - 0.1);
  IN('.n-kick', at('其次') - 0.1, { d: 0.7, y: 10 });
  tl.fromTo('.n-big .ch', { opacity: 0, scale: 1.35, y: 40, filter: 'blur(34px)' }, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: 0.16, immediateRender: false }, tNz - 0.05);
  light(tNz - 0.3, { light: 0.92, rays: 0.85 }, 1.4); flash(tNz + 0.1, 960, 470, 0.5, 0.12, 1.8);
  type('.n-cap', tN1 + 0.1, 1.2, { d: 0.7, y: 12 });
  tl.to('.n-big', { opacity: 0.06, scale: 1.22, duration: 1.1, ease: 'power2.inOut' }, tN2 - 0.6);
  OUT('.n-cap', tN2 - 0.6, { d: 0.45 });
  light(tN2 - 0.5, { light: 0.55, rays: 0.45, bloom: 0 }, 1.4);
  IN('.n-col.l .n-when', at('一千六百年前', 1) - 0.25, { d: 0.9, y: 30 }); IN('.n-col.l .n-tag', at('一千六百年前', 1) + 0.35, { d: 0.7, y: 10 });
  IN('.n-col.r .n-when', tN3a - 0.2, { d: 0.9, y: 30 }); IN('.n-col.r .n-tag', tN3a + 0.4, { d: 0.7, y: 10 });
  DRAW('.br0', tN3b - 0.7, 1.0); type('.n-mid', tN3b - 0.05, 0.7, { d: 0.7, y: 10 });
  tl.fromTo('.chip.old', { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.35, immediateRender: false }, tN4 - 0.1);
  tl.fromTo('.chip.new', { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.35, immediateRender: false }, tN5 - 0.15);
  DRAW('.br1', tN5 + 0.45, 0.8); DRAW('.br2', tN5 + 0.8, 0.8);
  type('.n-still', tN6 - 0.5, 1.0, { d: 0.8, y: 14 });

  // =====================================================================================
  // O · 他是从哪儿走过来的（地图）；好不容易才说出口的一句话
  // =====================================================================================
  const tO = at('所以我们在读忏悔录这本书的时候'), tO4 = at('他是从哪儿走过来的'), tO5 = at('那么开头那句'), tO5b = at2('那么开头那句你是伟大的', '你是伟大的'), tO6b = at('客套的话'),
    tO7 = at('如果等你知道他的故事了'), tO9 = at('那么你就会有不同的理解'), tO11 = at('好不容易'), eO = en('才能说出口的一句话');
  sceneOut('#sN', tO - 0.9, 0.7);
  show('#sO', tO - 0.2);
  tl.fromTo('#map', { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1.0, duration: 2.4, ease: 'power2.out', immediateRender: false }, tO - 0.3);
  tl.to('#map', { scale: 1.05, duration: eO - tO - 1.0, ease: 'none' }, tO + 2.1);
  light(tO - 0.5, { light: 0.34, rays: 0.1, fx: 1040, dust: 0.55, bloom: 0 }, 1.8);
  IN('.o-k', tO + 0.5, { d: 0.9, y: 12 });
  type('.o-t', tO4 - 0.15, en('他是从哪儿走过来的') - tO4 - 0.2, { d: 0.8, y: 24, blur: 14 });
  // 路线：塔加斯特 → 迦太基 → 罗马 → 米兰 → 希波
  const tR = tO + 1.5, cityIn = (k, t) => { tl.fromTo(cityEls[k], { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }, t);
    tl.fromTo($('.cg', cityEls[k]), { attr: { r: 8 } }, { attr: { r: 34 }, duration: 0.9, ease: 'power2.out', immediateRender: false }, t); };
  const LEG = [[0.5, 0.95], [1.6, 1.25], [3.0, 1.05], [4.25, 2.1]];             // 每一段：出发时刻（相对 tR）、用时
  cityIn('thagaste', tR);
  LEG.forEach(([s, d], i) => { DRAW(segEls[i], tR + s, d, { ease: 'power1.inOut', o: i === 3 ? 0.85 : 1 }); cityIn(SEG[i][1], tR + s + d - 0.15); });
  // 开头那句"你是伟大的"
  tl.to('.o-cap', { opacity: 0, y: -18, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' }, tO5 - 0.4);
  tl.to('#map', { opacity: 0.55, duration: 1.0 }, tO5 - 0.3);
  IN('.q-gray', tO5b - 0.2, { d: 0.9, y: 22 });
  IN('.o-tag.t1', tO6b - 0.25, { d: 0.6, y: 10 });
  // 知道了他的故事，再回来听：把路再走一遍，然后这句话亮起来
  const dRe = tO9 - tO7 - 0.15;
  tl.to('#map', { opacity: 0.85, duration: 0.8 }, tO7 - 0.1);
  tl.to(ST, { retraceA: 1, duration: 0.3 }, tO7); tl.fromTo(ST, { retrace: 0 }, { retrace: 1, duration: dRe, ease: 'power1.inOut', immediateRender: false }, tO7);
  tl.to(ST, { retraceA: 0, duration: 0.4 }, tO7 + dRe);
  const tIg = tO7 + dRe;
  tl.to('.o-tag.t1', { opacity: 0, y: -10, duration: 0.4 }, tIg - 0.1);
  tl.to('.q-gray', { opacity: 0, duration: 0.7 }, tIg);
  tl.fromTo('.q-gold', { opacity: 0, scale: 1.0 }, { opacity: 1, scale: 1.05, duration: 1.3, ease: 'power2.out', transformOrigin: '0% 50%', immediateRender: false }, tIg);
  flash(tIg + 0.1, 520, 380, 0.75, 0.22, 2.4); light(tIg, { light: 0.7, rays: 0.5, fx: 700 }, 1.8);
  tl.to('#map', { opacity: 0.5, duration: 1.4 }, tIg + 0.3);
  type('.o-tag2', tO11 - 0.15, eO - tO11 - 0.3, { d: 0.7, y: 10 });

  // =====================================================================================
  // Z · 片尾
  // =====================================================================================
  const tZ = eO + 1.2;
  sceneOut('#sO', tZ, 1.0); tl.to('#map', { autoAlpha: 0, duration: 1.0 }, tZ);
  tl.to(['.ch-l', '.ch-r .r-c'], { opacity: 0, duration: 0.8 }, tZ);
  light(tZ, { light: 0.34, rays: 0.25, bloom: 0, fx: 960, dust: 1 }, 2.0);
  show('#sZ', tZ + 0.7);
  IN('.z-k', tZ + 0.8, { d: 0.9, y: 12 }); type('.z-t', tZ + 1.1, 0.9, { d: 0.9, y: 24, blur: 14 }); IN('.z-s', tZ + 1.9, { d: 0.9, y: 10 });
  tl.to('#black', { opacity: 1, duration: 1.0, ease: 'power1.in' }, EP.total - 1.15);
  tl.set({}, {}, EP.total);

  // ---------- 字幕 ----------
  const subs = EP.subs.slice(3).map(s => ({ s: s.s, e: s.e, t: s.t.replace(/[，。：]$/, '') }));      // 开场三句就是画面上的大字，不重复打字幕
  const subEl = $('#sub span'), prog = $('#prog i');
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function drawSub(t) {
    let cur = null;
    for (const s of subs) if (t >= s.s - 0.1 && t <= s.e + 0.28) cur = s;
    if (!cur) { subEl.style.opacity = 0; return; }
    if (subEl.textContent !== cur.t) subEl.textContent = cur.t;
    subEl.style.opacity = Math.min(sm((t - (cur.s - 0.1)) / 0.2), sm(((cur.e + 0.28) - t) / 0.2));
  }

  // ---------- 沿路线重走一遍的光点 ----------
  const segLen = segEls.map(s => s.getTotalLength()), totLen = segLen.reduce((a, b) => a + b, 0);
  function tick(t) {
    let d = ST.retrace * totLen, i = 0;
    while (i < 3 && d > segLen[i]) { d -= segLen[i]; i++; }
    const pt = segEls[i].getPointAtLength(Math.min(d, segLen[i]));
    pulse.setAttribute('cx', pt.x); pulse.setAttribute('cy', pt.y); pulse.style.opacity = ST.retraceA;
  }

  for (let t = 0; t <= EP.total + 0.05; t += 1 / 30) tl.time(t, true);   // 预热：让每个动作都在同一遍里取好起始值，之后任意跳到哪一帧结果都一样
  tl.time(0, true);

  window.DURATION = EP.total;
  window.seek = function (t) {
    t = Math.max(0, Math.min(EP.total, t));
    tl.time(t, false);
    tick(t); drawBg(t); drawGrain(t); drawSub(t);
    prog.style.width = (t / EP.total * 100).toFixed(3) + '%';
  };
  seek(0);
  window.READY = true;

  // 实时预览（带声音）：打开 /web/ep1.html?play 后点一下画面
  if (location.search.includes('play')) {
    const a = new Audio('/out/ep1_mix.wav'); let started = false;
    addEventListener('click', () => { if (!started) { a.play(); started = true; } else a.paused ? a.play() : a.pause(); });
    (function loop() { if (started) seek(a.currentTime); requestAnimationFrame(loop); })();
  }
})();
