/* Cisco CLI-Grundlagen: IOS-Dateiname-Generator + Zerlegung.
   Browser: window.CLI · Node: globalThis.CLI  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  var PLATS = [
    { code: 'c1900', name: 'Cisco 1900 Router' }, { code: 'c2900', name: 'Cisco 2900 Router' },
    { code: 'c3900', name: 'Cisco 3900 Router' }, { code: 'c2960', name: 'Catalyst 2960 Switch' },
    { code: 'cat3k_caa', name: 'Catalyst 3850 Switch' }, { code: 'isr4300', name: 'ISR 4300 Router' }
  ];
  var FEATS = [
    { code: 'universalk9', desc: 'alle Funktionen + starke Verschlüsselung (k9)' },
    { code: 'ipbasek9', desc: 'Basis-Funktionen + starke Verschlüsselung (k9)' },
    { code: 'universalk9_npe', desc: 'alle Funktionen ohne Payload-Verschlüsselung (npe)' },
    { code: 'lanbasek9', desc: 'Switch-Basis (Layer-2) + Verschlüsselung (k9)' }
  ];
  var TRAINS = ['M', 'E', 'T', 'S'];

  function build(r, lvl) {
    var plat = pick(r, PLATS);
    var isSwitch = /2960|cat3k/.test(plat.code);
    var featPool = FEATS.filter(function (f) { return isSwitch ? /lanbase|ipbase/.test(f.code) : /universal|ipbase/.test(f.code); });
    var feat = pick(r, featPool);
    var maj = pick(r, [12, 15]), min = ri(r, 5), rebuild = 1 + ri(r, 6), train = pick(r, TRAINS), maint = 1 + ri(r, 6);
    var human = maj + '.' + min + '(' + rebuild + ')' + train + maint;
    var fileVer = '' + maj + min + '-' + rebuild + '.' + train + maint;
    var filename = plat.code + '-' + feat.code + '-mz.SPA.' + fileVer + '.bin';
    return {
      plat: plat, feat: feat, maj: maj, min: min, rebuild: rebuild, train: train, maint: maint,
      human: human, fileVer: fileVer, filename: filename, runFrom: 'RAM', signed: true, crypto: true
    };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 7723) >>> 0);
    var s = build(r, lvl);
    s.level = lvl; s.code = lvl + '-' + seed;
    return s;
  }
  /* Zerlegt einen Dateinamen in beschriftete Teile (für die Anzeige) */
  function parts(fn) {
    var m = /^([a-z0-9_]+)-([a-z0-9_]+)-(mz|mzk9|m)\.(SPA|SSA)?\.?(.+)\.bin$/i.exec(fn);
    if (!m) return null;
    return { plat: m[1], feat: m[2], fmt: m[3], sign: m[4] || '', ver: m[5] };
  }
  G.CLI = { LVNAME: LVNAME, PLATS: PLATS, FEATS: FEATS, makeTask: makeTask, parts: parts, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
