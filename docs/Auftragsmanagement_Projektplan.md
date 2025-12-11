# Auftragsmanagement-System - Projektplan

**Erstellt:** 2025-12-11
**Status:** Planung
**Beteiligte:** Andreas (GF), Marco (KI-Coach)

---

## Projektziel

Ein **paralleles Auftragsmanagement-System** neben dem bestehenden ERP (Work4all), das:

1. **Lesenden Zugriff** auf alle Auftragsdetails bietet (Projekte, Angebote, Rechnungen, Kunden)
2. **Eigene Status-Verwaltung** ermoeglicht (Workflow-Stati, die im ERP nicht existieren)
3. **Unabhaengig** vom ERP funktioniert (eigene Datenbank, eigenes Frontend)

---

## Wichtige Erkenntnis: ERP hat keinen Workflow-Status!

| ERP-Feld | Was es ist | Was es NICHT ist |
|----------|------------|------------------|
| `ProjektStatus` | Projekt-GRUPPE (Gross/Klein/Intern) | Kein Workflow-Status |
| `Angebot.Status1-5` | Existiert, aber **alle leer** | Nicht genutzt |
| `Auftragsstatus` | Tabelle existiert, **alle NULL** | Nicht genutzt |

**Fazit:** Das ERP trackt nicht "In Montage", "Abnahme ausstehend", etc.
Wir brauchen **eigene Status-Daten** in einer separaten Datenbank.

---

## Architektur-Entscheidung: Hybrid (Option C)

### Warum Hybrid?

| Option | Bewertung |
|--------|-----------|
| A: Live-Queries auf ERP | Tunnel 24/7, Last auf ERP, Single Point of Failure |
| B: Airbyte/CDC Replikation | Overkill fuer ~10 MB Daten, Extra-Kosten |
| **C: Hybrid (Cache + Eigene Daten)** | **Empfohlen** - Flexibel, kosteneffizient, unabhaengig |

### Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────┐
│                      WEB-APP (Frontend)                     │
│                   React/Next.js auf Vercel                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                             │
│                                                             │
│  ┌──────────────────────┐    ┌────────────────────────────┐ │
│  │ ERP-Cache (readonly) │    │ Eigene Daten (read/write)  │ │
│  │                      │    │                            │ │
│  │ • erp_projekte       │    │ • auftrag_status           │ │
│  │ • erp_angebote       │    │ • auftrag_checkliste       │ │
│  │ • erp_rechnungen     │    │ • auftrag_fotos            │ │
│  │ • erp_kunden         │    │ • auftrag_historie         │ │
│  │ • erp_ra             │    │                            │ │
│  └──────────┬───────────┘    └────────────────────────────┘ │
│             │                                               │
└─────────────┼───────────────────────────────────────────────┘
              │
              │ Sync (alle 5 Min)
              │ Python-Script auf ERP-Server
              │
┌─────────────┼───────────────────────────────────────────────┐
│             ▼                                               │
│  ┌──────────────────────┐                                   │
│  │ sync_to_supabase.py  │◄──── Windows Task Scheduler       │
│  │ (laeuft lokal)       │      (alle 5 Minuten)             │
│  └──────────┬───────────┘                                   │
│             │                                               │
│             ▼                                               │
│  ┌──────────────────────┐                                   │
│  │ SQL Server Express   │                                   │
│  │ WorkM001 (ERP)       │                                   │
│  └──────────────────────┘                                   │
│                                                             │
│                    ERP-SERVER (192.168.16.202)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Datenvolumen-Analyse

| Tabelle | Anzahl | Groesse | Sync-Strategie |
|---------|--------|---------|----------------|
| Projekte | ~2.500 | ~1.2 MB | Alle |
| Angebote | ~4.700 | ~2.3 MB | Letzte 2 Jahre (~1.650) |
| Rechnungen | ~3.000 | ~1.5 MB | Letzte 2 Jahre (~1.650) |
| Kunden | ~8.700 | ~4.2 MB | Alle (Stammdaten) |
| Lieferanten | ~660 | ~330 KB | Alle (Stammdaten) |
| RA (Zahlungen) | ~3.000 | ~1.5 MB | Alle |
| **Positionen** | **~120.000** | **~60 MB** | **NICHT syncen!** |

**Gesamt (ohne Positionen):** ~10-15 MB

**Positionen-Strategie:** Nicht syncen, bei Bedarf live ueber API nachladen.

---

## Sync-Strategie

### Warum Python-Script auf ERP-Server?

