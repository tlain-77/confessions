// 本人录制 · 第二讲（卷一第二章 · 我请你来，可我本来就在你里面）：画面全部按场景表 self4_lec.js 搭（lec.js），时间对到本人录音上
(async function () {
  const { K, END } = await lecture({ secPrefix: '第二讲 · ' });
  const { tl, IN, type, EP } = K;
  // 片尾
  const z = document.createElement('section'); z.className = 'scene'; z.id = 'LZ';
  z.innerHTML = '<div class="z-k">第 二 讲 · 完</div><div class="z-t split">我请你来，可我本来就在你里面</div><div class="z-s">忏悔录 · 逐句精读</div>';
  document.querySelector('#scenes').appendChild(z);
  [...z.querySelectorAll('.split')].forEach(el => { const t = el.textContent; el.textContent = ''; for (const ch of t) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; el.appendChild(s); } });
  gsap.set([...z.children, ...z.querySelectorAll('.ch')], { opacity: 0 });
  { const a = EP.total - 6.2; K.scene(z, a, EP.total + 1); IN(z.querySelector('.z-k'), a + 0.2, { d: 0.9 }); type(z.querySelector('.z-t'), a + 0.5, 1.0, { d: 0.9, y: 24, blur: 14 }); IN(z.querySelector('.z-s'), a + 1.3, { d: 0.9, y: 10 }); }
  if (window.fixEarly) window.fixEarly(tl);
  if (window.fixClash) window.fixClash(tl);
  if (window.SHOTS) window.SHOTS(tl);   // 逐句换背景（放在防闪处理之后，不让它们动镜头的淡入淡出）
  K.finish();
})();
