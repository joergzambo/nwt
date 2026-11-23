require('./stpatk.js');
const S = globalThis.STPA, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = S.makeTask(s, lv); out.push({ code: t.code, attPrio: t.attPrio, legitRoot: t.legitRoot, port: t.port.id, wins: t.wins, defense: t.defense }); }
process.stdout.write(JSON.stringify(out));
