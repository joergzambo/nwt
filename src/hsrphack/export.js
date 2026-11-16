require('./hsrp.js');
const H = globalThis.HS, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = H.makeTask(s, lv);
  out.push({code: t.code, group: t.group, vip: t.vip, r1: t.r1, r2: t.r2, att: t.att, auth: t.auth, res: t.res});
}
process.stdout.write(JSON.stringify(out));
