# Reparaturprozess - Analyse & Automatisierungsplan

**Firma:** Fenster- und Türenservice
**Erstellt am:** 2025-12-05
**Letzte Aktualisierung:** 2025-12-10
**Erstellt für:** Andreas Stolarczyk
**Status:** Brainstorming & Konzeptphase

---

## ⚠️ CLAUDE: Neue Prozess-Infos hier + in SQL_Server_Wissensdatenbank.md dokumentieren!

---

## 📋 Inhaltsverzeichnis

1. [Prozessübersicht](#prozessübersicht)
2. [Detaillierter Prozessablauf](#detaillierter-prozessablauf)
3. [Identifizierte Schmerzpunkte](#identifizierte-schmerzpunkte)
4. [Automatisierungspotenziale](#automatisierungspotenziale)
5. [Technische Lösungsansätze](#technische-lösungsansätze)
6. [Vorgeschlagene System-Architektur](#vorgeschlagene-system-architektur)
7. [Implementierungs-Roadmap](#implementierungs-roadmap)
8. [Offene Fragen & Entscheidungen](#offene-fragen--entscheidungen)

---

## 📊 Prozessübersicht

### Geschäftsprozess
**Reparaturservice für Fenster und Türen**
- Kundenerstkontakt über 3 Kanäle
- Sicherheitsanzahlung (100 EUR Pauschale)
- Vor-Ort-Termin beim Kunden
- Ersatzteilbeschaffung
- Folgetermin-Koordination
- Reparaturdurchführung
- Abrechnung über ERP

### Team & Volumen (Stand: Dez. 2025)
- **Hauptmonteur:** Stefan Häckl (Servicetechniker, Gruppe 03 Montage)
- **Volumen:** 5-8 Reparaturen/Tag (Stefan)
- **Gelegentlich:** Team 1-2 parallel (bei lukrativeren Reparaturen)
- **Monatsdurchschnitt:** ~31 REP/EA Rechnungen (375 in 12 Monaten)

### Zahlungsausfall-Lösung ✅
- **Problem (vor 2 Jahren):** ~30 Storno-Rechnungen <100 EUR
- **Lösung:** Auftragsformular mit Unterschrift VOR Arbeitsbeginn
- **Ergebnis:** Seit Einführung keine Ausfälle mehr (1x Ausnahme ohne Unterschrift)
- **Stammkunden:** Kein Formular nötig (vertrauenswürdig)

### Aktueller Tech-Stack
- **ERP-System:** "Work for All" (WorkM001 Datenbank)
- **Datenbankzugriff:** SQL Server (192.168.16.202\SQLEXPRESS)
- **Kalender:** Outlook (wird als Status-Management missbraucht)
- **Dokumentenverwaltung:** Physisch + Scannen

### Verfügbare Automatisierungs-Tools
- n8n (Workflow-Automation)
- Python/Node.js (Custom Development)
- SQL Server Zugriff (bereits etabliert)
- Claude Code (AI-gestützte Entwicklung)
- Potenzial: Voice Bot, Web Scraping, etc.

### Preisstruktur (aus Datenbank-Analyse)

#### Anfahrt-Zonen (20 Zonen, je 10km)
| Zone | Entfernung | Preis (WVK) |
|------|------------|-------------|
| 01 | bis 5 km | 13,44 € |
| 02 | bis 15 km | 26,89 € |
| 05 | bis 45 km | 67,22 € |
| 10 | bis 95 km | 134,45 € |
| 20 | bis 195 km | 268,90 € |

**Formel:** ~13,44 € pro 10 km

#### Dienstleistungs-Preise
| Artikel | Preis |
|---------|-------|
| Reparatur (Stundensatz) | 50,42 €/h |
| Stundenpauschale Autokran | 350,00 €/h |
| Stundenpauschale Minikran | 480,00 €/h |

#### Preisgruppen
| Code | Name | Hinweis |
|------|------|---------|
| 0 | Neukunde | Standard |
| 1 | Bestandskunde | Stammkunden |
| 2 | Großkunde | Sonderkonditionen |
| 4 | Wiederverkäufer | Händler-EK |

**Hinweis:** Preise stehen in dbo.Preise (nur Wiederverkäufer hat 6.475 Einträge)

---

## 🔄 Detaillierter Prozessablauf

### Phase 1: Kundenerstkontakt

#### Eingangskanäle
1. **E-Mail** - Kunde schreibt
2. **Telefon** - Kunde ruft an
3. **Walk-In** - Kunde kommt in den Laden

**Aktueller Ablauf:**
- Manuelle Erfassung der Anfrage
- Manuelle Prüfung: Ist der Kunde bereits im System?
- Manuelle Terminvereinbarung für Vor-Ort-Besuch

**Output:** Termin für Erstbesichtigung

---

### Phase 2: Sicherheitsanzahlung (100 EUR Pauschale)

#### Zweck
Absicherung bei Neukunden vor Vor-Ort-Besuch

#### Vertragstext
> "Pauschale für Instandsetzungsarbeiten bis zu einem Bruttogesamtwert von 100 Euro, inklusive Anfahrt, sowie Verwaltungs- und Rüstkostenpauschale, sind damit abgegolten. - auch Material ist inbegriffen bis Gesamtwert 100€"

**Aktueller Ablauf:**
- Mitarbeiter lässt Auftrag **vor Ort** beim Kunden unterschreiben
- **VOR** Beginn jeglicher Arbeiten
- Physisches Dokument

**Problem:** Dokument muss später zurück zur Firma und gescannt werden

---

### Phase 3: Vor-Ort-Besichtigung beim Kunden

#### Szenario A: Sofortige Reparatur möglich
- Mitarbeiter führt Reparatur direkt durch
- Dokumente werden physisch mitgenommen
- **Pain:** Dokumente müssen später gescannt und digital abgelegt werden
- **Automatisierungspotenzial:** Gering, aber Dokumentenhandling verbesserbar

#### Szenario B: Ersatzteile benötigt (HAUPTSZENARIO)
Der Mitarbeiter muss vor Ort:

1. **Fotos machen** (von Fenster/Tür/Schaden)
2. **Maße nehmen** (Abmessungen notieren)
3. **Ersatzteil-Recherche** (welches Teil wird benötigt?)
   - Erfolgt normalerweise **nach** Rückkehr ins Büro
   - Zeitaufwändig
   - Manuelle Websuche bei verschiedenen Lieferanten

**Output:**
- Fotodokumentation
- Maße
- Ersatzteil-Anforderung

---

### Phase 4: Ersatzteilbeschaffung

**Aktueller Ablauf:**
- Mitarbeiter recherchiert Ersatzteil-Verfügbarkeit
- Manuelle Suche bei verschiedenen Lieferanten (Webseiten)
- Bestellung
- Wartezeit bis Lieferung

**Automatisierungspotenzial:**
- Web Scraping bei Lieferanten
- Automatische Verfügbarkeits-Prüfung
- Preis-Vergleich
- Bestellvorschlag

**Datenbankzugriff notwendig:** Nein (noch nicht)

---

### Phase 5: Folgetermin-Koordination ⚠️ KRITISCHER SCHMERZPUNKT

**Trigger:** Ersatzteil ist bestellt und eingetroffen

**Aktueller Ablauf:**
1. Mitarbeiter muss Kundendaten aus ERP suchen
2. Manuelle Prüfung: Existiert Kundendatensatz?
3. Wenn nein: Manuell anlegen
4. Wenn ja: Daten manuell abrufen
5. Kalender manuell prüfen (Outlook)
6. Kunden manuell kontaktieren (Telefon/E-Mail)
7. Hin- und Her-Kommunikation für Terminfindung
8. Termin manuell in Outlook eintragen
9. **Status-Tracking über Outlook-Kalender** (Missbrauch des Kalenders)

**Zeitaufwand:** EXTREM HOCH - "großer Zeitfresser"

**Automatisierungspotenzial:** SEHR HOCH
- Voice Bot für automatische Terminkoordination
- Automatischer Kundendaten-Abruf aus SQL
- Automatische Kalender-Prüfung
- Automatisches Anlegen neuer Kundendatensätze
- Status-Tracking in dediziertem System

**Datenbankzugriff notwendig:** JA
- Kundendaten lesen (dbo.Kunde vermutlich)
- Neue Kunden anlegen (INSERT)
- Termindaten schreiben

---

### Phase 6: Reparaturdurchführung

**Ablauf:**
- Mitarbeiter fährt zum Kunden (Folgetermin)
- Reparatur wird durchgeführt
- Dokumentation (Fotos, Arbeitsnachweis)

**Automatisierungspotenzial:** Gering
- Dokumenten-Upload direkt vor Ort (Google Drive/OneDrive)

---

### Phase 7: Abrechnung & ERP-Integration

**Aktueller Ablauf:**
- Rechnungserstellung im ERP "Work for All"
- Unterschriebener Reparaturauftrag muss im ERP hinterlegt werden
- Abrechnungsrelevante Summen müssen ins ERP

**Problem:**
- Daten liegen in verschiedenen Systemen
- Manuelle Übertragung ins ERP notwendig

**Automatisierungspotenzial:**
- Automatisches Schreiben in ERP-Datenbank
- Dokumenten-Verlinkung
- Automatische Rechnungserstellung

**Datenbankzugriff notwendig:** JA
- Auftragsdaten schreiben
- Rechnungsdaten schreiben
- Dokumente verlinken

---

## 🔴 Identifizierte Schmerzpunkte

### 1. Dokumentenhandling (Mittlere Priorität)
**Problem:**
- Physische Dokumente (unterschriebener Auftrag) müssen mitgenommen werden
- Zurück im Büro: Scannen + digitale Ablage notwendig
- Zeitverlust, Medienbruch

**Auswirkung:**
- Verzögerung
- Fehleranfälligkeit
- Zusätzlicher Arbeitsschritt

---

### 2. Ersatzteil-Recherche (Mittlere-Hohe Priorität)
**Problem:**
- Manuelle Websuche bei verschiedenen Lieferanten
- Zeitaufwändig
- Keine Übersicht über Verfügbarkeit/Preise
- Erfolgt oft erst nach Rückkehr ins Büro

**Auswirkung:**
- Verzögerung
- Suboptimale Lieferanten-Auswahl
- Zusätzlicher Zeitaufwand

---

### 3. Folgetermin-Koordination ⚠️ KRITISCH (Höchste Priorität)
**Problem:**
- **"Großer Zeitfresser"** (Originalzitat)
- Manuelle Kundendaten-Recherche im ERP
- Manuelle Kalenderprüfung
- Manuelle Telefonkommunikation (Ping-Pong)
- Statusverfolgung über Outlook-Kalender-Missbrauch

**Auswirkung:**
- MASSIVER Zeitverlust
- Frustrierender Prozess
- Fehleranfälligkeit
- Schlechte Übersicht über Reparaturstatus

---

### 4. Status-Management via Outlook-Kalender (Hohe Priorität)
**Problem:**
- Outlook-Kalender wird zweckentfremdet für Status-Tracking
- "Missbrauch des Outlook-Kalenders für Statusmanagement"
- Unübersichtlich
- Nicht dafür gedacht
- Keine strukturierte Workflow-Abbildung

**Auswirkung:**
- Schlechte Übersicht
- Fehleranfälligkeit
- Schwierige Nachverfolgung
- Team-Koordination erschwert

---

### 5. ERP-Integration (Mittlere Priorität)
**Problem:**
- Daten müssen am Ende manuell ins ERP übertragen werden
- Unterschriebene Aufträge müssen manuell verknüpft werden
- Abrechnungsdaten müssen manuell eingepflegt werden

**Auswirkung:**
- Doppelarbeit
- Fehleranfälligkeit
- Zeitverlust

---

### 6. Kundendaten-Management (Mittlere-Hohe Priorität)
**Problem:**
- Manuelle Prüfung: Existiert Kunde im System?
- Wenn nein: Manuelles Anlegen
- Kein einheitlicher Prozess für Neukundenerstellung

**Auswirkung:**
- Zeitverlust
- Inkonsistente Datenpflege
- Fehleranfälligkeit

---

## ✨ Automatisierungspotenziale

### 🟢 Quick Wins (Kurzfristig umsetzbar)

#### 1. Digitale Dokumentenerfassung vor Ort
**Lösung:**
- Google Drive / OneDrive App auf Mitarbeiter-Smartphones
- Scan-Funktion nutzen
- Direkter Upload vom Kundenstandort
- Automatische Ordnerstruktur (z.B. nach Kundennummer)

**Technologie:**
- Mobile Apps (Google Drive/OneDrive)
- Evtl. n8n Webhook für Benachrichtigungen

**Aufwand:** Niedrig
**Impact:** Mittel
**Datenbankzugriff:** Nein

---

#### 2. Automatische Kundendaten-Recherche
**Lösung:**
- n8n Workflow mit SQL-Abfrage
- Eingabe: Kundenname oder Telefonnummer
- Output: Kundendatensatz oder "Nicht gefunden"

**Technologie:**
- n8n mit Microsoft SQL Node
- SQL Query auf dbo.Kunde (vermutlich KAnsprechp oder ähnliche Tabelle)

**Aufwand:** Niedrig
**Impact:** Mittel
**Datenbankzugriff:** JA (Lesen)

**SQL-Beispiel:**
```sql
SELECT TOP 1 *
FROM dbo.KAnsprechp
WHERE Name LIKE '%Kundenname%'
OR Telefon = '...'
```

---

### 🟡 Mittelfristige Optimierungen

#### 3. Ersatzteil-Recherche-Agent
**Lösung:**
- Web Scraping Bot
- Durchsucht automatisch mehrere Lieferanten-Webseiten
- Preis- und Verfügbarkeitsvergleich
- Ausgabe: Liste mit Optionen (Preis, Lieferzeit, Verfügbarkeit)

**Technologie:**
- n8n mit HTTP Request Nodes
- Python mit BeautifulSoup/Selenium (bei komplexeren Seiten)
- Evtl. AI-Agent (Claude) für intelligente Interpretation

**Input:**
- Produktbeschreibung
- Maße
- Fotos (optional, für AI-Analyse)

**Aufwand:** Mittel
**Impact:** Mittel-Hoch
**Datenbankzugriff:** Nein (aber Speicherung der Ergebnisse sinnvoll)

---

#### 4. Automatisches Anlegen neuer Kunden
**Lösung:**
- n8n Workflow oder Python-Skript
- Eingabe: Kundendaten (Name, Adresse, Telefon, E-Mail)
- Automatischer INSERT in SQL-Datenbank

**Technologie:**
- n8n Microsoft SQL Node (INSERT)
- Oder Python mit pyodbc

**Aufwand:** Niedrig-Mittel
**Impact:** Mittel
**Datenbankzugriff:** JA (Schreiben)

**SQL-Beispiel:**
```sql
INSERT INTO dbo.KAnsprechp (Name, Telefon, Email, Angelegt, ...)
VALUES (?, ?, ?, GETDATE(), ...)
```

**Hinweis:** Tabellen-Schema aus Wissensdatenbank verwenden!

---

### 🔴 Strategische Kernsysteme (Langfristig, hoher Impact)

#### 5. Voice Bot für Terminkoordinierung ⭐ GAME CHANGER
**Lösung:**
- KI-gesteuerter Voice Bot
- Ruft Kunden automatisch an
- Führt Terminvereinbarung durch
- Gleicht verfügbare Termine mit Kalender ab
- Bestätigt Termin direkt

**Ablauf:**
1. Trigger: Ersatzteil ist eingetroffen (n8n Workflow)
2. Voice Bot wird aktiviert
3. Kundendaten werden aus SQL-Datenbank geladen
4. Kalender-API wird abgefragt (freie Termine)
5. Bot ruft Kunden an
6. Terminvereinbarung im Gespräch
7. Termin wird automatisch in Kalender eingetragen
8. Status-Update im Reparatur-System

**Technologie:**
- Voice Bot Service (z.B. Bland AI, Vapi.ai, ElevenLabs + OpenAI)
- n8n für Orchestrierung
- SQL-Datenbank für Kundendaten
- Kalender-API (Google Calendar / Outlook API)

**Aufwand:** Hoch
**Impact:** SEHR HOCH ⭐
**Datenbankzugriff:** JA (Lesen: Kundendaten, Schreiben: Termin-Status)

---

#### 6. Dediziertes Reparatur-Management-System 🎯 KERNEMPFEHLUNG
**Lösung:**
Eigenes System bauen statt ERP-Workflows

**Kernidee:**
> "Wir glauben, dass wir eher den großen Schritt gehen und ein eigenes Reparatursystem bauen, was dann eben nur noch aus der Datenbank bezieht, was es dort beziehen muss, und ins ERP reinschreibt, was dort unbedingt auch reingeschrieben werden muss."

**Funktionsumfang:**
1. **Reparatur-Lifecycle-Management**
   - Status-Tracking (Anfrage → Erstbesichtigung → Ersatzteil → Folgetermin → Abgeschlossen)
   - Übersicht aller laufenden Reparaturen
   - Automatische Status-Updates

2. **Kunden-Management**
   - Automatisches Laden aus ERP-Datenbank
   - Automatisches Anlegen neuer Kunden
   - Historie pro Kunde

3. **Termin-Management**
   - Kalender-Integration
   - Automatische Terminvorschläge
   - Voice Bot Integration

4. **Dokumenten-Management**
   - Upload unterschriebener Aufträge
   - Foto-Dokumentation
   - Automatische Verlinkung mit ERP

5. **Ersatzteil-Tracking**
   - Bestellung
   - Lieferstatus
   - Kostenverfolgung

6. **Abrechnung & ERP-Integration**
   - Automatische Rechnungserstellung
   - Automatisches Schreiben ins ERP (SQL INSERT)
   - Dokumenten-Upload ins ERP

**Architektur:**
- **Frontend:** Web-Application (React/Vue/Svelte)
- **Backend:** Node.js/Python (REST API)
- **Datenbank:** Eigene DB (PostgreSQL/MySQL) + SQL Server (ERP-Anbindung)
- **Hosting:** Eigener Server oder Cloud
- **Integrationen:**
  - SQL Server (ERP "Work for All")
  - Kalender-API (Google/Outlook)
  - Voice Bot
  - n8n für Automatisierungen

**Vorteile:**
- ✅ Maßgeschneidert für Reparaturprozess
- ✅ Unabhängig vom ERP (keine Abhängigkeit von "Work for All" Einschränkungen)
- ✅ Moderne UI/UX
- ✅ Flexibel erweiterbar
- ✅ Trotzdem integriert mit ERP (Datenaustausch via SQL)

**Aufwand:** Sehr Hoch
**Impact:** SEHR HOCH ⭐⭐⭐
**Datenbankzugriff:** JA (Lesen & Schreiben)

---

## 🏗️ Vorgeschlagene System-Architektur

### Architektur-Philosophie
**Hybrid-Ansatz:** Eigenes Reparatur-System mit ERP-Datenbank-Integration

```
┌─────────────────────────────────────────────────────────┐
│                  Reparatur-Management-System              │
│                     (Eigene Anwendung)                    │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐    │
│  │   Web-UI    │  │   REST API   │  │  Eigene DB  │    │
│  │  (Browser)  │  │  (Node.js/   │  │ (PostgreSQL)│    │
│  │             │  │   Python)    │  │             │    │
│  └─────────────┘  └──────────────┘  └─────────────┘    │
│                                                           │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ SQL Queries (Read/Write)
                        │
        ┌───────────────▼────────────────┐
        │    SQL Server (ERP-Datenbank)  │
        │   192.168.16.202\SQLEXPRESS    │
        │        WorkM001 Datenbank      │
        │                                │
        │  ┌──────────┐  ┌───────────┐  │
        │  │  Kunden  │  │ Aufträge  │  │
        │  │ (Lesen)  │  │(Schreiben)│  │
        │  └──────────┘  └───────────┘  │
        └────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              n8n Automatisierungen                        │
│                                                           │
│  • Ersatzteil-Recherche (Web Scraping)                   │
│  • Voice Bot Trigger (Terminkoordinierung)               │
│  • E-Mail Parsing (Eingangs-Anfragen)                    │
│  • Kalender-Integration (Google/Outlook)                 │
│  • Benachrichtigungen (Team-Alerts)                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Externe Integrationen                        │
│                                                           │
│  • Voice Bot (Bland AI / Vapi.ai)                        │
│  • Kalender API (Google Calendar / Outlook)              │
│  • Dokumenten-Storage (Google Drive / OneDrive)          │
│  • Lieferanten-Webseiten (Web Scraping)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Implementierungs-Roadmap

### Phase 1: Quick Wins & Foundation (Woche 1-4)
**Ziel:** Sofortige Verbesserungen + Basis schaffen

#### 1.1 Digitale Dokumentenerfassung
- [ ] Google Drive / OneDrive Setup für Mitarbeiter-Smartphones
- [ ] Ordnerstruktur definieren
- [ ] Schulung Mitarbeiter
- [ ] Test mit 2-3 Reparaturen

**Aufwand:** 1 Woche
**Technologie:** Google Drive / OneDrive Apps

---

#### 1.2 SQL-Datenbank Exploration & Grundzugriffe
- [ ] Relevante Tabellen identifizieren (Kunden, Aufträge, etc.)
- [ ] Test-Queries schreiben (SELECT)
- [ ] Test-Insert für neue Kunden
- [ ] Dokumentation erweitern

**Aufwand:** 1 Woche
**Technologie:** Python/n8n + SQL Server
**Basis:** SQL_Server_Wissensdatenbank.md (bereits vorhanden!)

---

#### 1.3 Einfacher n8n Workflow: Kundendaten-Recherche
- [ ] n8n installieren/konfigurieren
- [ ] Microsoft SQL Node einrichten
- [ ] Workflow: Kundensuche per Name/Telefon
- [ ] Webhook-Schnittstelle erstellen

**Aufwand:** 1 Woche
**Technologie:** n8n + SQL Server

---

#### 1.4 Einfacher n8n Workflow: Neukunden anlegen
- [ ] Workflow: INSERT neuer Kunde in SQL-Datenbank
- [ ] Validierung der Daten
- [ ] Error Handling
- [ ] Test mit Dummy-Daten

**Aufwand:** 1 Woche
**Technologie:** n8n + SQL Server

---

### Phase 2: Mittelfristige Optimierungen (Woche 5-12)

#### 2.1 Ersatzteil-Recherche-Automatisierung
- [ ] Lieferanten-Webseiten analysieren
- [ ] Web Scraping Skripte entwickeln
- [ ] n8n Workflow für automatische Recherche
- [ ] Ergebnis-Aggregation (Preis, Verfügbarkeit)
- [ ] UI für Ergebnis-Anzeige (einfache Webseite)

**Aufwand:** 3-4 Wochen
**Technologie:** n8n + Python (BeautifulSoup) + einfache Web-UI

---

#### 2.2 Kalender-Integration
- [ ] Kalender-API evaluieren (Google Calendar vs. Outlook)
- [ ] n8n Integration aufsetzen
- [ ] Workflow: Freie Termine abfragen
- [ ] Workflow: Termin eintragen
- [ ] Test mit echtem Kalender

**Aufwand:** 2-3 Wochen
**Technologie:** n8n + Kalender API

---

#### 2.3 Voice Bot Proof of Concept
- [ ] Voice Bot Services evaluieren (Bland AI, Vapi.ai, ElevenLabs)
- [ ] Test-Account einrichten
- [ ] Einfaches Skript: Bot ruft Testnummer an
- [ ] Terminvereinbarungs-Dialog entwickeln
- [ ] Integration mit n8n (Trigger)
- [ ] Test mit internem Team

**Aufwand:** 3-4 Wochen
**Technologie:** Voice Bot Service + n8n

---

### Phase 3: Reparatur-Management-System (Woche 13-24)
**Ziel:** Dediziertes System als Herz der Reparaturprozesse

#### 3.1 Anforderungs-Detaillierung & Design
- [ ] User Stories ausarbeiten
- [ ] UI/UX Design (Mockups)
- [ ] Datenbank-Schema (eigene DB + ERP-Mapping)
- [ ] API-Spezifikation
- [ ] Technologie-Stack festlegen

**Aufwand:** 2-3 Wochen

---

#### 3.2 Backend-Entwicklung
- [ ] REST API aufsetzen (Node.js/Python)
- [ ] Eigene Datenbank (PostgreSQL/MySQL)
- [ ] SQL Server Integration (ERP-Anbindung)
- [ ] Authentication/Authorization
- [ ] Core-Funktionen:
  - [ ] Reparatur CRUD
  - [ ] Kunden-Management
  - [ ] Status-Tracking
  - [ ] Dokumenten-Upload
  - [ ] Termin-Management

**Aufwand:** 6-8 Wochen
**Technologie:** Node.js/Python + PostgreSQL + SQL Server

---

#### 3.3 Frontend-Entwicklung
- [ ] Web-Application (React/Vue/Svelte)
- [ ] Dashboard (Übersicht laufende Reparaturen)
- [ ] Reparatur-Detailansicht
- [ ] Kunden-Verwaltung
- [ ] Kalender-Ansicht
- [ ] Dokumenten-Upload-UI

**Aufwand:** 6-8 Wochen
**Technologie:** React/Vue/Svelte

---

#### 3.4 Integration & Testing
- [ ] Voice Bot Integration
- [ ] n8n Workflows integrieren
- [ ] ERP-Datenbank Schreib-Funktionen
- [ ] End-to-End Tests
- [ ] User Acceptance Testing (UAT)

**Aufwand:** 2-3 Wochen

---

#### 3.5 Deployment & Rollout
- [ ] Server-Setup (On-Premise oder Cloud)
- [ ] Deployment-Pipeline
- [ ] Schulung Mitarbeiter
- [ ] Pilotphase (2-4 Wochen)
- [ ] Feedback-Integration
- [ ] Vollständiger Rollout

**Aufwand:** 2-3 Wochen

---

### Phase 4: Optimierung & Erweiterung (kontinuierlich)
- [ ] Performance-Optimierung
- [ ] Neue Features basierend auf Feedback
- [ ] Mobile App (optional)
- [ ] Reporting & Analytics
- [ ] KI-gestützte Features (z.B. Schadenserkennung aus Fotos)

---

## 🔌 Technische Lösungsansätze im Detail

### 1. SQL-Datenbank Integration

#### Relevante Tabellen (basierend auf Wissensdatenbank)
Aus der SQL_Server_Wissensdatenbank.md sind folgende Tabellen relevant:

**Kundendaten:**
- `dbo.KAnsprechp` - Kundenansprechpartner (vermutlich Kundenstammdaten)
- Spalten: Name, Telefon, Email, Adresse, etc.

**Aufträge:**
- `dbo.Auftrag` - Aufträge/Reparaturaufträge
- `dbo.Auftragshistorie` - Historie
- `dbo.Auftragsstatus` - Status-Definitionen

**Artikel/Ersatzteile:**
- `dbo.Artikel` - Artikelstamm (6.477 Artikel)
- Spalten: Nummer, Name, EuroNettopreis, Bestand, etc.

**Dokumente:**
- `dbo.Dokumente` - Dokumentenverwaltung
- `dbo.ERPAnhänge` - Anhänge

#### Lese-Zugriffe (SELECT)
```sql
-- Kunde suchen
SELECT * FROM dbo.KAnsprechp
WHERE Name LIKE '%Kundenname%'
OR Telefon = '+49...'

-- Auftrag abrufen
SELECT * FROM dbo.Auftrag
WHERE Code = ?

-- Ersatzteil-Verfügbarkeit prüfen
SELECT Nummer, Name, Bestand, EuroNettopreis
FROM dbo.Artikel
WHERE Nummer = 'ARTIKELNR'
```

#### Schreib-Zugriffe (INSERT/UPDATE)
```sql
-- Neuen Kunden anlegen
INSERT INTO dbo.KAnsprechp (Name, Telefon, Email, Angelegt, ...)
VALUES (?, ?, ?, GETDATE(), ...)

-- Auftrag erstellen
INSERT INTO dbo.Auftrag (Datum, KundenCode, Status, Betrag, ...)
VALUES (GETDATE(), ?, 'Offen', 100.00, ...)

-- Auftragsstatus aktualisieren
UPDATE dbo.Auftrag
SET Status = 'Abgeschlossen'
WHERE Code = ?
```

**Wichtig:**
- Tabellen-Schema aus `SQL_Server_Wissensdatenbank.md` verwenden
- Constraints beachten (NOT NULL, Defaults, etc.)
- Transaktionen für atomare Operationen

---

### 2. n8n Workflows

#### Workflow 1: Kundendaten-Recherche
```
[Webhook] → [SQL Query: SELECT] → [Response]
```

#### Workflow 2: Neukunden anlegen
```
[Webhook] → [Validate Data] → [SQL Query: INSERT] → [Response]
```

#### Workflow 3: Ersatzteil-Recherche
```
[Trigger] → [HTTP Requests (Lieferanten)] → [Parse Results] → [Aggregate] → [Notify]
```

#### Workflow 4: Voice Bot Terminkoordinierung
```
[Trigger: Ersatzteil eingetroffen]
→ [SQL: Kundendaten laden]
→ [Kalender API: Freie Termine]
→ [Voice Bot: Anruf]
→ [Kalender API: Termin eintragen]
→ [SQL: Status update]
```

#### Workflow 5: E-Mail-Parsing (Eingangsanfragen)
```
[Email Trigger]
→ [Parse Email]
→ [Extract: Name, Telefon, Anfrage]
→ [SQL: Prüfe Kunde existiert]
→ [If New: Create Kunde]
→ [Create Reparatur-Eintrag]
→ [Notify Team]
```

---

### 3. Voice Bot Integration

#### Empfohlene Services
1. **Bland AI** - Spezialisiert auf automatische Anrufe
2. **Vapi.ai** - Echtzeit-Voice-AI
3. **ElevenLabs (Voice) + OpenAI (Logic)** - Kombination

#### Funktionsweise
1. n8n triggert Voice Bot
2. Bot erhält Kontext (Kundenname, verfügbare Termine)
3. Bot ruft Kunde an
4. Dialog: "Guten Tag [Name], hier ist [Firma]. Wir haben Ihr Ersatzteil erhalten. Wann passt Ihnen ein Termin?"
5. Bot bietet Termine an (z.B. "Dienstag 14 Uhr oder Donnerstag 10 Uhr?")
6. Kunde wählt Termin
7. Bot bestätigt: "Perfekt, ich habe Dienstag 14 Uhr für Sie eingetragen. Vielen Dank!"
8. Callback an n8n mit Termin-Info
9. n8n trägt Termin in Kalender ein

#### Kosten
- Ca. 0,10-0,50 EUR pro Anruf
- Bei 50 Reparaturen/Monat: 5-25 EUR/Monat

**ROI:** Extrem hoch, wenn man Zeitersparnis betrachtet (mehrere Stunden pro Woche)

---

### 4. Reparatur-Management-System - Tech Stack

#### Frontend
**Option A: React (Empfohlen)**
- Mature, große Community
- Viele UI-Libraries (Material-UI, Ant Design)
- Gute Performance

**Option B: Vue.js**
- Einfacher zu lernen
- Gute Dokumentation
- Schlanker

**Option C: Svelte**
- Sehr performant
- Weniger Boilerplate
- Kleinere Community

#### Backend
**Option A: Node.js + Express (Empfohlen)**
- JavaScript Full-Stack (Frontend + Backend)
- Sehr gute async-Performance
- Große Ecosystem (npm)
- Einfache SQL-Integration (mssql-Paket)

**Option B: Python + FastAPI**
- Sehr schnell zu entwickeln
- Gute AI/ML-Integration (falls gewünscht)
- pyodbc für SQL Server
- Typensicher (Pydantic)

#### Datenbank
**Eigene DB (Reparatur-System Daten):**
- PostgreSQL (Empfohlen) - Open Source, robust
- MySQL - Alternative

**ERP-Datenbank (Read/Write):**
- SQL Server (bereits vorhanden)

#### Hosting
**Option A: On-Premise (Empfohlen für Start)**
- Eigener Server (im Firmen-Netzwerk)
- Volle Kontrolle
- Kein Cloud-Vendor-Lock-in
- Niedriger laufender Kosten

**Option B: Cloud (VPS)**
- Hetzner, DigitalOcean, etc.
- Ca. 10-20 EUR/Monat
- Von außen erreichbar (Vorteil für Remote-Work)

---

## ❓ Offene Fragen & Entscheidungen

### Strategische Entscheidungen

#### 1. System-Umfang
- [ ] **Frage:** Soll das Reparatur-System auch andere Bereiche abdecken (z.B. Verkauf, allgemeine Aufträge)?
- [ ] **Oder:** Nur auf Reparaturprozess fokussieren?

**Empfehlung:** Fokus auf Reparatur. Später erweiterbar.

---

#### 2. Voice Bot Umfang
- [ ] **Frage:** Nur Terminvereinbarung oder auch andere Anrufe (z.B. Status-Updates, Ersatzteil-Verzögerung)?
- [ ] **Oder:** Breiter Einsatz?

**Empfehlung:** Start mit Terminvereinbarung. Später erweitern.

---

#### 3. Mobile App
- [ ] **Frage:** Sollen Mitarbeiter eine dedizierte Mobile App haben?
- [ ] **Oder:** Reicht responsive Web-Application?

**Empfehlung:** Start mit responsive Web-App. Mobile App später (Progressive Web App - PWA als Zwischenschritt).

---

#### 4. Kalender-System
- [ ] **Frage:** Weiter Outlook nutzen oder auf Google Calendar wechseln?
- [ ] **Hintergrund:** Google Calendar hat bessere API

**Empfehlung:** Evaluation beider APIs. Vermutlich flexibler mit Google Calendar.

---

#### 5. ERP-Abhängigkeit
- [ ] **Frage:** Wie tief soll ERP-Integration sein?
- [ ] **Minimal:** Nur Kunden lesen, Aufträge schreiben
- [ ] **Umfassend:** Auch Artikel-Verfügbarkeit, Rechnungserstellung, etc.

**Empfehlung:** Start mit minimal. Schrittweise erweitern basierend auf Bedarf.

---

### Technische Fragen

#### 6. Authentifizierung
- [ ] **Frage:** Wie sollen sich Mitarbeiter einloggen?
- [ ] **Option A:** Eigenes Login-System
- [ ] **Option B:** Active Directory Integration (Windows-Login)

**Empfehlung:** Start mit eigenem Login. AD-Integration später.

---

#### 7. Dokumenten-Storage
- [ ] **Frage:** Wo sollen Dokumente (Fotos, PDFs) gespeichert werden?
- [ ] **Option A:** Eigener Server (Filesystem)
- [ ] **Option B:** Cloud-Storage (Google Drive / OneDrive)
- [ ] **Option C:** Objekt-Storage (S3-kompatibel)

**Empfehlung:** Start mit Filesystem (einfach). Cloud-Storage als Backup.

---

#### 8. Benachrichtigungen
- [ ] **Frage:** Wie sollen Mitarbeiter über neue Reparaturen/Ereignisse benachrichtigt werden?
- [ ] **Option A:** E-Mail
- [ ] **Option B:** Push-Notifications (Web)
- [ ] **Option C:** Slack/Teams Integration

**Empfehlung:** Start mit E-Mail. Push-Notifications später.

---

#### 9. Reporting & Analytics
- [ ] **Frage:** Welche Reports/Statistiken sind wichtig?
- [ ] **Beispiele:**
  - Anzahl Reparaturen pro Monat
  - Durchschnittliche Durchlaufzeit
  - Ersatzteil-Kosten
  - Mitarbeiter-Auslastung

**Empfehlung:** Definieren nach Pilotphase. Daten sammeln von Anfang an.

---

#### 10. Backup & Disaster Recovery
- [ ] **Frage:** Backup-Strategie für eigene Datenbank?
- [ ] **Täglich? Wöchentlich?**
- [ ] **Wo gespeichert?**

**Empfehlung:** Tägliches Backup auf separatem Storage (NAS oder Cloud).

---

## 🎯 Zusammenfassung & Empfehlung

### Kernprobleme
1. ⚠️ **Folgetermin-Koordination ist größter Schmerzpunkt** (Zeitfresser)
2. ⚠️ **Status-Management über Outlook-Kalender ist ungeeignet**
3. ⚠️ **Manuelle Prozesse verursachen Zeitverlust an vielen Stellen**

### Strategische Empfehlung
**Eigenes Reparatur-Management-System bauen + n8n Automatisierungen**

**Begründung:**
- ✅ Maßgeschneidert für Reparaturprozess
- ✅ Unabhängig von ERP-Limitierungen
- ✅ Moderne Technologie
- ✅ Flexibel erweiterbar
- ✅ Trotzdem integriert mit ERP (SQL-Datenbank)

### Quick Wins für sofortige Verbesserung
1. Digitale Dokumentenerfassung (Google Drive App)
2. n8n Workflow: Kundendaten-Recherche
3. n8n Workflow: Neukunden automatisch anlegen

### Game Changer
1. **Voice Bot für Terminkoordinierung** (höchste Priorität)
2. **Dediziertes Reparatur-Management-System**

### Phasenplan
- **Phase 1 (1-3 Monate):** Quick Wins + Voice Bot PoC
- **Phase 2 (3-6 Monate):** Reparatur-Management-System MVP
- **Phase 3 (6-12 Monate):** Vollausbau + Optimierung

### Nächste Schritte
1. **Diese Analyse reviewen und bestätigen**
2. **Offene Fragen klären**
3. **Priorisierung festlegen**
4. **Phase 1 starten**

---

## 📝 Change Log

| Datum | Änderung | Autor |
|-------|----------|-------|
| 2025-12-10 | Team-Info, Volumen (~31/Monat), Preisstruktur, Zahlungsausfall-Lösung | Claude |
| 2025-12-05 | Initiale Erstellung | Claude |

---

**Ende der Analyse**

*Diese Datei ist ein lebendes Dokument und sollte kontinuierlich aktualisiert werden.*
