require('./cli.js');
const C = globalThis.CLI, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = C.makeTask(s, lv);
  out.push({ code: t.code, filename: t.filename, human: t.human, plat: t.plat.code, feat: t.feat.code });
}
process.stdout.write(JSON.stringify(out));
