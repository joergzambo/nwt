require('./rogue.js');
const R = globalThis.RG, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = R.makeTask(s, lv);
  out.push({code: t.code, rogue: t.rogue, defense: t.defense, race: t.race, realGw: t.realGw, rogueGw: t.rogueGw, res: t.res});
}
process.stdout.write(JSON.stringify(out));
