// 本人录制 · 第四讲（卷一第四章上）：逐句换背景。c001 … 是讲稿 tts/s09.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方。名画铺满的那几场、整屏对照的那几场，背景层不放（self6.js 里按场景时间排除）。
window.SHOT_PLAN = `
c001:pitcher c002:empyrean c003:study c004:portrait c005:study c006:sea c011:portrait c014:study c015:geographer
c016:empyrean c018:empyrean c021:empyrean c022:starry c023:prayer c024:study
c025:portrait c026:study c027:philosopher c028:hands c029:study c033:portrait c034:portrait c035:monica_s
c043:moses c044:moses c045:moses c046:geographer c047:philosopher c049:pears c050:pears c051:creation c052:creation
c056:empyrean c057:portrait c058:shepherd c060:shepherd c061:fankuan c062:prodigal c063:mount c064:mount
c066:david c068:david c074:bible c075:bible c076:study c077:calvin c078:luther c079:melencolia c080:cafe
c081:empyrean c082:starry c083:empyrean c089:prayer c090:prayer c091:prayer
c099:lightworld c104:lightworld c105:lightworld c106:empyrean c107:money c108:money c109:money c110:money c111:money
c114:wanderer c115:wanderer c116:wanderer c117:prayer c118:prayer c119:conversion
c120:empyrean c121:starry c122:starry c123:mill c124:mill c127:study c128:empyrean c129:wanderer c130:dawn
c131:calf c132:calf c133:calf c134:rainy c135:creation c136:v_old c137:dawn
c145:vanitas c146:vanitas c147:creation c148:creation c149:creation c150:monk
c154:ninth c155:ninth c161:station c162:station c163:wanderer c164:monk c165:monk c166:monk c167:empyrean c168:empyrean
c169:stpeter c170:stpeter c172:creation c173:creation c174:empyrean c175:gleaners c176:gleaners
c177:creation c178:hands c179:hands c180:gleaners c183:angelus c184:avenue c185:avenue
c186:geographer c187:geographer c188:empyrean c189:empyrean c192:empyrean c193:fankuan c194:empyrean c195:prodigal
c201:dawn c202:dawn c203:portrait c204:bible c205:empyrean c206:conversion c207:hands c210:study c211:study c212:portrait c213:portrait c214:study
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
