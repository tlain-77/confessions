// 本人录制 · 奥古斯丁这个人：逐句换背景（跟 03 一样）。
// c001 … 是讲稿里的句子；"c007+" 是这一句后面临场多说的话（有字幕、讲稿里没有）用的画。
// 没写的句子沿用上一幅，但镜头推近到画上别的地方，所以每一句画面都会动一次。
window.SHOT_PLAN = `
c001:birth c002:empire c003:gleaners c004:oldman c005:monica_s c007:g_school c007+:cicero,claudius
c008:g_school c009:money c010:v_youth c011:tavern
c012:pears c013:pears c015:study c016:philosopher c017:beggar c018:pears c019:melencolia c019+:pears
c020:expulsion c021:rebuke c022:philosopher c023:tavern c024:melencolia c025:narcissus c026:sins
c027:g_carthage c028:dido c029:kiss c030:awaken c032:isle c034:cicero c035:bible c037:cicero
c040:heretics c042:rebels c043:pharisee c044:narcissus c045:sins c046:rainy c047:station c048:cafe c049:mill c050:melencolia
c051:monica_s c052:hands c054:fathers c056:hands c057:fathers c058:monica_l
c059:rome c060:g_leaving c061:port c062:sea c066:monica_l c067:sea c068:prodigal c069:g_ostia,sermon c070:hands c073:monica_l
c074:g_milan c075:empire,claudius c076:g_rome c077:oldman c078:melencolia c079:claudius c081:pollice
c082:beggar c083:tavern c084:melencolia c085:babel c086:tavern c087:icarus c088:tavern c089:vanitas c090:melencolia c091:station
c092:monica_s c093:money c095:isle c096:port c097:isle c098:philosopher c099:sins c100:portrait
c101:sermon c104:dewitte c105:sermon c106:philosopher c107:lightworld c108:melencolia c109:hands
c110:bedroom c113:jacob c114:study
c115:antony,claudius c116:jacob c117:conversion c118:gleaners c119:athens c120:conversion c122:hands c123:portrait c124:conversion
c128:tolle,bible c129:tolle c130:lightworld c131:conversion
c132:avenue c133:g_baptism c134:monica_l c135:g_monica c136:monica_l c137:empyrean c138:abbey c139:wanderer c140:dewitte
c141:carthage2 c143:dewitte c144:mount c145:vesting c146:portrait c148:g_hippo
`;
window.SHOT_FB = { g_school: 'v_child', g_rome: 'claudius', g_milan: 'claudius', tolle: 'conversion', g_baptism: 'vesting', g_monica: 'monica_l',
  carpaccio: 'study', luther: 'study', theses: 'study', calvin: 'study', empire: 'claudius', rome: 'claudius', antony: 'monk',
  kiss: 'v_youth', port: 'sea', carthage2: 'dido', fa_conv: 'conversion', birth: 'v_child', pharisee: 'narcissus', theses: 'luther_monk', calvin: 'study' };
window.SHOTS = tl => runShots(tl, window.EP2, window.SHOT_PLAN, { prefer: true, fallback: window.SHOT_FB, gap: 4, long: 6 });
