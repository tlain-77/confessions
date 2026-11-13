// Background: a shaft of warm light in a dark room, with drifting dust.
// Everything here is a pure function of time t (seconds) and the BG parameters,
// so any frame can be rendered independently and identically.
(function () {
  const W = 1920, H = 1080;
  const bg = document.getElementById('bg'), fg = document.getElementById('fg');
  const ctx = bg.getContext('2d'), fctx = fg.getContext('2d');

  // parameters animated by the timeline
  const BG = window.BG = { light: 0.1, rays: 0, fx: 960, fy: -160, warm: 1, dust: 1, bloom: 0, bx: 960, by: 520 };

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(20261112);

  // low-res buffer for light and rays: upscaling gives a soft, band-free glow cheaply
  const LW = 480, LH = 270, lc = document.createElement('canvas'); lc.width = LW; lc.height = LH; const l = lc.getContext('2d');

  // soft disc sprites at a few blur levels
  function sprite(size, hard) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    const r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,236,196,1)'); gr.addColorStop(hard, 'rgba(255,226,170,.85)'); gr.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
  }
  const SP_SHARP = sprite(32, 0.25), SP_SOFT = sprite(96, 0.05), SP_BOKEH = sprite(256, 0.55);

  const dust = [];
  for (let i = 0; i < 170; i++) {
    const z = rnd();                       // 0 far … 1 near
    dust.push({ x: rnd() * W, y: rnd() * H, z, vx: (rnd() - 0.5) * 9, vy: -(4 + rnd() * 13) * (0.4 + z),
      ax: 14 + rnd() * 30, fx: 0.12 + rnd() * 0.25, px: rnd() * 6.28, ay: 8 + rnd() * 16, fy: 0.1 + rnd() * 0.2, py: rnd() * 6.28,
      r: 1 + z * 2.6, tw: 0.4 + rnd() * 1.3, tp: rnd() * 6.28, a: 0.25 + rnd() * 0.6 });
  }
  const bokeh = [];
  for (let i = 0; i < 16; i++) {
    bokeh.push({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 16, vy: -(6 + rnd() * 14), ax: 30 + rnd() * 50, fx: 0.07 + rnd() * 0.1, px: rnd() * 6.28,
      r: 40 + rnd() * 90, a: 0.03 + rnd() * 0.05, tw: 0.2 + rnd() * 0.4, tp: rnd() * 6.28 });
  }
  const rays = [];
  for (let i = 0; i < 9; i++) rays.push({ ang: -0.62 + i * 0.155 + (rnd() - 0.5) * 0.05, w: 0.035 + rnd() * 0.06, sw: 0.02 + rnd() * 0.03, f: 0.05 + rnd() * 0.09, p: rnd() * 6.28, a: 0.35 + rnd() * 0.65 });

  const wrap = (v, m) => ((v % m) + m) % m;

  window.drawBg = function (t) {
    const s = LW / W, fx = BG.fx * s, fy = BG.fy * s, L = BG.light;
    // --- light buffer ---
    l.globalCompositeOperation = 'source-over';
    const base = l.createLinearGradient(0, 0, 0, LH);
    base.addColorStop(0, '#0b0d14'); base.addColorStop(0.55, '#07080d'); base.addColorStop(1, '#040407');
    l.fillStyle = base; l.fillRect(0, 0, LW, LH);
    l.globalCompositeOperation = 'lighter';
    // breathing main glow
    const br = 1 + 0.04 * Math.sin(t * 0.5) + 0.025 * Math.sin(t * 0.83 + 1.3);
    let g = l.createRadialGradient(fx, fy, 0, fx, fy, 330 * br);
    g.addColorStop(0, `rgba(255,222,160,${0.62 * L})`); g.addColorStop(0.28, `rgba(214,160,92,${0.3 * L})`);
    g.addColorStop(0.62, `rgba(120,84,60,${0.11 * L})`); g.addColorStop(1, 'rgba(40,30,40,0)');
    l.fillStyle = g; l.fillRect(0, 0, LW, LH);
    // cool counter-glow from below keeps the blacks from going flat
    g = l.createRadialGradient(LW * 0.5, LH * 1.25, 0, LW * 0.5, LH * 1.25, 260);
    g.addColorStop(0, `rgba(40,58,96,${0.2 + 0.12 * L})`); g.addColorStop(1, 'rgba(20,30,60,0)');
    l.fillStyle = g; l.fillRect(0, 0, LW, LH);
    // rays
    if (BG.rays > 0.001) {
      for (const r of rays) {
        const a = r.ang + r.sw * Math.sin(t * r.f + r.p), hw = r.w * (1 + 0.25 * Math.sin(t * r.f * 1.7 + r.p * 2));
        const len = 420, dx = Math.sin(a), dy = Math.cos(a);
        const x2 = fx + dx * len, y2 = fy + dy * len;
        const gr = l.createLinearGradient(fx, fy, x2, y2);
        const al = 0.2 * BG.rays * r.a * (0.75 + 0.25 * Math.sin(t * r.f * 2.3 + r.p));
        gr.addColorStop(0, `rgba(255,226,168,${al})`); gr.addColorStop(0.5, `rgba(230,180,110,${al * 0.45})`); gr.addColorStop(1, 'rgba(200,150,90,0)');
        l.fillStyle = gr; l.beginPath(); l.moveTo(fx, fy);
        l.lineTo(fx + Math.sin(a - hw) * len, fy + Math.cos(a - hw) * len); l.lineTo(fx + Math.sin(a + hw) * len, fy + Math.cos(a + hw) * len); l.closePath(); l.fill();
      }
    }
    // bloom (used for reveals and scene changes)
    if (BG.bloom > 0.001) {
      const bx = BG.bx * s, by = BG.by * s;
      g = l.createRadialGradient(bx, by, 0, bx, by, 300);
      g.addColorStop(0, `rgba(255,232,180,${0.55 * BG.bloom})`); g.addColorStop(0.4, `rgba(236,180,104,${0.22 * BG.bloom})`); g.addColorStop(1, 'rgba(160,110,60,0)');
      l.fillStyle = g; l.fillRect(0, 0, LW, LH);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(lc, 0, 0, W, H);

    // --- dust behind the type ---
    ctx.globalCompositeOperation = 'lighter';
    for (const d of dust) {
      const x = wrap(d.x + d.vx * t + d.ax * Math.sin(t * d.fx + d.px), W + 80) - 40;
      const y = wrap(d.y + d.vy * t + d.ay * Math.sin(t * d.fy + d.py), H + 80) - 40;
      // dust is only visible where light falls on it
      const dist = Math.hypot(x - BG.fx, y - BG.fy), lit = Math.max(0, 1 - dist / 1500);
      const bd = BG.bloom > 0 ? Math.max(0, 1 - Math.hypot(x - BG.bx, y - BG.by) / 700) * BG.bloom : 0;
      const tw = 0.6 + 0.4 * Math.sin(t * d.tw + d.tp);
      const a = d.a * tw * (0.1 + 0.9 * lit * lit) * (0.3 + 0.9 * L + 0.8 * bd) * BG.dust;
      if (a < 0.004) continue;
      ctx.globalAlpha = Math.min(1, a);
      const focus = Math.abs(d.z - 0.45);              // depth of field: mid-depth is sharp
      if (focus < 0.22) { const r = d.r * 2.2; ctx.drawImage(SP_SHARP, x - r, y - r, r * 2, r * 2); }
      else { const r = d.r * (3 + focus * 16); ctx.globalAlpha = Math.min(1, a * 0.4); ctx.drawImage(SP_SOFT, x - r, y - r, r * 2, r * 2); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // --- big out-of-focus motes in front of the type ---
    fctx.clearRect(0, 0, W, H); fctx.globalCompositeOperation = 'lighter';
    for (const b of bokeh) {
      const x = wrap(b.x + b.vx * t + b.ax * Math.sin(t * b.fx + b.px), W + 400) - 200;
      const y = wrap(b.y + b.vy * t, H + 400) - 200;
      const lit = Math.max(0, 1 - Math.hypot(x - BG.fx, y - BG.fy) / 1700);
      fctx.globalAlpha = b.a * (0.25 + 0.75 * lit) * (0.35 + 0.8 * L) * (0.7 + 0.3 * Math.sin(t * b.tw + b.tp)) * BG.dust;
      fctx.drawImage(SP_BOKEH, x - b.r, y - b.r, b.r * 2, b.r * 2);
    }
    fctx.globalAlpha = 1;
  };

  // film grain: a fixed noise tile, shifted every frame (also dithers the dark gradients against banding)
  (function () {
    const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
    const img = g.createImageData(n, n), r2 = mulberry32(777);
    for (let i = 0; i < n * n; i++) { const v = 128 + (r2() + r2() + r2() - 1.5) * 110; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    const el = document.getElementById('grain'); el.style.backgroundImage = `url(${c.toDataURL()})`;
    const q = new URLSearchParams(location.search), mode = q.get('grain') || 'static';
    if (q.get('go')) el.style.opacity = q.get('go');
    if (mode === 'off') el.style.display = 'none';
    window.drawGrain = function (t) {
      if (mode !== 'anim') return;
      const f = Math.floor(t * 30), h = Math.imul(f + 1, 2654435761) >>> 0;
      el.style.backgroundPosition = `${h % 251}px ${(h >>> 8) % 241}px`;
    };
  })();
})();