| Alternative | Bewertung |
|-------------|-----------|
| Airbyte | Overkill, kostet $50+/Monat |
| Supabase Edge Functions | Kann kein SQL Server (kein TDS in Deno) |
| n8n | Moeglich, aber Extra-Tool |
| **Python + Task Scheduler** | **Kostenlos, einfach, laeuft lokal** |

### Sync-Intervalle

| Daten | Intervall | Begruendung |
|-------|-----------|-------------|
| Projekte | 15 Min | Aendern sich selten |
| Angebote/Auftraege | 5 Min | Wichtig fuer Aktualitaet |
| Rechnungen | 15 Min | Fuer Uebersicht |
| Kunden/Lieferanten | Taeglich | Stammdaten, aendern kaum |
| RA (Zahlungen) | 15 Min | Fuer Zahlungsstatus |

### Script-Ablauf

```python
# sync_to_supabase.py (Pseudocode)

1. Verbinde mit lokalem SQL Server (localhost\SQLEXPRESS)
2. Verbinde mit Supabase (HTTPS, ausgehend)

3. Fuer jede Tabelle:
   a. Hole Daten aus ERP (mit Filter: letzte 2 Jahre)
   b. Transformiere zu Dict
   c. Upsert in Supabase (ON CONFLICT UPDATE)

4. Logge Sync-Zeit und Anzahl Datensaetze
5. Bei Fehler: Sende Alert (optional)
```

---

## Datenmodell: Supabase-Tabellen

### ERP-Cache Tabellen (readonly, wird gesynct)

```sql
-- Projekte aus ERP
CREATE TABLE erp_projekte (
    code INT PRIMARY KEY,           -- ERP Projekte.Code
    nummer VARCHAR(20),             -- P250593
    name TEXT,
    kunden_code INT,
    datum DATE,
    notiz VARCHAR(50),              -- DKF, REP, EA, etc.
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Angebote/Auftraege aus ERP
CREATE TABLE erp_angebote (
    code INT PRIMARY KEY,           -- ERP Angebot.Code
    nummer INT,
    datum DATE,
    auftrags_datum DATE,            -- NULL = nur Angebot, gesetzt = Auftrag!
    auftrags_nummer INT,
    projekt_code INT REFERENCES erp_projekte(code),
    wert DECIMAL(12,2),
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Rechnungen aus ERP
CREATE TABLE erp_rechnungen (
    code INT PRIMARY KEY,
    nummer INT,
    datum DATE,
    projekt_code INT REFERENCES erp_projekte(code),
    wert DECIMAL(12,2),
    bruttowert DECIMAL(12,2),
    zahlbar_bis DATE,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Kunden aus ERP
CREATE TABLE erp_kunden (
    code INT PRIMARY KEY,
    firma1 VARCHAR(100),
    firma2 VARCHAR(100),
    name VARCHAR(100),
    strasse VARCHAR(100),
    plz VARCHAR(10),
    ort VARCHAR(100),
    telefon VARCHAR(50),
    email VARCHAR(100),
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Zahlungsstatus aus ERP
CREATE TABLE erp_ra (
    code INT PRIMARY KEY,
    r_code INT,                     -- FK zu erp_rechnungen.code
    r_nummer INT,
    r_betrag DECIMAL(12,2),
    bez_summe DECIMAL(12,2),        -- Bezahlte Summe
    mahnstufe INT,
    faellig_datum DATE,
    synced_at TIMESTAMP DEFAULT NOW()
);
```

### Eigene Tabellen (read/write, unsere Daten)

