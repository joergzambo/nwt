# NWT-Testgenerator (lokal)

Erzeugt aus den vorhandenen NWT-Generatoren fertige Tests **in deiner
Wdh-NWT-Word-Vorlage** – zwei komplementäre Gruppen (Gruppe 1 orange,
Gruppe 2 lila) plus optionalem Lösungsblatt. Läuft nur auf deinem Rechner.

## Starten

Einmalig (Node.js muss installiert sein):

```
cd testgen
npm install
```

Danach jedes Mal:

```
npm start
```

Dann im Browser öffnen: **http://localhost:3000**
Beenden mit **Strg + C** im Terminal.

## Bedienung

1. Thema wählen
2. Schwierigkeit(en) ankreuzen (werden über die Beispiele abgewechselt)
3. Anzahl Beispiele je Gruppe + Monat für die Kopfzeile
4. „Test erzeugen" → die `.docx` wird heruntergeladen

Jede Datei zeigt unten einen **Seed**. Gleicher Seed = exakt derselbe Test
(praktisch zum erneuten Ausdrucken).

## Themen (Stand v1)

| Thema | Quelle |
|---|---|
| Netzadresse & Broadcast | `src/netz` |
| Zwei Geräte im selben Netz? | `src/netz` |
| Subnetz analysieren (Netz/Broadcast/Hosts) | `src/subnet` |
| Gleich große Subnetze bilden | `src/subnet` |
| DTP-Aushandlung (Trunk/Access/Mismatch) | `src/vtpdtp` |

Die Beispiele kommen aus den **geprüften Generatoren der Lernplattform**
(parametrisch, Lösung garantiert korrekt).

## Erweitern

- **Weitere Generator-Themen:** in `topics.js` einen Eintrag mit `gen(seed, lvl)`
  ergänzen und den passenden Generator aus `../src/<thema>/*.js` einbinden.
- **Fragen aus alten Tests:** deine bisherigen Tests (Word) liefern den
  Fragen-Pool. Rein parametrische Fragen werden zu Generatoren, inhaltliche
  Fragen kommen in einen Pool mit Lehrer-Review.

## Dateien

- `server.js` – lokaler Webserver (kein Internet nötig)
- `public/index.html` – Oberfläche
- `topics.js` – Themen-Registry, nutzt die Generatoren aus `../src`
- `docx.js` – füllt die Vorlage `vorlage.docx` (Abschnitte, Farben, Fußzeilen)
- `vorlage.docx` – Kopie deiner Wdh-NWT-Vorlage
