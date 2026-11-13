import { chromium, serve, openPage } from './lib.mjs';
const { server, port } = await serve();
async function run(label, nBrowsers, opts = {}) {
  const browsers = await Promise.all(Array.from({ length: nBrowsers }, () => chromium.launch(opts.launch || {})));
  const pages = await Promise.all(browsers.map(b => openPage(b, port, false, '?grain=static')));
  for (const p of pages) for (let s = 0; s < 39; s += 0.5) await p.evaluate(x => window.seek(x), s);
  const t0 = Date.now(); const n = 40; let seekMs = 0, shotMs = 0;
  await Promise.all(pages.map(async (p, w) => { for (let i = 0; i < n; i++) { const a = Date.now(); await p.evaluate(x => window.seek(x), 39 + (i * pages.length + w) / 60); const b = Date.now(); await p.screenshot({ type: opts.type || 'jpeg', ...(opts.type === 'png' ? {} : { quality: 97 }) }); seekMs += b - a; shotMs += Date.now() - b; } }));
  const el = (Date.now() - t0) / 1000;
  console.log(`${label}: ${(n * pages.length / el).toFixed(1)} fps total | per frame seek ${(seekMs / n / pages.length).toFixed(0)} ms, screenshot ${(shotMs / n / pages.length).toFixed(0)} ms`);
  await Promise.all(browsers.map(b => b.close()));
}
await run('1 browser, 1 page', 1);
await run('4 browsers', 4);
await run('4 browsers, gpu flags', 4, { launch: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } });
await run('3 browsers', 3);
server.close();
