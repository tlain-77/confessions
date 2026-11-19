// 本人录制 · 第二讲（卷一第二章）：逐句换背景（跟 03 一样）。c001 … 是讲稿 tts/s07.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方，所以每一句画面都会动一次。
window.SHOT_PLAN = `
c001:study c003:hands c006:dewitte c007:hands c008:annunc c009:angelus c012:philosopher c013:bible
c014:geographer c015:starry c016:wanderer c017:monk c018:cafe c020:mill c021:rainy c022:pears c023:narcissus c026:awaken
c027:monk c028:portrait c030:study c032:melencolia
c033:carpaccio c034:conversion c037:portrait c039:hands c041:angelus c042:philosopher c045:starry c046:study c048:fathers c049:hands
c050:bedroom c053:empyrean c054:bedroom c055:sea c056:rainy c057:bedroom c058:tavern c059:beggar c060:study c061:vanitas c062:melencolia c064:carpaccio
c065:nativity c066:nativity c067:restflight c068:nativity c069:bedroom c071:melencolia
c072:hands c073:portrait c076:mount c077:lazarus c079:fankuan c082:pharisee c086:hands c087:mount c089:hands
c090:empyrean c091:fankuan c092:starry c095:creation c097:dewitte c100:empyrean c101:dewitte c102:portrait c104:philosopher
c105:study c106:philosopher c109:melencolia c111:empyrean c112:philosopher c113:pears c115:creation c117:david c119:angels c120:david c122:angels
c123:creation c124:gleaners c125:fankuan c126:creation c128:carpaccio
c130:portrait c132:geographer c134:oldman c136:creation c137:empyrean c138:paulathens c139:dewitte c141:geographer c142:portrait c143:dawn
c144:vanitas c145:dawn c146:sunset c147:geographer c148:creation c149:monk c150:philosopher c153:hands
c155:isle c157:wanderer c158:snowstorm c159:empyrean c160:rebels c161:isle c163:empyrean c164:ninth c165:ninth c166:prodigal c168:philosopher c169:sins c170:lamb c171:study
c172:portrait c174:study c175:v_old c176:vanitas c177:gleaners c179:david c180:angels c181:creation c182:empyrean c184:isle c186:monk c188:hands c189:lazarus c190:dawn c191:melencolia
c192:carpaccio c194:lamb c197:conversion c199:study c201:philosopher c204:empyrean c206:starry c207:creation c208:study c210:monk c211:narcissus
c212:portrait c213:fankuan c214:empyrean c215:geographer c217:prodigal c219:creation
c221:hands c223:athens c224:hands c226:portrait c227:lamb c228:paulprison c229:empyrean c231:angels c233:paulprison c234:carpaccio c236:study c238:hands c239:lamb c240:bible
c241:portrait c243:philosopher c244:monk c245:wanderer c247:study c248:creation c251:starry c252:paulathens c254:prodigal c257:mount c259:narcissus c261:hands
c264:conversion c265:tolle c266:conversion c268:portrait c269:wanderer c271:rainy c272:bedroom c274:dawn c275:hands c276:sunset c277:bedroom c278:awaken
c279:vanitas c280:narcissus c281:lightworld c282:paulathens c283:hands c284:awaken c285:conversion c287:dawn c288:melencolia
c289:empyrean c290:starry c292:wanderer c293:fankuan c295:icarus c297:creation c298:empyrean
c299:study c300:dawn c302:prodigal c303:lightworld c304:philosopher c305:monk c306:hands c307:dawn c309:carpaccio c310:pears c311:vanitas
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
