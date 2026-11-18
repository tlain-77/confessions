// 本人录制 · 翻开第一页：逐句换背景。
// 每一句话（讲稿里的一句）配一幅跟这句内容对得上的画；一句里有几幅（用逗号隔开）就在句中停顿处切换；
// 没写的句子沿用上一句的画，但镜头会推近到画上别的地方，所以每一句画面都会动一次。
window.SHOT_CAPS = {
  angelus: '米勒《晚祷》 1859', babel: '老彼得·勃鲁盖尔《巴别塔》 1563', bedroom: '梵高《卧室》 1889', bible: '梵高《有圣经的静物》 1885',
  calf: '普桑《崇拜金牛犊》 1634', cicero: '马卡里《西塞罗斥责喀提林》 1880年代', conversion: '菲利普·德·尚帕涅《圣奥古斯丁的归信》 17世纪',
  creation: '米开朗基罗《创造亚当》 约1512', david: '洪特霍斯特《大卫王弹琴》 1622', dawn: '弗里德里希《日出前的女子》 约1818',
  dido: '透纳《狄多建造迦太基》 1815', fathers: '帕赫《教父祭坛画》 1483', heretics: '韦尔戈斯工坊《圣奥古斯丁与异端辩论》 15世纪',
  money: '马西斯《放贷人和他的妻子》 1514', nativity: '洪特霍斯特《牧羊人朝拜》 1622', ninth: '艾瓦佐夫斯基《九级浪》 1850',
  pears: '梵高《葡萄、柠檬、梨和苹果》 1887', portrait: '菲利普·德·尚帕涅《圣奥古斯丁》 约1645', prodigal: '伦勃朗《浪子回头》 约1668',
  rebuke: '多明我基诺《神责备亚当夏娃》 1626', sea: '艾瓦佐夫斯基《月夜》 1850', sermon: '韦尔戈斯工坊《奥古斯丁与莫妮卡听安波罗修讲道》 15世纪',
  starry: '梵高《星夜》 1889', station: '莫奈《圣拉扎尔火车站》 1877', study: '波提切利《书房中的圣奥古斯丁》 1480', sunset: '丘奇《荒野暮色》 1860',
  v_child: '托马斯·科尔《人生的旅程 · 童年》 1842', v_youth: '托马斯·科尔《人生的旅程 · 青年》 1842', v_man: '托马斯·科尔《人生的旅程 · 壮年》 1842',
  v_old: '托马斯·科尔《人生的旅程 · 老年》 1842', vanitas: '彼得·克莱兹《虚空静物》 1630年代', vesting: '佚名《安波罗修为奥古斯丁披上白衣》 16世纪初',
  wanderer: '弗里德里希《雾海上的旅人》 约1818', angler: '马远《寒江独钓图》 南宋', fankuan: '范宽《溪山行旅图》 北宋',
  narcissus: '卡拉瓦乔《纳西索斯》 约1597', athens: '拉斐尔《雅典学院》 1511', lightworld: '亨特《世界之光》 1854', mill: '门采尔《轧铁工厂》 1875',
  icarus: '勃鲁盖尔（传）《伊卡洛斯坠落的风景》 约1560', expulsion: '托马斯·科尔《逐出伊甸园》 1828', philosopher: '伦勃朗《沉思的哲学家》 1632',
  jacob: '德拉克洛瓦《雅各与天使摔跤》 1861', ladder: '布莱克《雅各的梯子》 约1800', bones: '多雷《以西结看见枯骨的平原》 1866',
  lazarus: '伦勃朗《拉撒路复活》 约1630', doctor: '菲尔德斯《医生》 1891', avenue: '霍贝玛《米德尔哈尼斯的林荫道》 1689',
  annunc: '弗拉·安杰利科《天使报喜》 约1434', dewitte: '德·维特《阿姆斯特丹老教堂里的讲道》 约1660', pollice: '热罗姆《拇指朝下》 1872',
  claudius: '阿尔玛-塔德玛《罗马皇帝 · 公元41年》 1871', geographer: '维米尔《地理学家》 1669', burning: '透纳《上下议院大火》 1835',
  monk: '弗里德里希《海边的修士》 1810', sins: '博斯《七宗罪与最后四事》 约1500', beggar: '牟利罗《年轻的乞丐》 约1650',
  temeraire: '透纳《无畏号最后的航程》 1839', damascus: '卡拉瓦乔《圣保罗归信》 1601', isle: '勃克林《死之岛》 1883',
  hands: '丢勒《祈祷的手》 1508', melencolia: '丢勒《忧郁 I》 1514', rebels: '勃鲁盖尔《叛逆天使的坠落》 1562', awaken: '亨特《良心的觉醒》 1853',
  jdream: '里贝拉《雅各的梦》 1639', empyrean: '多雷《神曲 · 天堂篇》插图 1868', paulathens: '拉斐尔《保罗在雅典讲道》 1515',
  mount: '布洛赫《登山宝训》 1877', cafe: '梵高《夜间露天咖啡座》 1888', 
  restflight: '卡拉瓦乔《逃往埃及途中的休息》 约1597', moses: '伦勃朗《摩西与十诫》 1659', snowstorm: '透纳《暴风雪中的汽船》 1842',
  tavern: '布劳沃《酒馆》 约1635', gleaners: '米勒《拾穗者》 1857', rainy: '卡耶博特《巴黎街道 · 雨天》 1877', oldman: '伦勃朗《红衣老人》 约1654',
  angels: '弗拉·安杰利科《吹号的天使》 1433', thomas: '卡拉瓦乔《多疑的多马》 1602', paulprison: '伦勃朗《狱中的保罗》 1627',
  lamb: '凡·艾克兄弟《羔羊的崇拜》 1432', abbey: '弗里德里希《橡树林中的修道院》 1810', pharisee: '蒂索《法利赛人和税吏》 约1890',
};

