// 本人录制 · 第八讲（卷一第六章上）：逐句换背景。c001 … 是讲稿 tts/s13.json 里的句子；
// 没写的句子沿用上一幅，但镜头推近到画上别的地方。名画铺满的那几场，背景层不放（self10.js 里按场景时间排除）。
// 只用 img/focus.js 里有推近位置、img/blur、img/soft 里有底图的画（不然那一句会悄悄沿用上一幅）。
window.SHOT_PLAN = `
c001:empyrean c003:bedroom c004:hands c010:study c012:portrait c014:monica_s c016:carpaccio c020:sea c021:dawn c022:pitcher
c023:gleaners c024:lightworld c025:sunset c026:restflight c027:angelus c030:monk c043:fathers c048:prayer
c051:awaken c059:shepherd c061:study c066:tolle c068:isle c075:fankuan c081:oldman c085:lazarus c088:melencolia c089:lamb
c100:dawn c102:v_man c105:snowstorm c108:avenue c111:brioche c118:port c125:dehooch c126:mill c127:pears c131:money
c134:cassatt c139:prodigal c142:abbey c146:rain c149:hands c152:g_ostia c154:wanderer c156:temeraire c163:empire c167:abbey
c170:v_child c175:rainy c177:nativity c180:g_hippo c184:birth c188:conversion
`;
window.SHOTS = tl => runShots(tl, window.EPD, window.SHOT_PLAN, { prefer: true, gap: 4, long: 6 });
