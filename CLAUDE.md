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
| **Umlaute (ä/ö/ü/ß)** | ✅ In UI-Texten (String-Literale fuer Labels, Buttons, Dialoge, Fehlermeldungen) |
| | ❌ In Code-Konstrukten (Variablen, Funktionen, Kommentare, Docstrings) → ae/oe/ue/ss |
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
│   ├── KI_Wissen/          # Woechentlicher KI-News Updater
│   ├── Scanner_Webhook/    # Scanner-Ordner Watcher → Supabase Edge Function
│   └── dokumentenmanagement/ # PDF-Verarbeitung (OCR, Kategorisierung, Extraktion)
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
| `docs/Server_Infrastruktur.md` | Hyper-V Host, VMs, Netzwerk | Manuell bei Infrastruktur-Aenderungen |

**KI_Wissen.md Schreibregeln:**
- Verdichtet & praegnant - Nur Kern-Infos
- Token-effizient - Minimal formulieren
- Use-Cases nennen - "Tool X fuer Y nuetzlich"

---

## SQL Server Kontext

> **Details:** Siehe `docs/ERP_Datenbank.md`

| Aspekt | Wert |
|--------|------|
| **Zugriff** | Python (pyodbc) via `lib/db_connector.py` |

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

## Entwicklungs-Workflow (Pflicht!)

> **WICHTIG:** Diese Regeln IMMER befolgen um Regressionen zu vermeiden!

### Vor JEDER Code-Aenderung

1. **Speicherpunkt erstellen**
   ```bash
   git add . && git commit -m "SAVE: vor [Beschreibung]"
   ```

2. **Verstehen was geaendert wird**
   - Welche Dateien sind betroffen?
   - Was koennte dadurch kaputtgehen?

### Waehrend der Aenderung

3. **Eine Sache auf einmal**
   - NUR das gewuenschte Feature/Fix
   - NICHT "nebenbei" andere Dinge verbessern
   - NICHT refactoren wenn nicht explizit gewuenscht

### Nach JEDER Aenderung

4. **Sofort testen**
   - Programm starten
   - Geaenderte Funktion testen
   - AUCH bestehende Funktionen pruefen (Buttons, Seiten, etc.)

5. **Bei Fehler: Sofort zurueck**
   ```bash
   git checkout .
   ```
   Dann: Neu anfangen mit kleinerem Schritt

6. **Bei Erfolg: Speichern**
   ```bash
   git add . && git commit -m "OK: [Was jetzt funktioniert]"
   ```

### Commit-Nachrichten Schema

| Prefix | Bedeutung | Beispiel |
|--------|-----------|----------|
| `SAVE:` | Speicherpunkt vor Aenderung | `SAVE: vor Button-Fix` |
| `OK:` | Funktionierende Aenderung | `OK: Button funktioniert` |
| `WIP:` | Work in Progress | `WIP: Button teilweise` |

### Projekt mit PLAN.md

Wenn ein Projekt eine `PLAN.md` Datei hat:
1. Bei Session-Start: PLAN.md lesen
2. Naechsten offenen Schritt (⏳) finden
3. NUR diesen Schritt ausfuehren
4. Nach Erfolg: Status auf ✅ setzen
5. Session beenden oder naechsten Schritt

---

## Verwandte Repos

| Repo | Pfad | Inhalt |
|------|------|--------|
| **JS-Prozesse** | `../JS-Prozesse/` | Ideen, Prozess-Analysen, Planung |
| **Auftragsmanagement** | `../Auftragsmanagement/` | Web-App fuer Auftragsverwaltung |
| **erp-system-vite** | `../erp-system-vite/` | ERP Frontend (Vite + React + Supabase) |

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
| JS-FENSTER | Arbeit |
| PC003 | Arbeit |

> Bei Session-Start: `hostname` pruefen → Kontext automatisch setzen

---

## Changelog (Struktur-Aenderungen)

> **WICHTIG:** Bei relevanten Aenderungen an der Repo-Struktur hier dokumentieren!

