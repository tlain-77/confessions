// Shared: static file server + headless page that can seek the animation.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node-tools/node_modules/');
export const { chromium } = require('playwright');
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wav': 'audio/wav', '.json': 'application/json' };
export function serve(port = 0) {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'max-age=3600' }); fs.createReadStream(p).pipe(rsp);
    }).listen(port, '127.0.0.1', () => res({ server: s, port: s.address().port }));
  });
}
export async function openPage(browser, port, log = false, query = '', pageName = process.env.PAGE || 'index.html') {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  if (log) page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.type(), m.text()); });
  await page.goto(`http://127.0.0.1:${port}/web/${pageName}${query}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  return page;
}
