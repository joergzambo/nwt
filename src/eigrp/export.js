require('./eigrp.js');
const T = globalThis.EIG, N = +(process.argv[2] || 3000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = T.makeTask(s, lv);
  out.push({ code: t.code, kind: t.kind, minBW: t.minBW, delay: t.delay, fd: t.fd, rd: t.rd, paths: t.paths, ans: t.ans, fs: t.fs });
}
process.stdout.write(JSON.stringify(out));
