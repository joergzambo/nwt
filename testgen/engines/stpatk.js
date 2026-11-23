/* Angriff auf die Root Bridge: BPDU-Spoofing, Gegenmaßnahmen BPDU Guard / Root Guard.
   Browser: window.STPA · Node: globalThis.STPA  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  var PRIOS = [4096, 8192, 12288, 24576, 32768];
  var PORTS = [
    { id: 'access', txt: 'Access-Port (PortFast, PC-Anschluss)', defense: 'bpduguard' },
    { id: 'trunk', txt: 'Trunk-Port zu einem anderen Switch', defense: 'rootguard' }
  ];
  var DEF = {
    bpduguard: 'BPDU Guard', rootguard: 'Root Guard', portsec: 'Port Security', none: 'keine wirksame Maßnahme'
  };

  function build(r, lvl) {
    var n = 3;
    var sw = [];
    // Legitimer Root bekommt kleinste Priorität
    var rootPrio = pick(r, [4096, 8192, 12288]);
    var names = ['SW1', 'SW2', 'SW3'];
    for (var i = 0; i < n; i++) sw.push({ name: names[i], prio: i === 0 ? rootPrio : pick(r, [24576, 32768]) });
    // Angreifer-Priorität je Stufe
    var attPrio = lvl === 'L' ? 0 : lvl === 'M' ? pick(r, [0, 4096]) : pick(r, [0, 4096, 8192, 16384]);
    var port = lvl === 'L' ? PORTS[0] : pick(r, PORTS);
    var legitRoot = sw[0].prio;
    // Angreifer wird Root, wenn seine Priorität <= legitime Root-Priorität (niedrigere MAC angenommen)
    var wins = attPrio <= legitRoot;
    var defense = wins ? port.defense : 'none';
    return {
      sw: sw, attPrio: attPrio, port: port, legitRoot: legitRoot, wins: wins, defense: defense,
      defenseTxt: DEF[defense]
    };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 4099) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }
  G.STPA = { LVNAME: LVNAME, PORTS: PORTS, DEF: DEF, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
