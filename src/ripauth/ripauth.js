/* RIP-Authentifizierung: gefälschte Routing-Updates verhindern (key-chain, MD5).
   Browser: window.RIPA · Node: globalThis.RIPA  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  var OUT = {
    inject: 'ungesichert – jeder kann falsche Routen einschleusen',
    cleartext: 'authentifiziert, aber Passwort im Klartext mitlesbar',
    secure: 'sicher (MD5-Hash)',
    nomatch: 'keine RIP-Nachbarschaft – Schlüssel passen nicht, Updates werden verworfen'
  };
  var KEYS = ['Rip#Secret1', 'HTL-Rip-99', 'S3cureRip!', 'KeyChainRip'];

  function build(r, lvl) {
    var mode = lvl === 'L' ? pick(r, ['none', 'md5']) : lvl === 'M' ? pick(r, ['none', 'text', 'md5']) : pick(r, ['none', 'text', 'md5', 'md5']);
    var match = true;
    if (mode !== 'none') match = lvl === 'S' ? (r() < 0.5) : true;
    var out;
    if (mode === 'none') out = 'inject';
    else if (!match) out = 'nomatch';
    else if (mode === 'text') out = 'cleartext';
    else out = 'secure';
    var key = pick(r, KEYS), keyB = match ? key : pick(r, KEYS.filter(function (k) { return k !== key; }));
    var iface = pick(r, ['Gi0/0', 'Gi0/1', 'Se0/0/0']);
    return { mode: mode, match: match, out: out, outTxt: OUT[out], key: key, keyB: keyB, iface: iface, chain: 'RIP-KEYS' };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 5209) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }
  /* Config-Zeilen für R1 (Anzeige) */
  function cfg(s) {
    var L = [];
    if (s.mode !== 'none') { L.push('key chain ' + s.chain); L.push(' key 1'); L.push('  key-string ' + s.key); L.push('!'); }
    L.push('router rip'); L.push(' version 2'); L.push(' network 10.0.0.0'); L.push('!');
    L.push('interface ' + s.iface);
    if (s.mode !== 'none') { L.push(' ip rip authentication mode ' + s.mode); L.push(' ip rip authentication key-chain ' + s.chain); }
    else L.push(' ! keine RIP-Authentifizierung konfiguriert');
    return L;
  }
  G.RIPA = { LVNAME: LVNAME, OUT: OUT, makeTask: makeTask, cfg: cfg, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
