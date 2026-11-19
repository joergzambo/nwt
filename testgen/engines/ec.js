/* NWT · Switching: EtherChannel mit LACP und PAgP. Modus-Kompatibilität, Port-Parameter, Aufgaben-Generator.
   Browser: window.EC · Node: globalThis.EC */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
var PROTO = {active: 'LACP', passive: 'LACP', desirable: 'PAgP', auto: 'PAgP', on: 'on'};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }

/* Kommt zwischen zwei Modi ein Channel zustande? -> {ok, proto, why} */
function pair(a, b) {
  var pa = PROTO[a], pb = PROTO[b];
  if (pa !== pb) return {ok: false, proto: null, why: a === 'on' || b === 'on' ? 'on verhandelt nicht – die Gegenseite spricht ' + (pa === 'on' ? pb : pa) + '.' : 'LACP und PAgP verstehen sich nicht.'};
  if (pa === 'on') return {ok: true, proto: 'on', why: 'Beide Seiten auf on: Der Channel wird ohne Protokoll fest eingeschaltet.'};
  var start = {active: 1, desirable: 1};
  if (!start[a] && !start[b]) return {ok: false, proto: pa, why: 'Beide warten nur (' + a + '/' + b + ') – keiner fängt an.'};
  return {ok: true, proto: pa, why: (start[a] && start[b] ? 'Beide fangen an.' : 'Eine Seite fängt an (' + (start[a] ? a : b) + '), die andere antwortet.')};
}
/* Ports: [{s1:{speed,mode,vlan}, s2:{...}}], Modi m1,m2 -> Ergebnis */
function evaluate(t) {
  var pr = pair(t.m1, t.m2), ports = t.ports, ref = ports[0], bundled = [], susp = [];
  function same(a, b) { return a.speed === b.speed && a.mode === b.mode && (a.mode === 'trunk' || a.vlan === b.vlan); }
  ports.forEach(function (p, i) {
    var ok = p.s1.speed === p.s2.speed && same(p.s1, ref.s1) && same(p.s2, ref.s2) && same(p.s1, p.s2);
    (ok ? bundled : susp).push(i);
  });
  if (!pr.ok) return {formed: false, proto: pr.proto, why: pr.why, bundled: [], susp: [], bw: 0};
  return {formed: bundled.length > 0, proto: pr.proto, why: pr.why, bundled: bundled, susp: susp, bw: bundled.length * 1000};
}
/* ---------- Generator ---------- */
var MODES = ['active', 'passive', 'desirable', 'auto', 'on'];
function build(r, lvl) {
  var n = lvl === 'L' ? 2 : lvl === 'M' ? pick(r, [2, 3, 4]) : pick(r, [3, 4]), m1, m2, proto = pick(r, ['LACP', 'LACP', 'PAgP']);
  var L = proto === 'LACP' ? ['active', 'passive'] : ['desirable', 'auto'];
  if (lvl === 'L') { m1 = pick(r, L); m2 = pick(r, L); }
  else if (lvl === 'M') { m1 = pick(r, MODES); m2 = r() < 0.6 ? pick(r, L.concat(['on'])) : pick(r, MODES); if (r() < 0.3) m2 = m1; }
  else { m1 = pick(r, L); m2 = pick(r, L); if (m1 !== L[0] && m2 !== L[0]) m1 = L[0]; }
  var mode = pick(r, ['trunk', 'trunk', 'access']), vlan = mode === 'access' ? pick(r, [10, 20, 30, 99]) : 1, ports = [];
  for (var i = 0; i < n; i++) ports.push({s1: {speed: 1000, mode: mode, vlan: vlan}, s2: {speed: 1000, mode: mode, vlan: vlan}});
  if (lvl === 'S') {
    var k = ri(r, 1, n - 1), side = pick(r, ['s1', 's2']), what = pick(r, mode === 'access' ? ['speed', 'vlan', 'mode'] : ['speed', 'mode']);
    if (what === 'speed') ports[k][side].speed = 100;
    if (what === 'vlan') ports[k][side].vlan = pick(r, [10, 20, 30, 99].filter(function (v) { return v !== vlan; }));
    if (what === 'mode') { ports[k][side].mode = mode === 'trunk' ? 'access' : 'trunk'; ports[k][side].vlan = mode === 'trunk' ? pick(r, [10, 20]) : 1; }
    if (what === 'speed') ports[k][side === 's1' ? 's2' : 's1'].speed = 100;   /* Kabel/Gegenstelle auch 100 – sonst kein Link */
  }
  var t = {n: n, m1: m1, m2: m2, ports: ports, grp: ri(r, 1, 12), base: pick(r, [1, 21, 45])};
  t.res = evaluate(t);
  return t;
}
function ifName(t, i) { return 'Gi1/0/' + (t.base + i); }
function config(t, side) {
  var m = side === 's1' ? t.m1 : t.m2, L = [], ps = t.ports.map(function (p) { return p[side]; }), allSame = ps.every(function (p) { return JSON.stringify(p) === JSON.stringify(ps[0]); });
  function body(p) { var b = []; if (p.speed !== 1000) b.push(' speed 100'); b.push(' switchport mode ' + p.mode); if (p.mode === 'access') b.push(' switchport access vlan ' + p.vlan); return b; }
  if (allSame) { L.push('interface range ' + ifName(t, 0) + ' - ' + (t.base + t.n - 1)); L = L.concat(body(ps[0])); L.push(' channel-group ' + t.grp + ' mode ' + m); }
  else ps.forEach(function (p, i) { L.push('interface ' + ifName(t, i)); L = L.concat(body(p)); L.push(' channel-group ' + t.grp + ' mode ' + m); });
  return L.join('\n');
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 5003) >>> 0), t = build(r, lvl);
  t.level = lvl; t.code = lvl + '-' + seed; return t;
}
G.EC = {LVNAME: LVNAME, PROTO: PROTO, MODES: MODES, pair: pair, evaluate: evaluate, config: config, ifName: ifName, makeTask: makeTask, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
