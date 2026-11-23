// Render the animation to frames, then encode with the soundtrack.
// node render.mjs [--fps 60] [--from 0] [--to <sec>] [--workers 4] [--audio out/sample_mix.wav] [--out out/sample.mp4]
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import { chromium, serve, openPage } from './lib.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 60), workers = +arg('workers', 4), audio = arg('audio', 'out/sample_mix.wav'), out = arg('out', 'out/sample.mp4'), crf = arg('crf', '17'), preset = arg('preset', 'slow');
const dir = process.env.FRAMES_DIR || 'out/frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });   // FRAMES_DIR：同时跑两个渲染时各用各的帧目录
const { server, port } = await serve(); const browser = await chromium.launch();   // one browser per worker below: screenshots don't parallelize inside one
const query = arg('query', '');
const probe = await openPage(browser, port, true, query); const dur = await probe.evaluate('window.DURATION'); await probe.close();
const from = +arg('from', 0), to = +arg('to', dur);
const f0 = Math.round(from * fps), f1 = Math.round(to * fps), total = f1 - f0;
console.log(`rendering ${total} frames (${from}s → ${to.toFixed(2)}s) at ${fps} fps with ${workers} workers`);
const t0 = Date.now(); let done = 0;
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  // 浏览器偶尔截图失败或崩掉（页面重、四个一起跑时）：截图失败就等一下重试；崩了就重开一个，从头走到当前时刻再接着截
  const open1 = async upto => { const b = await chromium.launch({ args: (process.env.CHROME_ARGS || '').split(' ').filter(Boolean) }); const page = await openPage(b, port, false, query);
    try { for (let s = 0; s < upto; s += +(process.env.WALK_STEP || 0.5)) await page.evaluate(x => { window.__WALK = 1; window.seek(x); }, s); await page.evaluate(() => { window.__WALK = 0; }); }   // walk up to the start, like real playback（走的时候名画不画）
    catch (e) { try { await b.close(); } catch {} throw e; }
    return { b, page }; };
  const open = async upto => { for (let k = 0; ; k++) { try { return await open1(upto); } catch (e) { if (k >= 4) throw e; console.log(`  worker ${w}: reopen failed (${String(e.message).split('\n')[0].slice(0, 60)}), retry ${k + 1}`); await new Promise(r => setTimeout(r, 3000)); } } };
  let { b, page } = await open(from); let last = 0;
  for (let f = f0 + w; f < f1; f += workers) {
    for (let k = 0; ; k++) {
      try {
        await page.evaluate(x => window.seek(x), f / fps);
        let buf = await page.screenshot({ type: 'jpeg', quality: 97 });
        // 机器忙的时候偶尔截到一帧全黑（合成器没画好）：比这个 worker 上一帧小得多（黑帧压出来只有几 KB），等一下、重新定位再截，最多两次
        for (let k2 = 0; k2 < 3 && last && buf.length < last * 0.3; k2++) {
          console.log(`  worker ${w}: frame ${f} looks blank (${buf.length} vs ${last} bytes), retake`);
          if (k2 === 2) { try { await b.close(); } catch {} ({ b, page } = await open(f / fps - 0.25)); }   // 两次都一样：这个浏览器多半坏了，重开一个再截一次（还是暗，就当它本来就暗）
          else await new Promise(r => setTimeout(r, 800));
          await page.evaluate(x => window.seek(x), f / fps);
          const b2 = await page.screenshot({ type: 'jpeg', quality: 97 }); if (b2.length > buf.length) buf = b2;
        }
        fs.writeFileSync(`${dir}/f_${String(f - f0).padStart(6, '0')}.jpg`, buf); last = buf.length;
        break;
      } catch (e) {
        if (k >= 5) throw e;
        console.log(`  worker ${w}: frame ${f} failed (${String(e.message).split('\n')[0].slice(0, 80)}), retry ${k + 1}`);
        if (/crash|closed|Target/i.test(String(e.message))) { try { await b.close(); } catch {} ({ b, page } = await open(f / fps - 0.25)); }
        else await new Promise(r => setTimeout(r, 1500));
      }
    }
    if (++done % 300 === 0) console.log(`  ${done}/${total}  ${(done / ((Date.now() - t0) / 1000)).toFixed(1)} fps`);
  }
  await b.close();
}));
await browser.close(); server.close();
console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s — encoding`);
const a = fs.existsSync(audio) ? ['-ss', String(from), '-t', String(to - from), '-i', audio] : [];
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', `${dir}/f_%06d.jpg`, ...a,
  '-c:v', 'libx264', '-preset', preset, '-crf', crf, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3:aq-strength=1.1:deblock=-1,-1',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', ...(a.length ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
