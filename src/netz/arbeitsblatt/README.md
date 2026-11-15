# Arbeitsblatt-Generator (Netzadresse) – vorerst nicht eingebaut

Stand 15.11.2026 aus `page.html` herausgenommen. Wird für den geplanten
**Aufgabengenerator für Lehrer** (für jedes Thema) wieder gebraucht.

- `blatt.html` – Abschnitt „📄 Arbeitsblatt zum Ausdrucken“ (Stufe, Anzahl, Gruppe A/B, Lösungsblatt, Blatt-Nummer, Drucken) + `<div id="sheet">`
- `blatt.css` – Papier-Optik, Schreiblinien, Druck-CSS (`body.printing`: blendet alles außer `#sheet` aus, A4, Seitenumbruch je Blatt)
- `blatt.js` – `sheetTasks`, `sheetHTML`, `solSheet`, `makeSheet`, Druck-Button

Abhängigkeiten aus `page.html`: `$`, `NAx` (netz.js), `dialog()` (nachgezeichneter IPv4-Dialog), `rechenweg()`, `gwText()`.
Wiedereinbau: HTML vor `</main>`, CSS vor `</style>`, JS vor `var list=/*LIST*/;` einfügen und im Sprungmenü
`<a href="#blatt">📄 Arbeitsblatt</a>` ergänzen.

Getestet: Blatt-Nummer reproduzierbar, Druck als PDF ohne leere Seiten, ca. 2 Aufgaben je A4-Seite, Lösungen auf eigener Seite.
