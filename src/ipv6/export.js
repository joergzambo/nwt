require('./ipv6.js');
const T = globalThis.IP6, N = +(process.argv[2] || 3000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = T.makeTask(s, lv);
  out.push({ code: t.code, kind: t.kind, given: t.given, plen: t.plen, mac: t.mac, prefix: t.prefix, ans: t.ans });
}
process.stdout.write(JSON.stringify(out));
