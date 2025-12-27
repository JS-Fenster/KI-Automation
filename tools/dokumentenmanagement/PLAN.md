# Dokumentenmanagement - Implementierungsplan

> **Status:** Geplant
> **Erstellt:** 2025-12-27
> **Ziel:** n8n-Workflow durch eigenen Code ersetzen

---

## Uebersicht

Automatische Verarbeitung von gescannten Dokumenten:
1. Scanner-Ordner wird ueberwacht
2. Neue PDFs werden via Webhook gesendet
3. OCR-Extraktion (Mistral)
4. KI-Kategorisierung (OpenAI GPT-5.2)
5. Strukturierte Datenextraktion je Kategorie
6. Speicherung in Supabase (Storage + Database)

---

## Architektur

```
┌──────────────────┐     ┌─────────────────────────────────────────────────┐
│  Windows Server  │     │                   Supabase                      │
│  (Buero)         │     │                                                 │
│                  │     │  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  Scanner-Ordner  │────▶│  │ Edge Func.  │─▶│ Storage  │  │ PostgreSQL │ │
│  + Watcher.ps1   │ HTTP│  │ (Webhook)   │  │ (PDFs)   │  │ (Daten)    │ │
│                  │     │  └──────┬──────┘  └──────────┘  └────────────┘ │
└──────────────────┘     │         │                              ▲       │
                         │         ▼                              │       │
                         │  ┌─────────────┐  ┌──────────────┐     │       │
                         │  │ Mistral API │  │ OpenAI API   │─────┘       │
                         │  │ (OCR)       │  │ (Kategoris.) │             │
                         │  └─────────────┘  └──────────────┘             │
                         └─────────────────────────────────────────────────┘
```

---

## Komponenten

### 1. Scanner-Watcher (bereits vorhanden)
- **Ort:** Windows Server im Buero
- **Datei:** `tools/Scanner_Webhook/watcher.ps1` (existiert bereits)
- **Funktion:** Ueberwacht Scanner-Ordner, sendet PDF via HTTP POST

### 2. Supabase Edge Function (neu)
- **Name:** `process-document`
- **Trigger:** HTTP POST mit PDF-Datei
- **Ablauf:**
  1. PDF empfangen
  2. Mistral OCR aufrufen → Text extrahieren
  3. OpenAI aufrufen → Kategorie bestimmen
  4. PDF in Storage speichern (mit Kategorie-Prefix)
  5. OpenAI aufrufen → Strukturierte Daten extrahieren
  6. Daten in PostgreSQL speichern

### 3. Supabase Storage Bucket
- **Name:** `documents`
- **Struktur:** `{kategorie}_{timestamp}.pdf`

### 4. Supabase Datenbank-Tabellen
- **Haupttabelle:** `dokumente`
- **Optionale Untertabellen:** Pro Kategorie (fuer normalisierte Daten)

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

### Tabelle: `dokumente`

```sql
CREATE TABLE dokumente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dokument-Metadaten
  kategorie TEXT NOT NULL,
  dokument_url TEXT NOT NULL,
  ocr_text TEXT,

  -- Extraktionsqualitaet
  extraktions_qualitaet TEXT, -- hoch/mittel/niedrig
  extraktions_hinweise JSONB,

  -- Extrahierte Daten (JSONB fuer Flexibilitaet)
  daten JSONB NOT NULL,

  -- Referenzen (fuer schnelle Suche)
  dokument_datum DATE,
  dokument_nummer TEXT,
  firma_name TEXT,
  betrag_brutto NUMERIC(12,2),

  -- Verarbeitung
  verarbeitet_am TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'neu' -- neu/geprueft/archiviert
);

-- Indizes fuer haeufige Abfragen
CREATE INDEX idx_dokumente_kategorie ON dokumente(kategorie);
CREATE INDEX idx_dokumente_datum ON dokumente(dokument_datum);
CREATE INDEX idx_dokumente_firma ON dokumente(firma_name);
CREATE INDEX idx_dokumente_status ON dokumente(status);
```

---

## API Keys

Gespeichert in: `lib/config/credentials.yaml`

| Service | Key-Name | Status |
|---------|----------|--------|
| Mistral | `mistral.api_key` | Eingetragen |
| OpenAI | `openai.api_key` | Eingetragen |
| Supabase | Via MCP | Verbunden |

---

## Implementierungsschritte

### Phase 1: Grundstruktur
- [ ] Supabase Storage Bucket `documents` erstellen
- [ ] Datenbank-Tabelle `dokumente` erstellen
- [ ] Edge Function Grundgeruest erstellen

### Phase 2: OCR-Integration
- [ ] Mistral API-Aufruf implementieren
- [ ] PDF zu Text Konvertierung testen

### Phase 3: Kategorisierung
- [ ] OpenAI-Aufruf fuer Kategorisierung
- [ ] System-Prompt aus n8n uebernehmen
- [ ] Kategorisierung testen

### Phase 4: Datenextraktion
- [ ] OpenAI-Aufruf fuer strukturierte Extraktion
- [ ] Alle 18 Kategorie-Prompts uebernehmen
- [ ] JSON-Validierung implementieren

### Phase 5: Speicherung
- [ ] PDF in Storage speichern
- [ ] Extrahierte Daten in DB speichern
- [ ] Error-Handling implementieren

### Phase 6: Integration
- [ ] Scanner-Watcher auf neue Edge Function umstellen
- [ ] End-to-End Test
- [ ] n8n-Workflow deaktivieren

---

## Prompts (aus n8n-Workflow)

### Kategorisierungs-Prompt

```
Du bist ein Extrahierungs- und Benennungsassistent fuer eingehende
Dokumente der Firma J.S. Fenster Tueren.

Du vergibst fuer jedes Dokument eine Kategorie:
- Preisanfrage
- Angebot
- Auftragsbestaetigung
- Bestellung
- Eingangslieferschein
- Eingangsrechnung
- Kundenlieferschein
- Montageauftrag
- Ausgangsrechnung
- Zahlungserinnerung
- Mahnung
- Notiz
- Skizze
- Brief_an_Kunde
- Brief_von_Kunde
- Brief_von_Finanzamt
- Brief_von_Amt
- Sonstiges_Dokument

Du antwortest NUR mit der Kategorie und gibst nichts anderes zurueck.
```

### Extraktions-Prompt

Der vollstaendige Extraktions-Prompt mit allen 18 Kategorie-Regeln
befindet sich in: `dokumentenmanagement/n8n_workflow.txt`

Zeilen 130-133 enthalten den User-Prompt.
Zeilen 74+ (systemMessage) enthalten alle Extraktionsregeln.

---

## Offene Fragen

1. **Supabase-Projekt:** Welches Projekt verwenden? (erp-system-vite?)
2. **Fehlerbehandlung:** Was passiert bei OCR-Fehlern?
3. **Benachrichtigung:** Soll bei bestimmten Kategorien (Mahnung, Finanzamt) alarmiert werden?
4. **Duplikat-Erkennung:** Sollen bereits verarbeitete Dokumente erkannt werden?

---

## Naechste Schritte

1. Storage Bucket in Supabase erstellen
2. Datenbank-Tabelle anlegen
3. Edge Function `process-document` implementieren
4. Testen mit einem Beispiel-PDF

---

*Zuletzt aktualisiert: 2025-12-27*
