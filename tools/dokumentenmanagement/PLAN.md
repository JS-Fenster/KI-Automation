# Dokumentenmanagement - Implementierungsplan

> **Status:** Input-Kanal abgeschlossen (2026-01-12)
> **Erstellt:** 2025-12-27
> **Ziel:** Automatische Dokumentenverarbeitung via Scanner → Supabase

---

## Status-Uebersicht

| Phase | Status | Datum |
|-------|--------|-------|
| Input-Kanal (Scanner → Edge Function) | **Abgeschlossen** | 2026-01-12 |
| Hintergrund-Tests | Laufend | - |
| Output-Integration (ERP-Anbindung) | Offen | - |

---

## Uebersicht

Automatische Verarbeitung von gescannten Dokumenten:
1. Scanner-Ordner wird ueberwacht (FileSystemWatcher)
2. Neue PDFs werden via HTTP POST an Edge Function gesendet
3. OCR-Extraktion (Mistral `mistral-ocr-latest`)
4. KI-Kategorisierung + Strukturierte Extraktion (OpenAI GPT-5.2)
5. Speicherung in Supabase (Storage Bucket `documents` + Tabelle `documents`)

---

## Architektur

```
┌──────────────────┐     ┌─────────────────────────────────────────────────┐
│  Windows Server  │     │                   Supabase                      │
│  (Buero / DC)    │     │           Projekt: js-fenster-erp               │
│                  │     │           ID: rsmjgdujlpnydbsfuiek              │
│  Scanner-Ordner  │     │  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  D:\Daten\       │────▶│  │ Edge Func.  │─▶│ Storage  │  │ PostgreSQL │ │
│  Dokumente\      │ HTTP│  │ process-    │  │ documents│  │ documents  │ │
│  Scanner\        │ POST│  │ document    │  │ (Bucket) │  │ (Tabelle)  │ │
│                  │     │  └──────┬──────┘  └──────────┘  └────────────┘ │
│  Watcher.ps1     │     │         │                              ▲       │
└──────────────────┘     │         ▼                              │       │
                         │  ┌─────────────┐  ┌──────────────┐     │       │
                         │  │ Mistral API │  │ OpenAI API   │─────┘       │
                         │  │ (OCR)       │  │ GPT-5.2      │             │
                         │  └─────────────┘  └──────────────┘             │
                         └─────────────────────────────────────────────────┘
```

---

## Technische Details

### Supabase-Projekt

| Aspekt | Wert |
|--------|------|
| **Projekt-Name** | js-fenster-erp |
| **Projekt-ID** | `rsmjgdujlpnydbsfuiek` |
| **Region** | eu-central-1 |
| **Edge Function** | `process-document` |
| **Storage Bucket** | `documents` |
| **Datenbank-Tabelle** | `documents` |

### Edge Function: process-document

| Aspekt | Details |
|--------|---------|
| **URL** | `https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-document` |
| **Methode** | POST (multipart/form-data) |
| **Input** | `file` (PDF, Bilder) |
| **Output** | JSON mit `id`, `kategorie`, `dokument_url`, `extraktions_qualitaet` |

### API-Konfiguration

| Service | Model/Endpoint | Env-Variable |
|---------|----------------|--------------|
| Mistral | `mistral-ocr-latest` | `MISTRAL_API_KEY` |
| OpenAI | `gpt-5.2` | `OPENAI_API_KEY` |
| Supabase | Service Role | `SUPABASE_SERVICE_ROLE_KEY` |

### Verarbeitungsablauf

1. **PDF empfangen** → multipart/form-data parsen
2. **Mistral OCR** → PDF zu Text (Markdown-Format)
3. **GPT-5.2** → Kategorisierung + strukturierte Extraktion (JSON Schema)
4. **Storage Upload** → `{kategorie}/{timestamp}_{filename}.pdf`
5. **DB Insert** → 50+ Felder in `documents` Tabelle

---

## Komponenten

### 1. Scanner-Watcher (Windows Server)

- **Ort:** `D:\Daten\Dokumente\Scanner`
- **Script:** `tools/Scanner_Webhook/ScannerWatcher.ps1`
- **Scheduled Task:** `ScannerWebhookWatcher`
- **Features:**
  - FileSystemWatcher mit Event-Handler
  - Datei-Lock Pruefung (max. 10 Retries)
  - Logging in `scanner_webhook.log`
  - Ignoriert: `.msg`, `.tmp`, kleine PNGs

