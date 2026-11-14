require('./starv.js');
const D = globalThis.DS, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = D.makeTask(s, lv);
  out.push({code: t.code, poolStart: t.poolStart, poolEnd: t.poolEnd, legit: t.legit, flood: t.flood,
    mode: t.mode, portSec: t.portSec, verify: t.verify, res: t.res});
}
process.stdout.write(JSON.stringify(out));
