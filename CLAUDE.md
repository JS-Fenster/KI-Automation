# Projektanweisungen - JS Fenster & Türen

## Allgemeine Anforderungen an Claude

| Bereich | Anforderung |
|---------|-------------|
| **Sprache** | Deutsch (Konversation), Englisch (Code) |
| **Code-Standard** | Internationaler Standard: ASCII-only in Code, Variablen/Funktionen auf Englisch, Kommentare auf Englisch |
| **Keine Umlaute im Code** | ae/oe/ue/ss statt Umlaute in Strings die ausgegeben werden (Logging, Print, etc.) |
| **Entscheidungen** | Selbststaendig treffen wenn moeglich |
| **Rueckfragen** | Bei Unklarheiten immer nachfragen |
| **Dokumentation** | Dateien synchron halten, Redundanzen vermeiden |
| **Kontext** | Verdichten, kompakt halten - Kontext sparen |
| **Automatisierung** | Tools sollen ohne Zutun des Users laufen |
| **Vorgehen** | Erst Ideen sammeln (Brainstorming), dann implementieren |
| **Session-Ende** | Uebergreifende Praeferenzen, Anweisungen & Arbeitsweisen aus Kontext extrahieren |

---

## Wissensdatenbanken (IMMER einlesen!)

| Datei | Inhalt | Pfad |
|-------|--------|------|
| **ERP_Datenbank.md** | Server, Spalten-Korrekturen, Tunnel, DB-Schema | `docs/` |
| **KI_Wissen.md** | Aktuelle KI/Automation-Tools (woechentlich aktualisiert) | `docs/` |
| **IDEEN.md** | 60 Tool-Ideen (verdichtet) | Root |
| **IDEEN_DETAILS.md** | Technische Details + W4A-Status | Root |
| **IDEEN_UEBERSICHT.html** | Interaktive Uebersicht + Architektur | Root |

### Prozess-Analysen (bei Bedarf einlesen)

| Datei | Prozess | Status |
|-------|---------|--------|
| **Anfrageprozess_Analyse.md** | Eingang → Angebot → Nachverfolgung | ✅ IST dokumentiert |
| **Bestellprozess_Analyse.md** | Auftrag → Bestellung → AB → Wareneingang | ✅ IST dokumentiert |
| **Reparaturprozess_Analyse.md** | Reparatur-Lifecycle + Automatisierung | ✅ IST + SOLL dokumentiert |

> **Hinweis:** Prozess-Analysen werden halbautomatisch erstellt (User erklaert, Claude dokumentiert).
> Naechste Prozesse: Montageprozess (noch nicht dokumentiert)

**KI_Wissen.md Schreibregeln:**
- **Verdichtet & praegnant** - Nur Kern-Infos, keine langen Beschreibungen
- **Token-effizient** - Ganzen Inhalt verstehen, aber minimal formulieren
- **Use-Cases nennen** - Nicht nur "Tool X existiert" sondern "Tool X fuer Y nuetzlich"

## SQL Server Kontext

- **Server:** `192.168.16.202\SQLEXPRESS` (lokal im Buero)
- **Datenbank:** `WorkM001` (ERP-System Work4all)
- **Zugriff:** Python (pyodbc), lesend + schreibend fuer Automatisierungen
- **Remote:** Via Cloudflare Tunnel erreichbar

## Entwicklungsumgebung

| Aspekt | Wert | Hinweis |
|--------|------|---------|
| **OS** | Windows 11 | MINGW64_NT-10.0-22631 |
| **Shell** | Git Bash (MINGW64) | Unix-Syntax: `rm`, `ls`, `cp` (nicht `del`, `dir`, `copy`) |
| **Python** | 3.8.5 (WinPython portable) | `C:\wpy\WPy64-3850\` |
| **pip** | 20.2.2 | Im WinPython enthalten |
| **Node.js** | v24.11.1 | Fuer Web-Tools verfuegbar |
| **Pfade** | Forward-Slashes `/` | Oder escaped Backslashes `\\` |

## Git & GitHub

| Aspekt | Wert |
|--------|------|
| **GitHub Account** | `JS-Fenster` |
| **E-Mail** | `info@js-fenster.de` |
| **Auth** | GitHub CLI (`gh auth status`) |
| **Repo** | `https://github.com/JS-Fenster/Auftragsmanagement.git` |

