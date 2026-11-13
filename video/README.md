# 《忏悔录》逐句精读 · 视频工程

画面是一个可按时间定位的网页动画（`web/`），由无头浏览器逐帧截图，再用 ffmpeg 配上声音合成 MP4。画面节奏跟着旁白的时间轴走。

## 流程

```bash
npm install                                             # 动画库和字体
# 旁白：本地合成（模型放在 models/，不上传任何文字到外部服务）
python3 tts/synth.py tts/s01.json kokoro 68 1.08        # → out/voice_kokoro68.wav + out/timeline_kokoro68.json
python3 tts/asr_check.py out/timeline_kokoro68.json tts/s01.json   # 用语音识别反查读音
python3 build_timeline.py out/timeline_kokoro68.json    # → web/timeline.js
python3 audio/mix.py out/timeline_kokoro68.json out/voice_kokoro68.wav out/sample_mix.wav   # 旁白 + 合成的氛围垫音
node render.mjs --fps 60 --out out/sample.mp4           # 渲染 + 编码
```

## 文件

- `tts/s01.json` 这一段的旁白分句（`sub` 是字幕，`say` 是给语音合成读的写法，`gap` 是句后停顿）
- `web/index.html` `web/style.css` 各分镜的元素和版式
- `web/scenes.js` 分镜动画时间轴（GSAP），`window.seek(t)` 可渲染任意时刻
- `web/bg.js` 背景：光束、浮尘、颗粒
- `shot.mjs` `sheet.py` 抽帧检查用
- 实时预览：起一个静态服务后打开 `web/index.html?play`，点击画面播放
