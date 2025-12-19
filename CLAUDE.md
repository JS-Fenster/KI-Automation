# KI_Automation - Zentrale Infrastruktur

> **Repo:** `https://github.com/JS-Fenster/KI-Automation.git`
> **Zweck:** Shared Libraries, Tools, Wissensdatenbanken - nutzbar fuer Firma + Privat

---

## Allgemeine Anforderungen an Claude

| Bereich | Anforderung |
|---------|-------------|
| **Name** | Andreas Stolarczyk |
| **Ansprache** | Mit Vornamen (Andreas) |
| **Sprache** | Deutsch (Konversation), Englisch (Code) |
| **Code-Standard** | ASCII-only in Code, Variablen/Funktionen auf Englisch, Kommentare auf Englisch |
| **Umlaute (ä/ö/ü/ß)** | ✅ In sichtbaren UI-Texten (Labels, Buttons, Dialoge) |
| | ❌ Im Code (Variablen, Funktionen, Kommentare, Docstrings, Logging) → ae/oe/ue/ss |
| **Entscheidungen** | Selbststaendig treffen wenn moeglich |
| **Rueckfragen** | Bei Unklarheiten immer nachfragen |
| **Dokumentation** | Dateien synchron halten, Redundanzen vermeiden |
| **Kontext** | Verdichten, kompakt halten - Kontext sparen |
| **Background Tasks** | Minimal halten, sofort killen wenn fertig |

---

## Projektstruktur

```
KI_Automation/
├── lib/                    # Shared Infrastruktur
│   ├── config/             # YAML-Configs (credentials, database, paths)
│   ├── logs/               # Log-Dateien
│   ├── db_connector.py     # SQL Server Verbindung
│   ├── logger.py           # Logging-Utilities
│   ├── config_loader.py    # Config-Management
│   └── claude_md_helper.py # CLAUDE.md Sync-Funktionen
├── tools/                  # Alle Tool-Projekte
│   └── KI_Wissen/          # Woechentlicher KI-News Updater
├── docs/                   # Wissensdatenbanken
│   ├── ERP_Datenbank.md    # SQL Server Schema + Spalten-Korrekturen
│   └── KI_Wissen.md        # Aktuelle KI/Automation-Tools (auto-updated)
└── CLAUDE.md               # Diese Datei
```

---

## Wissensdatenbanken

| Datei | Inhalt | Update |
|-------|--------|--------|
| `docs/ERP_Datenbank.md` | SQL Server Schema, Spalten-Korrekturen, Tunnel | Manuell bei DB-Erkenntnissen |
| `docs/KI_Wissen.md` | KI/Automation-News und Tools | Automatisch woechentlich |

**KI_Wissen.md Schreibregeln:**
- Verdichtet & praegnant - Nur Kern-Infos
- Token-effizient - Minimal formulieren
- Use-Cases nennen - "Tool X fuer Y nuetzlich"

---

## SQL Server Kontext

| Aspekt | Wert |
|--------|------|
| **Server** | `192.168.16.202\SQLEXPRESS` |
| **Datenbank** | `WorkM001` (ERP Work4all) |
| **Zugriff** | Python (pyodbc) via `lib/db_connector.py` |
| **Remote** | Via Cloudflare Tunnel erreichbar |

**Regeln:**
- SELECT immer erlaubt
- INSERT nur in sichere Tabellen
- Nie UPDATE/DELETE auf Stammdaten ohne Rueckfrage

---

## Entwicklungsumgebung

