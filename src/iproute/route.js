/* NWT · Routing: show ip route lesen, administrative Distanzen, Routenauswahl. Generator, Zeichnen.
   Browser: window.IR · Node: globalThis.IR */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
/* Protokolle mit Code und administrativer Distanz */
var PROTO = {
  connected: {code: 'C', ad: 0, name: 'Direkt verbunden', mname: '–'},
  static: {code: 'S', ad: 1, name: 'Statische Route', mname: '–'},
  ebgp: {code: 'B', ad: 20, name: 'eBGP', mname: 'Pfadattribute'},
  eigrp: {code: 'D', ad: 90, name: 'EIGRP', mname: 'Composite'},
  ospf: {code: 'O', ad: 110, name: 'OSPF', mname: 'Cost'},
  isis: {code: 'i', ad: 115, name: 'IS-IS', mname: 'Metric'},
  rip: {code: 'R', ad: 120, name: 'RIP', mname: 'Hops'}
};
var LEARN = ['eigrp', 'ospf', 'rip'];        // typische dynamische
var LEARN_S = ['ebgp', 'eigrp', 'ospf', 'isis', 'rip'];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function shuffle(r, a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

function metric(r, proto) {
  if (proto === 'connected' || proto === 'static' || proto === 'ebgp') return 0;
  if (proto === 'eigrp') return ri(r, 2, 400) * 2560 + 25600;
  if (proto === 'ospf') return ri(r, 2, 240);
  if (proto === 'isis') return ri(r, 10, 70);
  return ri(r, 1, 15); // rip
}
/* Gewinner unter mehreren Angeboten fürs selbe Netz: kleinste AD, dann kleinste Metrik */
function winner(offers) {
  return offers.slice().sort(function (a, b) { return PROTO[a.proto].ad - PROTO[b.proto].ad || a.metric - b.metric; })[0];
}

/* ---------- Generator ---------- */
function build(r, lvl) {
  var oct = ri(r, 1, 40), nbrs = lvl === 'L' ? 2 : lvl === 'M' ? 3 : ri(r, 3, 4);
  /* Nachbarn, jeder mit einem Protokoll und einem Next-Hop */
  var learnSet = lvl === 'S' ? LEARN_S : LEARN;
  var protos = shuffle(r, learnSet).slice(0, nbrs);
  var neighbors = protos.map(function (p, i) { return {name: 'R' + (i + 2), proto: p, nh: '10.0.' + ri(r, 0, 9) + '.' + (i * 4 + 1), ifn: 'Gi0/' + i}; });
  var nets = [], used = {}, nDest = lvl === 'L' ? 4 : lvl === 'M' ? 5 : ri(r, 6, 7);
  function newNet() { var n; do { n = '172.' + oct + '.' + ri(r, 1, 250) + '.0'; } while (used[n]); used[n] = 1; return n; }
  /* ein bis zwei direkt verbundene/statische, Rest gelernt – manche über zwei Protokolle */
  var localCount = lvl === 'L' ? 1 : ri(r, 1, 2);
  for (var i = 0; i < nDest; i++) {
    var net = newNet(), offers = [];
    if (i < localCount) {
      var lp = i === 0 ? 'connected' : pick(r, ['connected', 'static']);
      offers.push({proto: lp, metric: 0, nh: lp === 'static' ? neighbors[0].nh : null, ifn: 'Gi0/' + (i + 3), local: true});
      /* Mittel/Schwer: auch gelernt -> C/S schlägt die dynamische (AD 0/1) */
      if (lvl !== 'L' && r() < 0.5) { var pp = pick(r, neighbors); offers.push({proto: pp.proto, metric: metric(r, pp.proto), nh: pp.nh, ifn: pp.ifn}); }
    } else {
      var how = lvl === 'L' ? 1 : (r() < (lvl === 'M' ? 0.5 : 0.65) ? 2 : 1);
      var chosen = shuffle(r, neighbors).slice(0, Math.min(how, neighbors.length));
      chosen.forEach(function (nb) { offers.push({proto: nb.proto, metric: metric(r, nb.proto), nh: nb.nh, ifn: nb.ifn}); });
    }
    /* mehrere Angebote desselben Protokolls (Metrik-Tiebreak) nur Schwer */
    if (lvl === 'S' && offers.length === 1 && !offers[0].local && r() < 0.35) {
      var o0 = offers[0]; offers.push({proto: o0.proto, metric: metric(r, o0.proto), nh: '10.0.9.' + ri(r, 1, 9), ifn: 'Gi0/5'});
    }
    var w = winner(offers), age = (w.proto === 'connected' || w.proto === 'static') ? null : [ri(r,0,9),ri(r,0,59),ri(r,0,59)].map(function(x,i){return (i===0?String(x):('0'+x).slice(-2));}).join(':').replace(/^(\d):/,'0$1:');
    nets.push({net: net, p: 24, offers: offers, win: w, age: age});
  }
  return {router: 'R1', oct: oct, neighbors: neighbors, nets: nets, level: lvl};
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 7103) >>> 0);
  var T = build(r, lvl);
  /* gefragte Netze: alle, aber Reihenfolge nach IP */
  T.nets.sort(function (a, b) { return parseInt(a.net.split('.')[2]) - parseInt(b.net.split('.')[2]); });
  T.code = lvl + '-' + seed;
  return T;
}

