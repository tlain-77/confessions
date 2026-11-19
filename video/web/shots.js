// 逐句换背景：每说一句话，背景就换一个镜头——一幅画，或同一幅画推近的一处局部，配缓慢的推、拉、摇、移。
// makeShots(tl, list, opt)
//   list: [{a, src, z, f, mv}]，按时间排；每个镜头一直放到下一个镜头开始。src 为 null 表示这段不放（旁白卡、片头片尾）。
//   z：放大倍数（1 是整幅铺满）；f：[fx, fy] 镜头对准画上的哪一点（0–1）；mv：运动方式。
//   opt.caps：{画: '画名'}，换画时右上角跟着换画名；opt.o：整层的透明度（下面的光和尘还透得上来）。
// 镜头本身都是不透明的：新镜头在旧镜头上面淡入，淡完再把旧的藏起来——换镜头时画面不会先暗一下再亮。
(function () {
  const W = 1920, H = 1080;
  window.makeShots = function (tl, list, opt = {}) {
    const F = window.FOCUS, CAP = opt.caps || {}, X = opt.xf ?? 0.9;
    const host = document.createElement('div'); host.id = 'shots';
    const main = document.getElementById('main'); main.parentNode.insertBefore(host, main);
    const shade = document.createElement('div'); shade.className = 'sh-shade';
    const capHost = document.createElement('div'); capHost.id = 'shotcaps'; main.parentNode.insertBefore(capHost, main.nextSibling);
    tl.set(host, { opacity: opt.o ?? 0.62 }, 0);
    const geo = (src, z, f) => {
      const [w, h] = F[src], s = Math.max(W / w, H / h) * z, iw = w * s, ih = h * s;
      const L = Math.min(0, Math.max(W - iw, W / 2 - f[0] * iw)), T = Math.min(0, Math.max(H - ih, H / 2 - f[1] * ih));
      return { iw, ih, L, T };
    };
    const els = [];
    list.forEach((s, i) => {
      if (!s.src) return;
      if (!F[s.src]) throw new Error('没有这幅画：' + s.src);
      const nx = list[i + 1], b = nx ? nx.a : s.b;
      const [w, h] = F[s.src], s0 = Math.max(W / w, H / h), el = document.createElement('div'); el.className = 'shot';
      const dur = b - s.a + X;
      tl.set(el, { autoAlpha: 0 }, 0);
      if (s0 > 1.75) {
        // 原图不够大，铺满会糊：画居中放（不超过 1.5 倍），后面垫事先模糊好的同一幅画
        const fs = Math.min(H * 0.94 / h, W * 0.8 / w, 1.5), fw = w * fs, fh = h * fs;
        el.classList.add('fit');
        el.innerHTML = `<img class="bgb" src="img/blur/${s.src}.jpg"><img class="fg" src="img/${s.src}.jpg" style="width:${fw}px;height:${fh}px;left:${(W - fw) / 2}px;top:${(H - fh) / 2}px">`;
        host.appendChild(el);
        const [bg, fg] = el.children, inn = ['in', 'up', 'left'].includes(s.mv);
        tl.fromTo(fg, { scale: inn ? 1 : 1.06 }, { scale: inn ? 1.06 : 1, duration: dur, ease: 'none', immediateRender: false }, s.a - X / 2);
        tl.fromTo(bg, { scale: inn ? 1.18 : 1.08, xPercent: inn ? -1.5 : 1.5 }, { scale: inn ? 1.08 : 1.18, xPercent: inn ? 1.5 : -1.5, duration: dur, ease: 'none', immediateRender: false }, s.a - X / 2);
      } else {
        // 推近不超过原图 1.9 倍，免得糊；推不近的局部改成整幅
        let z = Math.min(s.z || 1, 1.9 / s0), f = s.f || [0.5, 0.5];
        if (z < 1.15 && (s.z || 1) > 1) { z = 1; f = [0.5, Math.min(0.62, Math.max(0.38, F[s.src][2]))]; }
        const g = geo(s.src, z, f);
        const img = document.createElement('img'); img.src = `img/soft/${s.src}.jpg`;
        img.style.cssText = `width:${g.iw}px;height:${g.ih}px;left:${g.L}px;top:${g.T}px`;
        el.appendChild(img); host.appendChild(el);
        // 推拉摇移：以画面中心为原点放大，不会露出画的边；平移量不超过画在屏幕外的余量
        const ox = W / 2 - g.L, oy = H / 2 - g.T, k = 1.06;
        const slack = (lo, hi) => Math.max(0, Math.min(lo, hi) - 6);
        const sx = slack(-(W / 2 - ox * k), (W / 2 + (g.iw - ox) * k) - W), sy = slack(-(H / 2 - oy * k), (H / 2 + (g.ih - oy) * k) - H);
        const px = Math.min(70, sx), py = Math.min(45, sy);
        const M = { in: [1, 0, 0, k, 0, 0], out: [k, 0, 0, 1, 0, 0], left: [k, px, 0, k, -px, 0], right: [k, -px, 0, k, px, 0],
          up: [k, 0, py, k, 0, -py], down: [k, 0, -py, k, 0, py] }[s.mv || 'in'];
        gsap.set(img, { transformOrigin: `${ox}px ${oy}px` });
        tl.fromTo(img, { scale: M[0], x: M[1], y: M[2] }, { scale: M[3], x: M[4], y: M[5], duration: dur, ease: 'none', immediateRender: false }, s.a - X / 2);
      }
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: X, ease: 'sine.inOut', immediateRender: false }, s.a - X / 2);
      els.push({ el, s, b, last: !nx || !nx.src });
    });
    els.forEach(({ el, b, last }) => {
      if (last) tl.to(el, { autoAlpha: 0, duration: X, ease: 'sine.inOut' }, b - X / 2);
      else tl.set(el, { autoAlpha: 0 }, b + X / 2 + 0.03);          // 下一个镜头已经完全盖住了，再藏
    });
    host.appendChild(shade);
    // 画名：换画（不是同一幅画换局部）时，右上角的小字跟着换
    let cur = null, curEl = null;
    list.forEach((s, i) => {
      const key = s.src ? (CAP[s.src] || '') : '';
      if (key === cur) return;
      if (curEl) tl.to(curEl, { opacity: 0, duration: 0.4 }, s.a - 0.45);
      cur = key; curEl = null;
      if (!key) return;
      const c = document.createElement('div'); c.className = 'ax-cap shot-cap'; c.textContent = key; capHost.appendChild(c);
      tl.set(c, { opacity: 0 }, 0); tl.fromTo(c, { opacity: 0 }, { opacity: 0.85, duration: 0.8, immediateRender: false }, s.a + 0.35);
      curEl = c;
    });
  };

  // 把“每句一幅画”的计划排成镜头：句子太长就从中间的停顿处切开；同一幅画接着用时推近到不同局部
  window.planShots = function (D, plan, o = {}) {
    const F = window.FOCUS, C = {}; D.cues.forEach(c => C[c.id] = c);
    const subs = D.subs || [], MIN = o.min ?? 2.6, LONG = o.long ?? 8.5, LEAD = o.lead ?? 0.3;
    const P = {}; plan.trim().split(/\s+/).forEach(tok => { const [id, v] = tok.split(':'); P[id] = v.split(','); });
    const out = []; let prev = null;
    const use = {}, MV = ['left', 'in', 'right', 'up', 'left', 'out', 'right', 'down'];
    let mvi = 0;
    const shot = (a, src) => {
      const u = use[src] = (use[src] ?? -1) + 1, [, , cy, pts] = F[src];
      const n = pts.length + 1, j = u % n;
      const full = j === 0, f = full ? [0.5, Math.min(0.62, Math.max(0.38, cy))] : pts[j - 1];
      let mv = MV[mvi++ % MV.length]; if (out.length && out[out.length - 1].mv === mv) mv = MV[mvi++ % MV.length];
      return { a, src, z: full ? 1.0 : (j % 2 ? 1.55 : 1.4), f, mv };
    };
    const FB = o.fallback || {}, ok = k => k && (F[k] ? k : FB[k] && F[FB[k]] ? FB[k] : null);
    const cues = D.cues, GAP = o.gap ?? 0;
    for (let ci = 0; ci < cues.length; ci++) {
      const c = cues[ci];
      if (o.skip && o.skip(c)) continue;
      let imgs = (P[c.id] || [prev]).map(ok).filter(Boolean); if (!imgs.length) imgs = [prev];
      if (!imgs[0]) continue;
      if (imgs.length === 1 && c.dur > LONG) imgs = [imgs[0], imgs[0]];
      const n = imgs.length, cut = [c.start];
      for (let k = 1; k < n; k++) {                                       // 切在最接近等分点的字幕分句处
        const want = c.start + c.dur * k / n;
        const cand = subs.map(s => s.s).filter(t => t > cut[cut.length - 1] + MIN && t < c.end - MIN);
        cut.push(cand.length ? cand.reduce((p, q) => Math.abs(q - want) < Math.abs(p - want) ? q : p) : want);
      }
      const ex = !!P[c.id];
      imgs.forEach((src, k) => {
        const a = cut[k] - LEAD, last = out[out.length - 1];
        if (last && last.src && a - last.a < MIN) {                      // 太近：这一句不另换
          if (o.prefer && ex) {                                          // 但这句特意指定了画：别丢掉它
            if (!last.ex) { out[out.length - 1] = { ...shot(last.a, src), ex: true }; prev = src; }   // 上一个只是沿用的局部：换成这幅
            else if (last.a + MIN < c.end - 0.4) { out.push({ ...shot(last.a + MIN, src), ex: true }); prev = src; }   // 稍晚一点再换
          }
          return;
        }
        out.push({ ...shot(a, src), ex }); prev = src;
      });
      // 讲稿以外临场说的话（有字幕、没有对应的讲稿句子）：每隔几秒在字幕分句处换一个镜头，不让画面停住
      const nxt = cues[ci + 1], g0 = c.end, g1 = nxt ? nxt.start : D.total;
      if (GAP && g1 - g0 > GAP) {
        const gimgs = (P[c.id + '+'] || []).map(ok).filter(Boolean); let gi = 0;
        for (const sb of subs) {
          if (sb.s <= g0 + 0.2 || sb.s >= g1 - MIN) continue;
          const a = sb.s - LEAD, last = out[out.length - 1];
          if (last && a - last.a < Math.max(MIN, o.gapEvery ?? 3.4)) continue;
          const src = gimgs.length ? gimgs[Math.min(gi++, gimgs.length - 1)] : prev; if (!src) continue;
          out.push(shot(a, src)); prev = src;
        }
      }
    }
    return out;
  };

  // 一集的逐句换背景：排镜头；旁白卡（自己有画）和片尾不放背景；卡片收起时背景接着来
  window.runShots = function (tl, D, plan, o = {}) {
    const list = planShots(D, plan, o);
    const spans = (window.ASIDE_SPANS || []).map(([a, b]) => [a + 0.3, b]).sort((p, q) => p[0] - q[0]);
    const tail = D.total - (o.tail ?? 6.6);
    const inSpan = t => spans.find(([a, b]) => t >= a && t < b);
    const kept = list.filter(s => !inSpan(s.a) && s.a < tail);
    const all = kept.slice();
    for (const [a, b] of spans) {
      all.push({ a, src: null });
      const nx = kept.find(s => s.a >= b), pv = [...list].reverse().find(s => s.a < b);
      const nextCard = spans.some(([a2]) => a2 > a && a2 < b + 1.5);          // 紧接着又是一张卡：不在两张卡之间闪一下背景
      if (b < tail && !nextCard && (!nx || nx.a - b > 1.2) && (pv || nx)) all.push({ ...(pv || nx), a: b - 0.25 });
    }
    all.push({ a: tail, src: null });
    all.sort((p, q) => p.a - q.a);
    makeShots(tl, all, { caps: window.SHOT_CAPS, o: o.o ?? 0.6, xf: o.xf ?? 0.7 });
    window.SHOT_LIST = all;
  };
})();
