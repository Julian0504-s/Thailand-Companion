# Thailand Companion

Offline-fähige Progressive Web App für die Thailand-Reise – reines HTML, CSS und Vanilla JavaScript, kein Build-Schritt.

**Live:** https://julian0504-s.github.io/Thailand-Companion/

## Funktionen
- **Countdown** bis zum Abflug, während der Reise „Tag X von Y“
- **Packliste** mit Kategorien, Abhaken, Hinzufügen/Löschen, Fortschrittsbalken
- **Währungsrechner** EUR ↔ THB (Kurs online via EZB/Frankfurter bzw. open.er-api.com, offline zuletzt gespeicherter Kurs, manuell setzbar)
- **Thai-Sprachhilfe** mit Thai-Schrift, Lautschrift, khráp/khâ-Form, Vorlesen (Web Speech API, th-TH) und Favoriten
- **Reiseplan** mit Stationen (Ort, Datum, Unterkunft, Notizen)
- **Notfall**: Thai-Notrufnummern, Österreichische Botschaft Bangkok, Reiseversicherung

Alle Daten bleiben lokal im Browser (`localStorage`).

## Lokal starten
```sh
python3 -m http.server 8000
# http://localhost:8000
```

## Deployment
Jeder Push auf `main` (bzw. den Entwicklungs-Branch) deployt über `.github/workflows/pages.yml` auf GitHub Pages.
Einmalig nötig: *Settings → Pages → Source: GitHub Actions*.

Bei Änderungen an Dateien die Cache-Version in `sw.js` (`CACHE`) erhöhen, damit installierte Apps die neue Version laden.
