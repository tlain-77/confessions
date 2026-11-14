// 第二讲 · 卷一第二、三章
(async function () {
  const K = await kit(); const { $, $$, T, E, D, W, EP, svgEl, rng } = K; K.secPrefix = '第二讲 · ';
  const notes = $('.notes'), NT = ['♪', '♫', '♩', '♬', '♪', '♫']; NT.forEach((n, i) => { const d = document.createElement('span'); d.className = 'note'; d.textContent = n; d.style.left = (i * 90) + 'px'; d.style.top = (i % 2 ? 40 : 0) + 'px'; notes.appendChild(d); });
  const air = $('.air'), ra = rng(8); for (let i = 0; i < 80; i++) { const d = document.createElement('div'); d.className = 'ad'; d.style.left = (200 + ra() * 1520) + 'px'; d.style.top = (220 + ra() * 600) + 'px'; air.appendChild(d); }
  // 瓶子碎片：一个花瓶轮廓切成几块
  const sh = $('.shards'), SH = ['M230 60 L370 60 L360 140 L300 160 L240 140 Z', 'M240 140 L300 160 L250 300 L140 320 C 150 240, 190 180, 240 140 Z', 'M300 160 L360 140 C 410 180, 450 240, 460 320 L350 300 Z', 'M140 320 L250 300 L230 470 L110 460 C 100 400, 110 360, 140 320 Z', 'M250 300 L350 300 L370 470 L230 470 Z', 'M350 300 L460 320 C 490 360, 500 400, 490 460 L370 470 Z', 'M110 460 L230 470 L250 640 L160 640 C 130 600, 112 520, 110 460 Z', 'M230 470 L370 470 L350 640 L250 640 Z', 'M370 470 L490 460 C 488 520, 470 600, 440 640 L350 640 Z'];
  const shards = SH.map((d, i) => svgEl('path', { d, class: 'shard' }, sh));
  await K.prepare('.prc, .u2-qs b, .tq, .cup, .mean span, .note, .v, .ps, .r11 .c, .brk b, .my3 div, .scat b, .place, .none b, .e, .sn-cl b, .shard, .dg *, .dg2 *, .dg3 *, .dg4 *, .hand *, .sun *, .btl > *');
  const { tl, IN, OUT, DRAW, type, big, stamp, light, flash, scene, on, chars } = K;
  const fade = (sel, at) => tl.to(sel, { opacity: 0, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' }, at - 0.45);
  const quote = (sel, id, frac = 0.85) => type(sel, T(id), D(id) * frac, { d: 0.6, y: 10, blur: 6 });

  scene('#u0', 0, T('c001') - 0.2); light(0.1, { light: 0.7, rays: 0.7 }, 2.5);
  IN('#u0 .op-k', 0.5, { d: 1 }); big('#u0 .op-t', 0.8, { st: 0.09 }); IN('#u0 .op-l', 1.8, { d: 1.2, y: 10 });

  { const a = T('c001') - 0.1, b = T('c006') - 0.1; scene('#u1', a, b); light(a, { light: 0.55, rays: 0.4 });
    IN('.pr-h', a + 0.1, { d: 0.6, y: 10 }); ['c002', 'c003', 'c004'].forEach((id, i) => IN('.prc.p' + (i + 1), T(id) - 0.1, { y: 20, d: 0.7 })); type('.pr-n', T('c005'), D('c005') * 0.8); }
  { const a = T('c006') - 0.1, b = T('c018') - 0.1; scene('#u2', a, b);
    IN('.u2-k', T('c010') - 0.1, { d: 0.6, y: 10 }); quote('.u2-q', 'c011'); big('.u2-wait', W('c013', '等一下') - 0.1, { st: 0.1, d: 0.8 }); tl.to('.u2-wait', { opacity: 0, duration: 0.4 }, T('c014') - 0.3);
    $$('.u2-qs b').forEach((x, i) => IN(x, [T('c014'), W('c014', '到哪儿去'), T('c015')][i] - 0.1, { y: 20, d: 0.6 })); }
  { const a = T('c018') - 0.1, b = T('c022') - 0.1; scene('#u3', a, b); light(a, { light: 0.6, rays: 0.5 });
    IN('.tq.a', W('c018', '第二章') - 0.1, { y: 30 }); IN('.tq.b', T('c019') - 0.1, { y: 30 }); tl.to('.two', { opacity: 0.4, duration: 0.6 }, T('c021') - 0.3); type('.u3-c', W('c021', '你跟神的关系'), 1.6, { d: 0.7 }); }
  // 我原来以为的关系
  { const a = T('c022') - 0.1, b = T('c033') - 0.1; scene('#u4', a, b); light(a, { light: 0.4, rays: 0.25 });
    IN('.dg-h', a + 0.1, { d: 0.6, y: 10 }); on('.dg', a);
    DRAW('.w1', T('c024') - 0.1, 1.0); IN($$('.dg .lb')[0], T('c024') + 0.3, { d: 0.5, y: 6 }); IN('.man1', W('c024', '人在世界里面'), { s: 0.2, y: 0, d: 0.6 }); IN($$('.dg .lb')[1], W('c024', '人在世界里面') + 0.3, { d: 0.5, y: 6 });
    IN('.god1', W('c025', '神在圆圈外面'), { s: 0.2, y: 0, d: 0.6 }); IN($$('.dg .lb')[2], W('c025', '神在圆圈外面') + 0.3, { d: 0.5, y: 6 });
    DRAW('.call', W('c026', '喊一声'), 1.2); type('.dg-n', T('c028'), D('c028') * 0.8);
    tl.to(['.dg', '.dg-n'], { x: -380, scale: 0.75, opacity: 0.5, transformOrigin: '50% 50%', duration: 0.9, ease: 'power3.inOut' }, T('c030') - 0.3); tl.to('.dg-n', { opacity: 0, duration: 0.4 }, T('c030') - 0.3);
    on('.dg2', T('c030')); DRAW('.n1', T('c030'), 0.8); DRAW('.n2', W('c030', '人就在世界'), 0.8); IN('.n3', W('c030', '神被包在'), { s: 0.2, y: 0, d: 0.6 }); $$('.dg2 .lb').forEach((l, i) => IN(l, W('c030', ['世界里面', '人就在', '神被包在'][i]) + 0.3, { d: 0.5, y: 6 }));
    IN('.dg2-n', W('c030', '一层套一层'), { d: 0.6, y: 10 });
    tl.to(['.dg', '.dg2', '.dg2-n', '.dg-h'], { opacity: 0.12, filter: 'blur(6px)', duration: 0.6 }, T('c031') - 0.3); big('.nono', T('c031'), { st: 0.05, d: 0.9 }); }
  // 尺寸
  { const a = T('c033') - 0.1, b = T('c044') - 0.1; scene('#u5', a, b); light(a, { light: 0.55, rays: 0.4 });
    type('.sz-h', T('c035'), 0.8); IN('.room', W('c037', '十平米'), { y: 30 }); IN('.ocean', W('c038', '太平洋') - 0.2, { x: 60, y: 0, d: 1.0 });
    tl.fromTo('.wv', { attr: { transform: 'translate(0 0)' } }, { attr: { transform: 'translate(-225 0)' }, duration: 8, ease: 'none', repeat: 0, immediateRender: false }, W('c038', '太平洋') - 0.2);
    tl.to(['.room', '.ocean', '.sz-h'], { opacity: 0, filter: 'blur(8px)', duration: 0.5 }, T('c039') - 0.3);
    IN('.kg', T('c039'), { y: 20 }); type('.kg-t', W('c039', '天和天上的天'), D('c039') * 0.5, { d: 0.6 }); }
  // 凡存在的便容纳你
  { const a = T('c044') - 0.1, b = T('c067') - 0.1; scene('#u6', a, b); light(a, { light: 0.6, rays: 0.5 });
    IN('.qq2', a, { y: 60, d: 1.0, blur: 6 }); tl.set(['.qmark', '.qq2-alt'], { opacity: 0 }, a);
    IN('.qmark', T('c048'), { s: 1.6, y: 0, d: 0.5 }); IN('.qq2-alt', T('c050') - 0.1, { d: 0.6, y: 10 });
    fade('.qq2', T('c053'));
    $$('.cup').forEach((c, i) => IN(c, [W('c053', '杯子'), W('c053', '房间'), T('c054')][i] - 0.1, { y: 30, d: 0.6 }));
    tl.to('.cup', { opacity: 0.25, duration: 0.5 }, T('c055'));
    $$('.mean span').forEach((s, i) => IN(s, W('c056', ['承载', '带着', '里面有'][i]) - 0.1, { y: 30, d: 0.7, blur: 14 }));
    fade(['.cups', '.mean'], T('c057') + 0.3);
    IN('.cmp', W('c058', '作曲家') - 0.2, { y: -20, d: 0.7 }); DRAW('.sa', W('c058', '作曲家') + 0.3, 0.6); IN('.box', W('c058', '交响乐') - 0.3, { y: 30, d: 0.8 }); on('.sym-svg', a);
    $$('.note').forEach((n, i) => IN(n, W('c058', '每一个音符') + i * 0.15, { y: 20, d: 0.5, blur: 4 }));
    IN('.sym-a', T('c059'), { d: 0.6, y: 10 }); IN('.sym-b', T('c060'), { d: 0.6, y: 10 });
    tl.to('.box', { opacity: 0.2, duration: 1.0 }, T('c061') + 1.0); tl.to('.cmp', { scale: 1.15, duration: 0.6, yoyo: true, repeat: 1 }, W('c061', '作曲家还在'));
    tl.to('.box', { opacity: 1, duration: 0.5 }, T('c062')); tl.to('.cmp', { opacity: 0.2, duration: 0.5 }, T('c062')); tl.to('.note', { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 }, W('c062', '一个音都不会有'));
    fade('.sym', T('c063') + 0.6); tl.set('.sym', { opacity: 0 }, T('c064'));
    on('.ww', a); type('.ww > span', T('c066'), 1.2, { d: 0.7 }); big('.ww b', W('c066', '神不靠万物'), { st: 0.1 }); flash(W('c066', '神不靠'), 1150, 470, 0.45); }
  // 除非你在我身上
  { const a = T('c067') - 0.1, b = T('c087') - 0.1; scene('#u7', a, b); light(a, { light: 0.6, rays: 0.5 });
    quote('.u7-q', 'c067'); tl.to('.u7-q', { opacity: 0.45, y: -30, duration: 0.6 }, T('c071'));
    on('.fl', a); IN('.fl-a', T('c073'), { y: 30 }); tl.to('.flower', { rotation: 35, y: 30, opacity: 0.5, duration: 2.5, ease: 'power1.in' }, W('c073', '慢慢枯萎'));
    IN('.fl-b', T('c075'), { y: 30 }); tl.to('.dot', { scale: 0, opacity: 0, duration: 0.18, ease: 'power3.in' }, W('c076', '立刻就没有了') + 0.2);
    fade(['.fl', '.u7-q'], T('c078'));
    on('.vs', a); $$('.v').forEach((v, i) => IN(v, T(['c078', 'c080', 'c081'][i]) - 0.1, { x: -30, y: 0, d: 0.6 })); tl.fromTo('.v1 em', { scale: 1 }, { scale: 1.25, duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }, T('c079'));
    fade('.vs', T('c083'));
    IN('.clk', T('c083'), { y: 20 }); tl.fromTo('.ck-x', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4, immediateRender: false }, W('c084', '不是的'));
    fade('.clk', T('c085'));
    on('.hand', T('c085')); DRAW('.hw', T('c085'), 0.8); IN('.hg', W('c085', '神不在方框外面'), { s: 0.2, y: 0, d: 0.5 });
    [['.hl1', '.h1', '托着宇宙'], ['.hl2', '.h2', '托着地球'], ['.hl3', '.h3', '托着每一个人']].forEach(([l, h, w]) => { DRAW(l, W('c085', w) - 0.3, 0.6); IN(h, W('c085', w) + 0.2, { s: 0.2, y: 0, d: 0.4 }); });
    $$('.hand .lb').forEach((l, i) => IN(l, [W('c085', '神不在'), W('c085', '托着宇宙'), W('c085', '托着地球'), W('c085', '托着每一个人'), T('c085')][i] + 0.4, { d: 0.5, y: 6 }));
    tl.to(['.hl1', '.hl2', '.hl3', '.hg'], { opacity: 0, duration: 0.3 }, T('c086') + 0.3); tl.to(['.ht'], { attr: { cy: 1100 }, opacity: 0, duration: 0.9, ease: 'power2.in', stagger: 0.1 }, T('c086') + 0.4);
    type('.hand-n', T('c086'), D('c086') * 0.8); }
  // 何必要求你降至我身
  { const a = T('c087') - 0.1, b = T('c099') - 0.1; scene('#u8', a, b);
    on('.u8-q', a); IN('.u8-k', a, { d: 0.5 }); quote('.u8-t', 'c087'); big('.u8-s', W('c090', '多此一举'), { st: 0.08, d: 0.7 });
    tl.to('.u8-q', { y: -40, opacity: 0.4, duration: 0.6 }, T('c093') - 0.3);
    on('.pres', a); IN('.ps.a', T('c093'), { y: 30 }); IN('.ps.b', T('c095'), { y: 30 }); type('.u8-n', T('c098'), D('c098') * 0.8); }
  // 窗帘和太阳
  { const a = T('c099') - 0.1, b = T('c110') - 0.1; scene('#u9', a, b); light(a, { light: 0.3, rays: 0.15, fx: 1500, fy: 300 });
    on('.sun', a); IN('.wall', T('c100'), { y: 0, d: 0.8 }); IN('.win', T('c100') + 0.3, { y: 0, d: 0.6 }); IN('.kneel', W('c100', '黑屋子'), { y: 10, d: 0.6 });
    IN('.sunr', W('c101', '大太阳') - 0.1, { s: 0.6, y: 0, d: 1.0 }); IN('.cur', W('c101', '窗帘') - 0.1, { y: -20, d: 0.6 }); light(W('c101', '大太阳'), { light: 0.6, rays: 0.5 });
    type('.sn-say', W('c102', '太阳啊'), D('c102') * 0.5, { d: 0.6 }); type('.sn-al', T('c103'), 0.9, { d: 0.6 });
    on('.sn-cl', a); $$('.sn-cl b').forEach((x, i) => IN(x, W('c107', ['骄傲', '自欺', '挡住光'][i]) - 0.1, { x: -10, y: 0, d: 0.5 }));
    type('.sn-ask', W('c105', '求你把我这窗帘拉开') - 0.1, 1.2, { d: 0.6 });
    tl.to('.cur.l', { attr: { width: 20 }, duration: 1.4, ease: 'power3.inOut' }, T('c108')); tl.to('.cur.r', { attr: { x: 1080, width: 20 }, duration: 1.4, ease: 'power3.inOut' }, T('c108'));
    IN('.beam', T('c108') + 0.4, { y: 0, d: 1.4, blur: 0 }); tl.to('.wall', { fill: '#1d1a14', duration: 1.4 }, T('c108') + 0.4); flash(T('c108') + 0.6, 950, 520, 0.7, 0.2);
    tl.to(['.sn-cl', '.sn-say'], { opacity: 0, duration: 0.5 }, T('c108'));
    on('.sn-end', a); type('.sn-end > span', T('c109') + 0.3, 1.2); big('.sn-end b', W('c109', '承认'), { st: 0.06, d: 0.8 }); }
  // 罗马书 11:36
  { const a = T('c110') - 0.1, b = T('c123') - 0.1; scene('#u10', a, b); light(a, { light: 0.6, rays: 0.5, fx: 960, fy: -160 });
    on('.rm11', a); IN('.r11-k', T('c112') - 0.1, { d: 0.6, y: 10 }); $$('.r11 .c').forEach((c, i) => IN(c, [T('c113'), W('c113', '倚靠他'), T('c114')][i] - 0.1, { y: 30, d: 0.7 }));
    type('.back1', T('c116'), D('c116') * 0.8); tl.to('.r11 .c.g', { scale: 1.12, duration: 0.4, yoyo: true, repeat: 1 }, T('c117'));
    fade(['.rm11', '.back1'], T('c118') + 0.5);
    on('.dg3', T('c119')); DRAW('.o1', W('c120', '是一个大圆'), 1.2); DRAW('.o2', W('c120', '世界在神里面'), 1.0); IN('.o3', T('c121'), { s: 0.2, y: 0, d: 0.5 });
    $$('.dg3 .lb').forEach((l, i) => IN(l, [W('c120', '神'), W('c120', '世界在神里面'), T('c121')][i] + 0.5, { d: 0.5, y: 6 }));
    DRAW('.a1', W('c121', '神的手同时伸到'), 0.8); DRAW('.a2', W('c121', '每一个人') - 0.2, 0.8); flash(W('c120', '是一个大圆'), 960, 560, 0.4);
    IN('.dg3-t', W('c121', '神的手') + 1.2, { d: 0.8, y: 10 }); IN('.dg3-n', T('c122'), { d: 0.7, y: -10 }); }
  // 第三章：天地能包容你吗；余下的部分
  { const a = T('c123') - 0.1, b = T('c143') - 0.1; scene('#u11', a, b); light(a, { light: 0.55, rays: 0.4 });
    IN('.ch3', a, { d: 0.6, y: 10 }); quote('.u11-q', 'c123'); IN('.jr', T('c129'), { y: 20 });
    fade(['.jr', '.ch3'], T('c130'));
    on('.btl', T('c130')); DRAW('.bt', T('c130'), 1.0); IN('.water', W('c131', '装满了水'), { y: 0, d: 0.2, blur: 0 }); tl.fromTo('.water', { attr: { y: 870, height: 0 } }, { attr: { y: 300, height: 570 }, duration: 2.0, ease: 'power1.inOut', immediateRender: false }, W('c131', '装满了水'));
    IN($('.btl .lb'), T('c130') + 0.6, { d: 0.5 }); type('.u11-n', W('c131', '瓶子有多大'), 1.4);
    tl.to('.u11-q', { opacity: 0.3, duration: 0.5 }, T('c132'));
    DRAW('.spill.l', W('c136', '溢出来'), 1.4); DRAW('.spill.r', W('c136', '溢出来') + 0.2, 1.4); type('.ov', T('c133'), D('c133') * 0.8, { d: 0.6 });
    tl.to(['.btl', '.u11-n', '.ov', '.u11-q'], { opacity: 0.12, filter: 'blur(6px)', duration: 0.6 }, W('c140', '这个画面本身就错了') - 0.6);
    on('.wrongpic', a); type('.wrongpic > span', W('c140', '这个画面本身就错了'), 1.0, { d: 0.8, y: 30, blur: 14 }); IN('.wrongpic em', T('c141'), { d: 0.7, y: 10 }); }
  // 你充塞一切，亦即是包容一切
  { const a = T('c143') - 0.1, b = T('c151') - 0.1; scene('#u13', a, b); light(a, { light: 0.7, rays: 0.6 });
    quote('.u13-q', 'c143', 0.4); on('.dg4', a); DRAW('.w4', T('c144'), 0.8); DRAW('.g4', W('c145', '是神包容天地') - 0.3, 1.2); $$('.dg4 .lb').forEach((l, i) => IN(l, [W('c145', '是神包容'), T('c144') + 0.5][i], { d: 0.5, y: 6 }));
    on('.flip', a); IN('.flip span', T('c145'), { d: 0.6, y: 10 }); IN('.flip b', W('c145', '是神包容'), { d: 0.7, y: 10, s: 1.2 });
    fade(['.dg4', '.flip', '.u13-q'], T('c148') + 0.4);
    on('.base', a); type('.base > span', W('c148', '世界不是神的容器') , 1.2, { d: 0.7 }); big('.base b', W('c148', '神是世界的根基'), { st: 0.08 }); flash(W('c148', '神是世界的根基'), 960, 520, 0.55);
    fade('.base', T('c149'));
    $$('.ad').forEach((d, i) => IN(d, T('c149') + (i % 20) * 0.04, { s: 0.2, y: 0, d: 0.5, blur: 2 })); on('.air', T('c149')); IN('.air-t', W('c149', '稀释'), { d: 0.6, y: 10 });
    tl.to('.ad', { opacity: 0.05, duration: 0.6 }, T('c150')); tl.to('.air-t', { textDecoration: 'line-through', color: '#e0704b', duration: 0.3 }, T('c150')); }
  // 瓶子碎了
  { const a = T('c151') - 0.1, b = T('c164') - 0.1; scene('#u14', a, b); light(a, { light: 0.55, rays: 0.4 });
    quote('.u14-q', 'c151', 0.7); on('.vase', a); shards.forEach((s, i) => IN(s, T('c151') + 0.2 + i * 0.05, { y: 0, d: 0.5, blur: 0 })); IN('.glow', W('c151', '充满了你'), { s: 0.4, y: 0, d: 1.0 });
    const tb = W('c155', '瓶子碎了'); const rb = rng(2);
    shards.forEach((s, i) => { const ang = (i - 4) * 0.5; tl.to(s, { x: Math.sin(ang) * (200 + rb() * 160), y: 260 + rb() * 200, rotation: (rb() - 0.5) * 140, opacity: 0.3, duration: 1.2, ease: 'power2.in', transformOrigin: '50% 50%' }, tb + i * 0.02); });
    tl.to('.glow', { scale: 1.3, duration: 0.6, yoyo: true, repeat: 1 }, tb + 0.3);
    on('.brk', a); $$('.brk b').forEach((x, i) => IN(x, [W('c158', '会病'), W('c158', '会老'), W('c158', '会失败'), W('c159', '身体会碎'), W('c159', '计划会碎'), W('c159', '我们的家')][i] - 0.1, { x: -20, y: 0, d: 0.5 }));
    tl.to('.glow', { scale: 1.6, duration: 1.2 }, T('c160')); flash(T('c160'), 960, 640, 0.5, 0.15);
    on('.nobreak', a); type('.nobreak > span', T('c163'), 0.6); big('.nobreak b', W('c163', '神不会碎'), { st: 0.08 }); }
  // 倾注，不下堕，收敛
  { const a = T('c164') - 0.1, b = T('c179') - 0.1; scene('#u15', a, b); light(a, { light: 0.6, rays: 0.5 });
    quote('.u15-q', 'c164', 0.6); on('.dir', a); IN('.d1', T('c166'), { y: 30 }); tl.fromTo('.ar.dn', { y: -40 }, { y: 40, duration: 1.2, repeat: 2, ease: 'power1.in', immediateRender: false }, T('c166'));
    IN('.d2', T('c168'), { y: 30 }); tl.fromTo('.ar.up', { y: 40 }, { y: -40, duration: 1.2, repeat: 2, ease: 'power1.out', immediateRender: false }, W('c168', '往上托'));
    fade(['.dir', '.u15-q'], T('c169'));
    on('.my3', a); $$('.my3 div').forEach((d, i) => IN(d, T(['c170', 'c171', 'c172'][i]) - 0.1, { x: -30, y: 0, d: 0.7 }));
    fade('.my3', T('c174'));
    on('.scat', a); $$('.scat b').forEach((x, i) => IN(x, W('c176', ['名声', '情欲', '哲学', '四分五裂', '四分五裂'][i]) - 0.1 + (i > 2 ? i * 0.15 : 0), { s: 0.6, y: 0, d: 0.5 }));
    type('.scat-t', W('c177', '我在许多事上分散了'), 1.4, { d: 0.6 });
    tl.to('.scat b', { left: 900, top: 520, opacity: 0, duration: 1.2, ease: 'power3.inOut', stagger: 0.05 }, T('c178')); tl.to('.scat-t', { opacity: 0, duration: 0.4 }, T('c178'));
    type('.gather', T('c178') + 0.4, 1.4, { d: 0.6 }); flash(T('c178') + 1.0, 960, 560, 0.45); }
  // 整个在那里
  { const a = T('c179') - 0.1, b = T('c193') - 0.1; scene('#u16', a, b); light(a, { light: 0.6, rays: 0.5 });
    quote('.u16-q', 'c179', 0.6); on('.pl', a); $$('.place').forEach((p, i) => IN(p, [W('c182', '在家里'), W('c182', '医院走廊'), W('c182', '分了一小块')][i] - 0.1, { y: 30, d: 0.7 }));
    tl.to('.place.pie', { opacity: 0.3, duration: 0.5 }, T('c183'));
    on('.none', a); $$('.none b').forEach((x, i) => IN(x, W('c185', ['这个教会', '这座城市', '这个宇宙'][i]) - 0.1, { y: 20, d: 0.5 })); IN('.none span', T('c185') + D('c185') * 0.8, { d: 0.6, y: 10 });
    fade(['.pl', '.none', '.u16-q'], T('c191'));
    on('.share', a); big('.share > span', T('c191'), { st: 0.06, d: 0.9 }); type('.share em', T('c192'), D('c192') * 0.8, { d: 0.6 }); }
  // 收尾
  { const a = T('c193') - 0.1, b = EP.total - 6.6; scene('#u17', a, b); light(a, { light: 0.6, rays: 0.55 });
    on('.end3', a); $$('.e').forEach((x, i) => IN(x, T(['c194', 'c195', 'c197'][i]) - 0.1, { x: -30, y: 0, d: 0.7 }));
    fade('.end3', T('c198') + 0.4);
    on('.last', a); type('.ls-a', W('c201', '主啊你一直都在'), 1.2, { d: 0.7 }); type('.ls-b', T('c202'), D('c202') * 0.8, { d: 0.7 }); flash(W('c201', '一直都在'), 960, 420, 0.5);
    fade('.last', T('c203'));
    on('.nxt', a); IN('.nx-k', T('c203'), { d: 0.6, y: 10 }); type('.nx-t', W('c203', '我的天主'), 1.5, { d: 0.7 }); type('.nx-l', T('c204'), D('c204') * 0.6); }
  { const a = EP.total - 6.2; scene('#uZ', a, EP.total + 1); IN('#uZ .z-k', a + 0.2, { d: 0.9 }); type('#uZ .z-t', a + 0.5, 1.0, { d: 0.9, y: 24, blur: 14 }); IN('#uZ .z-s', a + 1.3, { d: 0.9, y: 10 }); light(a, { light: 0.4, rays: 0.3 }); }
  K.finish();
})();
