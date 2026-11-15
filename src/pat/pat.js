/* NWT · IP-Services: NAT und PAT. Port-Vergabe, NAT-Tabelle, Aufgaben-Generator.
   Browser: window.PAT · Node: globalThis.PAT */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
var FIRST_FREE = 1024;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }

/* ---------- Modell ----------
   PAT (ip nat inside source ... overload) auf EINE öffentliche Adresse pub.
   Regel (vereinfachtes Cisco-Verhalten): Der Router versucht, den Quellport zu behalten.
   Ist der Port auf pub schon vergeben, nimmt er den ersten freien Port ab 1024.
   conns: [{ip, sport, dip, dport}] in Reihenfolge des Eintreffens.
   Ergebnis: Zeilen {il, ig, ol, og, port} wie in show ip nat translations. */
function translate(pub, conns) {
  var used = {}, rows = [];
  conns.forEach(function (c) {
    var p = c.sport;
    if (used[p]) { p = FIRST_FREE; while (used[p]) p++; }
    used[p] = true;
    rows.push({il: c.ip + ':' + c.sport, ig: pub + ':' + p, ol: c.dip + ':' + c.dport, og: c.dip + ':' + c.dport, port: p, kept: p === c.sport});
  });
  return rows;
}
/* Antwort aus dem Internet an pub:port -> Index der Verbindung oder -1 (verworfen) */
function lookup(rows, port) {
  for (var i = 0; i < rows.length; i++) if (rows[i].port === port) return i;
  return -1;
}

/* ---------- Generator ---------- */
function build(r, lvl) {
  var kind = ri(r, 0, 2), net = kind === 0 ? '192.168.' + ri(r, 1, 250) + '.' : kind === 1 ? '10.' + ri(r, 0, 250) + '.' + ri(r, 0, 250) + '.' : '172.' + ri(r, 16, 31) + '.' + ri(r, 0, 250) + '.';
  var pub = '203.0.113.' + ri(r, 2, 254);
  var nH = lvl === 'L' ? 2 : lvl === 'M' ? 3 : 4, hosts = [], seen = {};
  while (hosts.length < nH) { var h = ri(r, 10, 99); if (!seen[h]) { seen[h] = 1; hosts.push({name: 'PC' + (hosts.length + 1), ip: net + h}); } }
  var nS = lvl === 'S' ? 2 : 1, servers = [], seenS = {};
  while (servers.length < nS) { var o = ri(r, 2, 254); if (!seenS[o]) { seenS[o] = 1; servers.push({name: nS > 1 ? 'Server ' + 'AB'[servers.length] : 'Server', ip: (servers.length ? '192.0.2.' : '198.51.100.') + o, port: pick(r, [80, 443, 443, 22, 25])}); } }
  var conns = [], ports = {};
  function fresh() { var p; do { p = ri(r, 49152, 65535); } while (ports[p]); ports[p] = 1; return p; }
  hosts.forEach(function (h, i) { var s = pick(r, servers); conns.push({host: i, ip: h.ip, sport: fresh(), dip: s.ip, dport: s.port}); });
  /* Kollisionen: gleicher Quellport bei verschiedenen PCs */
  if (lvl === 'M') { var a = ri(r, 0, 1); conns[ri(r, a + 1, 2)].sport = conns[a].sport; }
  if (lvl === 'S') {
    if (r() < 0.5) { conns[1].sport = conns[0].sport; conns[pick(r, [2, 3])].sport = conns[0].sport; }
    else { conns[2].sport = conns[0].sport; conns[3].sport = conns[1].sport; }
  }
  if (lvl === 'L' && r() < 0.35) conns[1].sport = conns[0].sport;
  var rows = translate(pub, conns);
  /* Antwortpaket von außen */
  var rp, unknown = lvl === 'S' ? r() < 0.3 : lvl === 'M' ? r() < 0.15 : false;
  if (unknown) { do { rp = r() < 0.5 ? ri(r, 1024, 1030) : ri(r, 49152, 65535); } while (lookup(rows, rp) >= 0); }
  else { var cand = rows.filter(function (x) { return !x.kept; }); rp = (cand.length && r() < 0.6 ? pick(r, cand) : pick(r, rows)).port; }
  var hit = lookup(rows, rp);
  /* Begriffsfrage */
  var tk = pick(r, ['IL', 'IG', 'OG']), th = pick(r, hosts), ts = pick(r, servers);
  var term = {kind: tk, addr: tk === 'IL' ? th.ip : tk === 'IG' ? pub : ts.ip, accept: tk === 'OG' ? ['OG', 'OL'] : [tk]};
  return {net: net + '0/24', pub: pub, hosts: hosts, servers: servers, conns: conns, rows: rows,
    reply: {port: rp, row: hit, host: hit < 0 ? -1 : conns[hit].host, to: hit < 0 ? null : rows[hit].il}, term: term};
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 2711) >>> 0);
  var s = build(r, lvl);
  s.level = lvl; s.code = lvl + '-' + seed;
  return s;
}

G.PAT = {LVNAME: LVNAME, FIRST_FREE: FIRST_FREE, translate: translate, lookup: lookup, makeTask: makeTask, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