// 句子 → 画
window.SHOT_PLAN = `
c001:bible c002:empyrean
c003:study c004:claudius c005:portrait c006:cicero c007:cicero c008:claudius c009:pollice c010:portrait c011:study,lamb
c012:david c013:david c014:starry c015:cicero c016:study c017:david c018:v_child c019:restflight c020:portrait c021:cicero
c022:sunset c023:lamb c024:philosopher c025:sunset c026:temeraire c027:dawn
c028:vanitas,oldman
c029:monk c030:monk c031:portrait c032:vesting c033:fathers c034:wanderer c035:rainy c036:rainy c037:station c038:creation
c039:vanitas c040:isle c041:v_old c042:portrait c043:doctor c044:study c045:abbey,isle c046:melencolia c047:v_old c048:sins c049:pears c050:babel
c051:babel c052:philosopher c053:expulsion c054:rebuke c055:rebels c056:icarus c057:expulsion c058:icarus c059:oldman c060:v_old c061:narcissus c062:babel c063:oldman
c064:sins c065:pharisee c066:sins c067:sins c068:melencolia c069:narcissus
c070:hands c071:study c072:cicero c073:hands
c074:vanitas,babel c075:angels c076:rebuke c077:expulsion c078:rebuke c079:money c080:hands c081:philosopher
c082:annunc c084:creation c085:creation c086:jdream c087:jdream,awaken c088:awaken c089:lazarus c090:portrait c091:bedroom c092:v_man
c093:moses c094:angelus c095:philosopher c096:prodigal c097:pears c098:pears c099:angelus c100:conversion c101:conversion,vanitas c102:conversion
c103:paulprison c104:paulprison c105:sins,hands c106:creation
c107:restflight c108:fathers c109:doctor
c110:geographer c111:geographer c112:sea c113:snowstorm c114:ninth c115:wanderer c116:rainy
c117:station c118:claudius c119:claudius c120:beggar c121:tavern c122:study c123:prodigal,wanderer
c124:rainy c125:money,station c126:gleaners c127:babel c128:babel c129:bedroom c130:cafe,starry c131:starry c132:monk
c133:study,wanderer c134:burning c135:burning c136:calf c137:mill c138:mill c139:calf c140:mill,station c141:mill
c142:doctor c143:expulsion c144:tavern c145:doctor c146:dawn c147:dewitte,mount c148:prodigal c149:wanderer c150:heretics,athens
c151:money c152:paulprison,calf c153:snowstorm c154:philosopher
c155:philosopher,hands c156:monk c157:calf c158:hands
c159:hands c160:study c161:philosopher c162:melencolia c163:philosopher c164:hands c165:athens c166:rainy c167:rainy c168:wanderer,monk
c169:pharisee c170:hands,narcissus c171:angelus c172:pharisee c173:pharisee c174:narcissus c175:narcissus c176:pharisee c177:pharisee
c178:claudius c179:narcissus c180:hands c181:athens c182:angelus
c183:study c184:jacob c185:jacob c186:thomas c187:hands
c188:paulathens c189:paulathens,angels
c190:philosopher c191:lightworld c192:paulprison c193:mount c194:dewitte c195:david c196:sermon c197:avenue,mount,angels c198:avenue c199:lamb c200:empyrean,lamb
c201:philosopher c202:melencolia c203:philosopher c204:annunc c205:annunc c206:rainy c207:rainy c208:annunc c209:lightworld
c210:conversion c211:conversion c212:conversion c213:bible c214:bible c215:annunc
c216:lightworld,sermon c217:nativity,sermon
c218:study c219:hands c220:hands c221:hands c222:damascus c223:damascus c224:bedroom c225:ladder c226:ladder c227:gleaners c228:ladder c229:ladder
c230:creation c231:hands c232:creation c233:paulprison,creation c234:creation c235:creation c236:creation c237:bones c238:lazarus
c239:nativity c240:nativity c241:nativity c242:monk,starry c243:nativity c244:nativity,restflight c245:ladder
c246:sermon c247:sermon c248:vesting c249:fathers,study c250:study,portrait c251:dewitte c252:dewitte c253:gleaners c254:jdream c255:dewitte
c256:sermon c257:paulathens c258:mount c259:dewitte c260:dewitte
c261:bible c262:study c263:bible c264:hands,angels c265:philosopher c266:annunc c267:annunc c268:dido,claudius,lightworld c269:portrait c270:portrait
c271:philosopher c272:wanderer,money c273:prodigal c274:hands
c275:lightworld c276:lightworld c277:lightworld c278:lightworld
`;

window.SHOTS = function (tl) {
  const D = window.EPD, list = planShots(D, window.SHOT_PLAN, { fallback: { pharisee: 'narcissus', angels: 'empyrean', thomas: 'jacob', paulprison: 'study', lamb: 'empyrean', abbey: 'isle', carthage_u: 'dido' } });
  // 旁白卡、片尾不放（旁白卡自己有画，一句换一幅）
  const off = (window.ASIDE_SPANS || []).map(([a, b]) => [a + 0.3, b]);
  off.push([D.total - 6.6, D.total + 1]);
  const all = [];
  for (const s of list) {
    while (off.length && off[0][0] <= s.a) { const [a, b] = off.shift(); all.push({ a, src: null }); }
    all.push(s);
  }
  off.forEach(([a]) => all.push({ a, src: null }));
  all.sort((p, q) => p.a - q.a);
  makeShots(tl, all, { caps: window.SHOT_CAPS, o: 0.6, xf: 0.7 });
  window.SHOT_LIST = all;
};
