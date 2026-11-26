// 火柴人：会摆姿势、走路、做表情的线描小人（第八讲起，讲稿里每一个例子都用小人演出来）。
// 小人的每个关节都是一个数（st 里），GSAP 补间这些数，每一帧按这些数重画一遍，所以逐帧定位也准。
// 依赖 anim.js 里的公用画法（window.AH）；例子的动画也写在这里，挂到 window.ANIMS 上。
//
// 角度的约定（都是“度”）：手臂、腿以“竖直朝下”为 0，往前（脸朝的方向）转为正：手臂 90 是平举向前，180 是举过头顶；
// 肘、膝是相对上一节的角度：肘为正是往前弯（小臂往前、往上收），膝为负是往后弯（正常的弯法）；
// lean 是上身前倾（负的是后仰，-90 就是平躺、头在身后）；head 是低头（负的是抬头）。
// 腿有两种算法：fk = 0（默认）脚踩在地上，按臀部高低自动弯膝（下蹲、走路都不会滑脚）；fk = 1 按 l1/k1/l2/k2 摆（坐、跪、躺）。
(function () {
  const { mk, rng, base, line, text, DRAW, SHOW, grad, icon, circ, GOLD, PAPER, CORAL, WATER } = window.AH;
  const R = Math.PI / 180, TAU = Math.PI * 2;
  const n1 = v => Math.round(v * 10) / 10;
  const pt = (p) => `${n1(p[0])},${n1(p[1])}`;
  const SKY = '#9fb0c8', DIM = '#8f8270', WARM = '#f3dcae', ROSE = '#e8b4a0', INK = 'rgba(8,8,12,.62)';
  // 颜色加透明度
  const rgba = (hex, a) => { const h = hex.replace('#', ''); const v = h.length === 3 ? h.split('').map(x => parseInt(x + x, 16)) : [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
  // 小人身上的柔光（一个组一个滤镜，比每根线一层光省）
  const figGlow = svg => {
    if (!svg._fg) {
      const defs = svg.querySelector('defs'), id = 'fg' + svg._uid;
      const f = mk('filter', { id, x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs);
      mk('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 3.4, result: 'b' }, f);
      mk('feColorMatrix', { in: 'b', type: 'matrix', values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .62 0', result: 'g' }, f);
      const m = mk('feMerge', {}, f); mk('feMergeNode', { in: 'g' }, m); mk('feMergeNode', { in: 'SourceGraphic' }, m);
      svg._fg = id;
    }
    return svg._fg;
  };
  const svgOf = par => par.ownerSVGElement || par;

  // ── 脸：几种表情各是一组，换表情就是交叉淡化。r 是头的半径，look 是脸往前偏多少（0 正脸，1 侧脸）
  function faces(g, r, c, w, look, baby) {
    const lw = Math.max(1.9, w * (baby ? .62 : .6)), er = Math.max(1.7, r * (baby ? .095 : .115));
    const ox = baby ? 0 : look * r * .36, ey = baby ? r * .02 : -r * .08, ex = baby ? r * .34 : r * .29;
    const e1 = ox + ex, e2 = ox - ex, mx = ox + (baby ? 0 : r * .05), my = baby ? r * .42 : r * .42;
    const S = { fill: 'none', stroke: c, 'stroke-width': lw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const F = {};
    const P = (p, d, o = {}) => mk('path', { ...S, d, ...o }, p);
    const dot = (p, x, y, k = 1) => mk('circle', { cx: x, cy: y, r: er * k, fill: c }, p);
    const eyes = {
      dot: p => { dot(p, e1, ey); dot(p, e2, ey); },
      big: p => { [e1, e2].forEach(x => { mk('circle', { cx: x, cy: ey, r: er * 2, fill: 'none', stroke: c, 'stroke-width': lw * .8 }, p); dot(p, x + er * .3, ey + er * .2, .75); }); },
      shut: p => [e1, e2].forEach(x => P(p, `M${x - er * 1.7},${ey - er * .2} Q${x},${ey + er * 2} ${x + er * 1.7},${ey - er * .2}`)),          // ∪ 闭着（睡、满足）
      happy: p => [e1, e2].forEach(x => P(p, `M${x - er * 1.7},${ey + er * .5} Q${x},${ey - er * 2.1} ${x + er * 1.7},${ey + er * .5}`)),       // ∩ 眯着笑
      squeeze: p => { P(p, `M${e2 - er * 1.6},${ey - er * 1.3} L${e2 + er * 1.1},${ey} L${e2 - er * 1.6},${ey + er * 1.3}`); P(p, `M${e1 + er * 1.6},${ey - er * 1.3} L${e1 - er * 1.1},${ey} L${e1 + er * 1.6},${ey + er * 1.3}`); },   // > < 哭得挤着
      tired: p => [e1, e2].forEach(x => { P(p, `M${x - er * 1.6},${ey - er * .3} L${x + er * 1.6},${ey - er * .3}`); dot(p, x, ey + er * .55, .62); }),
    };
    const brows = {
      sad: p => { P(p, `M${e2 - er * 1.8},${ey - r * .3} L${e2 + er * 1.6},${ey - r * .44}`); P(p, `M${e1 - er * 1.6},${ey - r * .44} L${e1 + er * 1.8},${ey - r * .3}`); },
      angry: p => { P(p, `M${e2 - er * 1.8},${ey - r * .44} L${e2 + er * 1.6},${ey - r * .29}`); P(p, `M${e1 - er * 1.6},${ey - r * .29} L${e1 + er * 1.8},${ey - r * .44}`); },
      up: p => [e1, e2].forEach(x => P(p, `M${x - er * 1.7},${ey - r * .4} Q${x},${ey - r * .52} ${x + er * 1.7},${ey - r * .4}`)),
    };
    const mw = r * (baby ? .2 : .25);
    const mouth = {
      flat: p => P(p, `M${mx - mw * .7},${my} L${mx + mw * .7},${my}`),
      smile: p => P(p, `M${mx - mw},${my - r * .05} Q${mx},${my + r * .2} ${mx + mw},${my - r * .05}`),
      grin: p => P(p, `M${mx - mw * 1.15},${my - r * .07} Q${mx},${my + r * .34} ${mx + mw * 1.15},${my - r * .07} Z`, { fill: rgba(c, .3) }),
      frown: p => P(p, `M${mx - mw * .9},${my + r * .1} Q${mx},${my - r * .1} ${mx + mw * .9},${my + r * .1}`),
      o: p => mk('ellipse', { cx: mx, cy: my + r * .02, rx: r * .085, ry: r * .1, fill: 'none', stroke: c, 'stroke-width': lw * .9 }, p),
      O: p => mk('ellipse', { cx: mx, cy: my + r * .04, rx: r * .13, ry: r * .17, fill: rgba(c, .18), stroke: c, 'stroke-width': lw * .9 }, p),
      wail: p => mk('ellipse', { cx: mx, cy: my + r * .06, rx: r * .17, ry: r * .2, fill: rgba(c, .3), stroke: c, 'stroke-width': lw }, p),
      wavy: p => P(p, `M${mx - mw},${my} Q${mx - mw / 2},${my - r * .08} ${mx},${my} Q${mx + mw / 2},${my + r * .08} ${mx + mw},${my}`),
      talk: p => mk('ellipse', { cx: mx, cy: my + r * .02, rx: r * .12, ry: r * .09, fill: rgba(c, .25), stroke: c, 'stroke-width': lw * .9 }, p),
    };
    const blush = p => [e1, e2].forEach(x => mk('ellipse', { cx: x + (x > ox ? r * .12 : -r * .12), cy: ey + r * .36, rx: r * .13, ry: r * .07, fill: 'rgba(235,150,120,.42)' }, p));
    const SET = {
      neutral: ['dot', 0, 'flat'], smile: ['dot', 0, 'smile'], happy: ['happy', 0, 'smile'], laugh: ['happy', 0, 'grin', 1], grin: ['dot', 0, 'grin'],
      sad: ['dot', 'sad', 'frown'], cry: ['squeeze', 'sad', 'wail'], sleep: ['shut', 0, baby ? 'smile' : 'flat'], wow: ['big', 'up', 'O'],
      angry: ['dot', 'angry', 'frown'], frown: ['dot', 'angry', 'flat'], talk: ['dot', 0, 'talk'], talkf: ['dot', 'angry', 'talk'], talkh: ['happy', 0, 'talk'],
      worry: ['dot', 'sad', 'wavy'], tired: ['tired', 0, 'flat'], yawn: ['shut', 0, 'O'], content: ['shut', 0, 'smile', 1], suck: ['shut', 0, 'o', 1], shout: ['dot', 'angry', 'wail'],
      blank: ['dot', 0, 0], look: ['dot', 'up', 'o'],
    };
    for (const k in SET) {
      const [e, b, m, bl] = SET[k], p = mk('g', { opacity: 0 }, g); eyes[e](p); if (b) brows[b](p); if (m) { const me = mouth[m](p); if (m === 'talk') p._mo = me; } if (bl || (baby && /laugh|content|happy/.test(k))) blush(p); F[k] = p;
    }
    // 眼泪、汗：放在头里（跟着头动）
    const tears = [e1, e2].map(x => mk('path', { d: `M${x},${ey + er * 2} q${-er * 1.1},${er * 2.2} 0,${er * 3.2} q${er * 1.1},${-er} 0,${-er * 3.2} Z`, fill: '#a9cdea', opacity: 0 }, g));
    const sweat = mk('path', { d: `M${ox - r * .95},${-r * .55} q${-r * .14},${r * .28} 0,${r * .38} q${r * .14},${-r * .1} 0,${-r * .38} Z`, fill: '#a9cdea', opacity: 0 }, g);
    return { F, tears, sweat, er, e1, e2, ey };
  }

  // 眼泪：从眼睛往下掉，一滴接一滴（每滴两段补间：出来、落下淡掉）
  function drops(tl, els, t, d, r) {
    const n = Math.max(1, Math.round(d / .7));
    els.forEach((e, i) => { for (let j = 0; j < n; j++) { const t1 = t + i * .33 + j * .7;
      tl.fromTo(e, { opacity: 0, y: 0 }, { opacity: 1, y: r * .14, duration: .2, immediateRender: false }, t1);
      tl.to(e, { opacity: 0, y: r * .72, duration: .45, ease: 'power1.in' }, t1 + .2); } });
  }

  // ── 人：o = { x, y（脚底那一点）, h（身高）, kind: 'adult' | 'child', c（线的颜色）, w（线宽）, f（1 朝右，-1 朝左）, face, look,
  //          dress（裙子）, veil（头巾）, mitre（主教冠）, beard, hair（小孩的一撮头发）, op（一开始的不透明度）, st（一开始的姿势） }
  const KIND = {
    adult: { th: .235, sh: .225, to: .285, nk: .03, hr: .102, ua: .162, fa: .148, ft: .046 },
    child: { th: .19, sh: .18, to: .24, nk: .024, hr: .15, ua: .135, fa: .122, ft: .05 },
  };
  function person(par, o = {}) {
    const K = KIND[o.kind || 'adult'], H = o.h || 220, svg = svgOf(par);
    const TH = K.th * H, SH = K.sh * H, TO = K.to * H, NK = K.nk * H, HR = K.hr * H, UA = K.ua * H, FA = K.fa * H, FT = K.ft * H, LEG = TH + SH, LIFT = H * .05;
    const c = o.c || PAPER, w = o.w || Math.max(3.2, H * .024);
    const st = Object.assign({ x: 0, y: 0, f: 1, sc: 1, rot: 0, jump: 0, hy: 0, lean: 0, head: 0, curv: 0,
      a1: 8, e1: 14, a2: -8, e2: 14, l1: 0, k1: 0, l2: 0, k2: 0, fk: 0, ft1: H * .035, ft2: -H * .035,
      walk: 0, ph: Math.PI / 2, stride: LEG * .6, gest: 0, gph: 0, shake: 0, sph: 0, br: 0, wave: 0, wph: 0 }, o.st || {});
    st.x = o.x ?? st.x; st.y = o.y ?? st.y; st.f = o.f ?? st.f;
    const outer = mk('g', { opacity: o.op ?? 1 }, par), root = mk('g', {}, outer);   // outer 给 GSAP 淡入淡出、平移；root 的变换每帧按 st 重算
    const body = mk('g', { filter: `url(#${figGlow(svg)})` }, root);
    const P = (op = 1, ww = w) => mk('path', { fill: 'none', stroke: c, 'stroke-width': ww, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op }, body);
    const legF = P(.6), armF = P(.6), handF = mk('circle', { r: w * .9, fill: c, opacity: .6 }, body);
    const legN = P(1);
    const dress = o.dress ? mk('path', { fill: rgba(o.dress === true ? c : o.dress, .1), stroke: c, 'stroke-width': w * .82, 'stroke-linejoin': 'round' }, body) : null;
    const dressFill = dress ? mk('path', { fill: 'rgba(8,8,12,.5)' }, body) : null;
    if (dressFill) body.insertBefore(dressFill, dress);
    const torso = P(1);
    const headG = mk('g', {}, body);
    if (o.veil) mk('path', { d: `M${HR * .5},${-HR * .9} Q${-HR * .3},${-HR * 1.42} ${-HR * 1.05},${-HR * .5} Q${-HR * 1.35},${HR * .7} ${-HR * .95},${HR * 1.75} L${-HR * .35},${HR * 1.25} Q${-HR * .55},${HR * .3} ${-HR * .2},${-HR * .2}`, fill: rgba(o.veil === true ? c : o.veil, .16), stroke: o.veil === true ? c : o.veil, 'stroke-width': w * .75, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, headG);
    mk('circle', { cx: 0, cy: 0, r: HR, fill: INK, stroke: c, 'stroke-width': w }, headG);
    if (o.veil) mk('path', { d: `M${HR * .62},${-HR * .82} Q${-HR * .1},${-HR * 1.25} ${-HR * .85},${-HR * .55}`, fill: 'none', stroke: o.veil === true ? c : o.veil, 'stroke-width': w * .75, 'stroke-linecap': 'round' }, headG);
    const mitre = o.mitre ? mk('path', { d: `M${-HR * .62},${-HR * .72} L${-HR * .42},${-HR * 1.95} Q${HR * .02},${-HR * 2.4} ${HR * .32},${-HR * 2.05} L${HR * .58},${-HR * .74} Z M${-HR * .12},${-HR * 2.1} L${HR * .06},${-HR * .8} M${-HR * .55},${-HR * 1.15} L${HR * .52},${-HR * 1.18}`, fill: rgba(GOLD, .16), stroke: GOLD, 'stroke-width': w * .72, 'stroke-linejoin': 'round' }, headG) : null;
    if (o.hair) mk('path', { d: `M${-HR * .15},${-HR * .98} q${HR * .05},${-HR * .42} ${HR * .38},${-HR * .5} M${HR * .1},${-HR * .99} q${HR * .2},${-HR * .3} ${HR * .5},${-HR * .26}`, fill: 'none', stroke: c, 'stroke-width': w * .7, 'stroke-linecap': 'round' }, headG);
    if (o.beard) mk('path', { d: `M${HR * .82},${HR * .35} Q${HR * .75},${HR * 1.45} ${HR * .05},${HR * 1.3} Q${-HR * .35},${HR * 1.05} ${-HR * .45},${HR * .7}`, fill: rgba(c, .14), stroke: c, 'stroke-width': w * .65, 'stroke-linejoin': 'round' }, headG);
    const FC = faces(headG, HR, c, w, o.look ?? .45, false);
    const armN = P(1), handN = mk('circle', { r: w * .9, fill: c }, body);
    const holds = [];
    let face = o.face || 'neutral'; gsap.set(FC.F[face], { opacity: 1 });

    function geom(s) {
      const W = s.walk, S = s.stride, ph = s.ph;
      const reach = Math.sqrt(Math.max(0, LEG * LEG - S * S / 4));
      const drop = W * ((LEG - reach) * 1.08 + H * .006), bob = W * H * .014 * (1 - Math.cos(2 * ph)) / 2;
      const shake = s.shake * Math.sin(s.sph) * H * .012, breath = Math.sin(s.br * TAU) * H * .004;
      const hip = [0, -LEG + s.hy + drop - bob + shake];
      const legs = [0, 1].map(i => {
        const phi = ph + i * Math.PI, u = ((phi / TAU) % 1 + 1) % 1;
        let cx, cy;
        if (u < .5) { cx = S / 2 - 2 * S * u; cy = 0; } else { const v = (u - .5) / .5; cx = -S / 2 + S * (1 - Math.cos(Math.PI * v)) / 2; cy = -LIFT * Math.sin(Math.PI * v); }
        const tx = W * cx + (1 - W) * (i ? s.ft2 : s.ft1), ty = W * cy;
        const dx = tx - hip[0], dy = ty - hip[1], d = Math.hypot(dx, dy);
        const dm = Math.min(Math.max(d, Math.abs(TH - SH) + .01), LEG - .01), bs = Math.atan2(dy, dx);
        const al = Math.acos(Math.min(1, Math.max(-1, (TH * TH + dm * dm - SH * SH) / (2 * TH * dm))));
        const kA = [hip[0] + TH * Math.cos(bs + al), hip[1] + TH * Math.sin(bs + al)], kB = [hip[0] + TH * Math.cos(bs - al), hip[1] + TH * Math.sin(bs - al)];
        const kn = kA[0] > kB[0] ? kA : kB, an = [hip[0] + dm * Math.cos(bs), hip[1] + dm * Math.sin(bs)];
        const lI = Math.atan2(kn[0] - hip[0], kn[1] - hip[1]) / R, kI = Math.atan2(an[0] - kn[0], an[1] - kn[1]) / R - lI;
        const l = lI + ((i ? s.l2 : s.l1) - lI) * s.fk, k = kI + ((i ? s.k2 : s.k1) - kI) * s.fk;
        const knee = [hip[0] + TH * Math.sin(l * R), hip[1] + TH * Math.cos(l * R)];
        const ank = [knee[0] + SH * Math.sin((l + k) * R), knee[1] + SH * Math.cos((l + k) * R)];
        const toe = [ank[0] + FT * Math.cos((l + k) * R), ank[1] - FT * Math.sin((l + k) * R)];
        return { knee, ank, toe };
      });
      const lean = s.lean + W * 4;
      const up = [Math.sin(lean * R), -Math.cos(lean * R)], back = [-Math.cos(lean * R), -Math.sin(lean * R)];
      const neck = [hip[0] + TO * up[0], hip[1] + TO * up[1] - breath];
      const ctrl = [(hip[0] + neck[0]) / 2 + s.curv * back[0], (hip[1] + neck[1]) / 2 + s.curv * back[1]];
      const sh = [hip[0] + TO * .93 * up[0] + s.curv * .35 * back[0], hip[1] + TO * .93 * up[1] + s.curv * .35 * back[1] - breath];
      const G = s.gest, gp = s.gph, wv = s.wave * Math.sin(s.wph);
      const A = [[s.a1 - W * 24 * Math.cos(ph) + G * 30 * Math.sin(gp), s.e1 + W * 10 + G * 34 * Math.sin(1.3 * gp + 1) + wv * 28],
                 [s.a2 + W * 24 * Math.cos(ph) + G * 26 * Math.sin(gp + 2.2), s.e2 + W * 10 + G * 30 * Math.sin(1.1 * gp + .4)]];
      const arms = A.map(([a, e]) => { const el = [sh[0] + UA * Math.sin(a * R), sh[1] + UA * Math.cos(a * R)]; return { el, wr: [el[0] + FA * Math.sin((a + e) * R), el[1] + FA * Math.cos((a + e) * R)] }; });
      const hd = lean + s.head, head = [neck[0] + (NK + HR) * Math.sin(hd * R), neck[1] - (NK + HR) * Math.cos(hd * R)];
      return { hip, legs, neck, ctrl, sh, arms, head, hd };
    }
    // 局部坐标 → 整张图的坐标
    const toWorld = (s, p) => { const a = s.rot * R, x = p[0] * s.f * s.sc, y = p[1] * s.sc; return [s.x + x * Math.cos(a) - y * Math.sin(a), s.y - s.jump + x * Math.sin(a) + y * Math.cos(a)]; };
    function draw() {
      const s = st, g = geom(s);
      root.setAttribute('transform', `translate(${n1(s.x)},${n1(s.y - s.jump)}) rotate(${n1(s.rot)}) scale(${(s.f * s.sc).toFixed(3)},${s.sc.toFixed(3)})`);
      const L = g.legs;
      legN.setAttribute('d', `M${pt(g.hip)} L${pt(L[0].knee)} L${pt(L[0].ank)} L${pt(L[0].toe)}`);
      legF.setAttribute('d', `M${pt(g.hip)} L${pt(L[1].knee)} L${pt(L[1].ank)} L${pt(L[1].toe)}`);
      torso.setAttribute('d', `M${pt(g.hip)} Q${pt(g.ctrl)} ${pt(g.neck)}`);
      armN.setAttribute('d', `M${pt(g.sh)} L${pt(g.arms[0].el)} L${pt(g.arms[0].wr)}`);
      armF.setAttribute('d', `M${pt(g.sh)} L${pt(g.arms[1].el)} L${pt(g.arms[1].wr)}`);
      handN.setAttribute('cx', n1(g.arms[0].wr[0])); handN.setAttribute('cy', n1(g.arms[0].wr[1]));
      handF.setAttribute('cx', n1(g.arms[1].wr[0])); handF.setAttribute('cy', n1(g.arms[1].wr[1]));
      headG.setAttribute('transform', `translate(${pt(g.head)}) rotate(${n1(g.hd)})`);
      if (dress) {
        const up = [Math.sin((s.lean) * R), -Math.cos((s.lean) * R)], wa = [g.hip[0] + TO * .3 * up[0], g.hip[1] + TO * .3 * up[1]];
        const ks = [L[0].knee, L[1].knee], kx1 = Math.max(ks[0][0], ks[1][0]), kx0 = Math.min(ks[0][0], ks[1][0]), ky = Math.max(ks[0][1], ks[1][1]) + H * .05;
        const hf = [Math.max(kx1 + H * .05, g.hip[0] + H * .1), ky + H * .04], hb = [Math.min(kx0 - H * .05, g.hip[0] - H * .1), ky + H * .04];
        const d = `M${pt([wa[0] + H * .03, wa[1]])} L${pt(hf)} Q${pt([(hf[0] + hb[0]) / 2, ky + H * .02])} ${pt(hb)} L${pt([wa[0] - H * .03, wa[1]])} Z`;
        dress.setAttribute('d', d); dressFill.setAttribute('d', d);
      }
      for (const h of holds) {
        const p = typeof h.hand === 'string' ? g.arms[+h.hand.slice(1) - 1].el : g.arms[h.hand - 1].wr;   // 1、2 是手；'e1'、'e2' 是肘
        if (h.rel) { const a = g.arms[h.rel - 1]; h.el.st && (h.el.st.rot = Math.atan2(a.wr[1] - a.el[1], a.wr[0] - a.el[0]) / R + (h.rot || 0)); }   // 跟着小臂的方向（婴儿躺在小臂上）
        if (h.el.st) { h.el.st.x = p[0] + h.dx; h.el.st.y = p[1] + h.dy; h.el.draw(); }
        else h.el.setAttribute('transform', `translate(${n1(p[0] + h.dx)},${n1(p[1] + h.dy)}) rotate(${h.rot || 0})`);
      }
    }
    const F = { st, root, outer, body, headG, mitre, H, HR, LEG, TH, SH, TO, c, w, draw, geom, faces: FC.F, FC, cur: { ...st }, face };
    // 计划里的姿势（搭的时候按时间顺序记下来，算手在哪儿、走到哪儿用）
    F.handAt = (i = 1, s = F.cur) => toWorld(s, geom(s).arms[i - 1].wr);
    F.elbowAt = (i = 1, s = F.cur) => toWorld(s, geom(s).arms[i - 1].el);
    F.chestAt = (s = F.cur) => { const g = geom(s); return toWorld(s, [g.hip[0] * .4 + g.neck[0] * .6, g.hip[1] * .4 + g.neck[1] * .6]); };
    F.headAt = (s = F.cur) => toWorld(s, geom(s).head);
    F.at = (p, s = F.cur) => toWorld(s, p);
    F.hold = (el, hand = 1, dx = 0, dy = 0, rot = 0, rel = 0) => { holds.push({ el, hand, dx, dy, rot, rel }); draw(); };
    F.to = (tl, t, d, props, ease = 'power2.inOut') => {
      Object.assign(F.cur, props);
      tl.to(st, { ...props, duration: d, ease, onUpdate: draw }, t); return F;
    };
    F.set = (tl, t, props) => { Object.assign(F.cur, props); tl.set(st, { ...props, onUpdate: draw }, t); return F; };
    F.pose = (tl, t, name, d = .6, extra = {}, ease) => F.to(tl, t, d, { ...(typeof name === 'string' ? POSE[name](F) : name), ...extra }, ease);
    // 走到 x1：步子按距离分，开始、停下都是双脚并拢；朝向自动转过去
    F.walk = (tl, t, x1, d, o2 = {}) => {
      const x0 = F.cur.x, D = Math.abs(x1 - x0); if (D < 1) return F;
      const dir = x1 > x0 ? 1 : -1;
      if (Math.sign(F.cur.f) !== dir) { F.to(tl, t, .3, { f: dir * Math.abs(F.cur.f || 1) }, 'sine.inOut'); t += .25; d -= .25; }
      const S0 = o2.stride || LEG * .6, k = Math.max(1, Math.round(D / S0)), S = D / k;
      F.set(tl, t, { stride: S });
      const ph1 = F.cur.ph + k * Math.PI;
      F.to(tl, t, d, { x: x1, ph: ph1 }, o2.ease || 'sine.inOut');
      F.to(tl, t, Math.min(.35, d / 3), { walk: o2.amp ?? 1 }, 'sine.out');
      F.to(tl, t + d - Math.min(.4, d / 3), Math.min(.4, d / 3), { walk: 0 }, 'sine.in');
      return F;
    };
    F.turn = (tl, t, dir, d = .35) => F.to(tl, t, d, { f: dir }, 'sine.inOut');
    F.gesture = (tl, t, d, amp = 1, hz = 1.6) => { F.to(tl, t, .3, { gest: amp }, 'sine.out'); F.to(tl, t, d, { gph: F.cur.gph + d * hz * TAU }, 'none'); F.to(tl, t + d - .3, .3, { gest: 0 }, 'sine.in'); return F; };
    F.waveHand = (tl, t, d, amp = 1, hz = 2.2) => { F.to(tl, t, .25, { wave: amp }, 'sine.out'); F.to(tl, t, d, { wph: F.cur.wph + d * hz * TAU }, 'none'); F.to(tl, t + d - .25, .25, { wave: 0 }, 'sine.in'); return F; };
    F.shakeBody = (tl, t, d, amp = 1, hz = 5) => { F.to(tl, t, .2, { shake: amp }, 'sine.out'); F.to(tl, t, d, { sph: F.cur.sph + d * hz * TAU }, 'none'); F.to(tl, t + d - .3, .3, { shake: 0 }, 'sine.in'); return F; };
    F.breathe = (tl, t0, t1) => F.to(tl, t0, Math.max(.1, t1 - t0), { br: F.cur.br + (t1 - t0) / 3.4 }, 'none');
    F.nod = (tl, t, n = 2, amp = 10, d = .22) => { const h0 = F.cur.head; tl.to(st, { head: h0 + amp, duration: d, yoyo: true, repeat: 2 * n - 1, ease: 'sine.inOut', onUpdate: draw }, t); return F; };
    F.hop = (tl, t, hgt = H * .08, n = 1, d = .28) => { tl.to(st, { jump: hgt, duration: d, yoyo: true, repeat: 2 * n - 1, ease: 'sine.out', onUpdate: draw }, t); return F; };
    F.face = (tl, t, name, d = .25) => { if (name === F.cur._face && F.cur._face) return F; const a = FC.F[F.cur._face || face], b = FC.F[name]; if (a !== b) { tl.to(a, { opacity: 0, duration: d }, t); tl.to(b, { opacity: 1, duration: d }, t); } F.cur._face = name; return F; };
    F.cur._face = face;
    // 说话：嘴一张一合（换成说话的脸，说完换回来）
    F.talk = (tl, t, d, kind = 'talk', back) => {
      const prev = F.cur._face; F.face(tl, t, kind, .15);
      const mo = FC.F[kind]._mo, ry = +mo.getAttribute('ry'), n = Math.max(1, Math.round(d / .17));
      tl.fromTo(mo, { attr: { ry: ry * .35 } }, { attr: { ry: ry * 1.25 }, duration: .085, yoyo: true, repeat: 2 * n - 1, ease: 'sine.inOut', immediateRender: false }, t);
      F.face(tl, t + d, back || prev, .2); return F;
    };
    F.tears = (tl, t, d) => { drops(tl, FC.tears, t, d, HR); return F; };
    F.sweat = (tl, t, d = 1.2) => { tl.fromTo(FC.sweat, { opacity: 0, y: -HR * .1 }, { opacity: 1, y: 0, duration: .3, immediateRender: false }, t); tl.to(FC.sweat, { opacity: 0, y: HR * .35, duration: .5 }, t + d); return F; };
    F.show = (tl, t, d = .7, from = {}) => { gsap.set(outer, { opacity: 0 }); tl.fromTo(outer, { opacity: 0, y: 0, ...from }, { opacity: 1, x: 0, y: 0, duration: d, ease: 'power2.out', immediateRender: false }, t); return F; };
    F.fade = (tl, t, o = 0, d = .7) => { tl.to(outer, { opacity: o, duration: d }, t); return F; };
    draw();
    return F;
  }

  // ── 姿势（POSE.名字(F) 返回一组关节角度；腿按身高算）
  const STAND = F => ({ a1: 8, e1: 14, a2: -8, e2: 14, lean: 0, head: 0, hy: 0, fk: 0, ft1: F.H * .035, ft2: -F.H * .035, l1: 0, k1: 0, l2: 0, k2: 0, curv: 0 });
  const POSE = {
    stand: STAND,
    relax: F => ({ ...STAND(F), a1: 4, e1: 8, a2: -4, e2: 8 }),
    tense: F => ({ ...STAND(F), a1: 4, e1: 50, a2: -2, e2: 55, lean: -2, head: 4 }),
    open: F => ({ ...STAND(F), a1: 118, e1: -8, a2: -110, e2: -8, head: -6 }),           // 张开双臂
    up: F => ({ ...STAND(F), a1: 160, e1: 4, a2: 150, e2: 8, head: -22, lean: -4 }),     // 举手向上
    reachUp: F => ({ ...STAND(F), a1: 140, e1: 8, a2: 128, e2: 14, head: -24 }),
    wave: F => ({ ...STAND(F), a1: 150, e1: 24 }),
    point: F => ({ ...STAND(F), a1: 82, e1: 4 }),
    pointUp: F => ({ ...STAND(F), a1: 128, e1: 4 }),
    shrug: F => ({ ...STAND(F), a1: 22, e1: 82, a2: -18, e2: 96, head: -6 }),
    cross: F => ({ ...STAND(F), a1: 12, e1: 92, a2: 18, e2: 84, lean: -3, head: -4 }),  // 抱着胳膊（侧面）
    crossF: F => ({ ...STAND(F), a1: 24, e1: -104, a2: -24, e2: 104, ft1: F.H * .06, ft2: -F.H * .06 }),   // 正面抱着胳膊（配 look: 0 的正脸）
    pray: F => ({ ...STAND(F), a1: 32, e1: 98, a2: 38, e2: 92, head: 14 }),
    bow: F => ({ ...STAND(F), a1: 18, e1: 22, a2: 6, e2: 18, lean: 28, head: 16 }),
    carry: F => ({ ...STAND(F), a1: 44, e1: 52, a2: 40, e2: 58 }),
    give: F => ({ ...STAND(F), a1: 72, e1: 18, a2: 62, e2: 24, lean: 6 }),
    cradle: F => ({ ...STAND(F), a1: 16, e1: 76, a2: 30, e2: 58, head: 22 }),            // 抱着婴儿（婴儿躺在近手的小臂上：hold(婴儿, 'e1', 0, -婴儿半径*.85, 0, 1)）
    hug: F => ({ ...STAND(F), a1: 56, e1: 86, a2: 46, e2: 92, head: 10 }),
    think: F => ({ ...STAND(F), a1: 28, e1: 142, a2: 16, e2: 88, head: 6 }),
    face: F => ({ ...STAND(F), a1: 34, e1: 146, a2: 30, e2: 150, head: 18, lean: 8 }),  // 双手捂脸
    reach: F => ({ ...STAND(F), a1: 86, e1: 2, a2: 40, e2: 50, lean: 8 }),
    kneel: F => ({ ...STAND(F), fk: 1, hy: F.SH, l1: 0, k1: -90, l2: 0, k2: -90, a1: 10, e1: 20, a2: -6, e2: 20 }),
    kneelPray: F => ({ ...POSE.kneel(F), a1: 40, e1: 96, a2: 44, e2: 90, lean: 6, head: 16 }),
    kneelUp: F => ({ ...POSE.kneel(F), a1: 150, e1: 8, a2: 140, e2: 12, lean: -4, head: -20 }),
    kneel1: F => ({ ...STAND(F), fk: 1, hy: F.SH, l1: 90, k1: -90, l2: 0, k2: -90, a1: 30, e1: 40, a2: -4, e2: 20 }),
    sit: F => ({ ...STAND(F), fk: 1, hy: F.TH, l1: 90, k1: -90, l2: 84, k2: -86, a1: 22, e1: 50, a2: 18, e2: 56 }),   // 坐在椅子上（椅面高 = 小腿长）
    sitFloor: F => ({ ...STAND(F), fk: 1, hy: F.LEG - F.H * .02, l1: 88, k1: -4, l2: 84, k2: -2, a1: 20, e1: 30, a2: 10, e2: 30 }),
    hugKnees: F => ({ ...STAND(F), fk: 1, hy: F.LEG - F.H * .02, l1: 142, k1: -150, l2: 136, k2: -146, a1: 58, e1: 58, a2: 52, e2: 62, lean: 12, head: 18 }),
    squat: F => ({ ...STAND(F), hy: F.LEG * .42, ft1: F.H * .06, ft2: -F.H * .01, lean: 18, a1: 40, e1: 40, a2: 30, e2: 46 }),
    lie: F => ({ ...STAND(F), fk: 1, hy: F.LEG - F.H * .02, l1: 90, k1: 0, l2: 90, k2: 0, lean: -90, head: 0, a1: 84, e1: 4, a2: 80, e2: 4 }),  // 平躺（头在身后）
  };

  // ── 婴儿：裹在襁褓里。本地坐标：头在原点，身体往右伸；rot 转整个婴儿（0 是躺着、头在左，90 是竖着、头在上，抱在怀里大约 20–30），脸一直是正的
  function baby(par, o = {}) {
    const r = o.r || 20, c = o.c || PAPER, w = o.w || Math.max(2.8, r * .17), svg = svgOf(par);
    const st = Object.assign({ x: 0, y: 0, rot: 0, sc: 1, a1: -50, a2: -20, wig: 0, wph: 0, head: 0, shake: 0, sph: 0, kick: 0, kph: 0 }, o.st || {});
    st.x = o.x ?? st.x; st.y = o.y ?? st.y; st.rot = o.rot ?? st.rot;
    const outer = mk('g', { opacity: o.op ?? 1 }, par), root = mk('g', {}, outer), body = mk('g', { filter: `url(#${figGlow(svg)})` }, root);
    const S = { stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const feet = mk('path', { ...S, fill: 'none', opacity: .8 }, body);
    mk('path', { ...S, d: `M${r * .5},${-r * .86} C${r * 1.95},${-r * 1.38} ${r * 3.25},${-r * .98} ${r * 3.5},${-r * .06} C${r * 3.58},${r * .86} ${r * 2.3},${r * 1.26} ${r * .55},${r * .92}`, fill: 'rgba(30,28,30,.55)' }, body);
    mk('path', { ...S, d: `M${r * 1.5},${-r * 1.05} Q${r * 2.05},${r * .05} ${r * 1.55},${r * 1.08}`, fill: 'none', 'stroke-width': w * .62, opacity: .55 }, body);
    const arms = [0, 1].map(() => mk('path', { ...S, fill: 'none' }, body)), hands = [0, 1].map(() => mk('circle', { r: w * .95, fill: c }, body));
    const headG = mk('g', {}, body);
    mk('circle', { cx: 0, cy: 0, r, fill: INK, stroke: c, 'stroke-width': w }, headG);
    mk('path', { d: `M${-r * .2},${-r * .98} q${r * .12},${-r * .3} ${r * .34},${-r * .18}`, fill: 'none', stroke: c, 'stroke-width': w * .7, 'stroke-linecap': 'round' }, headG);   // 一小撮头发
    const FC = faces(headG, r, c, w, 0, true);
    let face = o.face || 'content'; gsap.set(FC.F[face], { opacity: 1 });
    function draw() {
      const s = st, sh = s.shake * Math.sin(s.sph);
      root.setAttribute('transform', `translate(${n1(s.x)},${n1(s.y)}) rotate(${n1(s.rot + sh * 5)}) scale(${s.sc.toFixed(3)})`);
      const A = [s.a1 + s.wig * 38 * Math.sin(s.wph), s.a2 + s.wig * 34 * Math.sin(s.wph * 1.17 + 2)];
      arms.forEach((p, i) => { const sx = r * (1.25 + i * .18), sy = -r * (.72 - i * .1), L = r * .95, a = A[i] * R;
        const ex = sx + L * .55 * Math.cos(a - .35), ey = sy + L * .55 * Math.sin(a - .35), hx = sx + L * Math.cos(a), hy = sy + L * Math.sin(a);
        p.setAttribute('d', `M${n1(sx)},${n1(sy)} Q${n1(ex)},${n1(ey)} ${n1(hx)},${n1(hy)}`); hands[i].setAttribute('cx', n1(hx)); hands[i].setAttribute('cy', n1(hy)); });
      const k = s.kick * Math.sin(s.kph), k2 = s.kick * Math.sin(s.kph + 2.4);
      feet.setAttribute('d', `M${n1(r * 3.3)},${n1(-r * .4)} l${n1(r * .55 + k * r * .3)},${n1(-r * .35 - k * r * .4)} M${n1(r * 3.3)},${n1(r * .3)} l${n1(r * .55 + k2 * r * .3)},${n1(r * .3 - k2 * r * .4)}`);
      headG.setAttribute('transform', `rotate(${n1(-(s.rot + sh * 5) + s.head)})`);
    }
    const B = { st, root, outer, r, c, draw, faces: FC.F, FC, cur: { ...st, _face: face } };
    B.to = (tl, t, d, props, ease = 'power2.inOut') => { Object.assign(B.cur, props); tl.to(st, { ...props, duration: d, ease, onUpdate: draw }, t); return B; };
    B.set = (tl, t, props) => { Object.assign(B.cur, props); tl.set(st, { ...props, onUpdate: draw }, t); return B; };
    B.face = (tl, t, name, d = .25) => { if (name === B.cur._face) return B; tl.to(FC.F[B.cur._face], { opacity: 0, duration: d }, t); tl.to(FC.F[name], { opacity: 1, duration: d }, t); B.cur._face = name; return B; };
    B.flail = (tl, t, d, amp = 1, hz = 3) => { B.to(tl, t, .2, { wig: amp, kick: amp }, 'sine.out'); B.to(tl, t, d, { wph: B.cur.wph + d * hz * TAU, kph: B.cur.kph + d * hz * 1.2 * TAU }, 'none'); B.to(tl, t + d - .3, .3, { wig: 0, kick: 0 }, 'sine.in'); return B; };
    B.shakeBody = (tl, t, d, amp = 1, hz = 4) => { B.to(tl, t, .2, { shake: amp }, 'sine.out'); B.to(tl, t, d, { sph: B.cur.sph + d * hz * TAU }, 'none'); B.to(tl, t + d - .3, .3, { shake: 0 }, 'sine.in'); return B; };
    B.tears = (tl, t, d) => { drops(tl, FC.tears, t, d, r); return B; };
    B.show = (tl, t, d = .7) => { gsap.set(outer, { opacity: 0 }); tl.to(outer, { opacity: 1, duration: d }, t); return B; };
    B.fade = (tl, t, o = 0, d = .7) => { tl.to(outer, { opacity: o, duration: d }, t); return B; };
    draw();
    return B;
  }

  // ── 小道具、效果
  // 一根不描线、一直看得见的线（道具用；要描线出来的用 AH.line + DRAW）
  const stroke = (par, d, o = {}) => mk('path', { d, fill: o.fill || 'none', stroke: o.c || PAPER, 'stroke-width': o.w || 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.op ?? 1, ...(o.glow === false ? {} : { filter: `url(#${figGlow(svgOf(par))})` }) }, par);
  // 能描线出来的线（描完以后跟别的线一样）
  const pen = (par, d, o = {}) => line(par, d, { c: o.c || PAPER, w: o.w || 3, go: o.go ?? .2, glow: o.glow });
  const shown = g => { gsap.set(g._p || g, { strokeDashoffset: 0 }); return g; };
  // 地面：两头淡出去的一条线
  function ground(par, x0, x1, y, o = {}) {
    const svg = svgOf(par), id = 'gd' + svg._uid + '_' + (++ground.n);
    grad(svg.querySelector('defs'), id, 'linearGradient', { x1: x0, y1: 0, x2: x1, y2: 0 }, [[0, o.c || '#cdbfa3', 0], [.18, o.c || '#cdbfa3', o.a ?? .5], [.82, o.c || '#cdbfa3', o.a ?? .5], [1, o.c || '#cdbfa3', 0]]);
    return mk('path', { d: `M${x0},${y} L${x1},${y}`, stroke: `url(#${id})`, 'stroke-width': o.w || 2.4, fill: 'none', opacity: o.op ?? 1 }, par);
  }
  ground.n = 0;
  // 光（代表神的同在、慈爱：只用光，不画人形）
  function glow(par, x, y, r, o = {}) {
    const svg = svgOf(par), id = 'gl' + svg._uid + '_' + (++glow.n), g = mk('g', { opacity: o.op ?? 0 }, par);
    const fill = grad(svg.querySelector('defs'), id, 'radialGradient', { cx: x, cy: y, r }, [[0, o.c0 || '#fff3cf', o.a ?? .9], [.35, o.c1 || '#ffe2a0', (o.a ?? .9) * .45], [1, GOLD, 0]]);
    const disc = mk('circle', { cx: x, cy: y, r, fill }, g);
    let rays = null;
    if (o.rays) {
      rays = mk('g', {}, g); const rid = id + 'r';
      grad(svg.querySelector('defs'), rid, 'radialGradient', { cx: x, cy: y, r: r * 1.7 }, [[0, '#fff1c8', o.ray ?? .26], [.55, '#fff1c8', (o.ray ?? .26) * .35], [1, '#fff1c8', 0]]);
      for (let i = 0; i < o.rays; i++) { const a = i / o.rays * TAU + (o.ra || 0), ww = .05 + .03 * ((i * 7) % 3) / 2, a1 = a - ww, a2 = a + ww, L = r * (1.35 + .35 * ((i * 5) % 4) / 3);
        mk('path', { d: `M${x},${y} L${n1(x + L * Math.cos(a1))},${n1(y + L * Math.sin(a1))} L${n1(x + L * Math.cos(a2))},${n1(y + L * Math.sin(a2))} Z`, fill: `url(#${rid})` }, rays); }
    }
    g._disc = disc; g._rays = rays; g._c = [x, y];
    return g;
  }
  glow.n = 0;
  // 气泡：说话（say）/ 想（think）/ 喊（shout）；中心 (x, y)，宽高 bw、bh，尾巴指向 (tx, ty)。g.inner 里放内容。POP 弹出来
  function bubble(par, x, y, bw, bh, tx, ty, o = {}) {
    const g = mk('g', { opacity: 0 }, par), c = o.c || PAPER, kind = o.kind || 'say';
    const fill = o.fill || 'rgba(12,12,18,.78)', S = { fill, stroke: c, 'stroke-width': o.w || 2.6, 'stroke-linejoin': 'round' };
    const x0 = x - bw / 2, y0 = y - bh / 2, rr = Math.min(bh / 2, o.rr || 22);
    if (kind === 'think') {
      const k = Math.max(6, Math.round((bw + bh) / 34)); let d = '';
      for (let i = 0; i < k; i++) { const a = i / k * TAU, a2 = (i + 1) / k * TAU, px = x + bw / 2 * Math.cos(a), py = y + bh / 2 * Math.sin(a), qx = x + bw / 2 * Math.cos(a2), qy = y + bh / 2 * Math.sin(a2), m = (a + a2) / 2;
        d += (i ? '' : `M${n1(px)},${n1(py)}`) + ` Q${n1(x + bw / 2 * 1.28 * Math.cos(m))},${n1(y + bh / 2 * 1.34 * Math.sin(m))} ${n1(qx)},${n1(qy)}`; }
      mk('path', { d: d + ' Z', ...S }, g);
      const dx = tx - x, dy = ty - y; [.62, .78, .9].forEach((f, i) => mk('circle', { cx: n1(x + dx * f), cy: n1(y + dy * f), r: 7 - i * 2, ...S }, g));
    } else {
      // 圆角框 + 一个尖尾巴（尾巴从框边上离尾巴最近的地方伸出）
      const cx = Math.min(Math.max(tx, x0 + rr + 14), x0 + bw - rr - 14), below = ty > y;
      const ey = below ? y0 + bh : y0, sgn = below ? 1 : -1;
      const d = `M${x0 + rr},${y0} L${x0 + bw - rr},${y0} Q${x0 + bw},${y0} ${x0 + bw},${y0 + rr} L${x0 + bw},${y0 + bh - rr} Q${x0 + bw},${y0 + bh} ${x0 + bw - rr},${y0 + bh} ` +
        (below ? `L${cx + 13},${ey} L${tx},${ty} L${cx - 13},${ey} ` : '') + `L${x0 + rr},${y0 + bh} Q${x0},${y0 + bh} ${x0},${y0 + bh - rr} L${x0},${y0 + rr} Q${x0},${y0} ${x0 + rr},${y0} ` + (below ? '' : `M${cx - 13},${ey} L${tx},${ty} L${cx + 13},${ey}`) + ' Z';
      if (kind === 'shout') { let s = ''; const k = 14; for (let i = 0; i <= k; i++) { const a = i / k * TAU, rr2 = i % 2 ? 1 : 1.18; s += (i ? ' L' : 'M') + `${n1(x + bw / 2 * rr2 * Math.cos(a))},${n1(y + bh / 2 * rr2 * Math.sin(a))}`; } mk('path', { d: s + ' Z', ...S }, g); mk('path', { d: `M${n1(x + (tx - x) * .45 - 10)},${n1(y + (ty - y) * .45)} L${tx},${ty} L${n1(x + (tx - x) * .45 + 10)},${n1(y + (ty - y) * .45)}`, ...S }, g); }
      else mk('path', { d, ...S }, g);
    }
    g.inner = mk('g', {}, g); g._o = `${tx} ${ty}`; g._c = [x, y];
    if (o.t) { const tt = text(g.inner, x, y + (o.s || 30) * .36, o.t, { s: o.s || 30, c: o.tc || c, font: o.font || 'LXGW WenKai', wt: 400, ls: o.ls ?? '0.06em' }); g._t = tt; }
    return g;
  }
  const POP = (tl, g, t, d = .55) => { gsap.set(g, { opacity: 0 }); tl.fromTo(g, { opacity: 0, scale: .55, svgOrigin: g._o }, { opacity: 1, scale: 1, duration: d, ease: 'back.out(2)', immediateRender: false }, t); };
  const UNPOP = (tl, g, t, d = .45) => tl.to(g, { opacity: 0, scale: .8, svgOrigin: g._o, duration: d, ease: 'power2.in' }, t);
  // 心、Z、星星：从 (x, y) 往上飘、淡出
  const HEART = (x, y, s) => `M${x},${y + s * .9} C${x - s * 1.4},${y - s * .1} ${x - s * .9},${y - s * 1.2} ${x},${y - s * .45} C${x + s * .9},${y - s * 1.2} ${x + s * 1.4},${y - s * .1} ${x},${y + s * .9} Z`;
  function hearts(tl, par, x, y, t, n = 3, o = {}) {
    const c = o.c || CORAL, s = o.s || 12, out = [];
    for (let i = 0; i < n; i++) {
      const dx = (i % 2 ? 1 : -1) * (8 + i * 9), h = mk('path', { d: HEART(x + dx, y, s * (1 - i * .08)), fill: rgba(c, .5), stroke: c, 'stroke-width': 2, opacity: 0 }, par);
      const t1 = t + i * (o.gap || .38);
      tl.fromTo(h, { opacity: 0, y: 6, scale: .5, transformOrigin: '50% 50%' }, { opacity: 1, y: -24, scale: 1, duration: .6, ease: 'back.out(2)', immediateRender: false }, t1);
      tl.to(h, { opacity: 0, y: -(o.rise || 90), x: dx * .5, duration: o.life || 1.6, ease: 'sine.in' }, t1 + .6); out.push(h);
    }
    return out;
  }
  function zzz(tl, par, x, y, t, d, o = {}) {
    const c = o.c || '#d6e2f2', cyc = 1.9, n = Math.max(1, Math.floor(d / .62));
    for (let i = 0; i < n; i++) {
      const z = text(par, x, y, 'z', { s: (o.s || 34) * (1 + (i % 3) * .18), c, font: 'Cormorant Garamond', wt: 500, ls: 0 }); gsap.set(z, { opacity: 0 });
      const t1 = t + i * .62;
      tl.fromTo(z, { opacity: 0, x: 0, y: 0, scale: .6, transformOrigin: '50% 50%' }, { opacity: 1, x: 14, y: -18, scale: 1, duration: cyc * .35, ease: 'sine.out', immediateRender: false }, t1);
      tl.to(z, { opacity: 0, x: 34, y: -52, scale: 1.3, duration: cyc * .65, ease: 'sine.in' }, t1 + cyc * .35);
    }
  }
  function haha(tl, par, x, y, t, d, o = {}) {
    const n = Math.max(1, Math.floor(d / .55)), c = o.c || WARM, words = o.words || ['哈', '哈'];
    for (let i = 0; i < n; i++) {
      const w = text(par, x + (i % 2 ? 26 : -8), y, words[i % words.length], { s: o.s || 26, c, font: 'LXGW WenKai', wt: 400, ls: 0 }); gsap.set(w, { opacity: 0 });
      tl.fromTo(w, { opacity: 0, y: 8, rotation: i % 2 ? 12 : -12, transformOrigin: '50% 50%' }, { opacity: 1, y: -10, duration: .3, ease: 'back.out(2)', immediateRender: false }, t + i * .55);
      tl.to(w, { opacity: 0, y: -44, duration: .7, ease: 'sine.in' }, t + i * .55 + .3);
    }
  }
  // 一圈小星光（“亮了一下”）
  function sparkle(tl, par, x, y, t, o = {}) {
    const g = mk('g', { opacity: 0 }, par), c = o.c || '#fff1c8', r = o.r || 26;
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mk('path', { d: `M${n1(x + r * .45 * Math.cos(a))},${n1(y + r * .45 * Math.sin(a))} L${n1(x + r * Math.cos(a))},${n1(y + r * Math.sin(a))}`, stroke: c, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g); }
    tl.fromTo(g, { opacity: 0, scale: .4, svgOrigin: `${x} ${y}` }, { opacity: 1, scale: 1, duration: .35, ease: 'power2.out', immediateRender: false }, t);
    tl.to(g, { opacity: 0, scale: 1.3, svgOrigin: `${x} ${y}`, duration: .5 }, t + .35);
    return g;
  }
  // 字：淡入（SHOW）
  const label = (par, x, y, t, o = {}) => text(par, x, y, t, { s: o.s || 30, c: o.c || WARM, font: o.font || 'LXGW WenKai', wt: o.wt || 400, ls: o.ls, a: o.a });


  // ── 试姿势用的总览（animtest.html?anim=figdemo&demo=1）：一排排小人摆各种姿势、做表情，再走两步
  window.ANIMS = window.ANIMS || {};
  window.ANIMS.figdemo = function ({ tl, el, AT, s }) {
    const { svg } = window.AH.base(el, 560), F = window.FIG;
    F.ground(svg, 0, 1000, 260, { a: .3 }); F.ground(svg, 0, 1000, 530, { a: .3 });
    // 上排：走路的人（0.5–3.5 秒走过去）、蹲下又站起来、坐下、跪下祷告
    const w = F.person(svg, { x: 60, y: 260, h: 200 }); w.walk(tl, .5, 380, 3);
    w.face(tl, 3.6, 'smile'); w.pose(tl, 3.8, 'wave', .5); w.waveHand(tl, 4.2, 2);
    const q = F.person(svg, { x: 520, y: 260, h: 200 }); q.pose(tl, .5, 'squat', .7); q.pose(tl, 2, 'stand', .7); q.pose(tl, 3, 'sit', .01); q.face(tl, 3, 'talk');
    const k = F.person(svg, { x: 700, y: 260, h: 200, f: -1 }); k.pose(tl, .6, 'kneelPray', .9); k.pose(tl, 3, 'kneelUp', .9); k.face(tl, 3, 'look');
    const l = F.person(svg, { x: 940, y: 260, h: 200 }); l.pose(tl, .2, 'lie', .01); l.face(tl, .2, 'sleep', .01); l.to(tl, 2.5, 1.2, { lean: -5 }); l.face(tl, 3, 'tired');
    // 下排：哭、笑、说话（手比画）、抱婴儿的母亲、婴儿（哭、睡）、小孩跳
    const c = F.person(svg, { x: 70, y: 530, h: 200 }); c.pose(tl, .3, 'face', .5); c.face(tl, .3, 'cry'); c.tears(tl, .5, 3); c.shakeBody(tl, .5, 3, .8);
    const h = F.person(svg, { x: 230, y: 530, h: 200 }); h.face(tl, .3, 'laugh'); h.pose(tl, .3, { a1: 40, e1: 100, a2: 30, e2: 110, lean: -8, head: -12 }, .5); h.shakeBody(tl, .5, 3); F.haha(tl, svg, 270, 300, .6, 3);
    const t = F.person(svg, { x: 400, y: 530, h: 200 }); t.gesture(tl, .3, 4, 1); t.talk(tl, .3, 4, 'talkf');
    const m = F.person(svg, { x: 590, y: 530, h: 200, dress: true, veil: true }); m.pose(tl, .2, 'cradle', .01); m.face(tl, .2, 'smile', .01);
    const b = F.baby(m.root, { r: 12.5 }); m.hold(b, 'e1', 0, -11, 0, 1);
    const b2 = F.baby(svg, { x: 690, y: 500, r: 20, face: 'sleep' }); b2.face(tl, 1.8, 'cry'); b2.flail(tl, 1.8, 2.2); b2.tears(tl, 1.8, 2.2); b2.face(tl, 4.2, 'content'); F.zzz(tl, svg, 700, 470, .2, 1.4);
    const ch = F.person(svg, { x: 900, y: 530, h: 130, kind: 'child', hair: true }); ch.face(tl, .3, 'laugh'); ch.hop(tl, .5, 14, 3); ch.pose(tl, .4, 'up', .4);
  };


  // ════════ 第八讲（卷一第六章上）的例子 ════════
  const A = window.ANIMS = window.ANIMS || {};
  const OPT = (AT, s, k, dflt) => s[k] !== undefined ? AT(s[k]) : dflt;
  // 椅子、桌子（侧面）：按坐着的人的身材算高度（坐姿的臀部高 = 小腿长）
  const chair = (par, P, x, y, f = 1, o = {}) => stroke(par, `M${x - f * P.H * .1},${y - P.SH} L${x + f * P.H * .13},${y - P.SH} M${x - f * P.H * .08},${y - P.SH} L${x - f * P.H * .08},${y} M${x + f * P.H * .11},${y - P.SH} L${x + f * P.H * .11},${y} M${x - f * P.H * .1},${y - P.SH} L${x - f * P.H * .14},${y - P.SH - P.H * .3}`, { c: o.c || '#bfae92', w: o.w || 3, op: o.op ?? .85 });
  const desk = (par, x0, x1, top, y, o = {}) => stroke(par, `M${x0 - 8},${top} L${x1 + 8},${top} M${x0},${top} L${x0},${y} M${x1},${top} L${x1},${y}`, { c: o.c || '#bfae92', w: o.w || 3.2, op: o.op ?? .85 });
  // 一张纸（深色底、纸色边）上的几行字：返回 { g, lines: [...] }，各行用 SHOW 出来
  function page(par, x, y, w, h, title, rows, o = {}) {
    const g = mk('g', { opacity: 0 }, par);
    mk('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 6, fill: 'rgba(14,13,16,.82)', stroke: o.c || '#d9c9a8', 'stroke-width': 2.4 }, g);
    if (title) { text(g, x, y - h / 2 + 44, title, { s: o.ts || 30, c: GOLD, ls: '0.3em' }); mk('path', { d: `M${x - w / 2 + 26},${y - h / 2 + 62} L${x + w / 2 - 26},${y - h / 2 + 62}`, stroke: '#8f8270', 'stroke-width': 1.4 }, g); }
    const lines = rows.map((r, i) => label(g, x - w / 2 + 34, y - h / 2 + (title ? 104 : 50) + i * (o.lh || 44), r, { s: o.s || 30, c: o.tc || PAPER, a: 'start' }));
    return { g, lines };
  }

  // 从哪儿讲起：左边一个人坐在桌前写回忆录，“我生于某年、某地、某月，父亲是谁，母亲是谁”一行行写出来；
  // 右边奥古斯丁跪在光里，开口第一句是“请允许我”，第二件事是“我不知道”（摊开手）
  A.memoir = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 520), GY = 440;
    const t0 = AT(s.at), tA = OPT(AT, s, 'aug', t0 + 8), tP = OPT(AT, s, 'please', tA + 3), tK = OPT(AT, s, 'know', tP + 3.5);
    ground(svg, 30, 470, GY, { a: .4 }); ground(svg, 530, 970, GY, { a: .4 });
    const div = pen(svg, 'M500,90 L500,470', { c: '#6f6658', w: 2, go: .1 });
    // 左：写回忆录的人
    const L = mk('g', {}, svg);
    const wr = person(L, { x: 150, y: GY, h: 210, op: 0 }); wr.pose(tl, 0, 'sit', .01, { a1: 62, e1: 30, a2: 54, e2: 40, head: 22, lean: 6 });
    const ch = chair(L, wr, 150, GY); const dk = desk(L, 205, 380, GY - wr.SH - wr.H * .16, GY);
    gsap.set([ch, dk], { opacity: 0 });
    const quill = mk('path', { d: 'M0,0 L16,-26 Q22,-40 14,-46 Q8,-34 2,-26', fill: 'rgba(241,232,214,.25)', stroke: PAPER, 'stroke-width': 2 }, wr.root); wr.hold(quill, 1, 0, 0);
    mk('rect', { x: 236, y: GY - wr.SH - wr.H * .16 - 6, width: 70, height: 6, fill: PAPER, opacity: .7 }, L);
    const lamp = glow(L, 352, GY - wr.SH - wr.H * .16 - 30, 70, { a: .55, c0: '#ffd9a0', c1: '#f0b070' });
    stroke(L, `M336,${GY - wr.SH - wr.H * .16} Q352,${GY - wr.SH - wr.H * .16 - 14} 368,${GY - wr.SH - wr.H * .16} Z M352,${GY - wr.SH - wr.H * .16 - 10} q-5,-12 0,-22 q5,10 0,22`, { c: '#f3c98a', w: 2.2 });
    const pg = page(L, 236, 138, 320, 228, '回 忆 录', ['我生于某年，', '某地，某月；', '父亲是谁，', '母亲是谁……'], { s: 29, lh: 39 });
    L.appendChild(pg.g);
    const capL = label(svg, 250, 505, '一般人的回忆录', { s: 28, c: '#cdbfa3' });
    // 右：奥古斯丁
    const lightG = glow(svg, 900, 96, 170, { rays: 13, a: .85 });
    const floor = mk('ellipse', { cx: 720, cy: GY, rx: 170, ry: 22, fill: grad(svg.querySelector('defs'), 'mf' + svg._uid, 'radialGradient', { cx: 720, cy: GY, r: 170 }, [[0, '#ffe2a0', .32], [1, '#ffe2a0', 0]]), opacity: 0 }, svg);
    svg.insertBefore(floor, svg.firstChild.nextSibling);
    const au = person(svg, { x: 690, y: GY, h: 210, op: 0, mitre: false }); au.pose(tl, 0, 'kneelPray', .01);
    const b1 = bubble(svg, 640, 168, 210, 66, 676, 232, { t: '请允许我……', s: 32 });
    const b2 = bubble(svg, 846, 238, 200, 66, 742, 262, { t: '我不知道。', s: 32 });
    const capR = label(svg, 750, 505, '奥古斯丁', { s: 28, c: GOLD });
    gsap.set([capL, capR], { opacity: 0 });
    // 时间轴
    DRAW(tl, div, t0, .9); tl.to([ch, dk], { opacity: 1, duration: .8 }, t0 + .1); tl.to(lamp, { opacity: 1, duration: 1.2 }, t0 + .3);
    wr.show(tl, t0 + .2, .8, { y: 10 }); wr.face(tl, t0 + .2, 'neutral', .01);
    tl.fromTo(pg.g, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, ease: 'power2.out', immediateRender: false }, t0 + .5);
    SHOW(tl, capL, t0 + .8);
    wr.waveHand(tl, t0 + .6, tA - t0 - .4, .3, 3.2);
    const rows = [OPT(AT, s, 'y1', t0 + 3), OPT(AT, s, 'y2', t0 + 4.3), OPT(AT, s, 'y3', t0 + 6), OPT(AT, s, 'y4', t0 + 7)];
    pg.lines.forEach((ln, i) => SHOW(tl, ln, rows[i] - .05, .6));
    tl.to(L, { opacity: .32, duration: 1 }, tA); tl.to(capL, { opacity: .4, duration: 1 }, tA);
    tl.to(lightG, { opacity: .75, duration: 1.4 }, tA); tl.to(floor, { opacity: 1, duration: 1.6 }, tA + .3); au.show(tl, tA + .2, 1, { y: 8 }); SHOW(tl, capR, tA + .6);
    tl.to(lightG._rays, { rotation: 18, svgOrigin: '900 96', duration: Math.max(4, tK - tA + 6), ease: 'none' }, tA);
    // “请允许我”：低头、手往前伸开（求）
    au.pose(tl, tP - .3, 'kneel', .7, { a1: 64, e1: 34, a2: 58, e2: 40, lean: 10, head: 14 }); au.face(tl, tP - .2, 'smile');
    POP(tl, b1, tP); tl.to(lightG, { opacity: 1, duration: 1.2 }, tP + .2);
    // “我不知道”：抬头、摊开手
    tl.to(b1, { opacity: .35, duration: .5 }, tK - .2);
    au.pose(tl, tK - .2, 'kneel', .6, { a1: 26, e1: 86, a2: 18, e2: 98, lean: -2, head: -10 }); au.face(tl, tK - .1, 'look');
    POP(tl, b2, tK);
  };


  // 法庭和慈爱：左边法官坐在高台后面，一个人站在台前，提心吊胆，说的每句话都变成“证据”飞到台上；
  // 说到“在慈爱面前”，他转身走到右边的光里，跪下来，把最不体面的事说出来（慈爱只画成光，不画人形）
  A.court = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 540), GY = 462, defs = svg.querySelector('defs');
    const t0 = AT(s.at), tM0 = OPT(AT, s, 'love', t0 + 3), tC = OPT(AT, s, 'court', t0 + 8), tT = OPT(AT, s, 'talk', tC + 2), tE = OPT(AT, s, 'evid', tT + 1.8), tM = OPT(AT, s, 'mercy', tE + 1.2), tS = OPT(AT, s, 'say', tM + 2.4);
    ground(svg, 30, 480, GY, { a: .4 }); ground(svg, 520, 980, GY, { a: .4 });
    const div = pen(svg, 'M500,96 L500,486', { c: '#6f6658', w: 2, go: .1 });
    const tL = label(svg, 230, 64, '法 庭', { s: 38, c: '#cdbfa3', font: 'Noto Serif SC', wt: 500 }), tR = label(svg, 790, 64, '慈 爱', { s: 38, c: GOLD, font: 'Noto Serif SC', wt: 500 });
    // 法官（台子挡住下半身）
    const court = mk('g', {}, svg);
    const judge = person(court, { x: 214, y: 404, h: 236, c: '#cdbfa3', op: 0 }); judge.pose(tl, 0, 'stand', .01, { a1: 62, e1: 58, a2: 30, e2: 70 }); judge.face(tl, 0, 'angry', .01);
    const gavel = mk('g', {}, judge.root); mk('path', { d: 'M0,0 L22,-30', stroke: '#cdbfa3', 'stroke-width': 4, 'stroke-linecap': 'round' }, gavel); mk('rect', { x: 8, y: -46, width: 30, height: 16, rx: 3, transform: 'rotate(36 23 -38)', fill: 'rgba(205,191,163,.3)', stroke: '#cdbfa3', 'stroke-width': 3 }, gavel); judge.hold(gavel, 1);
    const bench = mk('g', { opacity: 0 }, court);
    mk('path', { d: `M110,284 L344,284 L344,${GY} L110,${GY} Z`, fill: '#0b0b0f', stroke: '#bfb3a0', 'stroke-width': 3.2 }, bench);
    mk('path', { d: `M96,284 L358,284 M128,318 L326,318 M150,352 L150,430 M304,352 L304,430`, fill: 'none', stroke: '#bfb3a0', 'stroke-width': 2.4, opacity: .7 }, bench);
    // 那个人
    const man = person(svg, { x: 440, y: GY, h: 214, f: -1, op: 0 });
    const tags = [0, 1, 2].map(i => { const g = mk('g', { opacity: 0 }, svg);
      mk('rect', { x: -36, y: -15, width: 72, height: 30, rx: 4, fill: 'rgba(200,120,100,.2)', stroke: '#e0a08c', 'stroke-width': 2 }, g);
      label(g, 0, 8, '证据', { s: 20, c: '#f0c2b2', ls: '0.2em', font: 'Noto Serif SC', wt: 500 }); return g; });
    // 光
    const lightG = glow(svg, 820, 196, 175, { rays: 13, a: .9 });
    const floor = mk('ellipse', { cx: 740, cy: GY, rx: 200, ry: 24, fill: grad(defs, 'cf' + svg._uid, 'radialGradient', { cx: 740, cy: GY, r: 200 }, [[0, '#ffe2a0', .34], [1, '#ffe2a0', 0]]), opacity: 0 }, svg);
    svg.insertBefore(floor, court);
    const ring = glow(svg, 736, 378, 150, { a: .5, c0: '#ffeccc', c1: '#ffd98a' });
    const bub = bubble(svg, 860, 258, 170, 92, 772, 330, {});
    stroke(bub.inner, 'M812,236 q14,-20 26,0 t26,0 t24,0 M806,262 q18,18 34,-2 q12,-16 24,4 q14,18 30,-6 M816,284 l16,-8 l12,10 l18,-12 l14,8', { c: '#e8c9ab', w: 2.6, glow: false });
    const cL = label(svg, 250, 524, '每一句，都可能被拿去当证据', { s: 27, c: '#e0b4a4' }), cR = label(svg, 750, 524, '最不体面的事，也可以说出来', { s: 27, c: WARM });
    gsap.set([tL, tR, cL, cR], { opacity: 0 });
    // 开场：法庭画出来，法官、那个人出来；说到“慈爱”，右边亮起来
    DRAW(tl, div, t0, .9); SHOW(tl, tL, t0 + .2);
    tl.to(bench, { opacity: 1, duration: .9 }, t0 + .9); judge.show(tl, t0 + 1.1, .9); man.show(tl, t0 + .5, .8, { y: 8 });
    judge.breathe(tl, t0, tM + 6); man.breathe(tl, t0, tC);
    tl.to(lightG, { opacity: .55, duration: 1.4 }, tM0); SHOW(tl, tR, tM0 + .2);
    tl.to(lightG._rays, { rotation: 22, svgOrigin: '820 196', duration: tS - tM0 + 6, ease: 'none' }, tM0);
    // “在法官面前你得小心”：缩着、冒汗，法官敲槌
    man.pose(tl, tC, 'tense', .6); man.face(tl, tC, 'worry'); man.sweat(tl, tC + .4, tM - tC - .4);
    judge.to(tl, tC + .5, .22, { a1: 96, e1: 74 }, 'power2.out'); judge.to(tl, tC + .72, .14, { a1: 66, e1: 30 }, 'power3.in');
    judge.to(tl, tC + 1.2, .5, { a1: 62, e1: 58 });
    man.talk(tl, tT, Math.max(.8, tE - tT), 'talk', 'worry');
    tags.forEach((g, i) => { const t = tE + i * .4;
      tl.fromTo(g, { opacity: 0, x: 420, y: 300, rotation: 0 }, { opacity: 1, x: 150 + i * 78, y: 266 - (i % 2) * 6, rotation: i % 2 ? -6 : 5, duration: .9, ease: 'power2.out', immediateRender: false }, t); });
    SHOW(tl, cL, tE + .2);
    // “在慈爱面前”：法庭暗下去，他转身走进光里
    tl.to([court, ...tags, tL], { opacity: .28, duration: .9 }, tM); tl.to(cL, { opacity: .4, duration: .9 }, tM);
    tl.to(lightG, { opacity: 1, duration: 1.2 }, tM); tl.to(floor, { opacity: 1, duration: 1.4 }, tM + .3);
    man.face(tl, tM, 'neutral'); man.pose(tl, tM, 'stand', .4);
    man.walk(tl, tM + .1, 720, Math.max(1.2, tS - tM - .5));
    // “最不体面的事情说出来”：跪下，张开手说；光把他围起来
    man.pose(tl, tS - .35, 'kneel', .6, { a1: 64, e1: 40, a2: 54, e2: 46, lean: 8, head: 4 }); man.face(tl, tS - .3, 'sad');
    man.talk(tl, tS + .2, 1.3, 'talk', 'smile'); POP(tl, bub, tS + .1); SHOW(tl, cR, tS + .3);
    tl.fromTo(ring, { opacity: 0, scale: .5, svgOrigin: '736 378' }, { opacity: 1, scale: 1, svgOrigin: '736 378', duration: 1.4, ease: 'sine.out', immediateRender: false }, tS + .9);
    sparkle(tl, svg, 742, 300, tS + 1.5, { r: 34 });
  };


  // 写给谁看：四十三岁、有名的主教、修辞学名师（主教冠落到头上），在书里写自己怎么吃奶、怎么哭闹；
  // 旁边一群人指着笑“这有什么好写的？” → 他抬手：不是写给你们看的 → 转向左上的光，把书举起来：写给神的慈爱听的
  A.mock = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 500), GY = 430;
    const t0 = AT(s.at), tAge = OPT(AT, s, 'age', t0 + 1.6), tBis = OPT(AT, s, 'bishop', tAge + 2), tRh = OPT(AT, s, 'rhet', tBis + 2.3),
      tMilk = OPT(AT, s, 'milk', tRh + 4.5), tCry = OPT(AT, s, 'cry', tMilk + 1.4), tLaugh = OPT(AT, s, 'laugh', tCry + 1.5), tWhat = OPT(AT, s, 'what', tLaugh + 1.1),
      tNot = OPT(AT, s, 'not', tWhat + 2.8), tLove = OPT(AT, s, 'love', tNot + 2);
    ground(svg, 60, 960, GY, { a: .38 });
    const lightG = glow(svg, 118, 92, 170, { rays: 11, a: .85 });
    const au = person(svg, { x: 330, y: GY, h: 212, mitre: true, op: 0 }); au.pose(tl, 0, 'sit', .01, { a1: 60, e1: 30, a2: 52, e2: 40, head: 20, lean: 6 });
    gsap.set(au.mitre, { opacity: 0 });
    const ch = chair(svg, au, 330, GY), dk = desk(svg, 386, 540, GY - au.SH - au.H * .16, GY); gsap.set([ch, dk], { opacity: 0 });
    const quill = mk('path', { d: 'M0,0 L16,-26 Q22,-40 14,-46 Q8,-34 2,-26', fill: 'rgba(241,232,214,.25)', stroke: PAPER, 'stroke-width': 2 }, au.root); au.hold(quill, 1);
    const book = mk('g', { opacity: 0 }, svg); mk('path', { d: `M412,${GY - au.SH - au.H * .16 - 3} L470,${GY - au.SH - au.H * .16 - 12} L528,${GY - au.SH - au.H * .16 - 3}`, fill: 'none', stroke: PAPER, 'stroke-width': 3 }, book);
    // 书页：写的是吃奶、哭闹（页上两个小婴儿）
    const pg = page(svg, 486, 118, 280, 168, '忏 悔 录', [], {});
    const bA = baby(pg.g, { x: 418, y: 162, r: 13, face: 'suck', op: 0 }), bB = baby(pg.g, { x: 520, y: 162, r: 13, face: 'cry', op: 0 });
    const milkDot = mk('circle', { cx: 404, cy: 140, r: 5, fill: '#f6efe0', opacity: 0 }, pg.g);
    const lM = label(pg.g, 432, 200, '吃奶', { s: 22, c: '#cdbfa3' }), lC = label(pg.g, 538, 200, '哭闹', { s: 22, c: '#cdbfa3' }); gsap.set([lM, lC], { opacity: 0 });
    // 三个标签：四十三岁 / 有名的主教 / 修辞学名师
    const tag = (y, t) => { const g = mk('g', { opacity: 0 }, svg); mk('rect', { x: 66, y: y - 22, width: 168, height: 42, rx: 21, fill: 'rgba(226,189,118,.1)', stroke: '#c9a86a', 'stroke-width': 2 }, g); label(g, 150, y + 9, t, { s: 25, c: WARM }); return g; };
    const tags = [tag(206, '四十三岁'), tag(262, '有名的主教'), tag(318, '修辞学名师')];
    // 笑他的人
    const mk3 = [[742, 1, 168], [836, 0, 182], [922, 2, 160]].map(([x, k, h]) => { const p = person(svg, { x, y: GY, h, f: -1, c: SKY, op: 0 }); return p; });
    const bub = bubble(svg, 820, 128, 290, 70, 832, 204, { t: '这有什么好写的？', s: 31, c: '#c9d6ea', kind: 'say' });
    const cap1 = label(svg, 345, 488, '我不是写给你们看的，', { s: 30, c: '#cdbfa3' }), cap2 = label(svg, 668, 488, '是写给神的慈爱听的。', { s: 30, c: GOLD });
    gsap.set([cap1, cap2], { opacity: 0 });
    // 开场
    tl.to([ch, dk, book], { opacity: 1, duration: .8 }, t0); au.show(tl, t0 + .15, .8, { y: 8 }); au.breathe(tl, t0, tLove + 4);
    au.waveHand(tl, t0 + .5, tLaugh - t0 - .3, .28, 3);
    SHOW(tl, tags[0], tAge); SHOW(tl, tags[1], tBis);
    tl.fromTo(au.mitre, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .7, ease: 'bounce.out', immediateRender: false }, tBis + .1);
    sparkle(tl, svg, au.headAt()[0], au.headAt()[1] - 40, tBis + .6, { r: 28 });
    SHOW(tl, tags[2], tRh);
    tl.to(tags, { opacity: .3, duration: .8 }, tMilk - .6);
    tl.fromTo(pg.g, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out', immediateRender: false }, tMilk - .7);
    bA.show(tl, tMilk, .5); tl.to(lM, { opacity: 1, duration: .5 }, tMilk + .2); tl.fromTo(milkDot, { opacity: 0 }, { opacity: 1, duration: .3, yoyo: true, repeat: 3, immediateRender: false }, tMilk + .2);
    bB.show(tl, tCry, .5); tl.to(lC, { opacity: 1, duration: .5 }, tCry + .2); bB.flail(tl, tCry + .2, 2.4, .9); bB.tears(tl, tCry + .2, 2.4);
    // 有人笑
    mk3.forEach((p, i) => { p.show(tl, tLaugh - .3 + i * .18, .6, { y: 6 }); p.face(tl, tLaugh - .3, 'laugh', .01);
      p.pose(tl, tLaugh - .3 + i * .18, i === 1 ? 'point' : { a1: 40, e1: 110, a2: 20, e2: 100, lean: -6, head: -8 }, .5); p.shakeBody(tl, tLaugh + i * .15, tNot - tLaugh, .9, 5 + i); });
    haha(tl, svg, 790, 210, tLaugh + .2, tNot - tLaugh - .3, { c: '#c9d6ea' });
    au.waveHand(tl, tLaugh, .01, 0); au.face(tl, tLaugh + .3, 'worry'); au.to(tl, tLaugh + .2, .5, { head: 4 });
    POP(tl, bub, tWhat);
    // 不是写给你们看的：抬手挡住，那些人淡下去
    au.to(tl, tNot - .2, .6, { a1: 96, e1: 64, head: -2, lean: 0 }); au.face(tl, tNot, 'frown'); SHOW(tl, cap1, tNot + .1);
    tl.to([...mk3.map(p => p.outer), bub], { opacity: .22, duration: 1 }, tNot + .5);
    // 写给神的慈爱听：转向左上的光，把书举起来
    tl.to(lightG, { opacity: 1, duration: 1.4 }, tLove - .2); tl.to(lightG._rays, { rotation: -16, svgOrigin: '118 92', duration: 6, ease: 'none' }, tLove - .2);
    au.turn(tl, tLove - .1, -1, .45); au.to(tl, tLove + .3, .7, { a1: 150, e1: 18, a2: 140, e2: 22, head: -22, lean: -6 }); au.face(tl, tLove + .3, 'happy');
    tl.to(book, { opacity: 0, duration: .4 }, tLove + .2);
    const held = mk('path', { d: 'M-22,-6 L0,-14 L22,-6 L22,10 L0,2 L-22,10 Z', fill: 'rgba(226,189,118,.25)', stroke: GOLD, 'stroke-width': 2.4, opacity: 0 }, au.root); au.hold(held, 1, 4, -10);
    tl.to(held, { opacity: 1, duration: .4 }, tLove + .5);
    SHOW(tl, cap2, tLove + .2);
    tl.to([pg.g, ...tags], { opacity: .25, duration: .8 }, tLove + .4);
  };

  // 看不见的观众：一个人跪着祷告 → 身后浮出一圈虚影（观众），他偷偷回头，挺直腰、举起手“表演”，观众举起打分牌
  // → 四面画出一间屋子，门关上，观众散去 → 他安静下来，上面一束柔光（在暗中的父）
  A.audience = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 520), GY = 440, X = 500;
    const t0 = AT(s.at), tC = OPT(AT, s, 'crowd', t0 + 2.5), tA = OPT(AT, s, 'ask', tC + 2), tA2 = OPT(AT, s, 'ask2', tA + 1.7),
      tD = OPT(AT, s, 'door', tA2 + 5), tS = OPT(AT, s, 'shut', tD + 1.6), tL = OPT(AT, s, 'light', tS + 2.2), tSee = OPT(AT, s, 'see', tL + 1.6);
    ground(svg, 80, 920, GY, { a: .35 });
    const man = person(svg, { x: X, y: GY, h: 210, op: 0 }); man.pose(tl, 0, 'kneelPray', .01); man.face(tl, 0, 'sleep', .01);
    const crowd = [[105, 175, 1], [192, 166, 1], [272, 158, 1], [728, 158, -1], [808, 166, -1], [895, 175, -1]].map(([x, h, f]) => person(svg, { x: x + (f > 0 ? 0 : 0), y: GY - 30, h, f, c: SKY, op: 0 }));
    const cards = crowd.map((p, i) => { const g = mk('g', { opacity: 0 }, p.root); mk('rect', { x: -21, y: -52, width: 42, height: 42, rx: 4, fill: 'rgba(12,14,20,.88)', stroke: '#c9d6ea', 'stroke-width': 2.2 }, g);
      const t = text(g, 0, -20, ['7', '5', '8', '6', '9', '4'][i], { s: 32, c: '#e6eefa', font: 'Cormorant Garamond', wt: 500, ls: 0 }); t.setAttribute('transform', 'scale(' + (p.st.f) + ',1)'); p.hold(g, 1, 0, 0); return g; });
    const b1 = text(svg, 250, 92, '好不好听？', { s: 30, c: '#c9d6ea', font: 'LXGW WenKai', wt: 400 }), b2 = text(svg, 750, 92, '像不像属灵的人？', { s: 30, c: '#c9d6ea', font: 'LXGW WenKai', wt: 400 });
    const room = pen(svg, `M${X - 175},${GY} L${X - 175},${GY - 270} L${X + 175},${GY - 270} L${X + 175},${GY}`, { c: PAPER, w: 3, go: .18 });
    const doorF = pen(svg, `M${X + 88},${GY} L${X + 88},${GY - 160} L${X + 160},${GY - 160} L${X + 160},${GY}`, { c: PAPER, w: 2.6, go: .15 });
    const leaf = mk('rect', { x: X + 88, y: GY - 160, width: 72, height: 160, fill: 'rgba(241,232,214,.12)', stroke: PAPER, 'stroke-width': 2.4, opacity: 0 }, svg);
    const beam = mk('path', { d: `M${X - 34},${GY - 270} L${X + 34},${GY - 270} L${X + 120},${GY} L${X - 120},${GY} Z`, fill: grad(defs, 'bm2' + svg._uid, 'linearGradient', { x1: 0, y1: GY - 270, x2: 0, y2: GY }, [[0, '#ffe7b0', .6], [1, '#ffe7b0', .04]]), opacity: 0 }, svg);
    svg.insertBefore(beam, svg.firstChild.nextSibling);
    const lab = label(svg, X, 506, '在暗中的父', { s: 32, c: GOLD });
    gsap.set([b1, b2, lab], { opacity: 0 });
    man.show(tl, t0, .9, { y: 8 }); man.breathe(tl, t0, tSee + 3);
    // 观众浮出来
    crowd.forEach((p, i) => { tl.fromTo(p.outer, { opacity: 0, y: 10 }, { opacity: .5, y: 0, duration: .9, ease: 'power2.out', immediateRender: false }, tC + .1 + i * .16); });
    // 他回头看一眼，挺直、举手“表演”，观众举牌
    man.face(tl, tA - .4, 'neutral'); man.turn(tl, tA - .3, -1, .3); man.turn(tl, tA + .5, 1, .3);
    man.pose(tl, tA + .8, 'kneelUp', .6, { a1: 150, e1: 24, a2: -40, e2: 30, head: -14 }); man.face(tl, tA + .8, 'grin'); man.sweat(tl, tA + 1.2, tS - tA - 1.2);
    SHOW(tl, b1, tA); SHOW(tl, b2, tA2);
    cards.forEach((g, i) => { crowd[i].pose(tl, tA2 + .3 + i * .12, { a1: 150, e1: 10 }, .4); tl.to(g, { opacity: 1, duration: .3 }, tA2 + .5 + i * .12); });
    // 进屋、关门
    DRAW(tl, room, tD, 1.2); DRAW(tl, doorF, tD + .6, .8);
    tl.fromTo(leaf, { opacity: 0, scaleX: .08, svgOrigin: `${X + 160} ${GY}` }, { opacity: 1, scaleX: 1, duration: .8, ease: 'power2.inOut', immediateRender: false }, tS);
    tl.to([...crowd.map(p => p.outer), b1, b2], { opacity: 0, duration: 1.1 }, tS + .5);
    man.pose(tl, tS + .6, 'kneelPray', .9); man.face(tl, tS + .8, 'sleep');
    tl.to(beam, { opacity: 1, duration: 1.6 }, tL); SHOW(tl, lab, tL + .5);
    sparkle(tl, svg, X + 6, GY - 150, tSee + .3, { r: 30 });
  };


  // 三四岁的孩子讲大事：孩子跑过来，皱着眉、比手画脚，气泡里的字颠三倒四地打转 → 大人忍不住笑了 → 下一秒把他抱起来，冒出心
  A.child = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 540), GY = 470;
    const t0 = AT(s.at), tTalk = OPT(AT, s, 'talk', t0 + 2.7), tFrown = OPT(AT, s, 'frown', tTalk + 2.6), tHand = OPT(AT, s, 'hands', tFrown + 1.1), tMess = OPT(AT, s, 'mess', tHand + 1.1),
      tLaugh = OPT(AT, s, 'laugh', tMess + 1.4), tNext = OPT(AT, s, 'next', tLaugh + 1.7), tUp = OPT(AT, s, 'up', tNext + 1.1), tNo = OPT(AT, s, 'no', tUp + 3.5), tLove = OPT(AT, s, 'love', tNo + 1.1);
    ground(svg, 60, 940, GY, { a: .38 });
    const warm = glow(svg, 620, 300, 280, { a: .45, c0: '#ffe9c4', c1: '#f6c98e' });
    const ad = person(svg, { x: 660, y: GY, h: 262, f: -1, op: 0 }); ad.pose(tl, 0, 'sit', .01, { a1: 30, e1: 40, a2: 24, e2: 48, head: 6 }); ad.face(tl, 0, 'smile', .01);
    const ch0 = chair(svg, ad, 660, GY, -1); gsap.set(ch0, { opacity: 0 });
    const kid = person(svg, { x: 90, y: GY, h: 152, kind: 'child', hair: true, op: 0 }); kid.face(tl, 0, 'smile', .01);
    // 气泡：先是“大事！”，后来字乱转
    const bub = bubble(svg, 300, 120, 300, 128, 430, 268, { c: WARM });
    const big = label(bub.inner, 300, 136, '一件大事！', { s: 44, c: GOLD, font: 'Noto Serif SC', wt: 700 });
    const words = ['然后', '那个', '就是', '嗯…', '然后', '?!'].map((w, i) => { const t = label(bub.inner, 210 + (i % 3) * 90, 108 + Math.floor(i / 3) * 52, w, { s: 31, c: WARM }); gsap.set(t, { opacity: 0 }); return t; });
    const c1 = label(svg, 405, 524, '没有看不起，', { s: 34, c: '#cdbfa3' }), c2 = label(svg, 610, 524, '只有疼爱。', { s: 34, c: GOLD });
    gsap.set([c1, c2], { opacity: 0 });
    // 开场：大人坐着，孩子跑过来
    tl.to(ch0, { opacity: 1, duration: .8 }, t0); ad.show(tl, t0, .8); ad.breathe(tl, t0, tLove + 3);
    kid.show(tl, t0 + .2, .4); kid.walk(tl, t0 + .2, 430, 1.6, { stride: 52 }); kid.face(tl, t0 + 1.9, 'neutral');
    // 讲大事
    kid.talk(tl, tTalk, tLaugh - tTalk - .2, 'talk', 'look'); POP(tl, bub, tTalk + .1);
    kid.pose(tl, tTalk, { a1: 60, e1: 50, a2: 40, e2: 60 }, .4);
    tl.fromTo(big, { scale: .8, transformOrigin: '50% 50%' }, { scale: 1.08, duration: .3, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }, tTalk + .4);
    kid.face(tl, tFrown, 'talkf', .2);
    const mo = kid.faces.talkf._mo, ry = +mo.getAttribute('ry'); tl.fromTo(mo, { attr: { ry: ry * .35 } }, { attr: { ry: ry * 1.25 }, duration: .085, yoyo: true, repeat: 2 * Math.round((tLaugh - tFrown) / .17) - 1, ease: 'sine.inOut', immediateRender: false }, tFrown);
    kid.gesture(tl, tHand - .1, tLaugh - tHand + .1, 1.3, 2.2); kid.hop(tl, tHand, 10, 3, .2);
    // 颠三倒四：“一件大事”散开，几个词在泡里乱转
    tl.to(big, { opacity: 0, scale: .6, rotation: -20, duration: .4 }, tMess);
    words.forEach((w, i) => { tl.fromTo(w, { opacity: 0, rotation: (i % 2 ? 1 : -1) * 40, transformOrigin: '50% 50%' }, { opacity: 1, rotation: (i % 2 ? -1 : 1) * 14, duration: .45, ease: 'back.out(2)', immediateRender: false }, tMess + .1 + i * .12);
      tl.to(w, { rotation: (i % 2 ? 1 : -1) * 18, y: (i % 2 ? -6 : 6), duration: .35, yoyo: true, repeat: 3, ease: 'sine.inOut' }, tMess + .6 + i * .12); });
    ad.nod(tl, tTalk + .5, 3, 7, .3);
    // 大人笑了
    ad.face(tl, tLaugh, 'laugh'); ad.to(tl, tLaugh, .4, { head: -10, lean: -6, a1: 40, e1: 96, a2: 30, e2: 100 }); ad.shakeBody(tl, tLaugh + .1, tNext - tLaugh, .9);
    haha(tl, svg, ad.headAt()[0] + 14, ad.headAt()[1] - 46, tLaugh + .1, tNext - tLaugh + .3, { s: 34 });
    kid.face(tl, tLaugh + .2, 'look'); kid.to(tl, tLaugh + .2, .4, { head: -8 });
    UNPOP(tl, bub, tNext);
    // 下一秒：俯身、伸手，把他抱起来
    ad.face(tl, tNext, 'smile'); ad.to(tl, tNext, .6, { lean: 22, head: 8, a1: 76, e1: 14, a2: 70, e2: 18 });
    const hugP = { lean: -4, head: 12, a1: 44, e1: 92, a2: 36, e2: 96 }, cur = { ...ad.cur, ...hugP };
    const hp = ad.handAt(1, cur);
    kid.pose(tl, tNext + .1, { a1: 140, e1: 20, a2: 130, e2: 24, head: -10 }, .5); kid.face(tl, tNext + .2, 'happy');
    ad.to(tl, tUp, .8, hugP);
    kid.to(tl, tUp, .8, { x: hp[0] - 4, y: hp[1] + kid.LEG * 1.02, fk: 1, l1: 28, k1: -46, l2: 18, k2: -40, a1: 120, e1: 50, a2: 110, e2: 56, head: 6 });
    hearts(tl, svg, 580, 170, tUp + .9, 4, { s: 16, gap: .5 });
    ad.face(tl, tUp + .5, 'happy');
    ad.to(tl, tUp + 1.3, 1.1, { lean: 2 }, 'sine.inOut'); ad.to(tl, tUp + 2.4, 1.1, { lean: -4 }, 'sine.inOut');
    tl.to(warm, { opacity: 1, duration: 1.6 }, tUp + .4);
    SHOW(tl, c1, tNo); SHOW(tl, c2, tLove); hearts(tl, svg, 610, 160, tLove + .2, 3, { s: 18, gap: .4 });
  };

  // 生物课：黑板上画出细胞一分二、二分四……到一个小婴儿，老师指着讲 → “可是它告诉不了你”：老师摊手，冒出问号
  // → 右边一大片暗暗的小点，其中一点亮起来，变成一个小小的人：偏偏是你
  A.biology = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 500), GY = 440;
    const t0 = AT(s.at), tB = OPT(AT, s, 'bio', t0 + .8), tT = OPT(AT, s, 'tell', tB + 2.5), tF = OPT(AT, s, 'form', tT + 1.8), tN = OPT(AT, s, 'not', tF + 2.1), tY = OPT(AT, s, 'you', tN + 4.8);
    ground(svg, 40, 960, GY, { a: .35 });
    const board = pen(svg, 'M70,70 L560,70 L560,330 L70,330 Z M60,330 L570,330', { c: '#9fb59a', w: 3.4, go: .15 });
    const boardFill = mk('rect', { x: 70, y: 70, width: 490, height: 260, fill: 'rgba(40,58,46,.35)', opacity: 0 }, svg);
    const hdr = label(svg, 315, 116, '生 物 课', { s: 30, c: '#cfe0c6', font: 'Noto Serif SC', wt: 500 });
    const chalk = '#e4eee0', C = (d, w = 2.6) => pen(svg, d, { c: chalk, w, go: .12 });
    const cell1 = C(circ(130, 220, 26)), ar1 = C('M168,220 L196,220 M188,212 L196,220 L188,228', 2.2);
    const cell2 = C(circ(226, 206, 18) + ' ' + circ(226, 238, 18)), ar2 = C('M258,220 L286,220 M278,212 L286,220 L278,228', 2.2);
    const cell4 = C(circ(310, 204, 13) + ' ' + circ(336, 204, 13) + ' ' + circ(310, 236, 13) + ' ' + circ(336, 236, 13)), ar3 = C('M362,220 L390,220 M382,212 L390,220 L382,228', 2.2);
    const emb = C('M440,190 C470,184 488,214 476,240 C466,262 432,262 424,240 C418,224 430,214 444,218 C456,222 456,236 446,240 M436,196 C424,182 434,170 450,176', 2.6);
    const lab2 = label(svg, 315, 300, '一个生命是怎么形成的', { s: 25, c: '#cfe0c6' });
    const tch = person(svg, { x: 650, y: GY, h: 214, f: -1, op: 0 }); tch.pose(tl, 0, 'stand', .01);
    const stick = mk('path', { d: 'M0,0 L52,-40', stroke: '#cdbfa3', 'stroke-width': 3, 'stroke-linecap': 'round' }, tch.root); tch.hold(stick, 1);
    const q = label(svg, 650, 160, '？', { s: 76, c: '#f0c2b2', font: 'Noto Serif SC', wt: 700 });
    // 一大片小点（所有可能的生命），其中一点亮起来
    const r = rng(7), dots = mk('g', { opacity: 0 }, svg);
    for (let i = 0; i < 46; i++) mk('circle', { cx: n1(740 + r() * 230), cy: n1(110 + r() * 300), r: n1(2 + r() * 2.2), fill: '#9fb0c8', opacity: n1(.3 + r() * .4) }, dots);
    const star = glow(svg, 862, 258, 90, { a: .95 });
    const you = person(svg, { x: 862, y: GY, h: 118, kind: 'child', hair: true, op: 0 }); you.face(tl, 0, 'smile', .01);
    const lYou = label(svg, 862, 486, '偏偏是你', { s: 32, c: GOLD });
    gsap.set([hdr, lab2, q, lYou], { opacity: 0 });
    DRAW(tl, board, t0, 1.2); tl.to(boardFill, { opacity: 1, duration: 1 }, t0 + .3); tch.show(tl, t0 + .3, .8); tch.breathe(tl, t0, tY + 3);
    SHOW(tl, hdr, tB);
    tch.pose(tl, tT, { a1: 112, e1: 6, lean: 4 }, .6);
    [[cell1, 0], [ar1, .45], [cell2, .6], [ar2, 1.05], [cell4, 1.2], [ar3, 1.65], [emb, 1.8]].forEach(([g, d]) => DRAW(tl, g, tF + d, .6));
    SHOW(tl, lab2, tF + 2.2);
    tch.talk(tl, tT, tN - tT - .2);
    // 告诉不了你：摊手、问号
    tch.pose(tl, tN, 'shrug', .6); tch.face(tl, tN + .1, 'worry'); POPT(tl, q, tN + .4);
    tl.to(dots, { opacity: 1, duration: 1.4 }, tN + 1.2);
    // 偏偏是你：一点亮起来，变成一个小人
    tl.to([board._p, boardFill, hdr, lab2, cell1, cell2, cell4, emb, ar1, ar2, ar3].flat(), { opacity: .3, duration: 1 }, tY);
    tl.fromTo(star, { opacity: 0, scale: .2, svgOrigin: '862 258' }, { opacity: 1, scale: 1, svgOrigin: '862 258', duration: .9, ease: 'power2.out', immediateRender: false }, tY - .2);
    tl.to(star, { scale: 1.6, opacity: .55, svgOrigin: '862 258', y: 110, duration: 1.2, ease: 'sine.inOut' }, tY + .7);
    you.show(tl, tY + .8, .9, { y: -12 }); SHOW(tl, lYou, tY + 1.1); tl.to(dots, { opacity: .35, duration: 1 }, tY + .6);
  };
  // 一个字（问号、感叹号）弹出来
  const POPT = (tl, t, at) => { gsap.set(t, { opacity: 0 }); tl.fromTo(t, { opacity: 0, scale: .4, transformOrigin: '50% 80%' }, { opacity: 1, scale: 1, duration: .6, ease: 'back.out(2.4)', immediateRender: false }, at); };


  // 人从出生那天起，就在往死亡走：一条路从摇篮通到墓碑，一个人沿路走过去，从小孩长成大人、再变成拄拐的老人；
  // 路上一格一格的日子，走过一格暗一格；角上一只沙漏在流 → “过一天，就少一天”
  A.lifewalk = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 500), GY = 410, X0 = 150, X1 = 830;
    const t0 = AT(s.at), tF = OPT(AT, s, 'flow', t0 + 4.4), t1 = OPT(AT, s, 'end', tF + 2.2);
    ground(svg, 40, 960, GY, { a: .4 });
    // 摇篮、墓碑
    const cradle = pen(svg, `M${X0 - 74},${GY - 40} Q${X0 - 40},${GY + 4} ${X0 - 6},${GY - 40} M${X0 - 70},${GY - 34} L${X0 - 10},${GY - 34} M${X0 - 70},${GY - 40} L${X0 - 80},${GY - 70}`, { c: WARM, w: 3, go: .2 });
    const tomb = pen(svg, `M${X1 + 40},${GY} L${X1 + 40},${GY - 74} Q${X1 + 70},${GY - 104} ${X1 + 100},${GY - 74} L${X1 + 100},${GY} M${X1 + 70},${GY - 76} L${X1 + 70},${GY - 34} M${X1 + 56},${GY - 62} L${X1 + 84},${GY - 62}`, { c: '#a9a090', w: 3, go: .15 });
    // 日子：路上一排小方格
    const days = []; for (let i = 0; i < 24; i++) { const x = X0 + 20 + i * ((X1 - X0 - 20) / 24); days.push([x, mk('rect', { x: x - 7, y: GY + 16, width: 14, height: 14, rx: 2, fill: rgba(GOLD, .5), stroke: GOLD, 'stroke-width': 1.4, opacity: 0 }, svg)]); }
    // 沙漏（左上）
    const HX = 860, HY = 120;
    const hg = pen(svg, `M${HX - 40},${HY - 64} L${HX + 40},${HY - 64} M${HX - 40},${HY + 64} L${HX + 40},${HY + 64} M${HX - 34},${HY - 64} C${HX - 34},${HY - 20} ${HX - 4},${HY - 8} ${HX - 4},${HY} C${HX - 4},${HY + 8} ${HX - 34},${HY + 20} ${HX - 34},${HY + 64} M${HX + 34},${HY - 64} C${HX + 34},${HY - 20} ${HX + 4},${HY - 8} ${HX + 4},${HY} C${HX + 4},${HY + 8} ${HX + 34},${HY + 20} ${HX + 34},${HY + 64}`, { c: PAPER, w: 2.6, go: .2 });
    const sandT = mk('path', { d: `M${HX - 28},${HY - 50} L${HX + 28},${HY - 50} C${HX + 18},${HY - 18} ${HX + 4},${HY - 6} ${HX},${HY - 2} C${HX - 4},${HY - 6} ${HX - 18},${HY - 18} ${HX - 28},${HY - 50} Z`, fill: 'rgba(226,189,118,.6)', opacity: 0 }, svg);
    const clip = mk('clipPath', { id: 'lw' + svg._uid }, defs), cr = mk('rect', { x: HX - 40, y: HY - 50, width: 80, height: 50 }, clip); sandT.setAttribute('clip-path', `url(#lw${svg._uid})`);
    const sandB = mk('path', { d: `M${HX - 30},${HY + 62} Q${HX},${HY + 20} ${HX + 30},${HY + 62} Z`, fill: 'rgba(226,189,118,.6)', opacity: 0 }, svg);
    const stream = mk('line', { x1: HX, y1: HY - 2, x2: HX, y2: HY + 60, stroke: GOLD, 'stroke-width': 2, opacity: 0 }, svg);
    gsap.set(sandB, { scaleY: .1, svgOrigin: `${HX} ${HY + 62}` });
    // 走路的人：小孩、大人、老人三个一起走，按年纪交叉淡化（看起来是一个人在长大、变老）
    const D = t1 - t0 - .3;
    const kid = person(svg, { x: X0, y: GY, h: 124, kind: 'child', hair: true, op: 0 }); kid.face(tl, 0, 'smile', .01);
    const man = person(svg, { x: X0, y: GY, h: 206, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const old = person(svg, { x: X0, y: GY, h: 196, op: 0, beard: true, c: '#d9cfbd' }); old.pose(tl, 0, 'stand', .01, { curv: 16, lean: 14, head: 6, a1: 40, e1: 8 }); old.face(tl, 0, 'tired', .01);
    const cane = mk('path', { d: 'M0,-4 L4,70 M0,-4 q-8,-10 -16,-2', stroke: '#d9cfbd', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, old.root); old.hold(cane, 1, 0, 0);
    [kid, man, old].forEach(p => p.walk(tl, t0 + .2, X1, D, { ease: 'none', stride: p === kid ? 46 : 64 }));
    const f1 = t0 + .2 + D * .3, f2 = t0 + .2 + D * .66;
    kid.show(tl, t0 + .1, .5); tl.to(kid.outer, { opacity: 0, duration: .6 }, f1 - .3);
    tl.fromTo(man.outer, { opacity: 0 }, { opacity: 1, duration: .6, immediateRender: false }, f1 - .3); tl.to(man.outer, { opacity: 0, duration: .6 }, f2 - .3);
    tl.fromTo(old.outer, { opacity: 0 }, { opacity: 1, duration: .6, immediateRender: false }, f2 - .3);
    const lab = label(svg, 500, 490, '过一天，就少一天', { s: 34, c: WARM });
    gsap.set(lab, { opacity: 0 });
    DRAW(tl, cradle, t0, .8); DRAW(tl, tomb, t0 + .3, .9); DRAW(tl, hg, t0 + .2, .9);
    days.forEach(([x, r], i) => { tl.to(r, { opacity: 1, duration: .3 }, t0 + .3 + i * .02); const tp = t0 + .2 + D * (x - X0) / (X1 - X0); tl.to(r, { opacity: .16, fill: 'rgba(120,110,95,.3)', stroke: '#6f6658', duration: .3 }, tp); });
    tl.to([sandT, sandB, stream], { opacity: 1, duration: .6 }, t0 + .4);
    tl.to(cr, { attr: { y: HY - 8, height: 8 }, duration: D, ease: 'none' }, t0 + .4); tl.to(sandB, { scaleY: 1, svgOrigin: `${HX} ${HY + 62}`, duration: D, ease: 'none' }, t0 + .4);
    SHOW(tl, lab, tF);
  };

  // 看起来活着：三个小场景（吃饭、工作、说笑），每个人胸口有一盏小灯 → “其实是死的”：灯一盏盏灭了，人变灰，可还在照样吃、照样做、照样笑
  A.alive = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 400;
    const t0 = AT(s.at), tE = OPT(AT, s, 'eat', t0 + 1.2), tW = OPT(AT, s, 'work', tE + .9), tJ = OPT(AT, s, 'joke', tW + .6), tD = OPT(AT, s, 'dead', tJ + .8), T1 = tD + 9;
    ground(svg, 40, 960, GY, { a: .35 });
    const lamp = (P) => { const g = mk('g', {}, P.root); mk('circle', { r: 22, fill: grad(defs, 'lp' + (++glow.n) + svg._uid, 'radialGradient', { cx: 0, cy: 0, r: 22 }, [[0, '#ffe9b8', .9], [1, '#ffd27a', 0]]) }, g); const h = mk('path', { d: HEART(0, 0, 7), fill: '#ffd98a', stroke: '#fff1c8', 'stroke-width': 1.2 }, g); const sm = mk('path', { d: HEART(0, 0, 7), fill: 'none', stroke: '#6f6a64', 'stroke-width': 1.6, opacity: 0 }, g);
      const gm = P.geom({ ...P.st, ...P.cur }); g.setAttribute('transform', `translate(${n1(gm.hip[0] * .45 + gm.neck[0] * .55)},${n1(gm.hip[1] * .45 + gm.neck[1] * .55)})`); g._on = [g.firstChild, h]; g._off = sm; return g; };
    // 1 吃饭
    const e = person(svg, { x: 150, y: GY, h: 196, op: 0 }); e.pose(tl, 0, 'sit', .01, { a1: 40, e1: 60, a2: 50, e2: 40, head: 8 });
    const ec = chair(svg, e, 150, GY), ed = desk(svg, 196, 300, GY - e.SH - e.H * .16, GY); const bowl = mk('path', { d: `M222,${GY - e.SH - e.H * .16 - 2} Q246,${GY - e.SH - e.H * .16 + 20} 270,${GY - e.SH - e.H * .16 - 2} Z`, fill: 'rgba(241,232,214,.15)', stroke: PAPER, 'stroke-width': 2.4 }, svg);
    const spoon = mk('path', { d: 'M0,0 L-14,-10', stroke: PAPER, 'stroke-width': 3, 'stroke-linecap': 'round' }, e.root); e.hold(spoon, 1);
    // 2 工作（敲键盘 / 写字）
    const w = person(svg, { x: 430, y: GY, h: 196, op: 0 }); w.pose(tl, 0, 'sit', .01, { a1: 58, e1: 34, a2: 50, e2: 40, head: 18, lean: 8 });
    const wc = chair(svg, w, 430, GY), wd = desk(svg, 478, 600, GY - w.SH - w.H * .16, GY);
    const scr = mk('path', { d: `M548,${GY - w.SH - w.H * .16} L548,${GY - w.SH - w.H * .16 - 52} L596,${GY - w.SH - w.H * .16 - 62} L596,${GY - w.SH - w.H * .16 - 6}`, fill: 'rgba(143,184,216,.12)', stroke: '#9fb0c8', 'stroke-width': 2.4 }, svg);
    // 3 说笑（两个人）
    const j1 = person(svg, { x: 760, y: GY, h: 200, op: 0 }), j2 = person(svg, { x: 880, y: GY, h: 192, f: -1, op: 0 });
    const ppl = [e, w, j1, j2];
    j1.pose(tl, 0, { a1: 40, e1: 100, a2: 20, e2: 90, head: -10 }, .01); j2.pose(tl, 0, 'point', .01);
    const lamps = ppl.map(lamp);
    const L1 = label(svg, 230, 452, '吃饭', { s: 28, c: WARM }), L2 = label(svg, 500, 452, '工作', { s: 28, c: WARM }), L3 = label(svg, 820, 452, '说笑', { s: 28, c: WARM });
    const props = [ec, ed, bowl, wc, wd, scr]; gsap.set([...props, L1, L2, L3], { opacity: 0 });
    tl.to(props, { opacity: 1, duration: .8 }, t0);
    ppl.forEach((p, i) => p.show(tl, t0 + .1 + i * .1, .7));
    // 各自的动作一直重复（灯灭了也照样）
    e.to(tl, t0 + .4, .01, {}); tl.to(e.st, { e1: 118, a1: 30, duration: .55, yoyo: true, repeat: Math.floor((T1 - t0) / .55), ease: 'sine.inOut', onUpdate: e.draw }, t0 + .4);
    w.waveHand(tl, t0 + .4, T1 - t0 - .4, .45, 4.2);
    j1.face(tl, t0 + .3, 'laugh'); j2.face(tl, t0 + .3, 'laugh');
    j1.shakeBody(tl, t0 + .5, T1 - t0 - .5, .8); j2.shakeBody(tl, t0 + .5, T1 - t0 - .5, .7, 4.4);
    [[L1, tE], [L2, tW], [L3, tJ]].forEach(([l, t]) => SHOW(tl, l, t));
    // 其实是死的：灯灭、变灰
    lamps.forEach((g, i) => { const t = tD + i * .22; tl.to(g._on, { opacity: 0, duration: .5 }, t); tl.to(g._off, { opacity: 1, duration: .5 }, t);
      tl.fromTo(mk('circle', { cx: 0, cy: -12, r: 4, fill: '#8a8478', opacity: 0 }, g), { opacity: 0, y: 0 }, { opacity: .7, y: -18, duration: .5, immediateRender: false }, t + .1); });
    tl.to(ppl.map(p => p.outer), { opacity: .42, duration: 1.2 }, tD + .2);
    tl.to([L1, L2, L3], { opacity: .35, duration: 1 }, tD + .2);
  };


  // 金线：从光里牵到一个人身上（描线出来）
  const thread = (par, x0, y0, x1, y1, bend = 40, o = {}) => pen(par, `M${x0},${y0} C${x0 + bend},${(y0 * 2 + y1) / 3} ${x1 - bend},${(y0 + y1 * 2) / 3} ${x1},${y1}`, { c: o.c || GOLD, w: o.w || 2.6, go: .45 });
  // 冷雨：几十条斜线一直往下落
  function rain(tl, par, x0, x1, y0, y1, t, d, o = {}) {
    const g = mk('g', { opacity: 0 }, par), r = rng(o.seed || 3), drops = [];
    for (let i = 0; i < (o.n || 34); i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); drops.push(mk('path', { d: `M${n1(x)},${n1(y)} l-6,18`, stroke: o.c || '#8fa6c0', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: n1(.35 + r() * .5) }, g)); }
    tl.to(g, { opacity: 1, duration: .8 }, t);
    tl.fromTo(drops, { y: 0, x: 0 }, { y: (y1 - y0) * .5, x: -(y1 - y0) * .17, duration: .55, ease: 'none', repeat: Math.max(1, Math.round(d / .55)), stagger: { each: .02, from: 'random' }, immediateRender: false }, t);
    return g;
  }

  // 是听父母讲的：父母坐在长凳上讲，孩子坐在地上听；母亲的气泡里是摇篮里的小婴儿 → 孩子想不起来（空的框、问号）
  // → 上面的光亮起来，金线牵到父亲、母亲（“是你用了他，在她身内形成了我”）→ 父亲、母亲是神用的人
  A.told = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 520), GY = 440;
    const t0 = AT(s.at), tTell = OPT(AT, s, 'tell', t0 + 2.1), tAll = OPT(AT, s, 'all', tTell + 1.9), tNone = OPT(AT, s, 'none', tAll + 2.5), tDeep = OPT(AT, s, 'deep', tNone + 5.4),
      tHim = OPT(AT, s, 'him', tDeep + 2), tHer = OPT(AT, s, 'her', tHim + 1.6), tUsed = OPT(AT, s, 'used', tHer + 4.2), tGod = OPT(AT, s, 'god', tUsed + 3.5);
    ground(svg, 40, 960, GY, { a: .38 });
    const lightG = glow(svg, 500, 70, 170, { rays: 11, a: .9 });
    const bench = stroke(svg, `M190,${GY - 52} L520,${GY - 52} M210,${GY - 52} L210,${GY} M500,${GY - 52} L500,${GY} M196,${GY - 64} L514,${GY - 64}`, { c: '#bfae92', w: 3, op: .85 });
    const dad = person(svg, { x: 285, y: GY, h: 222, op: 0, beard: true }); dad.pose(tl, 0, 'sit', .01, { a1: 30, e1: 40, a2: 22, e2: 50 }); dad.set(tl, 0, { hy: dad.LEG - 52 });
    const mom = person(svg, { x: 415, y: GY, h: 210, op: 0, dress: true, veil: true }); mom.pose(tl, 0, 'sit', .01, { a1: 40, e1: 60, a2: 30, e2: 66 }); mom.set(tl, 0, { hy: mom.LEG - 52 }); mom.face(tl, 0, 'smile', .01);
    const kid = person(svg, { x: 690, y: GY, h: 140, kind: 'child', hair: true, f: -1, op: 0 }); kid.pose(tl, 0, 'hugKnees', .01); kid.face(tl, 0, 'smile', .01);
    gsap.set(bench, { opacity: 0 });
    // 母亲的气泡：一个小摇篮里的婴儿
    const bub = bubble(svg, 560, 180, 210, 130, 452, 296, { c: WARM });
    stroke(bub.inner, 'M500,214 Q560,246 620,214 M506,214 L614,214 M502,214 L490,190', { c: WARM, w: 2.4, glow: false });
    const bb = baby(bub.inner, { x: 532, y: 196, r: 13, face: 'sleep' });
    // 孩子想：空的框、问号
    const th = bubble(svg, 820, 210, 150, 110, 716, 330, { kind: 'think', c: '#b9c6da' });
    mk('rect', { x: 782, y: 180, width: 76, height: 58, rx: 4, fill: 'none', stroke: '#8f9bb0', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, th.inner);
    label(th.inner, 820, 222, '？', { s: 36, c: '#c9d6ea', font: 'Noto Serif SC', wt: 700 });
    // 金线
    const thD = thread(svg, 500, 110, dad.headAt()[0] + 4, dad.headAt()[1] - 30, -60), thM = thread(svg, 500, 110, 418, GY - 112, 40);
    const womb = glow(svg, 420, GY - 104, 34, { a: 1, c0: '#fff3cf', c1: '#ffd98a' });
    const lU1 = label(svg, 350, 500, '父亲、母亲：神用的人', { s: 30, c: WARM }), lU2 = mk('g', {}, svg), lG = label(svg, 610, 92, '是神', { s: 38, c: GOLD, font: 'Noto Serif SC', wt: 500 });
    const cap = label(svg, 500, 506, '“是你用了他，在她身内形成了我。”', { s: 30, c: GOLD });
    gsap.set([lU1, lU2, lG, cap], { opacity: 0 });
    tl.to(bench, { opacity: .85, duration: .8 }, t0); dad.show(tl, t0 + .1, .8); mom.show(tl, t0 + .2, .8); kid.show(tl, t0 + .4, .8);
    [dad, mom, kid].forEach(p => p.breathe(tl, t0, tGod + 4));
    mom.talk(tl, tTell, 2.4, 'talk', 'smile'); mom.gesture(tl, tTell, 2.2, .5); POP(tl, bub, tTell + .2);
    dad.face(tl, tTell + .4, 'smile'); kid.nod(tl, tAll, 2, 8, .25);
    POP(tl, th, tNone); kid.face(tl, tNone, 'look'); kid.to(tl, tNone, .5, { head: -12 });
    UNPOP(tl, bub, tDeep - .3); UNPOP(tl, th, tDeep - .1);
    tl.to(lightG, { opacity: 1, duration: 1.4 }, tDeep); tl.to(lightG._rays, { rotation: 20, svgOrigin: '500 70', duration: tGod - tDeep + 5, ease: 'none' }, tDeep);
    DRAW(tl, thD, tHim, 1.1); dad.face(tl, tHim + .6, 'happy'); SHOW(tl, cap, tHim);
    DRAW(tl, thM, tHer, 1.1); tl.fromTo(womb, { opacity: 0, scale: .3, svgOrigin: `420 ${GY - 104}` }, { opacity: 1, scale: 1, svgOrigin: `420 ${GY - 104}`, duration: 1.2, ease: 'sine.out', immediateRender: false }, tHer + .9);
    tl.to(cap, { opacity: 0, duration: .5 }, tUsed - .4);
    SHOW(tl, lU1, tUsed);
    SHOW(tl, lG, tGod); tl.to(womb, { scale: 1.5, svgOrigin: `420 ${GY - 104}`, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, tGod);
    kid.face(tl, tGod, 'smile');
  };

  // 不信主、脾气不好的父亲：抱着胳膊、气呼呼，头上一团乌云带闪电 → 光照下来（是你用了他）→ 旁边出来一个小孩，
  // 小孩长成一个拿着《忏悔录》的人，站在光里
  A.father = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 500), GY = 430;
    const t0 = AT(s.at), tBad = OPT(AT, s, 'bad', t0 + 2.2), tUsed = OPT(AT, s, 'used', tBad + 2.6), tSon = OPT(AT, s, 'son', tUsed + 1.2), tBook = OPT(AT, s, 'book', tSon + 2.7);
    ground(svg, 60, 940, GY, { a: .38 });
    const lightG = glow(svg, 820, 90, 180, { rays: 11, a: .9 });
    const dad = person(svg, { x: 330, y: GY, h: 230, op: 0, beard: true, c: '#cdbfa3', look: 0 }); dad.pose(tl, 0, 'crossF', .01); dad.face(tl, 0, 'angry', .01);
    const cloud = mk('g', { opacity: 0 }, svg);
    mk('path', { d: 'M270,150 q-30,0 -26,-26 q4,-26 34,-22 q10,-30 44,-24 q30,-24 58,4 q30,-4 30,24 q20,14 0,34 Z', fill: 'rgba(80,88,104,.55)', stroke: '#8f9bb0', 'stroke-width': 2.4 }, cloud);
    mk('path', { d: 'M326,150 l-16,30 l16,0 l-12,30', fill: 'none', stroke: '#f0d28a', 'stroke-width': 3, 'stroke-linejoin': 'round' }, cloud);
    const grr = label(svg, 400, 166, '#!@', { s: 28, c: '#e0a08c', font: 'Cormorant Garamond', wt: 500 });
    const th = thread(svg, 800, 120, 352, 196, -80);
    const son = person(svg, { x: 470, y: GY, h: 120, kind: 'child', hair: true, op: 0 }); son.face(tl, 0, 'smile', .01);
    const man = person(svg, { x: 620, y: GY, h: 222, op: 0 }); man.pose(tl, 0, 'carry', .01, { a1: 60, e1: 50, head: -6 }); man.face(tl, 0, 'smile', .01);
    const book = mk('g', {}, man.root); mk('path', { d: 'M-6,-34 L56,-34 L56,14 L-6,14 Z', fill: 'rgba(20,18,14,.85)', stroke: GOLD, 'stroke-width': 2.6 }, book); man.hold(book, 1, 0, 0);
    const bl = label(book, 25, -4, '忏悔录', { s: 17, c: GOLD, font: 'Noto Serif SC', wt: 500, ls: '0.04em' });
    const lab = label(svg, 640, 482, '后来写《忏悔录》的人', { s: 30, c: GOLD });
    gsap.set([grr, lab, bl], { opacity: 0 });
    dad.show(tl, t0, .8); dad.breathe(tl, t0, tBook + 4);
    tl.fromTo(cloud, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .8, immediateRender: false }, tBad - .1); SHOW(tl, grr, tBad + .3);
    dad.hop(tl, tBad + .2, 6, 2, .14); dad.face(tl, tBad, 'shout'); dad.face(tl, tBad + 1.2, 'angry');
    tl.to(cloud, { x: 4, duration: .12, yoyo: true, repeat: 7 }, tBad + .2);
    tl.to(lightG, { opacity: 1, duration: 1.3 }, tUsed - .2); tl.to(lightG._rays, { rotation: -18, svgOrigin: '820 90', duration: 10, ease: 'none' }, tUsed - .2);
    DRAW(tl, th, tUsed, 1.1); tl.to([cloud, grr], { opacity: .35, duration: 1 }, tUsed + .6); dad.face(tl, tUsed + .8, 'neutral');
    son.show(tl, tSon, .8, { y: 6 }); son.to(tl, tSon + .9, .5, { head: -14 });
    // 小孩往前走，长成大人（交叉淡化），手里拿着《忏悔录》
    son.walk(tl, tBook - .3, 620, 1.2, { stride: 40 }); son.fade(tl, tBook + .5, 0, .7);
    man.show(tl, tBook + .5, .8); tl.to(bl, { opacity: 1, duration: .6 }, tBook + 1.0); SHOW(tl, lab, tBook + .9);
    sparkle(tl, svg, 640, 230, tBook + 1.3, { r: 34 });
  };

  // 你不是一个意外：冷冷的雨里，一座冷色的房子，小孩抱着膝盖坐在门口；暗处有人指着他“意外”
  // → 光亮起来，后面浮出父母的影子，金线从光里穿过他们牵到孩子身上；孩子被暖光围住，“意外”两个字碎掉 → 孩子站起来，抬头看光
  A.accident = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 400;
    const t0 = AT(s.at), tHome = OPT(AT, s, 'home', t0 + 4), tSaid = OPT(AT, s, 'said', tHome + 3), tAcc = OPT(AT, s, 'acc', tSaid + 1.9), tAll = OPT(AT, s, 'all', tAcc + 3.3),
      tPar = OPT(AT, s, 'par', tAll + 1.9), tUsed = OPT(AT, s, 'used', tPar + 2.2), tForm = OPT(AT, s, 'form', tUsed + 1.5), tNot = OPT(AT, s, 'not', tForm + 2.1);
    ground(svg, 40, 960, GY, { a: .35, c: '#9fb0c8' });
    const lightG = glow(svg, 560, 60, 190, { rays: 11, a: .9 });
    const house = pen(svg, `M120,${GY} L120,${GY - 170} L235,${GY - 260} L350,${GY - 170} L350,${GY} M150,${GY - 170} L320,${GY - 170} M170,${GY - 140} L230,${GY - 140} L230,${GY - 90} L170,${GY - 90} Z M200,${GY - 140} L200,${GY - 90} M262,${GY} L262,${GY - 96} L318,${GY - 96} L318,${GY}`, { c: '#8fa6c0', w: 3, go: .15 });
    const crack = pen(svg, `M180,${GY - 138} l12,16 l-8,10 l14,14`, { c: '#c9d6ea', w: 2, go: .1 });
    const kid = person(svg, { x: 450, y: GY, h: 140, kind: 'child', hair: true, op: 0 }); kid.pose(tl, 0, 'hugKnees', .01); kid.face(tl, 0, 'sad', .01);
    const ptr = [[850, 1], [930, 0]].map(([x, k]) => { const p = person(svg, { x, y: GY, h: 180 + k * 14, f: -1, c: '#7f8aa0', op: 0 }); p.pose(tl, 0, 'point', .01); p.face(tl, 0, 'frown', .01); return p; });
    const acc = bubble(svg, 790, 140, 170, 84, 850, 236, { kind: 'shout', c: '#e0a08c', t: '意外', s: 38, tc: '#f0b4a0' });
    const pars = [[556, 0], [628, 1]].map(([x, k]) => { const p = person(svg, { x, y: GY - 6, h: 210, f: -1, c: '#9a9488', op: 0, dress: k === 1, veil: k === 1 }); p.face(tl, 0, 'neutral', .01); return p; });
    const th1 = thread(svg, 556, 100, 556, 214, 30), th2 = thread(svg, 556, 228, 470, GY - 118, 30), th3 = thread(svg, 564, 100, 628, 222, -30);
    const halo = glow(svg, 452, GY - 70, 130, { a: .65, c0: '#ffeccc', c1: '#ffd98a' });
    rain(tl, svg, 60, 960, 40, 330, t0 + .3, tForm - t0);
    const rainG = svg.lastChild;
    DRAW(tl, house, t0, 1.4); kid.show(tl, t0 + .3, .9); kid.breathe(tl, t0, tNot + 3);
    DRAW(tl, crack, tHome + .4, .7); kid.to(tl, tHome, .6, { head: 26 });
    ptr.forEach((p, i) => { tl.fromTo(p.outer, { opacity: 0 }, { opacity: .75, duration: .8, immediateRender: false }, tSaid + i * .2); });
    POP(tl, acc, tAcc); tl.to(acc, { x: 3, duration: .08, yoyo: true, repeat: 9 }, tAcc + .5); kid.face(tl, tAcc + .2, 'cry'); kid.tears(tl, tAcc + .3, tForm - tAcc);
    tl.to(lightG, { opacity: .7, duration: 1.4 }, tAll); tl.to(lightG._rays, { rotation: 20, svgOrigin: '560 60', duration: tNot - tAll + 4, ease: 'none' }, tAll);
    pars.forEach((p, i) => tl.fromTo(p.outer, { opacity: 0 }, { opacity: .55, duration: 1, immediateRender: false }, tPar + i * .3));
    DRAW(tl, th1, tUsed, .8); DRAW(tl, th3, tUsed + .2, .8); DRAW(tl, th2, tUsed + .7, .9); tl.to(lightG, { opacity: 1, duration: 1 }, tUsed);
    tl.fromTo(halo, { opacity: 0, scale: .4, svgOrigin: `452 ${GY - 70}` }, { opacity: 1, scale: 1, svgOrigin: `452 ${GY - 70}`, duration: 1.4, ease: 'sine.out', immediateRender: false }, tForm);
    tl.to(rainG, { opacity: 0, duration: 1.2 }, tForm + .2); tl.to(house._p, { stroke: '#d9c9a8', duration: 1.2 }, tForm + .3);
    kid.face(tl, tForm + .3, 'neutral');
    tl.to(acc, { opacity: 0, scale: 1.4, svgOrigin: '790 140', duration: .6, ease: 'power2.in' }, tForm + .4); sparkle(tl, svg, 790, 140, tForm + .6, { r: 44, c: '#f0c2b2' });
    tl.to(ptr.map(p => p.outer), { opacity: 0, duration: 1 }, tForm + .4);
    // 站起来，抬头看光
    kid.pose(tl, tNot - .2, 'stand', .8, { head: -16, a1: 30, e1: 30, a2: 20, e2: 30 }); kid.face(tl, tNot + .2, 'smile');
    hearts(tl, svg, 452, GY - 170, tNot + .7, 2, { s: 14 });
  };


  // 一滴奶（小水滴形）
  const DROP = (x, y, r) => `M${x},${y - r * 1.6} C${x + r * .9},${y - r * .4} ${x + r},${y + r * .1} ${x + r},${y + r * .35} A${r},${r} 0 1 1 ${x - r},${y + r * .35} C${x - r},${y + r * .1} ${x - r * .9},${y - r * .4} ${x},${y - r * 1.6} Z`;
  // 奶从哪里来：有钱人家里（拱门、柱子），母亲抱着孩子，乳母也来帮忙 → “母亲造的？”划掉 → 喂不喂：可以选；
  // 身体里有没有奶：决定不了（一滴奶上一把锁）→ 地板下面很深的地方，一眼金色的泉亮起来，金线往上长到母亲身上，锁开了
  A.milk = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 540), GY = 372;
    const t0 = AT(s.at), tRich = OPT(AT, s, 'rich', t0 + 3.9), tSelf = OPT(AT, s, 'self', tRich + 1.5), tNurse = OPT(AT, s, 'nurse', tSelf + 1.6), tMake = OPT(AT, s, 'make', tNurse + 6),
      tChoose = OPT(AT, s, 'choose', tMake + 2.9), tNot = OPT(AT, s, 'not', tChoose + 1.8), tCant = OPT(AT, s, 'cant', tNot + 1.2), tHas = OPT(AT, s, 'has', tCant + 1.6), tDeep = OPT(AT, s, 'deep', tHas + 2.2);
    // 地上：拱门、柱子；地下：一层层的土
    const arch = pen(svg, `M90,${GY} L90,150 Q170,70 250,150 L250,${GY} M760,${GY} L760,150 Q840,70 920,150 L920,${GY} M70,150 L270,150 M740,150 L940,150 M110,${GY} L110,170 M230,${GY} L230,170 M780,${GY} L780,170 M900,${GY} L900,170`, { c: '#bfae92', w: 2.6, go: .12 });
    const floor = mk('path', { d: `M40,${GY} L960,${GY}`, stroke: '#cdbfa3', 'stroke-width': 2.4, opacity: .7 }, svg);
    const earth = mk('g', { opacity: 0 }, svg);
    mk('rect', { x: 40, y: GY + 2, width: 920, height: 168, fill: grad(defs, 'ea' + svg._uid, 'linearGradient', { x1: 0, y1: GY, x2: 0, y2: GY + 170 }, [[0, '#1a1612', .2], [1, '#2a2018', .75]]) }, earth);
    [GY + 40, GY + 82, GY + 126].forEach((y, i) => mk('path', { d: `M60,${y} C260,${y - 10} 420,${y + 12} 600,${y} S880,${y - 8} 940,${y + 4}`, fill: 'none', stroke: '#5a4a38', 'stroke-width': 1.6, opacity: .6 - i * .1 }, earth));
    const spring = glow(svg, 500, GY + 140, 90, { a: 1, c0: '#fff3cf', c1: '#ffd98a' });
    const roots = [`M500,${GY + 140} C496,${GY + 100} 470,${GY + 70} 420,${GY + 40} S370,${GY + 6} 366,${GY - 2}`, `M500,${GY + 140} C520,${GY + 96} 560,${GY + 80} 600,${GY + 52} S646,${GY + 12} 648,${GY - 2}`, `M500,${GY + 140} C470,${GY + 120} 380,${GY + 118} 300,${GY + 96}`, `M500,${GY + 140} C540,${GY + 124} 640,${GY + 120} 720,${GY + 100}`].map(d => pen(svg, d, { c: GOLD, w: 2.6, go: .5 }));
    // 母亲（抱着孩子）、乳母
    const mom = person(svg, { x: 366, y: GY, h: 232, op: 0, dress: true, veil: true }); mom.pose(tl, 0, 'cradle', .01); mom.face(tl, 0, 'smile', .01);
    const bb = baby(mom.root, { r: 13 }); mom.hold(bb, 'e1', 0, -11, 0, 1); bb.face(tl, 0, 'content', .01);
    const nur = person(svg, { x: 990, y: GY, h: 222, f: -1, op: 0, dress: '#cdbfa3', veil: '#cdbfa3', c: '#e2d6c0' }); nur.face(tl, 0, 'smile', .01);
    const lMom = label(svg, 366, GY + 36, '母亲', { s: 26, c: WARM }), lNur = label(svg, 648, GY + 36, '乳母', { s: 26, c: '#cdbfa3' });
    // “母亲造的？”（划掉）
    const make = mk('g', { opacity: 0 }, svg); label(make, 160, 96, '奶是母亲造的？', { s: 30, c: '#cdbfa3', a: 'start' }); const strike = pen(make, 'M154,86 L376,86', { c: '#e0a08c', w: 3, go: .2 });
    // 喂 / 不喂
    const ch = mk('g', { opacity: 0 }, svg);
    const pill = (x, t, on) => { const g = mk('g', {}, ch); mk('rect', { x: x - 44, y: 188, width: 88, height: 42, rx: 21, fill: on ? 'rgba(226,189,118,.16)' : 'rgba(30,30,36,.6)', stroke: on ? GOLD : '#6f6658', 'stroke-width': 2.2 }, g); label(g, x, 218, t, { s: 26, c: on ? GOLD : '#8f8270' }); return g; };
    const pFeed = pill(480, '喂', true), pNo = pill(580, '不喂', false); const lPick = label(ch, 530, 266, '可以选', { s: 26, c: WARM });
    // 一滴奶，上面一把锁
    const dropG = mk('g', { opacity: 0 }, svg); const dx = 500, dy = 250;
    mk('path', { d: DROP(dx, dy, 22), fill: 'rgba(246,239,224,.18)', stroke: '#f6efe0', 'stroke-width': 2.6 }, dropG);
    const lock = mk('g', {}, dropG); mk('rect', { x: dx + 16, y: dy + 6, width: 30, height: 24, rx: 4, fill: 'rgba(20,20,26,.9)', stroke: '#e0a08c', 'stroke-width': 2.2 }, lock); const shackle = mk('path', { d: `M${dx + 22},${dy + 6} L${dx + 22},${dy - 2} A9,9 0 0 1 ${dx + 40},${dy - 2} L${dx + 40},${dy + 6}`, fill: 'none', stroke: '#e0a08c', 'stroke-width': 2.4 }, lock);
    const lCant = label(svg, 516, 322, '决定不了', { s: 26, c: '#e0a08c' });
    const lDeep = label(svg, 560, 56, '“神布置在事物深处所蕴藏的”', { s: 34, c: GOLD });
    gsap.set([lMom, lNur, lCant, lDeep], { opacity: 0 });
    // 开场
    DRAW(tl, arch, t0 + .4, 1.4); mom.show(tl, t0, .9); mom.breathe(tl, t0, tDeep + 5); SHOW(tl, lMom, t0 + .6);
    tl.to(earth, { opacity: 1, duration: 1.2 }, t0 + .2);
    bb.face(tl, tSelf, 'suck'); mom.to(tl, tSelf, .6, { head: 26 });
    nur.show(tl, tNurse - .4, .5); nur.walk(tl, tNurse - .4, 648, 1.6); nur.pose(tl, tNurse + 1.3, 'bow', .6); nur.pose(tl, tNurse + 2.2, 'stand', .6); SHOW(tl, lNur, tNurse + 1.2);
    // 奶不是母亲造的
    tl.to(make, { opacity: 1, duration: .6 }, tMake); DRAW(tl, strike, tMake + 1.3, .5);
    // 喂不喂，可以选
    tl.to(make, { opacity: .25, duration: .5 }, tChoose - .3);
    tl.to(ch, { opacity: 1, duration: .5 }, tChoose); tl.fromTo(pFeed, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.12, duration: .3, yoyo: true, repeat: 1, immediateRender: false }, tChoose + .5);
    tl.to(pNo, { opacity: .5, duration: .4 }, tNot + .3);
    // 有没有奶：决定不了
    tl.to(ch, { opacity: 0, duration: .5 }, tCant);
    tl.fromTo(dropG, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, immediateRender: false }, tCant + .2); SHOW(tl, lCant, tHas);
    mom.face(tl, tHas, 'worry'); tl.to(lock, { x: 3, duration: .07, yoyo: true, repeat: 7 }, tHas + .3);
    // 神布置在事物深处所蕴藏的：地下的泉亮起来，金线长上来，锁开了
    tl.fromTo(spring, { opacity: 0, scale: .4, svgOrigin: `500 ${GY + 140}` }, { opacity: 1, scale: 1, svgOrigin: `500 ${GY + 140}`, duration: 1.2, ease: 'sine.out', immediateRender: false }, tDeep);
    roots.forEach((r, i) => DRAW(tl, r, tDeep + .5 + i * .25, 1.4));
    const hg = glow(svg, 380, GY - 150, 70, { a: .8, c0: '#fff3cf', c1: '#ffd98a' }); svg.insertBefore(hg, mom.outer);
    tl.to(hg, { opacity: 1, duration: 1 }, tDeep + 1.6);
    tl.to(shackle, { y: -8, duration: .4, ease: 'back.out(3)' }, tDeep + 1.8); tl.to(lock, { opacity: 0, duration: .6 }, tDeep + 2.3); tl.to(lCant, { opacity: 0, duration: .5 }, tDeep + 2);
    tl.to(dropG.firstChild, { fill: 'rgba(255,226,160,.4)', stroke: GOLD, duration: .8 }, tDeep + 2); sparkle(tl, svg, dx, dy, tDeep + 2.3, { r: 30 });
    mom.face(tl, tDeep + 1.8, 'happy'); bb.face(tl, tDeep + 1.6, 'content'); SHOW(tl, lDeep, tDeep + .3);
  };

  // 快递员和寄包裹的人：快递员抱着包裹走过来，敲门（咚咚），把包裹交到你手上 → 你鞠躬“谢谢！”→ 快递员挥手走了
  // → 包裹上的寄件人：一条金色虚线连到上面的光 → 送包裹的（母亲、乳母）/ 寄包裹的（神）
  A.parcel = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 520), GY = 440;
    const t0 = AT(s.at), tGive = OPT(AT, s, 'give', t0 + 1.1), tThank = OPT(AT, s, 'thank', tGive + 2), tKnow = OPT(AT, s, 'know', tThank + 1.4),
      tSender = OPT(AT, s, 'sender', tKnow + 2.5), tWho = OPT(AT, s, 'who', tSender + 2), tGod = OPT(AT, s, 'god', tWho + 2.8);
    ground(svg, 40, 960, GY, { a: .38 });
    const door = pen(svg, `M110,${GY} L110,${GY - 250} L230,${GY - 250} L230,${GY} M212,${GY - 120} L212,${GY - 108}`, { c: '#cdbfa3', w: 3, go: .15 });
    const you = person(svg, { x: 300, y: GY, h: 224, op: 0 }); you.face(tl, 0, 'neutral', .01);
    const cour = person(svg, { x: 1040, y: GY, h: 226, f: -1, c: SKY, op: 0 }); cour.pose(tl, 0, 'carry', .01); cour.face(tl, 0, 'smile', .01);
    const cap = mk('path', { d: '', fill: 'rgba(159,176,200,.25)', stroke: SKY, 'stroke-width': 3 }, cour.headG); cap.setAttribute('d', `M${-cour.HR * 1.05},${-cour.HR * .35} Q0,${-cour.HR * 1.5} ${cour.HR * 1.05},${-cour.HR * .35} Z M${cour.HR * .6},${-cour.HR * .5} L${cour.HR * 1.6},${-cour.HR * .38}`);
    // 包裹：先在快递员手上（他的坐标里），交过去的时候换成你手上那一个
    const BOX = (par) => { const g = mk('g', {}, par); mk('rect', { x: -30, y: -26, width: 60, height: 46, rx: 4, fill: 'rgba(226,189,118,.22)', stroke: GOLD, 'stroke-width': 2.6 }, g); mk('path', { d: 'M-30,-8 L30,-8 M0,-26 L0,20', stroke: GOLD, 'stroke-width': 2, fill: 'none', opacity: .7 }, g); return g; };
    const boxC = BOX(cour.root); cour.hold(boxC, 1, 10, -14);
    const boxY = BOX(you.root); you.hold(boxY, 1, 10, -14); gsap.set(boxY, { opacity: 0 });
    const knock = label(svg, 360, GY - 270, '咚 咚', { s: 30, c: '#cdbfa3' });
    const thanks = bubble(svg, 240, 120, 150, 64, 296, 186, { t: '谢谢！', s: 32 });
    const sun = glow(svg, 860, 90, 120, { rays: 11, a: .95 });
    const trace = pen(svg, 'M350,300 C460,250 560,190 650,150 C720,120 780,104 830,96', { c: GOLD, w: 2.6, go: .4 }); trace._m.setAttribute('stroke-dasharray', '0.02 0.02');
    const lC = label(svg, 660, 498, '送包裹的：母亲、乳母', { s: 30, c: '#b9c6da' }), lG = label(svg, 800, 210, '寄包裹的：神', { s: 34, c: GOLD });
    gsap.set([knock, lC, lG], { opacity: 0 });
    DRAW(tl, door, t0 - .2, .9); you.show(tl, t0, .8); you.breathe(tl, t0, tGod + 4);
    // 快递员走过来、敲门
    cour.show(tl, t0, .4); cour.walk(tl, t0, 440, Math.max(.9, tGive - t0 - .2));
    tl.fromTo(knock, { opacity: 0, scale: .7, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .25, yoyo: true, repeat: 3, immediateRender: false }, t0 + .4);
    you.turn(tl, t0 + .5, 1, .3); you.face(tl, t0 + .6, 'smile');
    // 交到你手上
    const meet = { a1: 70, e1: 20, a2: 64, e2: 26 };
    cour.pose(tl, tGive, 'give', .6); you.pose(tl, tGive + .1, 'give', .6);
    const pC = cour.handAt(1, { ...cour.cur }), pY = you.handAt(1, { ...you.cur });
    tl.to(boxC, { opacity: 0, duration: .25 }, tGive + .75); tl.to(boxY, { opacity: 1, duration: .25 }, tGive + .75);
    you.pose(tl, tGive + 1, 'carry', .6); cour.pose(tl, tGive + 1, 'stand', .6);
    // 谢谢
    you.pose(tl, tThank, 'bow', .5, { a1: 44, e1: 52, a2: 40, e2: 58 }); POP(tl, thanks, tThank + .1); you.pose(tl, tThank + 1, 'carry', .5);
    cour.pose(tl, tThank + .6, 'wave', .4); cour.waveHand(tl, tThank + .9, 1.2);
    // 心里知道：看看包裹上的寄件人
    you.to(tl, tKnow, .5, { head: 22 }); you.face(tl, tKnow, 'look'); UNPOP(tl, thanks, tKnow);
    cour.pose(tl, tSender - .4, 'stand', .4); cour.walk(tl, tSender - .2, 1060, 2.2); cour.fade(tl, tSender + 1.4, 0, .8);
    tl.to(sun, { opacity: 1, duration: 1 }, tSender); DRAW(tl, trace, tSender + .2, 1.4); tl.to(sun._rays, { rotation: 20, svgOrigin: '860 90', duration: tGod - tSender + 4, ease: 'none' }, tSender);
    you.to(tl, tSender + .6, .6, { head: -18 }); you.face(tl, tSender + .7, 'happy');
    SHOW(tl, lC, tWho);
    SHOW(tl, lG, tGod); tl.to(sun._disc, { attr: { r: 150 }, duration: 1.6, ease: 'sine.inOut' }, tGod);
  };


  // 礼物盒
  const GIFT = (par, x, y, sz = 1, c = GOLD) => { const o = mk('g', { transform: `translate(${x},${y})` }, par), g = mk('g', { transform: `scale(${sz})` }, o); o._in = g;
    mk('rect', { x: -24, y: -20, width: 48, height: 38, rx: 3, fill: rgba(c, .2), stroke: c, 'stroke-width': 2.4 }, g);
    mk('path', { d: 'M0,-20 L0,18 M-24,-6 L24,-6 M0,-20 C-14,-34 -22,-24 -8,-21 M0,-20 C14,-34 22,-24 8,-21', fill: 'none', stroke: c, 'stroke-width': 2, opacity: .85 }, g); return o; };
  // 要的正好：左边吃奶的孩子心满意足（刚刚好），旁边飘来别的东西他也不看；右边一个大人，给了一样想要两样，抱着两样又盯着那个亮晶晶的
  A.more = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 460), GY = 400;
    const t0 = AT(s.at), tJust = OPT(AT, s, 'just', t0 + 1.6), tNo = OPT(AT, s, 'noother', tJust + 2.3), tLess = OPT(AT, s, 'less', tNo + 1.4),
      tAd = OPT(AT, s, 'adult', tLess + 1.8), tOne = OPT(AT, s, 'one', tAd + 1.7), tTwo = OPT(AT, s, 'two', tOne + 1.1), tThis = OPT(AT, s, 'this', tTwo + 1.9), tThat = OPT(AT, s, 'that', tThis + 1);
    ground(svg, 40, 470, GY, { a: .38 }); ground(svg, 530, 960, GY, { a: .38 });
    const div = pen(svg, 'M500,60 L500,430', { c: '#6f6658', w: 2, go: .1 });
    // 左：母亲抱着吃奶的孩子
    const mom = person(svg, { x: 220, y: GY, h: 230, op: 0, dress: true, veil: true }); mom.pose(tl, 0, 'cradle', .01); mom.face(tl, 0, 'smile', .01);
    const bb = baby(mom.root, { r: 14 }); mom.hold(bb, 'e1', 0, -12, 0, 1); bb.face(tl, 0, 'suck', .01);
    const just = label(svg, 300, 120, '刚刚好', { s: 32, c: GOLD });
    const toy = mk('g', { opacity: 0 }, svg); mk('circle', { cx: 410, cy: 190, r: 16, fill: 'rgba(226,189,118,.25)', stroke: GOLD, 'stroke-width': 2.4 }, toy); label(toy, 410, 198, '¥', { s: 20, c: GOLD, font: 'Cormorant Garamond', ls: 0 });
    // 右：大人
    const ad = person(svg, { x: 700, y: GY, h: 230, op: 0 }); ad.face(tl, 0, 'neutral', .01);
    const g1 = GIFT(ad.root, 0, 0), g2 = GIFT(ad.root, 0, 0, .9); ad.hold(g1, 1, 4, -10); ad.hold(g2, 1, 2, -46); gsap.set([g1, g2], { opacity: 0 });
    const g2free = GIFT(svg, 840, 300, .9); gsap.set(g2free, { opacity: 0 });
    const gem = mk('g', { opacity: 0 }, svg); mk('path', { d: 'M900,170 L922,196 L900,236 L878,196 Z M878,196 L922,196 M900,170 L890,196 L900,236 L910,196 Z', fill: 'rgba(143,184,216,.25)', stroke: '#bfe0f6', 'stroke-width': 2.4 }, gem);
    const c1 = label(svg, 740, 450, '给了一样，就想要两样', { s: 28, c: '#cdbfa3' }), c2 = label(svg, 740, 450, '有了这个，又盯着那个', { s: 28, c: '#e0b4a4' });
    gsap.set([just, c1, c2], { opacity: 0 });
    DRAW(tl, div, t0, .8); mom.show(tl, t0, .8); mom.breathe(tl, t0, tThat + 3);
    SHOW(tl, just, tJust); hearts(tl, svg, 270, 170, tJust + .3, 2, { s: 12 });
    tl.fromTo(toy, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: .8, immediateRender: false }, tNo); tl.to(toy, { y: -8, duration: .5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, tNo + .8);
    bb.face(tl, tLess, 'content'); tl.to(toy, { opacity: .3, duration: .8 }, tLess + .4);
    ad.show(tl, tAd, .8);
    // 给了一样
    ad.pose(tl, tOne - .2, 'carry', .4, { a2: -6, e2: 14 }); tl.to(g1, { opacity: 1, duration: .2 }, tOne); tl.fromTo(g1._in, { y: -80 }, { y: 0, duration: .5, ease: 'bounce.out', immediateRender: false }, tOne); ad.face(tl, tOne + .4, 'happy');
    // 想要两样：伸手去拿第二个
    tl.to(g2free, { opacity: 1, duration: .4 }, tTwo - .3); ad.to(tl, tTwo, .5, { a2: 70, e2: 6, lean: 6, head: 6 }); ad.face(tl, tTwo, 'grin');
    tl.to(g2free, { opacity: 0, duration: .2 }, tTwo + .6); tl.to(g2, { opacity: 1, duration: .2 }, tTwo + .6); ad.to(tl, tTwo + .7, .5, { a2: 46, e2: 58, lean: 0, head: 0 }); SHOW(tl, c1, tTwo);
    // 又盯着那个
    ad.face(tl, tThis, 'smile');
    tl.fromTo(gem, { opacity: 0, scale: .6, svgOrigin: '900 200' }, { opacity: 1, scale: 1, svgOrigin: '900 200', duration: .6, ease: 'back.out(2)', immediateRender: false }, tThat - .5); sparkle(tl, svg, 900, 200, tThat - .2, { r: 30, c: '#d6ecff' });
    ad.to(tl, tThat, .5, { head: -14, lean: 10 }); ad.face(tl, tThat, 'wow'); tl.to(c1, { opacity: 0, duration: .4 }, tThis); SHOW(tl, c2, tThis + .1);
  };

  // 半夜爬起来喂：夜里（窗外月亮、墙上钟三点），母亲睡着，孩子在摇篮里哭 → 母亲坐起来、打哈欠、下床、走过去把孩子抱起来摇，
  // 累得直点头也还在摇 → 胸口一颗金色的心亮起来，月光变暖：“这份愿意，也是神给的”
  A.night = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 410, BT = GY - 64;
    const t0 = AT(s.at), tUp = OPT(AT, s, 'up', t0 + 1.8), tTired = OPT(AT, s, 'tired', tUp + 1.5), tGod = OPT(AT, s, 'god', tTired + 3), tName = OPT(AT, s, 'name', tGod + 2.9), tLove = OPT(AT, s, 'love', tName + 2.6);
    ground(svg, 40, 960, GY, { a: .35 });
    const win = pen(svg, 'M420,70 L560,70 L560,200 L420,200 Z M490,70 L490,200 M420,135 L560,135', { c: '#9fb0c8', w: 2.6, go: .15 });
    const moon = mk('path', { d: 'M534,96 a20,20 0 1 0 6,26 a16,16 0 1 1 -6,-26 Z', fill: '#e8eef8', opacity: .9 }, svg);
    const stars = mk('g', {}, svg); [[446, 92], [470, 160], [530, 176]].forEach(([x, y]) => mk('circle', { cx: x, cy: y, r: 2, fill: '#e8eef8' }, stars));
    const clock = mk('g', {}, svg); mk('circle', { cx: 640, cy: 110, r: 30, fill: 'rgba(20,20,26,.7)', stroke: '#cdbfa3', 'stroke-width': 2.4 }, clock); mk('path', { d: 'M640,110 L640,90 M640,110 L656,110', stroke: '#cdbfa3', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, clock);
    const bed = stroke(svg, `M100,${GY} L100,${BT - 40} M100,${BT} L380,${BT} L380,${GY} M100,${BT + 26} L380,${BT + 26} M110,${BT - 4} Q120,${BT - 26} 160,${BT - 18} Q170,${BT - 6} 150,${BT - 2}`, { c: '#bfae92', w: 3 });
    const cradle = stroke(svg, `M760,${GY - 70} Q820,${GY + 6} 880,${GY - 70} M756,${GY - 66} L884,${GY - 66} M770,${GY - 40} L752,${GY} M870,${GY - 40} L888,${GY}`, { c: '#bfae92', w: 3 });
    const beam = mk('path', { d: `M420,200 L560,200 L560,200 L330,${GY} L100,${GY} Z`, fill: grad(defs, 'nb' + svg._uid, 'linearGradient', { x1: 0, y1: 200, x2: 0, y2: GY }, [[0, '#cfe0f6', .16], [1, '#cfe0f6', .02]]) }, svg);
    svg.insertBefore(beam, svg.firstChild.nextSibling);
    const warmBeam = mk('path', { d: `M420,200 L560,200 L780,${GY} L520,${GY} Z`, fill: grad(defs, 'nw' + svg._uid, 'linearGradient', { x1: 0, y1: 200, x2: 0, y2: GY }, [[0, '#ffe2a0', .34], [1, '#ffe2a0', .04]]), opacity: 0 }, svg);
    svg.insertBefore(warmBeam, beam.nextSibling);
    // 母亲躺在床上；摇篮里的孩子
    const mom = person(svg, { x: 210, y: BT, h: 220, dress: true, op: 0 }); mom.pose(tl, 0, 'lie', .01, { hy: mom.LEG - 4 }); mom.face(tl, 0, 'sleep', .01);
    const cb = baby(svg, { x: 790, y: GY - 84, r: 15, face: 'sleep' });
    const wah = label(svg, 860, GY - 140, '哇——', { s: 30, c: '#e0b4a4' });
    const held = baby(mom.root, { r: 14, op: 0 }); mom.hold(held, 'e1', 0, -12, 0, 1); held.face(tl, 0, 'cry', .01);
    const heart = mk('path', { d: HEART(0, 0, 13), fill: '#ffd98a', stroke: '#fff1c8', 'stroke-width': 1.6, opacity: 0 }, svg);
    const hglow = glow(svg, 0, 0, 60, { a: .9, c0: '#fff3cf', c1: '#ffd98a' });
    const lName = label(svg, 820, 440, '“天赋的感情”', { s: 30, c: GOLD }), lLove = label(svg, 500, 456, '母爱，是神放在人心里的', { s: 32, c: GOLD });
    gsap.set([wah, lName, lLove], { opacity: 0 });
    DRAW(tl, win, t0 - .2, 1); mom.show(tl, t0, .8); zzz(tl, svg, 150, BT - 60, t0 + .2, tUp - t0 - .4, { s: 28 });
    // 孩子哭
    cb.face(tl, t0 + .5, 'cry'); cb.flail(tl, t0 + .5, tTired - t0 + .3, 1); cb.tears(tl, t0 + .6, tTired - t0); tl.fromTo(wah, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .3, yoyo: true, repeat: 3, immediateRender: false }, t0 + .6);
    // 坐起来、打哈欠、下床、走过去
    mom.to(tl, tUp - .2, .9, { lean: -6, head: 4, a1: 20, e1: 30, a2: 14, e2: 30 }); mom.face(tl, tUp + .3, 'yawn'); mom.face(tl, tUp + 1, 'tired');
    mom.to(tl, tUp + .9, .7, { y: GY, hy: 0, fk: 0, lean: 0, l1: 0, k1: 0, l2: 0, k2: 0, x: 400 });
    mom.walk(tl, tUp + 1.6, 690, Math.max(.9, tTired - tUp - 1.2));
    // 抱起来摇
    const tPick = tTired + .5; mom.pose(tl, tPick - .2, 'give', .4, { lean: 18, head: 20 });
    tl.to(cb.outer, { opacity: 0, duration: .3 }, tPick + .2); tl.to(held.outer, { opacity: 1, duration: .3 }, tPick + .2);
    mom.pose(tl, tPick + .4, 'cradle', .6, { head: 24 });
    held.face(tl, tPick + 1.4, 'suck'); held.face(tl, tGod, 'sleep');
    tl.to(mom.st, { lean: 5, duration: 1.1, yoyo: true, repeat: Math.max(1, Math.floor((tLove + 3 - tPick - 1) / 1.1)), ease: 'sine.inOut', onUpdate: mom.draw }, tPick + 1);
    mom.nod(tl, tTired + 1.5, 2, 14, .5); mom.face(tl, tGod + .2, 'content');
    // 这份愿意也是神给的：胸口一颗心亮起来，月光变暖
    const ch = mom.chestAt({ ...mom.cur }); gsap.set([heart], { x: ch[0] - 4, y: ch[1] }); gsap.set(hglow, { x: ch[0] - 4, y: ch[1] });
    tl.to(warmBeam, { opacity: 1, duration: 1.6 }, tGod); tl.to(beam, { opacity: .3, duration: 1.6 }, tGod);
    tl.fromTo(heart, { opacity: 0, scale: .3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(2)', immediateRender: false }, tGod + .4); tl.to(hglow, { opacity: 1, duration: 1 }, tGod + .4);
    SHOW(tl, lName, tName);
    tl.to(heart, { scale: 1.3, transformOrigin: '50% 50%', duration: .6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, tLove); tl.to(lName, { opacity: 0, duration: .5 }, tLove - .3); SHOW(tl, lLove, tLove);
  };

  window.FIG = { person, baby, POSE, stroke, pen, shown, ground, glow, bubble, POP, UNPOP, hearts, zzz, haha, sparkle, label, HEART, rgba, figGlow, SKY, DIM, WARM, ROSE };
  window.ANIMS = window.ANIMS || {};
})();
