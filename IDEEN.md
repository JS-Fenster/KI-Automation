# Ideen für KI-Automatisierungen

**Erstellt:** 2025-12-09 | **Aktualisiert:** 2025-12-11 | **Status:** Brainstorming-Phase | **Anzahl:** 61 Ideen (4 merged)

---

## Dokumentstruktur

| Datei | Inhalt | Verwendung |
|-------|--------|------------|
| **IDEEN.md** (diese Datei) | Verdichtete Uebersicht | Schneller Ueberblick, neue Ideen eintragen |
| **[IDEEN_DETAILS.md](IDEEN_DETAILS.md)** | Technische Details + W4A-Status | SQL, Logik, Abhaengigkeiten, Eigenbau-Empfehlung |
| **[IDEEN_UEBERSICHT.html](IDEEN_UEBERSICHT.html)** | Interaktive Ansicht + **Architektur** | Filtern nach Phase, Phasen-Diagramm |

> **Regel:** Neue Ideen hier **kurz & kompakt** eintragen. Technische Details + W4A-Status in IDEEN_DETAILS.md ergaenzen.
> **Wichtig:** Bei Phasen-Aenderungen oder strukturellen Ideen (#58-60, #14) auch die **Architektur-Seite** in der HTML pruefen!

---

## Uebersicht nach Phase (NEU: Nach Abhaengigkeiten)

| Phase | Beschreibung | Tools |
|-------|--------------|-------|
| **0** | **INFRASTRUKTUR** - Web-Plattform, DB, Auth, Services | #58, #59, #60, #64 |
| **1** | **BASIS-MODULE** - Erste Tools auf Plattform | #1, #4 ✅, #13, #57, #39, #40 |
| **2** | **KERNPROZESSE** - Aufbauende Tools | #9, #10, #11, #22, #24, #28, #32, #33, #36, #37, #38, #43, #53, #55, #56, #61, #65 |
| **3** | **KOMMUNIKATION** - E-Mail, CRM, Kunden | #3, #6, #12, #23, #25, #27, #30, #41, #45, #46, #47, #49, #50 |
| **4** | **COMMAND CENTER** - Dashboard vereint alles | #14 (integriert #36, #44, #51, #52) |
| **5** | **KI-FEATURES** - Intelligente Erweiterungen | #2, #5, #7, #8, #18, #20, #21, #29, #62, #63 |

> **Logik:** Erst Infrastruktur → dann Module → dann Dashboard das alles zusammenfuehrt → dann KI

---

## Phase 0: Infrastruktur ⭐ ZUERST

### #58 Web-Plattform Grundgeruest
Basis fuer alle Tools: Web-Framework, Routing, Templates.
- **Tech-Empfehlung:** Python Flask + Bootstrap (responsive)
- **Features:** Startseite, Navigation, Login
- **Voraussetzung fuer:** Alle anderen Tools

### #59 Datenbank-Connector
Sichere Verbindung zu W4A SQL Server fuer alle Tools.
- **Tech:** pyodbc, Connection-Pool, sichere Credentials
- **Bereits vorhanden:** Grundlagen in ki_wissen_updater.py
- **Erweitern:** Wiederverwendbare db_connector.py fuer alle Tools

### #60 Auth & Berechtigungen
Wer darf was sehen? Login-System.
- **Einfach:** Username/Passwort, Session-basiert
- **Spaeter:** AD-Integration moeglich
- **Wichtig:** Nicht jeder soll alles sehen (Finanzen vs. Monteure)

### #64 Data Service Layer
Zentrale Datenzugriffs-Schicht fuer alle Tools (8 Tools greifen auf dbo.Bestellung zu!).
- **Services:** BestellungService, AuftragService, KundeService
- **Cache:** Stammdaten 5min TTL, Live-Daten 30s Polling
- **Events:** Cache-Invalidierung bei Schreibzugriffen
- **Basis fuer:** #14 Command Center, alle Dashboards

---

## Phase 1: Basis-Module

### #1 Preislisten-Tool (PDF → Excel)
PDF-Preislisten (ROKA, Weru, etc.) automatisch in Excel-Artikelstamm importieren.
- **I/O:** PDF → Excel-Artikelstamm
- **Features:** PDF-Parsing, Artikel-Matching, Dry-Run, Backup
- **Status:** Planung

### #4 KI-Wissensdatenbank ✅ FERTIG
Selbst-aktualisierende Wissensdatei mit KI/Automation-News.
- **Impl.:** `ki_wissen_updater.py`, Task Scheduler (So 03:00)

### #13 Inventar-Verwaltung
Erweiterung Work4all: Rechnungslink, Standort-Tracking, QR-Codes, Ausleihe.
- **SQL:** `dbo.Inventar`, `dbo.Lagerort`

---

## Phase 2: Kernprozesse

### #9 Reparatur-Verwaltung
Reklamationen, Garantieprüfung, Status-Tracking, Foto-Dokumentation.
- **SQL:** `dbo.Auftrag` (ReparaturauftragCode)

### #10 Aufträge & Lieferungen
Zentrale Auftragsverwaltung: Aufträge, Abholungen, Lieferungen ±Montage.
- **SQL:** `dbo.Auftrag`, `dbo.Lieferschein`

### #11 Terminfindung
Intelligente Terminplanung für Aufmaße, Beratungen, Montagen.
- **SQL:** `dbo.Termine`, `dbo.TermineTeilnehmer`
- **Features:** Online-Buchung, Geo-Optimierung, Erinnerungen

### #22 Routenplanung
Tourenoptimierung: Fahrzeit minimieren, Termine clustern.
- **ROI:** ~292 Std/Jahr, 11.500 km gespart

### #24 Ticket-System Integration + Schnell-Erfassung
Auto-Tickets aus E-Mails, Eskalation, SLA-Tracking.
- **Schnell-Erfassung** (ehem. #46): Telefon klingelt → 1-Klick: Name, Bedarf, Rueckruf
- **Vorgangsnummern-System** (aus Brainstorming 2025-12-11):
  - 🔢 Auto-Vorgangsnummer bei jeder Kundenanfrage (z.B. V-2025-001234)
  - 📧 Bestaetigung an Kunden: "Ihre Anfrage unter V-XXXX erfasst"
  - 🔗 Alle Kommunikation unter dieser Nummer auffindbar
  - ⏱️ SLA: Antwort-Ziel innerhalb X Stunden

### #28 Digitales Aufmaß + Zubehör + Mobiles Formular
Maßerfassung mit auto. Zubehör-Berechnung (Fensterbänke, Rollläden).
- **Mobiles Formular** (ehem. #61): Digitale Erfassung statt Papierzettel beim Kunden
- **Features:** Responsive Web-Formular, Fotos anhaengen, Offline-Sync
- **Loest:** Papierzettel verloren, muss abgetippt werden

### #32 Projekt- & Unterprojektverwaltung
Hierarchisch: Hauptprojekt → Unterprojekte → ERP-Dokumente.
- **SQL:** `dbo.Objekte`, `dbo.Auftrag`, `dbo.Angebot`
- **Verknüpft:** Alle Dokumente (#31, #33, #34)

### #33 Bestellwesen & Lieferanten-Aufträge
Bedarfsermittlung → Bestellung → Wareneingang.
- **SQL:** `dbo.Bestellung`, `dbo.Wareneingang`

### #36 Beschaffungs-Dashboard ⭐ PRIORITÄT
Echtzeit-Übersicht kritischer Bestellvorgänge - verhindert Stillstand bei Montagen.
- **Ampel-System:** Offene Bestellungen ohne AB, überfällige Lieferungen, Abholware beim Lieferanten
- **SQL:** `dbo.Bestellung` (Bestätigt, WEDatum, LieferterminTatsächlich, Abgeschlossen)
- **Problem löst:** Ware geht unter → Montage verzögert → Kunde wartet
- **Features:** Tägliche Alerts, Eskalation, Lieferanten-Kontakt-Reminder

### #37 WoT-XML Transformer (Weru Konfigurator)
XML aus WoT (Weru WPS on Top) aufbereiten fuer sauberen W4A-Import.
- **Quelle:** WoT Konfigurator exportiert XML
- **Problem:** Redundante Texte, kein Lieferant, unuebersichtlich
- **Features:**
  - Mehrfach vorkommende Infos in Kopftext verschieben
  - Positionstexte schlank halten (nur Raum, Masse, Sonder-Optionen)
  - Lieferant "Weru" je Position einfuegen (auto. Zuordnung im ERP)
- **I/O:** XML rein → transformierte XML raus → Drag&Drop in W4A

### #38 Lagerverwaltung & Inventur
Bestandsfuehrung, Inventur-Prozess, Wareneingangsbuchung.
- **Ist-Zustand:** Excel + Papier, W4A-Lager nicht aktiv
- **W4A-Potential:** Lagerfunktion vorhanden aber ungenutzt
- **Problem:** Teillieferungen werden als Komplett-Lieferung gebucht
- **Verknuepft:** #33 Bestellwesen, #36 Beschaffungs-Dashboard

### #39 Tages-Briefing Monteur (Montage-Mappe)
Automatisch generierte Unterlagen statt manueller Zusammenstellung durch Buero.
- **Problem:** Susann stellt manuell zusammen → zu viele Blaetter, falsche Dokumente (Angebots-Aufmass statt Bestell-Aufmass)
- **Loesung:** 1-3 Seiten pro Auftrag: Uebersicht, relevante Masse, Besonderheiten
- **Output:** PDF druckbar oder digital (Handy/Tablet - Endgeraete pruefen!)
- **NEU: Montage-Rueckmeldung** - Monteur dokumentiert:
  - Zusatzarbeiten vor Ort (wird sonst vergessen bei Rechnung!)
  - Material zurueckgelegt (ohne Dokumentation = Verlust)
  - Aenderungen gegenueber Auftrag
- **NEU: Digitale Erfassung statt Papier** (aus Brainstorming 2025-12-11):
  - 📱 Tablet/Handy-App statt handschriftliche Seite 2
  - 📷 Foto-Upload vor Ort (statt "defekt" beschreiben)
  - 🎤 Spracheingabe (nutzt #7) - KI analysiert und strukturiert
  - ⚡ Sofort im System (nicht Papier ins Lager → naechster Tag Buero)
  - Strukturierte Eingabe: Dropdown + Textfeld + Foto
- **Loest:** Papierkram, Kommunikation, Fehler, fehlende Rechnungspositionen, Entzifferungs-Aufwand

### #40 Material-Kommissionierliste
Auto-generierte Checkliste: Was muss ins Auto? Abhaken vor Abfahrt.
- **Quelle:** Auftragspositionen aus BESTELLUNG (nicht Angebot!)
- **Teil von #39:** Kann als Seite in Montage-Mappe integriert werden
- **Loest:** Vergessenes Material, Fehlfahrten

### #43 Kanban-Dashboard fuer Ticketsystem
Grafische Kachel-Ansicht fuer W4A-Tickets (Restarbeiten, Montage, Reparaturen, Reklamationen).
- **Loest:** Schneller visueller Ueberblick statt Tabelle
- **Nutzt:** Bestehende W4A Ticketliste-Daten
- **Vorbild:** Outlook-Kacheln + Trello-Style
- **Hinweis:** W4A Ticketsystem existiert bereits - es fehlt nur grafische Oberflaeche

### #53 Mindestbestand-Alert
Warnung bei kritischem Lagerbestand (Silikon, Dichtungen, etc.)
- **Loest:** Ueberblick, Engpaesse vermeiden

### #65 Anzahlungsrechnung-Automatismus ⭐ NEU
Erinnerung/Automatismus fuer Anzahlung vor Bestellung.
- **Problem:** Anzahlung wird oft vergessen → Cashflow-Problem
- **Loesung:** Vor Bestellung pruefen ob Anzahlung gestellt/bezahlt
- **Features:** Automatische Erinnerung, Pflichtfeld bei Bestellung, Report unbezahlte Anzahlungen
- **Verknuepft:** #33 Bestellwesen, #55 Bestellvorlage
- **Quelle:** Bestellprozess-Analyse 2025-12-11

---

## Phase 3: Kommunikation

### #3 Weru Förderanträge
Auto-Ausfüllen von Förderanträgen (KfW, BAFA) über Weru Portal.

### #6 Budget-Angebots-Generator
Auto-Angebote aus Elementlisten oder manueller Eingabe.
- **Input:** Manuell, Excel, oder #5 Bauplan

### #12 E-Mail-Verarbeitung
Automatische Sortierung, Klassifizierung, Zuordnung.
- **Zeitfresser 1:** Spam filtern → Auto-Markierung
- **Zeitfresser 2:** Rechnungen/Bestellungen → Erkennung (Absender+Betreff+Anhang) → Auto-Ablage + Druck
- **Zeitfresser 3:** Kundenanfragen → Klassifizierung (Angebot vs. Reparatur) → Richtige Person zuweisen
- **Tech:** Regeln + LLM fuer Grenzfaelle
- **Sicherheit:** SELECT immer, INSERT nur Historie, nie UPDATE/DELETE

### #23 Verkaufschancen-Pipeline + Angebots-Reminder
Lead-Bewertung, Scoring, Follow-up-Erinnerungen.
- **Angebots-Reminder** (ehem. #45): Automatisch nach X Tagen nachfassen
- **2-Tage-Regel:** Proaktiv Mehrwert bieten (alternative Loesung, Kostenoptimierung)
- **Priorisierung:** Nach Volumen + Deckungsbeitrag

### #25 Telefon-CRM Integration
Anrufer-Erkennung, Kundendaten-Popup, Notizen.

### #27 Dokument-Intelligenz
Auto-Klassifizierung, OCR, Metadaten, Volltextsuche.

### #30 After Sales Service
Proaktive Kundenbetreuung: Wartung, Cross-Selling.

### #41 Montage-Status Live
Monteur meldet: angekommen, fertig, Problem → alle sehen Status.
- **NEU: Auto-Benachrichtigung an Kunde** (aus Brainstorming 2025-12-11):
  - 📲 SMS/E-Mail bei Statusaenderung: "Montage abgeschlossen"
  - ⚠️ "Restarbeiten noetig, Material wird bestellt, wir melden uns"
  - 📅 "Neuer Termin: XX.XX.XXXX"
  - **Problem loest:** Kunde gibt Zugang, ist nicht da, weiss nicht ob jemand kommt
- **Loest:** Ueberblick, Kommunikation, Kunden-Information

### #45 ~~Angebots-Reminder~~ → merged in #23
*Integriert in #23 Verkaufschancen-Pipeline*

### #46 ~~Schnell-Erfassung Anfrage~~ → merged in #24
*Integriert in #24 Ticket-System Integration*

### #47 Kunden-Historie Dashboard + Wiederkauf-Erkennung
Alle Kontakte, Angebote, Auftraege, Reklamationen auf einen Blick.
- **Wiederkauf-Erkennung** (ehem. #48): "Familie Mueller hat 2019 schon Fenster gekauft"
- **Features:** Timeline-Ansicht, historische Auftraege, Cross-Selling-Hinweise
- **Loest:** Suchen, Ueberblick, Stammkunden erkennen

### #49 Google-Reviews Alerts
Neue Bewertung? Sofort Bescheid, schnell reagieren.
- **Loest:** Kommunikation, Reputation

### #50 Sanfte Zahlungserinnerung
Auto-Mail "Rechnung offen" bevor formelle Mahnung.
- **Loest:** Manuelle Eingaben, freundliche Kommunikation

---

## Phase 4: Analytics & Personal

### #2 Bilanz & GuV-Auswertung
Kennzahlen, Trendprognosen, Branchenvergleich.

### #14 Command Center (Zentrales Dashboard) ⭐
**Ein Dashboard fuer alles** - nicht viele einzelne!
- **Tab "Heute":** Auftraege ohne Bestellung, Bestellungen ohne AB, Montagen, E-Mails
- **Tab "Bestellungen":** #36 Beschaffungs-Dashboard integriert
- **Tab "Kapazitaet":** #44 Auslastung integriert
- **Tab "Finanzen":** #51 Cashflow, #52 Conversion integriert
- **Tab "KPIs":** Umsatz, Kennzahlen, Trends
- **Alerts oben:** Kritisches immer sichtbar (rote Badges)
- **Responsive:** Von ueberall erreichbar (Handy, Tablet, PC)

### #15 Zeiterfassung & Auslastung
Projektbezogene Zeit, Kapazitätsplanung. Basis für #34.

### #16 Urlaubsverwaltung
Digitale Anträge, Teamkalender. Basis für #35.

### #17 Projekt-Deckungsbeitrag
Soll-Ist-Vergleich, Nachkalkulation, Budgetwarnung.

### #19 Lieferanten-Bewertung
Auto-Scoring: Liefertreue, Qualität, Preis, Kommunikation.

### #26 Projekt-Aktivitäten-Tracking
Auto-Protokoll aller Aktivitäten, Timeline-Ansicht.

### #31 Rechnungsbuch & Finanzdokumentation
Ein-/Ausgangsrechnungen, Mahnwesen, DATEV-Export, Liquiditätsvorschau.
- **SQL:** `dbo.Rechnung`, `dbo.Zahlung`
- **Features:** OCR, Projekt-Verknüpfung (#32), Zahlungsabgleich

### #34 Erweiterte Zeiterfassung (GPS)
Projektzuordnung Pflicht, GPS-Vorschläge, QR-Code-Erfassung.
- **Erweitert:** #15
- **Datenschutz:** Nur Arbeitszeit, abschaltbar, 30 Tage Löschung

### #35 Urlaubsplaner & Abwesenheitsmanagement
Teamkalender, auto. Kapazitätsprüfung, Genehmigungsworkflow, Termin-Konfliktprüfung.
- **Erweitert:** #16

### #42 Foto-Zuordnung
Handy-Foto → Auto-Erkennung Projekt/Kunde → richtige Akte.
- **Loest:** Manuelle Eingaben, Ablage

### #44 Kapazitaets-Cockpit
Wie voll ist die Woche? Wer hat noch Luft? Uebersicht Auslastung.
- **Loest:** Ueberblick, Planung

### #48 ~~Wiederkauf-Erkennung~~ → merged in #47
*Integriert in #47 Kunden-Historie Dashboard*

### #51 Cashflow-Prognose
Wann kommt Geld, wann geht's raus? Liquiditaets-Ampel.
- **Loest:** Ueberblick, Planung

### #52 Conversion-Tracker
Wie viel % der Angebote werden Auftraege? Trend ueber Zeit.
- **Loest:** Ueberblick, Vertriebssteuerung

### #54 Preis-Vergleich Lieferanten
Gleicher Artikel, verschiedene Lieferanten → bester Preis.
- **Loest:** Suchen, Einkaufsoptimierung

### #55 Bestellvorlage mit Pflichtfeldern ⭐ PRIO
Verhindern dass Lieferwoche/Adresse vergessen wird.
- **Problem:** Roland/Vater bestellen ohne KW → Ware zu frueh
- **Loesung:** Bestellformular mit Pflichtfeld KW, Lieferadresse automatisch je Artikel-Typ (gross → Lager, klein → Buero)
- **Prio:** 3 von 4 im Bestellprozess

### #56 AB-Abgleich automatisch ⭐ PRIO
Neue AB automatisch mit Bestellung vergleichen.
- **Problem:** Haendisch neue AB mit alter AB pruefen = muehsam, Fehler
- **Loesung:** PDF-Vergleich, Abweichungen markieren/melden
- **Prio:** 2 von 4 im Bestellprozess

### #57 Lieferadressen-Logik ⭐ PRIO
Richtige Lieferadresse automatisch je Artikel-Typ.
- **Problem:** Falschlieferungen ins Buero statt Lager, Paketdienste sollen aber ins Buero
- **Loesung:** Grosse Teile (Fenster, Tueren) → Lager | Kleinteile/Pakete → Buero
- **Prio:** 1 von 4 im Bestellprozess (WICHTIGSTE!)

### #61 ~~Mobiles Aufmass-Formular~~ → merged in #28
*Integriert in #28 Digitales Aufmass + Zubehoer*

---

## Phase 5: KI-Vollausbau

### #5 Bauplan-Analyse
KI-Vision liest Baupläne, extrahiert Maße, generiert Elementlisten.
- **Tech:** Claude Vision, OCR, CAD-Parser

### #7 Spracherkennung
Diktat, Aufmasse vor Ort, Anweisungen per Sprache.
- **Tech:** Whisper, Intent-Erkennung
- **NEU: KI-Analyse in Echtzeit** (aus Brainstorming 2025-12-11):
  - 🎤 Monteur diktiert statt schreiben: "Endleiste 921mm fehlt, muss nachbestellt werden"
  - 🤖 KI erkennt: Material (Endleiste), Mass (921mm), Aktion (Nachbestellung)
  - ❓ KI fragt nach: "Welche Farbe? Welches Element?"
  - ⚡ Auto-Trigger: Material → Bestellliste, Restarbeit → #41 Status, Besonderheit → Dokumentation
- **Weitere Einsatzzwecke:**
  - 📞 Telefonnotizen: Gespraech diktieren, KI strukturiert
  - 🏗️ Aufmass diktieren: "Fenster links 1200 mal 1400"
  - 📋 Morgen-Briefing protokollieren: Wer macht was heute
  - 💬 Kundenaussagen festhalten: "Herr Mueller hat bestaetigt dass..."
- **Verknuepft:** #39 Montage-Mappe (Rueckmeldung), #61 Mobiles Aufmass

### #8 Universal-Eingabe-Hub
Das "Gehirn": Multi-Input → LLM Dispatcher → Workflows.
- **Orchestriert:** Alle Tools

### #18 Kundenportal
Self-Service: Status, Termine, Dokumente, Reklamation.

### #20 Qualitätsmanagement
Reklamations-Tracking, KVP, Audit-Vorbereitung.

### #21 Mobile Monteur-App
Unified: Tagesplan, Navigation, Checklisten, Fotos, Unterschrift, Zeit.

### #29 Montage-Checklisten
Auto-Checklisten aus Aufmaß: Material, Werkzeug, Arbeitsschritte.

### #62 Ersatzteil-Erkennung (KI-Vision)
Foto von defektem Teil → KI erkennt → Ersatzteil finden.
- **Problem:** Bei Reparaturen: "Was ist das fuer ein Teil?"
- **Loesung:** Foto machen → KI identifiziert Hersteller/Typ → Ersatzteil vorschlagen
- **Tech:** Claude Vision, Artikelstamm-Abgleich
- **Verknuepft:** #9 Reparatur-Verwaltung

### #63 Fassaden-Budget (KI-Vision)
Hausfoto → KI zaehlt Fenster/Tueren → grobes Budgetangebot.
- **Problem:** Kunde fragt "Was kostet neue Fenster fuers ganze Haus?"
- **Loesung:** Foto von Fassade → KI erkennt Anzahl + geschaetzte Groessen → Budgetrahmen
- **Tech:** Claude Vision, Durchschnittspreise
- **Output:** "ca. 12.000-18.000€" als Richtwert fuer Erstgespraech

---

## Komplexitaet

| Stufe | Tools |
|-------|-------|
| 🟢 Einfach | #4 ✓, #29, #49, #57 |
| 🟡 Mittel | #1, #3, #6, #9, #10, #13, #15, #16, #19, #23, #24, #28, #31, #33, #36, #37, #38, #39, #40, #43, #47, #50, #53, #55, #65 |
| 🟠 Anspruchsvoll | #2, #11, #12, #14, #17, #18, #22, #25, #26, #27, #30, #32, #34, #35, #41, #42, #44, #51, #52, #54, #56 |
| 🔴 Komplex | #5, #7, #8, #20, #21, #62, #63 |
| ⚫ Merged | #45→#23, #46→#24, #48→#47, #61→#28 |

---

## Nächste Schritte

1. **Sofort:** #1 Preislisten-Tool
2. **Kurzfristig:** #13 Inventar, Phase 2 planen
3. **Mittelfristig:** Phase 2-3 umsetzen
