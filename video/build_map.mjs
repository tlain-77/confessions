// Build the map used in the "where he came from" scene: western Mediterranean coastline (Natural Earth, public domain)
// projected to stage pixels, plus the cities on Augustine's route.  → web/map.js
import fs from 'node:fs'; import { feature } from 'topojson-client'; import { geoMercator, geoPath } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
// frame: lon -7…27, lat 30.5…48.5 fills a 16:9 stage; the route sits a little left of centre
const W = 1920, H = 1080;
const frame = { type: 'MultiPoint', coordinates: [[-9.5, 31.2], [26.5, 48.6]] };   // two corners are enough to fit the view
const proj = geoMercator().fitExtent([[0, 0], [W, H]], frame).clipExtent([[-40, -40], [W + 40, H + 40]]).precision(0.3);
const d = geoPath(proj)(land);
const cities = { thagaste: [7.95, 36.29], carthage: [10.32, 36.85], rome: [12.48, 41.89], milan: [9.19, 45.46], hippo: [7.77, 36.90] };
const pts = Object.fromEntries(Object.entries(cities).map(([k, v]) => [k, proj(v).map(n => Math.round(n * 10) / 10)]));
fs.writeFileSync('web/map.js', `window.MAP = ${JSON.stringify({ land: d.replace(/(\.\d)\d+/g, '$1'), pts })};\n`);
console.log('map path chars', d.length, pts);
