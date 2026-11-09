# Thailand Companion

Offline-fähige Progressive Web App für die Thailand-Reise – reines HTML, CSS und Vanilla JavaScript, kein Build-Schritt.

**Live:** https://julian0504-s.github.io/Thailand-Companion/

## Funktionen
- **Countdown** bis zum Abflug, während der Reise „Tag X von Y“; Uhrzeit Bangkok/Wien inkl. Sommerzeit
- **Packliste** mit Kategorien, Abhaken, Hinzufügen/Löschen, Fortschrittsbalken
- **Reisekasse**: Ausgaben in THB/EUR mit Kategorien, Tagesbudget, Auswertung, Aufteilung „wer schuldet wem“ und CSV-Export
- **Währungsrechner** EUR ↔ THB (Kurs online via EZB/Frankfurter bzw. open.er-api.com, offline zuletzt gespeicherter Kurs, manuell setzbar)
- **Thai-Sprachhilfe** mit Thai-Schrift, Lautschrift, khráp/khâ-Form, Vorlesen (Web Speech API, th-TH) und Favoriten
- **Reiseplan** als Zeitleiste: Flüge (inkl. Inland), Unterkünfte, Transport (Bus, Zug, Fähre …) und Aktivitäten
  - **Bordkarte scannen** per Kamera oder Screenshot (IATA-BCBP-Barcode, `BarcodeDetector`-API – Chrome auf Android)
  - Flugstatus-Link (Flightradar24), Buchungscodes zum Kopieren, Karten-Links, „Fahrer zeigen“-Vollbild mit Hoteladresse
  - „Als Nächstes“ auf der Startseite
  - **Import** von Buchungsbestätigungen (PDF, Text, Bilder oder „Teilen → Thailand Companion“ über die Web Share Target API): Unterkünfte inkl. Check-in/-out-Zeiten, Adresse, Telefon, Buchungsnummer sowie Flüge aus E-Tickets werden per Mustererkennung vorausgefüllt; Bordkarten-PDFs über den Barcode
  - **Dateien** (PDF/Bilder) pro Buchung, offline in IndexedDB gespeichert, mit eingebautem PDF-Viewer (pdf.js, `vendor/pdfjs`, Apache-2.0)
  - **Übersicht Unterkünfte** mit Nächten und Warnung bei Lücken/Überschneidungen
  - **Kalender-Export**: einzeln (Google Kalender oder .ics) oder mehrere als .ics
- **Links**: nützliche Seiten (TDAC, 12Go, Grab, Bahn, Fähren, Airlines, Flughäfen …), eigene Links, Datensicherung als JSON (inkl. Dateien)
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

Bei Änderungen die Cache-Version in `sw.js` (`CACHE`) und die `?v=`-Parameter in `index.html` und `sw.js` erhöhen.
