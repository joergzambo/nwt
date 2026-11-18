require('./attack.js');
const V = globalThis.VH, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = V.makeTask(s, lv);
  out.push({code: t.code, portMode: t.portMode, vtpMode: t.vtpMode, vtpPass: t.vtpPass, pc: V.portCfg(t), vc: V.vtpCfg(t), res: t.res});
}
process.stdout.write(JSON.stringify(out));