### 2. Edge Function (Supabase)

- **Name:** `process-document`
- **Dateien:**
  - `edge-function/index.ts` - Hauptlogik
  - `edge-function/prompts.ts` - System-Prompt fuer GPT-5.2
- **Ablauf:**
  1. PDF empfangen + validieren
  2. Mistral OCR aufrufen → Text extrahieren
  3. GPT-5.2 aufrufen → Kategorie + strukturierte Daten
  4. PDF in Storage speichern
  5. Daten in PostgreSQL speichern

### 3. Supabase Storage

- **Bucket:** `documents`
- **Struktur:** `{kategorie}/{timestamp}_{original_filename}.pdf`
- **Beispiel:** `Eingangsrechnung/2026-01-12T10-30-45-123Z_scan001.pdf`

### 4. Supabase Datenbank

- **Tabelle:** `documents`
- **Felder:** 50+ Spalten (siehe Schema unten)
- **Indizes:** kategorie, dokument_datum, aussteller_firma, status

---

## Die 18 Dokumentenkategorien

| Nr | Kategorie | Beschreibung |
|----|-----------|--------------|
| 1 | Preisanfrage | Kundenanfrage fuer Preise |
| 2 | Angebot | Ausgehendes Angebot |
| 3 | Auftragsbestaetigung | AB von Lieferant oder an Kunde |
| 4 | Bestellung | Bestellung an Lieferant |
| 5 | Eingangslieferschein | Lieferschein vom Lieferanten |
| 6 | Eingangsrechnung | Rechnung vom Lieferanten |
| 7 | Kundenlieferschein | Lieferschein an Kunden |
| 8 | Montageauftrag | Interner Montageauftrag |
| 9 | Ausgangsrechnung | Rechnung an Kunden |
| 10 | Zahlungserinnerung | Freundliche Erinnerung |
| 11 | Mahnung | Mahnstufen 1-3 |
| 12 | Notiz | Interne Notizen |
| 13 | Skizze | Technische Zeichnungen |
| 14 | Brief_an_Kunde | Ausgehende Korrespondenz |
| 15 | Brief_von_Kunde | Eingehende Korrespondenz |
| 16 | Brief_von_Finanzamt | Steuerbescheide etc. |
| 17 | Brief_von_Amt | Behoerdenpost (nicht Finanzamt) |
| 18 | Sonstiges_Dokument | Nicht kategorisierbar |

---

## Datenbank-Schema

### Tabelle: `documents`

```sql
-- Haupt-Metadaten
id UUID PRIMARY KEY
created_at TIMESTAMPTZ
kategorie TEXT NOT NULL
dokument_url TEXT NOT NULL
ocr_text TEXT
extraktions_zeitstempel TIMESTAMPTZ
extraktions_qualitaet TEXT  -- hoch/mittel/niedrig
extraktions_hinweise JSONB

-- Dokument-Basis
dokument_datum DATE
dokument_nummer TEXT
dokument_richtung TEXT  -- eingehend/ausgehend

-- Aussteller (wer hat erstellt)
aussteller_firma TEXT
aussteller_name TEXT
aussteller_strasse TEXT
aussteller_plz TEXT
aussteller_ort TEXT
aussteller_telefon TEXT
aussteller_email TEXT
aussteller_ust_id TEXT

-- Empfaenger
empfaenger_firma TEXT
empfaenger_vorname TEXT
empfaenger_nachname TEXT
empfaenger_strasse TEXT
empfaenger_plz TEXT
empfaenger_ort TEXT
empfaenger_telefon TEXT
empfaenger_email TEXT
empfaenger_kundennummer TEXT

-- Betraege
summe_netto NUMERIC
mwst_betrag NUMERIC
summe_brutto NUMERIC
offener_betrag NUMERIC

-- Positionen (als JSONB Array)
positionen JSONB

-- Zahlungsbedingungen
zahlungsziel_tage INTEGER
faellig_am DATE
skonto_prozent NUMERIC
skonto_tage INTEGER

-- Bankverbindung
bank_name TEXT
bank_iban TEXT
bank_bic TEXT

-- Lieferung
liefertermin_datum DATE
lieferzeit_wochen INTEGER

-- Bezuege zu anderen Dokumenten
bezug_angebot_nr TEXT
bezug_bestellung_nr TEXT
bezug_lieferschein_nr TEXT
bezug_rechnung_nr TEXT
bezug_auftrag_nr TEXT
bezug_projekt TEXT

-- Mahnung-spezifisch
mahnung_stufe INTEGER
mahngebuehren NUMERIC
verzugszinsen_betrag NUMERIC
gesamtforderung NUMERIC

-- Korrespondenz
betreff TEXT
inhalt_zusammenfassung TEXT
bemerkungen TEXT
dringlichkeit TEXT  -- hoch/mittel/niedrig
```

