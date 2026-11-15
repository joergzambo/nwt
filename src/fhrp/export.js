require('./fhrp.js');
const F = globalThis.FH, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = F.makeTask(s, lv); out.push({code: t.code, proto: t.proto, ver: t.ver, g: t.g, vip: t.vip, mac: t.mac, macOpts: t.macOpts, events: t.events, hist: t.hist.map(h => h.active), cfg: t.R.map((x, i) => F.config(t, i)), names: t.R.map(x => x.name)}); }
process.stdout.write(JSON.stringify(out));
