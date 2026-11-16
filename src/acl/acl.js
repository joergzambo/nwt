/* NWT · Netzwerksicherheit: Access-Listen (Standard und Extended).
   Wildcard-Masken, Auswertung (first match, implicit deny), Platzierung, Aufgaben-Generator.
   Browser: window.ACL · Node: globalThis.ACL */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function shuffle(r, a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- Adressen ---------- */
function octs(ip) { return ip.split('.').map(Number); }
function isIp(s) { return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && octs(s).every(function (o) { return o <= 255; }); }
function wcOfMask(m) { return octs(m).map(function (o) { return 255 - o; }).join('.'); }
function maskOfP(p) { var m = []; for (var i = 0; i < 4; i++) { var b = Math.max(0, Math.min(8, p - 8 * i)); m.push(256 - Math.pow(2, 8 - b)); } return m.join('.'); }
function wcOfP(p) { return wcOfMask(maskOfP(p)); }
/* trifft ip auf base/wc zu? (Bits mit 0 in der Wildcard müssen gleich sein) */
function wmatch(ip, base, wc) { var a = octs(ip), b = octs(base), w = octs(wc); for (var i = 0; i < 4; i++) if (((a[i] ^ b[i]) & ~w[i] & 255) !== 0) return false; return true; }
function range(base, wc) { var b = octs(base), w = octs(wc); return {first: b.map(function (o, i) { return o & ~w[i] & 255; }).join('.'), last: b.map(function (o, i) { return (o & ~w[i] & 255) | w[i]; }).join('.')}; }
var ANY = {a: '0.0.0.0', w: '255.255.255.255'};
function addr(a, w) { return {a: a, w: w}; }
function host(a) { return {a: a, w: '0.0.0.0'}; }
function addrTxt(x) { return x.w === '255.255.255.255' ? 'any' : x.w === '0.0.0.0' ? 'host ' + x.a : x.a + ' ' + x.w; }
function amatch(ip, x) { return wmatch(ip, x.a, x.w); }

/* ---------- Zeilen ----------
   std: {act, src}
   ext: {act, proto: ip|tcp|udp|icmp, src, dst, op: null|{k: eq|neq|lt|gt|range, p, p2}, icmp: null|'echo'|'echo-reply'}
   Paket: {src, dst, proto: tcp|udp|icmp, port, icmp} */
var PORTNAME = {20: 'ftp-data', 21: 'ftp', 22: '22', 23: 'telnet', 25: 'smtp', 53: 'domain', 69: 'tftp', 80: 'www', 110: 'pop3', 143: '143', 161: 'snmp', 443: '443', 3389: '3389'};
function portOk(op, p) {
  if (!op) return true;
  if (op.k === 'eq') return p === op.p; if (op.k === 'neq') return p !== op.p;
  if (op.k === 'lt') return p < op.p; if (op.k === 'gt') return p > op.p;
  return p >= op.p && p <= op.p2;
}
function lineTxt(l, num, std) {
  if (std) return 'access-list ' + num + ' ' + l.act + ' ' + (l.src.w === '255.255.255.255' ? 'any' : l.src.w === '0.0.0.0' ? 'host ' + l.src.a : l.src.a + ' ' + l.src.w);
  var s = 'access-list ' + num + ' ' + l.act + ' ' + l.proto + ' ' + addrTxt(l.src) + ' ' + addrTxt(l.dst);
  if (l.op) s += ' ' + l.op.k + ' ' + l.op.p + (l.op.k === 'range' ? ' ' + l.op.p2 : '');
  if (l.icmp) s += ' ' + l.icmp;
  if (l.est) s += ' established';
  return s;
}
/* Detail-Prüfung einer Zeile: {proto, src, dst, port, all} */
function check(l, pk, std) {
  if (std) { var m = amatch(pk.src, l.src); return {src: m, all: m}; }
  var c = {proto: l.proto === 'ip' || l.proto === pk.proto, src: amatch(pk.src, l.src), dst: amatch(pk.dst, l.dst)};
  c.port = (l.proto === 'tcp' || l.proto === 'udp') ? portOk(l.op, pk.port) : true;
  c.icmp = l.proto === 'icmp' && l.icmp ? pk.icmp === l.icmp : true;
  c.all = c.proto && c.src && c.dst && c.port && c.icmp;
  return c;
}
function evaluate(lines, pk, std) {
  for (var i = 0; i < lines.length; i++) if (check(lines[i], pk, std).all) return {act: lines[i].act, line: i};
  return {act: 'deny', line: -1};
}

/* ---------- Topologie (wie Arbeitsblatt „Access List Placement“) ---------- */
var TOPO = {
  routers: {A: [300, 120], B: [450, 58], C: [610, 130], D: [210, 350], E: [360, 505], F: [575, 505]},
  links: [['A', 'S0', 'B', 'S1'], ['B', 'S0', 'C', 'S1'], ['A', 'S1', 'D', 'S1'], ['D', 'S0', 'E', 'S1'], ['E', 'S0', 'F', 'S1']],
  lans: [
    {r: 'A', ifc: 'E0', hosts: ['Ricky', 'Jenny']},
    {r: 'C', ifc: 'FA1', hosts: ['George', 'Carrol', 'Amanda', 'Kathy']},
    {r: 'D', ifc: 'E0', hosts: ['Jeff', 'Jim']},
    {r: 'E', ifc: 'E0', hosts: ['Linda', 'Sarah']},
    {r: 'F', ifc: 'FA1', hosts: ['Jackie', 'Melvin']}
  ]
};
var PEOPLE = []; TOPO.lans.forEach(function (l) { PEOPLE = PEOPLE.concat(l.hosts); });
function lanOf(p) { for (var i = 0; i < TOPO.lans.length; i++) if (TOPO.lans[i].hosts.indexOf(p) >= 0) return TOPO.lans[i]; return null; }
function ifaces(rn) { var a = []; TOPO.links.forEach(function (k) { if (k[0] === rn) a.push(k[1]); if (k[2] === rn) a.push(k[3]); }); TOPO.lans.forEach(function (l) { if (l.r === rn) a.push(l.ifc); }); return a.sort(); }
/* Router-Pfad von Router x nach y (Breitensuche) */
function rpath(x, y) {
  var prev = {}, q = [x], seen = {}; seen[x] = 1;
  while (q.length) { var c = q.shift(); if (c === y) break; TOPO.links.forEach(function (k) { var n = k[0] === c ? k[2] : k[2] === c ? k[0] : null; if (n && !seen[n]) { seen[n] = 1; prev[n] = c; q.push(n); } }); }
  var p = [y]; while (p[0] !== x) p.unshift(prev[p[0]]); return p;
}
/* Standard: nahe am Ziel (Ziel-LAN, outbound). Extended: nahe an der Quelle (Quell-LAN, inbound). */
function placement(src, dst, std) {
  var ls = lanOf(src), ld = lanOf(dst);
  if (ls === ld) return {none: true};
  var L = std ? ld : ls;
  return {router: L.r, ifc: L.ifc, dir: std ? 'out' : 'in'};
}

/* ---------- Generator ---------- */
var NETS = ['192.168.', '10.', '172.16.'];
/* liefert die ersten drei Oktette eines privaten /24-Netzes */
function netOf(r) { var k = ri(r, 0, 2); return k === 0 ? '192.168.' + ri(r, 1, 250) : k === 1 ? '10.' + ri(r, 0, 250) + '.' + ri(r, 0, 255) : '172.' + ri(r, 16, 31) + '.' + ri(r, 0, 255); }
/* Wildcard-Frage */
function genWild(r, lvl) {
  var p = lvl === 'L' ? pick(r, [24, 32, 16]) : lvl === 'M' ? pick(r, [24, 25, 26, 27, 28, 30, 32]) : pick(r, [20, 21, 22, 23, 26, 27, 28, 29]);
  var o = [ri(r, 1, 223), ri(r, 0, 255), ri(r, 0, 255), ri(r, 0, 255)]; if (o[0] === 127) o[0] = 10;
  var m = octs(maskOfP(p)), base = o.map(function (x, i) { return x & m[i]; }).join('.');
  if (p === 32) base = o.join('.');
  var wc = wcOfP(p), rg = range(base, wc);
  return {base: base, wc: wc, p: p, first: rg.first, last: rg.last, txt: p === 32 ? 'host ' + base : base + ' ' + wc};
}
/* Standard-ACL + Testquellen */
function genStd(r, lvl) {
  var n1 = netOf(r), n2 = netOf(r); while (n2 === n1) n2 = netOf(r);
  var lines = [], a1 = n1 + '.' + ri(r, 0, 255), sub1 = a1.split('.').slice(0, 3).join('.');
  var h = sub1 + '.' + ri(r, 2, 250), net24 = addr(sub1 + '.0', '0.0.0.255');
  if (lvl === 'L') { lines = [{act: 'deny', src: host(h)}, {act: 'permit', src: net24}]; if (r() < 0.5) lines.push({act: 'permit', src: ANY}); }
  else {
    var p = pick(r, [25, 26, 27, 28]), m = octs(maskOfP(p)), b4 = ri(r, 0, 255) & m[3], sub = addr(sub1 + '.' + b4, wcOfP(p));
    var h2 = sub1 + '.' + (b4 + ri(r, 1, Math.pow(2, 32 - p) - 2));
    lines = [{act: 'deny', src: host(h2)}, {act: 'permit', src: sub}, {act: pick(r, ['deny', 'permit']), src: net24}];
    if (lvl === 'S') { lines = shuffle(r, lines); lines.splice(ri(r, 0, lines.length), 0, {act: pick(r, ['permit', 'deny']), src: addr(n2 + '.0', '0.0.0.255')}); }
    if (r() < 0.5) lines.push({act: pick(r, ['permit', 'deny']), src: ANY});
  }
  /* Testquellen: je Zeile eine passende, dazu eine fremde */
  var tests = [], used = {};
  function add(ip) { if (!used[ip]) { used[ip] = 1; tests.push(ip); } }
  lines.forEach(function (l) { if (l.src.w === '0.0.0.0') add(l.src.a); else if (l.src.w !== '255.255.255.255') { var rg = range(l.src.a, l.src.w), f = octs(rg.first), la = octs(rg.last), ip = f.map(function (x, i) { return ri(r, x, la[i]); }); if (ip[3] === 0) ip[3] = 1; if (ip[3] === 255) ip[3] = 254; add(ip.join('.')); } });
  add(netOf(r) + '.' + ri(r, 1, 254));
  tests = shuffle(r, tests).slice(0, lvl === 'L' ? 3 : 4);
  return {lines: lines, num: lvl === 'S' && r() < 0.3 ? ri(r, 1300, 1999) : ri(r, 1, 99), tests: tests.map(function (ip) { return {src: ip, res: evaluate(lines, {src: ip}, true)}; })};
}
/* Extended-ACL + Testpakete */
var SVC = [['tcp', 80, 'HTTP'], ['tcp', 443, 'HTTPS'], ['tcp', 22, 'SSH'], ['tcp', 23, 'Telnet'], ['udp', 53, 'DNS'], ['tcp', 25, 'SMTP'], ['tcp', 21, 'FTP'], ['udp', 69, 'TFTP']];
function genExt(r, lvl) {
  var lan = netOf(r), lanA = addr(lan + '.0', '0.0.0.255'), srv = '10.' + ri(r, 0, 250) + '.' + ri(r, 0, 250) + '.' + ri(r, 2, 250), adm = lan + '.' + ri(r, 2, 250);
  var s1 = pick(r, SVC), s2 = pick(r, SVC.filter(function (x) { return x !== s1; })), lines;
  lines = [{act: 'permit', proto: s1[0], src: lanA, dst: host(srv), op: {k: 'eq', p: s1[1]}},
           {act: 'deny', proto: 'icmp', src: ANY, dst: host(srv), icmp: 'echo'}];
  if (lvl !== 'L') lines.splice(ri(r, 0, 2), 0, {act: 'permit', proto: s2[0], src: host(adm), dst: host(srv), op: {k: 'eq', p: s2[1]}});
  if (lvl === 'S') lines.splice(ri(r, 0, lines.length), 0, {act: 'deny', proto: 'tcp', src: lanA, dst: ANY, op: {k: pick(r, ['lt', 'gt', 'eq']), p: pick(r, [1024, 23, 25])}});
  lines.push(r() < 0.5 ? {act: 'permit', proto: 'ip', src: ANY, dst: ANY} : {act: 'deny', proto: 'ip', src: lanA, dst: host(srv)});
  if (lvl === 'L' && lines[lines.length - 1].act === 'deny') lines.pop();
  /* Testpakete */
  var other = netOf(r) + '.' + ri(r, 2, 250), pks = [], seen = {};
  function pk(src, dst, svc) { return svc === 'ping' ? {src: src, dst: dst, proto: 'icmp', icmp: 'echo', port: null, svc: 'Ping'} : {src: src, dst: dst, proto: svc[0], port: svc[1], icmp: null, svc: svc[2]}; }
  var cand = [pk(lan + '.' + ri(r, 2, 250), srv, s1), pk(lan + '.' + ri(r, 2, 250), srv, 'ping'), pk(adm, srv, s2), pk(lan + '.' + ri(r, 2, 250), srv, s2), pk(other, srv, s1), pk(lan + '.' + ri(r, 2, 250), srv, pick(r, SVC)), pk(adm, srv, s1)];
  shuffle(r, cand).forEach(function (p) { var k = p.src + p.proto + p.port + p.icmp; if (!seen[k] && pks.length < (lvl === 'L' ? 3 : 4)) { seen[k] = 1; pks.push(p); } });
  pks.forEach(function (p) { p.res = evaluate(lines, p, false); });
  return {lines: lines, num: lvl === 'S' && r() < 0.3 ? ri(r, 2000, 2699) : ri(r, 100, 199), tests: pks, lan: lan, srv: srv, adm: adm};
}
/* Platzierungsfrage */
function genPlace(r, std) {
  var a = pick(r, PEOPLE), b; do { b = pick(r, PEOPLE); } while (b === a);
  return {src: a, dst: b, act: pick(r, ['permit', 'deny']), ans: placement(a, b, std)};
}
function makeTask(seed, lvl, kind) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + (kind === 'ext' ? 7777 : 3333)) >>> 0), t;
  if (kind === 'ext') t = {acl: genExt(r, lvl), place: genPlace(r, false), build: genBuild(r)};
  else t = {wild: genWild(r, lvl), acl: genStd(r, lvl), place: genPlace(r, true)};
  t.level = lvl; t.code = lvl + '-' + seed; t.kind = kind; return t;
}
/* Zeile zusammenbauen (Extended): Auftrag + richtige Auswahl */
function genBuild(r) {
  var lan = netOf(r), srv = '10.' + ri(r, 0, 250) + '.' + ri(r, 0, 250) + '.' + ri(r, 2, 250), s = pick(r, SVC), act = pick(r, ['permit', 'deny']), who = pick(r, ['net', 'any']);
  var ask = who === 'net' ? 'Das Netz ' + lan + '.0/24 darf ' + (act === 'permit' ? '' : 'nicht ') + 'per ' + s[2] + ' auf den Server ' + srv + ' zugreifen.' : (act === 'permit' ? 'Jeder darf' : 'Niemand darf') + ' per ' + s[2] + ' auf den Server ' + srv + ' zugreifen.';
  return {ask: ask, act: act, proto: s[0], src: who === 'net' ? lan + '.0 0.0.0.255' : 'any', dst: 'host ' + srv, port: 'eq ' + s[1], lan: lan, srv: srv, svc: s};
}
G.ACL = {LVNAME: LVNAME, octs: octs, isIp: isIp, wcOfMask: wcOfMask, maskOfP: maskOfP, wcOfP: wcOfP, wmatch: wmatch, range: range, addrTxt: addrTxt, lineTxt: lineTxt, check: check, evaluate: evaluate,
  TOPO: TOPO, PEOPLE: PEOPLE, lanOf: lanOf, ifaces: ifaces, rpath: rpath, placement: placement, SVC: SVC, makeTask: makeTask, mulberry32: mulberry32, ANY: ANY, host: host, addr: addr};
})(typeof window !== 'undefined' ? window : globalThis);
