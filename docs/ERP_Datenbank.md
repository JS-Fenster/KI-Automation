# ERP Datenbank (WorkM001)

**CLAUDE:** Vor SQL-Queries "Spalten-Korrekturen" pruefen! Bei DB-Fehlern: Tabelle erweitern + Changelog updaten.

**Server:** `192.168.16.202\SQLEXPRESS` | **DB:** `WorkM001` | **Port:** 1433
**Credentials:** `lib/config/credentials.yaml` (SA-User: `<SA_PASSWORD>` - Passwort aus credentials.yaml oder .env)
**Python-Lib:** `lib/db_connector.py` (get_db Context Manager)

---

## Spalten-Korrekturen (WICHTIG!)

| Tabelle | FALSCH | RICHTIG | Hinweis |
|---------|--------|---------|---------|
| `dbo.Artikel` | `Kurzbezeichnung` | `Name` | Artikelbezeichnung |
| `dbo.Artikel` | `VKPreis` | `Nettopreis` | Basis-Verkaufspreis |
| `dbo.Artikel` | `Einheit` | `EinheitCode` | FK zu Einheiten |
| `dbo.Kunden` | `Firma` | `Firma1` | Kundenname (+ Firma2, Firma3) |
| `dbo.Kunden` | `Strasse` | `Straße` | MIT Umlaut! |
| `dbo.Kunden` | `EMail` | `E-Mail` | MIT Bindestrich! |
| `dbo.Lieferanten` | `Firma` | `Firma1` | Lieferantenname |
| `dbo.Bestellung` | `KarteiCode` (Lieferant) | `SDObjMemberCode` | FK zu Lieferanten! |
| `dbo.RA` | `FaelligDatum` | `FälligDatum` | MIT Umlaut! |
| `dbo.Rechnung` | `Storno` | - | EXISTIERT NICHT |
| `dbo.Rechnung` | `Summe` | - | EXISTIERT NICHT (ueber RA.RBetrag) |
| - | `ArtikelGruppen` | `ArtikelGr` | Tabellenname |

---

## Datenmodell: Auftraege & Dokumente

### WICHTIG: Was ist ein "Auftrag"?

**Ein Auftrag ist ein Angebot mit gesetztem `AuftragsDatum`!**

```
dbo.Angebot
├── Nummer = 250372        <- Angebotsnummer
├── Datum = 11.06.2025     <- Angebotsdatum
├── AuftragsDatum = NULL   <- KEIN Auftrag (nur Angebot)
└── AuftragsNummer = NULL

        ↓ Kunde erteilt Auftrag ↓

dbo.Angebot
├── Nummer = 250372        <- Angebotsnummer (bleibt)
├── Datum = 11.06.2025     <- Angebotsdatum (bleibt)
├── AuftragsDatum = 16.06.2025  <- JETZT IST ES EIN AUFTRAG!
└── AuftragsNummer = 250210     <- Eigene Auftragsnummer
```

**Statistik (Stand Dez 2025):**
- Total Angebote: ~4.700
- Davon zu Auftraegen geworden: ~1.430 (30%)
- Feld `Auftragsbestätigung`: Wird nicht genutzt (immer 0)

**HINWEIS:** `dbo.Auftrag` Tabelle ist LEER! Nicht verwenden!

### Haupt-Entitaeten

| Tabelle | Inhalt | Anzahl | Hinweis |
|---------|--------|--------|---------|
| `dbo.Projekte` | **Bauvorhaben/Auftraege** | ~2.500 | Zentrale Verknuepfung! |
| `dbo.Angebot` | Angebote + Auftraege | ~4.700 | Auftrag wenn AuftragsDatum gesetzt |
| `dbo.Bestellung` | Bestellungen an Lieferanten | ~3.800 | |
| `dbo.Rechnung` | Ausgangsrechnungen | ~3.000 | |
| `dbo.Lieferschein` | Lieferscheine | ~550 | |
| `dbo.Positionen` | **Alle Positionen aller Dokumente** | ~120.000 | Via BZObjType zugeordnet |
| `dbo.RA` | Rechnungs-Ausgleich (Zahlungsstatus) | ~3.000 | |
| `dbo.Kunden` | Kundenstamm | - | |
| `dbo.Lieferanten` | Lieferantenstamm | - | |

### Verknuepfungen

```
Kunden.Code ─────────────► Projekte.KundenCode
                                  │
Projekte.Code ──────┬─────────────┼──► Angebot.ProjektCode
                    │             │         │
                    │             │         └─► (AuftragsDatum gesetzt = AUFTRAG)
                    │             │
                    ├─────────────┼──► Bestellung.ProjektCode
                    │             │         │
                    │             │         └─► Lieferanten.Code = Bestellung.SDObjMemberCode
                    │             │
                    ├─────────────┼──► Rechnung.ProjektCode
                    │             │         │
                    │             │         └─► RA.RCode (Zahlungsstatus)
                    │             │
                    └─────────────┴──► Lieferschein.ProjektCode

Dokument.Code ───────────► Positionen.BZObjMemberCode + BZObjType
```

