// 讲稿页通用搭法：按场景表 window.LEC 生成画面——原文卡（跟着念的声音逐字出现）、要点句、经文卡、示意图、“想一想”、两栏对照。
// 每一场从它的 at 开始，到下一场开始时淡出；场里每一项在它的 at（录音里说到某句话的时刻）出现。
// at 的写法：'某句话'（录音里第一次说到）、['某句话', n]（第 n+1 次说到）、{ p: '某句话', n, d }（再提前 / 推后 d 秒）、数字（秒）。
// 场景表一项：{ at, cls: 'left' | 'right' | 'top', light: {light, rays}, items: [...] }，或 { at, html, run: (ctx) => {} } 自己写。
// xfade: 1 —— 这一场的第一项（一般是示意图）跟上一场同一个位置的东西直接交叉淡化（提前 0.6 秒出来），中间不暗一下。
// 每一项：
//   { q: '“原文……”', k: '卷一 · 第二章 · 第一句', sm: 1 }        原文卡；字跟着录音逐字出
//   { t: '要点句', c: 'big kai gold sm lbl coral dim wrap', at, type: 秒 }   要点句；type：按这么多秒打出来
//   { v: '经文', ref: '路加福音 2:7', at }                        经文卡
//   { fig: '02-1-我原来心里的两张图', at }                         示意图（讲稿/卷一/图/ 里的图，复制到 web/fig/）
//   { think: '问题', at }                                          停下来想一想
//   { cols: [{ b, s, at, c: 'g' | 'c' }, ...] }                    两栏 / 三栏对照，各栏各自出现
//   { tri: [{ b, s, at }, ...] }                                   三格并列（本于他 / 倚靠他 / 归于他）
//   { n: '小注', at }                                              出处小字
//   { anim: 'bottle' | 'building' | 'breaking' | 'jar' | 'gather' | 'cake' | …, at, 各步的时刻…, w: 宽 }   动画插图（anim.js）
//   { rows: [['左', '右', 左的时刻, 右的时刻], ...] }               一行一行的对句（四面受敌 / 却不被困住）
//   fig 还可以加 w（图宽）、spots: [[时刻, 左%, 上%, 宽%, 高%], ...]（一个发光的框，说到哪部分就移到哪部分）
//   { ill: 'pair' | 'row' | 'flow' | 'vs' | 'hero', items: [...], rel, cap }   图解（ill.js：线条图标拼的小图，说到哪个出哪个）
//   { pic: '画名', cap: '小字', at, w, h, fx, fy, z }        一幅画装在画框里（web/img/画名.jpg），慢慢推近；fx/fy 是推向哪里（0–1），z 推多近
//   { pics: [['画名', '小字', 时刻, {fx, fy}], ...], h }     两三幅画并排（对照），各自说到时出来
//   每一项还可以加 flash: 1（光闪一下）、dim: at（到这时变淡，让位给后面的）
window.lecture = async function (o = {}) {
  const K = await kit(); const EP = K.EP, LEC = window.LEC;
  K.secPrefix = o.secPrefix || '';
  const P = (p, n = 0) => atP(EP, p, n);
  const AT = a => typeof a === 'number' ? a : Array.isArray(a) ? P(a[0], a[1]) : a && typeof a === 'object' ? P(a.p, a.n || 0) + (a.d || 0) : P(a);
  const host = document.querySelector('#scenes');
  if (LEC.some(sc => (sc.items || []).some(it => it.ill))) await window.ILL_LOAD();   // 图解要用的图标
  const H = s => String(s);
  // 1) 搭 DOM（先搭好，K.prepare 才会把 .split 拆成逐字、把各项先藏起来）
  const built = LEC.map((sc, i) => {
    const sec = document.createElement('section'); sec.className = 'scene ' + (sc.html ? '' : 'lec ') + (sc.cls || ''); sec.id = 'L' + i;
    if (sc.html) { sec.innerHTML = sc.html; host.appendChild(sec); return { sc, sec, els: [] }; }
    const els = (sc.items || []).map(it => {
      const d = document.createElement('div');
      if (it.q) { d.className = 'lq' + (it.mini ? ' mini' : ''); d.innerHTML = `<div class="lq-k">${H(it.k || '')}</div><div class="lq-t split${it.sm ? ' sm' : ''}${it.xs ? ' xs' : ''}">${H(it.q)}</div>`; }
      else if (it.v) { d.className = 'lv' + (it.sm ? ' sm' : ''); d.innerHTML = `<em>${H(it.ref || '')}</em><span>${H(it.v)}</span>`; }
      else if (it.fig) { d.className = 'lf' + (it.sm ? ' sm' : ''); d.innerHTML = `<img src="fig/${it.fig}.png"${it.w ? ` style="width:${it.w}px"` : ''}>` + (it.spots ? '<i class="lf-spot"></i>' : ''); }
      else if (it.think) { d.className = 'lt'; d.innerHTML = `<b>停下来想一想</b><span>${H(it.think)}</span>`; }
      else if (it.cols) { d.className = 'lc2' + (it.cls ? ' ' + it.cls : ''); d.innerHTML = it.cols.map(c => `<div class="${c.c || ''}"><b>${H(c.b)}</b>${c.s ? `<span>${H(c.s)}</span>` : ''}</div>`).join(''); }
      else if (it.tri) { d.className = 'l3'; d.innerHTML = it.tri.map(c => `<div><b>${H(c.b)}</b><span>${H(c.s || '')}</span></div>`).join(''); }
      else if (it.n) { d.className = 'ln'; d.innerHTML = H(it.n); }
      else if (it.anim) { it._replay = window.ANIM_BUILD(it.anim, d, it, AT); if (it.w) d.style.setProperty('--aw', it.w + 'px'); }   // 动画插图（anim.js）：先画好，动画等时间轴建好再挂
      else if (it.ill) { it._replay = window.ILL_BUILD(it, d, AT); }   // 图解（ill.js）
      else if (it.pic) { d.className = 'lp'; d.style.setProperty('--pw', (it.w || 980) + 'px'); d.style.setProperty('--ph', (it.h || 520) + 'px'); d.innerHTML = `<div class="lp-f"><img src="img/${it.pic}.jpg" style="object-position:${(it.fx ?? 0.5) * 100}% ${(it.fy ?? 0.5) * 100}%"></div>` + (it.cap ? `<div class="lp-c">${H(it.cap)}</div>` : ''); }
      else if (it.pics) { d.className = 'lps'; d.style.setProperty('--ph', (it.h || 420) + 'px'); if (it.w) d.style.setProperty('--pw', it.w + 'px'); d.innerHTML = it.pics.map(p => `<div class="lp"><div class="lp-f"><img src="img/${p[0]}.jpg" style="object-position:${((p[3] || {}).fx ?? 0.5) * 100}% ${((p[3] || {}).fy ?? 0.5) * 100}%"></div>${p[1] ? `<div class="lp-c">${H(p[1])}</div>` : ''}</div>`).join(''); }
      else if (it.rows) { d.className = 'lr'; d.innerHTML = it.rows.map(r => `<div><i>${H(r[0])}</i><b>${H(r[1])}</b></div>`).join(''); }
      else { d.className = 'll ' + (it.c || '') + (it.type || /big|h2/.test(it.c || '') ? ' split' : ''); d.innerHTML = H(it.t); }
      sec.appendChild(d); return d;
    });
    host.appendChild(sec); return { sc, sec, els };
  });
  await K.prepare(o.hide || '');
  const { tl, IN, type, big, light, flash, scene, chars } = K;
  // 原文卡：念到哪个字出哪个字（引文和这段录音按字对齐，最长公共子序列；对不上的字按前后插值）
  const isH = ch => /[一-鿿0-9]/.test(ch);
  const speakTimes = (list, t1, t2) => {
    const Kk = []; EP.chars.forEach((c, k) => { if (c[1] >= t1 && c[1] <= t2) Kk.push(k); });
    const q = list.map((ch, i) => [ch, i]).filter(([ch]) => isH(ch)), n = q.length, m = Kk.length;
    if (!n || !m) return null;
    const L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = q[i][0] === EP.chars[Kk[j]][0] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const t = list.map(() => null);
    for (let i = 0, j = 0; i < n && j < m;) { if (q[i][0] === EP.chars[Kk[j]][0]) { t[q[i][1]] = EP.chars[Kk[j]][1]; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    const got = t.map((x, i) => x === null ? -1 : i).filter(i => i >= 0);
    if (got.length < 0.5 * n) return null;
    return t.map((x, i) => { if (x !== null) return x; const p = got.filter(k => k < i).pop(), nx = got.find(k => k > i);
      return p === undefined ? t[nx] - (nx - i) * 0.2 : nx === undefined ? t[p] + (i - p) * 0.2 : t[p] + (t[nx] - t[p]) * (i - p) / (nx - p); });
  };
  // 2) 时间轴
  const starts = built.map(b => AT(b.sc.at));
  for (let i = 1; i < starts.length; i++) if (!(starts[i] > starts[i - 1] + 0.5)) throw new Error(`第 ${i} 场的开始时刻（${starts[i]}）不在上一场（${starts[i - 1]}）之后：` + JSON.stringify(built[i].sc.at));
  const END = EP.total - 6.6;
  window.LEC_TIMES = starts.map((t, i) => [t, i + 1 < starts.length ? starts[i + 1] : END]);   // 每一场的起止（检查截图用）
  built.forEach((b, i) => {
    const a = starts[i] - 0.1, e = i + 1 < built.length ? starts[i + 1] - 0.1 : END;
    scene(b.sec, a, e);
    if (b.sc.xfade) tl.set(b.sec, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 }, a - 0.62);
    if (b.sc.light) light(a, b.sc.light, 1.6);
    if (b.sc.run) b.sc.run({ K, P, AT, a, e, sec: b.sec, $: s => b.sec.querySelector(s), $$: s => [...b.sec.querySelectorAll(s)] });
    (b.sc.items || []).forEach((it, k) => {
      const el = b.els[k], xf = b.sc.xfade && k === 0, at = xf ? a - 0.6 : it.at !== undefined ? AT(it.at) : a + 0.15;
      if (!xf && (at < a - 0.01 || at > e)) throw new Error(`第 ${i} 场第 ${k} 项的时刻 ${at.toFixed(2)} 不在这一场里（${a.toFixed(2)}–${e.toFixed(2)}）：` + JSON.stringify(it).slice(0, 80));
      if (it.q) {
        IN(el, Math.max(a + 0.05, at - 0.6), { y: 40, d: 0.9, blur: 8 });
        const cs = chars(el.querySelector('.lq-t')), ts = speakTimes(cs.map(c => c.textContent), at - 1.0, e);
        if (ts) cs.forEach((c, j) => IN(c, Math.max(at - 0.3, ts[j] - 0.05), { d: 0.45, y: 8, blur: 6 }));
        else type(el.querySelector('.lq-t'), at, Math.max(1.5, (e - at) * 0.7), { d: 0.5, y: 8, blur: 6 });
        (it.hl || []).forEach(([sel, t2, col]) => tl.to(chars(el.querySelector('.lq-t ' + sel)), { color: col || '#b8321c', duration: 0.5, stagger: 0.02 }, AT(t2)));
      } else if (it.cols || it.tri) {
        // 每栏的标题在 at 出来；下面的小字可以另给时刻 sat（说到时再出来），不给就跟标题一起
        const parts = [...el.children], spec = it.cols || it.tri;
        parts.forEach((p, j) => {
          const t0 = spec[j].at !== undefined ? AT(spec[j].at) : at + j * 0.4, b = p.querySelector('b'), sp = p.querySelector('span');
          if (spec[j].sat !== undefined && sp) { IN(b, t0, { y: 24, d: 0.8 }); IN(sp, AT(spec[j].sat), { y: 14, d: 0.7 }); }
          else IN(p, t0, { y: 24, d: 0.8 });
        });
      } else if (it.anim || it.ill) {
        IN(el, Math.max(a + 0.05, at - 0.3), { y: 20, d: 0.8, blur: 6 }); it._replay(tl);
      } else if (it.rows) {
        [...el.children].forEach((r, j) => { IN(r.querySelector('i'), AT(it.rows[j][2]), { y: 16, d: 0.7 }); IN(r.querySelector('b'), AT(it.rows[j][3]), { y: 16, d: 0.7, blur: 6 }); });
      } else if (it.pic) {
        IN(el, at, { y: 26, s: 0.97, d: 1.1, blur: 8 });
        tl.fromTo(el.querySelector('img'), { scale: 1.0 }, { scale: it.z || 1.12, duration: Math.max(1, e - at), ease: 'none', immediateRender: false }, at);
        if (it.cap) IN(el.querySelector('.lp-c'), at + 0.5, { y: 12, d: 0.8 });
      } else if (it.pics) {
        [...el.children].forEach((p, j) => { const t0 = AT(it.pics[j][2]); IN(p, t0, { y: 26, d: 1.0, blur: 8 }); tl.fromTo(p.querySelector('img'), { scale: 1.0 }, { scale: 1.1, duration: Math.max(1, e - t0), ease: 'none', immediateRender: false }, t0); });
      } else if (it.fig) {
        if (xf) IN(el, at, { y: 0, d: 0.6, blur: 0, ease: 'sine.inOut' }); else IN(el, at, { y: 30, s: 0.97, d: 1.2, blur: 10 });
        if (it.spots) {                                                  // 发光的框：第一处淡入，之后平移到下一处
          const sp = el.querySelector('.lf-spot'), box = r => ({ left: r[1] + '%', top: r[2] + '%', width: r[3] + '%', height: r[4] + '%' });
          gsap.set(sp, { ...box(it.spots[0]), opacity: 0 });
          it.spots.forEach((r, j) => { const t = AT(r[0]); if (j) tl.to(sp, { ...box(r), duration: 0.9, ease: 'power2.inOut' }, t - 0.2); else tl.to(sp, { opacity: 1, duration: 0.7 }, Math.max(t, at + 0.8)); });
        }
        tl.fromTo(el.querySelector('img'), { scale: 1.0 }, { scale: 1.045, duration: Math.max(1, e - at), ease: 'none', immediateRender: false }, at);
      } else if (it.type) type(el, at, it.type, { d: 0.6 });
      else if (/big|h2/.test(it.c || '')) big(el, at, { st: Math.min(0.12, 1.2 / Math.max(1, chars(el).length)) });
      else IN(el, at, { y: it.v ? 30 : 22, d: it.v || it.think ? 1.0 : 0.8 });
      if (it.flash) flash(at + 0.2, 960, 540, 0.45);
      if (it.dim !== undefined) tl.to(el, { opacity: 0.32, duration: 0.6 }, AT(it.dim));
      if (it.strike !== undefined) tl.fromTo(el, { '--sx': 0 }, { '--sx': 1, duration: 0.45, ease: 'power2.inOut', immediateRender: false }, AT(it.strike));
    });
  });
  return { K, P, AT, END };
};
