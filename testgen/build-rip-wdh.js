const fs = require('fs');
const { buildTest } = require('./docx.js');

const blank = (n, after=120) => Array.from({length:n}, () => ({text:' ', after}));

// 1) show ip route – Eintrag beschreiben
function showIpRoute(entry){
  return { points: 3, lines: [
    {text:'Gegeben ist folgende Zeile aus der Ausgabe von  show ip route :', after:100},
    {text:entry, bold:true, after:140},
    {text:'Erkläre jede Angabe dieser Zeile: Herkunft des Eintrags, Zielnetz, die beiden Zahlen in den eckigen Klammern, den Next-Hop, die Zeitangabe und das Ausgangs-Interface.', after:160},
    ...blank(4)
  ]};
}

// 2)/3) Theoriefrage
function theory(q, pts, lines=4){
  return { points: pts, lines: [ {text:q, after:160}, ...blank(lines) ] };
}

// 4) Split-Horizon-Topologie (Bild) beschreiben
function splitHorizon(imgPath, rNear, rFar, iface, net){
  return { points: 3, lines: [
    {text:'Das Netzwerk arbeitet mit RIP. Das links eingezeichnete Netz '+net+' fällt aus.', after:120},
    {img:{path:imgPath, w:520, h:182}},
    {text:'a) Erkläre die Regel von Split Horizon in eigenen Worten.', after:60},
    ...blank(2),
    {text:'b) Welche Route sendet '+rNear+' wegen Split Horizon NICHT an '+rFar+' zurück – und über welches Interface?', after:60},
    ...blank(2),
    {text:'c) Welches Problem wird dadurch verhindert? Nenne den Fachbegriff.', after:60},
    ...blank(2)
  ]};
}

// 5) RIP-network-Befehle – Website-Übung (nur Nummer + Platzhalter)
function ripExercise(nr){
  return { points: 4, lines: [
    {text:'Website-Übung – RIP', bold:true, after:120},
    {text:'Übungsnummer: '+nr, bold:true, after:60},
    {text:'(auf nwt.joergzambo.com → RIP diese Nummer eingeben)', after:200},
    {text:'[ Screenshot der Topologie hier einfügen ]', after:200},
    ...blank(6, 200),
    {text:'Aufgabe: Gib für den markierten Router die vollständige RIP-Konfiguration an (router rip, version 2 und alle nötigen network-Befehle).', after:120}
  ]};
}

const g1 = { examples: [
  showIpRoute('R    10.3.0.0/24 [120/2] via 10.0.12.2, 00:00:08, Serial0/0/0'),
  theory('Nenne mindestens fünf allgemeine Eigenschaften des RIP-Protokolls.', 3),
  theory('Erkläre die drei RIP-Timer (Update, Invalid/Holddown, Flush) und nenne ihre Standardwerte.', 3),
  splitHorizon('/home/claude/stpbuild/sh_g1.png', 'R2', 'R1', 'S0/0/0', '10.1.0.0/24'),
  ripExercise('RIP-S-377')
]};

const g2 = { examples: [
  showIpRoute('R    192.168.20.0/24 [120/3] via 172.16.23.1, 00:00:14, Serial0/1/1'),
  theory('Nenne drei Eigenschaften von RIPv2 gegenüber RIPv1.', 3),
  theory('Wie ermittelt RIP seine beste Route? Nenne die Metrik, ihren Maximalwert und den wichtigsten Nachteil.', 3),
  splitHorizon('/home/claude/stpbuild/sh_g2.png', 'RB', 'RA', 'S0/1/0', '172.16.5.0/24'),
  ripExercise('RIP-S-733')
]};

(async () => {
  const buf = await buildTest({ month: '11/2026', groups: [g1, g2] });
  fs.writeFileSync('/home/claude/Wdh_NWT_RIP.docx', buf);
  console.log('geschrieben: /home/claude/Wdh_NWT_RIP.docx', buf.length, 'bytes');
})();
