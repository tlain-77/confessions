// 本人录制：讲稿以外、自己加的话，用一张“旁白卡”盖在原来的画面上；也可以带一幅画。
// 用法：window.ASIDES = tl => makeAsides(tl, DATA, [ {a, b, k, lines:[{t, at, cls}], cols:[...], foot, img:{src, fit, side, kb, cap, pos}, html, fx(tl, sec)} ])
//   img.fit = 'cover'：整幅画铺满，慢推镜头，文字放在 side 一侧（'l' / 'r' / 'c'）
//   img.fit = 'frame'：画装在金框里，放在 side 一侧，文字在另一侧
// makeBackdrops(tl, [{a, b, src, o, pos, kb}])：画淡淡地衬在原画面后面，不挡原来的动画
(function () {
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // 金色浮尘：在 [a, b] 之间慢慢升起、明灭
  const dust = (tl, host, a, b, seed, n = 26, box = [0, 0, 1920, 1080]) => {
    const R = rng(Math.round(seed * 1000) + 7), wrap = document.createElement('div'); wrap.className = 'ax-dust'; host.appendChild(wrap);
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i'), s = 2 + R() * 5; d.style.cssText = `left:${box[0] + R() * box[2]}px;top:${box[1] + R() * box[3]}px;width:${s}px;height:${s}px`; wrap.appendChild(d);
      const t0 = a + R() * Math.max(0.5, (b - a) * 0.5), life = Math.min(b - t0, 3 + R() * 5);
      tl.set(d, { opacity: 0 }, 0);
      tl.fromTo(d, { x: 0, y: 0 }, { x: (R() - 0.5) * 80, y: -(60 + R() * 160), duration: life, ease: 'none', immediateRender: false }, t0);
      tl.fromTo(d, { opacity: 0 }, { opacity: 0.25 + R() * 0.65, duration: life * 0.3, ease: 'sine.out', immediateRender: false }, t0);
      tl.to(d, { opacity: 0, duration: life * 0.6, ease: 'sine.in' }, t0 + life * 0.4);
    }
  };
  // 一道斜光扫过
  const sweep = (tl, host, at, d = 2.6, o = 0.5) => {
    const r = document.createElement('div'); r.className = 'ax-ray'; host.appendChild(r);
    tl.set(r, { opacity: 0 }, 0); tl.fromTo(r, { xPercent: -120 }, { xPercent: 120, duration: d, ease: 'none', immediateRender: false }, at);
    tl.fromTo(r, { opacity: 0 }, { opacity: o, duration: d * 0.3, immediateRender: false }, at); tl.to(r, { opacity: 0, duration: d * 0.3 }, at + d * 0.7);
  };
  const kenburns = (tl, el, a, b, kb = [1.12, -2, -1, 1.0, 2, 1]) =>
    tl.fromTo(el, { scale: kb[0], xPercent: kb[1], yPercent: kb[2] }, { scale: kb[3], xPercent: kb[4], yPercent: kb[5], duration: b - a + 1.2, ease: 'none', immediateRender: false }, a - 0.6);

  window.makeAsides = function (tl, D, list) {
    const host = document.getElementById('asides'), main = document.getElementById('main');
    const IN = (el, at, o = {}) => tl.fromTo(el, { opacity: 0, y: o.y ?? 26, filter: `blur(${o.blur ?? 12}px)` }, { opacity: o.o ?? 1, y: 0, filter: 'blur(0px)', duration: o.d ?? 0.9, ease: 'power3.out', immediateRender: false }, at);
    const line = l => `<div class="ax-l ${l.cls || ''}">${l.t}</div>`;
    // 原画面每次换场的时刻（scene()/show() 都是 tl.set(场景, {autoAlpha: 1})）
    const sw = tl.getChildren(true, true, false).filter(tw => tw.duration() === 0 && tw.vars.autoAlpha === 1 && tw.targets().some(e => e.classList && e.classList.contains('scene'))).map(tw => tw.startTime());
    for (const a of list) {
      // 卡片收起时，如果原画面马上（或刚刚）换场，就等新场景已经换上再把原画面放出来，免得旧场景闪一下
      const late = sw.filter(t => t > a.b - 0.35 && t < a.b + 1.0); const B = late.length ? Math.max(...late) + 0.12 : a.b;
      // 卡片出现前，如果原画面刚好换场，就在换场之前先把原画面收起来，免得新场景露一下头
      const early = sw.filter(t => t > a.a - 0.9 && t < a.a + 0.2); const A0 = early.length ? Math.min(a.a - 0.45, Math.min(...early) - 0.62) : a.a - 0.45;
      const sec = document.createElement('section'); sec.className = 'ax ' + (a.cls || '') + (a.img ? ` has-img fit-${a.img.fit || 'cover'} side-${a.img.side || 'l'}` : '');
      const im = a.img;
      sec.innerHTML = (im && im.fit !== 'frame' ? `<div class="ax-pic"><img src="img/${im.src}.jpg" style="object-position:${im.pos || '50% 50%'}"></div><div class="ax-shade"></div>` : '') +
        (im && im.fit === 'frame' ? `<div class="ax-frame"><div class="ax-fi"><img src="img/${im.src}.jpg" style="object-position:${im.pos || '50% 50%'}"></div><div class="ax-sheen"></div></div>` : '') +
        (im && im.cap ? `<div class="ax-cap">${im.cap}</div>` : '') +
        (a.k ? `<div class="ax-k">${a.k}</div>` : '') + (a.lines ? `<div class="ax-body">${a.lines.map(line).join('')}</div>` : '') +
        (a.cols ? `<div class="ax-cols">${a.cols.map(c => `<div class="ax-col ${c.cls || ''}"><div class="ax-h">${c.h}</div>${c.lines.map(line).join('')}</div>`).join('')}</div>` : '') +
        (a.html || '') + (a.foot ? `<div class="ax-foot">${a.foot.t}</div>` : '');
      host.appendChild(sec);
      if (im && im.fit === 'frame') {                                  // 金框的位置、文字栏、画名
        const [w, h] = im.box || [600, 760], top = im.top ?? Math.round((1080 - h) / 2) - 40, R = im.side === 'r';
        sec.querySelector('.ax-frame').style.cssText = `width:${w}px;height:${h}px;top:${top}px;` + (R ? 'right:150px' : 'left:150px');
        const tw = 1920 - 150 - w - 110 - 130, tx = R ? 130 : 150 + w + 110;
        sec.querySelectorAll('.ax-k,.ax-body,.ax-foot').forEach(e => { e.style.left = tx + 'px'; e.style.right = 'auto'; e.style.width = tw + 'px'; e.style.textAlign = 'left'; e.style.paddingLeft = '0'; });
        const cap = sec.querySelector('.ax-cap'); if (cap) cap.style.cssText = `top:${top + h + 26}px;` + (R ? 'right:150px;text-align:right' : 'left:150px;text-align:left;right:auto');
      }
      tl.set(sec, { autoAlpha: 0 }, 0); tl.set(sec.querySelectorAll('.ax-k,.ax-l,.ax-h,.ax-foot,.ax-cap'), { opacity: 0 }, 0);
      tl.to(main, { opacity: 0, filter: 'blur(14px)', duration: 0.6, ease: 'power2.in' }, A0);
      tl.set(main, { visibility: 'hidden' }, Math.max(A0 + 0.62, a.a + 0.2)); tl.set(main, { visibility: 'visible' }, B - 0.05);
      tl.to(main, { opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, B);
      tl.to(sec, { autoAlpha: 1, duration: 0.2 }, a.a - 0.1);
      if (im && im.fit !== 'frame') {
        const pic = sec.querySelector('.ax-pic'), img = pic.querySelector('img');
        tl.fromTo(pic, { opacity: 0, filter: 'blur(18px) brightness(.4)' }, { opacity: 1, filter: 'blur(0px) brightness(1)', duration: 1.4, ease: 'power2.out', immediateRender: false }, a.a - 0.3);
        kenburns(tl, img, a.a, a.b, im.kb); sweep(tl, sec, a.a + 0.5, 3.2, 0.32);
        if (im.cap) IN(sec.querySelector('.ax-cap'), a.a + 1.0, { d: 1.0, y: 8, blur: 4, o: 0.85 });
      }
      if (im && im.fit === 'frame') {
        const fr = sec.querySelector('.ax-frame'), img = fr.querySelector('img'), sh = fr.querySelector('.ax-sheen');
        tl.fromTo(fr, { opacity: 0, y: 50, rotationY: im.side === 'r' ? -18 : 18, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, y: 0, rotationY: 0, scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power3.out', immediateRender: false }, a.a - 0.2);
        kenburns(tl, img, a.a, a.b, im.kb || [1.08, 0, 1, 1.0, 0, -1]);
        tl.set(sh, { xPercent: -95 }, 0); tl.fromTo(sh, { xPercent: -95 }, { xPercent: 95, duration: 3.4, ease: 'sine.inOut', immediateRender: false }, a.a + 1.0);   // 反光一开始就放在框外，不会先在画中间停一道
        if (im.cap) IN(sec.querySelector('.ax-cap'), a.a + 1.0, { d: 1.0, y: 8, blur: 4, o: 0.85 });
      }
      if (a.dust !== false) dust(tl, sec, a.a, a.b, a.a, im ? 30 : 22);
      const k = sec.querySelector('.ax-k'); if (k) IN(k, a.kAt ?? a.a, { d: 0.8, y: 12, blur: 6 });
      const all = [...(a.lines || []), ...(a.cols || []).flatMap(c => c.lines)];
      const els = [...sec.querySelectorAll('.ax-l')];
      all.forEach((l, i) => { IN(els[i], l.at - 0.15, { d: 0.8 }); if (l.dim) tl.to(els[i], { opacity: 0.35, duration: 0.6 }, l.dim); });
      sec.querySelectorAll('.ax-h').forEach((h, i) => IN(h, a.cols[i].at - 0.3, { d: 0.7, y: 12, blur: 6 }));
      sec.querySelectorAll('.ax-col').forEach((c, i) => { tl.set(c, { opacity: 0 }, 0); tl.fromTo(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }, a.cols[i].at - 0.5); });
      if (a.foot) IN(sec.querySelector('.ax-foot'), a.foot.at - 0.15, { d: 0.9, y: 16 });
      if (a.fx) a.fx(tl, sec, { IN, dust, sweep, kenburns });
      tl.to(sec, { autoAlpha: 0, filter: 'blur(10px)', duration: 0.5, ease: 'power2.in' }, B - 0.45);
    }
  };

  // 整屏光效：一道光扫过 + 一阵金尘，不挡原来的画面。list: [{at, d, o, dust}]
  window.makeFx = function (tl, list) {
    const host = document.getElementById('asides');
    for (const f of list) { sweep(tl, host, f.at, f.d ?? 2.8, f.o ?? 0.45); if (f.dust !== false) dust(tl, host, f.at, f.at + (f.len ?? 6), f.at, f.n ?? 34, f.box); }
  };
  window.makeBackdrops = function (tl, list) {
    let host = document.getElementById('backdrops');
    if (!host) { host = document.createElement('div'); host.id = 'backdrops'; const m = document.getElementById('main'); m.parentNode.insertBefore(host, m); }
    for (const b of list) {
      const el = document.createElement('div'); el.className = 'bd ' + (b.cls || '');
      el.innerHTML = `<img src="img/${b.src}.jpg" style="object-position:${b.pos || '50% 50%'}">` + (b.cap ? `<div class="ax-cap">${b.cap}</div>` : '');
      host.appendChild(el);
      tl.set(el, { autoAlpha: 0 }, 0);
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: b.o ?? 0.3, duration: 1.6, ease: 'power2.out', immediateRender: false }, b.a);
      kenburns(tl, el.querySelector('img'), b.a, b.b, b.kb || [1.06, -1.5, 0, 1.0, 1.5, 0]);
      if (b.cap) { const c = el.querySelector('.ax-cap'); tl.set(c, { opacity: 0 }, 0); tl.to(c, { opacity: 1, duration: 1 }, b.a + 1.2); }
      tl.to(el, { autoAlpha: 0, duration: 1.2, ease: 'power2.in' }, b.b - 1.0);
    }
  };
})();
// 防“闪”：有的元素没被预先藏起来，场景一亮它就露出来（字比声音先出现），
// 等到它自己的淡入动画开始时又被打回 0 再淡入——画面就闪一下。
// 这里统一处理：凡是第一次动透明度就是“从 0 淡入”的元素，从一开始就藏好。
window.fixEarly = function (tl) {
  const first = new Map();
  const abs = tw => { let t = tw.startTime(), p = tw.parent; while (p && p !== tl) { t = p.startTime() + t; p = p.parent; } return t; };
  for (const tw of tl.getChildren(true, true, false)) {
    const v = tw.vars || {}, s = v.startAt || {}, st = abs(tw);
    const fadeIn = s.opacity === 0 || s.autoAlpha === 0 || (v.runBackwards && (v.opacity === 0 || v.autoAlpha === 0));
    if (!fadeIn && !('opacity' in v) && !('autoAlpha' in v) && !('opacity' in s) && !('autoAlpha' in s)) continue;
    for (const el of tw.targets()) {
      if (!(el instanceof Element)) continue;
      const f = first.get(el);
      if (!f || st < f.t - 1e-6) first.set(el, { t: st, fadeIn, auto: 'autoAlpha' in s });
    }
  }
  let n = 0;
  for (const [el, f] of first) if (f.fadeIn && f.t > 0.05 && +gsap.getProperty(el, 'opacity') > 0) { tl.set(el, f.auto ? { autoAlpha: 0 } : { opacity: 0 }, 0); n++; }
  window.FIXED_EARLY = n;
};
// 防“闪一帧”：某个元素正在淡入/淡出的半路上，又有一个瞬时的 set 把它的透明度直接设成别的值
// （多半是“把上层容器先显示出来”的那种 set），那一帧它会整个跳一下，下一帧淡入淡出动画又把它拉回去。
// 淡入淡出动画本来就会每帧覆盖这个值，所以这种 set 只会造成那一帧的跳动——删掉它，别的帧完全不变。
window.fixClash = function (tl) {
  const kids = tl.getChildren(true, true, false);
  const abs = tw => { let t = tw.startTime(), p = tw.parent; while (p && p !== tl) { t = p.startTime() + t; p = p.parent; } return t; };
  const META = new Set(['duration', 'delay', 'overwrite', 'ease', 'repeat', 'immediateRender', 'lazy', 'data', 'id', 'callbackScope', 'parent']);
  const runs = new Map();                     // 元素 → 它身上有时长的透明度动画 [{a, b, auto, from}]（错开出场的不算，每个元素的时间段不一样）
  for (const tw of kids) {
    const d = tw.duration(), v = tw.vars || {};
    if (!(d > 0) || v.stagger || !('opacity' in v || 'autoAlpha' in v)) continue;
    const a = abs(tw), r = { a, b: a + d, auto: 'autoAlpha' in v, from: !!v.startAt };
    for (const el of tw.targets()) if (el instanceof Element) { if (!runs.has(el)) runs.set(el, []); runs.get(el).push(r); }
  }
  let n = 0;
  for (const tw of kids) {
    if (tw.duration() !== 0) continue;
    const v = tw.vars || {}, keys = Object.keys(v).filter(k => !META.has(k));
    if (!keys.length || !keys.every(k => k === 'opacity' || k === 'autoAlpha')) continue;
    const t = abs(tw), needAuto = keys.includes('autoAlpha'); if (t < 0.01) continue;
    const els = tw.targets().filter(e => e instanceof Element);
    const covered = el => (runs.get(el) || []).some(r => (needAuto ? r.auto : true) && t < r.b - 1e-4 && (r.a < t - 1e-4 || (r.from && r.a <= t + 1e-4)));
    if (els.length && els.length === tw.targets().length && els.every(covered)) { tw.kill(); n++; }
  }
  window.FIXED_CLASH = n;
};
// 让画面上的某段字在“说到这句话”的时候才出现：把它原来的淡入挪到这个时刻；
// 它要是没有自己的淡入（是跟着外框一起出来的），就给它单独加一个淡入。
// list: [{ sel 或 txt, p（录音里的词）, nth, at（直接给时刻）, d（提前量，默认 -0.15） }]
window.syncText = function (tl, D, list) {
  const fadeIn = tw => { const st = tw.vars.startAt || {}; return st.opacity === 0 || st.autoAlpha === 0; };
  const find = s => {
    if (s.sel) return [...document.querySelectorAll(s.sel)];
    const key = s.txt.replace(/\s/g, '');
    const all = [...document.querySelectorAll('#stage *')].filter(e => !e.closest('#chrome') && !e.closest('#sub') && e.textContent.replace(/\s/g, '').startsWith(key));
    return all.filter(e => ![...e.children].some(c => all.includes(c))).slice(0, 1);
  };
  for (const s of list) {
    const els = find(s); if (!els.length) throw new Error('syncText 找不到：' + (s.sel || s.txt));
    const at = (s.at ?? atP(D, s.p, s.nth || 0)) + (s.d ?? -0.15);
    for (const el of els) {
      let tws = tl.getTweensOf(el).filter(fadeIn);
      if (!tws.length) { const chs = [...el.querySelectorAll('.ch')]; if (chs.length) tws = tl.getTweensOf(chs).filter(fadeIn); }
      if (tws.length) {
        const t0 = Math.min(...tws.map(tw => tw.startTime()));
        if (at > t0) tws.filter(tw => tw.startTime() < t0 + 0.4).forEach(tw => tw.startTime(tw.startTime() + at - t0));
      } else {
        tl.set(el, { opacity: 0 }, 0);
        tl.fromTo(el, { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', immediateRender: false }, at);
      }
    }
  }
};
// 字幕：一句接一句说的时候，直接换字，不闪；只有真正停顿（≥0.6 秒）时才淡出、淡入。字幕不早于开口。
window.makeSubDrawer = function (subs, el) {
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const L = subs.map(s => ({ t: s.t, a: s.s - 0.05, z: s.e + 0.3 })).sort((p, q) => p.a - q.a);
  for (let i = 0; i + 1 < L.length; i++) if (L[i + 1].a - L[i].z < 0.6) { L[i].z = L[i + 1].a; L[i].join = true; L[i + 1].joined = true; }
  return t => {
    let cur = null;
    for (const s of L) { if (s.a > t) break; if (t < s.z) cur = s; }
    if (!cur) { el.style.opacity = 0; return; }
    if (el.textContent !== cur.t) el.textContent = cur.t;
    el.style.opacity = Math.min(cur.joined ? 1 : sm((t - cur.a) / 0.15), cur.join ? 1 : sm((cur.z - t) / 0.22));
  };
};
// 录音里某个词出现的时刻（页面时间）
window.atP = function (D, phrase, nth = 0) {
  const S = D.chars.map(c => c[0]).join(''); let i = -1;
  for (let k = 0; k <= nth; k++) { i = S.indexOf(phrase, i + 1); if (i < 0) throw new Error('录音里找不到：' + phrase); }
  return D.chars[i][1];
};
