// Scene choreography. One paused GSAP timeline; every cue time comes from the narration
// timeline (window.TIMELINE), so the picture follows the voice. window.seek(t) renders any instant.
(async function () {
  const TLD = window.TIMELINE, C = {}; TLD.cues.forEach(c => C[c.id] = c);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const P = (cue, f) => cue.start + cue.dur * f;

  // ---- fit to window (preview only; capture runs at exactly 1920×1080) ----
  let SCALE = 1;
  function fit() { SCALE = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${SCALE})`; stage.style.left = (innerWidth - 1920 * SCALE) / 2 + 'px'; stage.style.top = (innerHeight - 1080 * SCALE) / 2 + 'px'; }
  fit(); addEventListener('resize', fit);

  // ---- fonts: load every face for every glyph on stage before measuring or drawing ----
  const allText = stage.textContent + '0123456789';
  const faces = ['300 40px "Noto Serif SC"', '400 40px "Noto Serif SC"', '500 40px "Noto Serif SC"', '700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"',
    '300 40px "Noto Sans SC"', '400 40px "Noto Sans SC"', '400 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '400 40px "LXGW WenKai"'];
  await Promise.all(faces.map(f => document.fonts.load(f, allText)));
  await document.fonts.ready;

  // ---- split text into characters (keeps nested <b>/<u>) ----
  function split(el) {
    (function walk(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) { const f = document.createDocumentFragment(); for (const ch of n.textContent) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; f.appendChild(s); } n.replaceWith(f); }
        else if (n.nodeType === 1 && !n.classList.contains('ch')) walk(n);
      });
    })(el);
  }
  $$('.split,.split-la').forEach(split);
  const chars = sel => $$(sel).flatMap(e => $$('.ch', e));

  // ---- connectors between matching phrases in scene F (measured in final layout) ----
  const fsvg = $('.f-svg'), sr = () => stage.getBoundingClientRect();
  function box(el) { const r = el.getBoundingClientRect(), s = sr(); return { x: (r.left - s.left) / SCALE, y: (r.top - s.top) / SCALE, w: r.width / SCALE, h: r.height / SCALE }; }
  function connect(aSel, bSel, cls) {
    const a = box($(aSel)), b = box($(bSel));
    const ax = a.x + a.w / 2, ay = a.y + a.h + 6, bx = b.x + b.w / 2, by = b.y - 4, my = (ay + by) / 2;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M${ax} ${ay} C ${ax} ${my}, ${bx} ${my}, ${bx} ${by}`); p.setAttribute('pathLength', '1'); p.setAttribute('class', cls); fsvg.appendChild(p);
  }
  connect('.f-v1 .p1', '.f-q1 .p1', 'k1'); connect('.f-v1 .p2', '.f-q1 .p2', 'k2');
  connect('.f-q2 .p3', '.f-v2 .p3', 'k3'); connect('.f-q2 .p4', '.f-v2 .p4', 'k4');

  // ---- initial states ----
  gsap.set($$('.ch'), { opacity: 0 });
  gsap.set(['.a-zhu', '.a-halo .ring', '.b-latin', '.b-sweep', '.b-rule i', '.b-rule b', '.b-meta', '.b-ep', '.life-base', '.tick', '.life-dot', '.life-dot-glow', '.life-gold',
    '.life-end', '.life-year', '.life-age', '.c-kicker', '.c-guess .eq', '.c-tag', '.c-svg .br', '.c-svg .nd', '.c-no', '.c-sub',
    '.d-left .lab', '.strike', '.d-svg .node', '.d-svg .g-glow', '.a-rd', '.a-god', '.pulse', '.wave', '.d-lbl.l-god', '.d-lbl.l-man', '.l-rd span', '.d-cap',
    '.e-latin', '.e-rail .rail', '.stop', '.e-first', '.f-mark', '.f-v .tag', '.f-seam span', '.f-seam i', '.f-src', '.f-svg path',
    '.g-svg .node', '.g-svg .g-glow', '.flow', '.flow-head', '.g-lbl', '.g-cap', '.z-t', '.z-s', '.ch-l', '.ch-r span'], { opacity: 0 });
  gsap.set('.b-title .ch', { opacity: 0 });
  gsap.set('.f-q1', { y: 64, scale: 1.1, transformOrigin: '50% 50%' }); gsap.set('.f-q2', { y: -70, scale: 1.1, transformOrigin: '50% 50%' });
  gsap.set(['.a-halo .ring', '.c-svg .nd', '.d-svg .g-glow', '.g-svg .g-glow'], { transformOrigin: '50% 50%' });

  const ST = window.ST = { pulse: 0, down: 0, up: 0 };   // procedural bits driven by the timeline
  const BG = window.BG;
  const tl = gsap.timeline({ paused: true });

  // ---- helpers ----
  const IN = (t, at, o = {}) => tl.fromTo(t, { opacity: 0, y: o.y ?? 26, scale: o.s ?? 1, filter: `blur(${o.blur ?? 12}px)` },
    { opacity: o.o ?? 1, y: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 1.0, ease: o.ease ?? 'power3.out', stagger: o.st ?? 0, immediateRender: false }, at);
  const OUT = (t, at, o = {}) => tl.to(t, { opacity: 0, y: o.y ?? -22, filter: `blur(${o.blur ?? 10}px)`, duration: o.d ?? 0.7, ease: o.ease ?? 'power2.in', stagger: o.st ?? 0 }, at);
  const DRAW = (t, at, d = 1, o = {}) => { tl.set(t, { opacity: o.o ?? 1 }, at); return tl.fromTo(t, { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: d, ease: o.ease ?? 'power2.inOut', stagger: o.st ?? 0, immediateRender: false }, at); };
  // reveal characters across a spoken span of `dur` seconds
  const type = (sel, at, dur, o = {}) => { const cs = chars(sel); return IN(cs, at, { st: dur / Math.max(1, cs.length), d: o.d ?? 0.8, y: o.y ?? 20, blur: o.blur ?? 12, s: o.s }); };
  const sceneOut = (sel, at, d = 0.8) => tl.to(sel, { autoAlpha: 0, filter: 'blur(14px)', scale: 1.035, duration: d, ease: 'power2.in' }, at);
  const light = (at, v, d = 1.6, ease = 'sine.inOut') => tl.to(BG, { ...v, duration: d, ease }, at);

  // =====================================================================================
  // A · 冷开场
  // =====================================================================================
  const { A1, A2, B1, B2, C1, C2, C3, C4, D1, D2, D3, E1, F1, F2, F3, F4, G1, G2, G3 } = C;
  tl.to('#black', { opacity: 0, duration: 2.0, ease: 'power1.out' }, 0.1);
  light(0.1, { light: 0.26, rays: 0.12 }, 3.5);
  type('.a-l1', A1.start, A1.dur * 0.34, { d: 0.9 });
  type('.a-l2', P(A1, 0.42), A1.dur * 0.5, { d: 0.9 });
  tl.fromTo('.a-lines', { scale: 1 }, { scale: 1.04, duration: A1.dur + 1.4, ease: 'none', immediateRender: false }, A1.start);
  OUT(chars('.a-lines'), A2.start - 0.4, { st: 0.012, d: 0.6, y: -16 });
  type('.a-lead', A2.start + 0.05, A2.dur * 0.5, { d: 0.8, y: 14 });
  const tz = A2.end - 0.62;                                       // 「主」lands on the spoken word
  tl.fromTo('.a-zhu', { opacity: 0, scale: 1.55, filter: 'blur(48px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 2.1, ease: 'expo.out', immediateRender: false }, tz);
  light(tz, { light: 1, rays: 1 }, 2.4, 'power2.out');
  tl.fromTo(BG, { bloom: 0, bx: 960, by: 520 }, { bloom: 0.75, duration: 0.55, ease: 'power2.out', immediateRender: false }, tz);
  tl.to(BG, { bloom: 0.14, duration: 2.4, ease: 'sine.inOut' }, tz + 0.55);
  [['.a-halo .r1', 0.15], ['.a-halo .r2', 0.75]].forEach(([r, d]) => {
    tl.fromTo(r, { scale: 0.8 }, { scale: 2.5, duration: 3.0, ease: 'power2.out', immediateRender: false }, tz + d);
    tl.fromTo(r, { opacity: 0 }, { opacity: 0.6, duration: 0.4, ease: 'power1.out', immediateRender: false }, tz + d);
    tl.to(r, { opacity: 0, duration: 2.5, ease: 'power1.out' }, tz + d + 0.4);
  });
  const tzo = B1.start - 0.95;
  tl.to('.a-zhu', { scale: 1.045, duration: Math.max(0.1, tzo - (tz + 2.1)), ease: 'none' }, tz + 2.1);
  tl.to('.a-zhu', { opacity: 0, scale: 1.3, filter: 'blur(36px)', duration: 1.0, ease: 'power2.in' }, tzo);   // fly into the light
  OUT('.a-lead', tzo, { d: 0.6 });
  tl.set('#sA', { autoAlpha: 0 }, tzo + 1.05);

  // =====================================================================================
  // B · 片名 + 生平线
  // =====================================================================================
  const tb = B1.start - 0.35;
  light(tb, { light: 0.82, rays: 0.8, bloom: 0 }, 2.0);
  tl.fromTo('.b-title .ch', { opacity: 0, y: 70, scale: 1.14, filter: 'blur(28px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', stagger: 0.2, immediateRender: false }, tb);
  tl.fromTo('.b-latin', { opacity: 0, letterSpacing: '1.2em' }, { opacity: 1, letterSpacing: '0.62em', duration: 2.4, ease: 'power3.out', immediateRender: false }, tb + 0.45);
  tl.fromTo('.b-rule i', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, tb + 0.9);
  tl.fromTo('.b-rule b', { opacity: 0, scale: 0, rotation: -135 }, { opacity: 1, scale: 1, rotation: 45, duration: 1.1, ease: 'back.out(2)', immediateRender: false }, tb + 0.9);
  IN('.b-meta', tb + 1.35, { d: 1.1, y: 18 });
  IN('.b-ep', tb + 1.85, { d: 1.1, y: 18 });
  tl.fromTo('.b-sweep', { opacity: 0.85, maskPosition: '100% 0', webkitMaskPosition: '100% 0' }, { maskPosition: '0% 0', webkitMaskPosition: '0% 0', duration: 2.0, ease: 'power2.inOut', immediateRender: false }, tb + 1.5);
  tl.set('.b-sweep', { opacity: 0 }, tb + 3.55);
  tl.fromTo('.b-top', { scale: 1 }, { scale: 1.025, duration: B2.start - tb, ease: 'none', immediateRender: false }, tb);

  const t2 = B2.start - 0.3;
  tl.to('.b-top', { scale: 0.42, y: -262, duration: 1.3, ease: 'power3.inOut' }, t2);
  tl.to(['.b-meta', '.b-ep', '.b-rule', '.b-latin'], { opacity: 0, duration: 0.5, ease: 'power1.in' }, t2);
  tl.to('.b-title .ch', { opacity: 0.55, duration: 1.2 }, t2);
  light(t2, { light: 0.55, rays: 0.5 }, 1.4);
  tl.set(['.life-base', '.tick.t0'], { opacity: 1 }, t2 + 0.55);
  tl.fromTo('.life-base', { attr: { x2: 360 } }, { attr: { x2: 1560 }, duration: 1.3, ease: 'power3.inOut', immediateRender: false }, t2 + 0.55);
  tl.set('.tick.t1', { opacity: 1 }, t2 + 1.8);
  IN('.life-end.e0', t2 + 0.6, { d: 0.8, y: 14 }); IN('.life-end.e1', t2 + 1.7, { d: 0.8, y: 14 });
  const td = t2 + 0.95, dd = 2.2;                                  // dot runs 354 → 397 while the numbers count
  tl.to(['.life-dot', '.life-dot-glow', '.life-gold'], { opacity: 1, duration: 0.3 }, td);
  tl.fromTo(['.life-dot', '.life-dot-glow'], { attr: { cx: 360 } }, { attr: { cx: 1039 }, duration: dd, ease: 'power2.inOut', immediateRender: false }, td);
  tl.fromTo('.life-gold', { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: dd, ease: 'power2.inOut', immediateRender: false }, td);
  IN('.life-year', td, { d: 0.9, y: 30 });
  tl.fromTo('.yr', { textContent: 354 }, { textContent: 397, snap: { textContent: 1 }, duration: dd, ease: 'power2.inOut', immediateRender: false }, td);
  IN('.life-age', td + 0.35, { d: 0.9, y: 20 });
  tl.fromTo('.age', { textContent: 0 }, { textContent: 43, snap: { textContent: 1 }, duration: dd - 0.35, ease: 'power2.inOut', immediateRender: false }, td + 0.35);
  tl.fromTo('.life-dot-glow', { attr: { r: 26 } }, { attr: { r: 70 }, opacity: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, td + dd);
  type('.life-role', P(B2, 0.62), B2.dur * 0.3, { d: 0.8 });
  type('.life-note', P(B2, 0.94), 0.5, { d: 0.8, y: 12 });
  sceneOut('#sB', C1.start - 0.85);

  // =====================================================================================
  // C · confessio 的两层意思
  // =====================================================================================
  const tc = C1.start - 0.15;
  light(tc - 0.5, { light: 0.6, rays: 0.5, fx: 960 }, 1.6);
  IN('.ch-l', tc, { d: 1.2, y: -10, blur: 6 }); IN('.ch-r .r-a', tc + 0.2, { d: 1.2, y: -10, blur: 6 });
  IN('.c-kicker', tc, { d: 0.9, y: 14 });
  tl.fromTo('.c-cn .ch', { opacity: 0, y: 60, scale: 1.12, filter: 'blur(26px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out', stagger: 0.18, immediateRender: false }, P(C1, 0.24));
  tl.fromTo('.c-cn', { scale: 1 }, { scale: 1.03, duration: C1.dur, ease: 'none', immediateRender: false }, P(C1, 0.24));
  IN('.c-guess .eq', P(C1, 0.6), { d: 0.7, y: 12 });
  type('.c-guess .w', P(C1, 0.8), 0.45, { d: 0.9, y: 22 });

  const tla = P(C2, 0.28);                                          // 「这个拉丁词」
  tl.to('.c-cn .ch', { opacity: 0, scale: 0.9, filter: 'blur(24px)', duration: 0.8, ease: 'power2.in', stagger: 0.06 }, tla - 0.55);
  tl.to('.c-guess', { opacity: 0, y: 18, filter: 'blur(8px)', duration: 0.6, ease: 'power2.in' }, tla - 0.55);
  IN('.c-tag', tla, { d: 0.9, y: 12 });
  tl.to('.c-kicker', { opacity: 0, duration: 0.5 }, tla - 0.55);
  tl.fromTo('.c-la .ch', { opacity: 0, y: 44, filter: 'blur(20px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.06, immediateRender: false }, tla);
  const tsp = P(C2, 0.74);                                          // 「有两层意思」
  tl.to('.c-la', { scale: 0.5, y: -160, duration: 1.2, ease: 'power3.inOut' }, tsp);
  tl.to('.c-tag', { y: -86, opacity: 0.7, duration: 1.2, ease: 'power3.inOut' }, tsp);
  DRAW('.c-svg .br', tsp + 0.75, 1.0);
  tl.fromTo('.c-svg .nd', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)', immediateRender: false }, tsp + 1.6);
  IN('.cl .c-no', C3.start - 0.1, { d: 0.6, y: 10 });
  type('.cl .c-main', C3.start + 0.3, C3.dur * 0.6);
  IN('.cl .c-sub', C3.end - 0.1, { d: 0.8, y: 12 });
  IN('.cr .c-no', C4.start - 0.1, { d: 0.6, y: 10 });
  type('.cr .c-main', C4.start + 0.3, C4.dur * 0.38);
  const tpr = P(C4, 0.66);                                          // 「也就是赞美」
  tl.fromTo('.cr .c-sub', { opacity: 0, scale: 1.5, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', immediateRender: false }, tpr);
  light(tpr - 0.6, { fx: 1330, light: 0.85, rays: 0.8 }, 1.8);
  tl.to('.cl', { opacity: 0.5, duration: 1.2 }, tpr);
  sceneOut('#sC', D1.start - 0.85);

  // =====================================================================================
  // D · 整本书是一篇祷告
  // =====================================================================================
  light(D1.start - 0.8, { fx: 1330, light: 0.5, rays: 0.4 }, 1.5);
  DRAW('.d-svg .n-man', D1.start - 0.1, 0.9); IN('.d-lbl.l-man', D1.start + 0.15, { d: 0.8, y: 10 });
  IN('.d-not .lab', P(D1, 0.2), { d: 0.6, y: 10 });
  type('.d-t1', P(D1, 0.27), D1.dur * 0.33);
  DRAW('.d-svg .n-rd', P(D1, 0.4), 0.8); IN('.l-rd .rd-a', P(D1, 0.46), { d: 0.7, y: 8 });
  DRAW('.a-rd', P(D1, 0.5), 0.8);
  type('.d-t1q', P(D1, 0.68), D1.dur * 0.28); IN('.cap-rd', P(D1, 0.72), { d: 0.7, y: 8 });

  tl.set('.strike', { opacity: 1 }, D2.start - 0.3);
  tl.fromTo('.strike', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.inOut', immediateRender: false }, D2.start - 0.3);
  tl.to('.d-not', { opacity: 0.3, duration: 0.8 }, D2.start - 0.1);
  tl.to(['.a-rd', '.cap-rd', '.d-svg .n-rd', '.d-lbl.l-rd'], { opacity: 0.22, duration: 0.8 }, D2.start - 0.1);
  IN('.d-but .lab', D2.start, { d: 0.6, y: 10 });
  type('.d-t2', D2.start + 0.2, D2.dur * 0.62, { d: 0.9 });
  DRAW('.a-god', P(D2, 0.3), 1.2, { ease: 'power3.inOut' });
  tl.fromTo('.d-svg .g-glow', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out', immediateRender: false }, P(D2, 0.5));
  DRAW('.d-svg .n-god', P(D2, 0.5), 1.0);
  tl.fromTo('.d-lbl.l-god', { opacity: 0, scale: 1.4, filter: 'blur(16px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', immediateRender: false }, P(D2, 0.56));
  IN('.cap-god', P(D2, 0.8), { d: 0.8, y: 10 });
  light(P(D2, 0.4), { light: 0.9, rays: 0.85 }, 1.6);
  tl.to(ST, { pulse: 1, duration: 0.8 }, D2.end);

  OUT(['.d-not', '.d-but'], D3.start - 0.4, { d: 0.6, y: -16 });
  type('.d-b1', D3.start, 0.45, { d: 1.0, y: 32, blur: 18 });
  type('.d-b2', D3.start + 0.5, D3.dur * 0.26, { d: 1.0, y: 32, blur: 18 });
  tl.fromTo('.d-big', { scale: 1 }, { scale: 1.035, duration: D3.dur + 1.2, ease: 'none', transformOrigin: '0% 50%', immediateRender: false }, D3.start);
  const tw = P(D3, 0.5);                                            // 「我们是站在旁边听的人」
  tl.to(['.a-rd', '.cap-rd'], { opacity: 0, duration: 0.5 }, tw - 0.35);
  tl.to(['.d-svg .n-rd', '.d-lbl.l-rd'], { opacity: 1, duration: 0.8 }, tw - 0.2);
  tl.to('.rd-a', { opacity: 0, y: -10, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, tw - 0.25);
  IN('.rd-b', tw + 0.15, { d: 0.7, y: 10 });
  DRAW('.wave', tw + 0.2, 0.6, { st: 0.16 });
  IN('.cap-us', P(D3, 0.74), { d: 0.8, y: 8 });
  tl.to(ST, { pulse: 0, duration: 0.6 }, E1.start - 1.0);
  sceneOut('#sD', E1.start - 0.85);

  // =====================================================================================
  // E · 卷一第一章 · 七句
  // =====================================================================================
  light(E1.start - 0.7, { fx: 960, light: 0.62, rays: 0.5 }, 1.5);
  IN('.e-latin', E1.start, { d: 0.9, y: 14 });
  tl.fromTo('.e-title .ch', { opacity: 0, y: 50, filter: 'blur(22px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.07, immediateRender: false }, P(E1, 0.1));
  const ts = P(E1, 0.56);                                           // 「分成七句」
  tl.set('.e-rail .rail', { opacity: 1 }, ts);
  tl.fromTo('.e-rail .rail', { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut', immediateRender: false }, ts);
  tl.fromTo('.stop', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.65, ease: 'back.out(1.7)', stagger: 0.13, immediateRender: false }, ts + 0.1);
  const tf = E1.end + 0.2;
  tl.to('.stop:nth-child(2) b', { backgroundColor: '#f3d594', borderColor: '#fff4d6', scale: 1.9, boxShadow: '0 0 28px 7px rgba(240,196,116,.75)', duration: 0.7, ease: 'back.out(2.2)' }, tf);
  tl.to('.stop:nth-child(2) span', { color: '#f6dba0', scale: 1.25, duration: 0.7, ease: 'power3.out' }, tf);
  IN('.e-first', tf + 0.15, { d: 0.7, y: 10 });
  const tx = F1.start - 0.95;                                       // light blooms out of the first stop
  tl.set(BG, { bx: 490, by: 786 }, tx - 0.02);
  tl.to(BG, { bloom: 1, duration: 0.75, ease: 'power2.in' }, tx);
  tl.to(BG, { bx: 960, by: 500, duration: 1.4, ease: 'power2.inOut' }, tx + 0.2);
  sceneOut('#sE', tx + 0.1, 0.7);
  tl.to(BG, { bloom: 0.14, duration: 1.8, ease: 'power2.out' }, tx + 0.8);

  // =====================================================================================
  // F · 第一句：两句诗篇合成一句
  // =====================================================================================
  light(F1.start - 0.5, { light: 0.78, rays: 0.7 }, 1.6);
  tl.to('.ch-r .r-a', { opacity: 0, y: -8, duration: 0.5 }, F1.start - 0.8); IN('.ch-r .r-b', F1.start - 0.3, { d: 1.0, y: 8, blur: 6 });
  tl.fromTo('.f-mark', { opacity: 0, y: 30, scale: 1.1 }, { opacity: 1, y: 0, scale: 1, duration: 1.8, ease: 'power3.out', immediateRender: false }, F1.start - 0.5);
  const quote = (sel, at, dur) => {                                 // each character arrives lit, then cools to paper white
    const cs = chars(sel), each = dur / cs.length;
    tl.fromTo(cs, { opacity: 0, y: 24, filter: 'blur(16px)', color: '#ffe3a0' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out', stagger: each, immediateRender: false }, at);
    tl.to(cs, { color: '#f6efdf', duration: 1.4, ease: 'sine.inOut', stagger: each }, at + 0.7);
  };
  quote('.f-q1', F1.start, F1.dur * 0.5);
  quote('.f-q2', P(F1, 0.56), F1.dur * 0.4);
  IN('.f-src', P(F1, 0.86), { d: 0.9, y: 10 });

  const tsplit = P(F2, 0.52);                                       // 「是两句诗篇拼起来的」
  OUT('.f-src', tsplit - 0.5, { d: 0.5, y: 8 });
  tl.to(['.f-q1', '.f-q2'], { y: 0, scale: 1, duration: 1.4, ease: 'power3.inOut' }, tsplit);
  tl.to('.f-mark', { opacity: 0, duration: 1.0 }, tsplit);
  tl.set('.f-seam i', { opacity: 1 }, tsplit + 0.7);
  tl.fromTo('.f-seam i', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out', immediateRender: false }, tsplit + 0.7);
  IN('.f-seam span', tsplit + 0.9, { d: 0.9, y: 0, blur: 8 });
  const hl = (pair, k, at) => {                                     // underline both phrases, warm them, join them
    tl.to(pair, { backgroundSize: '100% 2px', duration: 0.7, ease: 'power2.out' }, at);
    tl.to(chars(pair), { color: '#ffdc94', duration: 0.6 }, at);
    DRAW('.f-svg .' + k, at + 0.1, 0.8);
  };
  IN('.f-v1 .tag', F3.start, { d: 0.7, y: -12 });
  type('.f-v1 .vt', P(F3, 0.5), F3.dur * 0.46, { d: 0.9 });
  hl('.f-v1 .p1, .f-q1 .p1', 'k1', F3.end - 0.35);
  hl('.f-v1 .p2, .f-q1 .p2', 'k2', F3.end + 0.15);
  IN('.f-v2 .tag', F4.start + 0.1, { d: 0.7, y: 12 });
  type('.f-v2 .vt', P(F4, 0.33), F4.dur * 0.62, { d: 0.9 });
  hl('.f-v2 .p3, .f-q2 .p3', 'k3', P(F4, 0.66));
  hl('.f-v2 .p4, .f-q2 .p4', 'k4', F4.end - 0.3);
  sceneOut('#sF', G1.start - 0.9);

  // =====================================================================================
  // G · 借来的话
  // =====================================================================================
  light(G1.start - 0.8, { fx: 960, light: 0.7, rays: 0.6 }, 1.5);
  DRAW('.g-svg .n-man', G1.start - 0.2, 0.9); IN('.g-lbl.l-man', G1.start, { d: 0.8, y: 10 });
  tl.fromTo('.g-svg .g-glow', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out', immediateRender: false }, P(G1, 0.08));
  DRAW('.g-svg .n-god', P(G1, 0.08), 1.0);
  tl.fromTo('.g-lbl.l-god', { opacity: 0, scale: 1.4, filter: 'blur(16px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', immediateRender: false }, P(G1, 0.12));
  DRAW('.f-ghost', P(G1, 0.16), 1.3);                               // he reaches up …
  type('.g-m1', P(G1, 0.4), G1.dur * 0.16);
  tl.to('.f-ghost', { strokeDashoffset: 1.01, duration: 1.1, ease: 'power2.inOut' }, P(G1, 0.44));   // … and has no words
  const tgd = P(G1, 0.66);                                          // 「只能借神给的话来说」
  tl.to('.g-m1', { opacity: 0.38, y: -8, duration: 0.6 }, tgd);
  DRAW('.f-down', tgd, 1.3); DRAW('.h-down', tgd + 1.15, 0.3);
  IN('.c-down', tgd + 0.3, { d: 0.8, y: -10 });
  type('.g-m2', tgd + 0.1, G1.dur * 0.24, { d: 0.9 });
  tl.to(ST, { down: 1, duration: 0.8 }, tgd + 1.0);
  const tgu = G1.end + 0.05;
  DRAW('.f-up', tgu, 1.2); DRAW('.h-up', tgu + 1.05, 0.3);
  IN('.c-up', tgu + 0.4, { d: 0.8, y: 10 });
  tl.to(ST, { up: 1, duration: 0.8 }, tgu + 0.9);

  OUT(['.g-m1', '.g-m2'], G2.start - 0.35, { d: 0.5 });
  type('.g-m3>span:nth-child(1)', G2.start + 0.1, G2.dur * 0.42, { d: 0.9 });
  type('.g-m3>span:nth-child(2)', P(G2, 0.56), G2.dur * 0.36, { d: 0.9 });

  const t3 = G3.start - 0.45;
  tl.to('.g-mid', { opacity: 0, filter: 'blur(8px)', duration: 0.6, ease: 'power2.in' }, t3);
  tl.to(['.g-svg', '.g-lbl', '.g-cap'], { opacity: 0.14, filter: 'blur(5px)', duration: 1.0, ease: 'power2.inOut' }, t3);
  type('.g-f1', G3.start, G3.dur * 0.28, { d: 1.0 });
  type('.g-f2', P(G3, 0.36), G3.dur * 0.5, { d: 1.1, y: 30, blur: 18 });
  tl.fromTo('.g-final', { scale: 1 }, { scale: 1.05, duration: G3.dur + 2.6, ease: 'none', immediateRender: false }, G3.start);
  tl.set(BG, { bx: 960, by: 560 }, G3.start);
  tl.to(BG, { bloom: 0.55, light: 1, rays: 1, duration: 2.8, ease: 'sine.inOut' }, P(G3, 0.3));

  // ---- ending ----
  const tend = G3.end + 1.5;
  sceneOut('#sG', tend, 1.1);
  tl.to(['.ch-l', '.ch-r .r-b'], { opacity: 0, duration: 0.8 }, tend);
  tl.to(ST, { down: 0, up: 0, duration: 0.8 }, tend);
  tl.to(BG, { bloom: 0, light: 0.3, rays: 0.2, duration: 2.0, ease: 'sine.inOut' }, tend);
  IN('.z-t', tend + 0.9, { d: 1.1, y: 14 }); IN('.z-s', tend + 1.3, { d: 1.1, y: 14 });
  tl.to('#black', { opacity: 1, duration: 0.9, ease: 'power1.in' }, TLD.total - 1.0);
  tl.set({}, {}, TLD.total);                                        // pin the timeline length

  // ---- subtitles: split long cues at the comma nearest the middle ----
  const subs = [];
  for (const c of TLD.cues) {
    if (['A1', 'A2', 'F1'].includes(c.id)) continue;
    const txt = c.sub;
    if (txt.length <= 24) { subs.push({ s: c.start, e: c.end, t: txt }); continue; }
    let best = -1, bd = 1e9;
    [...txt].forEach((ch, i) => { if ('，；。：、'.includes(ch) && i < txt.length - 2) { const d = Math.abs(i + 1 - txt.length / 2); if (d < bd) { bd = d; best = i; } } });
    if (best < 0) { subs.push({ s: c.start, e: c.end, t: txt }); continue; }
    const mid = c.start + c.dur * ((best + 1) / txt.length);
    subs.push({ s: c.start, e: mid, t: txt.slice(0, best + 1) }, { s: mid, e: c.end, t: txt.slice(best + 1) });
  }
  const subEl = $('#sub span'), prog = $('#prog i');
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function drawSub(t) {
    let cur = null;
    for (const s of subs) if (t >= s.s - 0.12 && t <= s.e + 0.3) cur = s;
    if (!cur) { subEl.style.opacity = 0; return; }
    if (subEl.textContent !== cur.t) subEl.textContent = cur.t.replace(/[，。；：、]$/, '');
    subEl.style.opacity = Math.min(sm((t - (cur.s - 0.12)) / 0.22), sm(((cur.e + 0.3) - t) / 0.22));
  }

  // ---- procedural motion ----
  const pulses = $$('.pulse'), gDown = $('#gDown'), gUp = $('#gUp'), dDown = $$('.d-down circle'), dUp = $$('.d-up circle');
  const lenD = gDown.getTotalLength(), lenU = gUp.getTotalLength();
  function tick(t) {
    pulses.forEach((p, i) => { const ph = (((t - D2.end) / 1.7 + i / 3) % 1 + 1) % 1; p.setAttribute('cy', 672 - 320 * ph); p.style.opacity = Math.sin(Math.PI * ph) * ST.pulse; });
    dDown.forEach((d, i) => { const ph = ((t / 2.6 + i / 4) % 1 + 1) % 1, pt = gDown.getPointAtLength(ph * lenD); d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); d.style.opacity = Math.sin(Math.PI * ph) * ST.down; });
    dUp.forEach((d, i) => { const ph = ((t / 2.6 + i / 4 + 0.5) % 1 + 1) % 1, pt = gUp.getPointAtLength(ph * lenU); d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); d.style.opacity = Math.sin(Math.PI * ph) * ST.up; });
  }

  window.DURATION = TLD.total;
  window.seek = function (t) {
    t = Math.max(0, Math.min(TLD.total, t));
    tl.time(t, false);
    tick(t); drawBg(t); drawGrain(t); drawSub(t);
    prog.style.width = (t / TLD.total * 100).toFixed(3) + '%';
  };
  seek(0);
  window.READY = true;

  // ---- realtime preview with sound: open /web/index.html?play ----
  if (location.search.includes('play')) {
    const a = new Audio('/out/sample_mix.wav'); let started = false;
    addEventListener('click', () => { if (!started) { a.play(); started = true; } else a.paused ? a.play() : a.pause(); });
    (function loop() { if (started) seek(a.currentTime); requestAnimationFrame(loop); })();
  }
})();
