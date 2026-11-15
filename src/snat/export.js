require('./snat.js');
const S = globalThis.SN, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = S.makeTask(s, lv);
  out.push({code: t.code, wan: t.wan, isp: t.isp, free: t.free, servers: t.servers, entries: t.entries, pkts: t.pkts, back: t.back, arp: t.arp, cmds: t.entries.map(S.cmd)});
}
process.stdout.write(JSON.stringify(out));
