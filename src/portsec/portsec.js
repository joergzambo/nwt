/* Port Security: maximum, Violation-Modi, Ausgang eines Szenarios.
   Browser: window.PSEC · Node: globalThis.PSEC  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  // Violation-Modi: Verwerfen? Log/Counter? Port down?
  var MODES = {
    protect:  { name: 'protect',  drop: true, log: false, down: false, desc: 'Überzählige Frames werden verworfen – kein Log, kein Counter. Der Port bleibt aktiv.' },
    restrict: { name: 'restrict', drop: true, log: true,  down: false, desc: 'Überzählige Frames werden verworfen, es gibt eine Syslog-Meldung und der Violation-Counter steigt. Der Port bleibt aktiv.' },
    shutdown: { name: 'shutdown', drop: true, log: true,  down: true,  desc: 'Der Port geht sofort in err-disabled (down), mit Syslog/SNMP-Meldung. Das ist die Voreinstellung.' }
  };
  // Ausgangs-Keys für Szenarien
  var OUT = {
    ok:       'Alle Geräte funktionieren – die Zahl bleibt im erlaubten Rahmen.',
    protect:  MODES.protect.desc,
    restrict: MODES.restrict.desc,
    shutdown: MODES.shutdown.desc
  };

  function scenario(r, lvl) {
    var mode = lvl === 'L' ? pick(r, ['shutdown', 'restrict']) : pick(r, ['protect', 'restrict', 'shutdown']);
    var N = 1 + ri(r, lvl === 'L' ? 2 : 4);                 // maximum 1..2 / 1..4
    var over = r() < (lvl === 'L' ? 0.6 : 0.55);            // mehr Geräte als erlaubt?
    var M = over ? N + 1 + ri(r, 2) : 1 + ri(r, N);         // tatsächliche MACs
    var sticky = lvl !== 'L' && r() < 0.4;
    var ans = M <= N ? 'ok' : mode;
    return { kind: 'what', mode: mode, max: N, macs: M, sticky: sticky, ans: ans };
  }

  function build(r, lvl) {
    var kind = lvl === 'S' ? pick(r, ['what', 'what', 'mode']) : (lvl === 'M' ? pick(r, ['what', 'what', 'mode']) : 'what');
    if (kind === 'mode') { var m = pick(r, ['protect', 'restrict', 'shutdown']); return { kind: 'mode', mode: m, ans: m }; }
    return scenario(r, lvl);
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 4231) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }

  G.PSEC = { LVNAME: LVNAME, MODES: MODES, OUT: OUT, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
