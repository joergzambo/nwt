require('./dtp.js');
const V = globalThis.VD, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = V.makeTask(s, lv);
  out.push({code: t.code, m1: t.m1, m2: t.m2, c1: V.config(t, 's1'), c2: V.config(t, 's2'), res: t.res});
}
process.stdout.write(JSON.stringify(out));
