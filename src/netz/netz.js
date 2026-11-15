/* NWT · Grundlagen: Netzadresse berechnen. UND-Verknüpfung, gleiches Netz?, Gateway-Check, Aufgaben-Generator.
   Browser: window.NA · Node: globalThis.NA */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }

/* ---------- Rechnen (Oktett für Oktett, ohne 32-Bit-Vorzeichenprobleme) ---------- */
function octs(ip) { return ip.split('.').map(Number); }
function isIp(s) { return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && octs(s).every(function (o) { return o <= 255; }); }
function maskOf(p) { var m = []; for (var i = 0; i < 4; i++) { var b = Math.max(0, Math.min(8, p - 8 * i)); m.push(256 - Math.pow(2, 8 - b)); } return m.join('.'); }
function prefixOf(mask) {   /* null, wenn keine gültige Maske */
  var bits = octs(mask).map(function (o) { return ('0000000' + o.toString(2)).slice(-8); }).join('');
  return /^1*0*$/.test(bits) ? bits.indexOf('0') < 0 ? 32 : bits.indexOf('0') : null;
}
function and(ip, mask) { var a = octs(ip), m = octs(mask); return a.map(function (o, i) { return o & m[i]; }).join('.'); }
function bcast(ip, mask) { var a = octs(ip), m = octs(mask); return a.map(function (o, i) { return (o & m[i]) | (255 - m[i]); }).join('.'); }
function n2ip(n) { return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.'); }
function ip2n(ip) { return octs(ip).reduce(function (a, b) { return a * 256 + b; }, 0); }
function bin8(o) { return ('0000000' + o.toString(2)).slice(-8); }
/* das „interessante“ Oktett: erstes, dessen Masken-Oktett weder 255 noch 0 ist (sonst -1) */
function keyOctet(mask) { var m = octs(mask); for (var i = 0; i < 4; i++) if (m[i] !== 255 && m[i] !== 0) return i; return -1; }

/* ---------- Generator ---------- */
function prefixFor(r, lvl) {
  if (lvl === 'L') return pick(r, [8, 16, 24, 24]);
  if (lvl === 'M') return ri(r, 25, 30);
  return pick(r, [9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23]);
}
function firstOctet(r) {
  var x = r();
  if (x < 0.15) return 10;
  if (x < 0.25) return ri(r, 172, 172);
  if (x < 0.35) return 192;
  var f; do { f = ri(r, 1, 223); } while (f === 127 || f === 100 || f === 169); return f;
}
function randHost(r, net, p) {   /* zufälliger Host (nicht Netz-, nicht Broadcast-Adresse) */
  var size = Math.pow(2, 32 - p), base = ip2n(net);
  return n2ip(base + ri(r, 1, size - 2));
}
function startIp(r, p) {
  var f = firstOctet(r), rest = [ri(r, 0, 255), ri(r, 0, 255), ri(r, 0, 255)];
  if (f === 172 && p >= 12) rest[0] = ri(r, 16, 31);
  if (f === 192 && p >= 16) rest[0] = 168;
  var ip = [f].concat(rest).join('.'), m = maskOf(p);
  return randHost(r, and(ip, m), p);
}
function okBlock(n) { var f = Math.floor(n / 16777216); return f >= 1 && f <= 223 && f !== 127 && f !== 100 && f !== 169; }
/* ein Nachbarnetz in der Nähe (±1..3 Blöcke) */
function nearNet(r, net, p) {
  var size = Math.pow(2, 32 - p), base = ip2n(net), cand = [];
  for (var d = -3; d <= 3; d++) if (d && okBlock(base + d * size) && okBlock(base + d * size + size - 1)) cand.push(d);
  var d2 = Math.abs(pick(r, cand)) === 1 || r() < 0.5 ? pick(r, cand.filter(function (x) { return Math.abs(x) === 1; }).concat(cand)) : pick(r, cand);
  return n2ip(base + d2 * size);
}
function build(r, lvl) {
  /* Teil a: Netzadresse aus den IP-Einstellungen, Gateway-Check */
  var p1 = prefixFor(r, lvl), m1 = maskOf(p1), ip = startIp(r, p1), net = and(ip, m1), gw, gwOk = r() >= 0.3;
  if (gwOk) {
    var c = r(); gw = c < 0.4 ? n2ip(ip2n(net) + 1) : c < 0.6 ? n2ip(ip2n(bcast(ip, m1)) - 1) : randHost(r, net, p1);
    if (gw === ip) gw = n2ip(ip2n(net) + (ip === n2ip(ip2n(net) + 1) ? 2 : 1));
  } else {
    /* knapp daneben: Host in einem Nachbarnetz, letztes Oktett ähnlich wie gültige Gateways */
    var nn = nearNet(r, net, p1), size = Math.pow(2, 32 - p1);
    gw = r() < 0.5 && size > 2 ? n2ip(ip2n(nn) + 1) : randHost(r, nn, p1);
  }
  /* Teil b: gleiches Netz? */
  var p2 = prefixFor(r, lvl), m2 = maskOf(p2), a = startIp(r, p2), na = and(a, m2), same = r() < 0.5, b;
  if (same) { do { b = randHost(r, na, p2); } while (b === a && p2 < 31); }
  else b = randHost(r, nearNet(r, na, p2), p2);
  return {
    d: {ip: ip, mask: m1, p: p1, gw: gw, net: net, bc: bcast(ip, m1), gwNet: and(gw, m1), gwOk: and(gw, m1) === net && gw !== net && gw !== bcast(ip, m1)},
    q: {a: a, b: b, mask: m2, p: p2, na: na, nb: and(b, m2), same: na === and(b, m2)}
  };
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 8803) >>> 0);
  var s = build(r, lvl);
  s.level = lvl; s.code = lvl + '-' + seed;
  return s;
}
G.NA = {LVNAME: LVNAME, octs: octs, isIp: isIp, maskOf: maskOf, prefixOf: prefixOf, and: and, bcast: bcast, bin8: bin8, keyOctet: keyOctet, makeTask: makeTask, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
