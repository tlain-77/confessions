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
    for (const a of list) {
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
      tl.to(main, { opacity: 0, filter: 'blur(14px)', duration: 0.6, ease: 'power2.in' }, a.a - 0.45);
      tl.set(main, { visibility: 'hidden' }, a.a + 0.2); tl.set(main, { visibility: 'visible' }, a.b - 0.05);
      tl.to(main, { opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, a.b);
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
        tl.fromTo(sh, { xPercent: -160 }, { xPercent: 160, duration: 1.6, ease: 'power1.inOut', immediateRender: false }, a.a + 1.0);
        if (im.cap) IN(sec.querySelector('.ax-cap'), a.a + 1.0, { d: 1.0, y: 8, blur: 4, o: 0.85 });
      }
      if (a.dust !== false) dust(tl, sec, a.a, a.b, a.a, im ? 30 : 22);
      const k = sec.querySelector('.ax-k'); if (k) IN(k, a.a, { d: 0.8, y: 12, blur: 6 });
      const all = [...(a.lines || []), ...(a.cols || []).flatMap(c => c.lines)];
      const els = [...sec.querySelectorAll('.ax-l')];
      all.forEach((l, i) => { IN(els[i], l.at - 0.15, { d: 0.8 }); if (l.dim) tl.to(els[i], { opacity: 0.35, duration: 0.6 }, l.dim); });
      sec.querySelectorAll('.ax-h').forEach((h, i) => IN(h, a.cols[i].at - 0.3, { d: 0.7, y: 12, blur: 6 }));
      sec.querySelectorAll('.ax-col').forEach((c, i) => { tl.set(c, { opacity: 0 }, 0); tl.fromTo(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }, a.cols[i].at - 0.5); });
      if (a.foot) IN(sec.querySelector('.ax-foot'), a.foot.at - 0.15, { d: 0.9, y: 16 });
      if (a.fx) a.fx(tl, sec, { IN, dust, sweep, kenburns });
      tl.to(sec, { autoAlpha: 0, filter: 'blur(10px)', duration: 0.5, ease: 'power2.in' }, a.b - 0.45);
    }
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
// 录音里某个词出现的时刻（页面时间）
window.atP = function (D, phrase, nth = 0) {
  const S = D.chars.map(c => c[0]).join(''); let i = -1;
  for (let k = 0; k <= nth; k++) { i = S.indexOf(phrase, i + 1); if (i < 0) throw new Error('录音里找不到：' + phrase); }
  return D.chars[i][1];
};
