require('./arp.js');
const A = globalThis.AR, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = A.makeTask(s, lv);
  out.push({code: t.code, poisoning: t.poisoning, defense: t.defense, gwMac: t.gateway.mac, attMac: t.attacker.mac, res: t.res});
}
process.stdout.write(JSON.stringify(out));