```sql
-- Auftrags-Workflow-Status (KERN des Systems!)
CREATE TABLE auftrag_status (
    id SERIAL PRIMARY KEY,
    projekt_code INT NOT NULL,              -- FK zu erp_projekte.code
    angebot_code INT,                       -- FK zu erp_angebote.code

    -- Workflow-Status
    status VARCHAR(50) NOT NULL DEFAULT 'angebot',
    -- Moegliche Werte:
    -- 'angebot'          - Angebot erstellt, noch kein Auftrag
    -- 'auftrag'          - Kunde hat beauftragt
    -- 'material_bestellt'- Material bei Lieferanten bestellt
    -- 'material_da'      - Material eingetroffen
    -- 'montage_geplant'  - Montagetermin steht
    -- 'in_montage'       - Montage laeuft
    -- 'montage_fertig'   - Montage abgeschlossen
    -- 'abnahme_ausstehend'- Warte auf Kundenabnahme
    -- 'abnahme_erfolgt'  - Kunde hat abgenommen
    -- 'rechnung_gestellt'- Rechnung raus
    -- 'bezahlt'          - Rechnung bezahlt
    -- 'abgeschlossen'    - Projekt komplett fertig

    -- Termine
    montage_geplant DATE,
    montage_start TIMESTAMP,
    montage_ende TIMESTAMP,
    abnahme_datum TIMESTAMP,

    -- Metadaten
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Checklisten pro Auftrag
CREATE TABLE auftrag_checkliste (
    id SERIAL PRIMARY KEY,
    auftrag_status_id INT REFERENCES auftrag_status(id),
    titel VARCHAR(200),
    erledigt BOOLEAN DEFAULT FALSE,
    erledigt_am TIMESTAMP,
    erledigt_von UUID REFERENCES auth.users(id),
    reihenfolge INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fotos/Dokumente pro Auftrag
CREATE TABLE auftrag_fotos (
    id SERIAL PRIMARY KEY,
    auftrag_status_id INT REFERENCES auftrag_status(id),
    datei_pfad TEXT NOT NULL,           -- Supabase Storage Pfad
    beschreibung TEXT,
    typ VARCHAR(50),                    -- 'vorher', 'nachher', 'mangel', 'abnahme'
    aufgenommen_am TIMESTAMP,
    hochgeladen_von UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Aenderungs-Historie (Audit-Log)
CREATE TABLE auftrag_historie (
    id SERIAL PRIMARY KEY,
    auftrag_status_id INT REFERENCES auftrag_status(id),
    aktion VARCHAR(100),                -- 'status_geaendert', 'termin_gesetzt', etc.
    alter_wert TEXT,
    neuer_wert TEXT,
    geaendert_von UUID REFERENCES auth.users(id),
    geaendert_am TIMESTAMP DEFAULT NOW()
);
```

---

## Phasenplan

### Phase 1: Grundlagen (Tag 1-2)

| Aufgabe | Dauer | Status |
|---------|-------|--------|
| Supabase-Projekt einrichten | 30 Min | Ausstehend |
| ERP-Cache Tabellen anlegen | 1 Std | Ausstehend |
| Eigene Tabellen anlegen | 1 Std | Ausstehend |
| Sync-Script schreiben | 2-3 Std | Ausstehend |
| Script auf ERP-Server deployen | 1 Std | Ausstehend |
| Windows Task einrichten | 30 Min | Ausstehend |
| Erster Sync testen | 30 Min | Ausstehend |

### Phase 2: Frontend MVP (Tag 3-5)

| Aufgabe | Dauer | Status |
|---------|-------|--------|
| Next.js Projekt aufsetzen | 1 Std | Ausstehend |
| Supabase Auth einrichten | 1 Std | Ausstehend |
| Auftrags-Liste (Tabelle) | 2-3 Std | Ausstehend |
| Auftrags-Detail-Ansicht | 2-3 Std | Ausstehend |
| Status-Aenderung (Dropdown) | 1-2 Std | Ausstehend |
| Deployment auf Vercel | 30 Min | Ausstehend |

### Phase 3: Erweiterungen (spaeter)

| Aufgabe | Prioritaet |
|---------|------------|
| Kanban-Board Ansicht | Mittel |
| Checklisten-Feature | Mittel |
| Foto-Upload | Mittel |
| Dashboard mit KPIs | Niedrig |
| Benachrichtigungen | Niedrig |
| Mobile-Optimierung | Niedrig |

---

## Kosten-Schaetzung

| Posten | Kosten/Monat |
|--------|--------------|
| Supabase (Pro Plan) | ~25 EUR |
| Vercel (Hobby/Pro) | 0-20 EUR |
| Cloudflare (Free) | 0 EUR |
| **Gesamt** | **~25-45 EUR** |

Kein Airbyte, kein n8n Cloud, keine Extra-Server noetig.

---

## Offene Fragen

1. **Welche Status-Werte genau?** (Liste oben ist Vorschlag)
2. **Wer soll Zugriff haben?** (Andreas, Monteure, Buero?)
3. **Brauchen wir Rollen/Berechtigungen?**
4. **Sollen Positionen live nachladbar sein?** (REST API noetig)
5. **Integration mit Kalender?** (Montagetermine)

---

## Naechste Schritte (Coaching-Session morgen)

1. [ ] Supabase-Projekt erstellen
2. [ ] Tabellen-Schema finalisieren
3. [ ] Sync-Script schreiben
4. [ ] Erster Test-Sync durchfuehren

---

## Changelog

| Datum | Aenderung |
|-------|-----------|
| 2025-12-11 | Initiale Projektplanung erstellt |
