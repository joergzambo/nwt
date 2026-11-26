require('./portsec.js');
const T = globalThis.PSEC, N = +(process.argv[2] || 3000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = T.makeTask(s, lv);
  out.push({ code: t.code, kind: t.kind, mode: t.mode, max: t.max, macs: t.macs, ans: t.ans });
}
process.stdout.write(JSON.stringify(out));
