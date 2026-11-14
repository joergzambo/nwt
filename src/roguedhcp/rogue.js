/* NWT · Netzwerksicherheit: Rogue-DHCP-Server. Szenario-Modell, Wireshark-Mitschnitt, Aufgaben-Generator.
   Browser: window.RG · Node: globalThis.RG */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function hex(r, n) { var s = ''; for (var i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(r() * 16)]; return s; }
function oui(r) { return pick(r, ['08:00:27', '00:0c:29', '52:54:00', '00:50:56', 'b8:27:eb', '2c:30:33', 'fc:ec:da']) + ':' + hex(r, 2) + ':' + hex(r, 2) + ':' + hex(r, 2); }

/* ---------- Modell ----------
   Netz 192.168.N.0/24. Echter Server .srvHost gibt Gateway .realGw, DNS .realDns.
   Rogue (falls present) sitzt an einem untrusted Port, bietet .rogueGw (meist der Angreifer-PC) als Gateway/DNS.
   race: 'rogue' = Rogue antwortet zuerst (gewinnt im ungeschützten Fall), 'real' = echter Server zuerst.
   defense: 'none' | 'snoop' (Cisco DHCP Snooping, Server-Port trusted) | 'guard' (UniFi DHCP Guarding, Server-IP erlaubt).
   Eine aktive Abwehr verwirft Server-Antworten (Offer/ACK) vom Rogue -> nur der echte Offer erreicht den Client. */
function evaluate(s) {
  var dropRogue = s.rogue && s.defense !== 'none';
  var offersAtClient = 1 + (s.rogue && !dropRogue ? 1 : 0);
  var winner = !s.rogue ? 'real' : dropRogue ? 'real' : (s.race === 'rogue' ? 'rogue' : 'real');
  var gw = winner === 'rogue' ? s.rogueGw : s.realGw, dns = winner === 'rogue' ? s.rogueGw : s.realDns;
  var mitm = winner === 'rogue';
  return {offersAtClient: offersAtClient, winner: winner, gateway: gw, dns: dns, mitm: mitm,
    protected: !s.rogue || s.defense !== 'none', defenseKind: s.defense, dropRogue: dropRogue};
}

/* ---------- Wireshark-Mitschnitt (am gespiegelten Client-Port) ---------- */
function capture(r, s) {
  var rows = [], t = 0, no = 1, bc = 'ff:ff:ff:ff:ff:ff', ev = evaluate(s), xid = '0x' + hex(r, 8);
  function add(src, dst, info, tag) { rows.push({no: no++, t: (t += 0.0004 + r() * 0.003).toFixed(4), src: src, dst: dst, proto: 'DHCP', info: info, tag: tag || ''}); }
  add(s.clientMac, bc, 'DHCP Discover - Transaction ID ' + xid, 'disc');
  /* Offers in Renn-Reihenfolge; Rogue nur, wenn er den Client erreicht */
  var offers = [];
  offers.push({who: 'real', mac: s.realMac, ip: s.net + s.srvHost, gw: s.realGw, order: s.race === 'rogue' ? 1 : 0});
  if (s.rogue && !ev.dropRogue) offers.push({who: 'rogue', mac: s.rogueMac, ip: s.net + s.rogueHost, gw: s.rogueGw, order: s.race === 'rogue' ? 0 : 1});
  offers.sort(function (a, b) { return a.order - b.order; });
  offers.forEach(function (o) { add(o.mac, bc, 'DHCP Offer    - ' + o.ip + '  (Gateway ' + o.gw + ')', o.who); });
  var win = offers[0];
  add(s.clientMac, bc, 'DHCP Request  - Requested ' + (win ? win.ip.replace(/\.\d+$/, '.' + s.clientHost) : ''), 'req');
  add(win.mac, bc, 'DHCP ACK      - ' + win.ip.replace(/\.\d+$/, '.' + s.clientHost) + '  (Gateway ' + win.gw + ')', win.who);
  return rows;
}

/* ---------- Generator ---------- */
function build(r, lvl) {
  var n = ri(r, 1, 60), net = '192.168.' + n + '.';
  var srvHost = pick(r, [1, 2, 10]), realGw = net + '1', realDns = pick(r, [net + '1', '8.8.8.8', '9.9.9.9']);
  if (srvHost === 1) srvHost = 2;
  var rogue = lvl === 'L' ? pick(r, [true, true, false]) : pick(r, [true, true, true, false]);
  var rogueHost = ri(r, 100, 199), rogueGw = net + rogueHost;
  var defense = !rogue ? 'none' : lvl === 'L' ? pick(r, ['none', 'none', 'snoop']) : lvl === 'M' ? pick(r, ['none', 'snoop', 'guard']) : pick(r, ['none', 'snoop', 'guard', 'snoop', 'guard']);
  var s = {
    net: net, srvHost: srvHost, realGw: realGw, realDns: realDns,
    rogue: rogue, rogueHost: rogueHost, rogueGw: rogueGw,
    race: pick(r, ['rogue', 'rogue', 'real']), defense: defense,
    clientHost: ri(r, 50, 99), clientMac: oui(r), realMac: oui(r), rogueMac: oui(r)
  };
  s.res = evaluate(s);
  return s;
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 5519) >>> 0);
  var s = build(r, lvl);
  s.level = lvl; s.code = lvl + '-' + seed;
  return s;
}

G.RG = {LVNAME: LVNAME, evaluate: evaluate, capture: capture, makeTask: makeTask, mulberry32: mulberry32, oui: oui, hex: hex};
})(typeof window !== 'undefined' ? window : globalThis);
