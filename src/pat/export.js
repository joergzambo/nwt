require('./pat.js');
const P = globalThis.PAT, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = P.makeTask(s, lv);
  out.push({code: t.code, pub: t.pub, conns: t.conns, hosts: t.hosts, rows: t.rows, reply: t.reply, term: t.term, servers: t.servers});
}
process.stdout.write(JSON.stringify(out));