### BZObjType (Positions-Zuordnung)

| BZObjType | Dokument-Typ | Positionen |
|-----------|--------------|------------|
| 6 | Angebot | ~66.000 |
| 7 | Rechnung | ~26.000 |
| 8 | Lieferschein | ~6.000 |
| 9 | Bestellung | ~18.000 |
| 10 | Eingangslieferschein | ~3.000 |

### Wichtige Spalten

**dbo.Projekte:**
- `Code` (PK), `Nummer` (P250593), `Name`, `KundenCode`, `Datum`
- `ProjektStatus` (grosse Zahlen, nicht 1-10!), `Notiz` (Kuerzel)

**dbo.Angebot:**
- `Code` (PK), `Nummer`, `Datum`, `ProjektCode`, `Wert`
- `AuftragsDatum` (gesetzt = ist Auftrag!), `AuftragsNummer`
- `Auftragsbestätigung` (immer 0, nicht genutzt)

**dbo.Rechnung:**
- `Code` (PK), `Nummer`, `Datum`, `ProjektCode`
- `Wert` (netto), `Bruttowert`, `Zahlbarbis`, `Zahlungsfrist`

**dbo.Bestellung:**
- `Code` (PK), `Nummer`, `Datum`, `ProjektCode`, `Wert`
- `SDObjMemberCode` (FK zu Lieferanten.Code!)

**dbo.Positionen:**
- `Code` (PK), `BZObjType`, `BZObjMemberCode` (FK zum Dokument)
- `PozNr`, `Bezeichnung`, `Anzahl`, `EinzPreis`, `GesPreis`

**dbo.RA (Zahlungsstatus):**
- `Code` (PK), `RCode` (FK zu Rechnung.Code), `RNummer`
- `RBetrag`, `BezSumme`, `Mahnstuffe`, `FälligDatum`

**dbo.Kunden:**
- `Code` (PK), `Firma1`, `Firma2`, `Name`, `Straße`, `Plz`, `Ort`
- `Telefon`, `E-Mail`

**dbo.Lieferanten:**
- `Code` (PK), `Firma1`, `Firma2`, `Name`

### Notiz-Kuerzel (Projekt-Klassifizierung)

| Kuerzel | Bedeutung |
|---------|-----------|
| DKF | Dreh-Kipp-Fenster |
| REP | Reparatur |
| EA | Einzelauftrag |
| HT | Haustuer |
| RAFF | Raffstore |
| ISS | Insektenschutz |

### Timestamp-Spalten (fuer Delta-Sync)

**Wichtig:** Diese Spalten ermoeglichen inkrementelle Synchronisation (nur geaenderte Daten uebertragen).

| Spalte | Tabellen | Zweck |
|--------|----------|-------|
| **`UpdateTime`** | Angebot, Bestellung, Kunden, Projekte, Rechnung | Letzte Aenderung |
| **`InsertTime`** | Alle Haupttabellen | Erstellungszeitpunkt |
| **`LastModificationDate`** | Kunden, Projekte | Alternative zu UpdateTime |
| **`EditDate`** | Angebot, Bestellung, Rechnung | Bearbeitungsdatum |

**Delta-Sync Query-Beispiel:**
```sql
-- Nur Angebote die seit letztem Sync geaendert wurden
SELECT * FROM Angebot WHERE UpdateTime > @LetzterSync

-- Nur neue Projekte seit letztem Sync
SELECT * FROM Projekte WHERE InsertTime > @LetzterSync
```

---

## Beispiel-Queries

```sql
-- Alle AUFTRAEGE (nicht nur Angebote!) eines Projekts
SELECT a.AuftragsNummer, a.AuftragsDatum, a.Wert, p.Nummer as ProjektNr
FROM dbo.Angebot a
JOIN dbo.Projekte p ON a.ProjektCode = p.Code
WHERE a.AuftragsDatum IS NOT NULL
ORDER BY a.AuftragsDatum DESC

-- Rechnungen zu einem Projekt mit Zahlungsstatus
SELECT r.Nummer, r.Datum, r.Wert, ra.BezSumme, ra.Mahnstuffe
FROM dbo.Rechnung r
LEFT JOIN dbo.RA ra ON ra.RCode = r.Code
WHERE r.ProjektCode = [Projekte.Code]

-- Bestellungen mit Lieferanten
SELECT b.Nummer, b.Datum, b.Wert, l.Firma1 as Lieferant
FROM dbo.Bestellung b
LEFT JOIN dbo.Lieferanten l ON b.SDObjMemberCode = l.Code
WHERE b.ProjektCode = [Projekte.Code]

-- Positionen einer Rechnung (BZObjType = 7)
SELECT PozNr, Bezeichnung, Anzahl, EinzPreis, GesPreis
FROM dbo.Positionen
WHERE BZObjMemberCode = [Rechnung.Code] AND BZObjType = 7
ORDER BY PozNr

-- Kunde mit korrekten Spaltennamen
SELECT Code, Firma1, Name, Straße, Plz, Ort, Telefon, [E-Mail]
FROM dbo.Kunden
WHERE Code = [KundenCode]

-- Alle Tabellen auflisten
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME
```

