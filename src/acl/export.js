require('./acl.js');
const A = globalThis.ACL, N = +(process.argv[2] || 2000), out = [];
for (const k of ['std', 'ext']) for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = A.makeTask(s, lv, k);
  out.push({code: k + ':' + t.code, kind: k, wild: t.wild, txt: t.acl.lines.map(l => A.lineTxt(l, t.acl.num, k === 'std')), tests: t.acl.tests, place: t.place, build: t.build});
}
process.stdout.write(JSON.stringify(out));
