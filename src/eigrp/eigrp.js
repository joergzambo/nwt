/* EIGRP: klassische Metrik, Feasible Distance, Successor / Feasible Successor (DUAL).
   Browser: window.EIG · Node: globalThis.EIG  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  // Interface-Defaults: Bandbreite (kbps) und Delay (µs)
  var LINKS = [
    { name: 'GigabitEthernet', bw: 1000000, delay: 10 },
    { name: 'FastEthernet', bw: 100000, delay: 100 },
    { name: 'Ethernet', bw: 10000, delay: 1000 },
    { name: 'Serial T1 (1544k)', bw: 1544, delay: 20000 },
    { name: 'Serial 512k', bw: 512, delay: 20000 }
  ];

  // Klassische EIGRP-Metrik (K1=K3=1): 256 * ( 10^7/minBW(kbps) + Summe(Delay µs)/10 )
  function metric(minBW, totalDelayUs) {
    return 256 * (Math.floor(10000000 / minBW) + Math.floor(totalDelayUs / 10));
  }

  function path(r, nLinks) {
    var links = [], bwMin = Infinity, dSum = 0;
    for (var i = 0; i < nLinks; i++) { var L = pick(r, LINKS); links.push(L); if (L.bw < bwMin) bwMin = L.bw; dSum += L.delay; }
    return { links: links, minBW: bwMin, delay: dSum, metric: metric(bwMin, dSum) };
  }

  function build(r, lvl) {
    var kind = lvl === 'L' ? pick(r, ['feasible', 'metric']) : lvl === 'M' ? pick(r, ['metric', 'metric', 'feasible']) : pick(r, ['metric', 'successor']);
    if (kind === 'metric') {
      var p = path(r, lvl === 'L' ? 1 : lvl === 'M' ? 2 : 2 + ri(r, 3));
      return { kind: 'metric', links: p.links.map(function (x) { return x.name; }), minBW: p.minBW, delay: p.delay, ans: p.metric };
    }
    if (kind === 'feasible') {
      var fd = (5 + ri(r, 40)) * 2560;                  // Successor-FD
      var isFS = r() < 0.5;
      var rd = isFS ? ri(r, fd) : fd + (1 + ri(r, 20)) * 256;  // RD < FD (FS) oder >= FD (kein FS)
      return { kind: 'feasible', fd: fd, rd: rd, ans: rd < fd ? 'ja' : 'nein' };
    }
    // successor: 3 Pfade, Successor = kleinste FD; FS = RD < Successor-FD
    var n = 3, paths = [], labels = ['A', 'B', 'C'];
    for (var j = 0; j < n; j++) { var fdj = (8 + ri(r, 60)) * 2560; var rdj = ri(r, fdj); paths.push({ id: labels[j], fd: fdj, rd: rdj }); }
    var succ = paths.slice().sort(function (a, b) { return a.fd - b.fd; })[0];
    var fs = paths.filter(function (p2) { return p2.id !== succ.id && p2.rd < succ.fd; }).map(function (p2) { return p2.id; });
    return { kind: 'successor', paths: paths, ans: succ.id, fs: fs };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 9041) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }

  G.EIG = { LVNAME: LVNAME, LINKS: LINKS, metric: metric, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
