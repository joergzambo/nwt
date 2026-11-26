const fs = require('fs');
const { buildTest } = require('./docx.js');

// Antwortzeilen (leerer Schreibraum) für Theoriefragen
const blank = (n, after=120) => Array.from({length:n}, () => ({text:' ', after}));

// Theoriefrage -> Beispiel (Frage + Schreibraum)
function theory(q, pts, lines=5){
  return { lines: [ {text:q, bold:false, after:160}, ...blank(lines) ], points: pts };
}

// Website-Übung -> nur Nummer + Platzhalter für Screenshot
function exercise(nr, pts){
  return {
    lines: [
      {text:'Website-Übung – Spanning Tree', bold:true, after:120},
      {text:'Übungsnummer: '+nr, bold:true, after:60},
      {text:'(auf nwt.joergzambo.com → Spanning Tree diese Nummer eingeben)', after:200},
      {text:'[ Netzplan / Screenshot hier einfügen ]', after:200},
      ...blank(7, 200),
      {text:'Aufgaben: Markiere die Root Bridge und begründe sie. Zeichne Root-, Designated- und Blocking-Ports ein. Berechne die Pfadkosten zur Root Bridge.', after:120}
    ],
    points: pts
  };
}

// Gruppe 1 (orange): Theorie 1,2,7 + Übungen STP-S-4821, STP-S-7193
const g1 = { examples: [
  theory('Wer wird in einem Spanning-Tree-Netzwerk die Root-Bridge? Welche beiden Faktoren spielen hier eine Rolle?', 2),
  theory('Was ist ein Root Port und was ist ein Designated Port? Welchen Porttyp haben die Anschlüsse auf der Root Bridge?', 2),
  theory('Beschreibe die Spanning-Tree-Attacke! Was ist eine Root Bridge und wie kann ein Hacker die Rolle dieser übernehmen? (technische Erklärung)', 3),
  exercise('STP-S-4821', 4),
  exercise('STP-S-7193', 4)
]};

// Gruppe 2 (lila): Theorie 0,3,11 + Übungen STP-S-2048, STP-S-6400
const g2 = { examples: [
  theory('Welche 5 Portstatus kennst du bei einem Switchport mit aktivem Spanning-Tree? Nenne sie und beschreibe sie kurz.', 2),
  theory('Was ist der grobe Unterschied zwischen Spanning Tree und Rapid Spanning Tree? Welche Portstatus sind zusammengefasst?', 2),
  theory('Erkläre den Angriff, den wir im Unterricht mittels Spanning-Tree analysiert haben. Was passiert beim Aktivieren in Yersinia mit dem Netzwerk? Was sind die Gegenmaßnahmen?', 3),
  exercise('STP-S-2048', 4),
  exercise('STP-S-6400', 4)
]};

(async () => {
  const buf = await buildTest({ month: '11/2026', groups: [g1, g2] });
  fs.writeFileSync('/home/claude/Wdh_NWT_STP.docx', buf);
  console.log('geschrieben: /home/claude/Wdh_NWT_STP.docx', buf.length, 'bytes');
})();
