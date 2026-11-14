require('./route.js');
const I = globalThis.IR, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const T = I.makeTask(s, lv);
  out.push({code: T.code, nets: T.nets.map(n => ({net: n.net, offers: n.offers.map(o => ({proto: o.proto, metric: o.metric})), winProto: n.win.proto}))});
}
process.stdout.write(JSON.stringify(out));
