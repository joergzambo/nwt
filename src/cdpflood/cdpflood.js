/* CDP-Flooding mit Yersinia: gefälschte CDP-Nachbarn fluten den Switch.
   Browser: window.CDF · Node: globalThis.CDF  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  var DEF = { portoff: 'no cdp enable am Zugangsport', runoff: 'CDP global aus (no cdp run)', portsec: 'Port Security', none: 'keine nötig' };

  function build(r, lvl) {
    var iface = 'Fa0/' + (1 + ri(r, 24));
    var cdpGlobalOff = lvl === 'S' ? (r() < 0.3) : false;
    var cdpPortOff = cdpGlobalOff ? false : (lvl === 'L' ? false : (r() < 0.4));
    var vulnerable = !cdpGlobalOff && !cdpPortOff;
    var defense = vulnerable ? 'portoff' : 'none';
    return { iface: iface, cdpGlobalOff: cdpGlobalOff, cdpPortOff: cdpPortOff, vulnerable: vulnerable, defense: defense, defenseTxt: DEF[defense] };
  }

  function cfg(s) {
    var L = [];
    L.push('hostname SW1');
    if (s.cdpGlobalOff) L.push('no cdp run                 ! CDP geräteweit aus');
    L.push('!');
    L.push('interface ' + s.iface);
    L.push(' switchport mode access');
    L.push(' switchport access vlan 10');
    if (s.cdpPortOff) L.push(' no cdp enable             ! CDP an diesem Port aus');
    L.push('!');
    L.push('interface Gi0/1');
    L.push(' switchport mode trunk      ! Uplink – CDP hier erwünscht');
    return L;
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 3121) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }
  G.CDF = { LVNAME: LVNAME, DEF: DEF, makeTask: makeTask, cfg: cfg, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
