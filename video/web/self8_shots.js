// 本人录制 · 第六讲（卷一第五章上）：逐句换背景。c001 … 是讲稿 tts/s11.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方。名画铺满的那几场、整屏对照的那几场，背景层不放（self8.js 里按场景时间排除）。
window.SHOT_PLAN = `
c001:empyrean c004:prayer c006:hands c007:sea c008:portrait c011:empyrean c022:prayer c023:study
c024:nativity c029:cassatt c032:wanderer c034:restflight c038:sermon c041:tavern c046:pentecost c050:rainy c053:dawn
c057:pearl c062:empyrean c066:portrait c071:money c074:avenue c079:monk c080:prayer c086:conversion
c091:portrait c095:study c101:cophetua c105:sermon c110:kiss c116:arnolfini c125:ninth c129:sea c134:oak c137:doctor
c140:creation c146:prodigal c152:lamb c157:shepherd c163:prodigal2 c169:samuel c178:bible c185:starry c191:paulathens
c194:lightworld c196:shepherd c198:sunrise c203:paulprison c207:creation c211:restflight c214:empyrean c220:monk c223:portrait
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
