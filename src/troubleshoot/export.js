require('./ts.js');
const T = globalThis.TS, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = T.makeTask(s, lv); out.push({ code: t.code, fault: t.fault, fixId: t.fixId, status: t.shbr[0].status, proto: t.shbr[0].proto }); }
process.stdout.write(JSON.stringify(out));
