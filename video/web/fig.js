// 火柴人：会摆姿势、走路、做表情的线描小人（第八讲起，讲稿里每一个例子都用小人演出来）。
// 小人的每个关节都是一个数（st 里），GSAP 补间这些数，每一帧按这些数重画一遍，所以逐帧定位也准。
// 依赖 anim.js 里的公用画法（window.AH）；例子的动画也写在这里，挂到 window.ANIMS 上。
//
// 角度的约定（都是“度”）：手臂、腿以“竖直朝下”为 0，往前（脸朝的方向）转为正：手臂 90 是平举向前，180 是举过头顶；
// 肘、膝是相对上一节的角度：肘为正是往前弯（小臂往前、往上收），膝为负是往后弯（正常的弯法）；
// lean 是上身前倾（负的是后仰，-90 就是平躺、头在身后）；head 是低头（负的是抬头）。
// 腿有两种算法：fk = 0（默认）脚踩在地上，按臀部高低自动弯膝（下蹲、走路都不会滑脚）；fk = 1 按 l1/k1/l2/k2 摆（坐、跪、躺）。
(function () {
  const { mk, rng, line, text, DRAW, SHOW, grad, icon, circ, GOLD, PAPER, CORAL, WATER } = window.AH;
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
    F.blush = (tl, t, d = .5) => { if (!F._bl) { F._bl = [FC.e1, FC.e2].map(x => mk('ellipse', { cx: x + (x > 0 ? HR * .08 : -HR * .08), cy: FC.ey + HR * .38, rx: HR * .2, ry: HR * .11, fill: 'rgba(235,110,90,.6)', opacity: 0 }, headG)); }
      tl.to(F._bl, { opacity: 1, duration: d }, t); return F; };
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
  // 小人动画垫一层中间深、四边淡出去的底（背景名画还在四周，小人在安静的暗处）
  const base = (el, h) => { el.classList.add('la-fig'); return window.AH.base(el, h); };
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
    DRAW(tl, div, t0, .9); SHOW(tl, tL, t0 + 1.1);
    tl.to(bench, { opacity: 1, duration: .9 }, t0 + .9); judge.show(tl, t0 + 1.1, .9); man.show(tl, t0 + .5, .8, { y: 8 });
    judge.breathe(tl, t0, tM + 6); man.breathe(tl, t0, tC);
    tl.to(lightG, { opacity: .55, duration: 1.4 }, tM0); SHOW(tl, tR, tM0 + 1.25);
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
    kid.talk(tl, tTalk, tLaugh - tTalk - .2, 'talk', 'look'); POP(tl, bub, tTalk + 1.05);
    kid.pose(tl, tTalk, { a1: 60, e1: 50, a2: 40, e2: 60 }, .4);
    tl.fromTo(big, { scale: .8, transformOrigin: '50% 50%' }, { scale: 1.08, duration: .3, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false }, tTalk + 1.3);
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
    SHOW(tl, lG, tGod + 1.0); tl.to(womb, { scale: 1.5, svgOrigin: `420 ${GY - 104}`, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, tGod);
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
    DRAW(tl, arch, t0 + .4, 1.4); mom.show(tl, t0, .9); mom.breathe(tl, t0, tDeep + 5); SHOW(tl, lMom, tSelf + .3);
    tl.to(earth, { opacity: 1, duration: 1.2 }, t0 + .2);
    bb.face(tl, tSelf, 'suck'); mom.to(tl, tSelf, .6, { head: 26 });
    nur.show(tl, tNurse - .4, .5); nur.walk(tl, tNurse - .4, 648, 1.6); nur.pose(tl, tNurse + 1.3, 'bow', .6); nur.pose(tl, tNurse + 2.2, 'stand', .6); SHOW(tl, lNur, tNurse + 1.2);
    // 奶不是母亲造的
    tl.to(make, { opacity: 1, duration: .6 }, tMake); DRAW(tl, strike, tMake + 1.3, .5);
    // 喂不喂，可以选
    tl.to(make, { opacity: .25, duration: .5 }, tChoose - .3);
    tl.to(ch, { opacity: 1, duration: .5 }, tChoose); tl.fromTo(pFeed, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.12, duration: .3, yoyo: true, repeat: 1, immediateRender: false }, tChoose + .5);
    gsap.set(pNo, { opacity: 0 }); tl.to(pNo, { opacity: .6, duration: .5 }, tNot + .3);
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
    SHOW(tl, lC, tWho + 1.15);
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
    SHOW(tl, lName, tName + 1.05);
    tl.to(heart, { scale: 1.3, transformOrigin: '50% 50%', duration: .6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, tLove); tl.to(lName, { opacity: 0, duration: .5 }, tLove - .3); SHOW(tl, lLove, tLove);
  };


  // 一串光点沿着一条路流过去（一直流：p 从 0 到 n 圈，每帧按路径长度算位置）
  function flow(tl, par, path, t0, t1, o = {}) {
    const L = path.getTotalLength(), n = o.n || 6, g = mk('g', { opacity: 0 }, par), dots = [];
    for (let i = 0; i < n; i++) dots.push(mk('circle', { r: o.r || 4.5, fill: o.c || '#fff1c8', filter: `url(#${figGlow(svgOf(par))})` }, g));
    const st = { p: 0 }, sp = o.speed || .45;
    const upd = () => dots.forEach((d, i) => { const q = ((st.p + i / n) % 1 + 1) % 1, pt = path.getPointAtLength(q * L); d.setAttribute('cx', n1(pt.x)); d.setAttribute('cy', n1(pt.y)); d.setAttribute('opacity', n1(Math.sin(q * Math.PI))); });
    upd(); tl.to(g, { opacity: 1, duration: .6 }, t0);
    tl.to(st, { p: (t1 - t0) * sp, duration: t1 - t0, ease: 'none', onUpdate: upd }, t0);
    return g;
  }

  // 喂奶的人也得到了好处：母亲坐着摇孩子；身体上的、心里的；孩子吃饱了、睡着了 → 那份满足（心亮起来）→ 别的东西换不来（金币 ≠ 心）
  A.give = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 410;
    const t0 = AT(s.at), tBody = OPT(AT, s, 'body', t0 + 2.5), tHeart = OPT(AT, s, 'heart', tBody + 1.3), tWatch = OPT(AT, s, 'watch', tHeart + 1.8), tFull = OPT(AT, s, 'full', tWatch + 1.7),
      tSleep = OPT(AT, s, 'sleep', tFull + .7), tJoy = OPT(AT, s, 'joy', tSleep + .9), tBuy = OPT(AT, s, 'buy', tJoy + 1.2);
    ground(svg, 60, 940, GY, { a: .38 });
    const warm = glow(svg, 380, 270, 230, { a: .5, c0: '#ffe9c4', c1: '#f6c98e' });
    const mom = person(svg, { x: 380, y: GY, h: 300, op: 0, dress: true, veil: true }); mom.pose(tl, 0, 'sit', .01, { ...POSE.cradle(mom), fk: 1, hy: mom.TH, l1: 90, k1: -90, l2: 84, k2: -86, head: 26 }); mom.face(tl, 0, 'smile', .01);
    const rc = stroke(svg, `M${380 - 30},${GY - mom.SH} L${380 + 30},${GY - mom.SH} M${380 - 26},${GY - mom.SH} L${380 - 34},${GY - mom.SH - 70} M${380 - 30},${GY - mom.SH} L${380 - 24},${GY - 6} M${380 + 26},${GY - mom.SH} L${380 + 22},${GY - 6} M${380 - 60},${GY - 4} Q${380},${GY + 10} ${380 + 60},${GY - 4}`, { c: '#bfae92', w: 3 });
    const bb = baby(mom.root, { r: 17 }); mom.hold(bb, 'e1', 0, -15, 0, 1); bb.face(tl, 0, 'suck', .01);
    const heart = mk('path', { d: HEART(0, 0, 14), fill: '#ffd98a', stroke: '#fff1c8', 'stroke-width': 1.6, opacity: 0 }, svg);
    const ch = mom.chestAt({ ...mom.st, ...mom.cur }); gsap.set(heart, { x: ch[0] - 6, y: ch[1] - 4 });
    const lB = label(svg, 190, 150, '身体上的', { s: 30, c: WARM }), lH = label(svg, 580, 150, '心里的', { s: 30, c: WARM });
    const lJoy = label(svg, 380, 460, '那份满足', { s: 32, c: GOLD });
    const ne = mk('g', { opacity: 0 }, svg);
    mk('path', { d: HEART(680, 270, 22), fill: 'rgba(255,217,138,.35)', stroke: '#ffd98a', 'stroke-width': 2.4 }, ne);
    label(ne, 755, 286, '≠', { s: 50, c: '#e0a08c', font: 'Noto Serif SC', wt: 700, ls: 0 });
    [[820, 300], [846, 300], [833, 284], [872, 300]].forEach(([x, y]) => mk('ellipse', { cx: x, cy: y, rx: 15, ry: 6, fill: 'rgba(226,189,118,.3)', stroke: GOLD, 'stroke-width': 2 }, ne));
    mk('path', { d: 'M880,244 L896,262 L880,290 L864,262 Z', fill: 'rgba(143,184,216,.25)', stroke: '#bfe0f6', 'stroke-width': 2 }, ne);
    label(ne, 780, 360, '别的东西换不来', { s: 28, c: '#e0b4a4' });
    gsap.set([lB, lH, lJoy], { opacity: 0 });
    tl.to(rc, { opacity: .85, duration: .8 }, t0); mom.show(tl, t0, .8);
    tl.to(mom.st, { lean: 6, duration: 1.2, yoyo: true, repeat: Math.floor((tBuy + 5 - t0) / 1.2), ease: 'sine.inOut', onUpdate: mom.draw }, t0 + .6);
    SHOW(tl, lB, tBody); sparkle(tl, svg, ch[0] - 30, ch[1] + 40, tBody + .3, { r: 24 });
    SHOW(tl, lH, tHeart); tl.fromTo(heart, { opacity: 0, scale: .3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .7, ease: 'back.out(2)', immediateRender: false }, tHeart + .2);
    bb.face(tl, tFull, 'content'); bb.face(tl, tSleep, 'sleep'); zzz(tl, svg, ch[0] + 70, ch[1] - 30, tSleep + .2, tBuy + 4 - tSleep, { s: 24 });
    mom.face(tl, tWatch, 'happy');
    tl.to([lB, lH], { opacity: .3, duration: .6 }, tJoy); SHOW(tl, lJoy, tJoy); tl.to(warm, { opacity: 1, duration: 1.4 }, tJoy);
    tl.to(heart, { scale: 1.3, transformOrigin: '50% 50%', duration: .5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, tJoy + .2); hearts(tl, svg, ch[0], ch[1] - 60, tJoy + .3, 3, { s: 13 });
    tl.fromTo(ne, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: .8, immediateRender: false }, tBuy);
  };

  // 来自和通过：上面一团光（源头），金色的光流下来，穿过母亲（她抱着孩子）流到孩子身上 → “来自”在光旁边，“通过”在母亲旁边 → 源头只有一个
  // s.full：接着上一场（开场就画好、光已经在流）；s.you：右边再来一个人（你），光也流过你，到另一个人手里
  A.source = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 520), GY = 450, SX = 330, SY = 86;
    const t0 = AT(s.at), full = !!s.full;
    ground(svg, 40, 960, GY, { a: .38 });
    const src = glow(svg, SX, SY, 140, { rays: 11, a: .95 });
    const mom = person(svg, { x: SX, y: GY, h: 236, op: full ? 1 : 0, dress: true, veil: true }); mom.pose(tl, 0, 'cradle', .01); mom.face(tl, 0, 'smile', .01);
    const bb = baby(mom.root, { r: 14 }); mom.hold(bb, 'e1', 0, -12, 0, 1); bb.face(tl, 0, 'content', .01);
    const ch = mom.chestAt({ ...mom.st, ...mom.cur }), bp = mom.handAt(1, { ...mom.st, ...mom.cur });
    const path1 = mk('path', { d: `M${SX},${SY + 40} C${SX + 10},${SY + 110} ${ch[0] - 10},${ch[1] - 90} ${ch[0] - 4},${ch[1]} C${ch[0]},${ch[1] + 20} ${bp[0] - 30},${bp[1] - 10} ${bp[0] - 6},${bp[1] - 14}`, fill: 'none', stroke: 'none' }, svg);
    const stream = pen(svg, path1.getAttribute('d'), { c: GOLD, w: 2.4, go: .5 });
    const heart = mk('path', { d: HEART(ch[0] - 4, ch[1], 11), fill: '#ffd98a', stroke: '#fff1c8', 'stroke-width': 1.4, opacity: full ? 1 : 0 }, svg);
    const lFrom = label(svg, SX - 150, SY + 14, '来自', { s: 44, c: GOLD, font: 'Noto Serif SC', wt: 500 }), lThru = label(svg, SX - 150, 300, '通过', { s: 44, c: '#e8c9ab', font: 'Noto Serif SC', wt: 500 });
    const lMom = label(svg, SX, GY + 40, '母亲 · 乳母', { s: 26, c: '#cdbfa3' }), lOne = label(svg, 700, 96, '源头只有一个', { s: 38, c: GOLD });
    // 你，和你给的那个人
    const you = person(svg, { x: 650, y: GY, h: 226, op: 0 }); you.pose(tl, 0, 'give', .01); you.face(tl, 0, 'smile', .01);
    const oth = person(svg, { x: 790, y: GY, h: 200, f: -1, op: 0, beard: true, c: '#d9cfbd' }); oth.pose(tl, 0, 'stand', .01, { a1: 60, e1: 40, a2: 50, e2: 50, curv: 10, lean: 8 }); oth.face(tl, 0, 'sad', .01);
    const yc = you.chestAt({ ...you.st, ...you.cur }), yh = you.handAt(1, { ...you.st, ...you.cur });
    const path2 = mk('path', { d: `M${SX + 40},${SY + 10} C${SX + 200},${SY - 10} ${yc[0] - 40},${yc[1] - 160} ${yc[0] - 4},${yc[1]} C${yc[0]},${yc[1] + 20} ${yh[0] - 20},${yh[1]} ${yh[0] + 30},${yh[1] - 6}`, fill: 'none', stroke: 'none' }, svg);
    const stream2 = pen(svg, path2.getAttribute('d'), { c: GOLD, w: 2.4, go: .5 });
    const bowl = mk('path', { d: `M${yh[0] + 14},${yh[1] - 14} Q${yh[0] + 34},${yh[1] + 8} ${yh[0] + 54},${yh[1] - 14} Z`, fill: 'rgba(255,217,138,.35)', stroke: GOLD, 'stroke-width': 2.4, opacity: 0 }, svg);
    const lYou = label(svg, 650, GY + 40, '你', { s: 30, c: '#e8c9ab' }), lAlso = label(svg, 905, 180, '你也可以是那个“通过”', { s: 30, c: WARM, a: 'end' });
    const all = [lFrom, lThru, lMom, lOne, lYou, lAlso]; gsap.set(all, { opacity: 0 });
    const T1 = t0 + 14;
    if (full) { tl.set(src, { opacity: 1 }, t0); shown(stream); flow(tl, svg, path1, t0, T1); if (s.you !== undefined) [lFrom, lThru, lMom].forEach((l, i) => SHOW(tl, l, AT(s.you) + 1.05 + i * .1)); }
    else {
      tl.to(src, { opacity: .6, duration: 1 }, t0); mom.show(tl, t0 + .2, .9); gsap.set(stream._p, { strokeDashoffset: 1.01 });
      const tF = OPT(AT, s, 'from', t0 + 4), tT = OPT(AT, s, 'thru', tF + 2.5), tO = OPT(AT, s, 'one', tT + 3.5);
      tl.to(src, { opacity: 1, duration: .8 }, tF); SHOW(tl, lFrom, tF);
      DRAW(tl, stream, tT, 1.2); flow(tl, svg, path1, tT + 1, tO + 6); SHOW(tl, lThru, tT + .5); SHOW(tl, lMom, tT + .9);
      tl.fromTo(heart, { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .6, ease: 'back.out(2)', immediateRender: false }, tT + .8);
      SHOW(tl, lOne, tO); tl.to(src._disc, { attr: { r: 180 }, duration: 1.6, ease: 'sine.inOut' }, tO);
    }
    tl.to(src._rays, { rotation: 20, svgOrigin: `${SX} ${SY}`, duration: 20, ease: 'none' }, t0);
    gsap.set(stream2._p, { strokeDashoffset: 1.01 });
    if (s.you !== undefined) { const ty = AT(s.you);
      you.show(tl, ty - .2, .8); oth.show(tl, ty + .1, .8); DRAW(tl, stream2, ty + .3, 1.3); flow(tl, svg, path2, ty + 1.4, ty + 10); SHOW(tl, lYou, ty + .4);
      tl.to(bowl, { opacity: 1, duration: .6 }, ty + 1.2); SHOW(tl, lAlso, ty + .2);
      if (s.also !== undefined) { const ta = AT(s.also); oth.pose(tl, ta, { a1: 80, e1: 20, a2: 70, e2: 26, curv: 6, lean: 4 }, .6); oth.face(tl, ta + .5, 'happy'); hearts(tl, svg, 790, 230, ta + .8, 2, { s: 13 }); }
    }
  };

  // 回头一看：一个人走在雾里的路上（前面看不清），越走越老 → 停下来回头，身后走过的路一段段亮起来，每一步旁边都有一只金色的手
  A.lookback = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 400;
    const t0 = AT(s.at), tNow = OPT(AT, s, 'now', t0 + 2.2), tYears = OPT(AT, s, 'years', tNow + 1.4), tBack = OPT(AT, s, 'back', tYears + 1), tHand = OPT(AT, s, 'hand', tBack + 1.2);
    const road = `M60,${GY} C200,${GY - 8} 300,${GY + 4} 420,${GY - 2} S700,${GY + 6} 940,${GY}`;
    const rd = pen(svg, road, { c: '#cdbfa3', w: 2.6, go: .15 });
    const fog = mk('circle', { cx: 830, cy: 300, r: 300, fill: grad(defs, 'lbf' + svg._uid, 'radialGradient', { cx: 830, cy: 300, r: 300 }, [[0, '#a8b4c6', .26], [.5, '#a8b4c6', .12], [1, '#a8b4c6', 0]]), opacity: 0 }, svg);
    const man = person(svg, { x: 120, y: GY, h: 210, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const old = person(svg, { x: 120, y: GY, h: 204, op: 0, beard: true, c: '#e2d6c0' }); old.pose(tl, 0, 'stand', .01, { curv: 8, lean: 6 }); old.face(tl, 0, 'neutral', .01);
    const XE = 640, D = tBack - t0 - .4;
    man.show(tl, t0, .6); man.walk(tl, t0 + .1, XE, D, { ease: 'none' }); old.walk(tl, t0 + .1, XE, D, { ease: 'none' });
    tl.to(man.outer, { opacity: 0, duration: .8 }, tYears); tl.fromTo(old.outer, { opacity: 0 }, { opacity: 1, duration: .8, immediateRender: false }, tYears);
    const q = label(svg, 760, 210, '？', { s: 64, c: '#9fb0c8', font: 'Noto Serif SC', wt: 700 });
    const hands = [160, 260, 360, 460, 560].map((x, i) => { const g = mk('g', { opacity: 0 }, svg), y = GY - 10;
      mk('circle', { cx: x, cy: y - 16, r: 28, fill: 'rgba(255,226,160,.16)' }, g);
      mk('path', { d: `M${x - 12},${y} C${x - 16},${y - 16} ${x - 14},${y - 26} ${x - 10},${y - 32} M${x - 5},${y - 2} L${x - 4},${y - 38} M${x + 2},${y - 2} L${x + 4},${y - 36} M${x + 9},${y} L${x + 11},${y - 28} M${x - 12},${y} C${x - 7},${y + 9} ${x + 9},${y + 9} ${x + 12},${y}`, fill: 'none', stroke: GOLD, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g); return g; });
    const lit = pen(svg, `M60,${GY} C200,${GY - 8} 300,${GY + 4} 420,${GY - 2} S560,${GY + 2} 640,${GY + 1}`, { c: GOLD, w: 3, go: .5 });
    const l1 = label(svg, 760, 300, '当下看不懂', { s: 30, c: '#b9c6da' }), l2 = label(svg, 360, 462, '每一步，都有神的手', { s: 32, c: GOLD });
    gsap.set([q, l1, l2], { opacity: 0 }); gsap.set(lit._p, { strokeDashoffset: 1.01 });
    DRAW(tl, rd, t0 - .3, 1.2); tl.to(fog, { opacity: 1, duration: 1.2 }, t0);
    SHOW(tl, l1, tNow); POPT(tl, q, tNow + .2);
    // 回头
    old.turn(tl, tBack, -1, .4); old.face(tl, tBack + .2, 'wow'); old.to(tl, tBack + .2, .5, { head: 8 });
    tl.to([q, l1], { opacity: .3, duration: .6 }, tBack);
    tl.to(lit._p, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, tBack + .3);
    hands.slice().reverse().forEach((h, i) => tl.to(h, { opacity: 1, duration: .5 }, tHand - .2 + i * .25));
    old.face(tl, tHand + .8, 'happy'); SHOW(tl, l2, tHand + .3);
  };

  // 神一直在说话：一个人站在天地之间；外边：太阳、树、星星一圈圈地向他发出声波 → 里面：胸口的心一下一下地亮（良心），身体也在“说”（心跳线）
  A.speak = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 410, X = 500;
    const t0 = AT(s.at), tOut = OPT(AT, s, 'out', t0 + 2), tIn = OPT(AT, s, 'in', tOut + 2.6), tBody = OPT(AT, s, 'body', tIn + 1.9);
    ground(svg, 40, 960, GY, { a: .38 });
    const sun = glow(svg, 150, 110, 70, { a: .95 });
    const tree = pen(svg, `M820,${GY} L820,${GY - 120} M820,${GY - 80} L790,${GY - 112} M820,${GY - 96} L852,${GY - 130} M770,${GY - 150} C760,${GY - 220} 880,${GY - 230} 872,${GY - 150} C900,${GY - 120} 760,${GY - 110} 770,${GY - 150} Z`, { c: '#a9c3a0', w: 2.8, go: .2 });
    const mtn = pen(svg, `M40,${GY} L160,${GY - 130} L230,${GY - 70} L300,${GY - 150} L420,${GY}`, { c: '#8fa6b8', w: 2.4, go: .12 });
    const stars = mk('g', { opacity: 0 }, svg); [[640, 70], [700, 120], [760, 60], [880, 90], [940, 140]].forEach(([x, y]) => mk('path', { d: `M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2} Z`, fill: '#e8eef8' }, stars));
    const man = person(svg, { x: X, y: GY, h: 222, op: 0, look: 0 }); man.pose(tl, 0, 'stand', .01, { a1: 20, e1: 20, a2: -20, e2: 20 }); man.face(tl, 0, 'neutral', .01);
    const hd = man.headAt({ ...man.st, ...man.cur }), ch = man.chestAt({ ...man.st, ...man.cur });
    // 声波：从三处向人一圈圈地发
    const waves = [[150, 110], [820, 230], [760, 90]].map(([x, y]) => { const a = Math.atan2(hd[1] - y, hd[0] - x); return [0, 1, 2].map(k => { const r = 40 + k * 26, a1 = a - .5, a2 = a + .5;
      return mk('path', { d: `M${n1(x + r * Math.cos(a1))},${n1(y + r * Math.sin(a1))} A${r},${r} 0 0 1 ${n1(x + r * Math.cos(a2))},${n1(y + r * Math.sin(a2))}`, fill: 'none', stroke: '#ffe7b0', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, svg); }); }).flat();
    const heart = mk('path', { d: HEART(ch[0], ch[1], 12), fill: '#ffd98a', stroke: '#fff1c8', 'stroke-width': 1.4, opacity: 0 }, svg);
    const hg = glow(svg, ch[0], ch[1], 50, { a: .8, c0: '#fff3cf', c1: '#ffd98a' });
    const beat = pen(svg, `M${X + 36},${ch[1]} L${X + 80},${ch[1]} L${X + 92},${ch[1] - 24} L${X + 106},${ch[1] + 22} L${X + 120},${ch[1] - 12} L${X + 130},${ch[1]} L${X + 200},${ch[1]}`, { c: CORAL, w: 2.4, go: .3 });
    const lOut = label(svg, 820, 452, '外边：天地万物在说', { s: 28, c: WARM }), lIn = label(svg, 230, 452, '里面：良心、身体在说', { s: 28, c: WARM });
    gsap.set([lOut, lIn], { opacity: 0 }); gsap.set(beat._p, { strokeDashoffset: 1.01 });
    DRAW(tl, mtn, t0 - .2, 1.2); DRAW(tl, tree, t0, 1.2); tl.to([sun, stars], { opacity: 1, duration: 1 }, t0); man.show(tl, t0 + .2, .8); man.breathe(tl, t0, tBody + 4);
    waves.forEach((w, i) => { const k = i % 3; tl.fromTo(w, { opacity: 0 }, { opacity: .9, duration: .45, yoyo: true, repeat: 2 * Math.round((tBody + 3 - tOut) / 1.8) - 1, ease: 'sine.inOut', repeatDelay: .45, immediateRender: false }, tOut + k * .3 + Math.floor(i / 3) * .15); });
    SHOW(tl, lOut, tOut); man.to(tl, tOut + .3, .6, { head: -12 }); man.face(tl, tOut + .4, 'look');
    tl.fromTo(heart, { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .6, ease: 'back.out(2)', immediateRender: false }, tIn); tl.to(hg, { opacity: 1, duration: .8 }, tIn);
    tl.to(heart, { scale: 1.25, transformOrigin: '50% 50%', duration: .3, yoyo: true, repeat: 9, ease: 'power1.inOut', repeatDelay: .25 }, tIn + .6);
    SHOW(tl, lIn, tIn); man.to(tl, tIn + .2, .6, { head: 14 }); man.face(tl, tIn + .3, 'sleep');
    DRAW(tl, beat, tBody, 1.2);
  };


  // 圣经这副眼镜：一片朦胧的风景，一个人走在弯路上 → 读了圣经（一本打开的书，发光）→ 书变成一副眼镜落下来，镜片里清楚了；
  // 他回头看：路的起头是一只摇篮（吃奶的那段日子），一路上每一步旁边都有一只金色的手
  A.glasses = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 540);
    const t0 = AT(s.at), tBible = OPT(AT, s, 'bible', t0 + 6.7), tOn = OPT(AT, s, 'on', tBible + 2.5), tBack = OPT(AT, s, 'back', tOn + 2), tMilk = OPT(AT, s, 'milk', tBack + 1.5), tSee = OPT(AT, s, 'see', tMilk + 1.7);
    const bf = mk('filter', { id: 'gb' + svg._uid, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs); mk('feGaussianBlur', { stdDeviation: 7 }, bf);
    const L1 = 330, L2 = 670, LY = 300, RR = 150;
    const clip = mk('clipPath', { id: 'gc' + svg._uid }, defs); const c1 = mk('circle', { cx: L1, cy: LY, r: RR }, clip), c2 = mk('circle', { cx: L2, cy: LY, r: RR }, clip);
    const ROAD = 'M150,540 C230,450 330,430 420,390 C520,346 610,330 720,296 C790,276 860,262 960,250';
    const scene = (g, sharp) => [
      line(g, 'M40,340 C180,260 300,280 420,310 C540,340 660,240 800,260 C880,272 930,300 980,310', { c: '#a9c3a0', w: 3, go: sharp ? .25 : .1, glow: sharp }),
      line(g, 'M40,410 C220,370 360,410 520,390 C700,368 820,410 980,390', { c: '#8fa6b8', w: 2.6, go: .1, glow: sharp }),
      line(g, ROAD, { c: '#e8d9b8', w: 3, go: .2, glow: sharp })];
    const fog = mk('g', { filter: `url(#gb${svg._uid})`, opacity: 0 }, svg), clear = mk('g', { 'clip-path': `url(#gc${svg._uid})`, opacity: 0 }, svg);
    const lands = [...scene(fog, false), ...scene(clear, true)];
    // 摇篮（路的起头）、路上的手（都在镜片里才看得清）
    const crad = mk('g', { opacity: 0, transform: 'translate(66,-30)' }, clear); const cg = glow(crad, 222, 452, 60, { a: .8, op: 1 });
    mk('path', { d: 'M190,446 Q222,478 254,446 M192,442 L252,442 M196,446 L186,428', fill: 'none', stroke: WARM, 'stroke-width': 3, 'stroke-linecap': 'round' }, crad);
    baby(crad, { x: 208, y: 432, r: 9, face: 'sleep' });
    const hands = [[392, 396], [490, 366], [590, 336], [690, 305]].map(([x, y]) => { const h = mk('g', { opacity: 0 }, clear);
      mk('path', { d: `M${x - 10},${y + 10} C${x - 14},${y - 4} ${x - 12},${y - 14} ${x - 8},${y - 20} M${x - 4},${y + 8} L${x - 3},${y - 24} M${x + 2},${y + 8} L${x + 4},${y - 22} M${x + 8},${y + 10} L${x + 10},${y - 16} M${x - 10},${y + 10} C${x - 6},${y + 18} ${x + 8},${y + 18} ${x + 10},${y + 10}`, fill: 'none', stroke: GOLD, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, h);
      mk('circle', { cx: x, cy: y, r: 26, fill: 'rgba(255,226,160,.18)' }, h); return h; });
    // 走路的人（在路上，镜片外也看得见）
    const walker = person(svg, { x: 610, y: 333, h: 96, op: 0, w: 3 }); walker.face(tl, 0, 'neutral', .01);
    // 圣经（一本打开的书，发光）→ 变成眼镜
    const bk = mk('g', { opacity: 0 }, svg); const bglow = glow(bk, 500, 96, 70, { a: .7, op: 1 });
    mk('path', { d: 'M440,80 Q470,70 500,84 Q530,70 560,80 L560,124 Q530,114 500,128 Q470,114 440,124 Z M500,84 L500,128', fill: 'rgba(226,189,118,.18)', stroke: GOLD, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, bk);
    mk('path', { d: 'M470,92 L470,112 M462,100 L478,100', stroke: GOLD, 'stroke-width': 2 }, bk);
    const specs = mk('g', { opacity: 0 }, svg);
    const specL = line(specs, `M${L1 + RR},${LY} A${RR},${RR} 0 1 1 ${L1 - RR},${LY} A${RR},${RR} 0 1 1 ${L1 + RR},${LY} M${L2 + RR},${LY} A${RR},${RR} 0 1 1 ${L2 - RR},${LY} A${RR},${RR} 0 1 1 ${L2 + RR},${LY} M${L1 + RR},${LY - 20} C${L1 + RR + 30},${LY - 44} ${L2 - RR - 30},${LY - 44} ${L2 - RR},${LY - 20} M${L1 - RR},${LY - 30} L${L1 - RR - 60},${LY - 60} M${L2 + RR},${LY - 30} L${L2 + RR + 60},${LY - 60}`, { c: GOLD, w: 4 });
    shown(specL); [...lands].forEach(shown);
    const lBible = label(svg, 500, 60, '有了圣经这副眼镜', { s: 34, c: GOLD }), lMilk = label(svg, 250, 490, '吃奶的那段日子', { s: 26, c: WARM }), lHand = label(svg, 620, 530, '神一直在那里', { s: 32, c: '#f3dcae' });
    gsap.set([lBible, lMilk, lHand], { opacity: 0 });
    tl.to(fog, { opacity: .9, duration: 1.2 }, t0); walker.show(tl, t0 + .4, .8);
    walker.walk(tl, t0 + .6, 700, tBible - t0 - .8, { stride: 26, ease: 'none' }); walker.to(tl, t0 + .6, tBible - t0 - .8, { y: 300 }, 'none');
    walker.face(tl, t0 + 1, 'worry');
    tl.fromTo(bk, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .8, immediateRender: false }, tBible);
    tl.to(bk, { opacity: 0, scale: .6, svgOrigin: '500 100', duration: .5 }, tOn - .1);
    tl.fromTo(specs, { opacity: 0, y: -260 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', immediateRender: false }, tOn);
    [c1, c2].forEach(c => tl.fromTo(c, { attr: { cy: LY - 260 } }, { attr: { cy: LY }, duration: 1.4, ease: 'power3.out', immediateRender: false }, tOn));
    tl.to(clear, { opacity: 1, duration: .6 }, tOn + .2); SHOW(tl, lBible, tOn + .3);
    walker.turn(tl, tBack, -1, .4); walker.face(tl, tBack + .2, 'look');
    tl.to(crad, { opacity: 1, duration: .8 }, tMilk); SHOW(tl, lMilk, tMilk + .2);
    hands.forEach((h, i) => tl.to(h, { opacity: 1, duration: .6 }, tSee + i * .3)); SHOW(tl, lHand, tSee + .8); walker.face(tl, tSee + .4, 'happy');
  };


  // 奶瓶
  const BOTTLE = (par) => { const g = mk('g', {}, par); mk('path', { d: 'M-9,-30 L9,-30 L9,20 Q9,26 3,26 L-3,26 Q-9,26 -9,20 Z', fill: 'rgba(246,239,224,.3)', stroke: '#f6efe0', 'stroke-width': 2.2 }, g); mk('path', { d: 'M-6,-30 L-4,-40 Q0,-46 4,-40 L6,-30 M-9,-6 L9,-6', fill: 'none', stroke: '#f6efe0', 'stroke-width': 2 }, g); return g; };
  // 一个婴儿知道什么：吃（奶瓶）、舒服了就睡（Z）、疼了就哭（扎了一下）→ 他不知道给奶的是谁、半夜抱他的是谁、更不知道神（四周暗暗地浮出来，各带一个问号）
  // → 他只是接受：金色的光点落进他张开的小手
  A.infant = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 420, BX = 470, BY = 300;
    const t0 = AT(s.at), tEat = OPT(AT, s, 'eat', t0 + .6), tSleep = OPT(AT, s, 'sleep', tEat + 1.4), tCry = OPT(AT, s, 'cry', tSleep + 1.3),
      tWho = OPT(AT, s, 'who', tCry + 1.4), tNight = OPT(AT, s, 'night', tWho + 4.2), tGod = OPT(AT, s, 'god', tNight + 1.5), tTake = OPT(AT, s, 'take', tGod + 1.4);
    const bed = stroke(svg, `M${BX - 50},${BY + 30} Q${BX + 50},${BY + 110} ${BX + 160},${BY + 30} M${BX - 56},${BY + 24} L${BX + 166},${BY + 24}`, { c: '#bfae92', w: 3.2 });
    const bb = baby(svg, { x: BX - 10, y: BY - 6, r: 36, face: 'content', op: 0, st: { a1: -60, a2: -30 } });
    const bot = BOTTLE(svg); gsap.set(bot, { x: BX - 120, y: BY - 60, rotation: 50, opacity: 0, transformOrigin: '50% 50%' });
    const pin = mk('g', { opacity: 0 }, svg); mk('path', { d: `M${BX + 150},${BY - 40} l10,-6 l2,12 l10,-4 l-6,10 l10,6 l-12,2 l2,12 l-10,-8 l-8,8 l0,-12 l-12,-2 l10,-6 l-6,-10 Z`, fill: 'rgba(235,162,124,.35)', stroke: CORAL, 'stroke-width': 2 }, pin);
    const wah = label(svg, BX + 70, BY - 90, '哇——', { s: 36, c: '#e0b4a4' });
    const L3 = [['吃', BX - 130], ['睡', BX + 50], ['哭', BX + 220]].map(([t, x]) => label(svg, x, GY + 34, t, { s: 34, c: WARM, font: 'Noto Serif SC', wt: 500 }));
    // 四周暗暗浮出来：给奶的人、半夜抱他的人、光（神）
    const giver = person(svg, { x: 170, y: GY, h: 250, op: 0, dress: true, veil: true, c: '#a89f90' }); giver.pose(tl, 0, 'give', .01); giver.face(tl, 0, 'smile', .01);
    const gb = BOTTLE(giver.root); giver.hold(gb, 1, 6, -10);
    const nightP = person(svg, { x: 830, y: GY, h: 246, f: -1, op: 0, c: '#a89f90' }); nightP.pose(tl, 0, 'carry', .01); nightP.face(tl, 0, 'smile', .01);
    const lamp = mk('g', {}, nightP.root); mk('path', { d: 'M-8,-14 L8,-14 L6,10 L-6,10 Z M0,-14 L0,-24', fill: 'rgba(255,217,138,.3)', stroke: '#ffd98a', 'stroke-width': 2 }, lamp); nightP.hold(lamp, 1, 0, 10);
    const god = glow(svg, BX + 40, 60, 110, { rays: 9, a: .8 });
    const qs = [[170, 120], [820, 120], [BX + 40, 150]].map(([x, y]) => { const q = label(svg, x, y, '？', { s: 44, c: '#c9d6ea', font: 'Noto Serif SC', wt: 700 }); gsap.set(q, { opacity: 0 }); return q; });
    const lTake = label(svg, BX + 40, GY + 34, '他只是接受', { s: 34, c: GOLD });
    gsap.set([wah, ...L3, lTake], { opacity: 0 });
    tl.to(bed, { opacity: 1, duration: .8 }, t0 - .3); bb.show(tl, t0, .8);
    // 吃
    tl.to(bot, { opacity: 1, x: BX - 62, y: BY - 20, duration: .6, ease: 'power2.out' }, tEat - .2); bb.face(tl, tEat, 'suck'); SHOW(tl, L3[0], tEat);
    // 睡
    tl.to(bot, { opacity: 0, x: BX - 120, y: BY - 60, duration: .5 }, tSleep - .1); bb.face(tl, tSleep, 'sleep'); zzz(tl, svg, BX + 30, BY - 60, tSleep + .1, 1.2, { s: 46 }); SHOW(tl, L3[1], tSleep);
    // 哭
    tl.fromTo(pin, { opacity: 0, scale: .4, svgOrigin: `${BX + 160} ${BY - 30}` }, { opacity: 1, scale: 1, svgOrigin: `${BX + 160} ${BY - 30}`, duration: .3, ease: 'back.out(3)', immediateRender: false }, tCry - .1); tl.to(pin, { opacity: 0, duration: .4 }, tCry + .6);
    bb.face(tl, tCry, 'cry'); bb.flail(tl, tCry, 1.4, 1.2); bb.tears(tl, tCry + .1, 1.3); tl.fromTo(wah, { opacity: 0, scale: .7, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)', immediateRender: false }, tCry + .1); tl.to(wah, { opacity: 0, duration: .4 }, tCry + 1.3);
    SHOW(tl, L3[2], tCry);
    // 不知道是谁
    bb.face(tl, tWho - .2, 'sleep'); tl.to(L3, { opacity: .3, duration: .5 }, tWho);
    tl.fromTo(giver.outer, { opacity: 0 }, { opacity: .7, duration: .9, immediateRender: false }, tWho); POPT(tl, qs[0], tWho + .5);
    tl.fromTo(nightP.outer, { opacity: 0 }, { opacity: .7, duration: .9, immediateRender: false }, tNight - .5); POPT(tl, qs[1], tNight);
    tl.to(god, { opacity: .7, duration: 1 }, tGod - .2); POPT(tl, qs[2], tGod + .2);
    // 他只是接受：手张开，光点落下来
    tl.to(qs, { opacity: 0, duration: .5 }, tTake - .2); tl.to(L3, { opacity: 0, duration: .4 }, tTake - .2); SHOW(tl, lTake, tTake + .1);
    bb.to(tl, tTake, .5, { a1: -100, a2: -70 }); bb.face(tl, tTake + .2, 'content'); tl.to(god, { opacity: 1, duration: .8 }, tTake);
    tl.to([giver.outer, nightP.outer], { opacity: .95, duration: .8 }, tTake);
    for (let i = 0; i < 7; i++) { const d = mk('circle', { cx: BX + 10 + (i % 3 - 1) * 26, cy: 120, r: 4, fill: '#fff1c8', opacity: 0, filter: `url(#${figGlow(svg)})` }, svg);
      tl.fromTo(d, { opacity: 0, y: 0 }, { opacity: 1, y: BY - 150 - (i % 2) * 10, duration: 1.1, ease: 'sine.in', immediateRender: false }, tTake + .2 + i * .22); tl.to(d, { opacity: 0, duration: .3 }, tTake + 1.3 + i * .22); }
  };

  // 顺的时候把神忘了，疼了才来找神：一个人躺在太阳底下的躺椅上，端着杯子，舒舒服服 → 背过身去，光暗下来（把神忘了）
  // → 一团乌云、一道闪电，他摔下来、哭 → 跪下来，向着光伸手，光又亮起来
  A.forget = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 470), GY = 420;
    const t0 = AT(s.at), tRest = OPT(AT, s, 'rest', t0 + 1.2), tForget = OPT(AT, s, 'forget', tRest + 1.3), tHit = OPT(AT, s, 'hit', tForget + 1.5), tCry = OPT(AT, s, 'cry', tHit + 1.7), tSeek = OPT(AT, s, 'seek', tCry + 1.3);
    ground(svg, 40, 960, GY, { a: .38 });
    const sun = glow(svg, 820, 90, 90, { a: 1, c0: '#fff6dc', c1: '#ffd27a' });
    const god = glow(svg, 190, 90, 130, { rays: 11, a: .85 });
    const man = person(svg, { x: 520, y: GY, h: 230, op: 0 }); man.pose(tl, 0, 'sit', .01, { lean: -34, head: -6, l1: 76, k1: -60, l2: 70, k2: -64, a1: 60, e1: 70, a2: -30, e2: 30 }); man.face(tl, 0, 'happy', .01);
    const lounge = stroke(svg, `M${520 - 60},${GY - man.SH + 4} L${520 + 70},${GY - man.SH + 4} M${520 - 60},${GY - man.SH + 4} L${520 - 110},${GY - man.SH - 70} M${520 - 40},${GY - man.SH + 4} L${520 - 50},${GY} M${520 + 50},${GY - man.SH + 4} L${520 + 60},${GY}`, { c: '#bfae92', w: 3 });
    const cup = mk('path', { d: 'M-8,-14 L8,-14 L5,6 L-5,6 Z M-10,-14 L10,-14', fill: 'rgba(143,184,216,.3)', stroke: '#bfe0f6', 'stroke-width': 2 }, man.root); man.hold(cup, 1, 4, -6);
    const cloud = mk('g', { opacity: 0 }, svg);
    mk('path', { d: 'M560,170 q-34,0 -30,-28 q4,-28 38,-24 q12,-34 50,-26 q34,-26 64,6 q32,-2 30,26 q22,16 0,40 Z', fill: 'rgba(70,76,92,.7)', stroke: '#8f9bb0', 'stroke-width': 2.4 }, cloud);
    const bolt = mk('path', { d: 'M612,172 l-22,42 l22,0 l-18,46', fill: 'none', stroke: '#f0d28a', 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0 }, svg);
    const l1 = label(svg, 520, 466, '舒服了，就安息，把神忘了', { s: 28, c: WARM }), l2 = label(svg, 520, 466, '疼了，就哭，就来找神', { s: 28, c: '#e0b4a4' });
    gsap.set([l1, l2], { opacity: 0 });
    tl.to([sun, lounge], { opacity: 1, duration: .8 }, t0); tl.to(god, { opacity: .8, duration: .8 }, t0); man.show(tl, t0, .8);
    tl.to(man.st, { e1: 100, duration: .5, yoyo: true, repeat: 3, ease: 'sine.inOut', onUpdate: man.draw }, tRest);   // 喝一口
    SHOW(tl, l1, tRest);
    // 把神忘了：背过去，光暗下来
    man.turn(tl, tForget, -1, .5); man.face(tl, tForget + .3, 'sleep'); tl.to(god, { opacity: .12, duration: 1.2 }, tForget + .3);
    // 碰痛了：乌云、闪电，摔下来
    tl.to(sun, { opacity: .2, duration: .8 }, tHit - .3); tl.fromTo(cloud, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: .7, immediateRender: false }, tHit - .3);
    tl.fromTo(bolt, { opacity: 0 }, { opacity: 1, duration: .08, yoyo: true, repeat: 3, immediateRender: false }, tHit + .3);
    man.face(tl, tHit + .4, 'wow'); tl.to(cup, { opacity: 0, duration: .3 }, tHit + .5);
    man.to(tl, tHit + .5, .6, { y: GY, hy: man.LEG - 8, fk: 1, l1: 88, k1: -4, l2: 84, k2: -2, lean: -20, rot: 0, a1: 120, e1: 30, a2: 110, e2: 30 }, 'power2.in');
    tl.to(lounge, { opacity: .3, duration: .4 }, tHit + .6);
    man.face(tl, tCry, 'cry'); man.tears(tl, tCry + .1, tSeek - tCry + .3); man.to(tl, tCry, .4, { lean: 10, a1: 34, e1: 140, a2: 30, e2: 144 }); tl.to(l1, { opacity: 0, duration: .4 }, tCry - .3); SHOW(tl, l2, tCry);
    // 来找神：转过来，跪着向光伸手
    man.turn(tl, tSeek - .2, 1, .4); man.pose(tl, tSeek, 'kneelUp', .7, { a1: 130, e1: 10, a2: 120, e2: 14, head: -18 }); man.set(tl, tSeek, { x: 470 });
    tl.to(god, { opacity: 1, duration: 1 }, tSeek + .3); man.face(tl, tSeek + .6, 'sad');
  };

  // 他完全依靠：婴儿在母亲怀里睡得软软的；旁边一个大人举着一摞“证明”（我配得），满头大汗 → 纸飞散，婴儿什么都不用证明，就有奶喝
  A.rely = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 440), GY = 390;
    const t0 = AT(s.at), tProve = OPT(AT, s, 'prove', t0 + 1.6);
    ground(svg, 40, 960, GY, { a: .38 });
    const warm = glow(svg, 300, 230, 200, { a: .5, c0: '#ffe9c4', c1: '#f6c98e' });
    const mom = person(svg, { x: 300, y: GY, h: 250, op: 0, dress: true, veil: true }); mom.pose(tl, 0, 'cradle', .01); mom.face(tl, 0, 'smile', .01);
    const bb = baby(mom.root, { r: 15, st: { a1: 10, a2: 30 } }); mom.hold(bb, 'e1', 0, -13, 0, 1); bb.face(tl, 0, 'sleep', .01);
    const ad = person(svg, { x: 720, y: GY, h: 236, f: -1, op: 0 }); ad.pose(tl, 0, 'up', .01, { a1: 150, e1: 30, a2: 140, e2: 34, head: -6 }); ad.face(tl, 0, 'worry', .01);
    const papers = mk('g', {}, ad.root); [0, 1, 2, 3].forEach(i => { const g = mk('g', { transform: `translate(${i * 4},${-i * 9}) rotate(${i % 2 ? 4 : -3})` }, papers); mk('rect', { x: -26, y: -20, width: 52, height: 34, rx: 2, fill: 'rgba(241,232,214,.18)', stroke: PAPER, 'stroke-width': 2 }, g); mk('path', { d: 'M-18,-10 L18,-10 M-18,-2 L14,-2 M-18,6 L10,6', stroke: PAPER, 'stroke-width': 1.4, opacity: .7 }, g); });
    ad.hold(papers, 1, 0, -14);
    const tag = label(svg, 860, 200, '证明：我配得！', { s: 28, c: '#e0b4a4' });
    const lR = label(svg, 300, 432, '他完全依靠', { s: 32, c: GOLD }), lN = label(svg, 720, 432, '不用证明自己配得', { s: 30, c: WARM });
    gsap.set([tag, lR, lN], { opacity: 0 });
    mom.show(tl, t0 - .2, .8); tl.to(warm, { opacity: 1, duration: 1.2 }, t0); SHOW(tl, lR, t0 + .1); mom.breathe(tl, t0, tProve + 14);
    tl.to(mom.st, { lean: 5, duration: 1.3, yoyo: true, repeat: 9, ease: 'sine.inOut', onUpdate: mom.draw }, t0 + .4); zzz(tl, svg, 370, 200, t0 + .4, 6, { s: 24 });
    ad.show(tl, tProve - .6, .6); SHOW(tl, tag, tProve - .3); ad.sweat(tl, tProve, 2.2); ad.hop(tl, tProve, 8, 2, .2);
    // 纸飞散
    const fly = [...papers.children];
    fly.forEach((p, i) => tl.to(p, { x: (i - 1.5) * 70, y: -120 - i * 30, rotation: (i % 2 ? 1 : -1) * 120, opacity: 0, duration: 1.2, ease: 'power2.out' }, tProve + 1.8 + i * .1));
    ad.pose(tl, tProve + 1.9, 'stand', .6); ad.face(tl, tProve + 2.1, 'wow'); tl.to(tag, { opacity: 0, duration: .5 }, tProve + 1.8);
    SHOW(tl, lN, tProve + .5); bb.face(tl, tProve + 1.4, 'content'); hearts(tl, svg, 330, 160, tProve + 1.6, 2, { s: 12 });
  };

  // 下一次：会笑了 → 想让大人听他的（指着要“要！”）→ 大人不照着做（“不行”）→ 哭、蹬腿，用哭来“报复”，大人捂耳朵
  A.tantrum = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420;
    const t0 = AT(s.at), tLaugh = OPT(AT, s, 'laugh', t0 + 2.9), tWant = OPT(AT, s, 'want', tLaugh + 1.2), tNo = OPT(AT, s, 'no', tWant + 2.8), tCry = OPT(AT, s, 'cry', tNo + 1.6), tRev = OPT(AT, s, 'rev', tCry + 1.2);
    ground(svg, 40, 960, GY, { a: .38 });
    const kid = person(svg, { x: 360, y: GY, h: 156, kind: 'child', hair: true, op: 0 }); kid.pose(tl, 0, 'sitFloor', .01); kid.face(tl, 0, 'smile', .01);
    const ad = person(svg, { x: 620, y: GY, h: 236, f: -1, op: 0 }); ad.face(tl, 0, 'smile', .01);
    const shelf = stroke(svg, `M760,250 L900,250 M772,250 L772,420 M888,250 L888,420`, { c: '#bfae92', w: 3 });
    const toy = BOTTLE(svg); gsap.set(toy, { x: 830, y: 222 });
    const want = bubble(svg, 230, 190, 130, 70, 340, 318, { t: '要！', s: 38, kind: 'shout', c: '#f0c2b2' });
    const no = bubble(svg, 700, 120, 140, 66, 640, 186, { t: '不行。', s: 32 });
    const wah = bubble(svg, 220, 180, 200, 92, 340, 318, { t: '哇——！', s: 40, kind: 'shout', c: '#e0a08c', tc: '#f0b4a0' });
    const lab = label(svg, 640, 462, '用哭来“报复”', { s: 32, c: '#e0b4a4' }); gsap.set(lab, { opacity: 0 });
    tl.to(shelf, { opacity: 1, duration: .6 }, t0); kid.show(tl, t0, .8); ad.show(tl, t0 + .2, .8); ad.breathe(tl, t0, tRev + 6);
    // 会笑了
    kid.face(tl, tLaugh, 'laugh'); kid.shakeBody(tl, tLaugh, 1.1, .8); kid.to(tl, tLaugh, .4, { a1: 60, e1: 60, a2: 50, e2: 60 }); hearts(tl, svg, 380, 280, tLaugh + .2, 2, { s: 11 });
    // 想让大人听他的：指着奶瓶
    kid.face(tl, tWant, 'talkf'); kid.pose(tl, tWant, 'sitFloor', .4, { a1: 100, e1: 0, lean: 6 }); POP(tl, want, tWant + .2); kid.hop(tl, tWant + .3, 6, 3, .16);
    // 大人不照着做
    ad.pose(tl, tNo - .2, 'crossF', .5); ad.set(tl, tNo - .2, {}); ad.face(tl, tNo, 'frown'); POP(tl, no, tNo + .1); UNPOP(tl, want, tNo);
    // 哭，蹬腿
    UNPOP(tl, no, tCry); kid.face(tl, tCry, 'cry'); kid.tears(tl, tCry, tRev - tCry + 3);
    kid.pose(tl, tCry, 'sitFloor', .3, { lean: -14, head: -16, a1: 140, e1: 20, a2: 130, e2: 24 });
    tl.to(kid.st, { l1: 120, l2: 60, duration: .18, yoyo: true, repeat: 2 * Math.round((tRev + 2.6 - tCry) / .36) - 1, ease: 'sine.inOut', onUpdate: kid.draw }, tCry + .2);
    kid.gesture(tl, tCry + .2, tRev - tCry + 2.4, 1.2, 3);
    POP(tl, wah, tCry + .2); tl.to(wah, { scale: 1.08, svgOrigin: '340 318', duration: .2, yoyo: true, repeat: 9 }, tCry + .8);
    // 用哭来报复：大人捂耳朵
    ad.pose(tl, tRev, { a1: 150, e1: 130, a2: 140, e2: 136, head: 8, lean: -4 }, .5); ad.face(tl, tRev + .2, 'worry'); ad.sweat(tl, tRev + .4, 2.4);
    SHOW(tl, lab, tRev + .1);
  };


  // ════════ 第七讲（卷一第五章下）的例子：灵魂的屋子 ════════
  // 房子（剖面）：中心 cx、地面 gy、宽 w、墙高 h、屋顶高 rh；st 可以补间（扩建），每帧重画
  const houseD = (cx, gy, w, h, rh) => `M${n1(cx - w / 2)},${gy} L${n1(cx - w / 2)},${n1(gy - h)} L${n1(cx)},${n1(gy - h - rh)} L${n1(cx + w / 2)},${n1(gy - h)} L${n1(cx + w / 2)},${gy}`;
  function house(par, cx, gy, w, h, o = {}) {
    const g = mk('g', { opacity: o.op ?? 1 }, par);
    const fill = mk('path', { fill: o.fill || 'rgba(16,15,14,.6)' }, g);
    const p = mk('path', { fill: 'none', stroke: o.c || '#d9c9a8', 'stroke-width': o.w || 3.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', filter: `url(#${figGlow(svgOf(par))})` }, g);
    const st = { w, h, rh: o.rh ?? w * .3 };
    const H = { g, p, fill, st, cx, gy };
    H.draw = () => { const d = houseD(cx, gy, st.w, st.h, st.rh); p.setAttribute('d', d); fill.setAttribute('d', d + ' Z'); if (H.onDraw) H.onDraw(st); };
    H.to = (tl, t, d, props, ease = 'power2.inOut') => { tl.to(st, { ...props, duration: d, ease, onUpdate: H.draw }, t); };
    H.draw(); return H;
  }
  // 杂物：箱子、袜子、纸团、瓶子、书（中心 0,0）
  const JUNK = [
    'M-16,-14 L16,-14 L16,12 L-16,12 Z M-16,-4 L16,-4',
    'M-6,-14 L4,-14 L4,4 L14,8 L12,14 L-6,10 Z',
    'M-10,-6 Q-12,-14 -2,-12 Q8,-16 10,-6 Q14,4 4,8 Q-8,12 -10,-6 Z M-4,-4 L4,2 M2,-8 L-2,0',
    'M-5,-16 L5,-16 L5,-10 L9,-4 L9,14 L-9,14 L-9,-4 L-5,-10 Z',
    'M-14,-10 L14,-14 L16,8 L-12,12 Z M-12,-2 L14,-6',
  ];
  const junk = (par, x, y, k, o = {}) => { const g = mk('g', { transform: `translate(${x},${y}) rotate(${o.r || 0})` }, par); mk('path', { d: JUNK[k % JUNK.length], fill: o.fill || 'rgba(205,191,163,.18)', stroke: o.c || '#bfae92', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g); return g; };

  // 贵客要来：一个人盼了很多年（日历一页页翻）→ 一封信飞来：贵客要来 → 高兴得跳起来 → 转身一看自己那间又小又乱的屋子，脸一下子红了
  A.guest = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 410;
    const t0 = AT(s.at), tCome = OPT(AT, s, 'come', t0 + 3.1), tJoy = OPT(AT, s, 'joy', tCome + 2.9), tTurn = OPT(AT, s, 'turn', tJoy + 2), tRed = OPT(AT, s, 'red', tTurn + 2);
    ground(svg, 40, 960, GY, { a: .38 });
    const man = person(svg, { x: 560, y: GY, h: 220, op: 0 }); man.pose(tl, 0, 'stand', .01, { a1: 20, e1: 40, head: -6 }); man.face(tl, 0, 'neutral', .01);
    // 日历
    const cal = mk('g', { opacity: 0 }, svg); mk('rect', { x: 720, y: 96, width: 120, height: 130, rx: 6, fill: 'rgba(16,15,14,.8)', stroke: '#cdbfa3', 'stroke-width': 2.4 }, cal); mk('rect', { x: 720, y: 96, width: 120, height: 30, rx: 6, fill: 'rgba(224,160,140,.35)' }, cal);
    const pages = []; for (let i = 0; i < 8; i++) { const g = mk('g', {}, cal); mk('rect', { x: 726, y: 132, width: 108, height: 88, fill: '#151413', stroke: '#8f8270', 'stroke-width': 1.2 }, g); label(g, 780, 194, String(2000 + 3 * (7 - i)), { s: 26, c: '#cdbfa3', font: 'Cormorant Garamond', wt: 500, ls: 0 }); pages.push(g); }
    const lWait = label(svg, 780, 262, '盼了很多年', { s: 26, c: '#cdbfa3' });
    // 信
    const env = mk('g', { opacity: 0 }, svg); mk('path', { d: 'M-34,-22 L34,-22 L34,22 L-34,22 Z M-34,-22 L0,4 L34,-22', fill: 'rgba(241,232,214,.16)', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, env); mk('circle', { cx: 0, cy: 6, r: 7, fill: GOLD }, env);
    const lGuest = label(svg, 560, 120, '贵客要来！', { s: 36, c: GOLD, font: 'Noto Serif SC', wt: 500 });
    // 身后那间小屋子（左边），里面乱七八糟
    const hs = house(svg, 210, GY, 250, 150, { rh: 70, op: 0 });
    const mess = [[150, GY - 20, 0, -8], [196, GY - 16, 2, 10], [240, GY - 24, 4, -14], [282, GY - 18, 1, 20], [170, GY - 52, 3, 6], [262, GY - 56, 0, -18]].map(([x, y, k, r]) => junk(hs.g, x, y, k, { r }));
    const web = mk('path', { d: `M86,${GY - 150} q18,8 30,26 M86,${GY - 130} q22,-2 40,-14 M96,${GY - 150} L110,${GY - 112}`, stroke: '#8f8270', 'stroke-width': 1.4, fill: 'none' }, hs.g);
    const lRed = label(svg, 560, 120, '脸一下子就红了', { s: 32, c: '#e8a08c' });
    gsap.set([lWait, lGuest, lRed], { opacity: 0 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tRed + 4); tl.to(cal, { opacity: 1, duration: .6 }, t0 + .2); SHOW(tl, lWait, t0 + .6);
    man.to(tl, t0 + .3, .6, { head: -14 }); man.face(tl, t0 + .4, 'worry');
    pages.slice(1).reverse().forEach((p, i) => { const t = t0 + .7 + i * ((tCome - t0 - 1) / 7); tl.to(p, { opacity: 0, y: 40, rotation: 20, svgOrigin: '780 176', duration: .35, ease: 'power1.in' }, t); });   // 最上面一页是 2000，一页页撕掉
    // 信来了
    tl.fromTo(env, { opacity: 0, x: 980, y: 120, rotation: -30 }, { opacity: 1, x: 640, y: 260, rotation: 8, duration: .9, ease: 'power2.out', immediateRender: false }, tCome);
    man.pose(tl, tCome + .5, { a1: 60, e1: 40, head: 6 }, .5); man.face(tl, tCome + .8, 'wow'); SHOW(tl, lGuest, tCome + .7);
    // 高兴得不得了
    tl.to([cal, lWait], { opacity: .25, duration: .5 }, tJoy - .2); tl.to(env, { opacity: 0, duration: .4 }, tJoy);
    man.face(tl, tJoy, 'laugh'); man.pose(tl, tJoy, 'up', .4); man.hop(tl, tJoy + .2, 26, 2, .22); sparkle(tl, svg, 560, 150, tJoy + .4, { r: 36 }); hearts(tl, svg, 600, 160, tJoy + .3, 2, { s: 13 });
    // 转身一看：小屋子又小又乱
    tl.to(hs.g, { opacity: 1, duration: .9 }, tTurn - .3); man.turn(tl, tTurn, -1, .4); man.pose(tl, tTurn + .1, 'stand', .5, { head: 4 }); man.face(tl, tTurn + .2, 'wow'); tl.to(lGuest, { opacity: 0, duration: .5 }, tTurn);
    // 脸红了
    man.face(tl, tRed, 'worry'); man.blush(tl, tRed + .1); man.sweat(tl, tRed + .3, 2.5); man.pose(tl, tRed, { a1: 30, e1: 140, a2: 20, e2: 60, head: 10 }, .5); SHOW(tl, lRed, tRed + .2);
  };

  // 灵魂的屋子太小：一个人缩在小屋子里，头顶着屋顶；门外一团光（贵客）进不来 → 他自己推墙，推不动 → 求神“请你加以扩充”：屋子撑大，光进来，他站直了
  A.narrow = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420, CX = 400;
    const t0 = AT(s.at), tFit = OPT(AT, s, 'fit', t0 + 2.9), tSelf = OPT(AT, s, 'self', tFit + 2.1), tAsk = OPT(AT, s, 'ask', tSelf + 1.1), tGrow = OPT(AT, s, 'grow', tAsk + 1.3);
    ground(svg, 40, 960, GY, { a: .38 });
    const hs = house(svg, CX, GY, 170, 118, { rh: 52 });
    const man = person(svg, { x: CX - 10, y: GY, h: 200, op: 0 }); man.pose(tl, 0, 'squat', .01, { hy: 92, lean: 30, head: 20, a1: 30, e1: 60, a2: 20, e2: 70 }); man.face(tl, 0, 'worry', .01);
    const door = mk('path', { d: '', fill: 'none', stroke: '#d9c9a8', 'stroke-width': 2.4 }, svg);
    hs.onDraw = st => door.setAttribute('d', `M${n1(CX + st.w / 2)},${GY} L${n1(CX + st.w / 2)},${n1(GY - Math.min(70, st.h * .6))}`);
    hs.draw();
    const lit = glow(svg, 760, 300, 120, { rays: 9, a: .9 });
    const lNo = label(svg, 760, 150, '装不下', { s: 32, c: '#e0b4a4' }), lSelf = label(svg, CX, 150, '自己扩建？', { s: 30, c: '#cdbfa3' }), lAsk = label(svg, CX, 92, '“请你加以扩充”', { s: 34, c: GOLD });
    gsap.set([lNo, lSelf, lAsk], { opacity: 0 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tGrow + 6);
    tl.to(lit, { opacity: 1, duration: 1 }, t0 + .4); tl.to(lit._rays, { rotation: 20, svgOrigin: '760 300', duration: 20, ease: 'none' }, t0);
    // 装不下：光往门口挤，挤不进去
    tl.to(lit, { x: -130, duration: .7, ease: 'power2.in', yoyo: true, repeat: 1 }, tFit); SHOW(tl, lNo, tFit + .4);
    // 自己扩建：推墙，推不动
    man.turn(tl, tSelf - .3, -1, .3); man.to(tl, tSelf, .4, { a1: 86, e1: 10, a2: 80, e2: 14, lean: 24 }); SHOW(tl, lSelf, tSelf);
    tl.to(man.st, { lean: 30, duration: .14, yoyo: true, repeat: 5, onUpdate: man.draw }, tSelf + .4); man.sweat(tl, tSelf + .4, 1.4);
    tl.to(lSelf, { opacity: 0, duration: .4 }, tAsk);
    // 求神：屋子撑大
    man.turn(tl, tAsk, 1, .3); man.pose(tl, tAsk + .2, 'kneelPray', .5); man.face(tl, tAsk + .3, 'sleep'); SHOW(tl, lAsk, tGrow - .1); tl.to(lNo, { opacity: 0, duration: .4 }, tGrow);
    hs.to(tl, tGrow, 1.8, { w: 470, h: 230, rh: 100 }, 'power2.inOut');
    tl.to(lit, { x: -340, y: -70, scale: 1.3, svgOrigin: '760 300', duration: 1.8, ease: 'power2.inOut' }, tGrow + .5);
    man.pose(tl, tGrow + 1.6, 'stand', .8, { head: -14, a1: 40, e1: 30, a2: -30, e2: 30 }); man.face(tl, tGrow + 1.8, 'happy');
    sparkle(tl, svg, CX, GY - 260, tGrow + 1.6, { r: 40 });
  };

  // 只装得下自己：屋子里一个个箱子冒出来（情绪、委屈、计划），把人挤到墙角 → 神来，第一件事：把屋子撑大
  A.selfroom = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 440), GY = 400, CX = 500;
    const t0 = AT(s.at), tB = [OPT(AT, s, 'b1', t0 + 3), OPT(AT, s, 'b2', t0 + 4.2), OPT(AT, s, 'b3', t0 + 5.4)], tGod = OPT(AT, s, 'god', t0 + 6.7), tBig = OPT(AT, s, 'big', tGod + 1.9);
    ground(svg, 40, 960, GY, { a: .38 });
    const hs = house(svg, CX, GY, 330, 170, { rh: 70 });
    const man = person(svg, { x: CX - 120, y: GY, h: 170, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const boxes = [['情绪', CX - 40, 96, 74], ['委屈', CX + 60, 90, 70], ['计划', CX + 10, 84, 66]].map(([t, x, w, hh], i) => {
      const g = mk('g', { opacity: 0 }, svg), y = i === 2 ? GY - 70 - hh : GY - hh;
      mk('rect', { x: x - w / 2, y, width: w, height: hh, rx: 4, fill: 'rgba(224,160,140,.14)', stroke: '#e0b4a4', 'stroke-width': 2.4 }, g);
      label(g, x, y + hh / 2 + 10, t, { s: 26, c: '#f0c2b2', ls: '0.1em' }); g._x = x; return g; });
    const lit = glow(svg, CX, GY - 120, 160, { a: .55, c0: '#fff3cf', c1: '#ffd98a' });
    const lBig = label(svg, CX, 40, '撑大', { s: 38, c: GOLD, font: 'Noto Serif SC', wt: 500 });
    gsap.set(lBig, { opacity: 0 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tBig + 5);
    boxes.forEach((g, i) => { tl.fromTo(g, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .5, ease: 'bounce.out', immediateRender: false }, tB[i]); });
    man.pose(tl, tB[1] + .2, 'squat', .5, { hy: 40, lean: 10, head: 14 }); man.face(tl, tB[1] + .2, 'worry'); man.to(tl, tB[2] + .2, .5, { x: CX - 140 });
    // 神来：屋子撑大，箱子散开，光进来
    hs.to(tl, tBig - .3, 1.8, { w: 600, h: 230, rh: 100 }); tl.to(lit, { opacity: 1, duration: 1.4 }, tGod);
    boxes.forEach((g, i) => tl.to(g, { x: [-160, 170, 60][i] + 0, y: i === 2 ? 70 : 0, duration: 1.6, ease: 'power2.inOut' }, tBig - .1));
    man.pose(tl, tBig + .6, 'stand', .8, { head: -10, a1: 60, e1: 20, a2: -50, e2: 20 }); man.face(tl, tBig + .8, 'happy'); man.to(tl, tBig + .4, 1.2, { x: CX - 40 });
    SHOW(tl, lBig, tBig);
  };


  // 老房子和两种房东：墙裂了、屋顶漏水（水滴进桶里）、地板翘起来，住着不安全 → 一种房东：“那你自己想办法。”抱着胳膊走了
  // → 另一种房东：二话不说，提着工具箱、架上梯子，爬上屋顶就修（当当当），漏停了，裂缝补上了 → 奥古斯丁求的是后一种
  A.oldhouse = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 500), GY = 432, CX = 270;
    const t0 = AT(s.at), tCrack = OPT(AT, s, 'crack', t0 + 1), tLeak = OPT(AT, s, 'leak', tCrack + 1.3), tFloor = OPT(AT, s, 'floor', tLeak + 1.2), tUnsafe = OPT(AT, s, 'unsafe', tFloor + 1.2),
      tA = OPT(AT, s, 'a', tUnsafe + 1.5), tTell = OPT(AT, s, 'tell', tA + 2), tSelf = OPT(AT, s, 'self', tTell + 2.3), tB = OPT(AT, s, 'b', tSelf + 1), tGo = OPT(AT, s, 'go', tB + 1.8), tFix = OPT(AT, s, 'fix', tGo + 2.2), tAug = OPT(AT, s, 'aug', tFix + 1.5);
    ground(svg, 30, 970, GY, { a: .38 });
    const hs = house(svg, CX, GY, 360, 200, { rh: 92 });
    const crack = pen(svg, `M${CX - 180},${GY - 170} l16,22 l-10,16 l18,20 l-8,18 l14,22`, { c: '#e0a08c', w: 2.6, go: .2 });
    const goldCrack = pen(svg, `M${CX - 180},${GY - 170} l16,22 l-10,16 l18,20 l-8,18 l14,22`, { c: GOLD, w: 3.2, go: .5 });
    const bucket = stroke(svg, `M${CX + 40},${GY} L${CX + 34},${GY - 34} L${CX + 86},${GY - 34} L${CX + 80},${GY} Z`, { c: '#9fb0c8', w: 2.4 }); gsap.set(bucket, { opacity: 0 });
    const drops = [0, 1, 2].map(i => mk('path', { d: `M${CX + 60},${GY - 210} q-5,9 0,13 q5,-4 0,-13 Z`, fill: '#a9cdea', opacity: 0 }, svg));
    const plank = mk('path', { d: `M${CX - 120},${GY - 2} L${CX - 50},${GY - 2}`, stroke: '#cdbfa3', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, svg);
    const ten = person(svg, { x: CX - 20, y: GY, h: 196, op: 0 }); ten.face(tl, 0, 'neutral', .01);
    const lUnsafe = label(svg, CX, GY - 330, '住着不安全', { s: 30, c: '#e0a08c' });
    // 房东甲（冷色，一串钥匙）、房东乙（暖色，工具箱）
    const la = person(svg, { x: 760, y: GY, h: 214, f: -1, c: SKY, op: 0 }); la.face(tl, 0, 'neutral', .01);
    const keys = mk('g', {}, la.root); mk('circle', { cx: 0, cy: 8, r: 8, fill: 'none', stroke: SKY, 'stroke-width': 2 }, keys); mk('path', { d: 'M4,14 l4,12 M-4,14 l-2,12', stroke: SKY, 'stroke-width': 2 }, keys); la.hold(keys, 1, 0, 0);
    const lb = person(svg, { x: 1060, y: GY, h: 214, f: -1, c: WARM, op: 0 }); lb.pose(tl, 0, 'carry', .01, { a2: -10, e2: 10, a1: 10, e1: 10 }); lb.face(tl, 0, 'smile', .01);
    const box = mk('g', {}, lb.root); mk('path', { d: 'M-18,0 L18,0 L18,22 L-18,22 Z M-8,0 L-8,-8 L8,-8 L8,0', fill: 'rgba(226,189,118,.25)', stroke: GOLD, 'stroke-width': 2.2 }, box); lb.hold(box, 1, 0, 0);
    const hammer = mk('g', { opacity: 0 }, lb.root); mk('path', { d: 'M0,0 L0,-26', stroke: WARM, 'stroke-width': 3, 'stroke-linecap': 'round' }, hammer); mk('rect', { x: -10, y: -34, width: 20, height: 9, rx: 2, fill: 'rgba(226,189,118,.4)', stroke: GOLD, 'stroke-width': 2 }, hammer); lb.hold(hammer, 1, 0, 0);
    const ladder = stroke(svg, `M${CX + 196},${GY} L${CX + 172},${GY - 210} M${CX + 226},${GY} L${CX + 202},${GY - 210}` + [1, 2, 3, 4, 5, 6].map(k => ` M${n1(CX + 196 - k * 3.4)},${GY - k * 30} L${n1(CX + 226 - k * 3.4)},${GY - k * 30}`).join(''), { c: '#cdbfa3', w: 2.6 }); gsap.set(ladder, { opacity: 0 });
    const tell = bubble(svg, 560, 200, 190, 62, 590, 262, { t: '屋顶漏水了！', s: 28 });
    const noB = bubble(svg, 820, 150, 230, 62, 768, 222, { t: '那你自己想办法。', s: 28, c: '#b9c6da' });
    const bang = label(svg, CX + 140, GY - 300, '当 当 当', { s: 28, c: WARM });
    const lAug = label(svg, 560, 486, '奥古斯丁求的：后一种', { s: 30, c: GOLD });
    gsap.set([lUnsafe, bang, lAug], { opacity: 0 }); gsap.set(goldCrack._p, { strokeDashoffset: 1.01 });
    ten.show(tl, t0, .8); ten.breathe(tl, t0, tAug + 4);
    DRAW(tl, crack, tCrack, .8); ten.turn(tl, tCrack + .2, -1, .3); ten.face(tl, tCrack + .3, 'wow');
    // 漏水
    tl.to(bucket, { opacity: 1, duration: .4 }, tLeak); ten.turn(tl, tLeak, 1, .3); ten.to(tl, tLeak, .4, { head: -22 }); ten.face(tl, tLeak + .2, 'worry');
    const leakEnd = tFix + .6;
    drops.forEach((d, i) => tl.fromTo(d, { opacity: 0, y: 0 }, { opacity: 1, y: 176, duration: .7, ease: 'power1.in', repeat: Math.max(1, Math.floor((leakEnd - tLeak) / 1.05)), repeatDelay: .35, immediateRender: false }, tLeak + i * .35));
    // 地板翘起来，绊一下
    tl.to(plank, { rotation: -18, svgOrigin: `${CX - 50} ${GY - 2}`, duration: .35, ease: 'back.out(3)' }, tFloor); ten.hop(tl, tFloor + .2, 14, 1, .2); ten.to(tl, tFloor + .2, .4, { head: 0 });
    SHOW(tl, lUnsafe, tUnsafe); ten.sweat(tl, tUnsafe, 2);
    // 房东甲
    la.show(tl, tA - .2, .7); ten.walk(tl, tA + .1, 560, 1.4); ten.face(tl, tA + .2, 'neutral');
    POP(tl, tell, tTell); ten.talk(tl, tTell, 1.3, 'talk', 'worry'); ten.gesture(tl, tTell, 1.3, .6);
    la.pose(tl, tSelf - .3, 'crossF', .4); la.face(tl, tSelf - .2, 'frown'); POP(tl, noB, tSelf); UNPOP(tl, tell, tSelf);
    la.turn(tl, tSelf + 1.4, 1, .3); la.walk(tl, tSelf + 1.6, 1040, 1.8); la.fade(tl, tSelf + 2.4, 0, 1); UNPOP(tl, noB, tSelf + 1.6);
    // 房东乙：提着工具箱上来，架梯子，爬上屋顶修
    lb.show(tl, tB - .3, .4); lb.walk(tl, tB - .3, 560, Math.max(1.2, tGo - tB + .2)); ten.face(tl, tB + .4, 'smile');
    tl.to(ladder, { opacity: 1, duration: .5 }, tGo); lb.walk(tl, tGo + .3, CX + 230, 1.0); lb.turn(tl, tGo + 1.3, -1, .2);
    lb.to(tl, tGo + 1.5, 1.4, { x: CX + 186, y: GY - 196, a1: 120, e1: 20, a2: 100, e2: 30 }, 'power1.inOut'); tl.to(box, { opacity: 0, duration: .3 }, tGo + 1.5); tl.to(hammer, { opacity: 1, duration: .3 }, tGo + 2.4);
    lb.pose(tl, tGo + 2.9, 'stand', .4, { y: GY - 196, lean: 18, a1: 110, e1: 60 });
    lb.waveHand(tl, tFix - .2, 2.6, 1.6, 3.4); tl.fromTo(bang, { opacity: 0 }, { opacity: 1, duration: .2, yoyo: true, repeat: 5, immediateRender: false }, tFix);
    DRAW(tl, goldCrack, tFix + .6, 1.2); tl.to(crack, { opacity: 0, duration: .8 }, tFix + 1.4); tl.to(drops, { opacity: 0, duration: .3 }, leakEnd);
    sparkle(tl, svg, CX + 150, GY - 250, tFix + 1.2, { r: 30 }); ten.face(tl, tFix + 1.2, 'happy'); tl.to(lUnsafe, { opacity: 0, duration: .6 }, tFix + 1.2);
    SHOW(tl, lAug, tAug);
  };

  // 成圣：神住进来，一边住，一边修。屋子里亮起一团光；日历一天天翻；今天补这道裂缝（金线补上），明天换掉那根烂掉的梁（换成金色的）
  A.renovate = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 420), GY = 380, CX = 470;
    const t0 = AT(s.at), tLife = OPT(AT, s, 'life', t0 + 2), tIn = OPT(AT, s, 'in', tLife + 1.7), tLive = OPT(AT, s, 'live', tIn + 1.5), tToday = OPT(AT, s, 'today', tLive + 2.3), tTmr = OPT(AT, s, 'tmr', tToday + 1.7);
    ground(svg, 40, 960, GY, { a: .38 });
    const hs = house(svg, CX, GY, 430, 210, { rh: 90 });
    const C1 = `M${CX - 150},${GY - 200} l14,26 l-12,18 l16,24 l-10,20`, C2 = `M${CX + 120},${GY - 130} l-12,18 l14,16 l-10,22`;
    const cr1 = pen(svg, C1, { c: '#e0a08c', w: 2.4, go: .2 }), cr2 = pen(svg, C2, { c: '#e0a08c', w: 2.4, go: .2 }); shown(cr1); shown(cr2);
    const g1 = pen(svg, C1, { c: GOLD, w: 3.2, go: .5 }), g2 = pen(svg, C2, { c: GOLD, w: 3.2, go: .5 });
    const beamBad = stroke(svg, `M${CX - 200},${GY - 160} L${CX - 40},${GY - 168} M${CX - 30},${GY - 158} L${CX + 120},${GY - 176} L${CX + 200},${GY - 166}`, { c: '#7f7264', w: 6 });
    const beamNew = pen(svg, `M${CX - 200},${GY - 166} L${CX + 200},${GY - 166}`, { c: GOLD, w: 6, go: .5 });
    const lit = glow(svg, CX, GY - 90, 150, { a: .6, c0: '#fff3cf', c1: '#ffd98a' });
    // 日历：第 1 天、第 2 天……一页页翻过去
    const cal = mk('g', { opacity: 0 }, svg); mk('rect', { x: 800, y: 60, width: 130, height: 96, rx: 6, fill: 'rgba(16,15,14,.85)', stroke: '#cdbfa3', 'stroke-width': 2.2 }, cal);
    const days = ['第 1 天', '第 2 天', '第 3 天', '第 100 天', '第 1000 天', '……'].map((t, i) => { const e = label(cal, 865, 118, t, { s: 26, c: '#e8dcc4' }); gsap.set(e, { opacity: i ? 0 : 1 }); return e; });
    const lLife = label(svg, 865, 196, '一辈子的工程', { s: 26, c: WARM }), lToday = label(svg, CX - 150, GY - 26, '今天', { s: 24, c: GOLD }), lTmr = label(svg, CX + 120, GY - 196, '明天', { s: 24, c: GOLD });
    gsap.set([lLife, lToday, lTmr], { opacity: 0 }); gsap.set([g1._p, g2._p, beamNew._p].flat(), { strokeDashoffset: 1.01 });
    tl.to(cal, { opacity: 1, duration: .6 }, t0 + .2);
    days.forEach((d, i) => { if (!i) return; const t = t0 + .6 + i * ((tLife + 1 - t0) / days.length); tl.to(days[i - 1], { opacity: 0, y: -10, duration: .3 }, t); tl.fromTo(d, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3, immediateRender: false }, t); });
    SHOW(tl, lLife, tLife);
    tl.to(lit, { opacity: 1, duration: 1.4 }, tIn); sparkle(tl, svg, CX, GY - 90, tIn + .5, { r: 40 });
    tl.to(lit._disc, { attr: { r: 175 }, duration: 1, yoyo: true, repeat: 3, ease: 'sine.inOut' }, tLive);
    DRAW(tl, g1, tToday, 1.2); tl.to(cr1, { opacity: 0, duration: .8 }, tToday + .8); SHOW(tl, lToday, tToday + .3); DRAW(tl, g2, tToday + .8, 1);  tl.to(cr2, { opacity: 0, duration: .8 }, tToday + 1.4);
    tl.to(beamBad, { opacity: 0, duration: .7 }, tTmr + .4); DRAW(tl, beamNew, tTmr + .6, 1.2); SHOW(tl, lTmr, tTmr + .3);
  };

  // 修了这么多年还是这么破？一个人看着自己的屋子发愁 → 修房子的时候：搭起脚手架、地上堆着砖、墙上刨开口子，看着更乱了
  // → “那不是坏了，是在修”：立起一块“施工中”的牌子，屋里亮起修房子的光
  A.mess = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420, CX = 600;
    const t0 = AT(s.at), tWhy = OPT(AT, s, 'why', t0 + 3.9), tFix = OPT(AT, s, 'fixing', tWhy + 2.6), tBrick = OPT(AT, s, 'brick', tFix + 5.3), tHole = OPT(AT, s, 'hole', tBrick + 1.8), tOk = OPT(AT, s, 'ok', tHole + 1.9);
    ground(svg, 40, 960, GY, { a: .38 });
    const hs = house(svg, CX, GY, 380, 200, { rh: 86 });
    const man = person(svg, { x: 210, y: GY, h: 214, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const thinkB = bubble(svg, 300, 120, 230, 90, 236, 196, { kind: 'think', t: '还是这么破？', s: 28, c: '#b9c6da' });
    const scaff = pen(svg, `M${CX - 210},${GY} L${CX - 210},${GY - 250} M${CX + 210},${GY} L${CX + 210},${GY - 250} M${CX - 230},${GY - 80} L${CX + 230},${GY - 80} M${CX - 230},${GY - 170} L${CX + 230},${GY - 170} M${CX - 210},${GY} L${CX - 150},${GY - 80} M${CX + 210},${GY} L${CX + 150},${GY - 80}`, { c: '#9f9585', w: 2.4, go: .1 });
    const bricks = mk('g', { opacity: 0 }, svg); [[0, 0], [1, 0], [2, 0], [3, 0], [.5, 1], [1.5, 1], [2.5, 1], [1, 2], [2, 2]].forEach(([i, j]) => mk('rect', { x: CX - 340 + i * 30, y: GY - 16 - j * 16, width: 28, height: 14, rx: 2, fill: 'rgba(224,160,140,.25)', stroke: '#e0a08c', 'stroke-width': 1.8 }, bricks));
    const hole = mk('path', { d: `M${CX + 40},${GY - 150} l30,-10 l26,18 l-4,34 l-30,14 l-28,-16 Z`, fill: '#050608', stroke: '#9f9585', 'stroke-width': 2.2, opacity: 0 }, svg);
    const dust = [0, 1, 2].map(i => mk('circle', { cx: CX + 60 + i * 18, cy: GY - 130, r: 10 + i * 4, fill: 'rgba(205,191,163,.18)', opacity: 0 }, svg));
    const sign = mk('g', { opacity: 0 }, svg); mk('path', { d: `M${CX - 120},${GY} L${CX - 120},${GY - 70} M${CX - 186},${GY - 118} L${CX - 54},${GY - 118} L${CX - 54},${GY - 70} L${CX - 186},${GY - 70} Z`, fill: 'rgba(226,189,118,.18)', stroke: GOLD, 'stroke-width': 2.4 }, sign); label(sign, CX - 120, GY - 84, '施工中', { s: 26, c: GOLD, font: 'Noto Serif SC', wt: 500 });
    const lit = glow(svg, CX, GY - 110, 150, { a: .55, c0: '#fff3cf', c1: '#ffd98a' });
    const lOk = label(svg, 500, 466, '那不是坏了，是在修。', { s: 32, c: GOLD });
    gsap.set(lOk, { opacity: 0 }); gsap.set(scaff._p, { strokeDashoffset: 1.01 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tOk + 4); man.face(tl, t0 + .4, 'worry'); man.to(tl, t0 + .3, .5, { head: 6, a1: 28, e1: 140 });
    POP(tl, thinkB, tWhy);
    UNPOP(tl, thinkB, tFix + 1); DRAW(tl, scaff, tFix, 1.4);
    tl.fromTo(bricks, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .6, ease: 'bounce.out', immediateRender: false }, tBrick);
    tl.to(hole, { opacity: 1, duration: .3 }, tHole); dust.forEach((d, i) => { tl.fromTo(d, { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: .9, scale: 1.4, duration: .5, immediateRender: false }, tHole + i * .1); tl.to(d, { opacity: 0, y: -30, duration: .8 }, tHole + .5 + i * .1); });
    man.face(tl, tHole + .2, 'wow');
    tl.fromTo(sign, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: 'back.out(2)', immediateRender: false }, tOk); tl.to(lit, { opacity: 1, duration: 1.2 }, tOk + .2);
    sparkle(tl, svg, CX + 70, GY - 140, tOk + .6, { r: 30 }); sparkle(tl, svg, CX - 290, GY - 30, tOk + .9, { r: 24 });
    man.face(tl, tOk + .4, 'smile'); man.to(tl, tOk + .3, .6, { head: 0, a1: 10, e1: 20 }); SHOW(tl, lOk, tOk + .2);
  };


  // 柜子（正面）：x、y 是左上角；两扇门绕各自的门轴开合（C.st.l / C.st.r：1 关着，0.12 打开）；
  // C.inside 是柜子里面的一层（放东西：门关上就挡住）
  function cabinet(par, x, y, w, h, o = {}) {
    const g = mk('g', { opacity: o.op ?? 1 }, par), c = o.c || '#cdbfa3';
    mk('rect', { x, y, width: w, height: h, rx: 4, fill: 'rgba(14,13,12,.92)', stroke: c, 'stroke-width': 3 }, g);
    mk('path', { d: `M${x + 8},${y + h * .36} L${x + w - 8},${y + h * .36} M${x + 8},${y + h * .68} L${x + w - 8},${y + h * .68}`, stroke: '#6f6658', 'stroke-width': 2.4 }, g);   // 隔板
    const inside = mk('g', {}, g);
    const doorL = mk('g', {}, g), doorR = mk('g', {}, g);
    mk('rect', { x: x + 4, y: y + 4, width: w / 2 - 6, height: h - 8, rx: 2, fill: 'rgba(30,27,24,.97)', stroke: c, 'stroke-width': 2.2 }, doorL); mk('circle', { cx: x + w / 2 - 12, cy: y + h / 2, r: 3.5, fill: c }, doorL);
    mk('rect', { x: x + w / 2 + 2, y: y + 4, width: w / 2 - 6, height: h - 8, rx: 2, fill: 'rgba(30,27,24,.97)', stroke: c, 'stroke-width': 2.2 }, doorR); mk('circle', { cx: x + w / 2 + 12, cy: y + h / 2, r: 3.5, fill: c }, doorR);
    const C = { g, inside, doorL, doorR, x, y, w, h, cx: x + w / 2, cy: y + h / 2, st: { l: o.open ? .12 : 1, r: o.open ? .12 : 1 } };
    C.draw = () => { const hl = x + 4, hr = x + w - 4;
      doorL.setAttribute('transform', `translate(${hl},0) scale(${C.st.l.toFixed(3)},1) translate(${-hl},0)`); doorR.setAttribute('transform', `translate(${hr},0) scale(${C.st.r.toFixed(3)},1) translate(${-hr},0)`); };
    C.draw(); return C;
  }
  const openDoors = (tl, C, t, d = .6) => tl.to(C.st, { l: .12, r: .12, duration: d, ease: 'power2.out', onUpdate: C.draw }, t);
  const closeDoors = (tl, C, t, d = .35) => tl.to(C.st, { l: 1, r: 1, duration: d, ease: 'power3.in', onUpdate: C.draw }, t);
  // 锁（挂锁 + 一条链子）
  const padlock = (par, x, y) => { const g = mk('g', { opacity: 0 }, par);
    mk('path', { d: `M${x - 60},${y - 6} Q${x},${y + 14} ${x + 60},${y - 6}`, fill: 'none', stroke: '#9fb0c8', 'stroke-width': 4, 'stroke-dasharray': '7 4' }, g);
    mk('rect', { x: x - 14, y: y, width: 28, height: 24, rx: 4, fill: 'rgba(20,20,26,.95)', stroke: '#e0a08c', 'stroke-width': 2.4 }, g);
    mk('path', { d: `M${x - 8},${y} L${x - 8},${y - 8} A8,8 0 0 1 ${x + 8},${y - 8} L${x + 8},${y}`, fill: 'none', stroke: '#e0a08c', 'stroke-width': 2.6 }, g); return g; };

  // 塞进柜子：客人来了（叮咚），赶紧把满地的东西往柜子里塞，门一关，背靠着顶住 → 开门“请进请进，地方小，别嫌弃”
  // → 在神面前也常常这样：柜子上了锁（链子、挂锁），人跪在前面很体面地祷告，柜子还在一下一下地鼓
  A.closet = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 480), GY = 420;
    const t0 = AT(s.at), tBell = OPT(AT, s, 'bell', t0 + 1.6), tRush = OPT(AT, s, 'rush', tBell + .8), tShut = OPT(AT, s, 'shut', tRush + 3), tIn = OPT(AT, s, 'come', tShut + 1.1), tSmall = OPT(AT, s, 'small', tIn + 1.5),
      tGod = OPT(AT, s, 'god', tSmall + 1.3), tLock = OPT(AT, s, 'lock', tGod + 6.7), tPray = OPT(AT, s, 'pray', tLock + 1.2);
    ground(svg, 40, 960, GY, { a: .38 });
    const C = cabinet(svg, 120, GY - 220, 170, 220, { open: 1 });
    const door = pen(svg, `M820,${GY} L820,${GY - 240} L920,${GY - 240} L920,${GY}`, { c: '#cdbfa3', w: 3, go: .15 });
    const leaf = mk('rect', { x: 820, y: GY - 240, width: 100, height: 240, fill: 'rgba(30,27,24,.96)', stroke: '#cdbfa3', 'stroke-width': 2.4 }, svg);
    const man = person(svg, { x: 520, y: GY, h: 214, op: 0 }); man.face(tl, 0, 'neutral', .01);
    // 满地的杂物（飞进柜子里）
    const spots = [[360, GY - 14, 0, -6], [420, GY - 12, 1, 20], [480, GY - 14, 2, 0], [600, GY - 14, 3, -10], [650, GY - 12, 4, 14], [700, GY - 16, 0, 8], [560, GY - 70, 2, 30], [390, GY - 60, 4, -20]];
    const items = spots.map(([x, y, k, r]) => junk(C.inside, 0, 0, k, { r }));
    items.forEach((g, i) => gsap.set(g, { x: spots[i][0], y: spots[i][1], rotation: spots[i][3] }));
    const bell = label(svg, 870, GY - 280, '叮咚！', { s: 32, c: WARM });
    const guest = person(svg, { x: 980, y: GY, h: 210, f: -1, c: SKY, op: 0 }); guest.face(tl, 0, 'smile', .01);
    const hi = bubble(svg, 650, 150, 270, 70, 600, 222, { t: '请进请进～', s: 30 });
    const sm = bubble(svg, 650, 150, 300, 70, 600, 222, { t: '地方小，别嫌弃。', s: 30 });
    const sock = junk(svg, C.x + C.w / 2 + 4, C.y + C.h * .55, 1, { r: 80 }); gsap.set(sock, { opacity: 0 });
    const lock = padlock(svg, C.cx, C.cy - 8);
    const pray = bubble(svg, 700, 150, 240, 70, 640, 230, { t: '感谢主……', s: 30, c: WARM });
    const lGod = label(svg, 500, 470, '在神面前，也常常是这样', { s: 30, c: '#e0b4a4' });
    gsap.set([bell, lGod], { opacity: 0 });
    tl.to(leaf, { opacity: 1, duration: .01 }, 0); man.show(tl, t0, .8); man.breathe(tl, t0, tPray + 4); man.face(tl, t0 + .3, 'smile');
    // 叮咚
    tl.fromTo(bell, { opacity: 0, scale: .6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .25, yoyo: true, repeat: 3, ease: 'back.out(2)', immediateRender: false }, tBell);
    man.face(tl, tBell + .2, 'wow'); man.hop(tl, tBell + .2, 10, 1, .18);
    // 赶紧往柜子里塞
    const tA = tRush, span = Math.max(2.4, tShut - tRush - .2), n = items.length;
    man.walk(tl, tA, 360, .7, { stride: 60 }); man.face(tl, tA, 'worry'); man.sweat(tl, tA + .5, span);
    items.forEach((g, i) => { const t = tA + .5 + i * (span - .7) / n;
      tl.to(g, { x: C.cx - 30 + (i % 3) * 30, y: C.y + 40 + (i % 4) * 40, rotation: 200 + i * 30, scale: .9, duration: .45, ease: 'power2.in' }, t);
      if (i % 2 === 0) man.to(tl, t - .1, .25, { a1: 140, e1: 20, lean: -10 }); else man.to(tl, t - .1, .25, { a1: 40, e1: 20, lean: 30 }); });
    // 门一关，背靠着顶住；露出一只袜子
    closeDoors(tl, C, tShut); man.turn(tl, tShut - .1, 1, .25); man.to(tl, tShut + .1, .4, { x: C.x + C.w + 26, lean: -14, a1: -40, e1: 10, a2: -30, e2: 10 });
    tl.to(sock, { opacity: 1, duration: .2 }, tShut + .35); tl.to(C.g, { x: 3, duration: .08, yoyo: true, repeat: 5 }, tShut + .4);
    // 请进请进
    tl.to(leaf, { scaleX: .1, svgOrigin: `920 ${GY}`, duration: .5, ease: 'power2.out' }, tIn - .4); guest.show(tl, tIn - .3, .5); guest.walk(tl, tIn - .2, 760, 1.1);
    man.face(tl, tIn, 'grin'); man.pose(tl, tIn, 'open', .5, { x: C.x + C.w + 26, lean: 0 }); POP(tl, hi, tIn + .1);
    UNPOP(tl, hi, tSmall - .2); POP(tl, sm, tSmall); man.pose(tl, tSmall, 'bow', .5, { x: C.x + C.w + 26 });
    // 在神面前也一样：客人退去，柜子上锁，跪下来体面地祷告
    UNPOP(tl, sm, tGod - .2); guest.fade(tl, tGod, 0, .8); tl.to(leaf, { scaleX: 1, svgOrigin: `920 ${GY}`, duration: .5 }, tGod); SHOW(tl, lGod, tGod + .1);
    man.walk(tl, tGod + .6, 560, 1.2);
    tl.to(lock, { opacity: 1, duration: .5 }, tLock); tl.fromTo(lock, { y: -14 }, { y: 0, duration: .5, ease: 'bounce.out', immediateRender: false }, tLock);
    man.turn(tl, tLock - .4, 1, .3); man.pose(tl, tPray - .4, 'kneelPray', .6); man.face(tl, tPray - .2, 'smile'); POP(tl, pray, tPray);
    tl.to(C.g, { x: 3, duration: .1, yoyo: true, repeat: 3 }, tPray + 1); tl.to(C.g, { x: -3, duration: .1, yoyo: true, repeat: 3 }, tPray + 2.2);
  };

  // 他把柜子打开了：上了锁的柜子 → 打开锁、拉开门，东西倒出来一地，上面的光照下来 → 他跪在那一堆前面：“我承认，我知道。”
  A.opencab = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420;
    const t0 = AT(s.at), tOpen = OPT(AT, s, 'open', t0 + 1.8), tSay = OPT(AT, s, 'say', tOpen + 1.8), tNo = OPT(AT, s, 'nohide', tSay + 5.2);
    ground(svg, 40, 960, GY, { a: .38 });
    const lightG = glow(svg, 500, 60, 170, { rays: 11, a: .9 });
    const C = cabinet(svg, 330, GY - 220, 170, 220);
    const lock = padlock(svg, C.cx, C.cy - 8); gsap.set(lock, { opacity: 1 });
    const man = person(svg, { x: 640, y: GY, h: 214, f: -1, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const items = [0, 1, 2, 3, 4, 0, 2, 3].map((k, i) => { const g = junk(C.inside, 0, 0, k, { r: i * 40 }); gsap.set(g, { x: C.cx - 40 + (i % 3) * 40, y: C.y + 40 + (i % 4) * 44, opacity: 0 }); return g; });
    const bub = bubble(svg, 770, 150, 300, 72, 690, 236, { t: '我承认，我知道。', s: 32, c: GOLD });
    const lNo = label(svg, 500, 470, '在神面前，不藏了。', { s: 32, c: GOLD });
    gsap.set(lNo, { opacity: 0 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tNo + 4);
    // 打开
    man.walk(tl, tOpen - .8, C.x + C.w + 40, .7); man.pose(tl, tOpen - .1, 'reach', .4, { x: C.x + C.w + 40 });
    tl.to(lock, { opacity: 0, y: 30, duration: .5, ease: 'power2.in' }, tOpen); openDoors(tl, C, tOpen + .4, .6);
    tl.to(lightG, { opacity: .9, duration: 1.2 }, tOpen + .4); tl.to(lightG._rays, { rotation: 20, svgOrigin: '500 60', duration: 12, ease: 'none' }, tOpen);
    items.forEach((g, i) => { tl.set(g, { opacity: 1 }, tOpen + .6); tl.to(g, { x: C.x - 60 + i * 44, y: GY - 14 - (i % 2) * 18, rotation: i * 70 + 20, duration: .6 + (i % 3) * .1, ease: 'bounce.out' }, tOpen + .6 + i * .07); });
    man.face(tl, tOpen + .8, 'sad');
    // 我承认，我知道
    man.pose(tl, tSay - .3, 'kneel', .6, { x: C.x + C.w + 60, a1: 60, e1: 40, a2: 50, e2: 46, head: 10 }); POP(tl, bub, tSay);
    sparkle(tl, svg, C.cx, C.y + 60, tSay + .8, { r: 40 });
    SHOW(tl, lNo, tNo); man.face(tl, tNo, 'neutral');
  };

  // 知道了，可是自己治不好：一个人在单子上勾了“承认”，松一口气 → 承认只是开始；知道屋子脏，屋子还是脏的 → 知道自己有病，
  // 病历上清清楚楚，吃药、贴膏药，都不管用 → 跪下来，向着光伸手：“除了向你外，我向谁呼号呢？”
  A.cure = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 480), GY = 420;
    const t0 = AT(s.at), tThink = OPT(AT, s, 'thk', t0 + 1.8), tSolved = OPT(AT, s, 'solved', tThink + 1.6), tBegin = OPT(AT, s, 'begin', tSolved + 2.6), tDirty = OPT(AT, s, 'dirty', tBegin + 2.2),
      tStill = OPT(AT, s, 'still', tDirty + 1.3), tSick = OPT(AT, s, 'sick', tStill + 2.1), tClear = OPT(AT, s, 'clear', tSick + 2.1), tCant = OPT(AT, s, 'cant', tClear + 1.4), tYou = OPT(AT, s, 'you', tCant + 2), tCry = OPT(AT, s, 'cry', tYou + 1.4);
    ground(svg, 40, 960, GY, { a: .38 });
    const lightG = glow(svg, 840, 80, 160, { rays: 11, a: .9 });
    const man = person(svg, { x: 470, y: GY, h: 222, op: 0 }); man.face(tl, 0, 'neutral', .01);
    // 单子：□ 承认 → ✓
    const sheet = mk('g', { opacity: 0 }, svg); mk('rect', { x: 120, y: 110, width: 200, height: 150, rx: 6, fill: 'rgba(14,13,16,.85)', stroke: '#d9c9a8', 'stroke-width': 2.2 }, sheet);
    mk('rect', { x: 144, y: 140, width: 26, height: 26, rx: 3, fill: 'none', stroke: '#d9c9a8', 'stroke-width': 2 }, sheet); label(sheet, 186, 162, '承认', { s: 26, c: PAPER, a: 'start' });
    mk('rect', { x: 144, y: 196, width: 26, height: 26, rx: 3, fill: 'none', stroke: '#8f8270', 'stroke-width': 2 }, sheet); label(sheet, 186, 218, '干净了', { s: 26, c: '#8f8270', a: 'start' });
    const tick = pen(sheet, 'M148,152 L156,162 L170,140', { c: '#9fd39a', w: 3.4, go: .3 });
    const lBegin = label(svg, 220, 300, '承认，只是开始', { s: 30, c: GOLD });
    // 脏屋子（一小间，墙上一块块污迹）
    const room = house(svg, 220, GY, 200, 120, { rh: 46, op: 0 });
    const dirt = [[170, GY - 60, 16], [236, GY - 90, 12], [270, GY - 40, 18], [200, GY - 22, 10]].map(([x, y, r]) => mk('ellipse', { cx: x, cy: y, rx: r, ry: r * .7, fill: 'rgba(120,100,70,.55)', opacity: 0 }, svg));
    const lDirty = label(svg, 220, 226, '知道屋子脏，屋子还是脏的', { s: 26, c: '#cdbfa3' });
    // 病历（片子上一块阴影）、药、膏药
    const chart = mk('g', { opacity: 0 }, svg); mk('rect', { x: 600, y: 170, width: 150, height: 180, rx: 6, fill: 'rgba(20,26,34,.9)', stroke: '#9fb0c8', 'stroke-width': 2.2 }, chart);
    mk('path', { d: 'M640,210 Q675,190 710,210 L710,300 Q675,320 640,300 Z M675,200 L675,310', fill: 'none', stroke: '#9fb0c8', 'stroke-width': 1.8, opacity: .8 }, chart);
    const spot = mk('circle', { cx: 692, cy: 250, r: 13, fill: 'rgba(224,120,100,.55)' }, chart);
    const pill = mk('g', { opacity: 0 }, svg); mk('rect', { x: -14, y: -6, width: 28, height: 12, rx: 6, fill: 'rgba(235,162,124,.4)', stroke: CORAL, 'stroke-width': 2 }, pill);
    const xMark = label(svg, 470, 150, '✗', { s: 50, c: '#e0a08c', font: 'Noto Serif SC', wt: 700 });
    const cry = bubble(svg, 640, 150, 170, 70, 560, 222, { t: '主啊！', s: 34, c: GOLD });
    gsap.set([lBegin, lDirty, xMark], { opacity: 0 }); gsap.set(tick._p, { strokeDashoffset: 1.01 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tCry + 4);
    // 很多人以为：勾上“承认”，就解决了
    tl.to(sheet, { opacity: 1, duration: .6 }, tThink); man.pose(tl, tThink, 'point', .5, { a1: 70 }); man.turn(tl, tThink - .3, -1, .3);
    DRAW(tl, tick, tSolved, .5); man.face(tl, tSolved + .3, 'happy'); man.pose(tl, tSolved + .4, 'stand', .5);
    SHOW(tl, lBegin, tBegin); man.face(tl, tBegin, 'neutral');
    // 知道屋子脏：屋子还是脏的
    tl.to([sheet, lBegin], { opacity: 0, duration: .5 }, tDirty - .3); tl.to(room.g, { opacity: 1, duration: .6 }, tDirty);
    dirt.forEach((d, i) => tl.to(d, { opacity: 1, duration: .4 }, tDirty + .2 + i * .15)); SHOW(tl, lDirty, tStill);
    // 知道自己有病，自己治不好
    tl.to([room.g, ...dirt, lDirty], { opacity: 0, duration: .5 }, tSick - .3); man.turn(tl, tSick - .2, 1, .3);
    tl.to(chart, { opacity: 1, duration: .6 }, tSick); man.face(tl, tSick + .2, 'worry'); man.pose(tl, tSick, 'think', .5);
    tl.fromTo(spot, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.5, duration: .4, yoyo: true, repeat: 3, immediateRender: false }, tClear);
    man.pose(tl, tCant - .2, { a1: 30, e1: 150, a2: 20, e2: 40 }, .4); gsap.set(pill, { x: 520, y: 300 }); tl.to(pill, { opacity: 1, duration: .2 }, tCant - .1); tl.to(pill, { x: 482, y: 196, duration: .5 }, tCant);
    tl.to(pill, { opacity: 0, duration: .2 }, tCant + .55); POPT(tl, xMark, tCant + .9); man.face(tl, tCant + .8, 'sad');
    // 除了向你外，我向谁呼号呢
    tl.to([chart, xMark], { opacity: 0, duration: .5 }, tYou - .2); tl.to(lightG, { opacity: .8, duration: 1.2 }, tYou); tl.to(lightG._rays, { rotation: 18, svgOrigin: '840 80', duration: 10, ease: 'none' }, tYou);
    man.pose(tl, tYou, 'kneelUp', .7, { a1: 130, e1: 10, a2: 120, e2: 16, head: -20 }); man.face(tl, tYou + .3, 'look');
    POP(tl, cry, tCry); tl.to(lightG, { opacity: 1, duration: .6 }, tCry);
  };

  // 他试过所有的门，最后只剩这一扇：一排门，一个人一扇一扇去推，都推不开（✗）→ 最后一扇开了，里面是光
  A.doors = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 360), GY = 320;
    const t0 = AT(s.at), tTry = OPT(AT, s, 'try', t0 + 1.3), tLast = OPT(AT, s, 'last', tTry + 1.6);
    ground(svg, 40, 960, GY, { a: .38 });
    const DX = [180, 340, 500, 660], LX = 830;
    const doors = DX.map(x => { const g = mk('g', {}, svg); mk('rect', { x: x - 44, y: GY - 200, width: 88, height: 200, rx: 3, fill: 'rgba(24,22,20,.95)', stroke: '#9f9585', 'stroke-width': 2.6 }, g); mk('circle', { cx: x + 28, cy: GY - 100, r: 4, fill: '#9f9585' }, g); return g; });
    const xs = DX.map(x => { const e = label(svg, x, GY - 220, '✗', { s: 40, c: '#e0a08c', font: 'Noto Serif SC', wt: 700 }); gsap.set(e, { opacity: 0 }); return e; });
    const inside = glow(svg, LX, GY - 100, 120, { a: .95 });
    const lastFrame = mk('rect', { x: LX - 50, y: GY - 210, width: 100, height: 210, rx: 3, fill: 'none', stroke: GOLD, 'stroke-width': 3 }, svg);
    const lastLeaf = mk('rect', { x: LX - 50, y: GY - 210, width: 100, height: 210, rx: 3, fill: 'rgba(24,22,20,.97)', stroke: GOLD, 'stroke-width': 2.4 }, svg);
    const man = person(svg, { x: 60, y: GY, h: 170, op: 0 }); man.face(tl, 0, 'worry', .01);
    man.show(tl, t0, .6);
    const step = Math.max(.32, (tLast - tTry - .2) / DX.length);
    DX.forEach((x, i) => { const t = tTry + i * step; man.walk(tl, t - .05, x - 40, step * .55, { stride: 50 }); man.pose(tl, t + step * .5, 'reach', .15, { x: x - 40 });
      tl.to(doors[i], { x: 3, duration: .05, yoyo: true, repeat: 3 }, t + step * .62); tl.to(xs[i], { opacity: 1, duration: .15 }, t + step * .7); });
    man.walk(tl, tLast - .1, LX - 70, .5, { stride: 50 }); man.pose(tl, tLast + .4, 'reach', .2, { x: LX - 70 });
    tl.to(lastLeaf, { scaleX: .08, svgOrigin: `${LX + 50} ${GY}`, duration: .7, ease: 'power2.out' }, tLast + .5); tl.to(inside, { opacity: 1, duration: .8 }, tLast + .6);
    man.face(tl, tLast + .8, 'happy'); man.pose(tl, tLast + 1, 'open', .5, { x: LX - 70 });
    svg.insertBefore(inside, lastFrame);
  };


  // 闻不到的味道：客人进门，一股味道（一缕缕绿烟）冲出来，他捂住鼻子；主人坐在沙发上笑眯眯的，天天住在里面，早就闻惯了
  A.smell = function ({ tl, el, AT, s }) {
    const { svg, defs } = base(el, 440), GY = 390;
    const t0 = AT(s.at), tVisit = OPT(AT, s, 'visit', t0 + 1.3), tSmell = OPT(AT, s, 'smell', tVisit + 1.3), tHost = OPT(AT, s, 'host', tSmell + 2.8), tLive = OPT(AT, s, 'live', tHost + 1.6), tOurs = OPT(AT, s, 'ours', tLive + 7.3);
    ground(svg, 40, 960, GY, { a: .38 });
    const hs = house(svg, 640, GY, 520, 240, { rh: 80 });
    const sofa = stroke(svg, `M640,${GY} L640,${GY - 50} L820,${GY - 50} L820,${GY} M630,${GY - 50} Q630,${GY - 100} 660,${GY - 96} L800,${GY - 96} Q830,${GY - 100} 830,${GY - 50}`, { c: '#bfae92', w: 3 });
    const host = person(svg, { x: 720, y: GY, h: 214, op: 0, f: -1 }); host.pose(tl, 0, 'sit', .01, { lean: -14, a1: 40, e1: 40, a2: -20, e2: 30 }); host.set(tl, 0, { hy: host.LEG - 50 }); host.face(tl, 0, 'happy', .01);
    const guest = person(svg, { x: 60, y: GY, h: 214, op: 0 }); guest.face(tl, 0, 'smile', .01);
    const wisps = [0, 1, 2, 3, 4].map(i => mk('path', { d: `M${470 + i * 26},${GY - 30} q-12,-26 0,-50 q12,-26 0,-52`, fill: 'none', stroke: '#9fc39a', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, svg));
    const lHost = label(svg, 200, 120, '主人自己闻不到', { s: 28, c: WARM }), lUsed = label(svg, 200, 156, '天天住在里面，早就习惯了', { s: 24, c: '#cdbfa3' });
    const lOurs = label(svg, 500, 432, '最危险的，是我们闻不到的那些', { s: 30, c: GOLD });
    gsap.set([lHost, lUsed, lOurs], { opacity: 0 });
    host.show(tl, t0, .8); guest.show(tl, t0 + .2, .6); host.breathe(tl, t0, tOurs + 4);
    guest.walk(tl, tVisit - .3, 400, 1.4);
    // 一进门：味道冲出来
    wisps.forEach((w, i) => tl.fromTo(w, { opacity: 0, y: 10 }, { opacity: .85, y: -20, duration: .9, repeat: Math.max(1, Math.round((tOurs + 3 - tSmell) / 1.8)), yoyo: true, ease: 'sine.inOut', immediateRender: false }, tSmell + i * .18));
    guest.face(tl, tSmell + .2, 'frown'); guest.pose(tl, tSmell + .2, { a1: 30, e1: 148, a2: 10, e2: 40, lean: -8, head: -4 }, .4); guest.hop(tl, tSmell + .2, 8, 1, .16);
    // 主人闻不到
    SHOW(tl, lHost, tHost); host.nod(tl, tHost + .2, 2, 6, .3); SHOW(tl, lUsed, tLive);
    tl.to([lHost, lUsed], { opacity: .3, duration: .6 }, tOurs - .2); SHOW(tl, lOurs, tOurs);
  };

  // 跟着别人犯的罪（偷梨）：一个人的时候，他摇头不去 → 那帮朋友来了：“走，干一票！”你不去多丢人 → 他脸一红，跟着去了，
  // 一起摇树、扔梨 → 别人说那句话，他也跟着笑（笑得很勉强，冒汗）
  A.follow = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420;
    const t0 = AT(s.at), tAlone = OPT(AT, s, 'alone', t0 + 4.4), tNo = OPT(AT, s, 'notgo', tAlone + 1.3), tFr = OPT(AT, s, 'friends', tNo + 1.7), tGo = OPT(AT, s, 'go', tFr + 1.6), tShame = OPT(AT, s, 'shame', tGo + 1.4),
      tOthers = OPT(AT, s, 'others', tShame + 4.2), tMe = OPT(AT, s, 'me', tOthers + 1.9), tSay = OPT(AT, s, 'say', tMe + 1.3), tLaugh = OPT(AT, s, 'laugh', tSay + 1.9), tClean = OPT(AT, s, 'clean', tLaugh + 3.7);
    ground(svg, 40, 960, GY, { a: .38 });
    const wall = stroke(svg, `M640,${GY} L640,${GY - 80} L960,${GY - 80} L960,${GY}`, { c: '#9f9585', w: 3 });
    const tree = pen(svg, `M800,${GY - 80} L800,${GY - 200} M800,${GY - 160} L760,${GY - 200} M800,${GY - 170} L846,${GY - 214} M720,${GY - 230} C700,${GY - 330} 900,${GY - 340} 890,${GY - 230} C910,${GY - 190} 710,${GY - 180} 720,${GY - 230} Z`, { c: '#a9c3a0', w: 3, go: .2 }); shown(tree);
    const pears = [[750, GY - 240], [790, GY - 270], [840, GY - 250], [870, GY - 222], [770, GY - 212]].map(([x, y]) => { const g = mk('path', { d: `M${x},${y - 12} q-12,8 -9,18 q3,10 9,10 q6,0 9,-10 q3,-10 -9,-18 Z M${x},${y - 12} l2,-6`, fill: 'rgba(218,200,120,.4)', stroke: '#e2d38a', 'stroke-width': 2 }, svg); return g; });
    const boy = person(svg, { x: 260, y: GY, h: 196, op: 0, hair: true }); boy.face(tl, 0, 'neutral', .01);
    const fr = [[60, 0], [130, 1], [-20, 2]].map(([x]) => { const p = person(svg, { x, y: GY, h: 200, c: SKY, op: 0 }); p.face(tl, 0, 'grin', .01); return p; });
    const goB = bubble(svg, 190, 120, 220, 70, 150, 196, { t: '走，干一票！', s: 30, c: '#c9d6ea' });
    const lClean = label(svg, 500, 466, '这些跟着别人犯的，也求你清除', { s: 30, c: GOLD });
    gsap.set(lClean, { opacity: 0 });
    boy.show(tl, t0, .8); boy.breathe(tl, t0, tClean + 4);
    // 一个人：不去
    boy.to(tl, tAlone, .5, { head: -10 }); boy.face(tl, tAlone, 'look');
    boy.turn(tl, tNo, -1, .3); boy.turn(tl, tNo + .4, 1, .3); boy.face(tl, tNo + .2, 'frown');
    // 那帮朋友来了
    fr.forEach((p, i) => { p.show(tl, tFr - .2 + i * .12, .4); p.walk(tl, tFr - .2 + i * .12, [150, 70, 10][i], 1.2); });
    POP(tl, goB, tGo); fr[0].pose(tl, tGo, 'wave', .4); fr[0].waveHand(tl, tGo + .3, 1.4);
    fr.forEach((p, i) => { p.pose(tl, tShame + i * .1, i === 1 ? 'point' : { a1: 40, e1: 110, lean: -6 }, .4); p.face(tl, tShame, 'laugh'); p.shakeBody(tl, tShame + .1, 1.6, .8); });
    haha(tl, svg, 120, 200, tShame + .2, 1.4, { c: '#c9d6ea' }); boy.blush(tl, tShame + .4); boy.face(tl, tShame + .4, 'worry');
    // 跟着去了：一起走到树下，摇树、梨掉下来
    UNPOP(tl, goB, tShame + 1.4);
    const tRun = tShame + 1.8;
    [boy, ...fr].forEach((p, i) => { p.pose(tl, tRun - .2, 'stand', .3); p.walk(tl, tRun, [700, 590, 500, 410][i], 1.6); });
    fr[0].pose(tl, tRun + 1.8, 'up', .4); fr[0].waveHand(tl, tRun + 2, 1.6, .8); tl.to(tree, { x: 3, duration: .08, yoyo: true, repeat: 9 }, tRun + 2);
    pears.forEach((p, i) => tl.to(p, { y: GY - 18 - [GY - 240, GY - 270, GY - 250, GY - 222, GY - 212][i], duration: .5, ease: 'bounce.out' }, tRun + 2.2 + i * .15));
    // 别人这么做，我也这么做
    fr[1].pose(tl, tOthers, { a1: 150, e1: 30 }, .3); fr[1].pose(tl, tOthers + .4, { a1: 60, e1: 10 }, .2);
    boy.pose(tl, tMe, { a1: 150, e1: 30 }, .3); boy.pose(tl, tMe + .4, { a1: 60, e1: 10 }, .2);
    // 别人说那句话，我也跟着笑
    fr.forEach((p, i) => { p.face(tl, tSay, 'laugh'); p.shakeBody(tl, tSay + .1, 3, .9); }); haha(tl, svg, 560, 220, tSay + .1, 2.4, { c: '#c9d6ea' });
    boy.face(tl, tLaugh, 'grin'); boy.shakeBody(tl, tLaugh, 2, .6); boy.sweat(tl, tLaugh + .2, 2.2);
    SHOW(tl, lClean, tClean);
  };

  // 打碎了花瓶：孩子拍球，碰倒了桌上的花瓶，碎了 → 跑到妈妈面前：“妈妈，我把花瓶打碎了……” → 妈妈蹲下来抱住他
  // → 要是他觉得说了就会被赶出去：（想的泡泡里）他躲在沙发后面发抖 → 能认罪，是因为有信心
  A.vase = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420;
    const t0 = AT(s.at), tTell = OPT(AT, s, 'tell', t0 + 4.2), tTrust = OPT(AT, s, 'trust', tTell + 2.2), tIf = OPT(AT, s, 'if', tTrust + 2.8), tOut = OPT(AT, s, 'out', tIf + 2.6), tHide = OPT(AT, s, 'hide', tOut + 1.4), tFaith = OPT(AT, s, 'faith', tHide + 1.8);
    ground(svg, 40, 960, GY, { a: .38 });
    const table = stroke(svg, `M120,${GY - 90} L250,${GY - 90} M136,${GY - 90} L136,${GY} M234,${GY - 90} L234,${GY}`, { c: '#bfae92', w: 3 });
    const vase = mk('path', { d: `M185,${GY - 92} q-22,-4 -20,-34 q2,-22 12,-30 l-4,-12 l24,0 l-4,12 q10,8 12,30 q2,30 -20,34 Z`, fill: 'rgba(143,184,216,.25)', stroke: '#bfe0f6', 'stroke-width': 2.4 }, svg);
    const shards = [[-30, 6, -40], [-12, 10, 20], [8, 8, 70], [26, 6, -60]].map(([dx, dy, r]) => mk('path', { d: `M${185 + dx},${GY - 2} l10,-8 l6,8 Z`, fill: 'rgba(143,184,216,.3)', stroke: '#bfe0f6', 'stroke-width': 1.8, opacity: 0, transform: `rotate(${r} ${185 + dx} ${GY - 4})` }, svg));
    const ball = mk('circle', { cx: 0, cy: 0, r: 14, fill: 'rgba(235,162,124,.35)', stroke: CORAL, 'stroke-width': 2.4 }, svg); gsap.set(ball, { x: 330, y: GY - 14 });
    const kid = person(svg, { x: 360, y: GY, h: 140, kind: 'child', hair: true, op: 0 }); kid.face(tl, 0, 'happy', .01);
    const mom = person(svg, { x: 760, y: GY, h: 230, f: -1, op: 0, dress: true, veil: true }); mom.face(tl, 0, 'smile', .01);
    const say = bubble(svg, 560, 140, 370, 70, 600, 236, { t: '妈妈，我把花瓶打碎了……', s: 28 });
    const crash = label(svg, 185, GY - 150, '哐！', { s: 34, c: '#e0b4a4' });
    // 想的泡泡：要是怕被赶出去，他就躲起来
    const th = bubble(svg, 250, 120, 300, 150, 330, 270, { kind: 'think', c: '#b9c6da' });
    stroke(th.inner, `M180,170 L180,140 Q250,128 320,140 L320,170 Z`, { c: '#9f9585', w: 2.4, glow: false });
    const hid = person(th.inner, { x: 290, y: 178, h: 70, kind: 'child', hair: true, w: 2.4 }); hid.pose(tl, 0, 'hugKnees', .01); hid.face(tl, 0, 'cry', .01);
    const lFaith = label(svg, 500, 466, '能认罪，是因为有信心', { s: 32, c: GOLD });
    gsap.set([crash, lFaith], { opacity: 0 });
    tl.to(table, { opacity: 1, duration: .5 }, t0 - .3); kid.show(tl, t0, .6); mom.show(tl, t0 + .2, .6); mom.breathe(tl, t0, tFaith + 4);
    // 拍球 → 碰倒花瓶
    tl.to(ball, { y: GY - 60, duration: .25, yoyo: true, repeat: 3, ease: 'sine.out' }, t0 + .2); kid.waveHand(tl, t0 + .2, 1, .6);
    tl.to(ball, { x: 196, y: GY - 120, duration: .4, ease: 'power1.out' }, t0 + 1.3); tl.to(ball, { x: 120, y: GY - 14, duration: .5, ease: 'bounce.out' }, t0 + 1.7);
    tl.to(vase, { rotation: -80, x: -20, y: 70, svgOrigin: `185 ${GY - 92}`, duration: .45, ease: 'power2.in' }, t0 + 1.6); tl.to(vase, { opacity: 0, duration: .1 }, t0 + 2.05);
    shards.forEach(sh => tl.to(sh, { opacity: 1, duration: .1 }, t0 + 2.05)); tl.fromTo(crash, { opacity: 0, scale: .6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)', immediateRender: false }, t0 + 2.05); tl.to(crash, { opacity: 0, duration: .4 }, t0 + 3);
    kid.face(tl, t0 + 2.1, 'wow'); kid.hop(tl, t0 + 2.1, 10, 1, .16);
    // 跑去告诉妈妈
    kid.walk(tl, tTell - .9, 620, .9, { stride: 46 }); kid.face(tl, tTell, 'sad'); POP(tl, say, tTell); kid.talk(tl, tTell, 1.4, 'talk', 'sad');
    // 妈妈抱住他
    UNPOP(tl, say, tTrust); mom.pose(tl, tTrust, 'squat', .6, { a1: 60, e1: 80, a2: 50, e2: 86, lean: 20, head: 10 }); mom.face(tl, tTrust, 'smile');
    kid.to(tl, tTrust + .1, .6, { x: 690 }); kid.pose(tl, tTrust + .2, 'hug', .5);
    hearts(tl, svg, 700, 250, tTrust + .6, 3, { s: 13 }); kid.face(tl, tTrust + .6, 'content');
    // 要是怕被赶出去：他会藏起来
    POP(tl, th, tIf); tl.to(th, { opacity: .95, duration: .1 }, tOut);
    tl.to(hid.st, { sph: 40, shake: .8, duration: 3, ease: 'none', onUpdate: hid.draw }, tHide);
    UNPOP(tl, th, tFaith - .2); SHOW(tl, lFaith, tFaith);
  };

  // 说心里话最累的是解释：一句一句解释（我不是那个意思……我当时是这样想的……你得弄明白我的处境……），说了半天，对方还是误会
  // → 在神面前不用解释：跪在光里，什么都不用说，祂完全了解
  A.explain = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 470), GY = 420;
    const t0 = AT(s.at), tE = [OPT(AT, s, 'e1', t0 + 3.5), OPT(AT, s, 'e2', t0 + 4.8), OPT(AT, s, 'e3', t0 + 6.5)], tLong = OPT(AT, s, 'long', t0 + 9.1), tMis = OPT(AT, s, 'mis', tLong + 1), tGod = OPT(AT, s, 'god', tMis + 1.5), tKnow = OPT(AT, s, 'know', tGod + 2.3);
    ground(svg, 40, 960, GY, { a: .38 });
    const sp = person(svg, { x: 170, y: GY, h: 214, op: 0 }); sp.face(tl, 0, 'worry', .01);
    const li = person(svg, { x: 380, y: GY, h: 214, f: -1, c: SKY, op: 0, look: 0 }); li.pose(tl, 0, 'crossF', .01); li.face(tl, 0, 'frown', .01);
    const bs = ['我不是那个意思……', '我当时是这样想的……', '你得弄明白我之前的处境……'].map(t => bubble(svg, 250, 160, 340, 56, 200, 236, { t, s: 24 }));
    const mis = bubble(svg, 470, 60, 200, 80, 400, 230, { kind: 'think', t: '？？', s: 34, c: '#c9d6ea' });
    const lit = glow(svg, 780, 200, 170, { rays: 11, a: .9 });
    const me = person(svg, { x: 780, y: GY, h: 214, op: 0 }); me.pose(tl, 0, 'kneelPray', .01); me.face(tl, 0, 'sleep', .01);
    const lNo = label(svg, 780, 456, '不用解释', { s: 30, c: WARM }), lKnow = label(svg, 780, 456, '祂完全了解——比你自己还了解你', { s: 28, c: GOLD });
    gsap.set([lNo, lKnow], { opacity: 0 });
    sp.show(tl, t0, .7); li.show(tl, t0 + .2, .7); li.breathe(tl, t0, tKnow + 4);
    bs.forEach((b, i) => { POP(tl, b, tE[i]); sp.talk(tl, tE[i], 1.1, 'talk', 'worry'); sp.gesture(tl, tE[i], 1.2, .8 + i * .2);
      bs.slice(0, i).forEach((o, j) => tl.to(o, { y: -62 * (i - j), opacity: .42, duration: .4, ease: 'power2.out' }, tE[i] - .05)); });   // 新的一句在最下面（贴着头），旧的往上推、变淡
    sp.sweat(tl, tE[2], 2.5); li.nod(tl, tE[1], 1, -6, .3);
    tl.to(bs[2], { opacity: .5, duration: .5 }, tLong); POP(tl, mis, tMis); li.face(tl, tMis, 'angry');
    // 在神面前
    tl.to([...bs, mis], { opacity: 0, duration: .6 }, tGod - .2); tl.to([sp.outer, li.outer], { opacity: .3, duration: .6 }, tGod);
    tl.to(lit, { opacity: 1, duration: 1.2 }, tGod); tl.to(lit._rays, { rotation: 18, svgOrigin: '780 200', duration: 10, ease: 'none' }, tGod); me.show(tl, tGod + .2, .8); SHOW(tl, lNo, tGod + .4);
    tl.to(lNo, { opacity: 0, duration: .4 }, tKnow - .2); SHOW(tl, lKnow, tKnow); me.face(tl, tKnow, 'content'); sparkle(tl, svg, 780, 280, tKnow + .4, { r: 34 });
  };

  // 给自己的罪起好听的名字：三个写着“罪”的罐子，一句一句往上贴好看的标签（原生家庭、压力大、状态不好）→ 放在一起看：标签一角翘起来，底下还是“罪”
  A.names = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 440), GY = 400;
    const t0 = AT(s.at), tN = [[OPT(AT, s, 'n1', t0 + 3.5), OPT(AT, s, 'l1', t0 + 4.8)], [OPT(AT, s, 'n2', t0 + 6.5), OPT(AT, s, 'l2', t0 + 8)], [OPT(AT, s, 'n3', t0 + 9.7), OPT(AT, s, 'l3', t0 + 12.3)]], tAll = OPT(AT, s, 'all', t0 + 17.7), tName = OPT(AT, s, 'name', tAll + 2.7);
    ground(svg, 40, 960, GY, { a: .38 });
    const man = person(svg, { x: 150, y: GY, h: 214, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const JX = [430, 620, 810], tags = ['原生家庭', '压力大', '状态不太好'];
    const jars = JX.map(x => { const g = mk('g', {}, svg); mk('path', { d: `M${x - 56},${GY} L${x - 60},${GY - 120} Q${x - 60},${GY - 150} ${x - 30},${GY - 154} L${x + 30},${GY - 154} Q${x + 60},${GY - 150} ${x + 60},${GY - 120} L${x + 56},${GY} Z`, fill: 'rgba(30,26,24,.9)', stroke: '#9f9585', 'stroke-width': 2.6 }, g);
      label(g, x, GY - 62, '罪', { s: 44, c: '#e0a08c', font: 'Noto Serif SC', wt: 700 }); return g; });
    const labels = JX.map((x, i) => { const g = mk('g', { opacity: 0 }, svg); mk('rect', { x: x - 54, y: GY - 108, width: 108, height: 62, rx: 8, fill: 'rgba(250,236,214,.95)', stroke: '#e8c9ab', 'stroke-width': 2 }, g);
      label(g, x, GY - 70, tags[i], { s: i === 2 ? 19 : 22, c: '#7a5a48', ls: '0.02em' }).style.stroke = 'none'; mk('path', { d: `M${x - 44},${GY - 98} l6,-6 l6,6 l-6,6 Z M${x + 38},${GY - 56} l5,-5 l5,5 l-5,5 Z`, fill: '#e8a0b0' }, g); return g; });
    const bubbles = ['不是我的问题', '不是我脾气差', '不是我不亲近神'].map(t => bubble(svg, 200, 140, 230, 60, 170, 206, { t, s: 26 }));
    const lName = label(svg, 560, 438, '给自己的罪起好听的名字', { s: 30, c: GOLD });
    gsap.set(lName, { opacity: 0 });
    man.show(tl, t0, .8); man.breathe(tl, t0, tName + 4);
    tN.forEach(([tn, tl2], i) => { POP(tl, bubbles[i], tn); if (i) UNPOP(tl, bubbles[i - 1], tn - .1); man.talk(tl, tn, 1.2, 'talk', 'smile');
      tl.fromTo(labels[i], { opacity: 0, y: -40, rotation: -8, transformOrigin: '50% 50%' }, { opacity: 1, y: 0, rotation: 0, duration: .5, ease: 'back.out(2)', immediateRender: false }, tl2); sparkle(tl, svg, JX[i], GY - 78, tl2 + .4, { r: 30, c: '#f6d6e0' }); });
    UNPOP(tl, bubbles[2], tAll - .3);
    // 放在一起看：标签一角翘起来，露出“罪”
    labels.forEach((g, i) => tl.to(g, { rotation: 14, transformOrigin: '0% 0%', y: -6, duration: .5, ease: 'power2.out' }, tAll + .2 + i * .2));
    man.face(tl, tAll + .4, 'worry'); SHOW(tl, lName, tName);
  };

  // 法庭：被告站在栏杆里，证据一件件摆上法官的台子；他还想狡辩，话里全是窟窿，证据越摆越多 → 不辩了，跪下：“我认了，求你开恩。”
  A.trial = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 480), GY = 420;
    const t0 = AT(s.at), tStand = OPT(AT, s, 'stand', t0 + 1.5), tEvid = OPT(AT, s, 'evid', tStand + 1.7), tArgue = OPT(AT, s, 'argue', tEvid + 2.1), tHoles = OPT(AT, s, 'holes', tArgue + 1.4), tBest = OPT(AT, s, 'best', tHoles + 2.2), tStop = OPT(AT, s, 'stop', tBest + 1.8), tMercy = OPT(AT, s, 'mercy', tStop + 1.6);
    ground(svg, 40, 960, GY, { a: .38 });
    const judge = person(svg, { x: 210, y: 362, h: 236, c: '#cdbfa3', op: 0 }); judge.pose(tl, 0, 'stand', .01, { a1: 40, e1: 70 }); judge.face(tl, 0, 'neutral', .01);
    const bench = mk('g', { opacity: 0 }, svg); mk('path', { d: `M100,250 L330,250 L330,${GY} L100,${GY} Z`, fill: '#0b0b0f', stroke: '#bfb3a0', 'stroke-width': 3.2 }, bench); mk('path', { d: `M86,250 L344,250`, stroke: '#bfb3a0', 'stroke-width': 2.4 }, bench);
    const dock = stroke(svg, `M560,${GY} L560,${GY - 110} L760,${GY - 110} L760,${GY} M560,${GY - 60} L760,${GY - 60} M610,${GY - 110} L610,${GY} M660,${GY - 110} L660,${GY} M710,${GY - 110} L710,${GY}`, { c: '#9f9585', w: 2.6 }); gsap.set(dock, { opacity: 0 });
    const def = person(svg, { x: 660, y: GY, h: 214, f: -1, op: 0 }); def.face(tl, 0, 'worry', .01);
    const evid = [0, 1, 2, 3, 4, 5].map(i => { const g = mk('g', { opacity: 0 }, svg); mk('rect', { x: -30, y: -13, width: 60, height: 26, rx: 4, fill: 'rgba(200,120,100,.2)', stroke: '#e0a08c', 'stroke-width': 2 }, g); label(g, 0, 7, '证据', { s: 18, c: '#f0c2b2', ls: '0.2em', font: 'Noto Serif SC', wt: 500 }); return g; });
    const arg = bubble(svg, 760, 130, 280, 80, 690, 218, { t: '那是因为……其实……', s: 26 });
    const holes = [[690, 118], [770, 140], [840, 122], [720, 150]].map(([x, y]) => mk('circle', { cx: x, cy: y, r: 9, fill: '#050608', stroke: '#9f9585', 'stroke-width': 1.6, opacity: 0 }, svg));
    const q = label(svg, 660, 150, '……', { s: 36, c: '#cdbfa3' });
    const ok = bubble(svg, 780, 150, 260, 70, 700, 250, { t: '我认了，求你开恩。', s: 28, c: WARM });
    gsap.set(q, { opacity: 0 });
    tl.to(bench, { opacity: 1, duration: .7 }, t0); judge.show(tl, t0 + .2, .8); judge.breathe(tl, t0, tMercy + 4);
    tl.to(dock, { opacity: 1, duration: .6 }, tStand - .3); def.show(tl, tStand, .7); def.sweat(tl, tEvid + .5, tStop - tEvid);
    evid.slice(0, 4).forEach((g, i) => tl.fromTo(g, { opacity: 0, x: 215, y: 200 }, { opacity: 1, x: 140 + i * 50, y: 236 - (i % 2) * 6, duration: .5, ease: 'power2.out', immediateRender: false }, tEvid + i * .35));
    POP(tl, arg, tArgue); def.talk(tl, tArgue, tBest - tArgue - .3, 'talk', 'worry'); def.gesture(tl, tArgue, tBest - tArgue - .3, 1.1, 2.2);
    holes.forEach((h, i) => tl.fromTo(h, { opacity: 0, scale: .2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .25, ease: 'back.out(3)', immediateRender: false }, tHoles + i * .25));
    evid.slice(4).forEach((g, i) => tl.fromTo(g, { opacity: 0, x: 215, y: 190 }, { opacity: 1, x: 160 + i * 70, y: 214, duration: .5, ease: 'power2.out', immediateRender: false }, tHoles + .6 + i * .35));
    UNPOP(tl, arg, tBest); tl.to(holes, { opacity: 0, duration: .3 }, tBest); SHOW(tl, q, tBest + .1); def.face(tl, tBest, 'sad');
    tl.to(q, { opacity: 0, duration: .3 }, tStop - .2); def.pose(tl, tStop, 'kneel', .6, { a1: 40, e1: 96, a2: 44, e2: 90, lean: 10, head: 18 }); def.face(tl, tStop + .2, 'sleep');
    POP(tl, ok, tMercy - .1); judge.face(tl, tMercy + .6, 'smile');
  };

  // 最后一个问题：我心里那间屋子，还有没有一个柜子，到现在还锁着？客人来之前赶紧塞进去、把门关上 → 学奥古斯丁：打开它，“我承认，我知道。”
  A.closetq = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 440), GY = 400;
    const t0 = AT(s.at), tCab = OPT(AT, s, 'cab', t0 + 2), tLocked = OPT(AT, s, 'locked', tCab + 1.3), tStuff = OPT(AT, s, 'stuff', tLocked + 3.9), tShut = OPT(AT, s, 'shut', tStuff + 2), tLearn = OPT(AT, s, 'learn', tShut + 3.5), tOpen = OPT(AT, s, 'open', tLearn + 1.2), tSay = OPT(AT, s, 'say', tOpen + 1.7);
    ground(svg, 40, 960, GY, { a: .38 });
    const hs = house(svg, 500, GY, 600, 250, { rh: 90 });
    const lightG = glow(svg, 500, 40, 160, { rays: 11, a: .9 });
    const C = cabinet(svg, 300, GY - 200, 150, 200);
    const inside = [0, 1, 2, 3, 4].map((k, i) => { const g = junk(C.inside, C.cx - 40 + (i % 3) * 36, C.y + 40 + (i % 3) * 52, k, { r: i * 50 }); return g; });
    const lock = padlock(svg, C.cx, C.cy - 8); gsap.set(lock, { opacity: 1 });
    const pulse = glow(svg, C.cx, C.cy, 130, { a: .35, c0: '#ffe9c4', c1: '#f6c98e' }); svg.insertBefore(pulse, C.g);
    const man = person(svg, { x: 640, y: GY, h: 210, f: -1, op: 0 }); man.face(tl, 0, 'neutral', .01);
    const extra = [1, 3].map(k => { const g = junk(C.inside, 0, 0, k); gsap.set(g, { x: 560, y: GY - 14 }); return g; });
    const bub = bubble(svg, 700, 120, 300, 70, 640, 196, { t: '我承认，我知道。', s: 30, c: GOLD });
    man.show(tl, t0, .8); man.breathe(tl, t0, tSay + 4);
    tl.to(pulse, { opacity: 1, duration: .8, yoyo: true, repeat: 3 }, tCab); tl.to(lock, { x: 3, duration: .07, yoyo: true, repeat: 7 }, tLocked);
    // 客人来之前：开锁、把东西塞进去、门关上
    tl.to(lock, { opacity: 0, duration: .3 }, tStuff - .6); openDoors(tl, C, tStuff - .5, .4); man.to(tl, tStuff - .5, .5, { x: C.x + C.w + 40 }); man.face(tl, tStuff - .4, 'worry');
    extra.forEach((g, i) => tl.to(g, { x: C.cx - 20 + i * 30, y: C.y + 150, rotation: 120, duration: .45, ease: 'power2.in' }, tStuff + i * .4));
    closeDoors(tl, C, tShut); tl.to(lock, { opacity: 1, duration: .3 }, tShut + .4); man.pose(tl, tShut, { a1: -30, e1: 10, lean: -10 }, .4);
    // 学奥古斯丁：打开它
    man.pose(tl, tLearn, 'reach', .5); tl.to(lock, { opacity: 0, y: 30, duration: .5, ease: 'power2.in' }, tOpen); openDoors(tl, C, tOpen + .3, .6);
    tl.to(lightG, { opacity: 1, duration: 1.2 }, tOpen + .3); man.face(tl, tOpen + .4, 'neutral');
    man.pose(tl, tSay - .3, 'kneel', .6, { a1: 60, e1: 40, a2: 50, e2: 46, head: 10 }); POP(tl, bub, tSay);
  };


  // 小学生在台上，眼睛往台下找爸妈的脸：孩子在台上说话，头左右张望 → 中间座位上爸妈在笑、挥手 → 孩子不怕了，挺起胸来
  // → 要是那个座位空着：座位上的人淡去，孩子还在演，可脸垮下来，心里是空的
  A.seats = function ({ tl, el, AT, s }) {
    const { svg } = base(el, 500), SY = 200, GY = 470;
    const t0 = AT(s.at), tTalk = OPT(AT, s, 'talk', t0 + 2.5), tLook = OPT(AT, s, 'look', tTalk + 1.9), tFace = OPT(AT, s, 'face', tLook + 4.6), tBrave = OPT(AT, s, 'brave', tFace + 1.9), tEmpty = OPT(AT, s, 'empty', tBrave + 1.4), tHollow = OPT(AT, s, 'hollow', tEmpty + 2.7);
    const stage = stroke(svg, `M160,${SY} Q500,${SY - 14} 840,${SY} L840,${SY + 16} L160,${SY + 16} Z`, { c: '#cdbfa3', w: 2.6, fill: 'rgba(30,27,24,.6)' });
    const spot = mk('path', { d: `M470,0 L530,0 L600,${SY} L400,${SY} Z`, fill: 'rgba(255,231,176,.1)' }, svg);
    const kid = person(svg, { x: 500, y: SY, h: 150, kind: 'child', hair: true, op: 0, look: 0 }); kid.face(tl, 0, 'worry', .01);
    // 观众席：一排座位，中间那个是爸妈
    const SX = [220, 340, 500, 660, 780];
    const seatD = x => `M${x - 46},${GY} L${x - 46},${GY - 40} M${x + 46},${GY} L${x + 46},${GY - 40} M${x - 50},${GY - 40} L${x + 50},${GY - 40} M${x - 40},${GY - 40} L${x - 40},${GY - 96} Q${x},${GY - 112} ${x + 40},${GY - 96} L${x + 40},${GY - 40}`;
    SX.forEach(x => stroke(svg, seatD(x), { c: '#8f8270', w: 2.4 }));
    const aud = [220, 340, 660, 780].map((x, i) => { const p = person(svg, { x, y: GY + 2, h: 150, c: '#7f8aa0', op: 0, look: 0 }); p.pose(tl, 0, 'sit', .01, { hy: p.LEG - 40, a1: 30, e1: 30 }); return p; });
    const par = person(svg, { x: 500, y: GY + 2, h: 160, op: 0, look: 0, dress: true, veil: true }); par.pose(tl, 0, 'sit', .01, { hy: par.LEG - 40, a1: 30, e1: 30 }); par.face(tl, 0, 'happy', .01);
    const pg = glow(svg, 500, GY - 80, 90, { a: .7, c0: '#ffe9c4', c1: '#f6c98e' }); svg.insertBefore(pg, par.outer);
    const bub = bubble(svg, 660, 70, 150, 56, 560, 110, { t: '……然后……', s: 24 });
    const lBrave = label(svg, 300, 120, '他就不怕了', { s: 30, c: GOLD }), lEmpty = label(svg, 300, 120, '心里也是空的', { s: 30, c: '#b9c6da' });
    gsap.set([lBrave, lEmpty], { opacity: 0 });
    tl.to(stage, { opacity: 1, duration: .6 }, t0 - .2); kid.show(tl, t0, .8); kid.breathe(tl, t0, tHollow + 4);
    aud.forEach((p, i) => tl.fromTo(p.outer, { opacity: 0 }, { opacity: .7, duration: .6, immediateRender: false }, t0 + .2 + i * .1));
    // 台上说话，眼睛往台下找
    POP(tl, bub, tTalk); kid.talk(tl, tTalk, tFace - tTalk - .2, 'talk', 'worry'); kid.gesture(tl, tTalk, 1.5, .5);
    [0, 1, 2, 3].forEach(k => kid.to(tl, tLook + k * .9, .26, { head: 16 + (k % 2) * 4, f: k % 2 ? -1 : 1 }, 'sine.inOut'));
    // 看见那张脸在笑：爸妈挥手，孩子亮起来
    par.show(tl, tFace - .3, .7); tl.to(pg, { opacity: 1, duration: .8 }, tFace); par.pose(tl, tFace + .2, 'sit', .4, { hy: par.LEG - 40, a1: 150, e1: 20 }); par.waveHand(tl, tFace + .5, 1.8, 1);
    kid.to(tl, tFace + .1, .4, { f: 1, head: 14 }); kid.face(tl, tFace + .4, 'happy'); UNPOP(tl, bub, tFace + .2);
    kid.pose(tl, tBrave, 'open', .5, { head: -6, f: 1 }); kid.hop(tl, tBrave + .3, 10, 1, .2); SHOW(tl, lBrave, tBrave); sparkle(tl, svg, 500, 60, tBrave + .3, { r: 30 });
    // 要是那个座位空着
    tl.to([par.outer, pg], { opacity: 0, duration: 1 }, tEmpty); tl.to(lBrave, { opacity: 0, duration: .5 }, tEmpty);
    kid.pose(tl, tEmpty + .6, 'stand', .6, { head: 22, lean: 4 }); kid.face(tl, tEmpty + .6, 'sad');
    kid.gesture(tl, tHollow - 1.2, 2.2, .35, 1.2); SHOW(tl, lEmpty, tHollow); tl.to(spot, { opacity: .35, duration: 1 }, tEmpty + .5);
  };

  window.FIG = { person, baby, POSE, stroke, pen, shown, ground, glow, bubble, POP, UNPOP, hearts, zzz, haha, sparkle, label, HEART, rgba, figGlow, SKY, DIM, WARM, ROSE };
  window.ANIMS = window.ANIMS || {};
})();
