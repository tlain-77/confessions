// 本人录制 · 第七讲（卷一第五章下）：逐句换背景。c001 … 是讲稿 tts/s12.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方。名画铺满的那几场，背景层不放（self9.js 里按场景时间排除）。
// 只用 img/focus.js 里有推近位置、img/blur、img/soft 里有底图的画（不然那一句会悄悄沿用上一幅）。
window.SHOT_PLAN = `
c001:restflight c005:sea c007:shepherd c008:dawn c014:study c017:carpaccio c023:tolle c027:heretics c028:portrait
c029:lightworld c032:melencolia c034:lightworld c035:v_child c041:empyrean c048:angelus c052:isle c057:empyrean c058:monk
c059:philosopher c062:portrait c064:milkmaid c066:geographer c069:avenue c070:sunrise c071:abbey c077:mill c081:rainy c084:paulprison
c087:vanitas c090:tavern c097:awaken c099:prayer c106:mount c111:hands c113:bible c117:brioche c119:sins c121:fathers
c130:david c133:study c140:paulathens c143:prayer c146:cafe c149:starry c153:david c157:g_baptism c162:lamb
c164:conversion c169:oldman c174:rainy c176:lightworld c178:ninth c181:snowstorm c187:dawn
c198:empyrean c199:portrait c201:lazarus c202:abbey c204:monk c207:awaken
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
