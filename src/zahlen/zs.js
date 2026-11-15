/* NWT · Grundlagen: Zahlensysteme. Umrechnen, Rechenwege, Aufgaben-Generator.
   Browser: window.ZS · Node: globalThis.ZS */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
var BNAME = {2: 'Binär', 8: 'Oktal', 10: 'Dezimal', 16: 'Hexadezimal'};
var DIG = '0123456789ABCDEF';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }

/* Ziffernliste (höchste Stelle zuerst) einer Zahl n >= 0 zur Basis b */
function digits(n, b) { if (n === 0) return [0]; var d = []; while (n > 0) { d.unshift(n % b); n = Math.floor(n / b); } return d; }
function toStr(n, b) { return digits(n, b).map(function (x) { return DIG[x]; }).join(''); }
/* Text in Zahl; null wenn ungültig */
function parse(s, b) {
  s = String(s).trim().toUpperCase().replace(/[\s_]/g, '');
  if (b === 16) s = s.replace(/^0X/, ''); if (b === 2) s = s.replace(/^0B/, '');
  if (!s.length || s.length > 40) return null;
  var n = 0;
  for (var i = 0; i < s.length; i++) { var v = DIG.indexOf(s[i]); if (v < 0 || v >= b) return null; n = n * b + v; }
  return n > 4294967295 ? null : n;
}
/* Restmethode: [{n, q, rest}] */
function divSteps(n, b) { var s = []; if (n === 0) return [{n: 0, q: 0, rest: 0}]; while (n > 0) { s.push({n: n, q: Math.floor(n / b), rest: n % b}); n = Math.floor(n / b); } return s; }
/* Stellenwert-Zerlegung: [{d, w, p}] */
function places(n, b) { var d = digits(n, b), L = d.length; return d.map(function (x, i) { return {d: x, p: L - 1 - i, w: Math.pow(b, L - 1 - i)}; }); }
/* Gruppen für Bin<->Hex/Okt (k = 4 oder 3), von rechts aufgefüllt */
function groups(n, k) { var s = toStr(n, 2); while (s.length % k) s = '0' + s; var g = []; for (var i = 0; i < s.length; i += k) g.push(s.slice(i, i + k)); return g; }

/* ---------- Generator: 4 Umrechnungen je Aufgabe ---------- */
var PAIRS = {
  L: [[10, 2], [2, 10], [10, 2], [2, 10], [10, 16], [16, 10]],
  M: [[10, 2], [2, 10], [10, 16], [16, 10], [2, 16], [16, 2], [10, 8], [8, 10]],
  S: [[10, 2], [2, 16], [16, 2], [10, 16], [16, 10], [2, 8], [8, 2], [8, 16], [16, 8], [10, 8]]
};
function range(lvl, from, to) {
  if (lvl === 'L') return [1, 255];
  if (lvl === 'M') return (from === 2 || to === 2) ? [16, 1023] : [16, 4095];
  return (from === 2 || to === 2) ? [256, 65535] : [256, 1048575];
}
function build(r, lvl) {
  var items = [], used = {}, P = PAIRS[lvl];
  while (items.length < 4) {
    var pr = pick(r, P), key = pr.join('-');
    if (used[key] && Object.keys(used).length < P.length) continue;
    used[key] = 1;
    var rg = range(lvl, pr[0], pr[1]), n = ri(r, rg[0], rg[1]);
    items.push({from: pr[0], to: pr[1], n: n, q: toStr(n, pr[0]), a: toStr(n, pr[1])});
  }
  return {items: items};
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 1213) >>> 0);
  var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
}
G.ZS = {LVNAME: LVNAME, BNAME: BNAME, digits: digits, toStr: toStr, parse: parse, divSteps: divSteps, places: places, groups: groups, makeTask: makeTask, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
