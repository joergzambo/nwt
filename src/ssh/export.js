require('./ssh.js');
const S = globalThis.SSH, N = +(process.argv[2] || 2000), out = [];
for (const lv of ['L', 'M', 'S']) for (let s = 1; s <= N; s++) {
  const t = S.makeTask(s, lv);
  out.push({ code: t.code, config: t.config, flaws: t.flaws.slice().sort() });
}
process.stdout.write(JSON.stringify(out));
