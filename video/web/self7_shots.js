// 本人录制 · 第五讲（卷一第四章下）：逐句换背景。c001 … 是讲稿 tts/s10.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方。名画铺满的那几场、整屏对照的那几场，背景层不放（self7.js 里按场景时间排除）。
window.SHOT_PLAN = `
c001:empyrean c004:study c005:portrait c006:portrait c009:portrait c011:conversion c013:empyrean c014:empyrean c019:study
c020:empyrean c021:study c027:prodigal c028:prodigal c029:prodigal c030:calf c031:calf c032:calf c033:calf c037:calf c038:prodigal
c039:david c040:david c041:david c042:david c046:prodigal c047:prodigal c054:empyrean c055:calvin c056:calvin c059:wanderer c060:wanderer
c061:mill c062:avenue c066:avenue c067:lamb c068:lamb c069:pentecost c072:fankuan c073:mill c074:paulprison c075:paulprison c076:rainy c077:avenue c078:avenue
c080:monk c081:monk c082:shepherd c086:shepherd c087:wanderer c088:empyrean c089:empyrean c090:empyrean c091:shepherd
c092:prodigal c093:prodigal c094:prodigal c095:bedroom c098:prodigal c099:prodigal c100:money c105:study c106:study c107:gleaners
c108:portrait c109:portrait c110:stpeter c113:stpeter c114:bedroom c118:prayer c119:paulprison c120:paulprison c122:prayer c123:study c125:luther c126:calvin c127:calvin
c128:empyrean c129:money c130:money c131:money c134:money c137:empyrean c138:empyrean c145:lamb c146:lamb
c147:empyrean c148:empyrean c149:empyrean c151:sea c152:sea c153:ninth c160:empyrean c166:starry c167:starry c168:starry
c169:cafe c170:cafe c171:tavern c172:tavern c177:mount c178:mount c179:empyrean c180:prayer c181:prayer c185:hands
c186:dawn c187:study c188:empyrean c190:study c191:study c193:portrait c194:conversion c195:conversion
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
