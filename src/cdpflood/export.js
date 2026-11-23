require('./cdpflood.js');
const C = globalThis.CDF, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = C.makeTask(s, lv); out.push({ code: t.code, g: t.cdpGlobalOff, p: t.cdpPortOff, vulnerable: t.vulnerable, defense: t.defense }); }
process.stdout.write(JSON.stringify(out));
