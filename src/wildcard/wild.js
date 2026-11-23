/* Wildcard-Masken-Trainer: Rätselaufgaben + Treffer-Logik.
   Browser: window.WC · Node: globalThis.WC  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function bin8(n) { var s = (n >>> 0).toString(2); while (s.length < 8) s = '0' + s; return s; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  /* Treffermenge eines Oktetts: v passt, wenn ((v ^ aOct) & ~wOct)==0 */
  function matchOct(aOct, wOct) { var out = []; for (var v = 0; v < 256; v++) if (((v ^ aOct) & (~wOct & 255)) === 0) out.push(v); return out; }

  var SCEN = {
    odd: ['Der Hausmeister darf nur Räume mit <b>ungerader</b> Nummer betreten.', 'Nur die PCs mit <b>ungerader</b> Host-Nummer bekommen das Update.', 'Sperre alle Geräte mit <b>ungerader</b> Adresse.'],
    even: ['Nur die Drucker mit <b>gerader</b> Host-Nummer dürfen ins Internet.', 'Alle Geräte mit <b>gerader</b> Adresse kommen in das Gäste-VLAN.', 'Überwache nur die <b>geraden</b> Hosts.'],
    firsthalf: ['Nur die <b>erste Hälfte</b> des Netzes (Hosts 0–127) darf zugreifen.', 'Die <b>untere Hälfte</b> (0–127) gehört der Technik.'],
    secondhalf: ['Nur die <b>zweite Hälfte</b> des Netzes (Hosts 128–255) wird gefiltert.', 'Die <b>obere Hälfte</b> (128–255) ist für Gäste reserviert.'],
    block: ['Nur die <b>ersten {N}</b> Hosts (0–{END}) dürfen drucken.', 'Reserviere die <b>ersten {N}</b> Adressen (0–{END}) für Server.'],
    blockoff: ['Nur die Hosts <b>{START}–{END}</b> (ein Block von {N}) bekommen Zugriff.', 'Der Block <b>{START}–{END}</b> gehört der Buchhaltung.'],
    stride: ['Nur jede Adresse, die <b>durch {K} teilbar</b> ist (0, {K}, {K2}, …), bekommt ein Update.', 'Wartung nur für Hosts, deren Nummer <b>durch {K} teilbar</b> ist.'],
    subneteven: ['Triff alle /24-Subnetze mit <b>geradem</b> drittem Oktett (…{A}.0, …{B}.0, …).', 'Nur die /24-Netze mit <b>geradem</b> drittem Oktett sollen geroutet werden.'],
    subnetblock: ['Triff die /24-Subnetze <b>{A}–{END}</b> auf einmal (ein Block von {N} Netzen).', 'Fasse die /24-Netze <b>{A}–{END}</b> in einer Zeile zusammen.']
  };

  function build(r, lvl) {
    var A = 10 + ri(r, 2) * 162, B = ri(r, 200), C = ri(r, 200); // z.B. 10.x.x oder 172.x.x
    var types;
    if (lvl === 'L') types = ['odd', 'even', 'firsthalf', 'secondhalf', 'block'];
    else if (lvl === 'M') types = ['block', 'blockoff', 'stride', 'subneteven', 'reverse'];
    else types = ['blockoff', 'stride', 'subnetblock', 'reverse', 'reverse'];
    var type = pick(r, types);
    var octIdx = 3, aOct = 0, wOct = 0, reverse = false, scenKey = type, extra = {};

    if (type === 'odd') { aOct = 1; wOct = 254; }
    else if (type === 'even') { aOct = 0; wOct = 254; }
    else if (type === 'firsthalf') { aOct = 0; wOct = 127; }
    else if (type === 'secondhalf') { aOct = 128; wOct = 127; }
    else if (type === 'block') { var k = 4 + ri(r, 3); var N = 1 << k; aOct = 0; wOct = N - 1; extra = { N: N, START: 0, END: N - 1 }; }
    else if (type === 'blockoff') { var k2 = 3 + ri(r, 3); var N2 = 1 << k2; var j = 1 + ri(r, (256 / N2) - 1); var st = j * N2; aOct = st; wOct = N2 - 1; extra = { N: N2, START: st, END: st + N2 - 1 }; }
    else if (type === 'stride') { var s = 1 + ri(r, 3); var K = 1 << s; aOct = 0; wOct = 255 - (K - 1); extra = { K: K, K2: 2 * K }; }
    else if (type === 'subneteven') { octIdx = 2; aOct = 0; wOct = 254; extra = { A: 0, B: 2 }; }
    else if (type === 'subnetblock') { octIdx = 2; var kb = 2 + ri(r, 3); var Nb = 1 << kb; var jb = ri(r, (256 / Nb)); var stb = jb * Nb; aOct = stb; wOct = Nb - 1; C = stb; extra = { A: stb, END: stb + Nb - 1, N: Nb }; }
    else if (type === 'reverse') { reverse = true; octIdx = pick(r, [3, 3, 3, 2]); var presets = [[1, 254], [0, 254], [0, 127], [128, 127], [0, 15], [0, 7], [0, 3], [0, 252], [0, 248], [64, 63], [32, 31]]; var pr = pick(r, presets); aOct = pr[0]; wOct = pr[1]; }

    // Oktett-Werte in die Adresse einsetzen
    var o = [A, B, C, 0];
    if (octIdx === 3) o[3] = aOct; else { o[2] = aOct; o[3] = 0; }
    var addr = o.join('.');
    var wc = (octIdx === 3) ? ('0.0.0.' + wOct) : ('0.0.' + wOct + '.255');
    var set = matchOct(aOct, wOct);

    // Beschreibung / Lösung
    var desc = describe(aOct, wOct, octIdx, set);
    // Szenariotext
    var scenText;
    if (reverse) scenText = 'Gegeben: <code>' + addr + '  ' + wc + '</code>. Beschreibe, welche ' + (octIdx === 3 ? 'Hosts' : 'Subnetze') + ' getroffen werden (Anzahl + Muster).';
    else { scenText = pick(r, SCEN[scenKey] || ['Finde die passende Wildcard-Maske.']); Object.keys(extra).forEach(function (k) { scenText = scenText.split('{' + k + '}').join(extra[k]); }); }

    return {
      type: type, reverse: reverse, octIdx: octIdx, aOct: aOct, wOct: wOct,
      addr: addr, wc: wc, net: A + '.' + B + '.' + (octIdx === 3 ? C : 'x') + '.0',
      count: set.length, desc: desc, prompt: scenText
    };
  }

  function describe(aOct, wOct, octIdx, set) {
    var unit = octIdx === 3 ? 'Host-Adressen' : '/24-Subnetze';
    // Mustererkennung
    if (wOct === 254 && aOct === 1) return set.length + ' ' + unit + ': alle <b>ungeraden</b> (1, 3, 5, … 255).';
    if (wOct === 254 && aOct === 0) return set.length + ' ' + unit + ': alle <b>geraden</b> (0, 2, 4, … 254).';
    if (wOct === 127 && aOct === 0) return '128 ' + unit + ': <b>0–127</b> (erste Hälfte).';
    if (wOct === 127 && aOct === 128) return '128 ' + unit + ': <b>128–255</b> (zweite Hälfte).';
    // zusammenhängender Block (wOct = 2^k - 1)?
    if (((wOct + 1) & wOct) === 0) { var N = wOct + 1; if ((aOct % N) === 0) return N + ' ' + unit + ': zusammenhängender Block <b>' + aOct + '–' + (aOct + N - 1) + '</b>.'; }
    // Stride (wOct = 255 - (2^s -1)): niedrige Bits müssen 0 sein
    var low = (~wOct) & 255; if (((low + 1) & low) === 0 && aOct === 0) { var K = low + 1; return set.length + ' ' + unit + ': alle, die durch <b>' + K + '</b> teilbar sind (0, ' + K + ', ' + 2 * K + ', …).'; }
    return set.length + ' ' + unit + ': ' + (set.length <= 10 ? set.join(', ') : set.slice(0, 6).join(', ') + ', …');
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 3307) >>> 0);
    var s = build(r, lvl);
    s.level = lvl; s.code = lvl + '-' + seed;
    return s;
  }
  G.WC = { LVNAME: LVNAME, makeTask: makeTask, matchOct: matchOct, bin8: bin8, describe: describe, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
