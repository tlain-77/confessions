// 本人录制 · 第七讲（卷一第五章下 · 让我死，为了不死）：画面全部按场景表 self9_lec.js 搭（lec.js、anim.js、art.js），时间对到本人录音上
(async function () {
  const { K, END, AT: LAT } = await lecture({ secPrefix: '第七讲 · ' });
  const { tl, IN, type, EP } = K;
  // 片尾
  const z = document.createElement('section'); z.className = 'scene'; z.id = 'LZ';
  z.innerHTML = '<div class="z-k">第 七 讲 · 完</div><div class="z-t split">让我死，为了不死</div><div class="z-s">忏悔录 · 逐句精读</div>';
  document.querySelector('#scenes').appendChild(z);
  [...z.querySelectorAll('.split')].forEach(el => { const t = el.textContent; el.textContent = ''; for (const ch of t) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; el.appendChild(s); } });
  gsap.set([...z.children, ...z.querySelectorAll('.ch')], { opacity: 0 });
  { const a = EP.total - 6.2; K.scene(z, a, EP.total + 1); IN(z.querySelector('.z-k'), a + 0.2, { d: 0.9 }); type(z.querySelector('.z-t'), a + 0.5, 1.0, { d: 0.9, y: 24, blur: 14 }); IN(z.querySelector('.z-s'), a + 1.3, { d: 0.9, y: 10 }); }
  // 原文卡出来以后，一道光从左扫到右
  window.LEC.forEach((sc, i) => (sc.items || []).filter(it => it.q).forEach((it, k) => {
    const el = document.querySelectorAll(`#L${i} .lq`)[k]; if (!el) return;
    tl.fromTo(el, { '--sw': '-30%' }, { '--sw': '130%', duration: 1.8, ease: 'power1.inOut', immediateRender: false }, LAT(it.at) + 0.3);
  }));
  // 名画、整屏对照的那几场：画自己铺满，背景层（逐句换的画）不放
  window.ASIDE_SPANS = (window.ASIDE_SPANS || []).concat(window.LEC.map((sc, i) => (sc.items || []).some(it => it.art || it.pdx) ? window.LEC_TIMES[i] : null).filter(Boolean));
  if (window.fixEarly) window.fixEarly(tl);
  if (window.fixClash) window.fixClash(tl);
  if (window.SHOTS) window.SHOTS(tl);   // 逐句换背景（放在防闪处理之后，不让它们动镜头的淡入淡出）
  K.finish(window.ART_TICK);
})();