---

## Preisgruppen

| Code | Name | Hinweis |
|------|------|---------|
| 0 | Neukunde | Nutzt Artikel.Nettopreis |
| 1 | Bestandskunde | Nutzt Artikel.Nettopreis |
| 2 | Grosskunde | Nutzt Artikel.Nettopreis |
| 4 | Wiederverkaeufer | **NUR DIESE hat Eintraege in dbo.Preise!** |

---

## Service-Artikel (99-*)

| Artikel-Nr | Bezeichnung | Preis (WVK) |
|------------|-------------|-------------|
| 99-000001 bis 99-000020 | Anfahrt Zone 01-20 | 13,44 - 268,90 EUR |
| 99-000023 | Reparatur (Stunde) | 50,42 EUR/h |
| 99-000033 | Autokran (Stunde) | 350 EUR/h |
| 99-000040 | Minikran (Stunde) | 480 EUR/h |

---

## Dateiablage (Server-Struktur)

| Ordner | Inhalt |
|--------|--------|
| `D:\work4all\Work4all\T001` | Ticket-Anhaenge |
| `D:\work4all\Work4all\Mail001` | Mail-Anhaenge |
| `D:\work4all\Work4all\Export\Datev\Datev XML online` | Eingangs-/Ausgangsrechnungen (PDF) |
| `D:\work4all\Work4all\ERPAnhänge\M001` | ERP-Dokumente (Angebote, Bestellungen, etc.) |
| `D:\work4all\Work4all\CRMAttachements\M001` | CRM-Anhaenge (TODO: genauer pruefen) |
| `D:\work4all\Work4all\B001` | Sonstige Dokumente (Bilder, Montagescheine, etc.) |

---

## Remote-Zugriff: Cloudflare Tunnel

**Status:** AKTIV | **Domain:** `js-fenster-intern.org` | **Getestet:** 2025-12-29

### Zugaenge

| Dienst | Server | Hostname | Lokaler Port |
|--------|--------|----------|--------------|
| RDP | AppServer (202) | `rdp.js-fenster-intern.org` | 3389 |
| RDP | DC (201) | `dc-rdp.js-fenster-intern.org` | 3390 |
| SQL | AppServer (202) | `sql.js-fenster-intern.org` | 1433 |

### Client-Verbindung

```bash
# 1. cloudflared installieren (einmalig)
winget install Cloudflare.cloudflared  # Windows
brew install cloudflared                # macOS

# 2. Tunnel starten
cloudflared access tcp --hostname sql.js-fenster-intern.org --url localhost:1433

# 3. Mit localhost:1433 verbinden (NICHT 192.168.16.202!)
```

### Python ueber Tunnel

```python
import pymssql
import os

# Bei Tunnel-Verbindung: localhost statt 192.168.16.202!
# Passwort aus Environment-Variable oder credentials.yaml laden
conn = pymssql.connect(
    server='localhost',
    user='sa',
    password=os.getenv('SA_PASSWORD'),  # NICHT hardcoden!
    database='WorkM001'
)
```

### Tunnel-Konfiguration

| Info | Wert |
|------|------|
| Tunnel-Name | `js-fenster-server` |
| Connector-ID | `6a2282b1-c557-493c-85e9-d863563d018f` |
| cloudflared Version | 2025.11.1 |
| Installiert auf | SQL Server als Windows Service |
| Cloudflare Account | info@js-fenster.de |

### Troubleshooting

| Problem | Loesung |
|---------|---------|
| Verbindung fehlschlaegt | Cloudflare Dashboard: Tunnel Status = "Connected"? |
| SQL-Auth fehlschlaegt | Bei Tunnel `localhost` verwenden! |
| cloudflared nicht erkannt | Terminal neu oeffnen nach Installation |

---

## Changelog

| Datum | Aenderung |
|-------|-----------|
| 2025-12-29 | DC-RDP Tunnel hinzugefuegt (dc-rdp.js-fenster-intern.org:3390) |
| 2025-12-12 | **NEU:** Timestamp-Spalten dokumentiert (UpdateTime, InsertTime, etc.) - ermoeglicht Delta-Sync |
| 2025-12-11 | **KORRIGIERT:** Auftrag = Angebot mit AuftragsDatum, Bestellung→Lieferant via SDObjMemberCode, Kunden-Spalten korrigiert |
| 2025-12-11 | **GEKUERZT:** Auto-generiertes 18k-Zeilen-Schema entfernt, nur relevante Infos behalten |
| 2025-12-10 | Verdichtet zu ERP_Datenbank.md, Spalten-Korrekturen |
| 2025-12-08 | Cloudflare Tunnel eingerichtet, Remote-Test erfolgreich |
| 2025-12-05 | Initial |

---

## Vollstaendiges Tabellen-Schema

Das vollstaendige Schema aller 433 Tabellen wurde entfernt um die Datei kompakt zu halten.

**Bei Bedarf Schema abfragen:**
```sql
-- Alle Tabellen
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'

-- Spalten einer Tabelle
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Artikel'
```
