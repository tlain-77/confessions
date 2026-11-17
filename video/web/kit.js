// 各集共用：时间轴、出场动画、字幕、逐帧定位。用法：const K = await kit(); …；K.finish(hideList)
window.kit = async function () {
  const EP = window.EPD, BG = window.BG;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const C = {}; EP.cues.forEach(c => C[c.id] = c);
  const han = s => [...s].filter(ch => /[一-鿿0-9]/.test(ch)).join('');
  const T = id => C[id].start, E = id => C[id].end, D = id => C[id].dur;
  const W = (id, phrase, nth = 0) => { const c = C[id], s = han(c.say), p = han(phrase); let i = -1; for (let k = 0; k <= nth; k++) i = s.indexOf(p, i + 1); if (i < 0) throw new Error(id + ' 里找不到：' + phrase); return c.ct ? c.ct[i] : c.start + c.dur * i / s.length; };
  let SCALE = 1;
  function fit() { SCALE = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${SCALE})`; stage.style.left = (innerWidth - 1920 * SCALE) / 2 + 'px'; stage.style.top = (innerHeight - 1080 * SCALE) / 2 + 'px'; }
  fit(); addEventListener('resize', fit);
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const rng = seed => function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const faces = ['300 40px "Noto Serif SC"', '400 40px "Noto Serif SC"', '500 40px "Noto Serif SC"', '700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"',
    '300 40px "Noto Sans SC"', '400 40px "Noto Sans SC"', '400 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '400 40px "LXGW WenKai"'];
  const K = { EP, C, T, E, D, W, $, $$, svgEl, rng, stage, BG };
  K.prepare = async function (hide) {
    await Promise.all(faces.map(f => document.fonts.load(f, stage.textContent + '0123456789')));
    await document.fonts.ready;
    $$('.split').forEach(el => (function walk(node) { [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); for (const ch of n.textContent) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; f.appendChild(s); } n.replaceWith(f); }
      else if (n.nodeType === 1 && !n.classList.contains('ch') && n.tagName !== 'BR') walk(n); }); })(el));
    gsap.set($$('.ch'), { opacity: 0 });
    gsap.set($$('#scenes .scene > *' + (hide ? ', ' + hide : '')), { opacity: 0 });
    gsap.set(['.ch-l', '.ch-r .sec'], { opacity: 0 });
    const tl = K.tl = gsap.timeline({ paused: true });
    const els = t => typeof t === 'string' ? $$(t) : [].concat(t);
    const chars = K.chars = sel => els(sel).flatMap(e => e.classList && e.classList.contains('ch') ? [e] : $$('.ch', e));
    const reveal = (t, at) => { for (const el of els(t)) { let p = el.parentElement; while (p && !p.classList.contains('scene') && p.id !== 'stage') { if (+gsap.getProperty(p, 'opacity') === 0) tl.set(p, { opacity: 1 }, Math.max(0, at - 0.01)); p = p.parentElement; } } };
    K.IN = (t, at, o = {}) => { reveal(t, at); gsap.set(t, { opacity: 0 }); return tl.fromTo(t, { opacity: 0, y: o.y ?? 26, x: o.x ?? 0, scale: o.s ?? 1, filter: `blur(${o.blur ?? 12}px)` }, { opacity: o.o ?? 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 0.9, ease: o.ease ?? 'power3.out', stagger: o.st ?? 0, immediateRender: false }, at); };
    K.OUT = (t, at, o = {}) => tl.to(t, { opacity: 0, y: o.y ?? -20, filter: `blur(${o.blur ?? 10}px)`, duration: o.d ?? 0.5, ease: 'power2.in', stagger: o.st ?? 0 }, at);
    K.DRAW = (t, at, d = 1, o = {}) => { reveal(t, at); tl.set(t, { opacity: o.o ?? 1 }, at); return tl.fromTo(t, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: o.ease ?? 'power2.inOut', immediateRender: false }, at); };
    K.type = (sel, at, dur, o = {}) => { const cs = chars(sel); return K.IN(cs, at, { st: Math.max(0.02, dur) / Math.max(1, cs.length), d: o.d ?? 0.7, y: o.y ?? 18, blur: o.blur ?? 10, s: o.s }); };
    K.big = (sel, at, o = {}) => { const cs = chars(sel); reveal(cs, at); return tl.fromTo(cs, { opacity: 0, y: o.y ?? 50, scale: o.s ?? 1.12, filter: `blur(${o.blur ?? 22}px)` }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 1.1, ease: 'expo.out', stagger: o.st ?? 0.07, immediateRender: false }, at); };
    K.stamp = (sel, at, rot = -9) => { reveal(sel, at); gsap.set(sel, { opacity: 0 }); return tl.fromTo(sel, { opacity: 0, scale: 2.4, rotation: rot + 7 }, { opacity: 0.95, scale: 1, rotation: rot, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }, at); };
    K.light = (at, v, d = 1.5) => tl.to(BG, { ...v, duration: d, ease: 'sine.inOut' }, at);
    K.flash = (at, x, y, peak = 0.5, rest = 0.08) => { tl.set(BG, { bx: x, by: y }, at - 0.01); tl.to(BG, { bloom: peak, duration: 0.35, ease: 'power2.out' }, at); tl.to(BG, { bloom: rest, duration: 1.6, ease: 'sine.inOut' }, at + 0.35); };
    K.scene = (sel, a, b) => { tl.set(sel, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 }, a - 0.02); tl.to(sel, { autoAlpha: 0, filter: 'blur(14px)', scale: 1.03, duration: 0.6, ease: 'power2.in' }, b - 0.6); };
    K.on = (sel, at) => { reveal(sel, at); tl.set(sel, { opacity: 1 }, at); };
    // 片头片尾、右上角小节名
    tl.to('#black', { opacity: 0, duration: 1.6 }, 0.1);
    K.IN('.ch-l', EP.cues[0].start, { d: 1, y: -10, blur: 6 });
    const lab = $('.ch-r .sec'); let prev = null;
    for (const c of EP.cues) if (c.sec !== prev) { const t = c.start - 0.2; tl.to(lab, { opacity: 0, duration: 0.3 }, t - 0.35); tl.set(lab, { textContent: (K.secPrefix || '') + c.sec }, t - 0.05); tl.to(lab, { opacity: 1, duration: 0.6 }, t); prev = c.sec; }
    return K;
  };
  K.finish = function (tick) {
    const tl = K.tl;
    tl.to(['.ch-l', '.ch-r .sec'], { opacity: 0, duration: 0.8 }, EP.total - 6.8);
    tl.to('#black', { opacity: 1, duration: 1.0 }, EP.total - 1.1); tl.set({}, {}, EP.total);
    const subs = [];
    for (const c of EP.cues) {
      const txt = c.sub.replace(/[“”"]/g, '').replace(/^>\s*/, '').replace(/^(原文|大意)：/, '');
      if (txt.length <= 26) { subs.push({ s: c.start, e: c.end, t: txt }); continue; }
      const cuts = []; [...txt].forEach((ch, i) => { if ('，；：。？！、'.includes(ch) && i < txt.length - 2) cuts.push(i + 1); });
      let parts = [], from = 0;
      while (txt.length - from > 26 && cuts.length) { const lim = from + 26; let best = cuts.filter(k => k > from + 6 && k <= lim).pop(); if (!best) best = cuts.find(k => k > from) || txt.length; parts.push(txt.slice(from, best)); from = best; }
      parts.push(txt.slice(from)); parts = parts.filter(p => p.trim());
      const tot = parts.reduce((a, p) => a + p.length, 0); let t0 = c.start;
      parts.forEach(p => { const d = c.dur * p.length / tot; subs.push({ s: t0, e: t0 + d, t: p }); t0 += d; });
    }
    if (EP.subs) { subs.length = 0; EP.subs.forEach(s => subs.push({ s: s.s, e: s.e, t: s.t.replace(/[“”"]/g, '') })); }   // 本人录制：字幕按实际说的话
    subs.forEach(s => s.t = s.t.replace(/[，。：；、]$/, ''));
    const subEl = $('#sub span'), prog = $('#prog i');
    const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const drawSub = window.makeSubDrawer(subs, subEl);
    for (let t = 0; t <= EP.total + 0.05; t += 1 / 30) tl.time(t, true);
    tl.time(0, true);
    window.DURATION = EP.total;
    window.seek = function (t) { t = Math.max(0, Math.min(EP.total, t)); tl.time(t, false); if (tick) tick(t); drawBg(t); drawGrain(t); drawSub(t); prog.style.width = (t / EP.total * 100).toFixed(3) + '%'; };
    seek(0); window.READY = true;
  };
  return K;
};
