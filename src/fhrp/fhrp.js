/* NWT · IP-Services: FHRP (HSRP und VRRP). Wahl, Preempt, Tracking, virtuelle MAC, Aufgaben-Generator.
   Browser: window.FH · Node: globalThis.FH */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function hex(n, w) { var s = n.toString(16); while (s.length < w) s = '0' + s; return s; }

/* virtuelle MAC (Cisco-Schreibweise) */
function vmac(proto, g, ver) {
  if (proto === 'VRRP') return '0000.5e00.01' + hex(g, 2);
  if (ver === 2) return '0000.0c9f.f' + hex(g, 3);
  return '0000.0c07.ac' + hex(g, 2);
}
function ipNum(ip) { return ip.split('.').reduce(function (a, b) { return a * 256 + (+b); }, 0); }

/* ---------- Simulation ----------
   R: [{name, ip, prio, pre, dec, trk}]  (dec = Abzug, trk = 'if' Interface-Tracking | 'sla' IP SLA | '' keins)
   Interface-Tracking merkt nur, wenn Gi0/1 selbst ausfällt. IP SLA (Ping zum Provider) merkt auch Störungen dahinter.
   Regeln: Wahl = höchste (effektive) Priorität, bei Gleichstand höchste IP.
   Fällt der Aktive aus, übernimmt der beste verbleibende Router.
   Nach jedem Ereignis: Ein Router mit Preempt und HÖHERER effektiver Priorität als der Aktive übernimmt. */
function simulate(R, events) {
  var up = R.map(function () { return true; }), link = R.map(function () { return true; }), isp = R.map(function () { return true; });
  function down(i) { return R[i].trk === 'if' ? !link[i] : R[i].trk === 'sla' ? (!link[i] || !isp[i]) : false; }
  function eff(i) { return R[i].prio - (R[i].dec && down(i) ? R[i].dec : 0); }
  function best(cands) { return cands.reduce(function (b, i) { return b < 0 || eff(i) > eff(b) || (eff(i) === eff(b) && ipNum(R[i].ip) > ipNum(R[b].ip)) ? i : b; }, -1); }
  function ups() { var a = []; for (var i = 0; i < R.length; i++) if (up[i]) a.push(i); return a; }
  var act = best(ups()), hist = [{active: act, eff: R.map(function (x, i) { return eff(i); })}];
  events.forEach(function (ev) {
    var i = ev.r;
    if (ev.t === 'fail') { up[i] = false; if (act === i) act = best(ups()); }
    if (ev.t === 'back') up[i] = true;
    if (ev.t === 'linkdown') link[i] = false;
    if (ev.t === 'linkup') link[i] = true;
    if (ev.t === 'ispdown') isp[i] = false;
    if (ev.t === 'ispup') isp[i] = true;
    var pre = ups().filter(function (j) { return j !== act && R[j].pre && eff(j) > eff(act); });
    if (pre.length) act = best(pre);
    hist.push({active: act, eff: R.map(function (x, k) { return eff(k); })});
  });
  return hist;
}

