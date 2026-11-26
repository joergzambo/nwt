/* IPv6-Adressierung: Komprimieren/Expandieren, Adresstyp, EUI-64, Präfix.
   Browser: window.IP6 · Node: globalThis.IP6  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }
  function hex(n) { return n.toString(16); }
  function h4(r) { return ri(r, 65536); }           // ein Hextet 0..ffff
  function pad4(x) { return ('0000' + x.toString(16)).slice(-4); }

  /* Expandieren: beliebige IPv6-Schreibweise -> 8 volle Gruppen (Kleinbuchstaben) */
  function expand(a) {
    a = a.trim().toLowerCase();
    var dc = a.indexOf('::');
    var left, right;
    if (dc >= 0) {
      var parts = a.split('::');
      left = parts[0] ? parts[0].split(':') : [];
      right = parts[1] ? parts[1].split(':') : [];
    } else { left = a.split(':'); right = []; }
    var miss = 8 - (left.length + right.length);
    var mid = []; for (var i = 0; i < (dc >= 0 ? miss : 0); i++) mid.push('0');
    var g = left.concat(mid).concat(right);
    return g.map(function (x) { return ('0000' + x).slice(-4); }).join(':');
  }

  /* Komprimieren nach RFC 5952: führende Nullen weg, längste Nullfolge (>=2) -> :: (links bei Gleichstand) */
  function compress(full) {
    var g = expand(full).split(':').map(function (x) { return x.replace(/^0+/, '') || '0'; });
    var best = -1, bestLen = 0, cs = -1, cl = 0;
    for (var i = 0; i < 8; i++) {
      if (g[i] === '0') { if (cs < 0) { cs = i; cl = 1; } else cl++; if (cl > bestLen) { bestLen = cl; best = cs; } }
      else { cs = -1; cl = 0; }
    }
    if (bestLen < 2) return g.join(':');
    return g.slice(0, best).join(':') + '::' + g.slice(best + bestLen).join(':');
  }

  /* Adresstyp aus den ersten Bits */
  function typeOf(addr) {
    var f = expand(addr).split(':');
    var hx = f.map(function (x) { return parseInt(x, 16); });
    var allZero = hx.every(function (v) { return v === 0; });
    if (allZero) return { key: 'unspec', name: 'Nicht spezifiziert (::)' };
    if (hx.slice(0, 7).every(function (v) { return v === 0; }) && hx[7] === 1) return { key: 'loop', name: 'Loopback (::1)' };
    var b0 = hx[0];
    if ((b0 & 0xff00) === 0xff00) return { key: 'mcast', name: 'Multicast (ff00::/8)' };
    if ((b0 & 0xffc0) === 0xfe80) return { key: 'll', name: 'Link-Local (fe80::/10)' };
    if ((b0 & 0xfe00) === 0xfc00) return { key: 'ula', name: 'Unique Local (fc00::/7)' };
    if ((b0 & 0xe000) === 0x2000) return { key: 'gua', name: 'Global Unicast (2000::/3)' };
    return { key: 'other', name: 'Anderer/reservierter Bereich' };
  }
  var TYPES = [
    { key: 'gua', name: 'Global Unicast (2000::/3)' },
    { key: 'll', name: 'Link-Local (fe80::/10)' },
    { key: 'ula', name: 'Unique Local (fc00::/7)' },
    { key: 'mcast', name: 'Multicast (ff00::/8)' },
    { key: 'loop', name: 'Loopback (::1)' }
  ];

  /* EUI-64: MAC (12 Hex) -> Interface-ID (64 Bit, 4 Hextets) */
  function eui64(mac) {
    var m = mac.replace(/[^0-9a-f]/gi, '').toLowerCase();         // 12 Hexziffern
    var b0 = parseInt(m.slice(0, 2), 16) ^ 0x02;                   // U/L-Bit umdrehen
    var mid = m.slice(0, 6) + 'fffe' + m.slice(6);                 // fffe einschieben
    var full = pad4(b0).slice(2) + mid.slice(2);                   // erstes Byte ersetzen -> 16 Hexziffern
    return full.replace(/(.{4})/g, '$1:').replace(/:$/, '');       // 4 Hextets "aabb:ccff:fedd:eeff"
  }
  function randMac(r) {
    var b = []; for (var i = 0; i < 6; i++) b.push(('0' + ri(r, 256).toString(16)).slice(-2));
    return b[0] + b[1] + '.' + b[2] + b[3] + '.' + b[4] + b[5];    // Cisco-Schreibweise aabb.ccdd.eeff
  }

  /* Netzpräfix: Adresse auf /prefix -> Hostbits auf 0, komprimiert */
  function netPrefix(addr, plen) {
    var f = expand(addr).split(':').map(function (x) { return parseInt(x, 16); });
    for (var i = 0; i < 8; i++) {
      var hi = i * 16;
      if (hi >= plen) { f[i] = 0; continue; }
      var within = plen - hi; if (within < 16) { var mask = (0xffff << (16 - within)) & 0xffff; f[i] = f[i] & mask; }
    }
    return compress(f.map(pad4).join(':'));
  }

  /* ---- Adressgeneratoren je Typ (ergeben "interessante" Nullfolgen) ---- */
  function genGUA(r) {
    // 2001:db8:...  mit ein paar Nullgruppen
    var g = ['2001', '0db8', pad4(h4(r)), '0000', '0000', pad4(h4(r) & 0x00ff), '0000', pad4(1 + ri(r, 0xfffe))];
    if (r() < 0.5) g[2] = '0000';
    return g.join(':');
  }
  function genLL(r) { return ['fe80', '0000', '0000', '0000', pad4(h4(r)), pad4(h4(r)), '0000', pad4(1 + ri(r, 0xfffe))].join(':'); }
  function genULA(r) { return ['fd' + ('0' + ri(r, 256).toString(16)).slice(-2), pad4(h4(r)), '0000', '0000', '0000', '0000', '0000', pad4(1 + ri(r, 0xfffe))].join(':'); }
  function genMC(r) { return ['ff02', '0000', '0000', '0000', '0000', '0000', '0000', pad4(pick(r, [1, 2, 5, 0xfb, 0x101]))].join(':'); }
  function anyAddr(r) { return pick(r, [genGUA, genLL, genULA, genMC])(r); }

  function build(r, lvl) {
    var kinds = lvl === 'L' ? ['compress', 'type'] : lvl === 'M' ? ['compress', 'expand', 'type', 'prefix'] : ['expand', 'eui64', 'prefix', 'type'];
    var kind = pick(r, kinds);
    if (kind === 'compress') { var full = anyAddr(r); return { kind: 'compress', given: full, ans: compress(full) }; }
    if (kind === 'expand') { var full2 = anyAddr(r); return { kind: 'expand', given: compress(full2), ans: expand(full2) }; }
    if (kind === 'type') { var a = (lvl === 'L' ? pick(r, [genGUA, genLL, genMC]) : anyAddr)(r); return { kind: 'type', given: compress(a), ans: typeOf(a).key, ansName: typeOf(a).name }; }
    if (kind === 'prefix') { var a2 = genGUA(r), p = pick(r, [48, 64, 56]); return { kind: 'prefix', given: compress(a2), plen: p, ans: netPrefix(a2, p) }; }
    // eui64
    var mac = randMac(r), pre = pick(r, ['2001:db8:acad:1::/64', '2001:db8:0:a::/64', 'fe80::/64']);
    var iid = eui64(mac);
    var full3 = expand(pre.split('/')[0]).split(':').slice(0, 4).concat(iid.split(':')).join(':');
    return { kind: 'eui64', mac: mac, prefix: pre, iid: iid, ans: compress(full3) };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 6011) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }

  G.IP6 = { LVNAME: LVNAME, TYPES: TYPES, expand: expand, compress: compress, typeOf: typeOf, eui64: eui64, netPrefix: netPrefix, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
