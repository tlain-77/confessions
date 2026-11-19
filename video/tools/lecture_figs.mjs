// 讲稿里的示意图：用 SVG 画，浏览器截成 PNG（16:9，以后也能直接放进视频）。
// node tools/lecture_figs.mjs   → ../讲稿/卷一/图/*.png
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from '../lib.mjs';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../讲稿/卷一/图');
fs.mkdirSync(OUT, { recursive: true });
const C = { bg: '#f5efe2', ink: '#2c2620', mute: '#857a6c', gold: '#b88a3a', glow: '#e9c873', red: '#a4472f', dark: '#2a2420' };
const T = (x, y, s, size = 30, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${o.fill || C.ink}" text-anchor="${o.a || 'middle'}" font-family="${o.f || 'kai'}" ${o.w ? `font-weight="${o.w}"` : ''} ${o.extra || ''}>${s}</text>`;
const title = s => T(800, 92, s, 52, { f: 'serif', w: 700 }) + `<line x1="640" y1="122" x2="960" y2="122" stroke="${C.gold}" stroke-width="2"/>`;
const glowDot = (x, y, r, id) => `<circle cx="${x}" cy="${y}" r="${r * 3.2}" fill="url(#${id})"/><circle cx="${x}" cy="${y}" r="${r}" fill="${C.gold}"/>`;
const person = (x, y, s = 1, fill = C.ink) => `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}"><circle cx="0" cy="-34" r="13"/><path d="M-20 18 Q-20 -16 0 -16 Q20 -16 20 18 Z"/></g>`;
const arrow = (d, col = C.gold, w = 3, dash = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#ah${col.slice(1)})"/>`;
const defs = `<defs>
  <radialGradient id="g1"><stop offset="0" stop-color="${C.glow}" stop-opacity=".95"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="field" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.glow}" stop-opacity=".55"/><stop offset=".72" stop-color="${C.glow}" stop-opacity=".28"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a4320" stop-opacity=".16"/></radialGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb3c9"/><stop offset="1" stop-color="#5d86a3"/></linearGradient>
  ${[C.gold, C.ink, C.red, C.mute, '#6f9bb8'].map(c => `<marker id="ah${c.slice(1)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`).join('')}
</defs>`;

const FIGS = {
  // —— 卷一第二章 ——
  '02-1-我原来心里的两张图': () => title('我原来心里的两张图') + `
    <g>${T(285, 200, '图一', 34, { f: 'serif', w: 700 })}
      <circle cx="250" cy="470" r="150" fill="none" stroke="${C.ink}" stroke-width="3"/>${T(250, 365, '世界', 28, { fill: C.mute })}
      <circle cx="250" cy="500" r="9" fill="${C.ink}"/>${T(250, 545, '人', 28)}
      ${glowDot(455, 255, 15, 'g1')}${T(500, 265, '神', 30, { a: 'start', w: 700 })}
      ${arrow('M265 488 Q330 330 435 270', C.mute, 2.5, '8 7')}${T(408, 400, '喊一声', 24, { fill: C.mute, a: 'start' })}
      ${T(285, 705, '神在圈外，很亮，但很远', 28)}${T(285, 750, '祷告 = 请远方的客人过来一趟', 24, { fill: C.mute })}</g>
    <g>${T(800, 200, '图二', 34, { f: 'serif', w: 700 })}
      <circle cx="800" cy="470" r="150" fill="none" stroke="${C.ink}" stroke-width="3"/>${T(800, 365, '世界', 28, { fill: C.mute })}
      <circle cx="800" cy="485" r="78" fill="none" stroke="${C.ink}" stroke-width="2.5"/>${T(800, 440, '人', 26)}
      ${glowDot(800, 500, 12, 'g1')}${T(800, 545, '神', 26, { w: 700 })}
      ${T(800, 705, '神被包在最里面，像个果核', 28)}${T(800, 750, '神 = 我心里的一部分', 24, { fill: C.mute })}</g>
    <g>${T(1315, 200, '奥古斯丁的图', 34, { f: 'serif', w: 700 })}
      <circle cx="1315" cy="470" r="150" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="10 10"/>${T(1315, 505, '？', 110, { fill: C.gold, f: 'serif' })}
      ${T(1315, 705, '两张都不对', 28)}${T(1315, 750, '他是一句一句问出来的', 24, { fill: C.mute })}</g>`,

  '02-2-两种依靠': () => title('两种“依靠”') + `
    <line x1="800" y1="170" x2="800" y2="700" stroke="${C.mute}" stroke-opacity=".4" stroke-width="2"/>
    <g>${T(400, 210, '园丁和花', 38, { f: 'serif', w: 700 })}
      <path d="M215 330 h100 a10 10 0 0 1 10 10 v70 a10 10 0 0 1 -10 10 h-100 a10 10 0 0 1 -10 -10 v-70 a10 10 0 0 1 10 -10z" fill="${C.mute}"/>
      <path d="M325 350 L395 300" stroke="${C.mute}" stroke-width="12" stroke-linecap="round"/><path d="M215 345 q-40 20 0 60" fill="none" stroke="${C.mute}" stroke-width="9"/>
      ${[[410, 330], [425, 365], [400, 395], [435, 410]].map(([x, y]) => `<path d="M${x} ${y} q-6 10 0 14 q6 -4 0 -14z" fill="#6f9bb8"/>`).join('')}
      <path d="M470 610 L470 455" stroke="#5f7d4a" stroke-width="6"/><ellipse cx="445" cy="545" rx="26" ry="11" fill="#6f8f55" transform="rotate(-30 445 545)"/><ellipse cx="495" cy="575" rx="26" ry="11" fill="#6f8f55" transform="rotate(30 495 575)"/>
      ${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${470 + 24 * Math.cos(a * Math.PI / 180)}" cy="${440 + 24 * Math.sin(a * Math.PI / 180)}" r="17" fill="#d98a7a"/>`).join('')}<circle cx="470" cy="440" r="13" fill="${C.gold}"/>
      <rect x="430" y="605" width="80" height="45" rx="6" fill="#9c6b48"/>
      ${T(400, 715, '园丁给的是条件：水', 30)}${T(400, 760, '园丁走了，花还在，只是慢慢枯萎', 26, { fill: C.mute })}</g>
    <g>${T(1200, 210, '唱歌的人和歌声', 38, { f: 'serif', w: 700 })}
      ${person(1080, 500, 2.4)}
      ${[40, 75, 110].map((r, i) => `<path d="M${1150 + r * 0.2} ${415 - r} A ${r} ${r} 0 0 1 ${1150 + r * 0.2} ${415 + r}" fill="none" stroke="${C.gold}" stroke-width="${5 - i}" opacity="${1 - i * 0.25}"/>`).join('')}
      ${T(1330, 380, '♪', 56, { fill: C.gold, f: 'serif' })}${T(1290, 500, '♫', 50, { fill: C.gold, f: 'serif' })}
      ${T(1200, 715, '唱的人给的是歌声本身', 30)}${T(1200, 760, '唱的人一停，歌声当下就没有了', 26, { fill: C.mute })}</g>
    ${T(800, 840, '神给你的不只是“水”，是你这个人本身 —— 这更像唱歌', 32, { f: 'serif', w: 700, fill: C.gold })}`,

  '02-3-奥古斯丁的图': () => title('奥古斯丁的图：我们在神里面') + `
    <circle cx="800" cy="500" r="430" fill="url(#field)"/>
    ${T(800, 185, '神 —— 充满一切，托住一切，没有边', 28, { fill: C.gold, w: 700 })}
    <circle cx="800" cy="500" r="215" fill="${C.bg}" fill-opacity=".72" stroke="${C.ink}" stroke-width="3"/>
    ${T(800, 345, '世界（天地）', 28)}${T(800, 380, '受造的，有边', 22, { fill: C.mute })}
    ${person(720, 520, 1.3)}${person(820, 470, 1.3)}${person(890, 560, 1.3)}${T(935, 545, '人', 26, { a: 'start' })}
    ${arrow('M640 790 Q700 760 720 590', C.gold, 3)}${arrow('M800 820 Q805 700 820 535', C.gold, 3)}${arrow('M960 790 Q910 740 890 625', C.gold, 3)}
    ${T(800, 860, '托住', 30, { fill: C.gold, w: 700 })}
    <g>${T(70, 330, '✕ 不是图一：', 28, { a: 'start', fill: C.red })}${T(70, 372, '神在外面远远看着', 26, { a: 'start', fill: C.mute })}
       ${T(70, 450, '✕ 不是图二：', 28, { a: 'start', fill: C.red })}${T(70, 492, '神被装在人里面', 26, { a: 'start', fill: C.mute })}</g>
    <g>${T(1270, 330, '✓ 一切都在神之中', 28, { a: 'start', fill: C.gold })}${T(1270, 410, '✓ 神托住每一个', 28, { a: 'start', fill: C.gold })}
       ${T(1270, 490, '✓ 那条线还在：', 28, { a: 'start', fill: C.gold })}${T(1270, 532, '人不是神的一部分', 26, { a: 'start', fill: C.mute })}</g>`,

  '02-4-太阳和窗帘': () => title('太阳和窗帘') + `
    ${[...Array(12)].map((_, i) => { const a = (i * 30) * Math.PI / 180; return `<line x1="${250 + 85 * Math.cos(a)}" y1="${290 + 85 * Math.sin(a)}" x2="${250 + 120 * Math.cos(a)}" y2="${290 + 120 * Math.sin(a)}" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"/>`; }).join('')}
    <circle cx="250" cy="290" r="70" fill="${C.glow}" stroke="${C.gold}" stroke-width="4"/>${T(250, 460, '太阳从来没走开', 28, { fill: C.gold, w: 700 })}
    <polygon points="380,300 760,380 760,620 380,560" fill="${C.glow}" opacity=".35"/>
    <rect x="760" y="250" width="600" height="470" fill="${C.dark}"/><polygon points="730,250 1060,140 1390,250" fill="#5b4a3b"/>
    <rect x="752" y="390" width="22" height="210" fill="${C.glow}" opacity=".9"/>
    <path d="M774 380 q22 30 0 60 q22 30 0 60 q22 30 0 60 q22 30 0 60 L812 620 L812 380 Z" fill="${C.red}"/>
    ${person(1110, 680, 1.6, '#4a4038')}
    <rect x="910" y="300" width="400" height="80" rx="16" fill="${C.bg}" opacity=".93"/>${T(1110, 352, '太阳啊，求你到我房间里来', 26)}
    ${T(1060, 520, '屋里很黑', 28, { fill: '#8d8172' })}
    ${arrow('M600 650 Q700 640 770 600', C.red, 2.5)}${T(520, 640, '窗帘：', 28, { fill: C.red, w: 700 })}${T(520, 682, '骄傲、自欺、挡光的一大堆东西', 26, { fill: C.red })}
    ${T(800, 800, '距离不在空间上，在心上', 34, { f: 'serif', w: 700 })}
    ${T(800, 850, '「你在我身内，我驰骛于身外。」—— 卷十', 26, { fill: C.mute })}`,

  // —— 卷一第三章 ——
  '03-1-两种充满': () => title('两种“充满”') + `
    <line x1="800" y1="170" x2="800" y2="720" stroke="${C.mute}" stroke-opacity=".4" stroke-width="2"/>
    <g>${T(400, 210, '水充满瓶子', 38, { f: 'serif', w: 700 })}
      <path d="M370 290 h60 v60 q90 40 90 130 v150 q0 30 -30 30 h-180 q-30 0 -30 -30 v-150 q0 -90 90 -130 z" fill="url(#water)" stroke="${C.ink}" stroke-width="4"/>
      <path d="M358 290 q-14 6 -12 26 q4 30 -26 60 q-40 40 -46 110 v170" fill="none" stroke="#6f9bb8" stroke-width="5" stroke-linecap="round" opacity=".85"/><path d="M442 290 q14 6 12 26 q-4 30 26 60 q40 40 46 110 v170" fill="none" stroke="#6f9bb8" stroke-width="5" stroke-linecap="round" opacity=".85"/>${[[262, 560], [540, 600], [255, 640]].map(([x, y]) => `<path d="M${x} ${y} q-7 12 0 17 q7 -5 0 -17z" fill="#6f9bb8"/>`).join('')}<ellipse cx="400" cy="688" rx="190" ry="16" fill="#8fb3c9" opacity=".7"/>
      <ellipse cx="400" cy="288" rx="44" ry="10" fill="#8fb3c9"/>${T(400, 262, '溢出来的那部分，安插在哪里？', 26, { fill: C.red })}
      ${T(400, 740, '被瓶子框住，多了就溢出来', 30)}${T(400, 785, '（这是给有体积的东西用的画面）', 24, { fill: C.mute })}</g>
    <g>${T(1200, 210, '神充满天地', 38, { f: 'serif', w: 700 })}
      <circle cx="1200" cy="470" r="250" fill="url(#field)"/>
      <circle cx="1200" cy="450" r="125" fill="${C.bg}" fill-opacity=".7" stroke="${C.ink}" stroke-width="3"/>${T(1200, 460, '天地', 32)}
      ${arrow('M1130 660 Q1140 620 1150 585', C.gold, 3)}${arrow('M1200 680 L1200 590', C.gold, 3)}${arrow('M1270 660 Q1260 620 1250 585', C.gold, 3)}
      ${T(1200, 740, '不是被装着，是托着、包着', 30)}${T(1200, 785, '「你充塞一切，亦即是包容一切」', 24, { fill: C.mute })}</g>
    ${T(800, 860, '世界不是神的容器，神是世界的根基', 34, { f: 'serif', w: 700, fill: C.gold })}`,

  '03-2-方向是反的': () => title('倾注：方向是反的') + `
    <line x1="800" y1="170" x2="800" y2="720" stroke="${C.mute}" stroke-opacity=".4" stroke-width="2"/>
    <g>${T(400, 210, '水倒出来', 38, { f: 'serif', w: 700 })}
      <circle cx="400" cy="400" r="30" fill="#6f9bb8"/>
      ${arrow('M400 440 L400 600', C.mute, 5)}${T(430, 540, '往下掉 = 下坠', 28, { a: 'start', fill: C.mute })}
      ${[[-1, -0.3], [1, -0.3], [-1, 0.5], [1, 0.5], [-0.4, -1], [0.4, -1]].map(([dx, dy]) => arrow(`M${400 + dx * 40} ${400 + dy * 40} L${400 + dx * 130} ${400 + dy * 130}`, '#6f9bb8', 3)).join('')}
      ${T(400, 270, '四散 = 涣散', 28, { fill: '#5d86a3' })}
      ${T(400, 740, '倒得越多，掉得越低、散得越开', 28)}</g>
    <g>${T(1200, 210, '神倾注在我们身内', 38, { f: 'serif', w: 700 })}
      <circle cx="1200" cy="450" r="190" fill="url(#field)"/>${person(1200, 470, 2.2)}
      ${arrow('M1160 680 L1170 545', C.gold, 5)}${arrow('M1240 680 L1230 545', C.gold, 5)}${T(1290, 650, '往上托 = 支撑', 28, { a: 'start', fill: C.gold, w: 700 })}
      ${[[-1, -0.7], [1, -0.7], [-1.15, 0.15], [1.15, 0.15]].map(([dx, dy]) => `<rect x="${1200 + dx * 190 - 9}" y="${410 + dy * 190 - 9}" width="18" height="18" fill="${C.mute}" transform="rotate(${dx * 25} ${1200 + dx * 190} ${410 + dy * 190})"/>` + arrow(`M${1200 + dx * 170} ${410 + dy * 170} L${1200 + dx * 85} ${410 + dy * 85}`, C.gold, 3)).join('')}
      ${T(1200, 250, '往里收 = 收敛（收拢）', 28, { fill: C.gold, w: 700 })}
      ${T(1200, 740, '把散了一地的人，重新收拢起来', 28)}</g>
    ${T(800, 840, '「你倾注在我们身内，但并不下坠，反而支撑我们；你并不涣散，反而收敛我们。」', 27, { fill: C.mute })}`,

  '03-3-按体积分吗': () => title('神是按体积分的吗？') + `
    <line x1="800" y1="170" x2="800" y2="720" stroke="${C.mute}" stroke-opacity=".4" stroke-width="2"/>
    <g>${T(400, 210, '✕ 错的想法：大的分得多', 34, { f: 'serif', w: 700, fill: C.red })}
      <rect x="160" y="300" width="300" height="230" rx="40" fill="none" stroke="${C.ink}" stroke-width="3"/><rect x="175" y="400" width="270" height="115" rx="28" fill="${C.glow}"/>${T(310, 365, '大象', 32)}
      <rect x="540" y="440" width="100" height="90" rx="22" fill="none" stroke="${C.ink}" stroke-width="3"/><rect x="552" y="505" width="76" height="15" rx="6" fill="${C.glow}"/>${T(590, 480, '麻雀', 24)}
      ${T(400, 600, '金色 = 分到的那一份神', 24, { fill: C.mute })}
      ${T(400, 690, '「大象比麻雀体积大，因之占有你的部分多」', 25)}${T(400, 730, '—— 卷七，奥古斯丁信主前的想法', 22, { fill: C.mute })}</g>
    <g>${T(1200, 210, '✓ 不论在哪里，便整个在哪里', 34, { f: 'serif', w: 700, fill: C.gold })}
      <ellipse cx="1200" cy="440" rx="370" ry="210" fill="url(#field)"/>
      <rect x="960" y="320" width="300" height="230" rx="40" fill="${C.bg}" fill-opacity=".6" stroke="${C.ink}" stroke-width="3"/>${T(1110, 445, '大象', 32)}
      <rect x="1340" y="440" width="100" height="90" rx="22" fill="${C.bg}" fill-opacity=".6" stroke="${C.ink}" stroke-width="3"/>${T(1390, 492, '麻雀', 24)}
      ${T(1200, 620, '两个都在整个的神面前', 26, { fill: C.gold })}
      ${T(1200, 690, '而没有一样东西能占有祂全部', 25)}${T(1200, 730, '（神没有“部分”，切不开，也分不了份）', 22, { fill: C.mute })}</g>
    ${T(800, 830, '大教会、小团契；大教堂、出租屋 —— 面对的都是完全的神', 30, { f: 'serif', w: 700 })}`,
};

const html = body => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css">
<style>html,body{margin:0;background:${C.bg}} svg{display:block} text[font-family=kai]{font-family:'LXGW WenKai','Noto Serif SC',serif} text[font-family=serif]{font-family:'Noto Serif SC',serif}</style></head>
<body><svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${defs}<rect width="1600" height="900" fill="${C.bg}"/>${body}<rect width="1600" height="900" fill="url(#vig)"/></svg></body></html>`;

const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
const only = process.argv.slice(2);
for (const [name, f] of Object.entries(FIGS)) {
  if (only.length && !only.some(o => name.startsWith(o))) continue;
  await page.setContent(html(f()), { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, type: 'png' }); console.log('wrote', name);
}
await browser.close();
