// 本人录制 · 第三讲（卷一第三章）：逐句换背景。c001 … 是讲稿 tts/s08.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方，所以每一句画面都会动一次。一句里有两幅（逗号隔开）就在句中停顿处切换。
window.SHOT_PLAN = `
c001:study c002:starry c003:creation c004:hands c005:empyrean c006:portrait c007:philosopher c008:geographer c009:wanderer c010:dawn,sea
c011:study c012:portrait c013:calf c014:narcissus c015:moses c016:study c017:empyrean c018:portrait c019:philosopher c020:starry
c021:milkmaid c022:milkmaid c023:starry c024:wanderer c025:empyrean c026:sea c027:philosopher c028:milkmaid c029:ninth c030:monk
c031:portrait c032:study c033:philosopher c034:melencolia c035:empyrean c036:milkmaid c037:portrait c038:avenue
c039:creation c040:empyrean c041:starry c042:study c043:milkmaid c044:empyrean c045:creation c046:paulprison c047:bible
c048:babel c049:babel c050:babel c051:wanderer c052:portrait c053:study
c054:pitcher c055:study c056:hands c057:portrait c058:pitcher c059:philosopher c060:v_old c061:doctor c062:rainy c063:lightworld c064:dawn
c065:paulprison c066:paulathens c067:vanitas c068:snowstorm c069:vanitas c070:vanitas c071:hands c072:shepherd c073:rainy
c074:pentecost c075:milkmaid c076:pentecost c077:icarus c078:sea c079:ladder c080:bible c081:lazarus c082:creation c083:hands
c084:study c085:study c086:prodigal c087:portrait c088:vanitas c089:sins,athens c090:prodigal c091:empyrean c092:money c093:tavern c094:sins c095:prodigal
c096:empyrean c097:study c098:starry c099:philosopher c100:geographer c101:study c102:portrait c103:gleaners c104:elephant c105:lightworld c106:avenue
c107:empyrean c108:brioche c109:brioche c110:monk c111:sea c112:wanderer
c113:empyrean c114:elephant c115:elephant c116:gleaners c117:portrait c118:conversion c119:elephant,goldfinch c120:empyrean
c121:elephant,goldfinch c122:goldfinch c123:stpeter c124:stpeter,bedroom c125:dewitte c126:pharisee c127:stpeter,prayer
c128:portrait c129:calf c130:calf c131:empyrean c132:lightworld c133:starry c134:starry c135:portrait c136:wanderer
c137:empyrean c138:lightworld c139:dawn c140:creation c141:prayer,doctor c142:prayer,doctor c143:starry c144:stpeter,starry
c145:philosopher c146:money c147:bedroom c148:hands c149:lightworld
c150:monica_s c151:monica_l c152:jdream c153:study c154:shepherd c155:philosopher c156:brioche c157:shepherd c158:hands c159:angelus c160:rainy
c161:study c162:creation c163:pitcher,prodigal c164:stpeter c165:stpeter,bedroom c166:philosopher c167:melencolia c168:pharisee c169:hands
c170:prayer,lightworld c171:dawn c172:empyrean c173:empyrean c174:dawn
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
