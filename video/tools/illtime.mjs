// 图解、配画出来以后，在这一场里能完整看多久：每一项（图标、画）从说到它、画完，到这一场开始淡出，中间剩几秒。
// 太短的（默认 < 2.2 秒）列出来：要么把这一场往后延，要么让它早一点出来。
// 用法：PAGE=self5.html DATA=EPD node tools/illtime.mjs [门槛秒数]
import { chromium, serve, openPage } from '../lib.mjs';
const MIN = +(process.argv[2] || 2.2);
const { server, port } = await serve(); const browser = await chromium.launch();
const page = await openPage(browser, port, false);
const rows = await page.evaluate(([DATA, MIN]) => {
  const D = window[DATA], LEC = window.LEC, T = window.LEC_TIMES;
  const AT = a => typeof a === 'number' ? a : Array.isArray(a) ? atP(D, a[0], a[1]) : a && typeof a === 'object' ? atP(D, a.p, a.n || 0) + (a.d || 0) : atP(D, a);
  const out = [];
  LEC.forEach((sc, i) => {
    const [a, nx] = T[i], fade = nx - 0.1 - 0.6;
    (sc.items || []).forEach((it, k) => {
      const pts = [];
      if (it.ill) (it.items || []).forEach(x => { const o = Array.isArray(x) ? { i: x[0], lab: x[1], at: x[2], ...(x[3] || {}) } : x; pts.push([o.lab || o.i, AT(o.at) + 0.95]); if (o.sat !== undefined) pts.push([o.sub, AT(o.sat) + 0.6]); });
      if (it.pics) it.pics.forEach(p => pts.push([p[1] || p[0], AT(p[2]) + 1.0]));
      if (it.pic) pts.push([it.cap || it.pic, AT(it.at) + 1.1]);
      for (const [lab, done] of pts) if (fade - done < MIN) out.push({ i, sc: (typeof sc.at === 'string' ? sc.at : JSON.stringify(sc.at)).slice(0, 14), lab, left: +(fade - done).toFixed(2), next: +nx.toFixed(2) });
    });
  });
  return out;
}, [process.env.DATA || 'EPD', MIN]);
for (const r of rows) console.log(`场 ${r.i}  ${r.sc.padEnd(14)}  「${r.lab}」 画完后只剩 ${r.left}s（下一场 ${r.next}s 开始）`);
console.log(rows.length, '处');
await browser.close(); server.close();
