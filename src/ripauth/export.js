require('./ripauth.js');
const R = globalThis.RIPA, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = R.makeTask(s, lv); out.push({ code: t.code, mode: t.mode, match: t.match, out: t.out }); }
process.stdout.write(JSON.stringify(out));
