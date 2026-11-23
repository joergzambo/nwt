require('./wild.js');
const W = globalThis.WC, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = W.makeTask(s, lv);
  out.push({ code: t.code, aOct: t.aOct, wOct: t.wOct, octIdx: t.octIdx, count: t.count });
}
process.stdout.write(JSON.stringify(out));
