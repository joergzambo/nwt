/* Verkabelung: Kabeltyp (straight/crossover/rollover) und Medienwahl (Kupfer/Glasfaser).
   Browser: window.CAB · Node: globalThis.CAB  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  // Gerätegruppen: A = Hosts/Router (DTE), B = Switches/Hubs. Gleich -> crossover, verschieden -> straight.
  var GROUP = { 'PC': 'A', 'Server': 'A', 'Router': 'A', 'Switch': 'B', 'Hub': 'B' };
  var DEVS_A = ['PC', 'Server', 'Router'], DEVS_B = ['Switch', 'Hub'];

  function cableType(d1, d2) { return GROUP[d1] === GROUP[d2] ? 'crossover' : 'straight'; }

  // Medienwahl: Glasfaser bei >100 m oder starker Störung/Blitz, sonst Kupfer.
  var ENVS = [
    { key: 'buero', txt: 'normales Büro, trocken', fiber: false },
    { key: 'emi', txt: 'Industriehalle mit starken elektromagnetischen Störungen', fiber: true },
    { key: 'blitz', txt: 'Verbindung zwischen zwei Gebäuden im Freien (Blitzschutz)', fiber: true },
    { key: 'rz', txt: 'Rechenzentrum, kurze Strecke', fiber: false }
  ];
  function mediaFor(dist, envFiber) { return (dist > 100 || envFiber) ? 'glasfaser' : 'kupfer'; }

  function build(r, lvl) {
    var kind = lvl === 'L' ? pick(r, ['cable', 'cable', 'media']) : pick(r, ['cable', 'media']);
    if (kind === 'media') {
      var env = pick(r, ENVS);
      var dist = env.fiber ? pick(r, [20, 50, 300, 800, 1500]) : pick(r, [5, 15, 30, 60, 90, 150, 400]);
      return { kind: 'media', dist: dist, env: env.txt, envKey: env.key, envFiber: env.fiber, ans: mediaFor(dist, env.fiber) };
    }
    // cable
    var useConsole = lvl !== 'L' && r() < 0.22;
    if (useConsole) { var dev = pick(r, ['PC', 'Laptop']); var tgt = pick(r, ['Switch', 'Router']); return { kind: 'cable', d1: dev, d2: tgt + ' (Konsolenport)', console: true, ans: 'rollover' }; }
    var d1, d2;
    if (lvl === 'L') { // häufige, eindeutige Paare
      var pair = pick(r, [['PC', 'Switch'], ['Router', 'Switch'], ['Switch', 'Switch'], ['PC', 'PC'], ['Server', 'Switch']]);
      d1 = pair[0]; d2 = pair[1];
    } else {
      var all = DEVS_A.concat(DEVS_B);
      d1 = pick(r, all); d2 = pick(r, all);
    }
    return { kind: 'cable', d1: d1, d2: d2, console: false, ans: cableType(d1, d2) };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 3307) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }

  G.CAB = { LVNAME: LVNAME, GROUP: GROUP, cableType: cableType, mediaFor: mediaFor, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
