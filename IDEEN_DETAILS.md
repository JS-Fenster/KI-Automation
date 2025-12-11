# Ideen für KI-Automatisierungen - Technische Details

**Erstellt:** 2025-12-09 | **Aktualisiert:** 2025-12-11 | **Status:** Brainstorming-Phase | **Anzahl:** 60 Ideen (4 merged)

---

## Dokumentstruktur

| Datei | Inhalt | Verwendung |
|-------|--------|------------|
| **[IDEEN.md](IDEEN.md)** | Verdichtete Uebersicht | Schneller Ueberblick, neue Ideen eintragen |
| **IDEEN_DETAILS.md** (diese Datei) | Technische Details + W4A-Status | SQL, Logik, Abhaengigkeiten, Eigenbau-Empfehlung |
| **[IDEEN_UEBERSICHT.html](IDEEN_UEBERSICHT.html)** | Interaktive Ansicht + **Architektur** | Filtern nach Phase, Phasen-Diagramm |

> **Wichtig:** Bei Phasen-Aenderungen oder strukturellen Ideen (#58-60, #14) auch die **Architektur-Seite** in der HTML pruefen!

---

## Quick-Reference: W4A-Status

| # | Prozess | W4A-Status | Empfehlung |
|---|---------|------------|------------|
| 1 | Preislisten-Tool | Nicht vorhanden | Eigenbau |
| 2 | Bilanz/GuV | Nicht vorhanden | DATEV nutzen |
| 3 | Weru Foerderantraege | Nicht vorhanden | Eigenbau |
| 4 | KI-Wissensdatenbank | Nicht relevant | ✅ Fertig |
| 5 | Bauplan-Analyse | Nicht vorhanden | Eigenbau |
| 6 | Budget-Angebot | Teilweise | Pruefen |
| 7 | Spracherkennung | Nicht vorhanden | Eigenbau |
| 8 | Universal-Hub | Nicht vorhanden | Eigenbau |
| 9 | Reparatur-Verwaltung | ? | Pruefen |
| 10 | Auftraege/Lieferungen | Vorhanden | Pruefen |
| 11 | Terminfindung | Teilweise | Erweitern |
| 12 | E-Mail-Verarbeitung | Nicht vorhanden | Eigenbau |
| 13 | Inventar-Verwaltung | Vorhanden | Erweitern |
| 14 | Command Center ⭐ | Nicht vorhanden | Eigenbau (Phase 4) |
| 15 | Zeiterfassung | Vorhanden | Pruefen |
| 16 | Urlaubsverwaltung | Vorhanden | Pruefen |
| 17 | Projekt-Deckungsbeitrag | Vorhanden | Pruefen |
| 18 | Kundenportal | Nicht vorhanden | Eigenbau |
| 19 | Lieferanten-Bewertung | Nicht vorhanden | Eigenbau |
| 20 | Qualitaetsmanagement | Nicht vorhanden | Eigenbau |
| 21 | Mobile Monteur-App | Nicht vorhanden | Eigenbau |
| 22 | Routenplanung | Nicht vorhanden | Eigenbau |
| 23 | Verkaufschancen | Vorhanden? | Pruefen |
| 24 | Ticket-System | Nicht vorhanden | Eigenbau |
| 25 | Telefon-CRM | Nicht vorhanden | Eigenbau |
| 26 | Projekt-Aktivitaeten | Teilweise | Erweitern |
| 27 | Dokument-Intelligenz | Nicht vorhanden | Eigenbau |
| 28 | Digitales Aufmass | Nicht vorhanden | Eigenbau |
| 29 | Montage-Checklisten | Nicht vorhanden | Eigenbau |
| 30 | After Sales | Nicht vorhanden | Eigenbau |
| 31 | Rechnungsbuch | Vorhanden | Pruefen |
| 32 | Projektverwaltung | Vorhanden | Pruefen |
| 33 | Bestellwesen | Vorhanden | Erweitern |
| 34 | Zeiterfassung GPS | Nicht vorhanden | Eigenbau |
| 35 | Urlaubsplaner erw. | Teilweise | Erweitern |
| 36 | Beschaffungs-Dashboard | Nicht vorhanden | Eigenbau ⭐ |
| 37 | WoT-XML Transformer | Nicht vorhanden | Eigenbau |
| 38 | Lagerverwaltung | Vorhanden, ungenutzt | W4A testen |
| 39 | Tages-Briefing Monteur | Nicht vorhanden | Eigenbau |
| 40 | Material-Kommissionierliste | Nicht vorhanden | Eigenbau |
| 41 | Montage-Status Live | Nicht vorhanden | Eigenbau |
| 42 | Foto-Zuordnung | Nicht vorhanden | Eigenbau |
| 43 | Nacharbeit-Tracker | Nicht vorhanden | Eigenbau |
| 44 | Kapazitaets-Cockpit | Teilweise | Erweitern |
| 45 | ~~Angebots-Reminder~~ | → merged in #23 | - |
| 46 | ~~Schnell-Erfassung Anfrage~~ | → merged in #24 | - |
| 47 | Kunden-Historie Dashboard | Teilweise | Erweitern |
| 48 | ~~Wiederkauf-Erkennung~~ | → merged in #47 | - |
| 49 | Google-Reviews Alerts | Nicht vorhanden | Eigenbau |
| 50 | Sanfte Zahlungserinnerung | Nicht vorhanden | Eigenbau |
| 51 | Cashflow-Prognose | Nicht vorhanden | Eigenbau |
| 52 | Conversion-Tracker | Nicht vorhanden | Eigenbau |
| 53 | Mindestbestand-Alert | Nicht vorhanden | Eigenbau |
| 54 | Preis-Vergleich Lieferanten | Nicht vorhanden | Eigenbau |
| 55 | Bestellvorlage Pflichtfelder | Nicht vorhanden | Eigenbau ⭐ |
| 56 | AB-Abgleich automatisch | Nicht vorhanden | Eigenbau ⭐ |
| 57 | Lieferadressen-Logik | Nicht vorhanden | Eigenbau ⭐ |
| 58 | Web-Plattform Grundgeruest | Nicht vorhanden | Eigenbau ⭐⭐ (Phase 0) |
| 59 | Datenbank-Connector | Nicht vorhanden | Eigenbau ⭐⭐ (Phase 0) |
| 60 | Auth & Berechtigungen | Nicht vorhanden | Eigenbau ⭐⭐ (Phase 0) |
| 61 | ~~Mobiles Aufmass-Formular~~ | → merged in #28 | - |
| 62 | Ersatzteil-Erkennung | Nicht vorhanden | Eigenbau 🔴 (Phase 5, KI-Vision) |
| 63 | Fassaden-Budget | Nicht vorhanden | Eigenbau 🔴 (Phase 5, KI-Vision) |
| 64 | Data Service Layer | Nicht vorhanden | Eigenbau ⭐⭐ (Phase 0) |
| 65 | Anzahlungsrechnung-Auto | Nicht vorhanden | Eigenbau ⭐ |

**Legende:** Eigenbau = Selbst entwickeln | Erweitern = W4A-Funktion ausbauen | Pruefen = W4A-Status klaeren | ⭐ = Prioritaet | ⭐⭐ = Infrastruktur (ZUERST) | 🔴 = KI-Komplex

---

## Anleitung fuer neue Ideen (Claude)

Diese Datei ist **primär für Claude** als Kontext-Quelle gedacht, nicht für den User.

### Was hier rein gehört:
- **SQL-Kontext:** Relevante Tabellen, Felder, Beispiel-Queries
- **Logik/Regeln:** Schwellenwerte, Berechnungen
- **Abhängigkeiten:** Welche anderen Tools werden benötigt/genutzt
- **Offene Fragen:** Was muss noch geklärt werden

### Was hier NICHT rein gehört:
- ASCII-Visualisierungen/Diagramme (bei Bedarf für User generieren)
- Ausführliche Prosa-Beschreibungen
- Screenshots/Mockups

---

## 1. Preislisten-Tool (PDF → Excel)

### Kurzbeschreibung
PDF-Preislisten von Herstellern automatisch in Excel-Artikelstamm importieren.

### Dateipfade
- **Input:** `Z:\Lieferanten\[Hersteller]\Preisliste\*.pdf`
- **Output:** `Z:\Intern\Firmensoftware\Bauelemente - Haustüren - neu.xlsx`

### Logik
- PDF-Parsing (pdfplumber)
- Artikel-Matching: PDF-Artikel ↔ Excel-ArtikelNr
- Aktualisiert: Listenpreis ohne TZ, TZ, Gültig ab
- Dry-Run Modus, Backup vor Änderung

### Abhängigkeiten
- **Liefert an:** #6 Budget-Angebot (aktuelle Preise)

### Offene Fragen
- [ ] Welche Hersteller? (ROKA, Weru, KompoTherm, Trendtüren?)
- [ ] Neue Artikel hinzufügen oder nur bestehende aktualisieren?
- [ ] GUI gewünscht?

### Status
**Planung**

---

## 2. Bilanz- und GuV-Auswertung

### Kurzbeschreibung
Analyse-Tool für Finanzkennzahlen mit Trendprognosen.

### Datenquellen
- DATEV-Export oder SQL Server (zu klären)

### Logik
- Kennzahlen: Liquidität, Eigenkapitalquote, Umsatzrendite
- Zeitreihenvergleich über Jahre
- Branchenvergleich/Benchmarking

### Abhängigkeiten
- **Nutzt:** #31 Rechnungsbuch (falls implementiert)
- **Liefert an:** #14 Management-Dashboard

### Offene Fragen
- [ ] Datenquelle? (SQL Server, DATEV, Excel?)
- [ ] Welche Kennzahlen sind relevant?
- [ ] KI für Vorhersagen?

### Status
**Idee**

---

## 3. Weru Förderanträge-Automatisierung

### Kurzbeschreibung
Automatisches Ausfüllen von Förderanträgen (KfW, BAFA) über Weru Portal.

### Systeme
- **Portal:** https://weru.foerderservice.de/ (Session-basiert)

### Logik
- Kundendaten aus ERP → Formular ausfüllen
- Dokumenten-Upload (Rechnungen, Nachweise)
- Status-Tracking

### Offene Fragen
- [ ] API vorhanden oder nur Web-Formulare?
- [ ] Welche Daten werden benötigt?
- [ ] Login-Daten (sicher speichern!)

### Status
**Idee**

---

## 4. KI-Wissensdatenbank ✅ FERTIG

### Kurzbeschreibung
Selbst-aktualisierende Wissensdatei mit KI/Automation-News.

### Implementierung
- **Datei:** `docs/KI_Wissen.md`
- **Script:** `tools/KI_Wissen/ki_wissen_updater.py`
- **Scheduler:** Windows Task (Sonntags 03:00)

### Status
**Fertig** - Wöchentliche Updates aktiv

---

## 5. Bauplan-Analyse & Elementlisten-Generator

### Kurzbeschreibung
KI-Vision liest Baupläne, extrahiert Maße, generiert Elementlisten.

### Input-Formate
- PDF, DWG, DXF, Bilder (JPG, PNG)

### Logik
- CAD vorhanden → Parser (ezdxf)
- Nur PDF/Bild → Claude Vision + OCR
- Output: Fensterliste, Türenliste (Position, Breite, Höhe, Typ)

### Tech-Stack
- pdfplumber, ezdxf, OpenCV, Tesseract OCR, Claude Vision

### Abhängigkeiten
- **Liefert an:** #6 Budget-Angebot

### Offene Fragen
- [ ] Welche Formate kommen am häufigsten?
- [ ] Genauigkeit? (±1cm, ±5cm?)
- [ ] Budget für Vision-APIs?

### Status
**Idee** - Komplex

---

## 6. Budget-Angebots-Generator

### Kurzbeschreibung
Automatische Budget-Angebote aus Elementlisten oder manueller Eingabe.

### Input-Optionen
- Manuell (Formular)
- Excel/CSV Import
- Aus #5 Bauplan-Analyse

### Logik
- Elementdaten → Artikel-Matching → Preis-Kalkulation → PDF/Word

### Preisdaten
- Excel-Artikelstamm
- Aktualisiert durch #1 Preislisten-Tool

### Abhängigkeiten
- **Nutzt:** #1 Preislisten, #5 Bauplan (optional)
- **Liefert an:** #10 Aufträge

### Offene Fragen
- [ ] Angebots-Vorlagen vorhanden?
- [ ] Rabattstaffeln?
- [ ] Montagekosten mit kalkulieren?

### Status
**Idee**

---

## 7. Spracherkennung & Anweisungsdienst

### Kurzbeschreibung
Diktat, Aufmaße vor Ort, Anweisungen per Sprache.

### Tech
- **Speech-to-Text:** Whisper (lokal oder API)
- **Intent-Erkennung:** Claude/GPT

### Anwendungsfälle
- Aufmaß vor Ort diktieren
- Schnelle Anweisungen ("Erstelle Angebot für...")

### Abhängigkeiten
- **Liefert an:** #8 Universal-Hub, #6 Angebot

### Offene Fragen
- [ ] Geräte? (PC, Handy, Tablet)
- [ ] Datenschutz: Cloud oder lokal?

### Status
**Idee** - Komplex

---

## 8. Universal-Eingabe-Hub

### Kurzbeschreibung
Das "Gehirn": Multi-Input (Bilder, E-Mails, Sprache) → LLM Dispatcher → Workflows.

### Input-Kanäle
- Fotos (Bauplan, Notiz)
- E-Mail
- Formulare
- Sprache (#7)

### Logik
- Input-Typ erkennen
- LLM analysiert Intent
- Workflow triggern (#1, #5, #6, #9, etc.)

### Abhängigkeiten
- **Orchestriert:** Alle anderen Tools

### Offene Fragen
- [ ] Welche Kanäle wichtigste?
- [ ] 24/7 Server oder on-demand?
- [ ] Welches LLM? (Claude, GPT, lokal)

### Status
**Idee** - Komplex

---

## 9. Reparatur-Verwaltung

### Kurzbeschreibung
Reklamationen, Garantieprüfung, Status-Tracking, Foto-Dokumentation.

### SQL-Kontext
- **Tabelle:** `dbo.Auftrag`
- **Felder:** `ReparaturauftragCode`, `ReparaturgarantieBis`, `GarantieNachReparatur`, `Reparaturlager`

### Logik
- Erfassung → Garantieprüfung (anhand Kaufdatum) → Terminierung → Durchführung → Abschluss

### Abhängigkeiten
- **Nutzt:** #11 Terminfindung
- **Input von:** #8 Hub, #12 E-Mail

### Status
**Idee**

---

## 10. Aufträge & Lieferungen

### Kurzbeschreibung
Zentrale Auftragsverwaltung: Aufträge, Abholungen, Lieferungen ±Montage.

### SQL-Kontext
- **Tabellen:** `dbo.Auftrag`, `dbo.Lieferschein`, `dbo.Lieferungsart`
- **Felder:** `LieferterminAbgehend`, `LieferterminTatsächlich`

### Auftragstypen
- Normaler Auftrag → Bestellung
- Abholung durch Kunde → Abholtermin
- Lieferung ohne Montage → Liefertermin
- Lieferung mit Montage → Montagetermin

### Abhängigkeiten
- **Nutzt:** #11 Terminfindung
- **Input von:** #6 Angebot

### Status
**Idee**

---

## 11. Terminfindung

### Kurzbeschreibung
Intelligente Terminplanung für Aufmaße, Beratungen, Montagen.

### SQL-Kontext
- **Tabellen:** `dbo.Termine`, `dbo.TermineTeilnehmer`, `dbo.TerminHistorie`

### Terminarten
| Typ | Dauer | Ressourcen |
|-----|-------|------------|
| Aufmaß | 1-2h | 1 MA |
| Beratung | 0.5-2h | 1 MA |
| Montage klein | 2-4h | 1-2 Monteure |
| Montage groß | 1-2 Tage | 2-4 Monteure |

### Logik
- Mitarbeiter-Verfügbarkeit prüfen
- Fahrtzeit berechnen
- Termine in Nähe gruppieren (Geo-Optimierung)

### Abhängigkeiten
- **Wird genutzt von:** #9, #10, #36

### Offene Fragen
- [ ] Online-Buchung durch Kunden?
- [ ] Automatische vs. manuelle Zuweisung?

### Status
**Idee**

---

## 12. E-Mail-Verarbeitung

### Kurzbeschreibung
LLM-Klassifizierung, Kunden-Zuordnung, Workflow-Trigger.

### SQL-Kontext
- **Lesen:** `dbo.Kunden`, `dbo.Lieferanten`, `dbo.Objekte`, `dbo.Mitarbeiter`
- **Schreiben (sicher):** `dbo.Historie` (INSERT only)

### E-Mail-Kategorien
| Kategorie | Aktion |
|-----------|--------|
| Anfrage Neubau | → #5/#6 Angebot |
| Anfrage Reparatur | → #9 Reparatur |
| Rechnung eingehend | → Buchhaltung |
| Reklamation | → #9 + Eskalation |

### Sicherheitskonzept
- SELECT: immer erlaubt
- INSERT: nur in Historie/Dokumente
- UPDATE/DELETE: NIE

### Abhängigkeiten
- **Liefert an:** #8 Hub, #9 Reparatur, #6 Angebot

### Status
**Idee**

---

## 13. Inventar-Verwaltung

### Kurzbeschreibung
Erweiterung Work4all: Rechnungslink, Standort-Tracking, QR-Codes, Ausleihe.

### SQL-Kontext
- **Tabellen:** `dbo.Inventar`, `dbo.Lagerort`

### Logik
- QR-Code pro Gerät
- Standortwechsel dokumentieren
- Ausleihe-Workflow

### Offene Fragen
- [ ] Was fehlt in Work4all am meisten?
- [ ] Werden QR-Codes bereits genutzt?

### Status
**Idee**

---

## 14. Management-Dashboard

### Kurzbeschreibung
Zentrale KPI-Übersicht, aggregiert alle Tools + Work4all.

### KPIs (Fensterbau-spezifisch)
| KPI | Quelle |
|-----|--------|
| Umsatz/Mitarbeiter | Work4all |
| Auftragsquote | Work4all |
| Ø Auftragswert | Work4all |
| Reklamationsquote | #9 |
| Liefertreue | #10 |

### Abhängigkeiten
- **Aggregiert:** Alle Tools + Work4all

### Status
**Idee**

---

## 15. Zeiterfassung & Auslastung

### Kurzbeschreibung
Projektbezogene Zeit, Kapazitätsplanung.

### SQL-Kontext
- **Tabellen:** `dbo.Zeiten` (falls vorhanden)

### Abhängigkeiten
- **Erweitert durch:** #34 (GPS)
- **Liefert an:** #17 Deckungsbeitrag

### Status
**Idee**

---

## 16. Urlaubsverwaltung

### Kurzbeschreibung
Digitale Anträge, Teamkalender.

### SQL-Kontext
- **Tabellen:** `dbo.Urlaubsantrag` (falls vorhanden), `dbo.Mitarbeiter`

### Abhängigkeiten
- **Erweitert durch:** #35 (Abwesenheitsmanagement)

### Status
**Idee**

---

## 17. Projekt-Deckungsbeitrag

### Kurzbeschreibung
Soll-Ist-Vergleich, Nachkalkulation, Budgetwarnung.

### Logik
- Kalkulation (Soll) vs. tatsächliche Kosten/Zeiten (Ist)
- Warnung bei Budgetüberschreitung

### Abhängigkeiten
- **Nutzt:** #15 Zeiterfassung, #32 Projekte

### Status
**Idee**

---

## 18. Kundenportal

### Kurzbeschreibung
Self-Service: Status, Termine, Dokumente, Reklamation.

### Features
- Auftragsstatus einsehen
- Termine buchen/verschieben
- Dokumente herunterladen
- Reklamation melden

### Abhängigkeiten
- **Nutzt:** #10, #11, #9

### Status
**Idee** - Komplex

---

## 19. Lieferanten-Bewertung

### Kurzbeschreibung
Auto-Scoring: Liefertreue, Qualität, Preis, Kommunikation.

### Logik
- Score berechnen aus historischen Daten
- Liefertreue = pünktliche / alle Lieferungen

### SQL-Kontext
- **Tabellen:** `dbo.Bestellung`, `dbo.Lieferant`

### Abhängigkeiten
- **Liefert an:** #14 Dashboard, #36 Beschaffung

### Status
**Idee**

---

## 20. Qualitätsmanagement

### Kurzbeschreibung
Reklamations-Tracking, KVP, Audit-Vorbereitung.

### Logik
- Reklamationen kategorisieren
- Ursachenanalyse
- Maßnahmen tracken

### Abhängigkeiten
- **Nutzt:** #9 Reparaturen

### Status
**Idee** - Komplex

---

## 21. Mobile Monteur-App

### Kurzbeschreibung
Unified: Tagesplan, Navigation, Checklisten, Fotos, Unterschrift, Zeit.

### Features
- Tagesübersicht mit Terminen
- Navigation zum Kunden
- Checklisten pro Auftragstyp
- Foto-Dokumentation
- Digitale Unterschrift
- Zeiterfassung

### Abhängigkeiten
- **Nutzt:** #10, #11, #15, #29

### Status
**Idee** - Komplex

---

## 22. Routenplanung

### Kurzbeschreibung
Tourenoptimierung: Fahrzeit minimieren, Termine clustern.

### ROI-Schätzung
- ~292 Std/Jahr gespart
- ~11.500 km weniger

### Logik
- Termine pro Tag nach Geo-Nähe gruppieren
- Optimale Reihenfolge berechnen

### Abhängigkeiten
- **Nutzt:** #11 Termine

### Status
**Idee**

---

## 23. Verkaufschancen-Pipeline + Angebots-Reminder

### Kurzbeschreibung
Lead-Bewertung, Scoring, Follow-up-Erinnerungen inkl. automatisierter Angebots-Nachverfolgung.

### Enthaelt (ehem. #45 Angebots-Reminder)
- Automatisch nach X Tagen nachfassen
- 2-Tage-Regel: Proaktiv Mehrwert bieten (alternative Loesung, Kostenoptimierung)
- Priorisierung nach Volumen + Deckungsbeitrag
- Eskalation: Nach 7 Tagen intensiver, nach 14 Tagen Abschluss-Anfrage

### Logik
- Leads bewerten (Budget, Zeitrahmen, Entscheidungstraeger)
- Automatische Follow-up Erinnerungen
- Nicht aufdringlich - immer GRUND fuer Anruf liefern

### SQL-Kontext
- **Tabellen:** `dbo.Angebot`, `dbo.Kunden`

### Status
**Idee** - Mittel

---

## 24. Ticket-System Integration + Schnell-Erfassung

### Kurzbeschreibung
Auto-Tickets aus E-Mails, Eskalation, SLA-Tracking inkl. Telefon-Schnellerfassung.

### Enthaelt (ehem. #46 Schnell-Erfassung Anfrage)
- Telefon klingelt → 1-Klick Formular
- Minimale Felder: Name/Firma, Bedarf (Dropdown + Freitext), Rueckruf (Checkbox + Uhrzeit)
- Telefonnummer auto. aus CTI wenn vorhanden

### Features
- Auto-Vorgangsnummer bei jeder Kundenanfrage (z.B. V-2025-001234)
- Bestaetigung an Kunden: "Ihre Anfrage unter V-XXXX erfasst"
- Alle Kommunikation unter dieser Nummer auffindbar
- SLA: Antwort-Ziel innerhalb X Stunden

### Abhaengigkeiten
- **Input von:** #12 E-Mail
- **Nutzt:** #25 Telefon-CRM (optional)
- **Liefert an:** #23 Verkaufschancen

### Status
**Idee** - Mittel

---

## 25. Telefon-CRM Integration

### Kurzbeschreibung
Anrufer-Erkennung, Kundendaten-Popup, Notizen.

### Logik
- Eingehende Nummer → SQL-Abfrage → Kundendaten anzeigen
- Notiz direkt im Popup speichern

### Status
**Idee**

---

## 26. Projekt-Aktivitäten-Tracking

### Kurzbeschreibung
Auto-Protokoll aller Aktivitäten, Timeline-Ansicht.

### SQL-Kontext
- **Tabellen:** `dbo.Historie`, `dbo.Historie2`

### Status
**Idee**

---

## 27. Dokument-Intelligenz

### Kurzbeschreibung
Auto-Klassifizierung, OCR, Metadaten, Volltextsuche.

### Logik
- Dokument hochladen → OCR → Typ erkennen → Metadaten extrahieren → Ablage

### SQL-Kontext
- **Tabellen:** `dbo.Dokumente`, `dbo.DokumenteGr`

### Status
**Idee**

---

## 28. Digitales Aufmass + Zubehoer + Mobiles Formular

### Kurzbeschreibung
Masserfassung mit auto. Zubehoer-Berechnung (Fensterbaenke, Rolllaeden) inkl. mobilem Erfassungs-Formular.

### Enthält (ehem. #61 Mobiles Aufmass-Formular)
- Responsive Web-Formular fuer Handy/Tablet
- Felder: Raum, Breite, Hoehe, Tiefe, Bemerkungen
- Fotos direkt aus Kamera anhaengen
- Offline-Speicherung, spaeter sync

### Logik
- Fenstermasse eingeben
- Automatisch: Fensterbank (Breite + 10cm), Rollladen berechnen
- Daten als Basis fuer Angebot/Bestellung

### Loest
- Papierzettel verloren, muss abgetippt werden
- Kein Zugriff auf Daten vor Ort

### Abhaengigkeiten
- **Braucht:** #58 Web-Plattform (responsive)
- **Liefert an:** #6 Budget-Angebot

### Status
**Idee** - Mittel

---

## 29. Montage-Checklisten

### Kurzbeschreibung
Auto-Checklisten aus Aufmaß: Material, Werkzeug, Arbeitsschritte.

### Logik
- Aus Aufmaß-Daten → passende Checkliste generieren
- Abhaken während Montage

### Abhängigkeiten
- **Nutzt:** #28 Aufmaß

### Status
**Idee**

---

## 30. After Sales Service

### Kurzbeschreibung
Proaktive Kundenbetreuung: Wartung, Cross-Selling.

### Logik
- Nach X Jahren: Wartungserinnerung
- Cross-Selling basierend auf Kaufhistorie

### Status
**Idee**

---

## 31. Rechnungsbuch & Finanzdokumentation

### Kurzbeschreibung
Ein-/Ausgangsrechnungen, Mahnwesen, DATEV-Export.

### SQL-Kontext
- **Tabellen:** `dbo.Rechnung`, `dbo.Zahlung`

### Features
- OCR für eingehende Rechnungen
- Zahlungsabgleich
- Liquiditätsvorschau

### Abhängigkeiten
- **Nutzt:** #12 E-Mail, #32 Projekte
- **Liefert an:** #2 Bilanz

### Status
**Idee**

---

## 32. Projekt- & Unterprojektverwaltung

### Kurzbeschreibung
Hierarchisch: Hauptprojekt → Unterprojekte → ERP-Dokumente.

### SQL-Kontext
- **Tabellen:** `dbo.Objekte`, `dbo.Auftrag`, `dbo.Angebot`

### Abhängigkeiten
- **Wird genutzt von:** #31, #33, #34, #17

### Status
**Idee**

---

## 33. Bestellwesen & Lieferanten-Aufträge

### Kurzbeschreibung
Bedarfsermittlung → Bestellung → Wareneingang.

### SQL-Kontext
- **Tabellen:** `dbo.Bestellung`, `dbo.Wareneingang`

### Status
**Idee**

---

## 34. Erweiterte Zeiterfassung (GPS)

### Kurzbeschreibung
Projektzuordnung Pflicht, GPS-Vorschläge, QR-Code-Erfassung.

### Datenschutz
- GPS nur während Arbeitszeit
- Mitarbeiter kann deaktivieren
- Daten nach 30 Tagen löschen
- Keine Echtzeit-Überwachung

### Abhängigkeiten
- **Erweitert:** #15
- **Nutzt:** #11, #32

### Status
**Idee**

---

## 35. Urlaubsplaner & Abwesenheitsmanagement

### Kurzbeschreibung
Teamkalender, auto. Kapazitätsprüfung, Genehmigungsworkflow.

### Logik
- Urlaubsantrag → System prüft: Wer ist sonst weg? Genug Kapazität?
- Auto-Genehmigung oder Warnung

### Abhängigkeiten
- **Erweitert:** #16
- **Nutzt:** #11

### Status
**Idee**

---

## 36. Beschaffungs-Dashboard ⭐ PRIORITÄT

### Kurzbeschreibung
Echtzeit-Übersicht kritischer Bestellvorgänge. Verhindert Montage-Stillstand durch vergessene Bestellungen.

### SQL-Kontext
- **Tabelle:** `dbo.Bestellung`
- **Relevante Felder:**
  - `Bestätigt` (0=keine AB, -1=AB da)
  - `BestellDatum` (Datum)
  - `LieferterminTatsächlich` (Soll-Liefertermin)
  - `WEDatum` (NULL=noch nicht eingetroffen)
  - `Abgeschlossen` (0=offen, -1=erledigt)
  - `KarteiCode` (FK Lieferant)
  - `ProjektCode` (FK Projekt)
  - `Wert` (Bestellwert)

### Logik (Ampel-System)
| Status | Bedingung | Schwellenwert |
|--------|-----------|---------------|
| 🔴 Kritisch | Keine AB erhalten | > 5 Tage nach Bestellung |
| 🟡 Warnung | Liefertermin überschritten | WEDatum IS NULL AND Termin < heute |
| 🟠 Abholbereit | Ware liegt beim Lieferanten | Noch zu klären: Feld vorhanden? |
| 🟢 OK | AB da, Termin in Zukunft | Standard |

### SQL-Queries
```sql
-- Ohne AB (> 3 Tage)
SELECT b.Nummer, l.Firma, b.BestellDatum, b.Wert,
       DATEDIFF(day, b.BestellDatum, GETDATE()) AS TageOffen
FROM dbo.Bestellung b
LEFT JOIN dbo.Lieferant l ON b.KarteiCode = l.Code
WHERE b.Abgeschlossen = 0 AND b.Bestätigt = 0
  AND DATEDIFF(day, b.BestellDatum, GETDATE()) > 3;

-- Überfällig
SELECT b.Nummer, l.Firma, b.LieferterminTatsächlich,
       DATEDIFF(day, b.LieferterminTatsächlich, GETDATE()) AS TageUeber
FROM dbo.Bestellung b
LEFT JOIN dbo.Lieferant l ON b.KarteiCode = l.Code
WHERE b.Abgeschlossen = 0 AND b.WEDatum IS NULL
  AND b.LieferterminTatsächlich < GETDATE();
```

### Abhängigkeiten
- **Nutzt:** SQL direkt
- **Liefert an:** #11 Termine (Montage-Warnung), #14 Dashboard (KPI)

### Offene Fragen
- [ ] Wie wird "Abholbereit" heute kommuniziert? Feld vorhanden?
- [ ] Nach wie vielen Tagen ohne AB ist es kritisch? (Vorschlag: 5)
- [ ] Wer soll Alerts bekommen?
- [ ] Standalone oder in Work4all integriert?

### Status
**Idee** - ⭐ HOHE PRIORITÄT

---

## #37 WoT-XML Transformer (Weru Konfigurator)

### Kurzbeschreibung
XML-Export aus WoT (Weru WPS on Top) Konfigurator transformieren fuer sauberen Work4all Import.

### Problem
- WoT exportiert XML mit viel Redundanz (gleiche Infos in jeder Position)
- Kein Lieferant-Feld -> muss manuell im ERP nachgetragen werden
- Positionstexte unuebersichtlich lang

### Logik
1. **XML einlesen** (iso-8859-1 Encoding beachten)
2. **Redundanz-Analyse:**
   - Alle Langtext-Felder parsen
   - Haeufige Zeilen identifizieren (>50% der Positionen)
   - Diese in Kopftext verschieben
3. **Positionstexte kuerzen:**
   - Nur einmalige Infos behalten (Raum, Masse, Sonder-Optionen)
4. **Lieferant einfuegen:**
   - Je Position ein Lieferant-Feld mit "Weru" (oder konfigurierbar)
   - W4A erkennt das beim Import und ordnet automatisch zu
5. **XML ausgeben** (transformiert)

### Beispiel-Transformation
**Vorher (Positionstext):**
```
OG - Abstellraum
Anschlag: DKL Dreh-Kipp links
Uw,N: 0,78 W/(m²K) n. EN ISO 10077-1
Breite: 980 mm, Höhe: 1325 mm
Rahmenbreite: 72 mm normal
links - Verbreiterung: 20 mm
rechts - Verbreiterung: 20 mm
Abschluss unten: Futterleiste 30 mm
```

**Nachher (Positionstext):**
```
OG - Abstellraum | DKL | 980x1325
```

**Kopftext (ergaenzt):**
```
Rahmenbreite: 72 mm normal
Verbreiterung links/rechts: 20 mm
Abschluss unten: Futterleiste 30 mm (Standard)
```

### Abhaengigkeiten
- **Input:** WoT XML Export
- **Output:** Transformierte XML fuer W4A Drag&Drop Import
- **Konfigurierbar:** Lieferant-Name, Redundanz-Schwelle

### Offene Fragen
- [ ] Welches XML-Feld nutzt W4A fuer Lieferant-Zuordnung?
- [ ] Sollen Bilder (Base64) auch uebernommen werden?
- [ ] GUI oder CLI-Tool?
- [ ] Wo soll Output-XML gespeichert werden?

### Status
**Idee** - Mittel

---

## #38 Lagerverwaltung & Inventur

### Kurzbeschreibung
Bestandsfuehrung fuer Lagerartikel, Inventur-Prozess, korrekte Wareneingangsbuchung.

### Ist-Zustand
- **Inventur:** Eigene Excel-Liste + Papier (getrennt von W4A)
- **W4A Artikelstamm:** Nur fuer Kalkulation, KEINE Bestaende gefuehrt
- **W4A Lagerfunktion:** Vorhanden aber nicht im Einsatz
- **Problem:** Teillieferungen werden als Komplett-Lieferung gebucht

### SQL-Kontext
- **Tabellen:** `dbo.Artikel`, `dbo.Lagerbestand` (zu pruefen ob vorhanden)
- **Relevante Felder:** Bestand, Mindestmenge, Lagerort

### Logik (potentiell)
1. **W4A Lagerfunktion aktivieren** und testen
2. **Teillieferungs-Problem loesen:** Wareneingang korrekt buchen
3. **Inventur-Workflow:** Scan-basiert oder manuell mit Abgleich
4. **Bestandswarnungen:** Bei Unterschreitung Mindestmenge

### Abhaengigkeiten
- **Verknuepft:** #33 Bestellwesen, #36 Beschaffungs-Dashboard
- **Nutzt:** SQL Lagertabellen (falls W4A), Excel-Import (falls Eigenbau)

### Offene Fragen
- [ ] W4A Lagerfunktion ausreichend oder Eigenbau noetig?
- [ ] Wie viele Artikel werden auf Lager gefuehrt?
- [ ] Barcode/QR-Scan gewuenscht?
- [ ] Welche Lagerorte gibt es? (Hauptlager, Fahrzeuge, etc.)

### Status
**Idee** - Mittel

---

## #39 Tages-Briefing Monteur (Montage-Mappe)

### Kurzbeschreibung
Automatisch generierte Montage-Unterlagen statt manueller Zusammenstellung durch Buero.

### Problem (Ist-Zustand)
- Susann stellt manuell Unterlagen zusammen
- Zu viele Blaetter, nicht alle noetig
- Falsche Dokumente: Aufmass-Blaetter fuer ANGEBOT statt BESTELLUNG
- Unstrukturiert, Monteure muessen suchen

### Loesung (Soll-Zustand)
Pro Auftrag 1-3 Seiten "Montage-Mappe":
1. **Uebersicht (1 Seite):** Kunde, Adresse, Telefon, Ansprechpartner, Terminzeit
2. **Relevante Masse:** Aus BESTELLUNG (nicht Angebot!) - nur was gebaut wird
3. **Material-Checkliste:** Was muss mit? (#40)
4. **Besonderheiten:** Notizen, Zugang, Parkplatz, Sonderwuensche

### Logik
- Auftrag in W4A → Script generiert PDF
- Unterscheidung Angebot vs. Bestellung: Nur Bestell-Daten verwenden
- Material aus Auftragspositionen ableiten

### SQL-Kontext
- **Tabellen:** `dbo.Auftrag`, `dbo.AuftragPos`, `dbo.Kunden`, `dbo.Bestellung`, `dbo.BestellungPos`
- **Kritisch:** Verknuepfung Auftrag → Bestellung fuer korrekte Masse

### Output-Optionen
- PDF druckbar (aktuell realistischer)
- Digital via Handy/Tablet (Zukunft - Endgeraete + Akzeptanz pruefen!)

### Abhaengigkeiten
- **Integriert:** #40 Kommissionierliste
- **Nutzt:** #11 Termine (Tages-Uebersicht)
- **Liefert an:** Monteure, ersetzt manuelle Vorbereitung

### NEU: Digitale Erfassung (Brainstorming 2025-12-11)

**Problem:** Seite 2 der Montage-Unterlagen = Handschrift-Chaos, muss im Buero entziffert werden.

**Loesung - Tablet/Handy-App statt Papier:**
- 📱 Strukturierte Eingabe auf dem Endgeraet (Dropdown + Textfeld + Foto)
- 📷 Fotos vor Ort (statt "defekt" beschreiben - zeigen!)
- 🎤 Spracheingabe mit KI-Analyse (#7): "Endleiste 921mm fehlt" → System erkennt Material + Mass
- ⚡ Sofort im System (nicht: Papier ins Lager → naechster Tag ins Buero → entziffern)

**Vorteile:**
- Kein Entzifferungs-Aufwand (Handschrift lesen)
- Sofortige Verfuegbarkeit im Buero
- Strukturierte Daten statt Freitext
- Fotos als Beweismittel/Dokumentation

**Verknuepfung:** #7 Spracherkennung fuer Diktat-Funktion

### Status
**Idee** - Mittel (hoher Impact!)

---

## #40 Material-Kommissionierliste

### Kurzbeschreibung
Auto-generierte Checkliste: Was muss ins Auto? Abhaken vor Abfahrt.

### Logik
- Auftragspositionen aus BESTELLUNG analysieren (nicht Angebot!)
- Material gruppieren:
  - Fenster/Tueren (Hauptprodukte)
  - Zubehoer (Fensterbaenke, Rolllaeden)
  - Befestigung (Schrauben, Schaum, Silikon)
  - Werkzeug (falls auftrags-spezifisch)
- Checkbox zum Abhaken vor Abfahrt
- Lagerort/Standort wenn verfuegbar

### Integration
- **Teil von #39:** Wird als Seite in Montage-Mappe integriert
- Kann auch separat generiert werden

### SQL-Kontext
- **Tabellen:** `dbo.BestellungPos`, `dbo.Artikel`, `dbo.Lagerbestand`
- **Wichtig:** Nur bestellte Artikel, nicht Angebots-Positionen!

### Abhaengigkeiten
- **Nutzt:** #10 Auftraege, #38 Lagerverwaltung
- **Integriert in:** #39 Montage-Mappe

### Status
**Idee** - Mittel

---

## #41 Montage-Status Live

### Kurzbeschreibung
Monteur meldet Status (angekommen, fertig, Problem) - alle sehen Echtzeit-Uebersicht.

### Logik
- Einfache Status-Buttons in App/SMS
- Status-Aenderung triggert Update in Zentrale
- Uebersicht zeigt: Wer ist wo, welcher Status
- Bei "Problem" sofort Benachrichtigung an Disposition

### Tech
- Push-API oder SMS-Gateway
- Dashboard fuer Buero

### Abhaengigkeiten
- **Nutzt:** #11 Termine, #21 Monteur-App (optional)
- **Liefert an:** #14 Dashboard

### NEU: Auto-Benachrichtigung an Kunde (Brainstorming 2025-12-11)

**Problem:** Kunde gibt Zugang (Schluessel, Code), ist nicht zu Hause, weiss nicht ob Monteur kommt.
- Bei Restarbeit = Monteur kommt
- Bei Material-Bedarf = Monteur kommt NICHT (erst Bestellung)
- Kunde wird nicht automatisch informiert → Unsicherheit, Rueckfragen

**Loesung - Auto-SMS/E-Mail bei Statusaenderung:**
- 📲 "Montage abgeschlossen, Rechnung folgt"
- ⚠️ "Restarbeiten noetig, Material wird bestellt, wir melden uns mit neuem Termin"
- 📅 "Ihr neuer Termin: XX.XX.XXXX um XX:XX Uhr"
- ✅ "Wir sind heute um XX:XX bei Ihnen" (morgens als Erinnerung)

**Tech:**
- SMS-Gateway (z.B. Twilio, oder deutscher Anbieter)
- E-Mail als Fallback
- Template-System fuer verschiedene Nachrichten
- Opt-in beim Kunden (DSGVO-konform)

### Status
**Idee** - Anspruchsvoll

---

## #42 Foto-Zuordnung

### Kurzbeschreibung
Handy-Foto → Auto-Erkennung Projekt/Kunde → richtige Akte.

### Logik
- Foto mit Metadaten (Zeit, GPS) analysieren
- GPS mit Kundenadresse matchen
- Zeitfenster mit Terminen abgleichen
- Vorschlag: "Dieses Foto zu Projekt X bei Kunde Y?"
- Automatisch in richtige Dokumenten-Akte ablegen

### Tech
- GPS-Koordinaten-Vergleich
- Zeitfenster-Logik

### SQL-Kontext
- **Tabellen:** `dbo.Dokumente`, `dbo.Kunden`, `dbo.Termine`

### Abhaengigkeiten
- **Nutzt:** #27 Dokument-Intelligenz

### Status
**Idee** - Anspruchsvoll

---

## #43 Kanban-Dashboard fuer Ticketsystem

### Kurzbeschreibung
Grafische Kachel-Ansicht fuer W4A-Tickets (Restarbeiten, Montage, Reparaturen, Reklamationen).

### Hintergrund
Das W4A Ticketsystem funktioniert bereits gut mit:
- Kategorien (Restarbeiten, Montage, Reparaturen, Reklamationen, etc.)
- WV-Spalte (Wiedervorlage-Datum)
- Prioritaet + Status mit farbigen Punkten
- Detail-Bereich mit Problembeschreibung, Anhaenge, Loesung

**Problem:** Die Tabellen-Ansicht ist funktional, aber nicht visuell fuer schnellen Ueberblick.

### Logik
- Daten aus W4A Ticketliste auslesen
- Kachel-Ansicht wie Outlook-Kalender darstellen
- Drag & Drop zwischen Status/Kategorien
- Filter nach Team, Prioritaet, Wartegrund
- Farbkodierung nach Kategorie/Status

### Vorbild
- Outlook-Kacheln (bekannt bei JS Fenster)
- Trello-Style Kanban-Boards

### SQL-Kontext
- **Tabellen:** W4A Ticketsystem-Tabellen (zu ermitteln)

### Abhaengigkeiten
- **Nutzt:** Bestehende W4A Ticketliste-Daten
- **Liefert an:** #14 Command Center Dashboard

### Status
**Idee** - Mittel

---

## #44 Kapazitaets-Cockpit

### Kurzbeschreibung
Wie voll ist die Woche? Wer hat noch Luft? Uebersicht Auslastung.

### Logik
- Termine pro Mitarbeiter aggregieren
- Verfuegbare Stunden vs. gebuchte Stunden
- Ampel-System: Rot (>100%), Gelb (80-100%), Gruen (<80%)
- Drill-Down: Wer hat wann Zeit fuer dringende Auftraege?

### SQL-Kontext
- **Tabellen:** `dbo.Termine`, `dbo.Mitarbeiter`, `dbo.Arbeitszeit`

### Abhaengigkeiten
- **Nutzt:** #11 Terminfindung, #15 Zeiterfassung, #35 Urlaubsplaner
- **Liefert an:** #14 Dashboard

### Status
**Idee** - Anspruchsvoll

---

## #45 ~~Angebots-Reminder~~ → merged in #23

*Integriert in #23 Verkaufschancen-Pipeline + Angebots-Reminder*

---

## #46 ~~Schnell-Erfassung Anfrage~~ → merged in #24

*Integriert in #24 Ticket-System Integration + Schnell-Erfassung*

---

## #47 Kunden-Historie Dashboard + Wiederkauf-Erkennung

### Kurzbeschreibung
Alle Kontakte, Angebote, Auftraege, Reklamationen auf einen Blick inkl. automatischer Wiederkauf-Erkennung.

### Enthaelt (ehem. #48 Wiederkauf-Erkennung)
- "Familie Mueller hat 2019 schon Fenster gekauft" erkennen
- Historische Auftraege anzeigen bei neuer Anfrage
- Was wurde damals gekauft?
- Cross-Selling-Hinweise

### Logik
- Timeline-Ansicht pro Kunde
- Alle Dokumente chronologisch
- Letzte Kommunikation (E-Mails, Anrufe, Termine)
- Offene Vorgaenge hervorheben
- Bei neuer Anfrage: Automatisch auf Bestandskunde pruefen

### SQL-Kontext
- **Tabellen:** `dbo.Kunden`, `dbo.Historie`, `dbo.Angebot`, `dbo.Auftrag`, `dbo.AuftragPos`, `dbo.Dokumente`

### Abhaengigkeiten
- **Nutzt:** #26 Projekt-Aktivitaeten-Tracking
- **Liefert an:** #30 After Sales
- **Aehnlich:** In W4A vorhanden? Pruefen

### Status
**Idee** - Mittel

---

## #48 ~~Wiederkauf-Erkennung~~ → merged in #47

*Integriert in #47 Kunden-Historie Dashboard + Wiederkauf-Erkennung*

---

## #49 Google-Reviews Alerts

### Kurzbeschreibung
Neue Bewertung? Sofort Bescheid, schnell reagieren.

### Logik
- Google My Business API oder Scraping
- Neue Bewertung erkannt → Benachrichtigung
- Bei negativer Bewertung: Eskalation
- Response-Vorschlaege generieren

### Tech
- Google My Business API (falls Zugang)
- Alternativ: Scraping-Service

### Abhaengigkeiten
- **Standalone** - externes System

### Status
**Idee** - Einfach

---

## #50 Sanfte Zahlungserinnerung

### Kurzbeschreibung
Auto-Mail "Rechnung offen" bevor formelle Mahnung.

### Logik
- Rechnung faellig + X Tage (z.B. 14)
- Freundliche E-Mail-Erinnerung
- Antwort-Link fuer Rueckfragen
- Wenn keine Reaktion → normale Mahnung (#31)

### SQL-Kontext
- **Tabellen:** `dbo.Rechnung`, `dbo.Zahlung`, `dbo.Kunden`

### Abhaengigkeiten
- **Nutzt:** #31 Rechnungsbuch

### Status
**Idee** - Mittel

---

## #51 Cashflow-Prognose

### Kurzbeschreibung
Wann kommt Geld, wann geht's raus? Liquiditaets-Ampel.

### Logik
- Offene Forderungen mit erwartetem Zahlungseingang
- Geplante Ausgaben (Bestellungen, Gehaelter)
- Prognose 4-8 Wochen voraus
- Warnung bei kritischer Liquiditaet

### SQL-Kontext
- **Tabellen:** `dbo.Rechnung`, `dbo.Bestellung`, `dbo.Zahlung`

### Abhaengigkeiten
- **Nutzt:** #31 Rechnungsbuch, #33 Bestellwesen
- **Liefert an:** #14 Dashboard, #2 Bilanz

### Status
**Idee** - Anspruchsvoll

---

## #52 Conversion-Tracker

### Kurzbeschreibung
Wie viel % der Angebote werden Auftraege? Trend ueber Zeit.

### Logik
- Angebote zählen (pro Monat/Quartal)
- Daraus resultierende Auftraege zaehlen
- Conversion Rate berechnen
- Trend-Analyse: Wird's besser oder schlechter?
- Aufschluesselung nach Produktkategorie, Verkaeufer

### SQL-Kontext
- **Tabellen:** `dbo.Angebot`, `dbo.Auftrag`

### Abhaengigkeiten
- **Liefert an:** #14 Dashboard, #23 Verkaufschancen

### Status
**Idee** - Mittel

---

## #53 Mindestbestand-Alert

### Kurzbeschreibung
Warnung bei kritischem Lagerbestand (Silikon, Dichtungen, etc.)

### Logik
- Mindestbestand pro Artikel definieren
- Taeglich/stuendlich pruefen
- Bei Unterschreitung: Alert
- Automatischer Bestellvorschlag

### SQL-Kontext
- **Tabellen:** `dbo.Artikel`, `dbo.Lagerbestand`

### Abhaengigkeiten
- **Nutzt:** #38 Lagerverwaltung
- **Liefert an:** #33 Bestellwesen, #36 Beschaffungs-Dashboard

### Status
**Idee** - Mittel

---

## #54 Preis-Vergleich Lieferanten

### Kurzbeschreibung
Gleicher Artikel, verschiedene Lieferanten → bester Preis.

### Logik
- Artikel-Nummern verschiedener Lieferanten matchen
- Preise vergleichen (inkl. Rabatte, Staffeln)
- Empfehlung: Wo kaufen?
- Historischer Preisverlauf

### SQL-Kontext
- **Tabellen:** `dbo.Artikel`, `dbo.Lieferant`, `dbo.Bestellung`

### Abhaengigkeiten
- **Nutzt:** #1 Preislisten-Tool, #19 Lieferanten-Bewertung
- **Liefert an:** #33 Bestellwesen

### Status
**Idee** - Anspruchsvoll

---

## #55 Bestellvorlage mit Pflichtfeldern ⭐ PRIO

### Kurzbeschreibung
Verhindern dass Lieferwoche/Adresse bei Bestellung vergessen wird.

### Problem (Ist-Zustand)
- Roland/Vater bestellen ohne Lieferwoche → Ware zu frueh da
- Lieferadresse wird nicht geprueft → Falschlieferungen
- Aktuell keine Pflichtfeld-Validierung

### Loesung
Bestellformular/-pruefung mit:
1. **Pflichtfeld Lieferwoche (KW):** Muss ausgefuellt sein vor Absenden
2. **Lieferadresse automatisch:** Je Artikel-Typ (gross → Lager, klein → Buero)
3. **Warnung bei fehlenden Feldern**

### Implementierungs-Optionen
- **W4A Anpassung:** Pflichtfelder in Bestellmaske (falls moeglich)
- **Python-Checker:** Script das vor Versand prueft
- **Outlook-Regel:** E-Mail-Bestellung mit Template

### Abhaengigkeiten
- **Nutzt:** #33 Bestellwesen
- **Zusammen mit:** #57 Lieferadressen-Logik

### Status
**Idee** - Mittel | **Prioritaet:** 3 von 4 im Bestellprozess

---

## #56 AB-Abgleich automatisch ⭐ PRIO

### Kurzbeschreibung
Neue AB automatisch mit urspruenglicher Bestellung vergleichen.

### Problem (Ist-Zustand)
- Lieferant schickt AB per E-Mail (PDF)
- Haendischer Vergleich mit eigener Bestellung: Mengen, Masse, Preise
- Bei Korrektur: Neue AB kommt → wieder vergleichen
- Zeitaufwaendig, Fehler moeglich → Falschlieferungen

### Loesung
1. **PDF-Parsing:** AB extrahieren (Positionen, Mengen, Masse, Preise)
2. **Vergleich mit Bestellung:** Aus W4A oder eigener Bestelldatei
3. **Abweichungen markieren:** "Zeile 3: Breite 1200 statt 1000"
4. **Report:** Per E-Mail oder Dashboard

### Tech
- PDF-Parser (pdfplumber, camelot)
- LLM fuer unstrukturierte ABs
- Vergleichslogik

### Abhaengigkeiten
- **Nutzt:** #12 E-Mail-Verarbeitung (AB erkennen)
- **Liefert an:** #36 Beschaffungs-Dashboard (AB-Status)

### Offene Fragen
- [ ] Welche Lieferanten schicken strukturierte ABs?
- [ ] Gibt es Standard-AB-Formate?
- [ ] Wo liegt die eigene Bestellung? (W4A, E-Mail, Excel?)

### Status
**Idee** - Anspruchsvoll | **Prioritaet:** 2 von 4 im Bestellprozess

---

## #57 Lieferadressen-Logik ⭐ PRIO

### Kurzbeschreibung
Richtige Lieferadresse automatisch je Artikel-Typ auswaehlen.

### Problem (Ist-Zustand)
- Falschlieferungen ins Buero statt Lager
- Grosse Teile (Fenster, Tueren) gehoeren ins Lager
- Paketdienste sollen aber ins Buero (immer besetzt)
- Aktuell: Manuelle Eingabe, wird oft falsch gemacht

### Loesung
Automatische Adress-Auswahl nach Regel:
- **Gross (Spedition):** Fenster, Tueren, Rolllaeden → Lager-Adresse
- **Klein (Paketdienst):** Kleinteile, Beschlaege → Buero-Adresse
- **Mischbestellung:** Warnung + Aufteilen?

### Logik
```
WENN Artikel in Kategorie "Fenster", "Tueren", "Rolllaeden"
  DANN Lieferadresse = Lager
SONST
  Lieferadresse = Buero
```

### Implementierung
- In Bestellmaske automatisch vorbelegen
- Oder als Pruefung vor Absenden

### Abhaengigkeiten
- **Nutzt:** Artikel-Kategorien aus W4A
- **Zusammen mit:** #55 Pflichtfelder

### Status
**Idee** - Einfach | **Prioritaet:** 1 von 4 im Bestellprozess (WICHTIGSTE!)

---

## Komplexitaets-Uebersicht

| Stufe | Tools |
|-------|-------|
| 🟢 Einfach | #4 ✓, #29, #49, #57 |
| 🟡 Mittel | #1, #3, #6, #9, #10, #13, #15, #16, #19, #23, #24, #28, #31, #33, #36, #37, #38, #39, #40, #43, #47, #50, #53, #55, #58, #59, #60 |
| 🟠 Anspruchsvoll | #2, #11, #12, #14, #17, #18, #22, #25, #26, #27, #30, #32, #34, #35, #41, #42, #44, #51, #52, #54, #56 |
| 🔴 Komplex | #5, #7, #8, #20, #21 |
| ⚫ Merged | #45→#23, #46→#24, #48→#47, #61→#28 |

---

## Empfohlene Reihenfolge (NEU: Nach Abhaengigkeiten)

**Phase 0 (INFRASTRUKTUR - ZUERST!):** #58 Web-Plattform, #59 DB-Connector, #60 Auth
**Phase 1 (Basis-Module):** #1 Preislisten, #13 Inventar, #57 Lieferadressen, #39/#40 Montage-Mappe
**Phase 2 (Kernprozesse):** #9, #10, #11, #36, #55, #56
**Phase 3 (Kommunikation):** #6, #12
**Phase 4 (Command Center):** #14 (integriert #36, #44, #51, #52)
**Phase 5 (KI-Features):** #5, #7, #8

---

## Phase 0: Infrastruktur (Details)

### #58 Web-Plattform Grundgeruest

**Zweck:** Basis fuer alle Tools - muss ZUERST gebaut werden!

### Was brauchen wir?
| Komponente | Tech-Empfehlung | Begruendung |
|------------|-----------------|-------------|
| Backend | Python Flask oder FastAPI | Python schon vorhanden (WinPython) |
| Frontend | Bootstrap 5 | Responsive ohne Aufwand |
| Templating | Jinja2 (in Flask enthalten) | Einfach, bewaehrt |
| Hosting | Lokal + Cloudflare Tunnel | Tunnel existiert, keine Kosten |

### Grund-Struktur
```
js-fenster-tools/
├── app.py                 # Haupt-Anwendung
├── config.py              # Konfiguration
├── templates/
│   ├── base.html          # Basis-Layout (Nav, Footer)
│   ├── index.html         # Startseite/Dashboard
│   └── modules/           # Module-Templates
├── static/
│   ├── css/               # Styles
│   └── js/                # JavaScript
└── modules/               # Tool-Module als Python-Packages
```

### Features (Minimum)
- Startseite mit Navigation
- Responsive Layout (Mobile-first)
- Modul-Architektur (jedes Tool = ein Modul)
- Einheitliches Look & Feel

### Abhaengigkeiten
- **Voraussetzung fuer:** ALLE anderen Tools!
- **Baut auf:** Nichts (Grundlage)

### Status
**Idee** - Mittel | **Prioritaet:** ⭐⭐ MUSS ZUERST!

---

### #59 Datenbank-Connector

**Zweck:** Sichere, wiederverwendbare Verbindung zu W4A SQL Server

### Bereits vorhanden
- Grundlagen in `ki_wissen_updater.py` (pyodbc)
- Tunnel-Setup in CLAUDE.md dokumentiert

### Zu erweitern
| Feature | Beschreibung |
|---------|--------------|
| Connection-Pool | Mehrere parallele Verbindungen |
| Sichere Credentials | Nicht im Code, sondern .env |
| Query-Builder | Einfache SELECT/INSERT ohne SQL-Strings |
| Logging | Wer hat wann was abgefragt? |

### Beispiel-Nutzung
```python
from db_connector import get_connection, query

# Einfache Abfrage
kunden = query("SELECT * FROM dbo.Kunden WHERE Ort = ?", ["Musterstadt"])

# Mit Context-Manager
with get_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM dbo.Auftrag")
```

### Sicherheits-Regeln
- SELECT: Immer erlaubt
- INSERT: Nur in definierte Tabellen (Whitelist)
- UPDATE/DELETE: NIE auf Stammdaten!

### Abhaengigkeiten
- **Nutzt:** #58 Web-Plattform
- **Voraussetzung fuer:** Alle Tools die DB brauchen

### Status
**Idee** - Mittel | **Prioritaet:** ⭐⭐ MUSS ZUERST!

---

### #60 Auth & Berechtigungen

**Zweck:** Wer darf was sehen? Login-System.

### Warum wichtig?
| Rolle | Sieht | Sieht NICHT |
|-------|-------|-------------|
| GF | Alles | - |
| Buero | Auftraege, Bestellungen | Finanzkennzahlen |
| Monteur | Eigene Auftraege | Andere Kunden, Finanzen |

### Implementierung (einfach)
- Username/Passwort in lokaler DB
- Session-basiert (Flask-Login)
- Rollen: admin, buero, monteur

### Spaeter moeglich
- AD-Integration (Windows-Login)
- 2FA fuer sensible Bereiche
- Audit-Log (wer hat was wann gesehen)

### Abhaengigkeiten
- **Nutzt:** #58 Web-Plattform, #59 DB-Connector
- **Voraussetzung fuer:** Sensible Module (Finanzen, KPIs)

### Status
**Idee** - Mittel | **Prioritaet:** ⭐⭐ MUSS VOR FINANZEN!

---

### #14 Command Center (erweitert)

**Zweck:** EIN zentrales Dashboard fuer alles - nicht viele einzelne!

### Struktur
```
┌─────────────────────────────────────────────────────────┐
│  🔴 3 Alerts                        JS Fenster Dashboard │
├─────────────────────────────────────────────────────────┤
│  [Heute]  [Bestellungen]  [Montage]  [Finanzen]  [KPIs] │
├─────────────────────────────────────────────────────────┤
│  Tab-Inhalt je nach Auswahl...                          │
└─────────────────────────────────────────────────────────┘
```

### Tabs & Integrierte Tools
| Tab | Zeigt | Integriert |
|-----|-------|------------|
| Heute | Tagesgeschaeft, dringende Items | Alerts aller Module |
| Bestellungen | Offene, ohne AB, ueberfaellig | #36 Beschaffungs-Dashboard |
| Montage | Termine, Status, Material | #39/#40 Montage-Mappe |
| Finanzen | Offene Rechnungen, Cashflow | #51 Cashflow |
| KPIs | Kennzahlen, Trends, Conversion | #52 Conversion |

### Vorteile
- **Eine Anlaufstelle** statt 5 verschiedene Dashboards
- **Tabs fuer Fokus** - je nach aktuellem Bedarf
- **Alerts ueberall sichtbar** - kritisches oben
- **Modular erweiterbar** - neue Tabs spaeter

### Abhaengigkeiten
- **Nutzt:** #58 Web, #59 DB, #60 Auth
- **Integriert:** #36, #44, #51, #52 als Sub-Module
- **Baut auf:** Alle Basis-Module muessen erst existieren

### Status
**Idee** - Anspruchsvoll | **Phase:** 4 (erst wenn Basis steht)

---

## #61 ~~Mobiles Aufmass-Formular~~ → merged in #28

*Integriert in #28 Digitales Aufmass + Zubehoer + Mobiles Formular*

---

## #62 Ersatzteil-Erkennung (KI-Vision)

### Kontext (User)
- Bei Reparaturauftraegen: "Was ist das fuer ein Teil?"
- Alte Beschlaege, Griffe, Dichtungen identifizieren
- Manuell: Kataloge waelzen, Lieferanten anrufen

### Technische Umsetzung
- **Input:** Foto vom defekten Teil
- **KI:** Claude Vision / GPT-4V analysiert Bild
- **Matching:** Vergleich mit Artikelstamm (Bilder + Beschreibungen)
- **Output:** "Das koennte XY sein" + Bestellvorschlag

### SQL-Kontext
- `dbo.Artikel` - Artikelstamm mit Bezeichnungen
- `dbo.ArtikelBild` - Falls Bilder hinterlegt (pruefen!)
- Evtl. Lieferanten-Kataloge als zusaetzliche Quelle

### Verknuepfungen
- **Braucht:** #58 Web-Plattform, #59 DB-Connector
- **Ergaenzt:** #9 Reparatur-Verwaltung
- **Nutzt:** KI-API (Claude Vision)

### Status
**Idee** - Komplex (KI-Vision) | **Phase:** 5

---

## #63 Fassaden-Budget (KI-Vision)

### Kontext (User)
- Kunde fragt: "Was kostet neue Fenster fuers ganze Haus?"
- Aktuell: Aufmass-Termin noetig fuer jede Schaetzung
- Wunsch: Grobe Richtung aus Foto der Fassade

### Technische Umsetzung
- **Input:** Foto von Hausfassade
- **KI-Analyse:**
  1. Fenster/Tueren zaehlen
  2. Groessen grob schaetzen (relativ zu Fassade)
  3. Typ erkennen (Dreh-Kipp, Festverglasung, etc.)
- **Kalkulation:**
  - Durchschnittspreise je Groessenklasse
  - Aufschlag fuer Extras (Rollladen, besondere Farben)
- **Output:** "ca. 12.000-18.000€" als Budgetrahmen

### Wichtig
- **Nur Richtwert!** - Kein verbindliches Angebot
- **Disclaimer:** "Genaue Preise nach Aufmass"
- **Nutzen:** Erstgespraech, Leadqualifizierung

### Verknuepfungen
- **Braucht:** #58 Web-Plattform, KI-API
- **Ergaenzt:** #6 Budget-Angebots-Generator
- **Fuehrt zu:** Aufmass-Termin wenn Kunde interessiert

### Status
**Idee** - Komplex (KI-Vision) | **Phase:** 5

---

## #64 Data Service Layer

### Kontext
- 8 Tools greifen auf `dbo.Bestellung` zu (Konfliktpotential!)
- 7 Tools greifen auf `dbo.Auftrag` zu
- Ohne zentrale Schicht: Chaos bei parallelen Zugriffen

### Technische Umsetzung
```python
# Zentrale Services statt direkter DB-Zugriff
class BestellungService:
    cache_ttl = 300  # 5min fuer Stammdaten

    def get_offene_bestellungen(self):
        # Cache pruefen, sonst DB

    def on_change(self, bestellung_id):
        # Cache invalidieren, Events feuern
```

### Architektur
```
Tools (#14, #36, #56...) → Service Layer → Cache → DB Connector → SQL Server
```

### Caching-Strategie
| Daten-Typ | TTL | Grund |
|-----------|-----|-------|
| Stammdaten (Kunden, Artikel) | 5min | Aendern sich selten |
| Live-Daten (Bestellungen) | 30s | Muessen aktuell sein |
| Montage-Status | WebSocket | Echtzeit noetig |

### Verknuepfungen
- **Braucht:** #59 DB-Connector
- **Basis fuer:** #14 Command Center, alle Dashboards
- **Teil von:** Phase 0 Infrastruktur

### Status
**Idee** - Mittel | **Phase:** 0 (Infrastruktur)

---

## #65 Anzahlungsrechnung-Automatismus

### Kurzbeschreibung
Erinnerung/Automatismus fuer Anzahlung vor Bestellung. Verhindert Cashflow-Probleme.

### Problem (IST-Zustand)
- Anzahlung wird oft vergessen bei Auftraegen anzugeben
- Bestellung geht raus ohne dass Anzahlung gestellt/bezahlt wurde
- Cashflow-Problem: Material wird bestellt, Geld kommt erst spaeter
- Risiko bei Stornierung: Firma bleibt auf Kosten sitzen

### Loesung
1. **Pflichtfeld bei Bestellung:** Vor Bestellversand pruefen ob Anzahlung gestellt
2. **Automatische Erinnerung:** Bei Auftragserstellung Anzahlung vorschlagen
3. **Report:** Uebersicht unbezahlte Anzahlungen
4. **Schwellenwert:** Ab Auftragswert X automatisch Anzahlung erforderlich

### Logik
| Auftragswert | Anzahlung |
|--------------|-----------|
| < 500 EUR | Optional |
| 500 - 2000 EUR | Empfohlen (Hinweis) |
| > 2000 EUR | Pflicht (Warnung bei Bestellung ohne) |

### SQL-Kontext
- **Tabellen:** `dbo.Auftrag`, `dbo.Rechnung` (Anzahlungsrechnung)
- **Pruefen:** Hat Auftrag eine Anzahlungsrechnung? Ist diese bezahlt?

### Implementierung
- **Einfach:** Warnung bei Bestellung wenn keine Anzahlung
- **Mittel:** Report unbezahlter Anzahlungen
- **Erweitert:** Auto-Generierung Anzahlungsrechnung bei Auftragserstellung

### Abhaengigkeiten
- **Verknuepft:** #33 Bestellwesen, #55 Bestellvorlage
- **Nutzt:** #31 Rechnungsbuch (fuer Zahlungsstatus)

### Quelle
Bestellprozess-Analyse 2025-12-11 - Andreas: "Wird von mir und allen oft vergessen"

### Status
**Idee** - Mittel | **Phase:** 2 (Kernprozesse) | **Prioritaet:** Hoch (Cashflow!)