/* ---------- Generator ---------- */
function build(r, lvl) {
  var proto = lvl === 'S' && r() < 0.25 ? 'VRRP' : 'HSRP', ver = proto === 'HSRP' && lvl === 'S' && r() < 0.4 ? 2 : 1;
  var g = lvl === 'L' ? ri(r, 1, 30) : ri(r, 1, 255), net = '192.168.' + ri(r, 1, 250) + '.', vip = net + pick(r, [1, 254]);
  var n = lvl === 'S' && r() < 0.4 ? 3 : 2, R = [], used = {};
  for (var i = 0; i < n; i++) {
    var h; do { h = ri(r, 2, 250); } while (used[h] || net + h === vip); used[h] = 1;
    var prio = lvl === 'L' ? (i === 0 ? pick(r, [100, 105, 110, 120, 150]) : 100) : pick(r, [90, 100, 100, 105, 110, 120, 150, 200]);
    var defPre = proto === 'VRRP';
    var pre = lvl === 'L' ? defPre : r() < 0.5;
    R.push({name: 'R' + (i + 1), ip: net + h, prio: prio, pre: pre, dec: 0, trk: ''});
  }
  /* Ereignisse */
  var h0 = simulate(R, []), a0 = h0[0].active, other = R.map(function (x, k) { return k; }).filter(function (k) { return k !== a0; }), ev;
  if (lvl === 'L') ev = [{t: 'fail', r: a0}];
  else if (lvl === 'M') ev = pick(r, [[{t: 'fail', r: a0}, {t: 'back', r: a0}], [{t: 'fail', r: a0}], [{t: 'fail', r: a0}, {t: 'back', r: a0}]]);
  else {
    var k = pick(r, [0, 1, 2, 3, 3, 4, 5]), dec = pick(r, [10, 20, 30, 60]);
    if (k === 0) { R[a0].dec = dec; R[a0].trk = pick(r, ['if', 'sla']); ev = [{t: 'linkdown', r: a0}]; }
    else if (k === 1) { R[a0].dec = dec; R[a0].trk = pick(r, ['if', 'sla']); ev = [{t: 'linkdown', r: a0}, {t: 'linkup', r: a0}]; }
    else if (k === 2) ev = [{t: 'fail', r: a0}, {t: 'back', r: a0}];
    else if (k === 3) { R[a0].dec = dec; R[a0].trk = 'sla'; ev = [{t: 'ispdown', r: a0}]; }
    else if (k === 4) { R[a0].dec = dec; R[a0].trk = 'if'; ev = [{t: 'ispdown', r: a0}]; }   /* Falle: Interface-Tracking merkt nichts */
    else { R[a0].dec = dec; R[a0].trk = 'sla'; ev = [{t: 'ispdown', r: a0}, {t: 'ispup', r: a0}]; }
  }
  var hist = simulate(R, ev);
  /* Gleichstände bei Preempt-Entscheidungen vermeiden (sonst Regenerierung) */
  for (var s = 1; s < hist.length; s++) {
    var e = hist[s].eff, act = hist[s - 1].active;
    for (var j = 0; j < R.length; j++) if (j !== act && e[j] === e[act]) return null;
  }
  return {proto: proto, ver: ver, g: g, vip: vip, R: R, events: ev, hist: hist, mac: vmac(proto, g, ver), isp: '203.0.113.' + ri(r, 1, 6)};
}
function macOpts(t) {
  var s = {}; s[t.mac] = 1;
  s[vmac(t.proto === 'HSRP' ? 'VRRP' : 'HSRP', t.g, 1)] = 1;
  s[t.proto === 'VRRP' ? '0000.5e00.01' + String(t.g).padStart(2, '0').slice(-2) : t.ver === 2 ? '0000.0c9f.f' + String(t.g).padStart(3, '0').slice(-3) : '0000.0c07.ac' + String(t.g).padStart(2, '0').slice(-2)] = 1;
  if (t.proto === 'HSRP') s[vmac('HSRP', t.g, t.ver === 2 ? 1 : 2)] = 1;
  else s['0000.0c07.ac' + hex(t.g, 2)] = 1;
  var g2 = (t.g + 1) % 256; s[vmac(t.proto, g2 || 2, t.ver)] = 1;
  return Object.keys(s);
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 3319) >>> 0), s = null, tries = 0;
  while (!s && tries++ < 50) s = build(r, lvl);
  var o = macOpts(s), k, sh = [];
  for (k = 0; k < o.length && sh.length < 4; k++) if (sh.indexOf(o[k]) < 0) sh.push(o[k]);
  for (k = sh.length - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)), x = sh[k]; sh[k] = sh[j]; sh[j] = x; }
  s.macOpts = sh; s.level = lvl; s.code = lvl + '-' + seed;
  return s;
}
function config(t, i) {
  var x = t.R[i], g = t.g, L = ['interface Gi0/0', ' ip address ' + x.ip + ' 255.255.255.0'];
  if (t.proto === 'HSRP') {
    if (t.ver === 2) L.push(' standby version 2');
    L.push(' standby ' + g + ' ip ' + t.vip);
    if (x.prio !== 100) L.push(' standby ' + g + ' priority ' + x.prio);
    if (x.pre) L.push(' standby ' + g + ' preempt');
    if (x.dec) L.push(' standby ' + g + ' track 1 decrement ' + x.dec);
  } else {
    L.push(' vrrp ' + g + ' ip ' + t.vip);
    if (x.prio !== 100) L.push(' vrrp ' + g + ' priority ' + x.prio);
    if (!x.pre) L.push(' no vrrp ' + g + ' preempt');
    if (x.dec) L.push(' vrrp ' + g + ' track 1 decrement ' + x.dec);
  }
  if (x.dec && x.trk === 'if') L.unshift('track 1 interface Gi0/1 line-protocol', '!');
  if (x.dec && x.trk === 'sla') L.unshift('ip sla 1', ' icmp-echo ' + t.isp + ' source-interface Gi0/1', ' frequency 5', 'ip sla schedule 1 life forever start-time now', 'track 1 ip sla 1 reachability', '!');
  return L.join('\n');
}
G.FH = {LVNAME: LVNAME, vmac: vmac, simulate: simulate, makeTask: makeTask, config: config, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
