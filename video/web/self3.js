// 本人录制 · 第一讲 · 翻开第一页（卷一第一章逐句）——版式沿用 ep5（配音版），时间全部对到本人录音上
(async function () {
  const K = await kit(); const { $, $$, T, E, D, W, EP } = K; K.secPrefix = '第一讲 · ';
  const P = (p, n) => atP(EP, p, n);   // 录音里实际说到某个词的时刻（讲稿里的说法和录音不一样时用它）
  const S3 = EP.chars.map(c => c[0]).join('');
  const Q = (ctx, w = ctx, n = 0) => { let i = -1; for (let k = 0; k <= n; k++) { i = S3.indexOf(ctx, i + 1); if (i < 0) throw new Error('录音里找不到：' + ctx); } const j = i + ctx.indexOf(w); if (j < i) throw new Error(ctx + ' 里没有 ' + w); return EP.chars[j][1]; };   // 在一句话（ctx）里找某个词（w）说出来的时刻
  const br = $('.breath'); for (let i = 0; i < 36; i++) { const d = document.createElement('i'); d.style.left = (260 + (i % 6) * 18) + 'px'; d.style.top = (640 + ((i * 37) % 90)) + 'px'; br.appendChild(d); }
  await K.prepare('.sk .x');
  const { tl, IN, OUT, DRAW, type, big, stamp, light, flash, scene, on, chars } = K;
  const fade = (sel, at) => tl.to(sel, { opacity: 0, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' }, at - 0.45);
  const strike = (sel, at) => { gsap.set(sel, { scaleX: 0, opacity: 1 }); tl.to(sel, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, at); };
  const red = (sel, at, col = '#b8321c') => tl.to(chars(sel), { color: col, duration: 0.5, stagger: 0.02 }, at);
  // 场景切换点：每个场景从某一句开始
  const S = [['#w1', 'c002'], ['#w2', 'c003'], ['#w3', 'c012'], ['#w4', 'c022'], ['#w5', 'c028'], ['#w6', 'c029'], ['#w7', 'c039'], ['#w8', 'c051'], ['#w9', 'c064'],
    ['#w10', 'c070'], ['#w11', 'c074'], ['#w12', 'c082'], ['#w13', 'c084'], ['#w14', 'c093'], ['#w15', 'c107'], ['#w16', 'c110'], ['#w17', 'c117'], ['#w18', 'c124'],
    ['#w19', 'c133'], ['#w20', 'c142'], ['#w21', 'c155'], ['#w22', 'c159'], ['#w23', 'c169'], ['#w24', 'c183'], ['#w25', 'c188'], ['#w26', 'c190'], ['#w27', 'c201'],
    ['#w28', 'c216'], ['#w29', 'c218'], ['#w30', 'c230'], ['#w31', 'c239'], ['#w32', 'c246'], ['#w33', 'c261'], ['#w34', 'c271'], ['#w35', 'c275']];
  const A = {}; S.forEach(([s, c], i) => { const a = T(c) - 0.1, b = i < S.length - 1 ? T(S[i + 1][1]) - 0.1 : EP.total - 6.6; A[s] = a; scene(s, a, b); });
  const isw = ch => /[一-鿿0-9]/.test(ch);
  const typeSync = (sel, ids) => {   // 原文卡：每个字等念到这个字时才出来（用录音里逐字的时刻）
    const cs = chars(sel), say = ids.flatMap(id => [...K.C[id].say].filter(isw)), ts = ids.flatMap(id => K.C[id].ct);
    let k = 0, t = T(ids[0]);
    for (const c of cs) {
      const ch = c.textContent;
      if (isw(ch)) { let j = k; while (j < say.length && j < k + 4 && say[j] !== ch) j++; if (say[j] === ch) k = j; if (k < ts.length) t = Math.max(t, ts[k]); k++; }
      IN(c, t - 0.08, { d: 0.45, y: 8, blur: 6 });
    }
  };
  const card = (s, c0, c1) => { IN(s + ' .qcard', A[s] + 0.05, { y: 40, d: 0.9 }); typeSync(s + ' .cd-t', EP.cues.map(c => c.id).filter(id => id >= c0 && id <= c1)); light(A[s], { light: 0.75, rays: 0.6 }); };

  // 片头
  scene('#w0', 0, A['#w1']); light(0.1, { light: 0.7, rays: 0.7 }, 2.5);
  IN('#w0 .op-k', 0.5, { d: 1 }); big('#w0 .op-t', 0.8, { st: 0.12 }); IN('#w0 .op-l', 1.8, { d: 1.2, y: 10 });

  // ── 第一句
  card('#w1', 'c002', 'c002'); red('#w1 .hl', E('c002') + 0.1);
  light(A['#w2'], { light: 0.5, rays: 0.4 });
  IN('#w2 .tx.k', W('c004', '尊敬的各位领导') - 0.1); strike('#w2 .sk .x', E('c004') - 0.4);
  IN('#w2 .scr', T('c007') - 0.1, { y: 30 }); type('#w2 .sc-t', W('c008', '陛下英明'), 1.4, { d: 0.6 }); stamp('#w2 .lie', W('c009', '全是谎话'), -8);
  tl.to(['#w2 .tx.k', '#w2 .scr', '#w2 .lie'], { opacity: 0.22, duration: 0.6 }, T('c010') - 0.2);
  IN('#w2 .lbl', T('c010'), { d: 0.6, y: 10 }); big('#w2 .great', W('c010', '还是伟大'), { st: 0.18, d: 1.2 }); flash(W('c010', '还是伟大') + 0.2, 960, 790, 0.55);
  light(A['#w3'], { light: 0.55, rays: 0.45 });
  IN('#w3 .p1', W('c013', '诗篇') - 0.1); IN('#w3 .p2', P('诗篇的147') - 0.1);
  DRAW('#w3 .m1', T('c017'), 1.0); DRAW('#w3 .m2', T('c017') + 0.15, 1.0); type('#w3 .h2', P('他开口对神说的第一句话'), 1.2, { d: 0.6 });
  IN('#w3 .tx.k', W('c021', '一个修辞学教授') - 0.1, { y: 20 });
  light(A['#w4'], { light: 0.6, rays: 0.5 });
  big('#w4 .h1 > span:first-child', T('c022'), { st: 0.12 }); IN('#w4 .eq', W('c023', '就是配得') - 0.3, { y: 0, d: 0.5 }); big('#w4 .h1 > span:last-child', W('c023', '就是配得'), { st: 0.12 });
  gsap.set('#w4 .sun', { attr: { cy: 540 } }); on('#w4 svg', P('好看的落日') - 0.2); DRAW('#w4 .hzl', P('好看的落日') - 0.2, 1.2); IN('#w4 .sun', P('落日'), { y: 0, d: 1.0, blur: 4 });
  tl.to('#w4 .sun', { attr: { cy: 650 }, duration: D('c026') + 2, ease: 'sine.in' }, T('c026')); IN('#w4 .coral', W('c025', '太美了') - 0.1, { y: 10 });
  IN('#w4 .h3', T('c026'), { y: 14, d: 0.7 }); type('#w4 .h2', T('c027'), D('c027') * 0.8, { d: 0.6 });

  // ── 第二句
  card('#w5', 'c028', 'c028'); red('#w5 .hl', E('c028') - 0.3); red('#w5 .hl2', E('c028') - 0.6, '#8a5a1a');
  light(A['#w6'], { light: 0.5, rays: 0.4 });
  $$('#w6 .t1 span').forEach((s, i) => IN(s, [W('c032', '一位主教'), W('c032', '一个修辞学家'), W('c033', '米兰的教授'), W('c033', '希波的主教')][i] - 0.1, { y: 16, d: 0.6 }));
  $$('#w6 .t1 .x').forEach((x, i) => strike(x, W('c033', '一个没用') + i * 0.12));
  big('#w6 .h1', W('c034', '一个人'), { st: 0.14 }); IN('#w6 .tx.k', W('c034', '万物里') - 0.1, { y: 10 });
  $$('#w6 .t2 span').forEach((s, i) => IN(s, W('c036', ['在哪儿上班', '什么职位', '孩子在哪个学校'][i]) - 0.1, { y: 16, d: 0.6 }));
  type('#w6 .h2', T('c038'), D('c038') * 0.7, { d: 0.6 });
  light(A['#w7'], { light: 0.45, rays: 0.35 });
  const r3 = $$('#w7 .r3 > div'); r3.forEach((r, i) => IN(r, T('c039') + 0.1 + i * 0.35, { x: -30, y: 0, d: 0.7 }));
  tl.to([r3[1], r3[2]], { opacity: 0.25, duration: 0.5 }, T('c040'));
  IN('#w7 .fr-k', T('c044'), { d: 0.6, y: 10 }); on('#w7 .frd', T('c044')); type('#w7 .fr-t', T('c045'), D('c045') * 0.4, { d: 0.6 }); type('#w7 .fr-t2', W('c046', '他死了'), 1.6, { d: 0.6 });
  fade('#w7 .frd', T('c048')); $$('#w7 .sins span').forEach((x, i) => IN(x, [Q('他欺骗他的母亲', '欺骗'), Q('或者是偷梨', '偷梨')][i] - 0.1, { s: 0.85, y: 0, d: 0.5 })); fade('#w7 .sins', W('c050', '遍体证明')); tl.to(r3[0], { opacity: 0.25, duration: 0.5 }, T('c048')); tl.to(r3[1], { opacity: 1, duration: 0.5 }, T('c048'));
  tl.to(r3[1], { opacity: 0.25, duration: 0.5 }, W('c050', '遍体证明')); tl.to(r3[2], { opacity: 1, duration: 0.5 }, W('c050', '遍体证明'));
  light(A['#w8'], { light: 0.5, rays: 0.4 });
  IN('#w8 .lbl', T('c051'), { d: 0.6, y: 10 }); on('#w8 .chain4', T('c055'));
  const c4 = $$('#w8 .chain4 > *'); [[0, W('c055', '你们便如神')], [1, T('c056')], [2, T('c056')], [3, W('c057', '必定死')], [4, W('c057', '必定死')]].forEach(([i, t]) => IN(c4[i], t - 0.1, { y: 20, d: 0.6 }));
  big('#w8 .h1', W('c059', '人不是神'), { st: 0.14 }); flash(W('c059', '人不是神') + 0.2, 960, 620, 0.45); IN('#w8 .tx.k', T('c060'), { y: 14 });
  light(A['#w9'], { light: 0.45, rays: 0.35 });
  IN('#w9 .h2', T('c065'), { y: 14 }); strike('#w9 .sk .x', W('c066', '不是程度'));
  const g = $$('#w9 .grid div'), gT = [Q('连想法情感意愿', '想法'), Q('连想法情感意愿', '情感'), Q('连想法情感意愿', '意愿'), Q('做好事的动机这里面', '动机')];
  g.forEach((x, i) => IN(x, (i < 4 ? gT[i] : i === 7 ? Q('连我做好事的动机', '好事') : Q('这里面都掺杂着东西', '掺杂') + (i - 4) * 0.12) - 0.1, { s: 0.9, y: 0, d: 0.5, blur: 4 }));
  tl.to(g, { borderColor: 'rgba(224,122,95,.85)', backgroundColor: 'rgba(224,122,95,.13)', duration: 0.4, stagger: 0.12 }, Q('这里面都掺杂着东西', '东西') + 0.3);
  IN('#w9 .tx.k', T('c069'), { y: 10 });

  // ── 第三句
  card('#w10', 'c070', 'c070'); red('#w10 .hl', W('c073', '但字') - 0.1); big('#w10 .bigdan', W('c073', '但字'), { d: 0.9 });
  light(A['#w11'], { light: 0.45, rays: 0.35 });
  $$('#w11 .r4 > div').forEach((r, i) => IN(r, T('c074') + D('c074') * (0.2 + i * 0.18), { x: -20, y: 0, d: 0.6 }));
  type('#w11 .want span', T('c075'), D('c075') * 0.8, { d: 0.6 }); IN('#w11 .hide-t', P('躲到园子的树后面去') - 0.2, { y: 14 }); type('#w11 .h1', T('c080'), D('c080') * 0.7, { d: 0.7 });

  // ── 第四句上
  card('#w12', 'c082', 'c082'); red('#w12 .hl', T('c083')); red('#w12 .hl2', T('c083') + 0.3, '#8a5a1a'); big('#w12 .isyou', T('c083'), { st: 0.18, d: 1.0 }); flash(T('c083') + 0.2, 960, 720, 0.5);
  light(A['#w13'], { light: 0.5, rays: 0.4 });
  on('#w13 .subj', A['#w13']); IN('#w13 .s-a', W('c084', '这人') - 0.1, { y: 20 });
  tl.to('#w13 .s-a', { opacity: 0, y: -60, filter: 'blur(10px)', duration: 0.5, ease: 'power2.in' }, W('c084', '换成了你')); IN('#w13 .s-b', W('c084', '换成了你') + 0.3, { y: 60, d: 0.8 });
  IN('#w13 .lbl', T('c086'), { d: 0.6, y: 10 }); type('#w13 .h2', W('c087', '睡着的人'), 1.6, { d: 0.6 });
  IN('#w13 .tx.k', W('c091', '马上') - 0.1, { y: 14 }); IN('#w13 .h3', T('c092'), { y: 10 });
  light(A['#w14'], { light: 0.55, rays: 0.45 });
  IN('#w14 .h2:not(.gold-t)', T('c093'), { y: 14 }); $$('#w14 .h2 .sk').forEach((x, i) => { tl.set(x, { opacity: 0 }, 0); tl.fromTo(x, { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', immediateRender: false }, [Q('你命令他', '命令'), Q('你逼着他', '逼着')][i] - 0.15); }); const x14 = $$('#w14 .sk .x'); strike(x14[0], W('c093', '你命令他') + 0.4); strike(x14[1], W('c093', '你逼着他') + 0.4);
  on('#w14 .taste', T('c097')); IN('#w14 .ts-h', T('c097'), { d: 0.6, y: 10 }); const tr = $$('#w14 .ts-r');
  [['c098', 0], ['c099', 1]].forEach(([c, i]) => { IN($('.ta', tr[i]), T(c) - 0.1, { y: 14, d: 0.6 }); IN($('.tb', tr[i]), T(c) + D(c) * 0.55, { x: 20, y: 0, d: 0.6 }); });
  IN('#w14 .vs', T('c103'), { y: 14 }); type('#w14 .h2.gold-t', W('c106', '那一点点'), 2.0, { d: 0.6 });

  // ── 第四句下
  card('#w15', 'c107', 'c107'); IN('#w15 .lbl', T('c108'), { d: 0.8, y: 10 }); flash(E('c107'), 960, 450, 0.45);
  light(A['#w16'], { light: 0.5, rays: 0.4 });
  IN('#w16 .adte', P('拉丁文的直译') - 0.1, { y: 14 });
  IN('#w16 svg', T('c112'), { y: 0, s: 0.9, d: 0.8 }); gsap.set('#w16 .needle', { rotation: -75, svgOrigin: '960 560' });
  tl.to('#w16 .needle', { rotation: 40, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 3, svgOrigin: '960 560' }, T('c112') + 0.4);
  tl.to('#w16 .needle', { rotation: 0, duration: Math.max(1.5, D('c113')), ease: 'elastic.out(1.1,0.18)', svgOrigin: '960 560' }, T('c113'));
  type('#w16 .h2', T('c114'), D('c114') * 0.8, { d: 0.6 }); fade(['#w16 svg', '#w16 .h2'], T('c115')); IN('#w16 .tx.k', T('c115') + 0.2, { y: 14 });
  light(A['#w17'], { light: 0.5, rays: 0.4 });
  $$('#w17 .milan span').forEach((s, i) => IN(s, W('c118', ['三十岁', '帝国的中心', '给皇帝写稿'][i]) - 0.1, { y: 16, d: 0.6 }));
  big('#w17 .h1', W('c120', '羡慕'), { st: 0.09 }); IN('#w17 .tx.k', T('c123'), { y: 10 });
  light(A['#w18'], { light: 0.45, rays: 0.35 });
  $$('#w18 .chp span').forEach((s, i) => IN(s, T('c125') + D('c125') * i / 6, { y: 16, d: 0.5 }));
  on('#w18 svg', T('c128')); DRAW('#w18 .ch-ln', T('c128'), 0.8); tl.fromTo('#w18 .house', { y: -400, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'bounce.out', immediateRender: false }, W('c128', '压在'));
  gsap.set('#w18 .house', { opacity: 0 }); tl.to('#w18 .chair', { rotation: 2.5, svgOrigin: '960 820', duration: 0.12, yoyo: true, repeat: 5, ease: 'sine.inOut' }, W('c128', '一把椅子') + 0.3);
  IN('#w18 .h3', T('c129'), { y: 10 }); fade(['#w18 .chp', '#w18 svg', '#w18 .h3'], T('c130'));
  on('#w18 .night', T('c130')); $$('#w18 .night div').forEach((d, i) => IN(d, [W('c130', '我到底为什么活着'), T('c131'), T('c132')][i] - 0.1, { y: 16, d: 0.7 }));
  light(A['#w19'], { light: 0.5, rays: 0.4 });
  IN('#w19 .lbl', T('c133'), { d: 0.6, y: 10 }); type('#w19 .h2:not(.gold-t)', W('c133', '我的爱就是我的重量'), 1.6, { d: 0.6 });
  on('#w19 .sf', T('c134')); IN('#w19 .sf-a', W('c134', '石头') - 0.1, { y: 0, d: 0.5 }); IN('#w19 .sf-b', W('c134', '火往上') - 0.1, { y: 0, d: 0.5 });
  tl.fromTo('#w19 .sf-a i', { y: -20 }, { y: 20, duration: 0.6, repeat: 3, yoyo: true, ease: 'sine.inOut', immediateRender: false }, W('c134', '石头'));
  tl.fromTo('#w19 .sf-b i', { y: 20 }, { y: -20, duration: 0.6, repeat: 3, yoyo: true, ease: 'sine.inOut', immediateRender: false }, W('c134', '火往上'));
  IN('#w19 .h2.gold-t', T('c136'), { y: 14 }); on('#w19 .belt', T('c138')); IN('#w19 .beltl', T('c138'), { y: 0, d: 0.6, blur: 0 });
  const bs = $$('#w19 .belt span'); gsap.set(bs, { x: 2000 });
  bs.forEach((s, i) => { const at = W('c140', ['考上大学', '找到工作', '结了婚', '买了房', '孩子上了好学校'][i]) - 1.0; tl.fromTo(s, { x: 2000 }, { x: -760, duration: 6.4, ease: 'none', immediateRender: false }, at); });
  tl.to('#w19 .beltl', { backgroundPositionX: '-400px', duration: 8, ease: 'none' }, W('c140', '考上大学') - 1.0); stamp('#w19 .allyr', W('c141', '全年无休'), -6);
  light(A['#w20'], { light: 0.45, rays: 0.35 });
  IN('#w20 .q0', T('c142'), { y: 10 }); fade('#w20 .q0', W('c145', '不安有点像疼')); big('#w20 .h1', W('c145', '不安有点像疼'), { st: 0.09 }); IN('#w20 .tx.k', W('c145', '身上有病') - 0.1, { y: 10 });
  $$('#w20 .grab span').forEach((s, i) => IN(s, [Q('他去摩尼教', '摩尼教'), Q('他在和情人', '情人'), Q('自己的名声', '名声'), Q('他在学哲学', '哲学'), Q('他在学修辞学', '修辞学')][i] - 0.1, { s: 0.7, y: 0, d: 0.5 }));
  IN('#w20 .h3', T('c151'), { y: 10 }); type('#w20 .h2.coral', T('c153'), D('c153') * 0.75, { d: 0.6 });

  // ── 第五句
  card('#w21', 'c155', 'c158'); red('#w21 .hl', E('c158') - 0.2);
  light(A['#w22'], { light: 0.5, rays: 0.4 });
  IN('#w22 .lbl', T('c159'), { d: 0.6, y: 10 }); on('#w22 svg', T('c163')); IN('#w22 .nd.n2', Q('我想呼求神', '呼求') - 0.2, { s: 0.8, y: 0, d: 0.6 }); IN('#w22 .nd.n1', Q('但我首先得认识', '认识') - 0.2, { s: 0.8, y: 0, d: 0.6 });
  DRAW('#w22 .l1', P('但我首先得认识'), 1.0); IN('#w22 .a1', P('但我首先得认识') + 0.9, { y: 0, d: 0.3, blur: 0 });
  DRAW('#w22 .l2', W('c165', '可我不呼求'), 1.0); IN('#w22 .a2', W('c165', '可我不呼求') + 0.9, { y: 0, d: 0.3, blur: 0 });
  tl.to(['#w22 .lp', '#w22 .ah'], { opacity: 0.35, duration: 0.45, yoyo: true, repeat: 7, ease: 'sine.inOut' }, E('c165'));
  IN('#w22 .tx.k', T('c166'), { y: 14 }); IN('#w22 .h3', W('c168', '一直在找') - 0.1, { y: 10 });
  light(A['#w23'], { light: 0.45, rays: 0.35 });
  IN('#w23 .tx.k', W('c169', '不认识你而呼吁') - 0.1, { y: 10 }); on('#w23 .prl', T('c172'));
  $$('#w23 .prl div').forEach((d, i) => IN(d, T(['c172', 'c173', 'c174', 'c175', 'c176'][i]) - 0.1, { x: -20, y: 0, d: 0.6 }));
  IN('#w23 .me', T('c178'), { s: 0.8, y: 0, d: 0.8 }); gsap.set('#w23 .me i', { opacity: 0 }); IN('#w23 .me i', W('c179', '高级助理') - 0.2, { y: 10, d: 0.5 });
  type('#w23 .h2', T('c180'), D('c180') * 0.8, { d: 0.6 });
  light(A['#w24'], { light: 0.55, rays: 0.45 });
  type('#w24 .tx.k', W('c184', '主啊请使我'), 1.5, { d: 0.6 }); IN('#w24 .h3', T('c186'), { y: 10 }); big('#w24 .h1', T('c187'), { st: 0.07 }); flash(T('c187') + 0.6, 960, 680, 0.4);

  // ── 第六句
  card('#w25', 'c188', 'c189'); red('#w25 .hl', E('c189') - 0.2);
  light(A['#w26'], { light: 0.5, rays: 0.4 });
  const rf = $$('#w26 .refs > div'); IN(rf[0], W('c192', '罗马书') - 0.1, { y: 14 }); IN(rf[1], T('c195') - 0.1, { y: 14 });
  on('#w26 .line7', T('c197')); const l7 = $$('#w26 .line7 > *'), ws = ['传讲', '听见', '相信', '呼求', '寻找', '得着', '赞美'];
  ws.forEach((w, i) => { const t = W('c197', w) - 0.1; IN(l7[i * 2], t, { y: 16, d: 0.5 }); if (i) IN(l7[i * 2 - 1], t - 0.1, { x: -10, y: 0, d: 0.4 }); });
  flash(W('c197', '得着就赞美') + 0.8, 1560, 500, 0.45);
  IN('#w26 .tx.k', W('c199', '你应受一切赞美') - 0.1, { y: 10 }); type('#w26 .h2', T('c200'), 1.6, { d: 0.6 });
  light(A['#w27'], { light: 0.45, rays: 0.35 });
  on('#w27 svg', T('c201')); IN('#w27 .nd.n1', Q('因为认识和呼求', '认识') - 0.2, { s: 0.8, y: 0, d: 0.6 }); IN('#w27 .nd.n2', Q('因为认识和呼求', '呼求') - 0.2, { s: 0.8, y: 0, d: 0.6 }); DRAW('#w27 .l1', T('c202'), 0.9); DRAW('#w27 .l2', T('c202') + 0.6, 0.9);
  tl.to('#w27 .lp', { opacity: 0.35, duration: 0.45, yoyo: true, repeat: 5, ease: 'sine.inOut' }, T('c203'));
  IN('#w27 .outer', W('c204', '传讲') - 0.1, { y: -20 }); DRAW('#w27 .inn', W('c205', '从外面来的') - 0.4, 1.2); flash(W('c205', '从外面来的') + 0.6, 1000, 470, 0.45);
  IN('#w27 .phone', T('c206'), { y: 20 }); tl.fromTo('#w27 .ph-b', { rotation: -6 }, { rotation: 6, duration: 0.08, repeat: 13, yoyo: true, ease: 'none', immediateRender: false }, W('c208', '电话自己响了'));
  IN('#w27 .h2', T('c209'), { y: 14 }); fade(['#w27 svg', '#w27 .nd', '#w27 .outer', '#w27 .phone', '#w27 .h2'], T('c210'));
  IN('#w27 .tx.k', W('c213', '拿着读吧') - 0.2, { y: 14 }); big('#w27 .h1', T('c215'), { st: 0.1 }); flash(T('c215') + 0.3, 960, 520, 0.5);

  // ── 第七句
  card('#w28', 'c216', 'c217'); red('#w28 .hl', E('c217') - 0.3); red('#w28 .hl2', E('c217') - 0.6, '#8a5a1a');
  light(A['#w29'], { light: 0.5, rays: 0.4 });
  big('#w29 .shi0', Q('请使我你数数', '请使我'), { st: 0.08 }); fade('#w29 .shi0', T('c222') - 0.2);
  { const sh = $$('#w29 .shi2 > div'); [['呼求是神使他呼求', '呼求'], ['相信是神使他相信', '相信']].forEach(([ctx, w], i) => { IN($('b', sh[i]), Q(ctx, w) - 0.15, { y: 16, d: 0.6 }); IN($('span', sh[i]), Q(ctx, '是神使他') - 0.15, { y: 10, d: 0.6 }); }); tl.to('#w29 .shi2', { opacity: 0.3, duration: 0.6 }, T('c222') - 0.2); }
  big('#w29 .h1:not(.shi0)', Q('他说的是主啊请你使我', '主啊') - 0.1, { st: 0.08 }); IN('#w29 .tx.k', T('c222') - 0.1, { y: 10 }); strike('#w29 .sk .x', E('c222') - 0.3);
  fade(['#w29 .h1:not(.shi0)', '#w29 .tx.k', '#w29 .shi2'], T('c225')); on('#w29 svg', T('c225'));
  tl.set('#w29 .spiral', { opacity: 1 }, T('c228')); DRAW('#w29 .spiral', T('c228'), Math.max(2.5, D('c228') + D('c229') * 0.5), { ease: 'power1.inOut' });
  IN('#w29 .sp-l.a', T('c228'), { y: 10 }); IN('#w29 .sp-l.b', W('c228', '多呼求一点') - 0.1, { y: 10 }); type('#w29 .h3', T('c229'), D('c229') * 0.7, { d: 0.6 });
  light(A['#w30'], { light: 0.45, rays: 0.35 });
  IN('#w30 .h2', T('c230'), { y: 14 }); IN('#w30 .vs', T('c233'), { y: 14 }); IN('#w30 .lbl', T('c234'), { d: 0.6, y: 10 });
  IN('#w30 .dust', T('c235'), { s: 0.8, y: 0, d: 0.8 }); on('#w30 .breath', T('c235'));
  const dots = $$('#w30 .breath i'); gsap.set(dots, { opacity: 0 });
  dots.forEach((d, i) => { const t = W('c235', '把气吹进') + i * 0.05; tl.fromTo(d, { x: 0, y: 0, opacity: 0 }, { x: 1100 - (i % 6) * 18, y: 680 - (640 + ((i * 37) % 90)), opacity: 1, duration: 1.4, ease: 'power2.in', immediateRender: false }, t); tl.to(d, { opacity: 0, duration: 0.2 }, t + 1.4); });
  tl.to('#w30 .dust i', { opacity: 1, duration: 0.8, ease: 'power2.out' }, T('c238')); flash(T('c238') + 0.1, 1380, 680, 0.55);
  big('#w30 .h1', T('c238'), { st: 0.09 });
  light(A['#w31'], { light: 0.5, rays: 0.4 });
  on('#w31 .two2', T('c240')); IN('#w31 .tw.a', Q('一样是圣子的人性', '圣子') - 0.2, { y: 20 });
  IN('#w31 .tx.k', P('就比如我们人是不会听细菌说话的') + 0.2, { y: 10 }); IN('#w31 .h2', W('c244', '祂的儿子'), { y: 14 });
  tl.fromTo('#w31 .down', { opacity: 0, y: -80 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }, T('c245')); big('#w31 .h1', T('c245') + 0.2, { st: 0.09 });
  light(A['#w32'], { light: 0.5, rays: 0.4 });
  on('#w32 .amb', T('c247')); IN('#w32 .am-k', W('c247', '安波罗修') - 0.3, { y: 10 }); big('#w32 .am-t', W('c247', '安波罗修'), { st: 0.12 }); IN('#w32 .lbl', T('c246') - 0.1, { d: 0.6, y: 10 }); IN('#w32 .am-d', Q('就是安布罗修在397年春天去世的', '397') - 0.2, { y: 10 });
  IN('#w32 .h3', T('c254'), { y: 10 }); IN('#w32 .vs', T('c257'), { y: 14 }); type('#w32 .h2', T('c260'), D('c260') * 0.8, { d: 0.6 });

  // ── 收尾
  light(A['#w33'], { light: 0.55, rays: 0.45 });
  big('#w33 .done1', T('c261'), { st: 0.1 }); fade('#w33 .done1', T('c264'));
  IN('#w33 .lbl', Q('这个愿意是从哪儿来的', '这个愿意') - 0.2, { d: 0.6, y: 10 }); on('#w33 .you3', T('c267'));
  $$('#w33 .you3 div').forEach((d, i) => IN(d, W('c267', ['你鼓动的', '你传讲的', '你所给的'][i]) - 0.1, { y: 30, d: 0.7 }));
  type('#w33 .h2', W('c268', '最要紧的那一步'), 2.0, { d: 0.7 }); flash(W('c268', '不是我迈的') + 0.4, 960, 760, 0.45);
  light(A['#w34'], { light: 0.5, rays: 0.4 });
  const k34 = $$('#w34 .tx.k'); IN(k34[0], T('c272'), { y: 10 }); IN(k34[1], W('c272', '是在把我') - 0.1, { y: 10 });
  big('#w34 .h1', W('c274', '主请使我向你呼吁'), { st: 0.08 }); flash(W('c274', '主请使我向你呼吁') + 0.8, 960, 660, 0.5);
  light(A['#w35'], { light: 0.6, rays: 0.55 });
  on('#w35 .nxt', T('c275')); IN('#w35 .nx-k', T('c275'), { d: 0.6, y: 10 }); type('#w35 .nx-t', W('c275', '我求神到我里面来'), 1.6, { d: 0.7 }); type('#w35 .nx-l', T('c277'), D('c277') * 0.7);
  { const a = EP.total - 6.2; scene('#wZ', a, EP.total + 1); IN('#wZ .z-k', a + 0.2, { d: 0.9 }); type('#wZ .z-t', a + 0.5, 1.0, { d: 0.9, y: 24, blur: 14 }); IN('#wZ .z-s', a + 1.3, { d: 0.9, y: 10 }); light(a, { light: 0.4, rays: 0.3 }); }
  if (window.ASIDES) window.ASIDES(tl);
  if (window.fixEarly) window.fixEarly(tl);
  if (window.fixClash) window.fixClash(tl);
  K.finish();
})();
