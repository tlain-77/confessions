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
  if (LEC.some(sc => (sc.items || []).some(it => it.ill || it.anim))) await window.ILL_LOAD();   // 图解、动画要用的图标
  const H = s => String(s);
  const artHost = document.createElement('div'); artHost.id = 'artbg'; host.parentNode.insertBefore(artHost, host);   // 名画垫在所有场景后面的一层（art.js）
  let lastArt = null;
  // 1) 搭 DOM（先搭好，K.prepare 才会把 .split 拆成逐字、把各项先藏起来）
  const built = LEC.map((sc, i) => {
    const sec = document.createElement('section'); sec.className = 'scene ' + (sc.html ? '' : 'lec ') + (sc.cls || ''); sec.id = 'L' + i;
    if (sc.html) { sec.innerHTML = sc.html; host.appendChild(sec); return { sc, sec, els: [] }; }
    const els = (sc.items || []).map(it => {
      const d = document.createElement('div');
      if (it.q) { d.className = 'lq' + (it.mini ? ' mini' : '') + (it.ms ? ' ms' : ''); d.innerHTML = `<div class="lq-k">${H(it.k || '')}</div><div class="lq-t split${it.sm ? ' sm' : ''}${it.xs ? ' xs' : ''}">${H(it.q)}</div>`; }
      else if (it.v) { d.className = 'lv' + (it.sm ? ' sm' : ''); d.innerHTML = `<em>${H(it.ref || '')}</em><span>${H(it.v)}</span>`; }
      else if (it.fig) { d.className = 'lf' + (it.sm ? ' sm' : ''); d.innerHTML = `<img src="fig/${it.fig}.png"${it.w ? ` style="width:${it.w}px"` : ''}>` + (it.spots ? '<i class="lf-spot"></i>' : ''); }
      else if (it.think) { d.className = 'lt'; d.innerHTML = `<b>停下来想一想</b><span>${H(it.think)}</span>`; }
      else if (it.cols) { d.className = 'lc2' + (it.cls ? ' ' + it.cls : ''); d.innerHTML = it.cols.map(c => `<div class="${c.c || ''}"><b>${H(c.b)}</b>${c.s ? `<span>${H(c.s)}</span>` : ''}</div>`).join(''); }
      else if (it.tri) { d.className = 'l3'; d.innerHTML = it.tri.map(c => `<div><b>${H(c.b)}</b><span>${H(c.s || '')}</span></div>`).join(''); }
      else if (it.n) { d.className = 'ln'; d.innerHTML = H(it.n); }
      else if (it.anim) { it._replay = window.ANIM_BUILD(it.anim, d, it, AT); if (it.w) d.style.setProperty('--aw', it.w + 'px'); }   // 动画插图（anim.js）：先画好，动画等时间轴建好再挂
      else if (it.ill) { it._replay = window.ILL_BUILD(it, d, AT); }   // 图解（ill.js）
      else if (it.art) { d.className = 'art-ph'; it._art = it.cont && lastArt && lastArt.it.art === it.art ? lastArt : window.ART_ADD(it, artHost); lastArt = it._art; }   // 名画铺满、2.5D 视差（art.js）；cont：接着上一场的同一幅
      else if (it.pdx) { d.className = 'pdx' + (it.cls ? ' ' + it.cls : ''); d.innerHTML = `<div class="pdx-l"><b>${H(it.pdx[0][0])}</b>${it.pdx[0][1] ? `<span>${H(it.pdx[0][1])}</span>` : ''}</div><div class="pdx-m"><i></i>${it.mid ? `<em>${H(it.mid)}</em>` : ''}</div><div class="pdx-r"><b>${H(it.pdx[1][0])}</b>${it.pdx[1][1] ? `<span>${H(it.pdx[1][1])}</span>` : ''}</div>`; }   // 一对“打架”的词：左暗右亮
      else if (it.stars) { it._replay = window.STARS_BUILD(it, d, AT); }  // 一串称呼连成星座
      else if (it.pic) { d.className = 'lp'; d.style.setProperty('--pw', (it.w || 980) + 'px'); d.style.setProperty('--ph', (it.h || 520) + 'px'); d.innerHTML = `<div class="lp-f"><img src="img/${it.pic}.jpg" style="object-position:${(it.fx ?? 0.5) * 100}% ${(it.fy ?? 0.5) * 100}%"></div>` + (it.cap ? `<div class="lp-c">${H(it.cap)}</div>` : ''); }
      else if (it.pics) { d.className = 'lps'; d.style.setProperty('--ph', (it.h || 420) + 'px'); if (it.w) d.style.setProperty('--pw', it.w + 'px'); d.innerHTML = it.pics.map(p => `<div class="lp"><div class="lp-f"><img src="img/${p[0]}.jpg" style="object-position:${((p[3] || {}).fx ?? 0.5) * 100}% ${((p[3] || {}).fy ?? 0.5) * 100}%"></div>${p[1] ? `<div class="lp-c">${H(p[1])}</div>` : ''}</div>`).join(''); }
      else if (it.rows) { d.className = 'lr'; d.innerHTML = it.rows.map(r => `<div><i>${H(r[0])}</i><b>${H(r[1])}</b></div>`).join(''); }
      else { d.className = 'll ' + (it.c || '') + (it.type || /big|h2/.test(it.c || '') ? ' split' : ''); d.innerHTML = H(it.t); }
      sec.appendChild(d); return d;
    });
    host.appendChild(sec); return { sc, sec, els };
  });
  if (LEC.some(sc => (sc.items || []).some(it => it.art))) await window.ART_LOAD();   // 名画和深浅图
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
  // 一场里最后一个图解、配画是说到它才出来的；离这一场淡出太近，还没看清就没了。这时把下一场往后挪一点（最多 LINGER 秒，
  // 也不超过下一场长度的三成），让它多停一会儿。下一场里早于新起点的项，跟着新起点一起出来（只会晚、不会早于声音）。
  const LINGER = o.linger ?? 1.6, NEED = 1.7;
  const doneAt = sc => {
    let d = -1;
    for (const it of sc.items || []) {
      if (it.ill) for (const x of it.items || []) { const o2 = Array.isArray(x) ? { at: x[2], ...(x[3] || {}) } : x; d = Math.max(d, AT(o2.at) + 0.95); if (o2.sat !== undefined) d = Math.max(d, AT(o2.sat) + 0.6); }
      if (it.pics) for (const p of it.pics) d = Math.max(d, AT(p[2]) + 1.0, (p[3] || {}).capAt !== undefined ? AT(p[3].capAt) + 0.8 : -1);
      if (it.pic) d = Math.max(d, AT(it.at) + 1.1, it.capAt !== undefined ? AT(it.capAt) + 0.8 : -1);
      if (it.done !== undefined) d = Math.max(d, AT(it.done));                       // 动画自己说什么时候才算出完
    }
    return d;
  };
  for (let i = 0; i + 1 < starts.length; i++) {
    if (built[i].sc.html || built[i + 1].sc.xfade) continue;
    const d = doneAt(built[i].sc), short = NEED - (starts[i + 1] - 0.7 - d);
    if (d < 0 || short <= 0) continue;
    const room = (i + 2 < starts.length ? starts[i + 2] : END) - starts[i + 1], shift = Math.min(short, LINGER, room * 0.3);
    if (shift > 0.05) { starts[i + 1] += shift; built[i + 1].late = shift; }
  }
  window.LEC_TIMES = starts.map((t, i) => [t, i + 1 < starts.length ? starts[i + 1] : END]);   // 每一场的起止（检查截图用）
  built.forEach((b, i) => {
    const a = starts[i] - 0.1, e = i + 1 < built.length ? starts[i + 1] - 0.1 : END;
    scene(b.sec, a, e);
    if (b.sc.xfade) tl.set(b.sec, { autoAlpha: 1, filter: 'blur(0px)', scale: 1 }, a - 0.62);
    if (b.sc.light) light(a, b.sc.light, 1.6);
    if (b.sc.run) b.sc.run({ K, P, AT, a, e, sec: b.sec, $: s => b.sec.querySelector(s), $$: s => [...b.sec.querySelectorAll(s)] });
    (b.sc.items || []).forEach((it, k) => {
      const el = b.els[k], xf = b.sc.xfade && k === 0, at0 = xf ? a - 0.6 : it.at !== undefined ? AT(it.at) : a + 0.15;
      const at = b.late && !xf ? Math.max(at0, a + 0.15) : at0;                           // 这一场被往后挪了：早于新起点的，跟着起点出来
      const inner = [];
      if (it.ill) (it.items || []).forEach(x => { const o2 = Array.isArray(x) ? { lab: x[1], at: x[2], ...(x[3] || {}) } : x; inner.push([o2.lab, o2.at]); if (o2.sat !== undefined) inner.push([o2.sub, o2.sat]); });
      if (it.pics) it.pics.forEach(p => { inner.push([p[1], p[2]]); if ((p[3] || {}).capAt !== undefined) inner.push([p[1], p[3].capAt]); });
      if (it.capAt !== undefined) inner.push([it.cap, it.capAt]);
      if (it.pdx) it.pdx.forEach(w => { inner.push([w[0], w[2]]); if (w[3] !== undefined) inner.push([w[1], w[3]]); });
      if (it.stars) it.stars.forEach(w => inner.push([w[0], w[1]]));
      for (const [lab, x] of inner) { const tx = AT(x); if (tx < a - 0.7 - (b.late || 0) || tx > e - 0.3) throw new Error(`第 ${i} 场「${lab}」的时刻 ${tx.toFixed(2)} 不在这一场里（${a.toFixed(2)}–${e.toFixed(2)}）`); }
      if (!xf && !it.art && (at < a - 0.01 || at > e)) throw new Error(`第 ${i} 场第 ${k} 项的时刻 ${at.toFixed(2)} 不在这一场里（${a.toFixed(2)}–${e.toFixed(2)}）：` + JSON.stringify(it).slice(0, 80));
      if (it.q) {
        if (it.ms) { const f = chars(el.querySelector('.lq-t')).find(c => /[一-鿿]/.test(c.textContent)); if (f) f.classList.add('cap'); }   // 抄本式：第一个字做彩饰首字
        { const cs0 = chars(el.querySelector('.lq-t')); let g = [];        // 标点不落行首：句中、句末标点跟前一个字绑在一起，开引号跟后一个字绑在一起（逐字拆开以后，浏览器的避头尾规则管不到）
          const flush = () => { if (g.length > 1 && g.every(c => c.parentNode === g[0].parentNode)) { const w = document.createElement('span'); w.className = 'nb'; g[0].before(w); g.forEach(c => w.appendChild(c)); } g = []; };
          cs0.forEach((c, j) => { const t = c.textContent, p = j ? cs0[j - 1].textContent : '', cap = c.classList.contains('cap') || g.some(x => x.classList.contains('cap'));
            if (g.length && !cap && (/[，。、；：？！”’》）…]/.test(t) || /[“‘《（]/.test(p))) g.push(c); else { flush(); g = [c]; } }); flush(); }
        // xfade：紧接着上一张卡（同一个位置）——新卡在旧卡淡出的同时淡进来，纸面不会先暗一下再亮（不然像闪了一下）
        if (xf) IN(el, a - 0.62, { y: 0, d: 0.75, blur: 0, ease: 'sine.inOut' }); else IN(el, Math.max(a + 0.05, at - 0.6), { y: 18, d: 1.1, blur: 3 });
        const tq = xf && it.at !== undefined ? AT(it.at) : at;            // 逐字出现按这一张卡自己说到的时刻算
        const cs = chars(el.querySelector('.lq-t')), ts = speakTimes(cs.map(c => c.textContent), (xf ? tq : at0) - 1.0, e);
        if (ts) cs.forEach((c, j) => IN(c, Math.max(tq - 0.3, ts[j] - 0.05), { d: 0.6, y: 5, blur: 3 }));
        else type(el.querySelector('.lq-t'), tq, Math.max(1.5, (e - tq) * 0.7), { d: 0.6, y: 5, blur: 3 });
        (it.hl || []).forEach(([sel, t2, col]) => tl.to(chars(el.querySelector('.lq-t ' + sel)), { color: col || '#b8321c', duration: 0.5, stagger: 0.02 }, AT(t2)));
      } else if (it.cols || it.tri) {
        // 每栏的标题在 at 出来；下面的小字可以另给时刻 sat（说到时再出来），不给就跟标题一起
        const parts = [...el.children], spec = it.cols || it.tri;
        parts.forEach((p, j) => {
          const t0 = spec[j].at !== undefined ? AT(spec[j].at) : at + j * 0.4, b = p.querySelector('b'), sp = p.querySelector('span');
          if (spec[j].sat !== undefined && sp) { IN(b, t0, { y: 12, d: 1.0 }); IN(sp, AT(spec[j].sat), { y: 8, d: 0.9 }); }
          else IN(p, t0, { y: 12, d: 1.0 });
        });
      } else if (it.art) {                                              // 名画：这一场一开始就在（垫在文字下面），镜头走满整场
        window.ART_SEG(it._art, it, i, a - 0.3, e);                     // 淡入淡出在下面统一排（画在后面那一层，可以跨场）
      } else if (it.pdx) {                                              // 左边那个词从暗里慢慢浮出来，右边那一半亮起来、词在光里出来
        const [L, R] = it.pdx, tl0 = AT(L[2]), tr0 = AT(R[2]), l = el.querySelector('.pdx-l'), r = el.querySelector('.pdx-r'), m = el.querySelector('.pdx-m');
        IN(el, Math.max(a + 0.05, tl0 - 0.45), { y: 10, d: 1.0, blur: 2 });
        tl.fromTo(m.querySelector('i'), { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, Math.max(a + 0.05, tl0 - 0.3));
        IN(l.querySelector('b'), tl0, { y: 0, d: 1.8, blur: 14, ease: 'sine.out', o: 0.92 }); if (l.querySelector('span')) IN(l.querySelector('span'), L[3] !== undefined ? AT(L[3]) : tl0 + 0.8, { y: 8, d: 1.0, blur: 4 });
        tl.fromTo(r, { '--lit': 0 }, { '--lit': 1, duration: 1.4, ease: 'sine.inOut', immediateRender: false }, tr0 - 0.2);
        IN(r.querySelector('b'), tr0, { y: 6, d: 1.0, blur: 6 }); if (r.querySelector('span')) IN(r.querySelector('span'), R[3] !== undefined ? AT(R[3]) : tr0 + 0.8, { y: 8, d: 1.0, blur: 4 });
        if (m.querySelector('em')) IN(m.querySelector('em'), it.midAt !== undefined ? AT(it.midAt) : tr0 - 0.3, { y: 0, d: 0.9, blur: 4 });
      } else if (it.stars) {
        IN(el, Math.max(a + 0.05, AT(it.stars[0][1]) - 0.4), { y: 0, d: 1.0, blur: 0 }); it._replay(tl);
      } else if (it.anim || it.ill) {
        // 图解：容器在里面最早的那一样出来之前一点点出现（不要等到整个图解的“重点”才一起冒出来）
        let t1 = at; if (it.ill) (it.items || []).forEach(x => { t1 = Math.min(t1, AT(Array.isArray(x) ? x[2] : x.at)); });
        IN(el, Math.max(a + 0.05, t1 - 0.4), { y: 8, d: 0.9, blur: 2 }); it._replay(tl);
      } else if (it.rows) {
        [...el.children].forEach((r, j) => { IN(r.querySelector('i'), AT(it.rows[j][2]), { y: 10, d: 0.9 }); IN(r.querySelector('b'), AT(it.rows[j][3]), { y: 10, d: 0.9, blur: 3 }); });
      } else if (it.pic) {
        IN(el, at, { y: 14, s: 0.985, d: 1.3, blur: 3 });
        tl.fromTo(el.querySelector('img'), { scale: 1.0 }, { scale: it.z || 1.12, duration: Math.max(1, e - at), ease: 'none', immediateRender: false }, at);
        if (it.cap) IN(el.querySelector('.lp-c'), it.capAt !== undefined ? AT(it.capAt) : at + 0.5, { y: 8, d: 1.0 });   // 说明字可以等说到时再出来
      } else if (it.pics) {
        [...el.children].forEach((p, j) => { const t0 = AT(it.pics[j][2]), o3 = it.pics[j][3] || {}; IN(p, t0, { y: 14, d: 1.2, blur: 3 }); tl.fromTo(p.querySelector('img'), { scale: 1.0 }, { scale: 1.1, duration: Math.max(1, e - t0), ease: 'none', immediateRender: false }, t0);
          if (o3.capAt !== undefined && p.querySelector('.lp-c')) IN(p.querySelector('.lp-c'), AT(o3.capAt), { y: 8, d: 1.0 }); });
      } else if (it.fig) {
        if (xf) IN(el, at, { y: 0, d: 0.6, blur: 0, ease: 'sine.inOut' }); else IN(el, at, { y: 14, s: 0.985, d: 1.3, blur: 3 });
        if (it.spots) {                                                  // 发光的框：第一处淡入，之后平移到下一处
          const sp = el.querySelector('.lf-spot'), box = r => ({ left: r[1] + '%', top: r[2] + '%', width: r[3] + '%', height: r[4] + '%' });
          gsap.set(sp, { ...box(it.spots[0]), opacity: 0 });
          it.spots.forEach((r, j) => { const t = AT(r[0]); if (j) tl.to(sp, { ...box(r), duration: 0.9, ease: 'power2.inOut' }, t - 0.2); else tl.to(sp, { opacity: 1, duration: 0.7 }, Math.max(t, at + 0.8)); });
        }
        tl.fromTo(el.querySelector('img'), { scale: 1.0 }, { scale: 1.045, duration: Math.max(1, e - at), ease: 'none', immediateRender: false }, at);
      } else if (it.type) type(el, at, it.type, { d: 0.6 });
      else if (/big|h2/.test(it.c || '')) big(el, at, { st: Math.min(0.06, 0.8 / Math.max(1, chars(el).length)) });
      else IN(el, at, { y: it.v ? 14 : 12, d: it.v || it.think ? 1.2 : 1.05 });
      if (it.flash) flash(at + 0.1, 960, 540, 0.26);
      if (it.dim !== undefined) tl.to(el, { opacity: 0.32, duration: 0.6 }, AT(it.dim));
      if (it.strike !== undefined) tl.fromTo(el, { '--sx': 0 }, { '--sx': 1, duration: 0.45, ease: 'power2.inOut', immediateRender: false }, AT(it.strike));
    });
  });
  // 名画那一层：第一场开始时淡入；紧接着换另一幅画的，新画盖在上面淡入、淡完再撤掉旧画（不经过黑）；后面没有画的，最后一场结束时淡出
  const AR = window.ART_LIST ? window.ART_LIST().filter(r => r.segs.length) : [];
  const SA = i => starts[i] - 0.1, SE = i => i + 1 < built.length ? starts[i + 1] - 0.1 : END;
  AR.forEach((r, k) => {
    const i0 = r.segs[0].i, i1 = r.segs[r.segs.length - 1].i, prev = AR[k - 1], next = AR[k + 1];
    if (prev && prev.segs[prev.segs.length - 1].i === i0 - 1) tl.fromTo(r.el, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'sine.inOut', immediateRender: false }, SA(i0) - 0.5);
    else tl.fromTo(r.el, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: 'sine.inOut', immediateRender: false }, Math.max(0, SA(i0) - 0.25));
    if (next && next.segs[0].i === i1 + 1) tl.to(r.el, { opacity: 0, duration: 0.6, ease: 'sine.inOut' }, SA(i1 + 1) + 0.5);   // 新画差不多全亮了再淡掉旧的（新画只占半屏时，另一半也是慢慢暗下去）
    else tl.to(r.el, { opacity: 0, duration: 0.7, ease: 'sine.inOut' }, SE(i1) - 0.6);
  });
  return { K, P, AT, END };
};
