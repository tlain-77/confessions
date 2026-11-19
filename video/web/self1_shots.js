// 本人录制 · 第一讲开头：逐句换背景（跟 03 一样）。
// 这一页没有讲稿句子，按字幕一句一句排：s001 是第 1 句字幕。写了画的句子换这幅画，
// 没写的沿用上一幅，但镜头推近到画上别的地方，所以每一句画面都会动一次。
window.SHOT_PLAN = `
s001:hands s003:tavern s005:portrait s007:v_youth s008:study s009:portrait
s010:bible s012:hands s014:philosopher s015:fathers s016:carpaccio s017:v_youth s018:hands
s020:doctor s022:tavern s023:study s024:philosopher s025:narcissus s026:angelus s027:bible s028:cafe
s030:study s031:dawn s032:bible s034:wanderer
s035:babel s037:v_child s039:g_school s040:kiss s041:v_youth s042:money s043:kiss s044:v_old s045:oldman
s046:v_man s047:philosopher s049:gleaners s050:money s053:rainy s055:mill s056:melencolia s057:vanitas s059:monk
s060:v_child s062:temeraire s064:wanderer s065:snowstorm s067:ninth s068:station
s072:babel s073:v_old s074:icarus s075:fankuan s077:wanderer s078:bible s079:lightworld s080:study
s081:portrait s082:claudius s083:narcissus s084:pharisee s086:portrait s087:port s088:pears
s090:bible s091:rainy s092:sins s093:philosopher s094:athens
s096:study s098:philosopher s099:carpaccio s100:bible s102:dido s103:empyrean s105:lamb
s106:study s107:monk s108:hands s109:philosopher s111:jacob s112:creation s114:vanitas s115:melencolia
s116:philosopher s117:portrait s118:monk s120:study s121:philosopher
s126:bible s127:portrait s129:v_man s130:carpaccio s131:avenue s133:v_youth
s135:empyrean s136:claudius s137:prodigal s139:conversion s140:hands
`;

window.SHOTS = function (tl) {
  const E = window.EP, id = i => 's' + String(i + 1).padStart(3, '0');
  const D = { total: E.total, subs: E.subs, cues: E.subs.map((s, i) => ({ id: id(i), start: s.s, end: s.e, dur: s.e - s.s })) };
  runShots(tl, D, window.SHOT_PLAN, { prefer: true, fallback: { carpaccio: 'study', g_school: 'v_child', kiss: 'v_youth', port: 'sea', pharisee: 'narcissus' }, gap: 0 });
};
