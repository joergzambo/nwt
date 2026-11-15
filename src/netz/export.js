require('./netz.js');
const A = globalThis.NA, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = A.makeTask(s, lv); out.push({code: t.code, d: t.d, q: t.q}); }
process.stdout.write(JSON.stringify(out));
