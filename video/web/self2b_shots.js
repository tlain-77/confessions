// 本人录制 · 他为什么这样写：逐句换背景（跟 03 一样）。写法见 self2a_shots.js。
window.SHOT_PLAN = `
c001:carpaccio c002:portrait c003:g_hippo c004:paulathens c005:heretics,awaken c006:pharisee c007:philosopher c008:geographer c008+:geographer c009+:prodigal
c010:study c011:hands c012:empyrean c013:pears,awaken c014:hands,port c015:portrait c016:philosopher c017:narcissus,claudius c018:creation c019:hands
c020:study c021:prodigal c023:carpaccio c024:conversion c025:portrait c026:jacob
c027:tavern c028:david c029:avenue c030:claudius c031:narcissus c032:pharisee c033:portrait c035:prodigal c036:melencolia
c037:g_baptism c038:sermon
c040:athens c041:rainy c042:philosopher c043:melencolia c044:station c046:doctor c047:rainy c048:cafe c049:mill c050:rainy
c051:station,monk c052:wanderer c053:bible c054:narcissus c055:philosopher c056:portrait c057:sins c058:narcissus
c059:geographer c061:babel c062:sins c063:claudius c064:money c065:expulsion c066:melencolia c067:monk c068:vanitas
c069:study c070:temeraire c072:v_child c073:isle c074:rebels c075:v_old c076:lightworld c077:sea c078:port c079:monica_l c080:beggar,sermon c081:avenue
c084:melencolia c085:philosopher c086:prodigal c088:pharisee c089:oldman c090:monk c091:hands c092:bible c093:lightworld
c094:luther c095:luther_monk c096:calvin c097:jacob,conversion c098:fathers
c099:bible c101:study c103:angler c105:carpaccio c106:station c107:philosopher
`;
window.SHOT_FB = { g_school: 'v_child', g_rome: 'claudius', g_milan: 'claudius', tolle: 'conversion', g_baptism: 'vesting', g_monica: 'monica_l',
  carpaccio: 'study', luther: 'study', theses: 'study', calvin: 'study', empire: 'claudius', rome: 'claudius', antony: 'monk',
  kiss: 'v_youth', port: 'sea', carthage2: 'dido', fa_conv: 'conversion', birth: 'v_child', pharisee: 'narcissus', theses: 'luther_monk', calvin: 'study' };
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, fallback: window.SHOT_FB, gap: 4, long: 6 });
