// 第一讲 · 他为什么这样写（口播稿第四到六部分）
(async function () {
  const K = await kit(); const { $, $$, T, E, D, W, EP, svgEl, rng } = K; K.secPrefix = '第一讲 · ';
  // 动态元素
  const tower = $('.t13'), CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三'], RO = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
  CN.forEach((c, i) => { const s = document.createElement('div'); s.className = 'slab'; s.style.top = (826 - i * 46) + 'px'; s.innerHTML = `<span>卷${c}</span><em>${RO[i]}</em>`; tower.appendChild(s); });
  const bars = $('.bars'); RO.forEach((r, i) => { const b = document.createElement('div'); b.className = 'bar' + (i === 9 ? ' hot' : ''); b.textContent = r; bars.appendChild(b); });
  const fr = $('.frag'), rr = rng(4), FR = [[300, 560], [470, 700], [640, 620], [860, 590], [1020, 560], [1180, 650], [1350, 700], [1540, 660], [1690, 590]];
  const frEls = FR.map(([x, y]) => { const d = document.createElement('div'); d.className = 'fr'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.dataset.dx = ((rr() - 0.5) * 260).toFixed(0); d.dataset.dy = ((rr() - 0.5) * 300).toFixed(0); fr.appendChild(d); return d; });
  await K.prepare('.slab, .bar, .rum, .wi, .tw-l, .xi, .er, .er i, .pw b, .fr, .fixes b, .tags b, .rd-r, .dc-l, .st, .bp-c b, .loop path');
  const { tl, IN, OUT, DRAW, type, big, stamp, light, flash, scene, on, chars } = K;

  // 片头
  scene('#t0', 0, T('c001') - 0.2); light(0.1, { light: 0.7, rays: 0.7 }, 2.5);
  IN('#t0 .op-k', 0.5, { d: 1 }); big('#t0 .op-t', 0.8, { st: 0.12 }); IN('#t0 .op-l', 1.8, { d: 1.2, y: 10 });

  // 1 · 397
  { const a = T('c001') - 0.1, b = T('c003') - 0.1; scene('#t1', a, b);
    IN('.yr397', a + 0.1, { d: 1.0 }); tl.fromTo('.yr397 em', { textContent: 2026 }, { textContent: 397, snap: { textContent: 1 }, duration: 1.4, ease: 'power3.inOut', immediateRender: false }, a + 0.1);
    $$('.st').forEach((s, i) => IN(s, W('c002', ['四十三岁', '信主十一年', '当主教'][i]) - 0.1, { d: 0.6, y: 20 })); }
  // 2 · 会众的眼光
  { const a = T('c003') - 0.1, b = T('c007') - 0.1; scene('#t2', a, b); light(a, { light: 0.5, rays: 0.4 });
    IN('.bp', T('c004') - 0.2, { s: 0.9, y: 0 }); $$('.bp-c b').forEach((x, i) => IN(x, W('c004', ['名气很大', '口才极好'][i]) - 0.1, { d: 0.5, y: 10 }));
    $$('.rum').forEach((r, i) => IN(r, W('c005', ['以前是摩尼教', '在迦太基', '还有个儿子'][i]) - 0.1, { d: 0.7, y: 20, blur: 6 }));
    tl.to('.bp', { opacity: 0.6, duration: 0.6 }, T('c006')); IN('.obj', W('c006', '老主教') - 0.1, { x: 30, y: 0 }); }
  // 3 · 声明
  { const a = T('c007') - 0.1, b = T('c010') - 0.1; scene('#t3', a, b);
    big('.you', a + 0.05, { st: 0.05, d: 0.8 }); tl.to('.you', { y: -40, scale: 0.7, opacity: 0.6, duration: 0.8 }, T('c008') - 0.3);
    IN('.decl', T('c008'), { y: 60, d: 1.0, blur: 6 }); $$('.dc-l').forEach((l, i) => IN(l, W('c009', ['年轻时', '感谢神', '未来的事奉'][i]) - 0.1, { d: 0.5, y: 6, blur: 3 }));
    IN('.decl-n', T('c008') + 0.4, { d: 0.6, y: 10 }); }
  // 4 · 十三卷，写给神的
  { const a = T('c010') - 0.1, b = T('c016') - 0.1; scene('#t4', a, b); light(a, { light: 0.6, rays: 0.5 });
    on('.t13', a); $$('.t13 .slab').forEach((s, i) => tl.fromTo(s, { opacity: 0, y: -70 }, { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)', immediateRender: false }, a + 0.1 + i * 0.1));
    IN('.w13-a', a + 0.1, { d: 0.6 }); tl.fromTo('.n13', { textContent: 1 }, { textContent: 13, snap: { textContent: 1 }, duration: 1.3, ease: 'none', immediateRender: false }, a + 0.2);
    type('.w13-b', T('c011'), D('c011') * 0.8);
    tl.fromTo('.ni', { opacity: 0, scale: 1.6, filter: 'blur(30px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', immediateRender: false }, W('c012', '第二人称')); on('.ni', W('c012', '第二人称'));
    IN('.ni-s', W('c012', '第二人称') + 0.4, { d: 0.6, y: 10 }); flash(W('c012', '第二人称') + 0.2, 1530, 350, 0.5);
    tl.to(['.w13'], { opacity: 0, duration: 0.4 }, T('c013') - 0.3);
    $$('.wi').forEach((w, i) => IN(w, W(i < 2 ? 'c013' : 'c014', ['偷梨', '那个女人', '不要现在', '骗他妈'][i]) - 0.1, { x: -20, y: 0, d: 0.5 }));
    type('.wl-n', T('c015'), D('c015') * 0.8); }
  // 5 · 对着人写 / 对着神写
  { const a = T('c016') - 0.1, b = T('c020') - 0.1; scene('#t5', a, b);
    IN('.tw.c1', T('c017'), { y: 30 }); $$('.tw-l').forEach((l, i) => IN(l, W('c017', ['这句怎么说', '那件事'][i]) - 0.1, { d: 0.5, y: 8 }));
    on('.tw-mid', T('c018') - 0.2); IN('.tw.c2', T('c018') - 0.1, { y: 30 }); tl.to('.tw.c1', { opacity: 0.45, duration: 0.6 }, T('c018'));
    big('.tw-big', W('c019', '说实话') - 0.15, { st: 0.1 }); flash(W('c019', '说实话'), 1380, 560, 0.45); }
  // 6 · 见证的结构 / 忏悔录的结构
  { const a = T('c020') - 0.1, b = T('c027') - 0.1; scene('#t6', a, b); light(a, { light: 0.5, rays: 0.4 });
    IN('.ts-h', T('c021') - 0.1, { d: 0.6, y: 10 }); DRAW('.ts-p', W('c021', '我以前很糟') - 0.1, D('c021') * 0.9);
    [['.a', '以前很糟'], ['.b', '信了主'], ['.c', '现在好了']].forEach(([k, w]) => IN('.ts-l' + k, W('c021', w) - 0.05, { d: 0.5, y: 10 }));
    tl.to(['.ts-h', '.ts-svg', '.ts-l'], { opacity: 0, filter: 'blur(8px)', duration: 0.5 }, T('c023') - 0.3);
    on('.bars', T('c023')); $$('.bar').forEach((x, i) => IN(x, T('c023') + i * 0.06, { d: 0.4, y: 30, blur: 2 }));
    IN('.bars-n .b1', W('c024', '第九卷') - 0.2, { d: 0.6, y: 10 }); on('.bars-n', a);
    tl.fromTo('.bar.hot', { scale: 1 }, { scale: 1.25, duration: 0.4, yoyo: true, repeat: 1, immediateRender: false }, W('c025', '第十卷'));
    IN('.bars-n .b2', W('c025', '写现在的我') - 0.1, { d: 0.6, y: 10 }); flash(W('c025', '写现在的我'), 1270, 700, 0.4); }
  // 7 · 卷十：还在较劲
  { const a = T('c027') - 0.1, b = T('c037') - 0.1; scene('#t7', a, b);
    IN('.x-h', a + 0.1, { d: 0.6, y: 10 }); on('.xl', a);
    $$('.xi').forEach((x, i) => IN(x, (i < 1 ? W('c027', '吃') : i < 2 ? T('c028') : i < 3 ? T('c029') : T('c030')) - 0.1, { x: -30, y: 0, d: 0.6 }));
    on('.loop', T('c032') - 0.2); DRAW('.loop .lp', W('c032', '更麻烦的是'), D('c032') * 0.8); DRAW('.loop .lpa', W('c032', '更麻烦的是') + D('c032') * 0.8, 0.3);
    on('.loop-t', a); $$('.loop-t span').forEach((s, i) => IN(s, W('c032', ['不在乎别人夸', '得意', '虚荣'][i]) - 0.1, { d: 0.5, y: 8 }));
    type('.hum', W('c033', '我发现') - 0.1, D('c033') * 0.5);
    tl.to(['.xl', '.loop', '.loop-t', '.hum', '.x-h'], { opacity: 0, filter: 'blur(8px)', duration: 0.5 }, T('c034') - 0.35);
    on('.look', a); IN('.lk-a', T('c034'), { d: 0.7, y: 10 }); on('.lk-b', a); $$('.lk-b span').forEach((s, i) => IN(s, W('c035', ['回头看', '也低头看'][i]) - 0.1, { d: 0.8, y: 30, blur: 16 }));
    tl.to('.look', { opacity: 0, duration: 0.4 }, T('c036') - 0.3);
    tl.set('.hum', { filter: 'blur(0px)' }, T('c036') - 0.05); }
  type('.hum2', W('c036', '我成了') - 0.1, D('c036') * 0.45, { d: 0.8, y: 20, blur: 12 }); flash(W('c036', '大问题'), 960, 500, 0.4);
  // 8 · 安波罗修去世
  { const a = T('c037') - 0.1, b = T('c040') - 0.1; scene('#t8', a, b); light(a, { light: 0.35, rays: 0.2 });
    IN('.am2', W('c037', '三百九十七年') - 0.2, { d: 0.8 }); big('.am2-t', W('c037', '安波罗修') - 0.1, { st: 0.1 }); IN('.am2-s', T('c038'), { d: 0.7, y: 10 }); }
  // 9 · 跟我有什么关系
  { const a = T('c040') - 0.1, b = T('c046') - 0.1; scene('#t9', a, b); light(a, { light: 0.55, rays: 0.45 });
    type('.rel', T('c041'), D('c041') * 0.8, { d: 0.8, y: 24 }); IN('.cant', T('c042'), { y: 30 });
    tl.fromTo('.cn-x', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4, immediateRender: false }, W('c044', '帮不上忙')); IN('.cn-s', W('c044', '奥古斯丁自己') - 0.1, { d: 0.6, y: 10 }); }
  // 10 · 诊断
  { const a = T('c046') - 0.1, b = T('c054') - 0.1; scene('#t10', a, b);
    IN('#t10 .nn', a + 0.05, { x: -20, y: 0 }); IN('.phone', T('c048') - 0.2, { y: 40 });
    on('.tags', a); $$('.tags b').forEach((x, i) => IN(x, (i < 2 ? W('c049', ['卷又卷不动', '躺又躺不平'][i]) : T('c050')) - 0.1, { x: -20, y: 0, d: 0.5 }));
    on('.fixes', a); $$('.fixes b').forEach((x, i) => IN(x, W('c051', ['换工作', '健身', '旅行', '断舍离', '冥想软件', '还充了年费'][i]) - 0.1, { d: 0.4, y: 14 }));
    tl.to('.fixes b', { opacity: 0.3, textDecoration: 'line-through', duration: 0.4, stagger: 0.04 }, W('c052', '找错地方'));
    type('.wrong', W('c052', '你找错地方') - 0.1, 0.8, { d: 0.6 }); }
  // 11 · 镜子
  { const a = T('c054') - 0.1, b = T('c069') - 0.1; scene('#t11', a, b);
    tl.set('#t11 .nn', { opacity: 1 }, a); IN('#t11 .nn', a, { x: -20, y: 0 });
    on('.mir', a); type('.mi-a', T('c056') + 0.2, D('c056') * 0.8, { d: 0.5 });
    tl.to(chars('.mi-a'), { opacity: 0, rotationX: 90, duration: 0.4, stagger: 0.01 }, T('c058') - 0.2); tl.fromTo(chars('.mi-b'), { opacity: 0, rotationX: -90 }, { opacity: 1, rotationX: 0, duration: 0.5, stagger: 0.02, immediateRender: false }, W('c058', '原来我是')); on('.mi-b', T('c058'));
    tl.to('.mir', { opacity: 0, duration: 0.4 }, T('c059') - 0.3);
    IN('.eu-h', T('c059'), { d: 0.6, y: 10 }); on('.eu', a);
    $$('.er').forEach((r, i) => { const id = 'c06' + (i + 1); IN(r, T(id) - 0.1, { x: -20, y: 0, d: 0.5 }); tl.fromTo($('i', r), { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4, immediateRender: false }, W(id, '我管它叫') - 0.1); tl.fromTo($('span', r), { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, W(id, '叫') + 0.1); });
    tl.to(['.eu', '.eu-h'], { opacity: 0.35, duration: 0.6 }, T('c066'));
    type('.eu-end .split', T('c067') - 0.05, D('c067'), { d: 0.7 }); }
  // 12 · 回头看过去
  { const a = T('c069') - 0.1, b = T('c084') - 0.1; scene('#t12', a, b); light(a, { light: 0.5, rays: 0.4 });
    tl.set('#t12 .nn', { opacity: 1 }, a); IN('#t12 .nn', a, { x: -20, y: 0 });
    on('.pw', a); $$('.pw b').forEach((x, i) => IN(x, T(['c072', 'c073', 'c074'][i]) - 0.1, { d: 0.6, y: 20 }));
    tl.to('.pw', { opacity: 0, duration: 0.4 }, T('c075') - 0.3);
    frEls.forEach((f, i) => tl.fromTo(f, { opacity: 0, x: +f.dataset.dx, y: +f.dataset.dy }, { opacity: 1, x: +f.dataset.dx, y: +f.dataset.dy, duration: 0.4, immediateRender: false }, T('c075') + i * 0.08));
    frEls.forEach((f, i) => tl.to(f, { x: 0, y: 0, duration: 1.2, ease: 'power3.inOut' }, W('c076', '一直都在') - 1.0 + i * 0.03));
    DRAW('.lf', W('c076', '一直都在') - 0.2, 1.4); big('.lf-t', W('c076', '一直都在'), { st: 0.1 }); flash(W('c076', '一直都在') + 0.3, 960, 470, 0.5);
    tl.to(['.life', '.frag', '.lf-t'], { opacity: 0, duration: 0.5 }, T('c077') - 0.3);
    on('.tt', a); IN('.tt-a', T('c078'), { y: 20 }); IN('.tt-b', T('c079'), { y: 20 });
    tl.to('.tt', { y: -40, opacity: 0.5, duration: 0.6 }, T('c080'));
    on('.ob2', a); type('.ob2 > .split', T('c081'), 0.8, { d: 0.6 }); big('.ob2 b', W('c081', '回头看'), { st: 0.08 });
    tl.to(['.tt', '.ob2'], { opacity: 0, duration: 0.5 }, T('c082') - 0.3); }
  // 13 · 恩典在前头
  { const a = T('c084') - 0.1, b = T('c094') - 0.1; scene('#t13', a, b); light(a, { light: 0.6, rays: 0.5 });
    type('.hq2', a + 0.05, D('c084') * 0.8, { d: 0.6 });
    on('.gr', a); type('.gr-a .split', T('c087') - 0.05, 0.6, { d: 0.8, y: 30, blur: 14 }); IN('.gr-a em', T('c087') - 0.1, { d: 0.5 });
    type('.gr-b .split', W('c087', '认罪在后头') - 0.05, 0.6, { d: 0.8, y: 30, blur: 14 }); IN('.gr-b em', W('c087', '认罪在后头') - 0.1, { d: 0.5 }); flash(T('c087'), 960, 360, 0.45);
    type('.tired', T('c089') - 0.05, 0.6);
    tl.to(['.hq2', '.gr', '.tired'], { opacity: 0, filter: 'blur(8px)', duration: 0.5 }, T('c090') - 0.35);
    on('.pc2', a); IN('.p-x', T('c090'), { d: 0.7, y: 10 }); type('.p-o', T('c091'), D('c091') * 0.8, { d: 0.6 });
    type('.lead', T('c093'), D('c093') * 0.8); }
  // 14 · 路德、加尔文、唯独恩典
  { const a = T('c094') - 0.1, b = T('c099') - 0.1; scene('#t14', a, b); light(a, { light: 0.75, rays: 0.7 });
    IN('.th', W('c094', '马丁路德') - 0.2, { y: 50, d: 1.0, blur: 6 }); IN('.cv', T('c096') - 0.1, { x: 30, y: 0 });
    tl.to(['.th', '.cv'], { opacity: 0.25, y: -40, duration: 0.6 }, T('c097') - 0.3);
    on('.sg', a); big('.sg-t', W('c097', '唯独恩典') - 0.1, { st: 0.12 }); IN('.sg-l', W('c097', '唯独恩典') + 0.5, { d: 0.8, y: 10 }); IN('.sg-n', W('c097', '不是谁'), { d: 0.7, y: 10 }); flash(W('c097', '唯独恩典'), 960, 740, 0.55); }
  // 15 · 怎么读
  { const a = T('c099') - 0.1, b = EP.total - 6.6; scene('#t15', a, b); light(a, { light: 0.55, rays: 0.4 });
    tl.set('#t15 .nn', { opacity: 1 }, a); IN('#t15 .nn', a, { x: -20, y: 0 }); IN('.bkz', T('c100') - 0.2, { y: 40, d: 1.0 });
    on('.rd', a); $$('.rd-r').forEach((r, i) => IN(r, [W('c100', '从拉丁文'), T('c101'), T('c103')][i] - 0.1, { x: -20, y: 0 }));
    tl.to(['.rd', '.bkz'], { opacity: 0.3, duration: 0.6 }, T('c107') - 0.4); type('.rd-end', T('c107'), D('c107') * 0.8, { d: 0.7 }); }
  // 片尾
  { const a = EP.total - 6.2; scene('#tZ', a, EP.total + 1); IN('#tZ .z-k', a + 0.2, { d: 0.9 }); type('#tZ .z-t', a + 0.5, 1.0, { d: 0.9, y: 24, blur: 14 }); IN('#tZ .z-s', a + 1.3, { d: 0.9, y: 10 }); light(a, { light: 0.4, rays: 0.3 }); }
  K.finish();
})();