/* ---------- show ip route ---------- */
function padEnd(t, n) { t = String(t); while (t.length < n) t += ' '; return t; }
function routeLine(net) {
  var w = net.win, P = PROTO[w.proto], pre = net.net + '/' + net.p, code = padEnd(P.code, 9);
  if (w.proto === 'connected') return code + pre + ' is directly connected, ' + w.ifn;
  if (w.proto === 'static') return code + pre + ' [1/0] via ' + w.nh;
  return code + pre + ' [' + P.ad + '/' + w.metric + '] via ' + w.nh + (net.age ? ', ' + net.age : '') + ', ' + (w.ifn || '');
}
function showRoute(T) {
  var head = 'R1# show ip route\nCodes: C - connected, S - static, R - RIP, D - EIGRP, O - OSPF,\n       i - IS-IS, B - BGP\n\n';
  return head + T.nets.map(routeLine).join('\n');
}

/* ---------- Zeichnen: R1 mit Nachbarn, je Protokoll ---------- */
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
function tx(x, y, t, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" font-size="' + (o.fs || 13) + '" font-weight="' + (o.fw || 400) + '" fill="' + (o.c || '#1c2b33') + '" font-family="' + (o.mono ? 'ui-monospace,Menlo,Consolas,monospace' : 'Open Sans,Arial,sans-serif') + '">' + esc(t) + '</text>'; }
var PCOL = {connected: '#455a64', static: '#455a64', ebgp: '#6a1b9a', eigrp: '#2e7d32', ospf: '#1565c0', isis: '#00838f', rip: '#e65100'};
function rtr(c) { c = c || '#1f5872'; return '<ellipse cx="0" cy="8" rx="26" ry="9" fill="' + c + '"/><rect x="-26" y="-8" width="52" height="16" fill="#2f7392"/><ellipse cx="0" cy="-8" rx="26" ry="9" fill="#5a9dbb" stroke="' + c + '"/><path d="M-13 -8h8M5 -8h8M-1 -14v5M-1 -6v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'; }
function draw(T) {
  var n = T.neighbors.length, W = 760, H = 110 + n * 70, o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="R1 mit Nachbarn">'];
  var r1 = [150, H / 2];
  T.neighbors.forEach(function (nb, i) {
    var y = 70 + i * ((H - 100) / Math.max(1, n - 1)), x = 560, col = PCOL[nb.proto];
    o.push('<line x1="' + r1[0] + '" y1="' + r1[1] + '" x2="' + x + '" y2="' + y + '" stroke="' + col + '" stroke-width="2.6"/>');
    var mx = (r1[0] + x) / 2, my = (r1[1] + y) / 2 - 6;
    o.push('<rect x="' + (mx - 44) + '" y="' + (my - 12) + '" width="88" height="20" rx="10" fill="' + col + '"/>' + tx(mx, my + 3, PROTO[nb.proto].name, {fs: 11.5, fw: 700, c: '#fff'}));
    o.push('<g transform="translate(' + x + ' ' + y + ')">' + rtr() + '</g>' + tx(x + 34, y + 4, nb.name, {a: 'start', fs: 14, fw: 700}) + tx(x + 34, y + 19, nb.nh, {a: 'start', fs: 11, mono: 1, c: '#546e7a'}));
  });
  o.push('<g transform="translate(' + r1[0] + ' ' + r1[1] + ')">' + rtr('#0d3a52') + '</g>' + tx(r1[0], r1[1] - 20, T.router, {fs: 16, fw: 700}) + tx(r1[0], r1[1] + 30, 'lernt dieselben Netze', {fs: 11.5, c: '#546e7a'}) + tx(r1[0], r1[1] + 44, 'über mehrere Protokolle', {fs: 11.5, c: '#546e7a'}));
  o.push('</svg>');
  return o.join('');
}

G.IR = {LVNAME: LVNAME, PROTO: PROTO, winner: winner, makeTask: makeTask, routeLine: routeLine, showRoute: showRoute, draw: draw, metric: metric};
})(typeof window !== 'undefined' ? window : globalThis);
