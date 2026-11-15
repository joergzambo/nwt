/* NWT · IP-Services: Static NAT und Portweiterleitung. Übersetzung eingehender Pakete, Rückweg, Proxy ARP.
   Browser: window.SN · Node: globalThis.SN */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function shuffle(r, a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- Modell ----------
   Einträge: {type:'nat', local, global}                      1:1, alle Ports
             {type:'pf',  local, lport, global, gport}        Portweiterleitung (static PAT, tcp)
   Eingehend: Portweiterleitung (genauer Treffer) vor 1:1; sonst verworfen. */
function inbound(entries, ip, port) {
  var i, e;
  for (i = 0; i < entries.length; i++) { e = entries[i]; if (e.type === 'pf' && e.global === ip && e.gport === port) return {ip: e.local, port: e.lport, entry: i}; }
  for (i = 0; i < entries.length; i++) { e = entries[i]; if (e.type === 'nat' && e.global === ip) return {ip: e.local, port: port, entry: i}; }
  return null;
}
/* Antwort des Servers (Quelle local:port) -> Quelle nach der Übersetzung */
function outbound(entries, ip, port) {
  var i, e;
  for (i = 0; i < entries.length; i++) { e = entries[i]; if (e.type === 'pf' && e.local === ip && e.lport === port) return {ip: e.global, port: e.gport, entry: i}; }
  for (i = 0; i < entries.length; i++) { e = entries[i]; if (e.type === 'nat' && e.local === ip) return {ip: e.global, port: port, entry: i}; }
  return null;
}
/* Wer antwortet auf ARP nach ip im WAN-Netz? 'own' = eigenes Interface, 'proxy' = Proxy ARP für NAT-Adresse, 'none' */
function arpAnswer(wanIp, entries, ip) {
  if (ip === wanIp) return 'own';
  for (var i = 0; i < entries.length; i++) if (entries[i].global === ip) return 'proxy';
  return 'none';
}
function cmd(e) {
  return e.type === 'nat' ? 'ip nat inside source static ' + e.local + ' ' + e.global
    : 'ip nat inside source static tcp ' + e.local + ' ' + e.lport + ' ' + e.global + ' ' + e.gport;
}

/* ---------- Generator ---------- */
var PFS = [[80, 80], [443, 443], [8080, 80], [8443, 443], [2222, 22], [25, 25], [8081, 80], [3390, 3389]];   /* [gport, lport] */
function build(r, lvl) {
  var net = '192.168.' + ri(r, 1, 250) + '.', b = 8 * ri(r, 1, 30), wp = '203.0.113.';
  var wan = wp + (b + 2), isp = wp + (b + 1), nS = lvl === 'L' ? 1 : lvl === 'M' ? 2 : 3, servers = [], seen = {};
  while (servers.length < nS) { var h = ri(r, 10, 250); if (!seen[h]) { seen[h] = 1; servers.push({name: 'Server ' + 'ABC'[servers.length], ip: net + h}); } }
  var entries = [], pfs = shuffle(r, PFS.slice());
  function nat(s, k) { entries.push({type: 'nat', local: servers[s].ip, global: wp + (b + 3 + k), server: s}); }
  function pf(s, k) { entries.push({type: 'pf', local: servers[s].ip, lport: pfs[k][1], global: wan, gport: pfs[k][0], server: s}); }
  if (lvl === 'L') { if (r() < 0.5) nat(0, 0); else pf(0, 0); }
  else if (lvl === 'M') { nat(0, ri(r, 0, 1)); pf(1, 0); }
  else { nat(0, ri(r, 0, 1)); pf(1, 0); pf(2, 1); }
  var free = wp + (b + 6);
  /* eingehende Pakete */
  var kinds = [];
  entries.forEach(function (e, i) { kinds.push({hit: i}); });
  var hasPf = entries.some(function (e) { return e.type === 'pf'; }), misses = [];
  if (hasPf) misses.push('port');
  misses.push('addr');
  if (lvl === 'L') kinds.push({miss: pick(r, misses)}); else { kinds.push({miss: misses[0]}); if (lvl === 'S') kinds.push({miss: 'addr'}); }
  shuffle(r, kinds);
  var nP = lvl === 'L' ? 2 : 3; kinds = kinds.slice(0, nP);
  if (!kinds.some(function (k) { return k.hit != null; })) kinds[0] = {hit: 0};
  var usedG = {}; entries.forEach(function (e) { if (e.type === 'pf') usedG[e.gport] = 1; });
  var pkts = kinds.map(function (k) {
    var src = '198.51.100.' + ri(r, 2, 254) + ':' + ri(r, 49152, 65535), ip, port;
    if (k.hit != null) { var e = entries[k.hit]; ip = e.global; port = e.type === 'pf' ? e.gport : pick(r, [80, 443, 22, 25, 3389]); }
    else if (k.miss === 'port') { ip = wan; do { port = pick(r, [22, 23, 80, 443, 3389, 8080, 21]); } while (usedG[port]); }
    else { ip = free; port = pick(r, [80, 443, 22]); }
    var res = inbound(entries, ip, port);
    return {src: src, ip: ip, port: port, res: res, to: res ? res.ip + ':' + res.port : null};
  });
  /* Antwortmöglichkeiten je Paket */
  pkts.forEach(function (p) {
    var set = {};
    if (p.to) set[p.to] = 1;
    servers.forEach(function (s) { set[s.ip + ':' + p.port] = 1; });
    entries.forEach(function (e) { if (e.type === 'pf') set[e.local + ':' + e.lport] = 1; });
    var all = shuffle(r, Object.keys(set).filter(function (x) { return x !== p.to; })).slice(0, 3);
    if (p.to) all.push(p.to);
    p.opts = shuffle(r, all);
  });
  /* Rückweg */
  var hits = pkts.filter(function (p) { return p.res; }), hp = pick(r, hits), ob = outbound(entries, hp.res.ip, hp.res.port);
  var back = {from: hp.to, client: hp.src, want: ob.ip + ':' + ob.port};
  var bs = {}; bs[back.want] = 1; bs[hp.to] = 1; bs[wan + ':' + hp.res.port] = 1; bs[ob.ip + ':' + hp.res.port] = 1; bs[wan + ':' + hp.port] = 1;
  back.opts = shuffle(r, Object.keys(bs));
  /* Proxy ARP */
  var ac = [wan, free]; entries.forEach(function (e) { if (e.type === 'nat') ac.push(e.global, e.global); });
  var aip = pick(r, ac), arp = {ip: aip, want: arpAnswer(wan, entries, aip)};
  return {net: net + '0/24', wan: wan, isp: isp, mask: '/29', free: free, servers: servers, entries: entries, pkts: pkts, back: back, arp: arp};
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 4409) >>> 0);
  var s = build(r, lvl);
  s.level = lvl; s.code = lvl + '-' + seed;
  return s;
}
G.SN = {LVNAME: LVNAME, inbound: inbound, outbound: outbound, arpAnswer: arpAnswer, cmd: cmd, makeTask: makeTask, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
