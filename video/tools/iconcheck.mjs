// 场景表里用到的图标名，哪些在 Tabler 里没有：node tools/iconcheck.mjs web/self5_lec.js ...
import fs from 'node:fs';
const J = JSON.parse(fs.readFileSync('node_modules/@tabler/icons/tabler-nodes-outline.json', 'utf8'));
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(f, 'utf8'), names = new Set();
  for (const m of s.matchAll(/ill: '\w+'[^\n]*?items: \[(.*?)\] \}/g)) for (const n of m[1].matchAll(/\[\s*'([a-z0-9-]+)'/g)) names.add(n[1]);
  for (const m of s.matchAll(/flow: '([a-z0-9-]+)'/g)) names.add(m[1]);
  const miss = [...names].filter(n => !J[n]);
  console.log(f, names.size, 'icons;', miss.length ? 'missing: ' + miss.join(' ') : 'all present');
  for (const n of miss) console.log('  ', n, '→ similar:', Object.keys(J).filter(k => k.includes(n.split('-')[0])).slice(0, 12).join(' '));
}