---

## Implementierungsschritte

### Phase 1: Grundstruktur ✅
- [x] Supabase Storage Bucket `documents` erstellen
- [x] Datenbank-Tabelle `documents` erstellen
- [x] Edge Function Grundgeruest erstellen

### Phase 2: OCR-Integration ✅
- [x] Mistral API-Aufruf implementieren
- [x] PDF zu Text Konvertierung (Base64 → OCR)

### Phase 3: Kategorisierung ✅
- [x] OpenAI-Aufruf fuer Kategorisierung + Extraktion
- [x] System-Prompt mit allen 18 Kategorien
- [x] JSON Schema fuer strukturierten Output

### Phase 4: Datenextraktion ✅
- [x] GPT-5.2 Structured Output (strict mode)
- [x] Alle Felder im Schema definiert
- [x] Qualitaetsbewertung implementiert

### Phase 5: Speicherung ✅
- [x] PDF in Storage speichern (mit Kategorie-Prefix)
- [x] Extrahierte Daten in DB speichern
- [x] Error-Handling implementiert

### Phase 6: Integration ✅
- [x] Scanner-Watcher auf Edge Function umgestellt
- [x] Webhook-URL in ScannerWatcher.ps1 konfiguriert
- [x] n8n-Workflow deaktiviert/ersetzt

### Phase 7: Testing (Laufend)
- [ ] End-to-End Tests mit verschiedenen Dokumenttypen
- [ ] Fehlerszenarien pruefen (OCR-Fehler, API-Limits)
- [ ] Performance-Monitoring

### Phase 8: Output-Integration (Offen)
- [ ] ERP-System Anbindung (Dokumente anzeigen)
- [ ] Such- und Filterfunktionen
- [ ] Benachrichtigungen bei kritischen Dokumenten (Mahnung, Finanzamt)

---

## Dateien in diesem Ordner

| Datei | Beschreibung |
|-------|--------------|
| `PLAN.md` | Diese Datei - Uebersicht und Status |
| `edge-function/index.ts` | Edge Function Hauptlogik |
| `edge-function/prompts.ts` | System-Prompt fuer GPT-5.2 |
| `n8n_workflow.txt` | Alter n8n Workflow (Referenz, deaktiviert) |
| `test-upload.ps1` | Test-Script fuer manuellen Upload |

---

## Offene Punkte / Bekannte Einschraenkungen

1. **Keine JWT-Validierung:** Edge Function ist oeffentlich erreichbar (verify_jwt: false)
   - Akzeptabel da nur interner Server zugreift
   - Bei Bedarf: API-Key Header hinzufuegen

2. **Fehlerbehandlung:** Bei OCR/API-Fehlern wird HTTP 500 zurueckgegeben
   - Watcher loggt Fehler, aber keine Retry-Logik

3. **Duplikat-Erkennung:** Nicht implementiert
   - Gleiche Datei kann mehrfach verarbeitet werden
   - Watcher hat `processed_files.txt` als einfache Pruefung

4. **Benachrichtigungen:** Noch nicht implementiert
   - Geplant: Alert bei Mahnung, Finanzamt-Post

---

## Schnellreferenz: Wichtige URLs/Pfade

```
# Edge Function URL
https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-document

# Scanner-Ordner (Server)
D:\Daten\Dokumente\Scanner

# Supabase Dashboard
https://supabase.com/dashboard/project/rsmjgdujlpnydbsfuiek

# Edge Function Logs
Supabase Dashboard → Edge Functions → process-document → Logs

# Watcher Logs (auf Server)
C:\Scripts\Scanner_Webhook\scanner_webhook.log
```

---

## Historie

| Datum | Aenderung |
|-------|-----------|
| 2025-12-27 | Plan erstellt, n8n-Workflow analysiert |
| 2025-12-27 | Edge Function Grundstruktur implementiert |
| 2026-01-12 | **Input-Kanal abgeschlossen:** Scanner → Edge Function Pipeline produktiv |

---

*Zuletzt aktualisiert: 2026-01-12*
