require('./zs.js');
const Z = globalThis.ZS, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) { const t = Z.makeTask(s, lv); out.push({code: t.code, items: t.items}); }
/* Rechenhilfen gegen Python prüfen */
const extra = [];
for (let i = 0; i < 3000; i++) { const n = Math.floor(Math.random() * 4294967296), b = [2, 3, 5, 8, 12, 16][i % 6];
  extra.push({n, b, s: Z.toStr(n, b), back: Z.parse(Z.toStr(n, b), b), g4: Z.groups(n, 4).join(''), dv: Z.divSteps(n, b).map(x => x.rest).reverse().join(',')}); }
process.stdout.write(JSON.stringify({tasks: out, extra}));
