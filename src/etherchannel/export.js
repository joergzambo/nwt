require('./ec.js');
const E = globalThis.EC, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = E.makeTask(s, lv); out.push({code: t.code, n: t.n, c1: E.config(t, 's1'), c2: E.config(t, 's2'), res: t.res, base: t.base}); }
process.stdout.write(JSON.stringify(out));