| Aspekt | Wert |
|--------|------|
| **OS** | Windows 11 |
| **Shell** | Git Bash (MINGW64) - Unix-Syntax: `rm`, `ls`, `cp` |
| **Python** | 3.8.5 (WinPython) - `C:\wpy\WPy64-3850\` |
| **Node.js** | v24.11.1 |
| **Pfade** | Forward-Slashes `/` oder escaped `\\` |

---

## Git & GitHub

| Aspekt | Wert |
|--------|------|
| **Account** | `JS-Fenster` |
| **E-Mail** | `info@js-fenster.de` |
| **Auth** | GitHub CLI (`gh auth status`) |

**Git-Config bei Bedarf selbstaendig setzen:**
```bash
git config user.name "JS-Fenster"
git config user.email "info@js-fenster.de"
```

**Git-Workflow (Fehler vermeiden):**
1. Vor Push: `git pull --rebase` (verhindert reject)
2. Kein `rsync` verfuegbar - `cp -r` nutzen

---

## Verwandte Repos

| Repo | Pfad | Inhalt |
|------|------|--------|
| **JS-Prozesse** | `../JS-Prozesse/` | Ideen, Prozess-Analysen, Planung |
| **Auftragsmanagement** | `../Auftragsmanagement/` | Web-App fuer Auftragsverwaltung |

> **Bei Firma-Projekten:** Auch `../JS-Prozesse/CLAUDE.md` einlesen!
> **Neue Ideen (Arbeit):** `../JS-Prozesse/IDEEN.md`

---

## Automatische Updates

Die `docs/KI_Wissen.md` wird woechentlich aktualisiert via:
- Windows Task Scheduler (Sonntags 03:00)
- Manuell: `python tools/KI_Wissen/ki_wissen_updater.py --force`

---

## Toolbox (Loesungsmuster)

| Problem | Loesung | Beispiel |
|---------|---------|----------|
| Automatisch laufen | Windows Task + Python | ki_wissen_updater.py |
| Daten aggregieren | RSS + Python | News Sammlung |
| Dateien synchron | claude_md_helper.py | Section-Updates |
| DB-Zugriff | lib/db_connector.py | SQL Queries |

---

## Session-Start Checkliste

**Bei jeder neuen Session:**
1. Git-Status pruefen (Claude_Start.bat pullt automatisch)
2. Bei Konflikten/Fehlern: User informieren
3. Ordner im Hub gegen "Verwandte Repos" pruefen
4. Unbekanntes Repo gefunden? → User fragen, dann Tabelle + Changelog aktualisieren

**Self-Check (neue Claude-Version):**
1. Header aus `docs/KI_Wissen.md` lesen
2. `Claude-Version` vergleichen
3. Wenn unterschiedlich: Bekanntes entfernen, Header aktualisieren

---

## Nach Code-Aenderungen

- Programm starten + Testanleitung liefern

---

## Nach Session-Ende

1. Chat aktiv durchgehen und analysieren
2. Pruefen: Was wurde gesagt vs. was steht schon in CLAUDE.md?
3. Falls etwas fehlt → vorschlagen/eintragen
4. Explizit bestaetigen: "Chat analysiert, [Ergebnis]"

---

## Multi-Rechner Setup

> **WICHTIG:** Der Hub-Ordner (`KI_Automation_Hub/`) ist KEIN Git-Repo!
> Alle geteilten Infos muessen in einem der Sub-Repos liegen.
> `KI_Automation/CLAUDE.md` = Zentrale Basis (wird geshared)
> Dateien ausserhalb der Git-Repos existieren nur lokal auf dem jeweiligen Rechner.

---

## Rechner-Erkennung

| Computername | Kontext |
|--------------|---------|
| LAPTOP_STOLIS1 | Privat |
<!-- TODO: Arbeitsrechner-Namen eintragen, dann diese Zeile + ??? loeschen -->
| ??? | Arbeit |

> Bei Session-Start: `hostname` pruefen → Kontext automatisch setzen

---

## Changelog (Struktur-Aenderungen)

> **WICHTIG:** Bei relevanten Aenderungen an der Repo-Struktur hier dokumentieren!

| Datum | Aenderung | Details |
|-------|-----------|---------|
| 2025-12-12 | Repo-Aufteilung | KI_Automation, JS_Prozesse, Auftragsmanagement getrennt |
| 2025-12-12 | IDEEN verschoben | IDEEN*.* jetzt in `JS_Prozesse/` |
| 2025-12-12 | Hub-Struktur | Alle Repos jetzt unter `Z:/IT-Sammlung/KI_Automation_Hub/` |
| 2025-12-12 | Analysen verschoben | `*_Analyse.md` jetzt in `JS_Prozesse/analysen/` |
| 2025-12-12 | Projektplan verschoben | Nach `Auftragsmanagement/docs/` |
| 2025-12-12 | ki_wissen_updater.py | IDEEN_FILE Pfad auf JS_Prozesse angepasst |
| 2025-12-13 | Allgemeine Anforderungen | +Name, +Background Tasks |
| 2025-12-13 | Session-Regeln | +Nach Code-Aenderungen, +Nach Session-Ende |

<!-- KI-WISSEN-START -->
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** 2025-12-19 02:02
>
> **IMMER einlesen:** `../../docs/KI_Wissen.md`
>
> Enthält aktuelle KI/Automation-News und Tools. Wird wöchentlich automatisch aktualisiert.
<!-- KI-WISSEN-END -->
