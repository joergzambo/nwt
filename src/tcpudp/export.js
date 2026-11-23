require('./tcpudp.js');
const T = globalThis.TCP, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = T.makeTask(s, lv); out.push({ code: t.code, type: t.type, svc: t.svc, port: t.port, proto: t.proto, ans: t.ans }); }
process.stdout.write(JSON.stringify(out));
