// 本人录制 · 奥古斯丁这个人：自己加的话（旁白卡）、配画、衬底
window.ASIDES = tl => { const D = window.EP2, P = (p, n) => atP(D, p, n);
  const PAINT = {
    birth: '安东尼奥·维瓦里尼《圣奥古斯丁的诞生》 1440—1450', pears: '梵高《葡萄、柠檬、梨和苹果》 1887', dido: '透纳《狄多建造迦太基》 1815',
    cicero: '切萨雷·马卡里《西塞罗斥责喀提林》 1880年代', heretics: '韦尔戈斯工坊《圣奥古斯丁与异端辩论》 15世纪', sea: '艾瓦佐夫斯基《月夜》 1850',
    ninth: '艾瓦佐夫斯基《九级浪》 1850', sermon: '韦尔戈斯工坊《奥古斯丁与莫妮卡听安波罗修讲道》 15世纪', conversion: '菲利普·德·尚帕涅《圣奥古斯丁的归信》 17世纪',
    vesting: '佚名《安波罗修为奥古斯丁披上白衣》 16世纪初', monica: '阿里·谢弗《圣奥古斯丁与圣莫妮卡》 1846', portrait: '菲利普·德·尚帕涅《圣奥古斯丁》 约1645' };

  makeBackdrops(tl, [
    { a: 0.1, b: P('在公元354年') - 0.2, src: 'portrait', o: 0.34, pos: '50% 22%', cap: PAINT.portrait, kb: [1.14, 0, -2, 1.0, 0, 2] },
    { a: P('当然他后面进了摩尼教') + 0.4, b: P('今天倒没有人信什么摩尼教了'), src: 'heretics', o: 0.24, pos: '50% 30%', cap: PAINT.heretics },
    { a: P('走到罗马的港口') - 0.5, b: P('回到非洲'), src: 'monica_l', o: 0.36, pos: '50% 26%', cap: PAINT.monica, kb: [1.0, 0, 0, 1.12, 0, -3] },
  ]);

  makeAsides(tl, D, [
    // 母亲莫妮卡
    { a: P('母亲叫莫妮卡') - 0.3, b: P('这个孩子从小就聪明') - 0.35, k: '母 亲',
      img: { src: 'birth', fit: 'frame', side: 'r', box: [560, 720], pos: '50% 52%', cap: PAINT.birth, kb: [1.5, 0, 1, 1.36, 0, -1] },
      lines: [{ t: '莫妮卡', at: P('母亲叫莫妮卡') + 0.4, cls: 'big gold' }, { t: '一个基督徒', at: P('是个基督徒'), cls: 'kai' }, { t: '这位母亲，后面要反复提到', at: P('这位母亲'), cls: 'sm' }] },
    // 修辞是什么
    { a: P('修辞说白了') - 0.2, b: P('他长大后去当了') - 0.3, k: '修 辞 · R H E T O R I C A', cls: 'rh',
      lines: [{ t: '说白了，就是教人怎么讲话、怎么写文章——', at: P('修辞说白了'), cls: 'kai' }, { t: '说服别人', at: P('说服别人'), cls: 'big gold' }],
      html: `<div class="rh-row"><div class="rh-m"><svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="104" pathLength="1"/></svg><b>演讲</b></div><i>＋</i><div class="rh-m"><svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="104" pathLength="1"/></svg><b>写作</b></div><i>＋</i><div class="rh-m"><svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="104" pathLength="1"/></svg><b>辩论</b></div></div>`,
      foot: { t: '合在一起，就是当年最体面的一门学问', at: P('合在一起') },
      fx: (tl, sec, { IN }) => {
        const ms = sec.querySelectorAll('.rh-m'), ps = sec.querySelectorAll('.rh-row > i'), at = [P('演讲'), P('写作'), P('辩论')];
        tl.set([...ms, ...ps], { opacity: 0 }, 0);
        ms.forEach((m, i) => { tl.fromTo(m, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)', immediateRender: false }, at[i] - 0.15);
          tl.fromTo(m.querySelector('circle'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, at[i] - 0.15); });
        ps.forEach((p, i) => IN(p, at[i + 1] - 0.3, { d: 0.4, y: 0, blur: 4 }));
        tl.to(ms, { boxShadow: '0 0 60px rgba(243,213,148,.45)', duration: 0.8, stagger: 0.12 }, P('合在一起') - 0.2);
      } },
    // 也许只是因为…… / 景区里的“禁止抚摸”
    { a: P('也许只是因为不许') - 0.2, b: P('到了17岁那年') - 0.4, k: '你 自 己 的 梨', cls: 'pear',
      img: { src: 'pears', fit: 'frame', side: 'l', box: [760, 630], pos: '50% 50%', cap: PAINT.pears },
      html: `<div class="pr-g g1"><em>也许只是因为——</em><b>不许</b><b>刺激</b><b>大家都在做</b></div>
             <div class="pr-g g2"><em>景区里写着：</em><div class="pr-sign"><span class="no"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><path d="M20 80 L80 20"/></svg><i>✋</i></span><span>禁止抚摸</span></div><b class="kai">我偏要伸手去摸一摸</b><small>好像摸了，就怎么怎么样了一样</small></div>`,
      fx: (tl, sec, { IN }) => {
        const g1 = sec.querySelector('.g1'), g2 = sec.querySelector('.g2'), w1 = g1.querySelectorAll('b');
        tl.set([g1.querySelector('em'), ...w1, ...g2.children], { opacity: 0 }, 0);
        IN(g1.querySelector('em'), P('也许只是因为不许'), { d: 0.6, y: 10 });
        [P('也许只是因为不许') + 0.8, P('也许只是因为刺激') + 0.8, P('大家都在做') - 0.1].forEach((t, i) => { IN(w1[i], t, { d: 0.6 }); if (i) tl.to(w1[i - 1], { opacity: 0.32, duration: 0.5 }, t); });
        tl.to(g1, { opacity: 0, y: -30, filter: 'blur(8px)', duration: 0.6 }, P('这个梨我也想到一个') - 0.2);
        const [e, sg, b, sm] = g2.children;
        IN(e, P('就是我在景区的时候'), { d: 0.6, y: 10 });
        tl.fromTo(sg, { opacity: 0, scale: 0.85, rotation: -4 }, { opacity: 1, scale: 1, rotation: -2, duration: 0.6, ease: 'back.out(2)', immediateRender: false }, P('禁止抚摸') - 0.2);
        IN(b, P('那么我就要去伸手'), { d: 0.7 }); tl.fromTo(sg, { x: 0 }, { x: 8, duration: 0.07, repeat: 5, yoyo: true, immediateRender: false }, P('伸手去摸一摸'));
        IN(sm, P('好像摸的这些东西'), { d: 0.7, y: 10 });
      } },
    // 迦太基
    { a: P('那个城市叫迦太基') - 0.2, b: P('他后来回忆那段日子') - 0.3, k: '十 七 岁 · 公 元 371 年',
      img: { src: 'dido', fit: 'cover', side: 'l', pos: '60% 50%', cap: PAINT.dido, kb: [1.16, 3, 0, 1.02, -2, 0] },
      lines: [{ t: '迦太基', at: P('那个城市叫迦太基') + 0.4, cls: 'big gold' }, { t: '北非最大的城市', at: P('那个城市叫迦太基') + 1.1, cls: 'sm' }, { t: '小镇青年，第一次进大城市', at: P('是小镇青年'), cls: 'kai' }],
      foot: { t: '就像我第一次进北京、第一次进杭州', at: P('就像我第一次进入北京') } },
    // 西塞罗 vs 圣经
    { a: P('我也找了三句话') - 0.1, b: P('当然他后面进了摩尼教') - 0.3, k: '文 笔 对 比', cls: 'cic',
      img: { src: 'cicero', fit: 'cover', side: 'c', pos: '50% 50%', cap: PAINT.cicero, kb: [1.0, 0, 0, 1.1, -2, 0] },
      cols: [{ h: '西 塞 罗', cls: 'l', at: P('西塞罗的三句话'), lines: [
        { t: '喀提林，你到底还要滥用我们的耐心到什么时候？……你那脱了缰的狂妄，要放肆到哪一步才算完？', at: P('喀提林') },
        { t: '《反喀提林》', at: P('喀提林') + 0.6, cls: 'src' },
        { t: '这些学问，滋养少年，愉悦老年；顺境时增光，逆境时给人避难和安慰……陪我们过夜，陪我们远行，陪我们下乡。', at: P('这些学问滋养少年') },
        { t: '《为诗人阿尔奇亚辩护》', at: P('这些学问滋养少年') + 0.6, cls: 'src' },
        { t: '我们人人都想要幸福。', at: P('我们人人都想要幸福') },
        { t: '《荷尔顿西乌斯》', at: P('我们人人都想要幸福') + 0.5, cls: 'src' }] },
       { h: '圣 经', cls: 'r', at: P('我们再对比圣经'), lines: [
        { t: '神说：“要有光”，就有了光。', at: P('神说要有光') },
        { t: '耶稣哭了。', at: P('耶稣哭了') },
        { t: '虚心的人有福了！因为天国是他们的。', at: P('虚心的人有福了') },
        { t: '弟兄们，从前我到你们那里去，并没有用高言大智……我说的话、讲的道，不是用智慧委婉的言语，乃是用圣灵和大能的明证。', at: P('弟兄们从前我') },
        { t: '哥林多前书 2:1, 4', at: P('不是用智慧委婉的言语'), cls: 'src' }] }],
      fx: (tl, sec) => { const sh = sec.querySelector('.ax-shade'); tl.fromTo(sh, { opacity: 0.45 }, { opacity: 1, duration: 1.2, immediateRender: false }, P('西塞罗的三句话') - 0.6); } },
    // 半天狗
    { a: P('我还听过鬼灭之刃'), b: P('那这些年他妈在干什么') - 0.3, k: '鬼 灭 之 刃 · 半 天 狗', cls: 'hand',
      html: '<div class="ht-glow"></div>',
      lines: [{ t: '偷了东西，却说：', at: P('当时他是偷了一个东西'), cls: 'sm' }, { t: '“不是我偷的，', at: P('却说这东西不是我偷的'), cls: 'big' }, { t: '是我这双手偷的。”', at: P('是我这双手偷的'), cls: 'big gold' }, { t: '多荒谬啊。', at: P('多荒谬啊'), cls: 'kai coral' }],
      fx: (tl, sec) => { const g = sec.querySelector('.ht-glow'); tl.set(g, { opacity: 0 }, 0); tl.fromTo(g, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.1, duration: 1.4, ease: 'power2.out', immediateRender: false }, P('是我这双手偷的') - 0.2); tl.to(g, { opacity: 0.4, duration: 1 }, P('多荒谬啊')); } },
    // 那天晚上
    { a: P('那天晚上莫妮卡') - 0.2, b: P('很多年以后') - 0.3, k: '那 天 晚 上',
      img: { src: 'sea', fit: 'cover', side: 'l', pos: '55% 60%', cap: PAINT.sea, kb: [1.12, 2, 1, 1.0, -1, -1] },
      lines: [{ t: '莫妮卡在岸边', at: P('那天晚上莫妮卡') + 0.6, cls: 'kai' }, { t: '哭着求神：别让他走', at: P('哭着求着神'), cls: 'big' }, { t: '神没有答应。', at: P('神没有答应'), cls: 'big gold' }] },
    // 两年之后，横渡地中海
    { a: P('两年之后') - 0.2, b: P('不过说归说') - 0.2, k: '两 年 之 后',
      img: { src: 'ninth', fit: 'cover', side: 'r', pos: '50% 55%', cap: PAINT.ninth, kb: [1.15, -2, 1, 1.02, 2, -1] },
      lines: [{ t: '莫妮卡自己坐船', at: P('莫妮卡自己坐船'), cls: 'kai' }, { t: '横渡地中海', at: P('横渡地中海'), cls: 'big gold' }, { t: '一直追到米兰', at: P('到了米兰'), cls: 'sm' }],
      foot: { t: '“中国式母亲”？——你是没见过北非的。', at: P('每次有人听说中国式母亲') + 0.4 } },
    // 这像不像我们的现在
    { a: P('这像不像我们的现在') - 0.2, b: P('他就这么一路') - 0.3, k: '今 天',
      lines: [{ t: '这像不像我们的现在？', at: P('这像不像我们的现在'), cls: 'big' }, { t: '我们也说了很多谎话，', at: P('我们也说了很多谎话'), cls: 'kai' }, { t: '听的人，也知道那是谎话。', at: P('而听我们话的人'), cls: 'kai gold' }] },
    // 地铁
    { a: P('这更像是我们周一早上的地铁') - 0.1, b: P('差不多同时') - 0.3, k: '一 千 六 百 年 后', cls: 'metro2',
      html: '<div class="mt2"><div class="mt2-car"></div><div class="mt2-car c2"></div><i></i><i></i><i></i><i></i></div>',
      lines: [{ t: '周一早上的地铁', at: P('这更像是我们周一早上的地铁'), cls: 'kai' }, { t: '小学 · 初中 · 高中 · 大学 · 工作 · 加班', at: P('是我们上小学'), cls: 'sm' }],
      foot: { t: '我们所图的，不就是快乐吗？', at: P('我们所图的不就是快乐吗') },
      fx: (tl, sec) => {
        const cars = sec.querySelectorAll('.mt2-car'), st = sec.querySelectorAll('.mt2 i'), t0 = P('这更像是我们周一早上的地铁');
        tl.set([...cars, ...st], { opacity: 0 }, 0);
        cars.forEach((c, i) => { const t = i ? P('是我们上小学') + 0.8 : t0 + 0.4; tl.set(c, { opacity: 1 }, t); tl.fromTo(c, { x: 2000 }, { x: -2900, duration: 3.2, ease: 'power1.inOut', immediateRender: false }, t); tl.set(c, { opacity: 0 }, t + 3.2); });
        st.forEach((s, i) => { const t = t0 + 0.6 + i * 0.25; tl.fromTo(s, { opacity: 0, x: 1900 }, { opacity: 0.7, x: -600, duration: 1.4, ease: 'power2.in', immediateRender: false }, t); tl.to(s, { opacity: 0, duration: 0.3 }, t + 1.2); });
      } },
    // 他去听安波罗修讲道
    { a: P('这时候他已经常去听米兰的主教讲道了') - 0.2, b: P('奥古斯丁这小子') - 0.3, k: '米 兰 · 主 教',
      img: { src: 'sermon', fit: 'frame', side: 'r', box: [600, 790], pos: '50% 40%', cap: PAINT.sermon, kb: [1.18, 0, -3, 1.05, 0, 2] },
      lines: [{ t: '他常去听主教讲道', at: P('这时候他已经常去听米兰的主教讲道了') + 0.5, cls: 'kai' }, { t: '安波罗修', at: P('这位主教是安布罗修') + 0.3, cls: 'big gold' }, { t: '当时最有名的讲道人', at: P('是当时很有名的讲道人'), cls: 'sm' }] },
    // 拿着，读吧
    { a: P('拿着读吧') - 0.5, b: P('罗马书') - 0.4, k: '隔 壁 孩 子 的 声 音',
      img: { src: 'conversion', fit: 'cover', side: 'r', pos: '35% 40%', cap: PAINT.conversion, kb: [1.14, 2, 0, 1.02, -1, 0] },
      lines: [{ t: '“拿着，读吧！', at: P('拿着读吧'), cls: 'big gold' }, { t: '拿着，读吧！”', at: P('拿着读吧', 1), cls: 'big' }, { t: '哪个儿童游戏里，都没有这句词', at: P('他想了想'), cls: 'sm', dim: P('他又站起来') }, { t: '他回去拿起保罗书信，翻开——', at: P('他又站起来'), cls: 'kai' }] },
    // 受洗
    { a: P('他辞去了教职') - 0.2, b: P('然后他准备回非洲') - 0.2, k: '387 年 · 复 活 节',
      img: { src: 'vesting', fit: 'frame', side: 'l', box: [820, 486], pos: '50% 50%', cap: PAINT.vesting },
      lines: [{ t: '辞去教职', at: P('他辞去了教职'), cls: 'sm' }, { t: '安波罗修为他施洗', at: P('安布罗修给他施洗'), cls: 'gold' }, { t: '那年，他三十二岁', at: P('那年他32岁'), cls: 'kai' }] },
  ]); };
