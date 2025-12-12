# KI_Automation - Zentrale Infrastruktur

> **Repo:** `https://github.com/JS-Fenster/KI-Automation.git`
> **Zweck:** Shared Libraries, Tools, Wissensdatenbanken - nutzbar fuer Firma + Privat

---

## Allgemeine Anforderungen an Claude

| Bereich | Anforderung |
|---------|-------------|
| **Sprache** | Deutsch (Konversation), Englisch (Code) |
| **Code-Standard** | ASCII-only in Code, Variablen/Funktionen auf Englisch, Kommentare auf Englisch |
| **Keine Umlaute im Code** | ae/oe/ue/ss statt Umlaute in Strings (Logging, Print, etc.) |
| **Entscheidungen** | Selbststaendig treffen wenn moeglich |
| **Rueckfragen** | Bei Unklarheiten immer nachfragen |
| **Dokumentation** | Dateien synchron halten, Redundanzen vermeiden |
| **Kontext** | Verdichten, kompakt halten - Kontext sparen |

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
2. Grosse Ordner (node_modules): User loescht selbst
3. Kein `rsync` verfuegbar - `cp -r` nutzen

---

## Verwandte Repos

| Repo | Pfad | Inhalt |
|------|------|--------|
| **JS-Prozesse** | `Z:/IT-Sammlung/KI_Automation_Hub/JS_Prozesse/` | Ideen, Prozess-Analysen, Planung |
| **Auftragsmanagement** | `Z:/IT-Sammlung/KI_Automation_Hub/Auftragsmanagement/` | Web-App fuer Auftragsverwaltung |

> **Bei Firma-Projekten:** Auch `JS_Prozesse/CLAUDE.md` einlesen!

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

## Self-Check bei neuer Claude-Version

**Bei Session-Start:**
1. Header aus `docs/KI_Wissen.md` lesen
2. `Claude-Version` mit aktueller vergleichen
3. Wenn unterschiedlich: "Neue Claude-Version! Self-Check faellig?"
4. Bekanntes Wissen aus Liste entfernen, Header aktualisieren

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

<!-- KI-WISSEN-START -->
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** 2025-12-11 10:30
>
> **IMMER einlesen:** `Z:/IT-Sammlung/KI_Automation_Hub/KI_Automation/docs/KI_Wissen.md`
>
> Enthaelt aktuelle KI/Automation-News und Tools. Wird woechentlich automatisch aktualisiert.
<!-- KI-WISSEN-END -->