| Datum | Aenderung | Details |
|-------|-----------|---------|
| 2025-12-12 | Repo-Aufteilung | KI_Automation, JS_Prozesse, Auftragsmanagement getrennt |
| 2025-12-12 | IDEEN verschoben | IDEEN*.* jetzt in `JS_Prozesse/` |
| 2025-12-12 | Hub-Struktur | Alle Repos jetzt unter KI_Automation_Hub/ (work-only: Netzlaufwerk) |
| 2025-12-12 | Analysen verschoben | `*_Analyse.md` jetzt in `JS_Prozesse/analysen/` |
| 2025-12-12 | Projektplan verschoben | Nach `Auftragsmanagement/docs/` |
| 2025-12-12 | ki_wissen_updater.py | IDEEN_FILE Pfad auf JS_Prozesse angepasst |
| 2025-12-13 | Allgemeine Anforderungen | +Name, +Background Tasks |
| 2025-12-13 | Session-Regeln | +Nach Code-Aenderungen, +Nach Session-Ende |
| 2025-12-19 | Server_Infrastruktur.md | Neue Wissensdatenbank fuer Hyper-V, VMs, Netzwerk |
| 2025-12-19 | Rechner-Erkennung | +JS-FENSTER, +PC003 (Arbeit) |
| 2025-12-19 | Struktur bereinigt | SQL-Details nach ERP_Datenbank.md verschoben, Dopplungen entfernt |
| 2025-12-20 | Scanner_Webhook | Von n8n_Installation/ nach tools/ verschoben, n8n_Installation/ geloescht |
| 2025-12-22 | erp-system-vite | Neues Repo: ERP Frontend (Vite + React + Supabase) |
| 2025-12-27 | dokumentenmanagement | Neues Tool: PDF-Verarbeitung via Supabase Edge Function (OCR+GPT-5.2) |
| 2025-12-27 | Scanner_Webhook | Umgestellt von n8n auf Supabase, robustere Task-Konfiguration |
| 2026-01-07 | Entwicklungs-Workflow | Speicherpunkte + PLAN.md Workflow fuer alle Projekte |
| 2026-01-12 | Dokumentenmanagement produktiv | Input-Kanal abgeschlossen: Scanner→Edge Function→Supabase |
| 2026-01-12 | email_integration | Neues Projekt: E-Mail als zweiter Input-Kanal (M365 Graph API) |
| 2026-01-12 | Edge Function v14 | Office-Support: DOCX (JSZip+XML), XLSX (SheetJS), Magic-Byte-Erkennung |

---

## Dokumentenmanagement Edge Function

> **Projekt:** `rsmjgdujlpnydbsfuiek` (Auftragsmanagement)
> **Function:** `process-document` (Version 14)

### Unterstuetzte Dateitypen

| Typ | Methode | Kategorisierung |
|-----|---------|-----------------|
| PDF, PNG, JPG, etc. | Mistral OCR | GPT-5.2 |
| DOCX | JSZip + XML-Parsing | GPT-5.2 |
| XLSX, XLS | SheetJS | GPT-5.2 |
| MP4, MOV, etc. | Nur speichern | "Video" |
| DOC (alt) | Nicht unterstuetzt | "Office_Dokument" |

### Features

- **Duplikat-Erkennung:** SHA-256 Hash (Datei + Text)
- **Magic-Byte-Erkennung:** Erkennt falsch benannte Dateien (z.B. .docx als .pdf)
- **OCR-Fallback:** Bei Mistral-Fehler trotzdem speichern
- **Kategorien:** 18 Dokumenttypen + Video, Audio, Office_Dokument, Archiv

### Offene TODOs

- [ ] DOC (altes Word-Format) Support

<!-- KI-WISSEN-START -->
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** 2026-01-05 17:09
>
> **IMMER einlesen:** `../../docs/KI_Wissen.md`
>
> Enthält aktuelle KI/Automation-News und Tools. Wird wöchentlich automatisch aktualisiert.
<!-- KI-WISSEN-END -->