**CLAUDE: Git-Verbindung selbstaendig herstellen**
- Keine Rueckfrage noetig fuer Git-Credentials (Name/E-Mail bekannt)
- Falls git config fehlt: `git config user.name "JS-Fenster"` + `git config user.email "info@js-fenster.de"`
- Commits/Push nur auf Anfrage des Users

## Wichtige Regeln

1. **Wissensdateien lesen** - Bei Session-Start relevante Dateien einlesen
2. **IDEEN-Dateien synchron** - Bei Aenderungen IMMER alle 3 Dateien pflegen:
   - `IDEEN.md` → Kurzversion (neue Ideen hier)
   - `IDEEN_DETAILS.md` → Technische Details + W4A-Status (Quick-Reference Tabelle)
   - `IDEEN_UEBERSICHT.html` → Karten, Status, Komplexitaet aktualisieren!
     - **AUCH Architektur-Seite pruefen!** Bei Phasen-Aenderungen oder strukturellen Ideen (#58-60 Infrastruktur, #14 Command Center) die Architektur-Uebersicht anpassen
   - **Bei neuen Ideen:** Pruefen ob aehnliche Idee schon existiert → ggf. zusammenfassen statt doppeln
3. **SQL-Schreibzugriff vorsichtig** - Nur INSERT in sichere Tabellen, nie UPDATE/DELETE auf Stammdaten
4. **Artikellisten** - 24 Excel-Dateien in `Z:\Intern\Firmensoftware\Work4all\Artikellisten\`
5. **Wissensdatenbanken pflegen** - DB-Fehler/Erkenntnisse sofort in `docs/ERP_Datenbank.md` dokumentieren (Spalten-Korrekturen + Changelog)
6. **Ideen automatisch erfassen** - Bei Gespraechen proaktiv neue Tool-Ideen erkennen:
   - Erkennt User ein Problem/Wunsch? → Potentielle Idee!
   - Wird ein Workflow/Prozess besprochen der automatisiert werden koennte? → Idee!

   **PFLICHT vor Vorschlag - Duplikat-Pruefung:**
   1. Quick-Reference-Tabelle in IDEEN_DETAILS.md lesen
   2. Keywords der neuen Idee gegen bestehende Titel pruefen
   3. Verwandte Kategorien checken (z.B. "Bestellung" → #55, #56, #57)

   **Vorgehen nach Pruefung:**
   - **Aehnliche Idee gefunden:** "Das koennte eine Erweiterung von #X sein - soll ich dort ergaenzen?"
   - **Keine Ueberschneidung:** "Soll ich das als neue Idee #Y aufnehmen?"
   - Bei Ja: Alle 3 IDEEN-Dateien aktualisieren
   - Naechste freie Nummer verwenden, Phase + Komplexitaet einschaetzen

7. **Prozess-Infos dokumentieren** - Wenn User Ablauf-Details oder Schmerzpunkte erwaehnt:
   - **Kleine Hinweise** (z.B. "Aufmass dauert lange"):
     → Fragen: "Soll ich das bei #X als Schmerzpunkt notieren?"
     → Dokumentieren in IDEEN_DETAILS.md bei der jeweiligen Idee
   - **Groessere Prozess-Erklaerungen**:
     → Fragen: "Soll ich eine Analyse-Datei `docs/[Prozess]_Analyse.md` anlegen?"
     → Enthaelt: IST-Zustand, Schmerzpunkte, Aenderungspotential
   - **Nach Erstellung IMMER:**
     → Prozess-Analysen-Tabelle in CLAUDE.md aktualisieren (Zeile 32-35)
     → Verknuepfte IDEEN mit Prozess-Verweis versehen
   - **Grund:** Claude hat keinen Speicher zwischen Sessions - undokumentierte Infos gehen verloren!

## Automatische Updates

Die KI_Wissen.md wird woechentlich automatisch aktualisiert via:
- Claude Code Hook (bei Session-Start pruefen)
- Windows Task Scheduler (Sonntags 03:00 als Backup)

## Self-Check bei neuer Claude-Version

**Bei Session-Start pruefen:**
1. Lese Header aus `docs/KI_Wissen.md`
2. Vergleiche `Claude-Version` im Header mit aktueller Version
3. Wenn unterschiedlich:
   - Erinnerung: "Neue Claude-Version erkannt! Self-Check faellig - soll ich pruefen welches Wissen ich jetzt aus dem Training kenne?"
4. Nach Bestaetigung:
   - Jeden Eintrag in "Wichtige Releases 2025" gegen Training pruefen
   - Bekanntes loeschen, Unbekanntes behalten
   - Header mit neuer Version + Datum aktualisieren

## Toolbox (Loesungsmuster)

| Problem | Loesung | Beispiel |
|---------|---------|----------|
| Automatisch laufen | Windows Task + Python | ki_wissen_updater.py |
| KI-Entscheidung noetig | Claude API (Haiku) oder Session | Self-Check |
| Daten aggregieren | RSS + Python | News Sammlung |
| Dateien synchron halten | claude_md_helper.py | IDEEN -> CLAUDE.md |
| Daten transformieren | Python Script | XML Transformer |
| Web-Daten holen | RSS, WebFetch, Scraping | Feed Aggregation |

## Projektstruktur

| Ordner | Inhalt |
|--------|--------|
| `lib/` | Shared Infrastruktur (config/, logs/, db_connector.py, logger.py, config_loader.py) |
| `tools/` | Alle Tool-Projekte (KI_Wissen, später Preislisten, etc.) |
| `docs/` | Wissensdatenbanken + Prozess-Analysen |
| `_archive/` | Alte/Referenz-Dateien |

## Dokumentations-Richtlinien

**VOR dem Schreiben pruefen:** Wohin gehoert der neue Inhalt?

### Entscheidungsbaum

```
Neuer Inhalt?
    │
    ├─ Idee/Feature/Wunsch? ──────────► IDEEN.md (kurz) + IDEEN_DETAILS.md (ausfuehrlich)
    │
    ├─ DB-Erkenntnis/SQL-Fehler? ─────► docs/ERP_Datenbank.md (Spalten-Korrekturen)
    │
    ├─ KI/Automation-Tool/News? ──────► docs/KI_Wissen.md (wird auto-aktualisiert)
    │
    ├─ Projekt-Analyse (laenger)? ────► docs/[Projektname]_Analyse.md (NEU)
    │
    ├─ Claude-Anweisung? ─────────────► CLAUDE.md
    │
    └─ Keines davon? ─────────────────► Nachfragen!
```

### Wann neue .md erstellen?

| Situation | Aktion |
|-----------|--------|
| Inhalt passt in bestehende Datei | **Ergaenzen** - keine neue Datei |
| Projekt-spezifische Analyse (>100 Zeilen) | **Neue Datei** in `docs/[Projekt]_Analyse.md` |
| Neues Tool mit eigener Doku | **README.md** im Tool-Ordner (`tools/[tool]/`) |
| Temporaere Notizen | **NICHT** speichern - in Session besprechen |

### Datei-Zwecke (Uebersicht)

| Datei | Zweck | Wann ergaenzen? |
|-------|-------|-----------------|
| `CLAUDE.md` | Projekt-Anweisungen fuer Claude | Neue Regeln, Arbeitsweisen |
| `IDEEN.md` | Ideen-Sammlung (kompakt) | Neue Idee, Status-Update |
| `IDEEN_DETAILS.md` | Technische Details + W4A-Status | Details + Quick-Reference Tabelle |
| `docs/ERP_Datenbank.md` | SQL Server Wissen | DB-Fehler, neue Tabellen, Spalten |
| `docs/KI_Wissen.md` | KI/Automation-Tools | Auto-Update (nicht manuell!) |
| `docs/*_Analyse*.md` | Prozess-Analysen | Nach Prozess-Gespraechen (siehe Regel 7) |

### Grundsaetze

1. **Redundanz vermeiden** - Gleiche Info nur an EINER Stelle
2. **Kompakt halten** - Kontext sparen, verdichten
3. **Querverweise nutzen** - Auf andere Dateien verweisen statt kopieren
4. **Bei Unsicherheit fragen** - Lieber nachfragen als falsch ablegen
5. **Ideen proaktiv erkennen** - Wenn User Problem/Wunsch aeussert → als neue Idee vorschlagen

<!-- KI-WISSEN-START -->
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** 2025-12-11 10:30
>
> **IMMER einlesen:** `Z:/IT-Sammlung/KI_Automation/docs/KI_Wissen.md`
>
> Enthält aktuelle KI/Automation-News und Tools. Wird wöchentlich automatisch aktualisiert.
<!-- KI-WISSEN-END -->