// 名画 2.5D：一幅画铺满整个画面（或右半 / 左半），镜头慢慢推向要讲的那一处；画里近的东西（人物）比远处（背景）挪得多一点，
// 看起来有前后、有纵深（“The Kid Stays in the Picture”式的视差）。深浅图用 tools/depth.py（Depth Anything V2）预先算好：web/img/depth/<画>.png。
// 写法：{ art: '画名', side: 'full' | 'right' | 'left', from: [cx, cy, 放大], to: [cx, cy, 放大], px: 视差（默认 0.022）, dz: 推近时的纵深（默认 0.05）, scrim: 'left' | 'right' | 'bottom' | 'none' }
//   cx、cy 是画上的位置（0–1，左上角是 0,0），放大 1 = 正好铺满那块区域；镜头在这一场里从 from 慢慢走到 to。
// 画用一个公用的 WebGL 画布画（WebGL 上下文有数量限制），画完拷到每幅画自己的 2D 画布上；逐帧定位时由页面的 tick 调 ART_TICK(t)。
(function () {
  const ARTS = []; let GL = null;
  const VS = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }';
  const FS = `precision highp float; varying vec2 v;
    uniform sampler2D uImg, uDep; uniform vec2 uC, uV, uS; uniform float uDz, uD0;
    void main(){
      vec2 base = uC + (v - .5) * 2. * uV, s = base;
      for (int i = 0; i < 3; i++) { float k = texture2D(uDep, s).r - uD0; s = base - uS * k; s = uC + (s - uC) / (1. + uDz * k); }
      gl_FragColor = texture2D(uImg, clamp(s, vec2(.0005), vec2(.9995)));
    }`;
  function initGL() {
    if (GL) return GL;
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
    const gl = c.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return (GL = { none: true });
    const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n);
    gl.uniform1i(U('uImg'), 0); gl.uniform1i(U('uDep'), 1);
    return (GL = { c, gl, uC: U('uC'), uV: U('uV'), uS: U('uS'), uDz: U('uDz'), uD0: U('uD0') });
  }
  const tex = (gl, im) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); return t; };
  const load = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('图没载上：' + src)); im.src = src; });

  // 搭一幅画：返回记录（lec.js 在排时间轴时填上这一场的起止 t0、t1）
  window.ART_ADD = (it, el) => {
    const side = it.side || 'full', W = side === 'full' ? 1920 : 960;
    el.className = 'art-host art-' + side;
    el.innerHTML = `<canvas width="${W}" height="1080"></canvas><div class="art-vig"></div>` + (it.scrim && it.scrim !== 'none' ? `<div class="art-scrim ${it.scrim}"></div>` : '');
    const r = { it, el, W, H: 1080, cv: el.querySelector('canvas'), t0: 0, t1: 1, ready: null };
    r.ctx = r.cv.getContext('2d');
    r.ready = Promise.all([load(`img/${it.art}.jpg`), load(`img/depth/${it.art}.png`)]).then(([im, dp]) => {
      r.im = im; r.dp = dp;
      const c = document.createElement('canvas'); c.width = dp.width; c.height = dp.height; const x = c.getContext('2d'); x.drawImage(dp, 0, 0);
      r.dd = x.getImageData(0, 0, dp.width, dp.height).data;              // 深浅图的像素（取镜头中心那一点的深浅，当“焦平面”）
    });
    ARTS.push(r); return r;
  };
  window.ART_LOAD = async () => {
    await Promise.all(ARTS.map(r => r.ready));
    const G = initGL(); if (G.none) return;
    for (const r of ARTS) { r.tImg = tex(G.gl, r.im); r.tDep = tex(G.gl, r.dp); }
  };
  const ease = p => p < 0 ? 0 : p > 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * p);
  const depthAt = (r, u, v) => { const w = r.dp.width, h = r.dp.height, x = Math.min(w - 1, Math.max(0, Math.round(u * (w - 1)))), y = Math.min(h - 1, Math.max(0, Math.round(v * (h - 1)))); return r.dd[(y * w + x) * 4] / 255; };
  function draw(r, t) {
    const G = GL, it = r.it, f = it.from || [0.5, 0.5, 1.08], to = it.to || f;
    const p = ease((t - r.t0) / Math.max(0.1, r.t1 - r.t0));
    let cx = f[0] + (to[0] - f[0]) * p, cy = f[1] + (to[1] - f[1]) * p; const z = f[2] + (to[2] - f[2]) * p;
    const A = r.W / r.H, a = r.im.width / r.im.height;
    const vx = a > A ? 0.5 * (A / a) / z : 0.5 / z, vy = a > A ? 0.5 / z : 0.5 * (a / A) / z;
    const m = 0.012; cx = Math.min(1 - vx - m, Math.max(vx + m, cx)); cy = Math.min(1 - vy - m, Math.max(vy + m, cy));
    if (G.none) {                                                              // 没有 WebGL：只做平移推近（没有视差）
      const sw = r.im.width * vx * 2, sh = r.im.height * vy * 2;
      r.ctx.drawImage(r.im, (cx - vx) * r.im.width, (cy - vy) * r.im.height, sw, sh, 0, 0, r.W, r.H); return;
    }
    let dx = to[0] - f[0], dy = to[1] - f[1]; const L = Math.hypot(dx, dy);
    if (L < 1e-4) { dx = 1; dy = 0; } else { dx /= L; dy /= L; }
    const px = (it.px ?? 0.022) * (p - 0.5) * 2;                              // 镜头从一边移到另一边：近的东西比远的多挪这么多（相对画面宽）
    const gl = G.gl; gl.viewport(0, 0, r.W, r.H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.tImg); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.tDep);
    gl.uniform2f(G.uC, cx, cy); gl.uniform2f(G.uV, vx, vy); gl.uniform2f(G.uS, dx * px * vx * 2, dy * px * vy * 2);
    gl.uniform1f(G.uDz, (it.dz ?? 0.05) * p); gl.uniform1f(G.uD0, it.d0 ?? depthAt(r, cx, cy));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    r.ctx.drawImage(G.c, 0, 0, r.W, r.H, 0, 0, r.W, r.H);
  }
  window.ART_TICK = t => { for (const r of ARTS) if (r.im && t >= r.t0 - 0.9 && t <= r.t1 + 0.3) draw(r, t); };
})();
