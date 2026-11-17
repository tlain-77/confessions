// Render the animation to frames, then encode with the soundtrack.
// node render.mjs [--fps 60] [--from 0] [--to <sec>] [--workers 4] [--audio out/sample_mix.wav] [--out out/sample.mp4]
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import { chromium, serve, openPage } from './lib.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fps = +arg('fps', 60), workers = +arg('workers', 4), audio = arg('audio', 'out/sample_mix.wav'), out = arg('out', 'out/sample.mp4'), crf = arg('crf', '17');
const dir = process.env.FRAMES_DIR || 'out/frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });   // FRAMES_DIR：同时跑两个渲染时各用各的帧目录
const { server, port } = await serve(); const browser = await chromium.launch();   // one browser per worker below: screenshots don't parallelize inside one
const query = arg('query', '');
const probe = await openPage(browser, port, true, query); const dur = await probe.evaluate('window.DURATION'); await probe.close();
const from = +arg('from', 0), to = +arg('to', dur);
const f0 = Math.round(from * fps), f1 = Math.round(to * fps), total = f1 - f0;
console.log(`rendering ${total} frames (${from}s → ${to.toFixed(2)}s) at ${fps} fps with ${workers} workers`);
const t0 = Date.now(); let done = 0;
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const b = await chromium.launch(); const page = await openPage(b, port, false, query);
  for (let s = 0; s < from; s += 0.25) await page.evaluate(x => window.seek(x), s);        // walk up to the start, like real playback
  for (let f = f0 + w; f < f1; f += workers) {
    await page.evaluate(x => window.seek(x), f / fps);
    await page.screenshot({ path: `${dir}/f_${String(f - f0).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 97 });
    if (++done % 300 === 0) console.log(`  ${done}/${total}  ${(done / ((Date.now() - t0) / 1000)).toFixed(1)} fps`);
  }
  await b.close();
}));
await browser.close(); server.close();
console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s — encoding`);
const a = fs.existsSync(audio) ? ['-ss', String(from), '-t', String(to - from), '-i', audio] : [];
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', `${dir}/f_%06d.jpg`, ...a,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-x264-params', 'aq-mode=3:aq-strength=1.1:deblock=-1,-1',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', ...(a.length ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
