// 本人录制：讲稿以外、自己加的话，用一张“旁白卡”盖在原来的画面上。
// 用法：window.ASIDES = tl => makeAsides(tl, DATA, [ {a, b, k, lines:[{t, at, cls}], cols:[{h, cls, lines:[...]}] } ])
window.makeAsides = function (tl, D, list) {
  const host = document.getElementById('asides'), main = document.getElementById('main');
  const IN = (el, at, o = {}) => tl.fromTo(el, { opacity: 0, y: o.y ?? 26, filter: `blur(${o.blur ?? 12}px)` }, { opacity: o.o ?? 1, y: 0, filter: 'blur(0px)', duration: o.d ?? 0.9, ease: 'power3.out', immediateRender: false }, at);
  const line = l => `<div class="ax-l ${l.cls || ''}">${l.t}</div>`;
  for (const a of list) {
    const sec = document.createElement('section'); sec.className = 'ax ' + (a.cls || '');
    sec.innerHTML = (a.k ? `<div class="ax-k">${a.k}</div>` : '') + (a.lines ? `<div class="ax-body">${a.lines.map(line).join('')}</div>` : '') +
      (a.cols ? `<div class="ax-cols">${a.cols.map(c => `<div class="ax-col ${c.cls || ''}"><div class="ax-h">${c.h}</div>${c.lines.map(line).join('')}</div>`).join('')}</div>` : '') +
      (a.foot ? `<div class="ax-foot">${a.foot.t}</div>` : '');
    host.appendChild(sec);
    tl.set(sec, { autoAlpha: 0 }, 0); tl.set(sec.querySelectorAll('.ax-k,.ax-l,.ax-h,.ax-foot'), { opacity: 0 }, 0);
    tl.to(main, { opacity: 0, filter: 'blur(14px)', duration: 0.6, ease: 'power2.in' }, a.a - 0.45);
    tl.set(main, { visibility: 'hidden' }, a.a + 0.2); tl.set(main, { visibility: 'visible' }, a.b - 0.05);
    tl.to(main, { opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, a.b);
    tl.to(sec, { autoAlpha: 1, duration: 0.2 }, a.a - 0.1);
    const k = sec.querySelector('.ax-k'); if (k) IN(k, a.a, { d: 0.8, y: 12, blur: 6 });
    const all = [...(a.lines || []), ...(a.cols || []).flatMap(c => c.lines)];
    const els = [...sec.querySelectorAll('.ax-l')];
    all.forEach((l, i) => { IN(els[i], l.at - 0.15, { d: 0.8 }); if (l.dim) tl.to(els[i], { opacity: 0.35, duration: 0.6 }, l.dim); });
    sec.querySelectorAll('.ax-h').forEach((h, i) => IN(h, a.cols[i].at - 0.3, { d: 0.7, y: 12, blur: 6 }));
    sec.querySelectorAll('.ax-col').forEach((c, i) => { tl.set(c, { opacity: 0 }, 0); tl.fromTo(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }, a.cols[i].at - 0.5); });
    if (a.foot) IN(sec.querySelector('.ax-foot'), a.foot.at - 0.15, { d: 0.9, y: 16 });
    tl.to(sec, { autoAlpha: 0, filter: 'blur(10px)', duration: 0.5, ease: 'power2.in' }, a.b - 0.45);
  }
};
// 录音里某个词出现的时刻（页面时间）
window.atP = function (D, phrase, nth = 0) {
  const S = D.chars.map(c => c[0]).join(''); let i = -1;
  for (let k = 0; k <= nth; k++) { i = S.indexOf(phrase, i + 1); if (i < 0) throw new Error('录音里找不到：' + phrase); }
  return D.chars[i][1];
};
