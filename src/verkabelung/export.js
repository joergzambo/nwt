require('./verkabelung.js');
const T = globalThis.CAB, N = +(process.argv[2] || 3000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = T.makeTask(s, lv);
  out.push({ code: t.code, kind: t.kind, d1: t.d1, d2: t.d2, console: t.console, dist: t.dist, envFiber: t.envFiber, ans: t.ans });
}
process.stdout.write(JSON.stringify(out));
