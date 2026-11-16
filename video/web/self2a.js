// 第一讲 · 奥古斯丁这个人：分镜时间轴。每个动作挂在旁白的某一句（cue）或某一句里的某个词上。
(async function () {
  const EP = window.EP2, MAP = window.MAP, BG = window.BG;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const C = {}; EP.cues.forEach(c => C[c.id] = c);
  const han = s => [...s].filter(ch => /[一-鿿0-9]/.test(ch)).join('');
  const T = id => C[id].start, E = id => C[id].end;
  // 一句话里某个词出现的时刻（按这一句的语速等比例估算）
  const W = (id, phrase, nth = 0) => { const c = C[id], s = han(c.say), p = han(phrase); let i = -1; for (let k = 0; k <= nth; k++) i = s.indexOf(p, i + 1); if (i < 0) throw new Error(id + ' 里找不到：' + phrase); return c.start + c.dur * i / s.length; };
  const WE = (id, phrase) => { const c = C[id], s = han(c.say), p = han(phrase), i = s.indexOf(p); return c.start + c.dur * (i + p.length) / s.length + 0.15; };

  let SCALE = 1;
  function fit() { SCALE = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${SCALE})`; stage.style.left = (innerWidth - 1920 * SCALE) / 2 + 'px'; stage.style.top = (innerHeight - 1080 * SCALE) / 2 + 'px'; }
  fit(); addEventListener('resize', fit);
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- 动态元素 ----------
  // 引文卡片
  const QUOTES = { q29: ['忏悔录 · 卷三', '那时候我还没爱上谁，<br>我是爱上了“<span class="hl">恋爱</span>”这件事。'],
    q58: ['忏悔录 · 卷三 · 一位主教对莫妮卡说', '你回去吧。<br>你为这个儿子流了这么多眼泪，<br><span class="hl">这样的儿子是不会灭亡的。</span>'],
    q66: ['忏悔录 · 卷五 · 回头写那一夜', '你没有照她<span class="hl">当时</span>求的做，<br>是为了成全她<span class="hl">一直</span>在求的。'],
    q97: ['忏悔录 · 卷六', '我的心像被撕开了，<br>伤口一直在<span class="hl">流血</span>。'] };
  const sQ = $('#sQ'), tmpl = $('.qcard', sQ);
  for (const k in QUOTES) { const q = tmpl.cloneNode(true); q.id = k; $('.qc-src', q).textContent = QUOTES[k][0]; $('.qc-t', q).innerHTML = QUOTES[k][1]; $('.qc-t', q).classList.add('split'); sQ.appendChild(q); }
  tmpl.remove();
  // 硬币
  const coins = $('.coins'); for (let i = 0; i < 14; i++) { const c = document.createElement('div'); c.className = 'coin'; c.style.top = (840 - i * 30) + 'px'; coins.appendChild(c); }
  // 梨
  const pg = $('.pears'), PEARS = [[960, 620], [1030, 650], [1240, 640], [1310, 610], [1170, 470], [1100, 560], [1380, 590]];
  const pearD = (x, y) => `M${x} ${y - 34} C ${x - 14} ${y - 30}, ${x - 12} ${y - 10}, ${x - 20} ${y + 4} C ${x - 34} ${y + 30}, ${x - 14} ${y + 46}, ${x} ${y + 46} C ${x + 14} ${y + 46}, ${x + 34} ${y + 30}, ${x + 20} ${y + 4} C ${x + 12} ${y - 10}, ${x + 14} ${y - 30}, ${x} ${y - 34} Z`;
  const pearEls = PEARS.map(([x, y]) => svgEl('path', { d: pearD(x, y), class: 'pear' }, pg));
  // 卷二的书页
  const pages = $('.bk2-pages'); for (let i = 0; i < 10; i++) { const p = document.createElement('div'); p.className = 'pg'; p.innerHTML = i % 3 === 0 ? '<b></b>' : ''; p.style.left = (i * 14) + 'px'; p.style.top = (-i * 3) + 'px'; pages.appendChild(p); }
  // 人群
  const cr = $('.fr-col .crowd'), r1 = rng(5); for (let i = 0; i < 9; i++) svgEl('circle', { cx: 200 + (r1() - 0.5) * 230, cy: 150 + (r1() - 0.5) * 150, r: 18 }, cr);
  // 眼泪
  const tears = $('.tears'), r2 = rng(9), tearEls = []; for (let i = 0; i < 22; i++) tearEls.push([svgEl('circle', { cx: 760 + r2() * 400, cy: 0, r: 4 + r2() * 4 }, tears), r2(), 0.6 + r2() * 0.8]);
  // 港口灯火
  const lt = $('.lights'); [[60, 790], [120, 795], [330, 790], [470, 792]].forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 4 }, lt));
  // 墙（障碍）
  const wall = $('.wall'), BR = ['西塞罗式的骄傲', '摩尼教的答案', '圣经太土', '神有形体？', '恶从哪里来', '信了就不能思考', '名声和前途', '“我还年轻”'];
  BR.forEach((t, i) => { const b = document.createElement('div'); b.className = 'brick'; b.textContent = t; b.style.left = (i % 4) * 202 + (Math.floor(i / 4) % 2 ? 100 : 0) + 'px'; b.style.top = (1 - Math.floor(i / 4)) * 100 + 'px'; b.style.fontSize = t.length > 6 ? '26px' : '32px'; wall.appendChild(b); });
  // 无花果树叶
  const lv = $('.fg-leaves'), r3 = rng(21); for (let i = 0; i < 46; i++) { const x = 1240 + r3() * 380, y = 470 + r3() * 220; svgEl('ellipse', { cx: x, cy: y, rx: 26 + r3() * 18, ry: 14 + r3() * 8, transform: `rotate(${(r3() - 0.5) * 90} ${x} ${y})` }, lv); }
  // 希波的会众
  const c2 = $('.crowd2'), r4 = rng(33), crowd = []; for (let i = 0; i < 70; i++) { const x = 420 + (i % 14) * 80 + (r4() - 0.5) * 30, y = 620 + Math.floor(i / 14) * 70 + (r4() - 0.5) * 20; crowd.push(svgEl('circle', { cx: x, cy: y, r: 14 }, c2)); }
  const aug = svgEl('circle', { cx: 1500, cy: 870, r: 18, class: 'au' }, c2);
  // 时间线事件位置
  const YX = y => 200 + (y - 384) / (432 - 384) * 1520; const EVX = [0, 330, 590, 850, 1110, 1370, 1630]; for (let i = 1; i <= 6; i++) $('.ev.e' + i).style.left = EVX[i] + 'px';

  // 地图
  $('#land').setAttribute('d', MAP.land);
  const P = MAP.pts, route = $('#route'), cities = $('#cities');
  const arc = (a, b, bend, cls) => { const [x1, y1] = P[a], [x2, y2] = P[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    return svgEl('path', { d: `M${x1} ${y1} Q ${mx + nx * bend} ${my + ny * bend} ${x2} ${y2}`, pathLength: 1, class: 'rt ' + cls }, route); };
  const R = { tc: arc('thagaste', 'carthage', -16, ''), cr: arc('carthage', 'rome', -34, ''), rm: arc('rome', 'milan', 26, ''), mo: arc('carthage', 'milan', -90, 'mom'), her: arc('milan', 'carthage', 140, 'her') };
  const CITY = { thagaste: ['塔加斯特', 'end', -26, 46], carthage: ['迦太基', 'start', 26, 16], rome: ['罗马', 'start', 28, 14], milan: ['米兰', 'start', 28, 12] };
  const cityEls = {};
  for (const k in CITY) { const [name, anchor, dx, dy] = CITY[k], [x, y] = P[k], g = svgEl('g', { class: 'city' }, cities);
    svgEl('circle', { cx: x, cy: y, r: 34, class: 'cg' }, g); svgEl('circle', { cx: x, cy: y, r: 6.5, class: 'cd' }, g);
    svgEl('text', { x: x + dx, y: y + dy, 'text-anchor': anchor, class: 'cn' }, g).textContent = name; cityEls[k] = g; }
  const style = document.createElement('style'); style.textContent = '#map .rt.mom{stroke:#eba27c;stroke-dasharray:.012 .01!important;filter:none} #map .rt.her{stroke:#c9c2b4;stroke-width:2.4;filter:none}'; document.head.appendChild(style);

  // ---------- 字体 ----------
  const faces = ['300 40px "Noto Serif SC"', '400 40px "Noto Serif SC"', '500 40px "Noto Serif SC"', '700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"',
    '300 40px "Noto Sans SC"', '400 40px "Noto Sans SC"', '400 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '400 40px "LXGW WenKai"'];
  await Promise.all(faces.map(f => document.fonts.load(f, stage.textContent + '0123456789')));
  await document.fonts.ready;

  function split(el) { (function walk(node) { [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) { const f = document.createDocumentFragment(); for (const ch of n.textContent) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; f.appendChild(s); } n.replaceWith(f); }
    else if (n.nodeType === 1 && !n.classList.contains('ch') && n.tagName !== 'BR') walk(n); }); })(el); }
  $$('.split').forEach(split);
  const els = sel => typeof sel === 'string' ? $$(sel) : [].concat(sel);
  const chars = sel => els(sel).flatMap(e => $$('.ch', e));

  // ---------- 初始状态：每个场景里的元素先藏起来 ----------
  gsap.set($$('.ch'), { opacity: 0 });
  gsap.set($$('#scenes .scene > *, .chips b, .chain > *, .boy b, .pr-r, .pr-r i, .wq-r, .wq-r i, .yp-rows b, .hr, .ex-r .nm, .ex-r .ex, .ex-r i, .ev, .sz, .te, .rm, .gq, .mp-tag, .pc-note, .bg-x, .gd-shout span, .tl-done, .am-true i, .fg-leaves ellipse, .mn-lab, .moon, .trunk, .pear, .coin, .brick, .crowd2 circle, .sea-svg > *, .ship, .monica, .mn-svg > *, .lt-q, .lt-say, .lt-cry, .fr-col, .bubble, .sea-bub, .sea-gone, .sea-pray, .sea-no, .qcard, .mr-cards, .mr-last, .mr-note, .dl, .dl-n, .mv, .clock, .snz, .lng, .pf-svg > *, .ci-svg path, #map .rt, .city, .pg'), { opacity: 0 });
  gsap.set(['#map', '.ch-l', '.ch-r .sec'], { opacity: 0 });
  gsap.set('#mapzoom', { attr: { transform: 'translate(0 0) scale(1)' } });
  const tl = gsap.timeline({ paused: true });
  const reveal = (t, at) => { for (const el of (typeof t === 'string' ? $$(t) : [].concat(t))) { let p = el.parentElement; while (p && !p.classList.contains('scene') && p.id !== 'stage') { if (+gsap.getProperty(p, 'opacity') === 0) tl.set(p, { opacity: 1 }, Math.max(0, at - 0.01)); p = p.parentElement; } } };
  const IN = (t, at, o = {}) => (reveal(t, at), tl.fromTo(t, { opacity: 0, y: o.y ?? 26, x: o.x ?? 0, scale: o.s ?? 1, filter: `blur(${o.blur ?? 12}px)` },
    { opacity: o.o ?? 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 0.9, ease: o.ease ?? 'power3.out', stagger: o.st ?? 0, immediateRender: false }, at));
  const OUT = (t, at, o = {}) => tl.to(t, { opacity: 0, y: o.y ?? -20, filter: `blur(${o.blur ?? 10}px)`, duration: o.d ?? 0.5, ease: 'power2.in', stagger: o.st ?? 0 }, at);
  const DRAW = (t, at, d = 1, o = {}) => { reveal(t, at); tl.set(t, { opacity: o.o ?? 1 }, at); return tl.fromTo(t, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: o.ease ?? 'power2.inOut', immediateRender: false }, at); };
  const type = (sel, at, dur, o = {}) => { const cs = chars(sel); return IN(cs, at, { st: Math.max(0.02, dur) / Math.max(1, cs.length), d: o.d ?? 0.7, y: o.y ?? 18, blur: o.blur ?? 10, s: o.s }); };
  const big = (sel, at, o = {}) => (reveal(chars(sel), at), tl.fromTo(chars(sel), { opacity: 0, y: o.y ?? 50, scale: o.s ?? 1.12, filter: `blur(${o.blur ?? 22}px)` }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 1.1, ease: 'expo.out', stagger: o.st ?? 0.07, immediateRender: false }, at));
  const light = (at, v, d = 1.5) => tl.to(BG, { ...v, duration: d, ease: 'sine.inOut' }, at);
  const flash = (at, x, y, peak = 0.55, rest = 0.08) => { tl.set(BG, { bx: x, by: y }, at - 0.01); tl.to(BG, { bloom: peak, duration: 0.35, ease: 'power2.out' }, at); tl.to(BG, { bloom: rest, duration: 1.6, ease: 'sine.inOut' }, at + 0.35); };
  const stamp = (sel, at) => (reveal(sel, at), tl.fromTo(sel, { opacity: 0, scale: 2.4, rotation: -2 }, { opacity: 0.95, scale: 1, rotation: -9, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }, at));
  // 场景进出：进 = 显示整个 section；出 = 整个 section 模糊淡出，再把里面的元素复位
  const scene = (sel, a, b) => { tl.set(sel, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 }, a - 0.02); tl.to(sel, { autoAlpha: 0, filter: 'blur(14px)', scale: 1.03, duration: 0.6, ease: 'power2.in' }, b - 0.6); };
  const show = (sel, at, o) => IN(sel, at, o);
  const secLab = $('.ch-r .sec');

  // 片头
  tl.to('#black', { opacity: 0, duration: 1.6 }, 0.1);
  light(0.1, { light: 0.7, rays: 0.7 }, 2.5);
  scene('#s00', 0, T('c001') - 0.2);
  tl.set(['#s00 .op-k', '#s00 .op-l'], { opacity: 0 }, 0); IN('#s00 .op-k', 0.5, { d: 1 }); big('#s00 .op-t', 0.8, { st: 0.12 }); IN('#s00 .op-l', 1.8, { d: 1.2, y: 10 });
  IN('.ch-l', T('c001'), { d: 1, y: -10, blur: 6 });

  // 小节标题（右上角）随节换
  let prevSec = null;
  for (const c of EP.cues) if (c.sec !== prevSec) { const s = c.sec, t = c.start - 0.2; tl.to(secLab, { opacity: 0, duration: 0.3 }, t - 0.35); tl.set(secLab, { textContent: '奥古斯丁这个人 · ' + s }, t - 0.05); tl.to(secLab, { opacity: 1, duration: 0.6 }, t); prevSec = s; }

  // ---------- 地图（几段共用） ----------
  const focus = (at, x, y, s, d = 1.8) => tl.to('#mapzoom', { attr: { transform: `translate(${1250 - s * x} ${560 - s * y}) scale(${s})` }, duration: d, ease: 'power3.inOut' }, at);
  const mapOn = (a, b) => { tl.set('#sMap', { autoAlpha: 1, filter: 'blur(0px)', scale: 1 }, a - 0.02); tl.to('#map', { opacity: 1, duration: 1.0 }, a); tl.to('#map', { opacity: 0, duration: 0.6 }, b - 0.6); tl.to('#sMap', { autoAlpha: 0, duration: 0.6 }, b - 0.6); };
  const card = (sel, a, b) => { IN(sel, a + 0.2, { x: -40, y: 0, d: 0.9 }); OUT(sel, b - 0.7, { y: 0, d: 0.45 }); };
  const cityIn = (k, at) => tl.to(cityEls[k], { opacity: 1, duration: 0.6 }, at);

  // 1 · 塔加斯特（c001–c002）
  { const a = T('c001') - 0.3, b = T('c003') - 0.1; mapOn(a, b); light(a, { light: 0.35, rays: 0.15, fx: 1250 }, 1.5);
    tl.set('#mapzoom', { attr: { transform: `translate(${1250 - 1.2 * 960} ${560 - 1.2 * 560}) scale(1.2)` } }, a); focus(a, P.thagaste[0], P.thagaste[1], 1.9, 3.2); cityIn('thagaste', W('c001', '塔加斯特'));
    card('.mc1', a, b); tl.fromTo('.mc1 .mp-yr', { textContent: 2026 }, { textContent: 354, snap: { textContent: 1 }, duration: 1.6, ease: 'power3.inOut', immediateRender: false }, a + 0.3);
    IN('.mc1 .mp-tag', T('c002') + 0.2, { d: 0.7, y: 10 }); focus(T('c002'), 1000, 560, 1.15, 2.4); }

  // 2 · 家（c003–c006）
  { const a = T('c003') - 0.1, b = T('c007') - 0.1; scene('#s02', a, b); light(a, { light: 0.6, rays: 0.5, fx: 960 });
    type('.fam-h', a + 0.1, 1.2); IN('.fam-h', a, { d: 0.6, y: 10 });
    IN('.pcard.f', T('c004') - 0.2, { y: 40 }); $$('.pcard.f .chips b').forEach((b2, i) => IN(b2, W('c004', ['小职位', '几亩', '不信主', '脾气'][i]) - 0.1, { d: 0.5, y: 14 }));
    IN('.pcard.m', T('c005') - 0.2, { y: 40 }); IN('.pcard.m .chips b', W('c005', '基督徒') - 0.1, { d: 0.6, y: 14 });
    tl.to('.pcard.f', { opacity: 0.45, duration: 0.8 }, T('c005')); IN('.pc-note', T('c006'), { d: 0.7, y: 10 }); flash(T('c006') + 0.3, 1380, 470, 0.4); }

  // 3 · 指望（c007–c008）
  { const a = T('c007') - 0.1, b = T('c009') - 0.1; scene('#s03', a, b);
    IN('.hp-k', W('c007', '全家的指望') - 0.2, { d: 0.7, y: 10 });
    [['.n1', '读书'], ['.n2', '学修辞'], ['.n3', '当律师'], ['.n4', '出人头地']].forEach(([n, w], i) => { const t = W('c007', w) - 0.15; IN('.chain ' + n, t, { y: 20, d: 0.6 }); if (i) tl.fromTo('.chain .a' + i, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4, immediateRender: false }, t - 0.25); });
    flash(W('c007', '出人头地') + 0.2, 1440, 470, 0.4); stamp('.st1', W('c008', '小镇做题家')); }

  // 4 · 钱断了（c009–c011）
  { const a = T('c009') - 0.1, b = T('c012') - 0.1; scene('#s04', a, b);
    const cs = $$('.coin'); cs.forEach((c, i) => tl.fromTo(c, { opacity: 0, y: -300 }, { opacity: 1, y: 0, duration: 0.45, ease: 'bounce.out', immediateRender: false }, W('c009', '到处凑钱') + i * 0.12));
    IN('.cn-a', W('c009', '十六岁') - 0.1, { d: 0.6 }); tl.set('.cn-l', { opacity: 1 }, a);
    cs.slice().reverse().forEach((c, i) => tl.to(c, { opacity: 0, y: 160 + i * 10, rotation: (i % 2 ? 1 : -1) * 30, duration: 0.5, ease: 'power2.in' }, W('c009', '钱断了') + i * 0.04));
    big('.cn-b', W('c009', '钱断了') - 0.05, { st: 0.08, d: 0.8 }); type('.cn-c', W('c009', '停学'), 1.2);
    tl.to(['.coins', '.cn-l'], { opacity: 0, duration: 0.5 }, T('c010') - 0.4);
    $$('.boy b').forEach((b2, i) => IN(b2, W('c010', ['聪明', '精力旺盛', '在家闲了'][i]) - 0.1, { d: 0.6, y: 20 })); tl.set('.boy', { opacity: 1 }, a);
    tl.to('.boy', { y: -120, opacity: 0.6, duration: 0.8 }, T('c011') - 0.2); type('.cn-q', T('c011'), 1.0); }

  // 5 · 偷梨（c012–c014）
  { const a = T('c012') - 0.1, b = T('c015') - 0.1; scene('#s05', a, b); light(a, { light: 0.4, rays: 0.15, fx: 1540 });
    tl.set('.tree', { opacity: 1 }, a); IN('.moon', a, { d: 1.5, y: 0 }); DRAW('.trunk', a + 0.2, 1.4); pearEls.forEach((p, i) => IN(p, a + 1.0 + i * 0.1, { d: 0.5, y: -10, blur: 4 }));
    tl.set('.pr-l', { opacity: 1 }, a); IN('.pr-k', a + 0.1, { d: 0.6, y: 10 }); big('.pr-t', W('c012', '偷了'), { st: 0.12 });
    tl.set('.pr-rows', { opacity: 1 }, a); IN('.pr-r.r1', W('c013', '不好吃') - 0.1, { x: -20, y: 0 }); IN('.pr-r.r1 i', W('c013', '我家有') , { s: 2, y: 0, blur: 2, d: 0.4 });
    pearEls.forEach((p, i) => tl.to(p, { y: 420 + i * 20, rotation: (i % 2 ? 40 : -40), opacity: 0.25, duration: 0.9, ease: 'power2.in', transformOrigin: '50% 50%' }, W('c014', '扔给猪') - 0.4 + i * 0.07));
    IN('.pr-r.r2', T('c014'), { x: -20, y: 0 }); IN('.pr-r.r2 i', W('c014', '扔给猪'), { s: 2, y: 0, blur: 2, d: 0.4 }); }

  // 6 · 大半卷（c015–c017）
  { const a = T('c015') - 0.1, b = T('c018') - 0.1; scene('#s06', a, b);
    tl.set('.bk2', { opacity: 1 }, a); IN('.bk2-h', W('c015', '忏悔录') - 0.2, { d: 0.6 }); $$('.bk2 .pg').forEach((p, i) => IN(p, W('c015', '大半卷') - 0.3 + i * 0.09, { x: 30, y: 0, d: 0.4, blur: 2 }));
    IN('.bk2-c', W('c015', '分析这几个梨') - 0.2, { d: 0.7, y: 12 });
    big('.zhi', W('c016', '至于吗') - 0.1, { st: 0.1, d: 0.8 }); tl.fromTo('.zhi', { rotation: 0 }, { rotation: -4, duration: 0.15, yoyo: true, repeat: 3, immediateRender: false }, E('c016')); }

  // 7 · 图什么（c018–c021）
  { const a = T('c018') - 0.1, b = T('c022') - 0.1; scene('#s07', a, b); light(a, { light: 0.55, rays: 0.4, fx: 960 });
    tl.set('.wq-k', { opacity: 1 }, a); type('.wq-k > .split', a + 0.2, 1.4); IN('.pearx', W('c018', '不是梨') - 0.1, { s: 1.6, y: 0, d: 0.5 });
    big('.wq-t', W('c019', '我当时') - 0.15, { st: 0.05, d: 0.9 });
    tl.set('.wq-rows', { opacity: 1 }, a); IN('.wq-r.q1', W('c020', '我不饿') - 0.1, { x: -20, y: 0, d: 0.5 }); IN('.wq-r.q1 i', W('c020', '我不饿') + 0.3, { s: 2, y: 0, d: 0.35 });
    IN('.wq-r.q2', W('c020', '梨也不好吃') - 0.1, { x: -20, y: 0, d: 0.5 }); IN('.wq-r.q2 i', W('c020', '不好吃') + 0.3, { s: 2, y: 0, d: 0.35 });
    tl.set('.wq-r.q3', { opacity: 1 }, a); type('.wq-r.q3 .split', W('c020', '这事不让干') - 0.05, 0.9, { d: 0.6 }); IN('.wq-r.q3 i', WE('c020', '不让干'), { s: 2, y: 0, d: 0.35 }); flash(WE('c020', '不让干'), 760, 680, 0.35);
    tl.to(['.wq-k', '.wq-t', '.wq-rows'], { opacity: 0, filter: 'blur(8px)', duration: 0.5 }, T('c021') - 0.45);
    tl.set('.wq-big', { opacity: 1 }, a); type('.wq-big > span', T('c021'), 0.6); big('.wq-big b', W('c021', '犯规'), { st: 0.12 }); }

  // 8 · 朋友（c022–c023）
  { const a = T('c022') - 0.1, b = T('c024') - 0.1; scene('#s08', a, b);
    IN('.fr-col.c1', W('c022', '只有我一个人') - 0.15, { y: 30 }); IN('.fr-col.c2', W('c023', '那帮朋友') - 0.15, { y: 30 });
    tl.set('.bubble', { opacity: 1 }, a); tl.fromTo('.bubble', { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2.2)', immediateRender: false, transformOrigin: '20% 100%' }, W('c023', '走干一票') - 0.15); type('.bubble .split', W('c023', '走干一票'), 0.7, { d: 0.4, y: 6 });
    type('.fr-cap', W('c023', '你不去'), 1.0); }

  // 9 · 你的梨（c024–c026）
  { const a = T('c024') - 0.1, b = T('c027') - 0.1; scene('#s09', a, b);
    tl.set(['.yp-k', '.yp-t', '.yp-sub', '.yp-rows'], { opacity: 1 }, a); type('.yp-k', a + 0.1, 1.2);
    type('.yp-t > .split', T('c025'), 0.6, { d: 0.8 }); tl.fromTo('.yp-t b', { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out', immediateRender: false }, W('c025', '梨') - 0.1);
    type('.yp-sub', T('c026'), 1.6); $$('.yp-rows b').forEach((b2, i) => IN(b2, W('c026', ['因为不许', '因为刺激', '因为大家'][i]) - 0.1, { d: 0.6, y: 20 })); }

  // 10 · 迦太基（c027–c028）
  { const a = T('c027') - 0.2, b = T('c029') - 0.1; mapOn(a, b); light(a, { light: 0.35, rays: 0.15 });
    tl.set('#mapzoom', { attr: { transform: `translate(${1250 - 1.9 * P.thagaste[0]} ${560 - 1.9 * P.thagaste[1]}) scale(1.9)` } }, a); tl.set(cityEls.thagaste, { opacity: 1 }, a);
    focus(a + 0.3, (P.thagaste[0] + P.carthage[0]) / 2, (P.thagaste[1] + P.carthage[1]) / 2, 2.2, 2.0);
    DRAW(R.tc, W('c027', '迦太基') - 0.6, 1.2); cityIn('carthage', W('c027', '迦太基') + 0.4);
    card('.mc2', a, b); IN('.mc2 .mp-tag', T('c028'), { d: 0.7, y: 10 }); }

  // 引文卡：一个个出现
  const quote = (id, a, b, hlAt) => { scene('#sQ', a, b); IN('#' + id, a, { y: 60, d: 1.0, blur: 6 }); const cs = chars('#' + id + ' .qc-t'); IN(cs, a + 0.4, { st: Math.max(0.6, b - a - 1.8) * 0.7 / cs.length, d: 0.5, y: 6, blur: 4 }); OUT('#' + id, b - 0.6, { d: 0.5 }); };
  // 11 · 爱上了恋爱（c029）
  quote('q29', T('c029') - 0.1, T('c030') - 0.1);

  // 12 · 她（c030–c033）
  { const a = T('c030') - 0.1, b = T('c034') - 0.1; scene('#s12', a, b); tl.set('.her', { opacity: 1 }, a);
    IN('.her-ic', a + 0.1, { s: 0.8, y: 0 }); tl.set('.her-rows', { opacity: 1 }, a);
    IN('.hr.h1', W('c030', '住到了一起'), { x: -20, y: 0, d: 0.6 }); IN('.hr.h2', W('c031', '十几年') - 0.1, { x: -20, y: 0, d: 0.6 }); IN('.hr.h3', W('c031', '一个儿子') - 0.1, { x: -20, y: 0, d: 0.6 });
    IN('.hr.h4', T('c032') + 0.2, { x: -20, y: 0, d: 0.6 }); tl.fromTo('.blank i', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', immediateRender: false }, W('c032', '名字') - 0.2);
    IN('.her-note', W('c032', '没有写'), { d: 0.7, y: 10 }); IN('.her-end', T('c033'), { d: 0.7, y: 10 }); }

  // 13 · 西塞罗（c034–c039）
  { const a = T('c034') - 0.1, b = T('c040') - 0.1; scene('#s13', a, b); light(a, { light: 0.6, rays: 0.5 });
    IN('.ci-age', a + 0.1, { d: 0.7 }); IN('.ci-bk.b1', W('c034', '西塞罗') - 0.2, { y: 40, d: 0.9 });
    tl.set('.ci-wis', { opacity: 1 }, a); big('.ci-wis .split', W('c034', '追求智慧') - 0.1, { st: 0.1, d: 0.8 }); IN('.ci-wis em', W('c034', '不能只为了') , { d: 0.7, y: 10 }); flash(W('c034', '追求智慧') + 0.2, 960, 300, 0.4);
    IN('.ci-bk.b2', W('c035', '圣经') - 0.2, { y: 40, d: 0.9 }); DRAW('.ci-a', W('c035', '先翻了翻') - 0.2, 0.8);
    tl.to('.ci-bk.b2', { rotation: 8, y: 30, opacity: 0.5, duration: 0.6 }, W('c036', '放下了')); type('.ci-put', T('c036'), 1.0);
    stamp('.st2', W('c037', '太土')); tl.to(['.ci-put'], { opacity: 0, duration: 0.3 }, W('c037', '太土') - 0.3);
    tl.set('.ci-why', { opacity: 1 }, a); type('.ci-why > span:nth-child(1)', T('c038'), 0.7); type('.ci-why > span:nth-child(2)', W('c038', '嫌圣经'), 0.8); }

  // 14 · 摩尼教（c040–c045）
  { const a = T('c040') - 0.1, b = T('c046') - 0.1; scene('#s14', a, b); light(a, { light: 0.45, rays: 0.3, fx: 560 });
    tl.set('.mn-svg', { opacity: 1 }, a); IN('.mn-l', a, { s: 0.7, y: 0, d: 1.2 }); tl.fromTo('.mn-d', { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.inOut', immediateRender: false }, a + 0.6); DRAW('.mn-o', a + 0.3, 1.2);
    IN('.mn-lab', a + 1.4, { d: 0.7, y: 10 });
    tl.set('.mn-t', { opacity: 1 }, a); big('.mn-t .split', a + 0.1, { st: 0.1, d: 0.8 }); IN('.mn-t em', W('c040', '一待九年'), { d: 0.6, y: 10, x: 0 });
    tl.set('.mn-say', { opacity: 1 }, a); [['.m1', 'c042', '你犯罪'], ['.m2', 'c042', '你里面'], ['.m3', 'c043', '你本人']].forEach(([m, id, w]) => { tl.set('.ms' + m, { opacity: 1 }, a); type('.ms' + m + ' .split', W(id, w) - 0.1, 1.2, { d: 0.6 }); });
    tl.to('.mn-l', { opacity: 0.55, duration: 1.0 }, W('c042', '黑暗的力量'));
    type('.mn-comf', W('c044', '很舒服') - 0.6, 1.2);
    tl.to('.mn-say', { opacity: 0, duration: 0.4 }, T('c045') - 0.3);
    tl.set('.mn-say', { opacity: 0 }, T('c045')); }
  // c045 用引文卡式的大字
  { const a = T('c045') - 0.05, b = T('c046') - 0.1; tl.set('.mn-comf', { opacity: 1 }, a); tl.to('.mn-t', { opacity: 0.25, duration: 0.5 }, a); }

  // 15 · 借口（c046–c050）
  { const a = T('c046') - 0.1, b = T('c051') - 0.1; scene('#s15', a, b);
    type('.ex-k', T('c047'), 1.6); IN('.ex-k', a, { d: 0.6 }); tl.set('.ex-rows', { opacity: 1 }, a);
    [['c048', 'e1'], ['c049', 'e2'], ['c050', 'e3']].forEach(([id, e]) => { tl.set('.ex-r.' + e, { opacity: 1 }, a); IN('.ex-r.' + e + ' .nm', T(id) - 0.1, { x: -30, y: 0, d: 0.6 }); tl.fromTo('.ex-r.' + e + ' i', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4, immediateRender: false }, W(id, '是') - 0.2); IN('.ex-r.' + e + ' .ex', W(id, '是') , { x: -20, y: 0, d: 0.6 }); }); }

  // 16 · 莫妮卡（c051–c056）
  { const a = T('c051') - 0.1, b = T('c057') - 0.1; scene('#s16', a, b); light(a, { light: 0.5, rays: 0.4, fx: 960 });
    tl.set('.mo', { opacity: 1 }, a); IN('.mo-ic', a + 0.1, { s: 0.8, y: 0 }); tl.set('.mo-s', { opacity: 1 }, a); type('.mo-s b', T('c052'), 0.8, { d: 0.6 });
    tl.set('.tears', { opacity: 1 }, a); tl.fromTo(window.ST2 = { tears: 0 }, { tears: 0 }, { tears: 1, duration: 1.0, immediateRender: false }, T('c053'));
    tl.to('.mo', { y: -60, duration: 0.8 }, T('c054') - 0.3);
    tl.set('.bish', { opacity: 1 }, a); IN('.bi-h', T('c054'), { d: 0.6, y: 10 }); type('.bi-r', T('c055'), C['c055'].dur * 0.9, { d: 0.5 }); IN('.bi-n', T('c056'), { d: 0.6, y: 10 }); }
  const ST2 = window.ST2;
  tl.to(ST2, { tears: 0, duration: 0.6 }, T('c054') - 0.5);

  // 17 · 不会灭亡（c057–c058）
  quote('q58', T('c057') - 0.1, T('c059') - 0.1); flash(W('c058', '这样的儿子'), 960, 560, 0.4);

  // 18 · 海港之夜（c059–c065）
  { const a = T('c059') - 0.1, b = T('c066') - 0.1; scene('#s17', a, b); light(a, { light: 0.3, rays: 0.05, fx: 1420, fy: 0 });
    tl.set('.sea-svg', { opacity: 1 }, a); ['.sea-water', '.sea-moon', '.shore', '.lights'].forEach((s2, i) => IN(s2, a + i * 0.15, { y: 0, d: 1.0 })); DRAW('.sea-hz', a, 1.4);
    tl.set('.ship', { opacity: 1 }, a); tl.set('.ship', { attr: { transform: 'translate(760 640)' } }, a);
    IN('.sea-age', a + 0.1, { d: 0.7 });
    tl.set('.sea-bub', { opacity: 1 }, a); tl.fromTo('.sea-bub', { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false, transformOrigin: '10% 100%' }, W('c061', '我上船') - 0.15);
    $$('.sea-bub > span').forEach((s2, i) => type(s2, W('c061', ['我上船', '你先去'][i]), 1.2, { d: 0.4, y: 6 }));
    tl.to('.sea-bub', { opacity: 0, duration: 0.4 }, T('c062') - 0.3); tl.to('.sea-age', { opacity: 0, duration: 0.4 }, T('c062') - 0.3);
    tl.to('.ship', { attr: { transform: 'translate(1500 640) scale(0.25)' }, duration: C['c062'].dur + 1.5, ease: 'power1.in' }, T('c062') - 0.2);
    tl.set('.sea-gone', { opacity: 1 }, a); type('.sea-gone', W('c062', '船已经开了') - 0.1, 1.0); OUT('.sea-gone', T('c064') - 0.4);
    tl.set('.monica', { opacity: 1 }, a); IN('.monica', T('c064') - 0.2, { y: 0, d: 0.8 });
    tl.set('.sea-pray', { opacity: 1 }, a); type('.sea-pray', W('c064', '别让他走'), 0.9, { d: 0.6 });
    tl.set('.sea-no', { opacity: 1 }, a); big('.sea-no', T('c065') - 0.05, { st: 0.1, d: 0.8 }); }

  // 19 · 回头写这一夜（c066）+ 两个祷告（c067–c070）
  quote('q66', T('c066') - 0.1, T('c067') - 0.1);
  { const a = T('c067') - 0.1, b = T('c069') - 0.1; scene('#s18', a, b);
    IN('.tp-col.c1', a + 0.05, { y: 30 }); tl.set('.tp-col .tp-t', { opacity: 1 }, a); type('.tp-col.c1 .tp-t', W('c067', '别让他走'), 0.7, { d: 0.6 });
    tl.set('.tp-mid', { opacity: 1 }, a); IN('.tp-col.c2', T('c068') - 0.1, { y: 30 }); type('.tp-col.c2 .tp-t', W('c068', '让他归向你'), 0.8, { d: 0.6 });
    tl.to('.tp-col.c1', { opacity: 0.4, duration: 0.6 }, W('c068', '让他归向你')); flash(W('c068', '归向你'), 1370, 450, 0.45); }
  // 20 · 地图：去了意大利（c069–c070）
  { const a = T('c069') - 0.2, b = T('c071') - 0.1; mapOn(a, b);
    tl.set('#mapzoom', { attr: { transform: `translate(${1250 - 1.5 * P.carthage[0]} ${560 - 1.5 * P.carthage[1]}) scale(1.5)` } }, a); ['thagaste', 'carthage'].forEach(k => tl.set(cityEls[k], { opacity: 1 }, a)); tl.set(R.tc, { opacity: 1, strokeDashoffset: 0 }, a);
    focus(a + 0.2, 1040, 500, 1.35, 2.2); DRAW(R.cr, a + 0.4, 1.0); cityIn('rome', a + 1.3); DRAW(R.rm, a + 1.5, 1.0); cityIn('milan', a + 2.4);
    card('.mc3', a, b); IN('.mc3 .mp-tag', W('c069', '遇见了') - 0.1, { d: 0.7, y: 10 }); }
  // 21 · 莫妮卡横渡地中海（c071–c073）
  { const a = T('c071') - 0.2, b = T('c074') - 0.1; mapOn(a, b);
    tl.set('#mapzoom', { attr: { transform: `translate(${1250 - 1.35 * 1040} ${560 - 1.35 * 500}) scale(1.35)` } }, a); ['thagaste', 'carthage', 'rome', 'milan'].forEach(k => tl.set(cityEls[k], { opacity: 1 }, a));
    [R.tc, R.cr, R.rm].forEach(r => tl.set(r, { opacity: 0.35, strokeDashoffset: 0 }, a));
    DRAW(R.mo, W('c071', '横渡地中海') - 0.6, 2.2, { o: 1 }); card('.mc4', a, b); stamp('.mc4 .mp-tag', W('c072', '北非式')); tl.set('.mc4 .mp-tag', { rotation: -5 }, W('c072', '北非式') + 0.5); }

  // 22 · 教授（c074–c077）
  { const a = T('c074') - 0.1, b = T('c078') - 0.1; scene('#s20', a, b); light(a, { light: 0.75, rays: 0.7, fx: 1390 });
    IN('.pf-age', a + 0.1, { d: 0.7 }); IN('.pf-badge', T('c075') - 0.15, { s: 0.85, y: 0, d: 0.9 }); tl.set('.pf-badge .pb-t', { opacity: 1 }, a); big('.pb-t', T('c075'), { st: 0.08, d: 0.8 });
    tl.set('.pf-chips', { opacity: 1 }, a); $$('.pf-chips b').forEach((b2, i) => IN(b2, W('c075', ['皇帝住的地方', '官方任命', '写颂词'][i]) - 0.15, { x: -20, y: 0, d: 0.6 }));
    tl.set('.pf-svg', { opacity: 1 }, a); IN('.pf-a', T('c076'), { y: 0, d: 0.4 }); IN('.pf-from', T('c076'), { d: 0.6, y: 10 }); DRAW('.pf-path', W('c076', '三十岁') - 0.2, 1.6); IN('.pf-b', W('c076', '帝国的中心'), { s: 2, y: 0, d: 0.5 }); IN('.pf-to', W('c076', '帝国的中心'), { d: 0.6, y: 10 });
    tl.to(['.pf-chips'], { opacity: 0.4, duration: 0.6 }, T('c076')); type('.pf-dad', T('c077'), 1.6); }

  // 23 · 快乐吗（c078–c081）
  { const a = T('c078') - 0.1, b = T('c082') - 0.1; scene('#s21', a, b); light(a, { light: 0.5, rays: 0.4, fx: 960 });
    big('.hq', a + 0.05, { st: 0.07, d: 0.8 });
    IN('.scroll', T('c079') + 0.3, { y: 60, d: 1.0, blur: 6 }); tl.set('.sc-l', { opacity: 1 }, a); $$('.sc-l').forEach((l, i) => IN(l, T('c080') + i * 0.35, { d: 0.6, y: 6, blur: 4 }));
    stamp('.st3', W('c081', '谎话') - 0.05); tl.set('.sc-n', { opacity: 1 }, a); type('.sc-n > span:nth-child(1)', W('c081', '台下鼓掌'), 0.8); type('.sc-n > span:nth-child(2)', W('c081', '也知道'), 0.8); }

  // 24 · 乞丐（c082–c091）
  { const a = T('c082') - 0.1, b = T('c092') - 0.1; scene('#s22', a, b);
    IN('.bg-h', W('c082', '米兰的一条街') - 0.2, { d: 0.7, y: 10 }); IN('.bg-col.c1', W('c082', '乞丐') - 0.1, { y: 30 });
    tl.fromTo('.c1 .bg-bar i', { width: '0%' }, { width: '100%', duration: 1.2, ease: 'power2.out', immediateRender: false }, W('c083', '乐呵呵'));
    IN('.bg-col.c2', T('c085') - 0.1, { y: 30 }); tl.fromTo('.c2 .bg-bar i', { width: '0%' }, { width: '34%', duration: 2.4, ease: 'power1.inOut', immediateRender: false }, W('c085', '往上爬'));
    tl.to('.bg-col.c2 .bg-bar i', { width: '22%', duration: 1.4, ease: 'sine.inOut' }, T('c087'));
    tl.fromTo('.c1 .bg-st', { scale: 1 }, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }, W('c086', '已经到手'));
    stamp('.c1 .bg-x', W('c088', '不是真的')); tl.set('.c1 .bg-x', { rotation: -5 }, W('c088', '不是真的') + 0.5); stamp('.c2 .bg-x', W('c089', '比他的还假')); tl.set('.c2 .bg-x', { rotation: -5 }, W('c089', '比他的还假') + 0.5);
    tl.to(['.bg-col'], { y: -90, opacity: 0.55, duration: 0.8 }, T('c090') - 0.2);
    tl.set('.metro', { opacity: 1 }, a); DRAW('.mt-l', W('c091', '周一早上') - 0.6, 1.0); type('.mt-t .split', W('c091', '这是周一'), 1.0, { d: 0.6 }); }

  // 25 · 婚事（c092–c094），她被送回非洲（c095–c096），心被撕开（c097），又找了一个（c098–c100）
  { const a = T('c092') - 0.1, b = T('c095') - 0.1; scene('#s23', a, b);
    type('.mr-h', W('c093', '要往上走') - 0.1, 1.4); IN('.mr-h', a, { d: 0.6 }); tl.set('.mr-cards', { opacity: 1 }, a);
    IN('.mr-c.a', W('c094', '好人家') - 0.1, { y: 30 }); IN('.mr-c.b', W('c094', '两年'), { y: 30 }); }
  { const a = T('c095') - 0.2, b = T('c097') - 0.1; mapOn(a, b);
    tl.set('#mapzoom', { attr: { transform: `translate(${1250 - 1.35 * 1040} ${560 - 1.35 * 500}) scale(1.35)` } }, a); ['carthage', 'rome', 'milan'].forEach(k => tl.set(cityEls[k], { opacity: 1 }, a));
    [R.tc, R.cr, R.rm, R.mo].forEach(r => tl.set(r, { opacity: 0 }, a));
    card('.mc5', a, b); DRAW(R.her, W('c096', '她被送回') - 0.3, 2.0, { o: 0.9 }); IN('.mc5 .mp-tag', W('c096', '儿子留下') - 0.1, { d: 0.6, y: 10 }); }
  quote('q97', T('c097') - 0.1, T('c098') - 0.1);
  { const a = T('c098') - 0.1, b = T('c101') - 0.1; scene('#s23', a, b); tl.set(['.mr-h', '.mr-cards'], { opacity: 0 }, a);
    tl.set('.mr-last', { opacity: 1 }, a); type('.mr-last > div:nth-child(1)', W('c099', '可我等不了'), 1.2, { d: 0.6 }); type('.mr-last > div:nth-child(2)', W('c099', '我又找了'), 1.0, { d: 0.6 });
    tl.set('.mr-note', { opacity: 1 }, a); type('.mr-note', T('c100'), 1.6); }

  // 26 · 安波罗修（c101–c107）
  { const a = T('c101') - 0.1, b = T('c108') - 0.1; scene('#s24', a, b); light(a, { light: 0.7, rays: 0.65, fx: 960 });
    tl.set('.am', { opacity: 1 }, a); IN('.am-k', a + 0.1, { d: 0.6 }); big('.am-t', W('c102', '安波罗修') - 0.1, { st: 0.1 }); IN('.am-l', W('c102', '有名的讲道人') - 0.2, { d: 0.6, y: 10 });
    IN('.meter', T('c103') - 0.1, { y: 30 }); tl.fromTo('.mt-bar i', { left: '0%' }, { left: '0%', duration: 0.1, immediateRender: false }, a); tl.to('.mt-bar i', { left: '100%', duration: 2.4, ease: 'power2.inOut' }, W('c105', '内容也进去了') - 1.0);
    tl.to('.meter', { opacity: 0, duration: 0.5 }, T('c106') - 0.4);
    tl.set('.wall', { opacity: 1 }, a); $$('.brick').forEach((br, i) => { IN(br, T('c106') - 0.2 + i * 0.05, { d: 0.4, y: 10, blur: 2 }); tl.to(br, { y: 500, rotation: (i % 2 ? 1 : -1) * (20 + i * 5), opacity: 0, duration: 0.8, ease: 'power2.in' }, W('c106', '一个个拆掉') + i * 0.18); });
    tl.set('.am-true', { opacity: 1 }, a); IN('.am-true i', T('c107'), { s: 2, y: 0, d: 0.5 }); type('.am-true .split', W('c107', '基督教'), 0.9); flash(W('c107', '是真的'), 960, 860, 0.45); }

  // 27 · 动不了，赖床（c108–c114）
  { const a = T('c108') - 0.1, b = T('c115') - 0.1; scene('#s25', a, b); light(a, { light: 0.45, rays: 0.3 });
    tl.set('.mv', { opacity: 1 }, a); big('.mv', a + 0.05, { st: 0.08, d: 0.8 }); tl.to('.mv', { y: -60, scale: 0.6, opacity: 0.5, duration: 0.8 }, T('c110') - 0.4);
    IN('.clock', W('c110', '赖床') - 0.2, { s: 0.8, y: 0, d: 0.7 }); tl.fromTo('.clock', { rotation: 0 }, { rotation: 6, duration: 0.07, yoyo: true, repeat: 15, ease: 'none', transformOrigin: '50% 60%', immediateRender: false }, W('c110', '赖床'));
    tl.set('.snz', { opacity: 1 }, a); [['.z1', '马上'], ['.z2', '马上', 1], ['.z3', '再等一会儿']].forEach(([z, w, n]) => IN('.sz' + z, W('c111', w, n || 0) - 0.1, { x: -20, y: 0, d: 0.5 }));
    tl.set('.lng', { opacity: 1 }, a); IN('.lg-t', T('c112'), { d: 0.5, y: 8 }); tl.fromTo('.lg-bar i', { width: '0%' }, { width: '100%', duration: C['c112'].dur + 0.4, ease: 'power1.in', immediateRender: false }, W('c112', '拖得很长'));
    tl.to(['.mv', '.clock', '.snz', '.lng'], { opacity: 0, filter: 'blur(10px)', duration: 0.5 }, T('c113') - 0.45);
    tl.set('.dl', { opacity: 1 }, a); type('.dl > div:nth-child(1)', T('c113') - 0.05, 0.6, { d: 0.8, y: 30, blur: 16 }); big('.dl > div:nth-child(2)', W('c113', '就是做不到') - 0.05, { st: 0.1 });
    IN('.dl-n', T('c114'), { d: 0.8, y: 10 }); flash(W('c113', '做不到'), 960, 560, 0.4); }

  // 28 · 花园（c115–c123）
  { const a = T('c115') - 0.1, b = T('c124') - 0.1; scene('#s26', a, b); light(a, { light: 0.5, rays: 0.4, fx: 1400 });
    IN('.gd-k', a + 0.1, { d: 0.8 }); IN('.gd-ant', W('c115', '安东尼') - 0.2, { y: 20 });
    tl.set('.fig', { opacity: 1 }, a); DRAW('.fg-t', T('c120') - 0.3, 1.4); tl.fromTo('.fg-leaves ellipse', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.02, transformOrigin: '50% 50%', immediateRender: false }, T('c120') + 0.4);
    tl.to(['.gd-ant'], { opacity: 0, duration: 0.5 }, T('c117') - 0.4);
    tl.set('.gd-shout', { opacity: 1 }, a); $$('.gd-shout > span').forEach((s2, i) => { tl.set(s2, { opacity: 1 }, a); type(s2, T(['c118', 'c119'][i]), C[['c118', 'c119'][i]].dur * 0.8, { d: 0.5 }); });
    tl.to(['.gd-shout', '.gd-k'], { opacity: 0, duration: 0.5 }, T('c120') - 0.3);
    tl.set('.gd-qs', { opacity: 1 }, a); [['.g1', 'c121', '还要多久'], ['.g2', 'c122', '明天吗'], ['.g3', 'c122', '又是明天'], ['.g4', 'c122', '为什么不是现在']].forEach(([g, id, w]) => IN('.gq' + g, W(id, w) - 0.1, { x: -30, y: 0, d: 0.6 }));
    flash(W('c123', '他自己') , 400, 640, 0.35); tl.to('.gq.g4', { scale: 1.08, duration: 0.3, yoyo: true, repeat: 1, transformOrigin: '0% 50%' }, W('c123', '为什么不是现在')); }

  // 29 · 拿着，读吧（c124–c131）
  { const a = T('c124') - 0.1, b = T('c132') - 0.1; scene('#s27', a, b); light(a, { light: 0.6, rays: 0.6, fx: 960 });
    tl.set('.tl-echo', { opacity: 1 }, a); [['.e1', 'c124', '拿着读吧'], ['.e2', 'c125', '拿着'], ['.e3', 'c125', '读吧']].forEach(([e, id, w]) => { IN('.te' + e, W(id, w) - 0.05, { s: 1.3, y: 0, d: 0.8, blur: 16 }); });
    IN('.tl-la', W('c124', '拿着读吧'), { d: 1.2, y: 10 });
    tl.to(['.tl-echo', '.tl-la'], { opacity: 0, duration: 0.6 }, T('c127'));
    tl.fromTo('#pgR', { opacity: 0, rotationY: -70, x: -40 }, { opacity: 1, rotationY: -3, x: 0, duration: 1.4, ease: 'power3.out', immediateRender: false }, W('c127', '翻开') - 0.2);
    $$('.rm').forEach((r, i) => { tl.set(r, { opacity: 1 }, a); type(r, W('c128', ['不可荒宴', '总要披戴', '不要为肉体'][i]), C['c128'].dur * [0.38, 0.2, 0.26][i], { d: 0.5, y: 6, blur: 4 }); });
    light(T('c130') - 0.4, { light: 1, rays: 1 }, 1.4); flash(W('c130', '一道安稳的光'), 960, 300, 0.9, 0.25);
    tl.to('#pgR', { opacity: 0.25, filter: 'blur(4px)', duration: 0.8 }, W('c130', '所有的犹豫') - 0.4);
    tl.set('.tl-done', { opacity: 1 }, a); type('.tl-done > span', W('c130', '所有的犹豫'), 0.7); big('.tl-done b', W('c130', '都散了'), { st: 0.1, d: 0.8 });
    tl.to(['#pgR', '.tl-done'], { opacity: 0, duration: 0.5 }, T('c131') - 0.3);
    tl.set('.tl-keep', { opacity: 1 }, a); big('.tl-keep', T('c131') + 0.1, { st: 0.06, d: 0.9 }); }

  // 30 · 后来（c132–c148）
  { const a = T('c132') - 0.1, b = T('c148') + C['c148'].dur + 2.6; scene('#s28', a, b); light(a, { light: 0.55, rays: 0.45, fx: 960, bloom: 0 });
    IN('.lt-k', a + 0.1, { d: 0.7 }); tl.set('.lt-svg', { opacity: 1 }, a); tl.set('.lt-base', { opacity: 1 }, a); tl.fromTo('.lt-base', { attr: { x2: 200 } }, { attr: { x2: 1720 }, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, a + 0.2);
    const evAt = { e1: W('c133', '施洗') - 0.4, e2: W('c134', '病倒了') - 0.3, e3: T('c138') - 0.1, e4: T('c141') - 0.1, e5: T('c148') - 0.1, e6: W('c148', '一直做到去世') };
    for (const e in evAt) IN('.ev.' + e, evAt[e], { y: 20, d: 0.7 });
    tl.set('.lt-gold', { opacity: 1, strokeDashoffset: 1 }, a); tl.to('.lt-gold', { strokeDashoffset: 1 - (EVX[1] - 200) / 1520, duration: 0.8, ease: 'power2.inOut' }, evAt.e1); tl.to('.lt-gold', { strokeDashoffset: 1 - (EVX[2] - 200) / 1520, duration: 0.8 }, evAt.e2); tl.to('.lt-gold', { strokeDashoffset: 1 - (EVX[3] - 200) / 1520, duration: 0.8 }, evAt.e3); tl.to('.lt-gold', { strokeDashoffset: 1 - (EVX[4] - 200) / 1520, duration: 0.8 }, evAt.e4); tl.to('.lt-gold', { strokeDashoffset: 1 - (EVX[5] - 200) / 1520, duration: 0.8 }, evAt.e5);
    // 莫妮卡的话
    tl.set('.lt-q', { opacity: 1 }, a); $$('.qq').forEach(q => tl.set(q, { opacity: 1 }, a)); type($$('.qq')[0], W('c137', '神给我的'), 0.7, { d: 0.6 }); type($$('.qq')[1], W('c137', '比我求的'), 0.8, { d: 0.6 }); tl.set('.qa', { opacity: 0 }, a); IN('.qa', E('c137') - 0.2, { d: 0.6, y: 8 });
    tl.set(['.qq .ch', '.qa'], { opacity: 0 }, T('c133') - 0.01); tl.to('.lt-q', { opacity: 0, duration: 0.5 }, T('c138') - 0.3);
    // 希波：会众回头
    tl.to(['.ev', '.lt-svg', '.lt-k'], { opacity: 0.15, duration: 0.6 }, T('c143') - 0.4);
    tl.set('.crowd2', { opacity: 1 }, a); crowd.forEach((c, i) => IN(c, T('c143') - 0.3 + i * 0.008, { d: 0.4, y: 10, blur: 2 })); IN(aug, T('c143'), { d: 0.5, y: 0 });
    tl.set('.lt-say', { opacity: 1 }, a); type('.lt-say', W('c143', '我们教会'), 1.6, { d: 0.6 });
    crowd.forEach((c, i) => tl.to(c, { attr: { cx: +c.getAttribute('cx') + (1500 - c.getAttribute('cx')) * 0.06, cy: +c.getAttribute('cy') + (870 - c.getAttribute('cy')) * 0.06 }, fill: '#e2bd76', duration: 0.6, ease: 'power2.out' }, T('c144') + i * 0.006));
    tl.to(aug, { attr: { r: 26 }, duration: 0.4, yoyo: true, repeat: 3 }, W('c144', '看见了'));
    tl.to(['.crowd2', '.lt-say'], { opacity: 0, duration: 0.6 }, T('c146') - 0.4);
    tl.set('.lt-cry', { opacity: 1 }, a); type('.lt-cry span', W('c146', '他哭了'), 0.6, { d: 0.6 }); type('.lt-cry em', T('c147'), 1.4, { d: 0.6 });
    tl.to('.lt-cry', { opacity: 0, duration: 0.5 }, T('c148') - 0.4); tl.to(['.ev', '.lt-svg', '.lt-k'], { opacity: 1, duration: 0.8 }, T('c148') - 0.3);
    tl.to('.lt-gold', { strokeDashoffset: 1 - (EVX[6] - 200) / 1520, duration: 1.4, ease: 'power2.inOut' }, evAt.e6); }

  // 片尾
  { const a = EP.total - 6.2; scene('#sZ2', a, EP.total + 1); tl.to(['.ch-l', secLab], { opacity: 0, duration: 0.8 }, a - 0.6);
    IN('#sZ2 .z-k', a + 0.2, { d: 0.9 }); type('#sZ2 .z-t', a + 0.5, 1.0, { d: 0.9, y: 24, blur: 14 }); IN('#sZ2 .z-s', a + 1.3, { d: 0.9, y: 10 });
    tl.to('#black', { opacity: 1, duration: 1.0 }, EP.total - 1.1); }
  tl.set({}, {}, EP.total);

  if (window.ASIDES) window.ASIDES(tl);
  // ---------- 字幕 ----------
  const subs = [];
  for (const c of EP.cues) {
    const txt = c.sub.replace(/[“”"]/g, '');
    if (txt.length <= 26) { subs.push({ s: c.start, e: c.end, t: txt }); continue; }
    const cuts = []; [...txt].forEach((ch, i) => { if ('，；：。？！、'.includes(ch) && i < txt.length - 2) cuts.push(i + 1); });
    let parts = [], from = 0;
    while (txt.length - from > 26 && cuts.length) { const lim = from + 26; let best = cuts.filter(k => k > from + 6 && k <= lim).pop(); if (!best) best = cuts.find(k => k > from) || txt.length; parts.push(txt.slice(from, best)); from = best; }
    parts.push(txt.slice(from)); parts = parts.filter(p => p.trim());
    const tot = parts.reduce((a, p) => a + p.length, 0); let t0 = c.start;
    parts.forEach(p => { const d = c.dur * p.length / tot; subs.push({ s: t0, e: t0 + d, t: p }); t0 += d; });
  }
  if (EP.subs) { subs.length = 0; EP.subs.forEach(s => subs.push({ s: s.s, e: s.e, t: s.t.replace(/[“”"]/g, '') })); }
  subs.forEach(s => s.t = s.t.replace(/[，。：；、]$/, ''));
  const subEl = $('#sub span'), prog = $('#prog i');
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function drawSub(t) { let cur = null; for (const s of subs) if (t >= s.s - 0.1 && t <= s.e + 0.25) cur = s;
    if (!cur) { subEl.style.opacity = 0; return; } if (subEl.textContent !== cur.t) subEl.textContent = cur.t; subEl.style.opacity = Math.min(sm((t - (cur.s - 0.1)) / 0.18), sm(((cur.e + 0.25) - t) / 0.18)); }
  function tick(t) { tearEls.forEach(([e, ph, sp]) => { const p = ((t * sp * 0.35 + ph) % 1); e.setAttribute('cy', 420 + p * 560); e.style.opacity = Math.sin(Math.PI * p) * ST2.tears; }); }

  for (let t = 0; t <= EP.total + 0.05; t += 1 / 30) tl.time(t, true);
  tl.time(0, true);
  window.DURATION = EP.total;
  window.seek = function (t) { t = Math.max(0, Math.min(EP.total, t)); tl.time(t, false); tick(t); drawBg(t); drawGrain(t); drawSub(t); prog.style.width = (t / EP.total * 100).toFixed(3) + '%'; };
  seek(0);
  window.READY = true;
})();
