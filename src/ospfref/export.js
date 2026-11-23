require('./ospfref.js');
const O = globalThis.ORB, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = O.makeTask(s, lv);
  out.push({ code: t.code, ref: t.ref, costs: t.costs,
    ifs: t.routers.flatMap(R => R.ifs.map(i => i.bw)) });
}
process.stdout.write(JSON.stringify(out));
